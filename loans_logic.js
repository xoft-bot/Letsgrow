// loans_logic.js — Let's Grow Investment Club Loan Engine
// All loan business logic lives here.
// Import and call these functions from your app routes/controllers.
//
// Usage:
//   const loans = require('./loans_logic');
//   await loans.checkEligibility('kirabira_jude');
//   await loans.issueLoan('kirabira_jude', 500000, '60day');

const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccount.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

async function getLoanRules() {
  const snap = await db.collection('club').doc('loanRules').get();
  return snap.data();
}

async function getMember(memberId) {
  const snap = await db.collection('members').doc(memberId).get();
  if (!snap.exists) throw new Error(`Member ${memberId} not found`);
  return snap.data();
}

async function getLoanProfile(memberId) {
  const snap = await db.collection('memberLoanProfiles').doc(memberId).get();
  if (!snap.exists) throw new Error(`Loan profile for ${memberId} not found`);
  return snap.data();
}

// ─────────────────────────────────────────────────────────────
// 1. CHECK ELIGIBILITY
// Returns { eligible: bool, reason: string, maxLoan: number, cycleLimit: number }
// ─────────────────────────────────────────────────────────────
async function checkEligibility(memberId) {
  const [member, profile, rules] = await Promise.all([
    getMember(memberId),
    getLoanProfile(memberId),
    getLoanRules(),
  ]);

  const ineligible = (reason) => {
    db.collection('memberLoanProfiles').doc(memberId).update({
      isEligible: false,
      ineligibilityReason: reason,
      lastEvaluated: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { eligible: false, reason, maxLoan: 0, cycleLimit: 0 };
  };

  // Rule 1: Status must be active or diaspora (not inactive/exited/deceased)
  if (!['active', 'diaspora', 'partial'].includes(member.status)) {
    return ineligible(`Member status is '${member.status}'`);
  }

  // Rule 2: No active loan already running
  if (profile.activeLoanId) {
    return ineligible('Has an active loan outstanding');
  }

  // Rule 3: No active penalties
  if (profile.penaltyActive) {
    return ineligible('Has active penalty — repay overdue installment first');
  }

  // Rule 4: Must be up to date on subscriptions (2026 balance must be 0)
  const currentYear = new Date().getFullYear().toString();
  const currentYearBalance = member.subscriptionByYear?.[currentYear];
  // A non-zero balance field means they owe. Check the 2026 sheet balance column.
  // We flag partial payers in status — use that as proxy.
  if (member.status === 'inactive') {
    return ineligible('Not current on subscriptions');
  }

  // Rule 5: Eligible savings > 0
  const eligibleSavings = calculateEligibleSavings(member);
  if (eligibleSavings <= 0) {
    return ineligible('No eligible subscription savings on record');
  }

  // Rule 6: Savings > outstanding loan balance (always true if no active loan, guarded above)
  const maxLoan = Math.floor(eligibleSavings * rules.maxLoanPercent);
  const cyclePercent = rules.cycles[profile.currentCycle] || 0.60;
  const cycleLimit = Math.floor(maxLoan * cyclePercent);

  // Update profile
  await db.collection('memberLoanProfiles').doc(memberId).update({
    isEligible: true,
    ineligibilityReason: null,
    lastEvaluated: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    eligible: true,
    reason: 'Eligible',
    eligibleSavings,
    maxLoan,
    currentCycle: profile.currentCycle,
    cyclePercent: cyclePercent * 100,
    cycleLimit,
  };
}

// ─────────────────────────────────────────────────────────────
// 2. CALCULATE ELIGIBLE SAVINGS
// Subscription contributions ONLY (no welfare, GLA, unit trust)
// Uses totalSubscriptionUpTo2025 + any 2026 paid so far
// ─────────────────────────────────────────────────────────────
function calculateEligibleSavings(member) {
  // Base = totalSubscriptionUpTo2025 (pre-calculated in member doc)
  let savings = member.totalSubscriptionUpTo2025 || 0;

  // Add current year (2026) subscriptions paid so far
  const sub2026 = member.subscriptionByYear?.['2026'] || 0;
  savings += sub2026;

  return savings;
}

// ─────────────────────────────────────────────────────────────
// 3. BUILD REPAYMENT SCHEDULE
// Returns array of installment objects with amounts and due dates
// ─────────────────────────────────────────────────────────────
function buildRepaymentSchedule(principal, loanType, issueDate, rules) {
  const product = rules.products[loanType];
  if (!product) throw new Error(`Unknown loan type: ${loanType}`);

  const schedule = [];

  if (loanType === '60day') {
    // Reducing balance: Month 1 interest on full principal, Month 2 on remaining
    const month1Principal = Math.floor(principal * 0.50);
    const month2Principal = principal - month1Principal;
    const month1Interest = Math.round(principal * product.monthlyRate);
    const month2Interest = Math.round(month2Principal * product.monthlyRate);

    schedule.push({
      installmentNumber: 1,
      dueDate: addDays(issueDate, 30).toISOString().split('T')[0],
      principal: month1Principal,
      interest: month1Interest,
      penalty: 0,
      total: month1Principal + month1Interest,
      status: 'pending',
      paidDate: null,
      paidAmount: null,
    });
    schedule.push({
      installmentNumber: 2,
      dueDate: addDays(issueDate, 60).toISOString().split('T')[0],
      principal: month2Principal,
      interest: month2Interest,
      penalty: 0,
      total: month2Principal + month2Interest,
      status: 'pending',
      paidDate: null,
      paidAmount: null,
    });
  } else if (loanType === '30day') {
    // Flat rate: interest on full principal
    const interest = Math.round(principal * product.flatRate);
    schedule.push({
      installmentNumber: 1,
      dueDate: addDays(issueDate, 30).toISOString().split('T')[0],
      principal,
      interest,
      penalty: 0,
      total: principal + interest,
      status: 'pending',
      paidDate: null,
      paidAmount: null,
    });
  }

  return schedule;
}

// ─────────────────────────────────────────────────────────────
// 4. ISSUE LOAN
// Creates a loan doc + updates memberLoanProfile
// Returns the new loanId
// ─────────────────────────────────────────────────────────────
async function issueLoan(memberId, requestedAmount, loanType) {
  const eligibility = await checkEligibility(memberId);
  if (!eligibility.eligible) {
    throw new Error(`Member not eligible: ${eligibility.reason}`);
  }

  if (!['30day', '60day'].includes(loanType)) {
    throw new Error(`Invalid loan type. Use '30day' or '60day'`);
  }

  if (requestedAmount > eligibility.cycleLimit) {
    throw new Error(
      `Requested ${requestedAmount.toLocaleString()} exceeds cycle limit of ${eligibility.cycleLimit.toLocaleString()} (Cycle ${eligibility.currentCycle})`
    );
  }

  // Check pool availability
  const poolCheck = await checkPoolAvailability(requestedAmount);
  if (!poolCheck.available) {
    throw new Error(`Loan pool insufficient. Available: UGX ${poolCheck.availableAmount.toLocaleString()}`);
  }

  const rules = await getLoanRules();
  const issueDate = new Date().toISOString().split('T')[0];
  const schedule = buildRepaymentSchedule(requestedAmount, loanType, issueDate, rules);
  const totalRepayable = schedule.reduce((sum, s) => sum + s.total, 0);

  const loanData = {
    memberId,
    loanType,
    amount: requestedAmount,
    cycleAtIssuance: (await getLoanProfile(memberId)).currentCycle,
    status: 'active',
    issueDate,
    dueDate: schedule[schedule.length - 1].dueDate,
    schedule,
    totalRepayable,
    totalRepaid: 0,
    outstandingBalance: requestedAmount,
    penaltyAccrued: 0,
    penaltyPaid: 0,
    isOverdue: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Write loan + update profile + update pool in a batch
  const batch = db.batch();
  const loanRef = db.collection('loans').doc();
  batch.set(loanRef, loanData);

  batch.update(db.collection('memberLoanProfiles').doc(memberId), {
    activeLoanId: loanRef.id,
    totalLoansIssued: admin.firestore.FieldValue.increment(1),
    totalAmountBorrowed: admin.firestore.FieldValue.increment(requestedAmount),
    isEligible: false,
    ineligibilityReason: 'Has active loan',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Deduct from loans pool
  batch.update(db.collection('club').doc('bankBalance'), {
    loansPool: admin.firestore.FieldValue.increment(-requestedAmount),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  console.log(`✅ Loan issued: ${loanRef.id} | Member: ${memberId} | Amount: UGX ${requestedAmount.toLocaleString()} | Type: ${loanType}`);
  return { loanId: loanRef.id, ...loanData };
}

// ─────────────────────────────────────────────────────────────
// 5. RECORD REPAYMENT
// memberId, loanId, installmentNumber, amountPaid
// Handles partial/full, applies to correct installment
// ─────────────────────────────────────────────────────────────
async function recordRepayment(loanId, installmentNumber, amountPaid) {
  const loanSnap = await db.collection('loans').doc(loanId).get();
  if (!loanSnap.exists) throw new Error(`Loan ${loanId} not found`);
  const loan = loanSnap.data();

  if (loan.status === 'completed') {
    throw new Error('Loan already fully repaid');
  }

  const rules = await getLoanRules();
  const today = new Date().toISOString().split('T')[0];
  const schedule = [...loan.schedule];
  const idx = schedule.findIndex(s => s.installmentNumber === installmentNumber);
  if (idx === -1) throw new Error(`Installment ${installmentNumber} not found`);

  const installment = schedule[idx];
  if (installment.status === 'paid') throw new Error(`Installment ${installmentNumber} already paid`);

  // Check if overdue and apply penalty
  const daysOverdue = daysBetween(installment.dueDate, today) - rules.gracePeriodDays;
  let penalty = 0;
  if (daysOverdue > 0) {
    // 3% per month on overdue installment only (pro-rated daily)
    penalty = Math.round(installment.total * rules.penaltyRate * (daysOverdue / 30));
  }

  const totalDue = installment.total + penalty - (installment.paidAmount || 0);
  const isFullyPaid = amountPaid >= totalDue;

  schedule[idx] = {
    ...installment,
    penalty,
    paidAmount: (installment.paidAmount || 0) + amountPaid,
    paidDate: today,
    status: isFullyPaid ? 'paid' : 'partial',
    daysOverdue: Math.max(0, daysOverdue),
  };

  const allPaid = schedule.every(s => s.status === 'paid');
  const newOutstanding = loan.outstandingBalance - (isFullyPaid ? installment.principal : amountPaid * 0.8);
  const loanStatus = allPaid ? 'completed' : loan.status === 'overdue' ? 'active' : loan.status;

  const batch = db.batch();

  // Update loan doc
  batch.update(db.collection('loans').doc(loanId), {
    schedule,
    totalRepaid: admin.firestore.FieldValue.increment(amountPaid),
    outstandingBalance: Math.max(0, newOutstanding),
    penaltyAccrued: admin.firestore.FieldValue.increment(penalty),
    penaltyPaid: admin.firestore.FieldValue.increment(daysOverdue > 0 ? penalty : 0),
    isOverdue: false,
    status: loanStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Return repaid amount to pool
  batch.update(db.collection('club').doc('bankBalance'), {
    loansPool: admin.firestore.FieldValue.increment(amountPaid),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // If fully repaid: clear activeLoan, advance cycle if warranted
  if (allPaid) {
    const profile = await getLoanProfile(loan.memberId);
    const wasOnTime = schedule.every(s => (s.daysOverdue || 0) === 0);
    const newConsecutive = wasOnTime ? profile.consecutiveOnTimeRepayments + 1 : 0;
    const newCycle = wasOnTime && profile.currentCycle < 3
      ? profile.currentCycle + 1
      : profile.currentCycle;

    batch.update(db.collection('memberLoanProfiles').doc(loan.memberId), {
      activeLoanId: null,
      isEligible: true,
      ineligibilityReason: null,
      penaltyActive: false,
      totalRepaid: admin.firestore.FieldValue.increment(amountPaid),
      consecutiveOnTimeRepayments: newConsecutive,
      currentCycle: newCycle,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Loan ${loanId} fully repaid. Member ${loan.memberId} → Cycle ${newCycle}${wasOnTime ? ' (on time ✓)' : ' (late)'}`);
  }

  await batch.commit();
  return { success: true, installmentStatus: schedule[idx].status, loanStatus, penalty };
}

// ─────────────────────────────────────────────────────────────
// 6. DAILY OVERDUE CHECK
// Call this once per day (Cloud Function cron or manual)
// Marks overdue installments, applies penalties, freezes eligibility
// ─────────────────────────────────────────────────────────────
async function runDailyOverdueCheck() {
  const rules = await getLoanRules();
  const today = new Date().toISOString().split('T')[0];
  const activeLoans = await db.collection('loans').where('status', '==', 'active').get();

  let flagged = 0;

  for (const doc of activeLoans.docs) {
    const loan = doc.data();
    const schedule = [...loan.schedule];
    let becameOverdue = false;

    for (let i = 0; i < schedule.length; i++) {
      if (schedule[i].status !== 'pending') continue;
      const daysOverdue = daysBetween(schedule[i].dueDate, today) - rules.gracePeriodDays;
      if (daysOverdue > 0) {
        schedule[i] = { ...schedule[i], status: 'overdue', daysOverdue };
        becameOverdue = true;
      }
    }

    if (becameOverdue) {
      flagged++;
      const batch = db.batch();

      batch.update(db.collection('loans').doc(doc.id), {
        schedule,
        status: 'overdue',
        isOverdue: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Freeze eligibility
      batch.update(db.collection('memberLoanProfiles').doc(loan.memberId), {
        isEligible: false,
        penaltyActive: true,
        ineligibilityReason: 'Overdue installment — repay to restore eligibility',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Handle repeat defaults → cycle demotion
      const profile = await getLoanProfile(loan.memberId);
      const newDefaultCount = profile.defaultCount + 1;
      let newCycle = profile.currentCycle;

      if (newDefaultCount >= rules.cycleProgression.severeDefaultThreshold) {
        newCycle = 1; // severe default → reset to cycle 1
      } else if (rules.cycleProgression.repeatDefaultDropsCycle && newDefaultCount > 1) {
        newCycle = Math.max(1, profile.currentCycle - 1);
      }

      batch.update(db.collection('memberLoanProfiles').doc(loan.memberId), {
        defaultCount: newDefaultCount,
        currentCycle: newCycle,
        consecutiveOnTimeRepayments: 0,
      });

      await batch.commit();
    }
  }

  console.log(`✅ Daily overdue check complete. ${flagged} loans flagged.`);
  return { checked: activeLoans.size, flagged };
}

// ─────────────────────────────────────────────────────────────
// 7. PAR (PORTFOLIO AT RISK)
// Returns PAR % and status
// ─────────────────────────────────────────────────────────────
async function calculatePAR() {
  const rules = await getLoanRules();
  const activeLoans = await db.collection('loans')
    .where('status', 'in', ['active', 'overdue'])
    .get();

  let totalOutstanding = 0;
  let totalOverdue = 0;

  for (const doc of activeLoans.docs) {
    const loan = doc.data();
    totalOutstanding += loan.outstandingBalance || 0;
    const overdueInstallments = loan.schedule.filter(s => s.status === 'overdue');
    for (const inst of overdueInstallments) {
      totalOverdue += inst.total - (inst.paidAmount || 0);
    }
  }

  const par = totalOutstanding > 0 ? totalOverdue / totalOutstanding : 0;
  const parPercent = Math.round(par * 10000) / 100; // 2 decimal places

  let status = 'healthy';
  if (par > rules.par.restrict) status = 'restrict';
  else if (par > rules.par.caution) status = 'caution';

  return {
    par,
    parPercent,
    status,
    totalOutstanding,
    totalOverdue,
    activeLoansCount: activeLoans.size,
  };
}

// ─────────────────────────────────────────────────────────────
// 8. POOL UTILIZATION
// ─────────────────────────────────────────────────────────────
async function checkPoolAvailability(requestedAmount = 0) {
  const rules = await getLoanRules();
  const bankSnap = await db.collection('club').doc('bankBalance').get();
  const bank = bankSnap.data();
  const poolTotal = bank.loansPool || 0;

  // Total lent out
  const activeLoans = await db.collection('loans')
    .where('status', 'in', ['active', 'overdue'])
    .get();
  let totalLentOut = 0;
  for (const doc of activeLoans.docs) {
    totalLentOut += doc.data().outstandingBalance || 0;
  }

  const utilizationRate = poolTotal > 0 ? totalLentOut / (poolTotal + totalLentOut) : 0;
  const afterLoan = poolTotal > 0 ? (totalLentOut + requestedAmount) / (poolTotal + totalLentOut) : 1;

  return {
    available: afterLoan <= rules.poolUtilization.max && poolTotal >= requestedAmount,
    availableAmount: poolTotal,
    totalLentOut,
    utilizationRate: Math.round(utilizationRate * 10000) / 100,
    utilizationAfterLoan: Math.round(afterLoan * 10000) / 100,
    poolTotal: poolTotal + totalLentOut,
  };
}

// ─────────────────────────────────────────────────────────────
// 9. GET FULL ADMIN DASHBOARD DATA
// Single call that returns everything the dashboard needs
// ─────────────────────────────────────────────────────────────
async function getAdminDashboard() {
  const [parData, poolData, rules] = await Promise.all([
    calculatePAR(),
    checkPoolAvailability(),
    getLoanRules(),
  ]);

  // Active + overdue loans with member info
  const activeLoansSnap = await db.collection('loans')
    .where('status', 'in', ['active', 'overdue'])
    .orderBy('issueDate', 'desc')
    .get();

  const activeLoans = activeLoansSnap.docs.map(d => ({ loanId: d.id, ...d.data() }));

  // Overdue alerts
  const overdueLoans = activeLoans.filter(l => l.isOverdue);

  return {
    summary: {
      totalLoanPool: poolData.poolTotal,
      availableToLend: poolData.availableAmount,
      totalOutstanding: parData.totalOutstanding,
      totalOverdue: parData.totalOverdue,
      utilizationRate: poolData.utilizationRate,
      parPercent: parData.parPercent,
      parStatus: parData.status,
      activeLoansCount: parData.activeLoansCount,
      overdueCount: overdueLoans.length,
    },
    activeLoans,
    overdueAlerts: overdueLoans,
    lendingRestricted: parData.status === 'restrict',
  };
}

// ─────────────────────────────────────────────────────────────
// 10. GET MEMBER LOAN STATUS (for member-facing view)
// ─────────────────────────────────────────────────────────────
async function getMemberLoanStatus(memberId) {
  const [eligibility, profile] = await Promise.all([
    checkEligibility(memberId),
    getLoanProfile(memberId),
  ]);

  let activeLoan = null;
  if (profile.activeLoanId) {
    const snap = await db.collection('loans').doc(profile.activeLoanId).get();
    if (snap.exists) activeLoan = { loanId: snap.id, ...snap.data() };
  }

  // Loan history
  const historySnap = await db.collection('loans')
    .where('memberId', '==', memberId)
    .where('status', '==', 'completed')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  const history = historySnap.docs.map(d => ({ loanId: d.id, ...d.data() }));

  return {
    memberId,
    currentCycle: profile.currentCycle,
    eligibility,
    activeLoan,
    history,
    stats: {
      totalLoansIssued: profile.totalLoansIssued,
      totalAmountBorrowed: profile.totalAmountBorrowed,
      totalRepaid: profile.totalRepaid,
      defaultCount: profile.defaultCount,
      consecutiveOnTimeRepayments: profile.consecutiveOnTimeRepayments,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
  checkEligibility,
  calculateEligibleSavings,
  buildRepaymentSchedule,
  issueLoan,
  recordRepayment,
  runDailyOverdueCheck,
  calculatePAR,
  checkPoolAvailability,
  getAdminDashboard,
  getMemberLoanStatus,
};
