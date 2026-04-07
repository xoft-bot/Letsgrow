const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

const DAY = 86400000;
const GRACE_PERIOD = 7 * DAY;
const PENALTY_RATE = 0.03;

// ── EMAIL SETUP ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_EMAIL,
      to, subject, html,
    });
  } catch (e) {
    console.error("Email error:", e.message);
  }
}

// ── HELPERS ──────────────────────────────────────────────────
async function getMember(memberId) {
  const snap = await db.collection("members").doc(memberId).get();
  if (!snap.exists) throw new Error("Member not found");
  return { id: snap.id, ...snap.data() };
}

function getCycleMultiplier(cycle) {
  if (cycle <= 1) return 0.5;
  if (cycle === 2) return 0.7;
  if (cycle === 3) return 0.9;
  return 1.0;
}

function buildSchedule(amount, duration, rate, now) {
  if (duration === 30) {
    return [{
      installment: 1,
      dueDate: now + 30 * DAY,
      amount: parseFloat((amount * (1 + rate)).toFixed(2)),
      paid: false, paidDate: null, penalty: 0, wasLate: false,
    }];
  }
  const half = amount / 2;
  return [
    {
      installment: 1,
      dueDate: now + 30 * DAY,
      amount: parseFloat((half * (1 + rate)).toFixed(2)),
      paid: false, paidDate: null, penalty: 0, wasLate: false,
    },
    {
      installment: 2,
      dueDate: now + 60 * DAY,
      amount: parseFloat((half * (1 + rate)).toFixed(2)),
      paid: false, paidDate: null, penalty: 0, wasLate: false,
    },
  ];
}

