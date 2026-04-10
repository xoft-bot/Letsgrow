const functions = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

const DAY = 86400000;
const GRACE_PERIOD = 7 * DAY;
const PENALTY_RATE = 0.03; // 3% per month on overdue instalment only

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
    await transporter.sendMail({ from: process.env.GMAIL_EMAIL, to, subject, html });
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

// Cycle limits per spec:
// Cycle 1 → 60% of max loan
// Cycle 2 → 80% of max loan
// Cycle 3+ → 100% of max loan
function getCycleMultiplier(cycle) {
  if (cycle <= 1) return 0.60;
  if (cycle === 2) return 0.80;
  return 1.00;
}

// Savings = subscription contributions only (excludes welfare, GLA, unit trust)
// Reads from member.savings field (set by patch_members.js)
function getMemberSavings(member) {
  return member.savings || member.totalSubscriptionUpTo2025 || 0;
}

// Build repayment schedule
// 60-day: reducing balance — Month 1 interest on full, Month 2 on remaining half
// 30-day: flat rate on full principal
function buildSchedule(amount, duration, rate, now) {
  if (duration === 30) {
    return [{
      installment: 1,
      dueDate: now + 30 * DAY,
      amount: parseFloat((amount * (1 + rate)).toFixed(2)),
      paid: false, paidDate: null, penalty: 0, wasLate: false,
    }];
  }
  // 60-day reducing balance
  const half = amount / 2;
  const month1Interest = parseFloat((amount * rate).toFixed(2));
  const month2Interest = parseFloat((half * rate).toFixed(2));
  return [
    {
      installment: 1,
      dueDate: now + 30 * DAY,
      amount: parseFloat((half + month1Interest).toFixed(2)),
      paid: false, paidDate: null, penalty: 0, wasLate: false,
    },
    {
      installment: 2,
      dueDate: now + 60 * DAY,
      amount: parseFloat((half + month2Interest).toFixed(2)),
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

    // Eligibility checks
    if (!member.isActive)
      return res.status(400).send("Member not active");
    if (!member.contributionsUpToDate)
      return res.status(400).send("Contributions not up to date");
    if (member.isFrozen)
      return res.status(400).send("Member is frozen from borrowing");

    // No existing active loan
    const activeSnap = await db.collection("loans")
      .where("memberId", "==", memberId)
      .where("status", "==", "active").get();
    let outstanding = 0;
    activeSnap.forEach(d =>
      d.data().schedule.forEach(i => { if (!i.paid) outstanding += i.amount; })
    );
    if (outstanding > 0)
      return res.status(400).send("Member has an active loan outstanding");

    // Savings must exceed outstanding (always true here since outstanding=0)
    const savings = getMemberSavings(member);
    if (savings <= 0)
      return res.status(400).send("No eligible savings on record");

    // Cycle-based loan limit
    // Max loan = 25% of total subscription savings × cycle multiplier
    const cycle = member.loanCycle || 1;
    const maxLoan = Math.floor(savings * 0.25 * getCycleMultiplier(cycle));
    if (Number(amount) > maxLoan)
      return res.status(400).send(
        `Exceeds limit. Cycle ${cycle} max: UGX ${maxLoan.toLocaleString()}`
      );

    // Pool availability check
    // Read from club/bankBalance (loansPool field)
    const bankSnap = await db.collection("club").doc("bankBalance").get();
    const bank = bankSnap.exists ? bankSnap.data() : { loansPool: 0 };
    const availablePool = bank.loansPool || 0;
    if (Number(amount) > availablePool)
      return res.status(400).send(
        `Loan pool insufficient. Available: UGX ${availablePool.toLocaleString()}`
      );

    // PAR gate — don't lend if PAR > 15%
    const parSnap = await db.collection("par_snapshots")
      .orderBy("recordedAt", "desc").limit(1).get();
    if (!parSnap.empty) {
      const latestPAR = parSnap.docs[0].data().totalPAR || 0;
      if (latestPAR > 15)
        return res.status(400).send(
          `Lending restricted — PAR at ${latestPAR}%. Resolve overdue loans first.`
        );
    }

    // Interest rate:
    // 30-day → 5% flat
    // 60-day → 5% per month reducing balance
    const rate = 0.05;
    const now = Date.now();
    const schedule = buildSchedule(Number(amount), Number(duration), rate, now);
    const totalRepayable = schedule.reduce((s, i) => s + i.amount, 0);

    // Write loan
    const loanRef = await db.collection("loans").add({
      memberId,
      memberEmail: member.email || "",
      memberName: member.name || member.displayName || "",
      amount: Number(amount),
      duration: Number(duration),
      interestRate: rate,
      cycle,
      schedule,
      status: "active",
      totalRepayable,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Deduct from loan pool
    await db.collection("club").doc("bankBalance").update({
      loansPool: admin.firestore.FieldValue.increment(-Number(amount)),
    });

    // Send approval email
    await sendEmail(
      member.email,
      "✅ Loan Approved — Let's Grow Investment Club",
      `<p>Dear ${member.name || member.displayName || "Member"},</p>
       <p>Your loan of <strong>UGX ${Number(amount).toLocaleString()}</strong> 
       (${duration} days at 5% ${duration === 30 ? "flat" : "reducing balance"}) 
       has been approved.</p>
       <ul>${schedule.map(s =>
         `<li>Instalment ${s.installment}: UGX ${s.amount.toLocaleString()} 
         due ${new Date(s.dueDate).toDateString()}</li>`
       ).join("")}</ul>
       <p>Total repayable: UGX ${totalRepayable.toLocaleString()}</p>
       <p>Regards,<br/>Let's Grow Investment Club</p>`
    );

    res.send({ success: true, loanId: loanRef.id, schedule, totalRepayable });
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
      // 3% per month on overdue instalment only (pro-rated daily)
      const overdueMonths = (now - inst.dueDate - GRACE_PERIOD) / (30 * DAY);
      penalty = parseFloat((inst.amount * PENALTY_RATE * overdueMonths).toFixed(2));
    }

    const totalDue = inst.amount + penalty;
    if (amountPaid < totalDue)
      return res.status(400).send(
        `Insufficient. Total due: UGX ${totalDue.toLocaleString()} (penalty: UGX ${penalty.toLocaleString()})`
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

      if (!anyLate) {
        // On-time repayment → advance cycle (max 3 per spec)
        loanCycle = Math.min(loanCycle + 1, 3);
        consecutiveDefaults = 0;
      } else {
        consecutiveDefaults += 1;
        if (consecutiveDefaults >= 2) {
          // Drop a cycle for repeat default
          loanCycle = Math.max(1, loanCycle - 1);
          isFrozen = true;
        }
      }

      // Severe default (2+ consecutive) → reset to cycle 1
      if (consecutiveDefaults >= 2 && loanCycle > 1) {
        loanCycle = 1;
      }

      await memberRef.update({ loanCycle, consecutiveDefaults, isFrozen });

      // Return repaid principal to loan pool
      await db.collection("club").doc("bankBalance").update({
        loansPool: admin.firestore.FieldValue.increment(Number(amountPaid)),
      });
    }

    await loanRef.update(updates);
    await db.collection("repayments").add({
      loanId,
      memberId: loan.memberId,
      installmentIndex: Number(installmentIndex),
      amountPaid: Number(amountPaid),
      penalty,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.send({
      success: true,
      penalty,
      totalPaid: totalDue,
      loanClosed: allPaid,
      wasLate,
    });
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
          if (daysOverdue > 7) { // after grace period
            if (daysOverdue <= 30) overdue1to30 += inst.amount;
            else overdueOver30 += inst.amount;
          }
        }
      });
    });

    const base = totalOutstanding || 1;
    const result = {
      totalOutstanding,
      overdue1to30,
      overdueOver30,
      par1to30: parseFloat(((overdue1to30 / base) * 100).toFixed(2)),
      parOver30: parseFloat(((overdueOver30 / base) * 100).toFixed(2)),
      totalPAR: parseFloat((((overdue1to30 + overdueOver30) / base) * 100).toFixed(2)),
      status: ((overdue1to30 + overdueOver30) / base) > 0.15 ? "restrict"
            : ((overdue1to30 + overdueOver30) / base) > 0.10 ? "caution"
            : "healthy",
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
    const [loansSnap, bankSnap] = await Promise.all([
      db.collection("loans").where("status", "==", "active").get(),
      db.collection("club").doc("bankBalance").get(),
    ]);

    const bank = bankSnap.exists ? bankSnap.data() : { loansPool: 0, total: 0 };
    const now = Date.now();
    let totalOutstanding = 0, totalOverdue = 0,
        overdue1to30 = 0, overdueOver30 = 0;

    loansSnap.forEach(doc => {
      doc.data().schedule.forEach(inst => {
        if (!inst.paid) {
          totalOutstanding += inst.amount;
          const daysOverdue = (now - inst.dueDate) / DAY;
          if (daysOverdue > 7) {
            totalOverdue += inst.amount;
            if (daysOverdue <= 30) overdue1to30 += inst.amount;
            else overdueOver30 += inst.amount;
          }
        }
      });
    });

    const availablePool = bank.loansPool || 0;
    const totalPool = availablePool + totalOutstanding;
    const b = totalOutstanding || 1;
    const par = parseFloat((((overdue1to30 + overdueOver30) / b) * 100).toFixed(2));

    res.send({
      bankBalanceTotal: bank.total || 0,
      totalLoanPool: totalPool,
      availableToLend: availablePool,
      activeLoans: loansSnap.size,
      totalOutstanding,
      totalOverdue,
      par,
      par1to30: parseFloat(((overdue1to30 / b) * 100).toFixed(2)),
      parOver30: parseFloat(((overdueOver30 / b) * 100).toFixed(2)),
      parStatus: par > 15 ? "restrict" : par > 10 ? "caution" : "healthy",
      utilizationRate: totalPool > 0
        ? parseFloat(((totalOutstanding / totalPool) * 100).toFixed(2))
        : 0,
      lendingRestricted: par > 15,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── MEMBER LOAN STATUS ───────────────────────────────────────
exports.getMemberProfile = functions.https.onRequest(async (req, res) => {
  try {
    const { memberId } = req.query;
    if (!memberId) return res.status(400).send("Missing memberId");

    const member = await getMember(memberId);
    const loansSnap = await db.collection("loans")
      .where("memberId", "==", memberId).get();

    const loans = [];
    loansSnap.forEach(d => loans.push({ id: d.id, ...d.data() }));

    const savings = getMemberSavings(member);
    const cycle = member.loanCycle || 1;
    const maxLoan = Math.floor(savings * 0.25 * getCycleMultiplier(cycle));

    res.send({
      memberId,
      name: member.name || member.displayName || "",
      accountType: member.accountType || "individual",
      savings,
      loanCycle: cycle,
      cyclePercent: getCycleMultiplier(cycle) * 100,
      maxLoan,
      isActive: member.isActive || false,
      isFrozen: member.isFrozen || false,
      contributionsUpToDate: member.contributionsUpToDate || false,
      consecutiveDefaults: member.consecutiveDefaults || 0,
      totalSubscriptionUpTo2025: member.totalSubscriptionUpTo2025 || 0,
      subscriptionByYear: member.subscriptionByYear || {},
      loans,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── LOAN ELIGIBILITY CHECK ───────────────────────────────────
exports.checkEligibility = functions.https.onRequest(async (req, res) => {
  try {
    const { memberId } = req.query;
    if (!memberId) return res.status(400).send("Missing memberId");

    const member = await getMember(memberId);

    const ineligible = (reason) => res.send({ eligible: false, reason });

    if (!member.isActive) return ineligible(`Status: ${member.status || "not active"}`);
    if (!member.contributionsUpToDate) return ineligible("Contributions not up to date");
    if (member.isFrozen) return ineligible("Frozen — resolve defaults first");

    const activeSnap = await db.collection("loans")
      .where("memberId", "==", memberId)
      .where("status", "==", "active").get();
    if (!activeSnap.empty) return ineligible("Has an active loan outstanding");

    const savings = getMemberSavings(member);
    if (savings <= 0) return ineligible("No eligible savings on record");

    const cycle = member.loanCycle || 1;
    const maxLoan = Math.floor(savings * 0.25 * getCycleMultiplier(cycle));
    const cyclePercent = getCycleMultiplier(cycle) * 100;

    res.send({
      eligible: true,
      memberId,
      name: member.name || member.displayName || "",
      savings,
      maxLoanBase: Math.floor(savings * 0.25),
      currentCycle: cycle,
      cyclePercent,
      cycleLimit: maxLoan,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── SCHEDULED REMINDERS (runs daily) ────────────────────────
exports.sendLoanReminders = onSchedule("every 24 hours", async () => {
  const now = Date.now();
  const snap = await db.collection("loans").where("status", "==", "active").get();

  for (const doc of snap.docs) {
    const loan = doc.data();
    if (!loan.memberEmail) continue;

    for (const inst of loan.schedule) {
      if (inst.paid) continue;

      const daysUntil = (inst.dueDate - now) / DAY;
      const daysOver  = (now - inst.dueDate) / DAY;
      const halfPoint = loan.duration / 2;

      let subject = null, body = null;

      if (daysUntil <= 7 && daysUntil > 1) {
        subject = "⏰ Repayment Reminder — 7 Days";
        body = `Instalment ${inst.installment} of UGX ${inst.amount.toLocaleString()} is due on ${new Date(inst.dueDate).toDateString()}.`;
      } else if (Math.round(daysUntil) === Math.round(halfPoint)) {
        subject = "📅 Mid-Cycle Reminder";
        body = `You are halfway through your loan. Instalment ${inst.installment} of UGX ${inst.amount.toLocaleString()} is due ${new Date(inst.dueDate).toDateString()}.`;
      } else if (daysUntil <= 1 && daysUntil >= 0) {
        subject = "🚨 Loan Payment Due Today";
        body = `Your instalment of UGX ${inst.amount.toLocaleString()} is due TODAY.`;
      } else if (daysOver > 7) {
        // After grace period — penalty applies
        const overdueMonths = (now - inst.dueDate - GRACE_PERIOD) / (30 * DAY);
        const pen = (inst.amount * PENALTY_RATE * overdueMonths).toFixed(2);
        subject = "⚠️ Overdue Notice — Penalty Applied";
        body = `Instalment ${inst.installment} is overdue. Penalty so far: UGX ${Number(pen).toLocaleString()}. Total now due: UGX ${(inst.amount + Number(pen)).toLocaleString()}.`;
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
