// loans_seed.js — Let's Grow Investment Club
// Seeds: loanRules doc + memberLoanProfile for every active member
// Run AFTER populate_firestore_v3_final.js
// Run: node loans_seed.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ─────────────────────────────────────────────────────────────
// LOAN RULES (single source of truth — app reads this)
// ─────────────────────────────────────────────────────────────
const loanRules = {
  // Eligibility
  eligibilityBasis: 'subscription_only', // exclude welfare, GLA, unit trust
  maxLoanPercent: 0.25,                  // 25% of eligible savings

  // Credit cycle limits (% of max loan per cycle)
  cycles: {
    1: 0.60,  // Cycle 1 → 60% of max
    2: 0.80,  // Cycle 2 → 80% of max
    3: 1.00   // Cycle 3 → 100% of max
  },

  // Loan products
  products: {
    '60day': {
      label: '60-Day Loan',
      durationDays: 60,
      interestType: 'reducing_balance',
      monthlyRate: 0.05,       // 5% per month on reducing balance
      repaymentSchedule: [
        { dayDue: 30, principalPercent: 0.50 },
        { dayDue: 60, principalPercent: 0.50 }
      ],
      allocationTarget: 0.75   // target 75% of pool
    },
    '30day': {
      label: '30-Day Loan',
      durationDays: 30,
      interestType: 'flat',
      flatRate: 0.05,          // 5% flat on principal
      repaymentSchedule: [
        { dayDue: 30, principalPercent: 1.00 }
      ],
      allocationTarget: 0.25   // target 25% of pool
    }
  },

  // Grace & penalties
  gracePeriodDays: 7,
  penaltyRate: 0.03,           // 3% per month on overdue installment only

  // Cycle progression rules
  cycleProgression: {
    requiredOnTimeRepayments: 1,  // 1 clean repayment to advance cycle
    missedInstallmentFreezesCycle: true,
    repeatDefaultDropsCycle: true,
    severeDefaultResetsToOne: true,
    severeDefaultThreshold: 2    // 2+ repeat defaults = reset to cycle 1
  },

  // PAR thresholds
  par: {
    healthy: 0.10,    // < 10%
    caution: 0.15,    // 10–15%
    restrict: 0.15    // > 15% = restrict new lending
  },

  // Pool utilization targets
  poolUtilization: {
    target: 0.55,     // 50–60%
    max: 0.80         // never exceed 80%
  },

  // Reminder schedule (days relative to due date, negative = before)
  reminderSchedule: [-7, -2, 0, 1, 7],

  lastUpdated: '2026-04-10'
};

// ─────────────────────────────────────────────────────────────
// ACTIVE MEMBER IDs (those eligible to participate in loans)
// Excludes: exited, deceased, inactive, batenga_diana
// ─────────────────────────────────────────────────────────────
const activeMemberIds = [
  'lule_stephen',
  'sekiranda_simon',
  'ssebudde_samuel',
  'kirabira_jude',
  'luutu_daniel',
  'kigonya_antonio',
  'ssali_simon',
  'matovu_julius',
  'ssetumba_david',
  'kyamulabi_diana',
  'claire_namutebi',
  'naggayi_constance',
  'nabuuma_teopista',
  'nuwahereza_edson',
  'kintu_ernest',
  'namubiru_rose',
  'nalukenge_rashida',
  'nakakande_shebah',
  'nsubuga_moses',
  'nakiwala_ruth',
  'nabunnya_shamera',
  'babirye_joan',
  'mabaale_james',
  'nampeewo_winfred',
];

// ─────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────
async function seed() {
  // 1. Loan rules doc
  await db.collection('club').doc('loanRules').set(loanRules);
  console.log('✅ loanRules seeded');

  // 2. memberLoanProfile for each active member (starting state)
  const batch = db.batch();
  for (const memberId of activeMemberIds) {
    const ref = db.collection('memberLoanProfiles').doc(memberId);
    batch.set(ref, {
      memberId,
      currentCycle: 1,           // everyone starts at cycle 1
      activeLoanId: null,
      totalLoansIssued: 0,
      totalAmountBorrowed: 0,
      totalRepaid: 0,
      defaultCount: 0,
      consecutiveOnTimeRepayments: 0,
      isEligible: null,          // null = not yet evaluated; app checks on demand
      ineligibilityReason: null,
      lastEvaluated: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }); // merge:true so re-running doesn't overwrite real data
  }
  await batch.commit();
  console.log(`✅ ${activeMemberIds.length} memberLoanProfiles seeded`);

  console.log('\n🎉 loans_seed.js complete. Ready to run loans_logic.js functions.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