// ── CREATE LOAN ──────────────────────────────────────────────
exports.createLoan = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("POST only");

    const { memberId, amount, duration } = req.body;
    if (!memberId || !amount || !duration)
      return res.status(400).send("Missing: memberId, amount, duration");
    if (![30, 60].includes(Number(duration)))
      return res.status(400).send("Duration must be 30 or 60");

    const member = await getMember(memberId);

    if (!member.isActive)
      return res.status(400).send("Member not active");
    if (!member.contributionsUpToDate)
      return res.status(400).send("Contributions not up to date");
    if (member.isFrozen)
      return res.status(400).send("Member is frozen from borrowing");

    const activeSnap = await db.collection("loans")
      .where("memberId", "==", memberId)
      .where("status", "==", "active").get();
    let outstanding = 0;
    activeSnap.forEach(d =>
      d.data().schedule.forEach(i => { if (!i.paid) outstanding += i.amount; })
    );
    if (member.savings <= outstanding)
      return res.status(400).send("Savings must exceed outstanding balance");

    const cycle = member.loanCycle || 1;
    const maxLoan = member.savings * 0.25 * getCycleMultiplier(cycle);
    if (amount > maxLoan)
      return res.status(400).send(
        `Exceeds limit. Max for cycle ${cycle}: UGX ${maxLoan.toFixed(2)}`
      );

    const fundsSnap = await db.collection("club").doc("funds").get();
    const funds = fundsSnap.exists ? fundsSnap.data() : { liquidFunds: 0, loanPool: 0 };
    const poolCap = funds.liquidFunds * 0.30;
    if ((funds.loanPool || 0) + amount > poolCap)
      return res.status(400).send("Club loan pool cap reached");

    const rate = duration === 30 ? 0.07 : 0.05;
    const now = Date.now();
    const schedule = buildSchedule(amount, Number(duration), rate, now);

    const loanRef = await db.collection("loans").add({
      memberId,
      memberEmail: member.email || "",
      memberName: member.name || "",
      amount,
      duration: Number(duration),
      interestRate: rate,
      cycle,
      schedule,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("club").doc("funds").update({
      loanPool: admin.firestore.FieldValue.increment(amount),
    });

    await sendEmail(
      member.email,
      "Loan Approved — Let's Grow Investment Club",
      `<p>Dear ${member.name},</p>
       <p>Your loan of <strong>UGX ${Number(amount).toLocaleString()}</strong> 
       (${duration} days at ${(rate * 100).toFixed(0)}%) has been approved.</p>
       <ul>${schedule.map(s =>
         `<li>Instalment ${s.installment}: UGX ${s.amount.toLocaleString()} 
         due ${new Date(s.dueDate).toDateString()}</li>`
       ).join("")}</ul>
       <p>Regards,<br/>Let's Grow Investment Club</p>`
    );

    res.send({ success: true, loanId: loanRef.id, schedule });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// ── RECORD REPAYMENT ─────────────────────────────────────────
exports.recordRepayment = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("POST only");

    const { loanId, installmentIndex, amountPaid } = req.body;
    if (!loanId || installmentIndex === undefined || !amountPaid)
      return res.status(400).send("Missing: loanId, installmentIndex, amountPaid");

    const loanRef = db.collection("loans").doc(loanId);
    const loanSnap = await loanRef.get();
    if (!loanSnap.exists) return res.status(404).send("Loan not found");

    const loan = loanSnap.data();
    const schedule = [...loan.schedule];
    const inst = schedule[Number(installmentIndex)];

    if (!inst) return res.status(400).send("Invalid installment index");
    if (inst.paid) return res.status(400).send("Already paid");

    const now = Date.now();
    let penalty = 0;
    if (now > inst.dueDate + GRACE_PERIOD) {
      const overdueMonths = (now - inst.dueDate) / (30 * DAY);
      penalty = parseFloat((inst.amount * PENALTY_RATE * overdueMonths).toFixed(2));
    }

    const totalDue = inst.amount + penalty;
    if (amountPaid < totalDue)
      return res.status(400).send(
        `Insufficient. Total due: ${totalDue} (penalty: ${penalty})`
      );

    const wasLate = now > inst.dueDate + GRACE_PERIOD;
    schedule[Number(installmentIndex)] = {
      ...inst, paid: true, paidDate: now, penalty, wasLate,
    };

    const allPaid = schedule.every(s => s.paid);
    const anyLate = schedule.some(s => s.wasLate);
    const updates = { schedule };

    if (allPaid) {
      updates.status = "closed";
      updates.closedAt = admin.firestore.FieldValue.serverTimestamp();

      const memberRef = db.collection("members").doc(loan.memberId);
      const memberSnap = await memberRef.get();
      const m = memberSnap.data();

      let loanCycle = m.loanCycle || 1;
      let consecutiveDefaults = m.consecutiveDefaults || 0;
      let isFrozen = m.isFrozen || false;
      let frozenUntilCycle = m.frozenUntilCycle || 0;

      if (!anyLate) {
        loanCycle = Math.min(loanCycle + 1, 4);
        consecutiveDefaults = 0;
      } else {
        consecutiveDefaults += 1;
        if (consecutiveDefaults >= 2) {
          isFrozen = true;
          frozenUntilCycle = loanCycle + 2;
        }
      }

      if (isFrozen && loanCycle >= frozenUntilCycle) {
        isFrozen = false;
        consecutiveDefaults = 0;
      }

      await memberRef.update({ loanCycle, consecutiveDefaults, isFrozen, frozenUntilCycle });
    }

    await loanRef.update(updates);
    await db.collection("repayments").add({
      loanId,
      memberId: loan.memberId,
      installmentIndex: Number(installmentIndex),
      amountPaid, penalty,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.send({ success: true, penalty, totalPaid: totalDue, loanClosed: allPaid });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// ── PAR (Portfolio at Risk) ──────────────────────────────────
exports.getPAR = functions.https.onRequest(async (req, res) => {
  try {
    const snap = await db.collection("loans").where("status", "==", "active").get();
    const now = Date.now();

    let totalOutstanding = 0, overdue1to30 = 0, overdueOver30 = 0;

    snap.forEach(doc => {
      doc.data().schedule.forEach(inst => {
        if (!inst.paid) {
          totalOutstanding += inst.amount;
          const daysOverdue = (now - inst.dueDate) / DAY;
          if (daysOverdue > 0 && daysOverdue <= 30) overdue1to30 += inst.amount;
          if (daysOverdue > 30) overdueOver30 += inst.amount;
        }
      });
    });

    const base = totalOutstanding === 0 ? 0 : totalOutstanding;
    const result = {
      totalOutstanding,
      overdue1to30,
      overdueOver30,
      par1to30: parseFloat(((overdue1to30 / base) * 100 || 0).toFixed(2)),
      parOver30: parseFloat(((overdueOver30 / base) * 100 || 0).toFixed(2)),
      totalPAR: parseFloat((((overdue1to30 + overdueOver30) / base) * 100 || 0).toFixed(2)),
    };

    await db.collection("par_snapshots").add({
      ...result,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── ADMIN DASHBOARD ──────────────────────────────────────────
exports.getAdminDashboard = functions.https.onRequest(async (req, res) => {
  try {
    const [loansSnap, fundsSnap] = await Promise.all([
      db.collection("loans").where("status", "==", "active").get(),
      db.collection("club").doc("funds").get(),
    ]);

    const funds = fundsSnap.exists ? fundsSnap.data() : { liquidFunds: 0, loanPool: 0 };
    const now = Date.now();
    let totalOutstanding = 0, totalOverdue = 0,
        overdue1to30 = 0, overdueOver30 = 0;

    loansSnap.forEach(doc => {
      doc.data().schedule.forEach(inst => {
        if (!inst.paid) {
          totalOutstanding += inst.amount;
          const d = (now - inst.dueDate) / DAY;
          if (d > 0) {
            totalOverdue += inst.amount;
            if (d <= 30) overdue1to30 += inst.amount;
            else overdueOver30 += inst.amount;
          }
        }
      });
    });

    const poolCap = funds.liquidFunds * 0.30;
    const b = totalOutstanding || 1;

    res.send({
      totalLoanPool: poolCap,
      activeLoans: loansSnap.size,
      currentLoanPoolUsed: funds.loanPool || 0,
      totalOutstanding,
      totalOverdue,
      par: parseFloat(((totalOverdue / b) * 100).toFixed(2)),
      par1to30: parseFloat(((overdue1to30 / b) * 100).toFixed(2)),
      parOver30: parseFloat(((overdueOver30 / b) * 100).toFixed(2)),
      loanUtilization: parseFloat(poolCap ? ((funds.loanPool / poolCap) * 100).toFixed(2) : 0),
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── MEMBER PROFILE ───────────────────────────────────────────
exports.getMemberProfile = functions.https.onRequest(async (req, res) => {
  try {
    const { memberId } = req.query;
    if (!memberId) return res.status(400).send("Missing memberId");

    const member = await getMember(memberId);
    const loansSnap = await db.collection("loans")
      .where("memberId", "==", memberId).get();

    const loans = [];
    loansSnap.forEach(d => loans.push({ id: d.id, ...d.data() }));

    res.send({
      memberId,
      name: member.name,
      savings: member.savings,
      loanCycle: member.loanCycle || 1,
      isFrozen: member.isFrozen || false,
      consecutiveDefaults: member.consecutiveDefaults || 0,
      contributionsUpToDate: member.contributionsUpToDate,
      loans,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── SCHEDULED REMINDERS (runs daily) ────────────────────────
exports.sendLoanReminders = functions.pubsub
  .schedule("every 24 hours").onRun(async () => {
    const now = Date.now();
    const snap = await db.collection("loans")
      .where("status", "==", "active").get();

    for (const doc of snap.docs) {
      const loan = doc.data();
      if (!loan.memberEmail) continue;

      for (const inst of loan.schedule) {
        if (inst.paid) continue;

        const daysUntil = (inst.dueDate - now) / DAY;
        const daysOver = (now - inst.dueDate) / DAY;
        const halfPoint = loan.duration / 2;

        let subject = null, body = null;

        if (daysUntil <= 7 && daysUntil > 1) {
          subject = "⏰ Repayment Reminder — 7 Days";
          body = `Instalment ${inst.installment} of UGX ${inst.amount.toLocaleString()} 
                  is due on ${new Date(inst.dueDate).toDateString()}.`;
        } else if (Math.round(daysUntil) === Math.round(halfPoint)) {
          subject = "📅 Mid-Cycle Reminder";
          body = `You are halfway through your loan. 
                  Instalment ${inst.installment} of UGX ${inst.amount.toLocaleString()} 
                  is due ${new Date(inst.dueDate).toDateString()}.`;
        } else if (daysUntil <= 1 && daysUntil >= 0) {
          subject = "🚨 Loan Payment Due Today";
          body = `Your instalment of UGX ${inst.amount.toLocaleString()} is due TODAY.`;
        } else if (daysOver > 7) {
          const pen = (inst.amount * PENALTY_RATE * (daysOver / 30)).toFixed(2);
          subject = "⚠️ Overdue Notice — Penalty Applied";
          body = `Instalment ${inst.installment} is overdue. 
                  Penalty so far: UGX ${Number(pen).toLocaleString()}. 
                  Total now due: UGX ${(inst.amount + Number(pen)).toLocaleString()}.`;
        }

        if (subject) {
          await sendEmail(
            loan.memberEmail, subject,
            `<p>Dear ${loan.memberName || "Member"},</p>
             <p>${body}</p>
             <p>Outstanding balance: UGX ${inst.amount.toLocaleString()}</p>
             <p>Regards,<br/>Let's Grow Investment Club</p>`
          );
        }
      }
    }
    return null;
  });

