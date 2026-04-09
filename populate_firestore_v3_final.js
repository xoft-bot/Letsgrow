// populate_firestore_v3.js - Let's Grow Investment Club — Full Seed Script
// Run: node populate_firestore_v3.js
// Requires: npm install firebase-admin
//
// STRUCTURE:
//   - Joint accounts: accountType:'joint', primary:{}, secondary:{}
//   - Individual accounts: accountType:'individual', primary:{}
//   - Committees reference { memberId, holder:'primary'|'secondary', role }
//   - Juniors seeded to 'juniors' collection
//   - Club financials, bank balance, loan rules seeded to 'club' collection
//   - Investments seeded to 'investments' collection

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function ugx(n) { return Math.round(n); }

// ============================================================
// MEMBERS
// accountType: 'joint' | 'individual'
// For joint: primary = husband/named member, secondary = wife/co-member
// Financial data (subscriptions, loans, dividends) lives on the household doc
// ============================================================
const members = [

  // ─────────────────────────────────────────────
  // JOINT ACCOUNTS
  // ─────────────────────────────────────────────

  {
    id: 'lule_stephen',
    accountType: 'joint',
    primary: { name: 'Stephen Lule', role: 'Patron & Chief Disciplinarian' },
    secondary: { name: 'Juliet Lule', role: 'Patron' },
    displayName: 'Mr & Mrs Stephen Lule',
    email: 'stephen.lule@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 80000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 410000, '2021': 600000, '2022': 810000, '2023': 960000, '2024': 960000, '2025': 960000, '2026': 0 },
    totalSubscriptionUpTo2025: 4700000,
    loanEligibility: ugx(4700000 * 0.25),
    welfareByYear: { '2021': 120000, '2022': 190000, '2023': 240000, '2024': 240000, '2025': 240000, '2026': 0 },
    glaByYear: { '2024': 312000, '2025': 312000, '2026': 0 },
    unitTrustByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    dividendsTotal: 583493,
    notes: 'Patrons. Not yet paid 2026.'
  },

  {
    id: 'sekiranda_simon',
    accountType: 'joint',
    primary: { name: 'Simon Sekiranda', role: 'Member' },
    secondary: { name: 'Neria Sekiranda', role: 'Member' },
    displayName: 'Mr & Mrs Simon Sekiranda',
    email: 'simon.sekiranda@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'diaspora',
    monthlySubscription: 80000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 410000, '2021': 600000, '2022': 810000, '2023': 960000, '2024': 960000, '2025': 960000, '2026': 0 },
    totalSubscriptionUpTo2025: 4700000,
    loanEligibility: ugx(4700000 * 0.25),
    welfareByYear: { '2021': 120000, '2022': 190000, '2023': 240000, '2024': 240000, '2025': 240000, '2026': 0 },
    glaByYear: { '2024': 312000, '2025': 312000, '2026': 0 },
    unitTrustByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    dividendsTotal: 588803,
    notes: 'Diaspora. Investment Committee member 2026-2028.'
  },

  {
    id: 'ssebudde_samuel',
    accountType: 'joint',
    primary: { name: 'Samuel Ssebudde', role: 'Member' },
    secondary: { name: 'Mrs Ssebudde', role: 'Member' },
    displayName: 'Mr & Mrs Samuel Ssebudde',
    email: 'samuel.ssebudde@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'partial',
    monthlySubscription: 40000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 410000, '2021': 600000, '2022': 810000, '2023': 960000, '2024': 960000, '2025': 84000, '2026': 0 },
    totalSubscriptionUpTo2025: 3824000,
    loanEligibility: ugx(3824000 * 0.25),
    welfareByYear: { '2021': 120000, '2022': 190000, '2023': 240000, '2024': 240000, '2025': 20000, '2026': 0 },
    glaByYear: { '2024': 312000, '2025': 26000, '2026': 0 },
    unitTrustByYear: { '2024': 240000, '2025': 20000, '2026': 0 },
    dividendsTotal: 582148,
    notes: 'Partial payer in 2025 — separated from joint account. Dividends paid Jan 2026.'
  },

  {
    id: 'kirabira_jude',
    accountType: 'joint',
    primary: { name: 'Jude Kirabira', role: 'Investment Committee Chair' },
    secondary: { name: 'Mrs Kirabira', role: 'Member' },
    displayName: 'Mr & Mrs Jude Kirabira',
    email: 'jude.kirabira@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 80000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 410000, '2021': 600000, '2022': 810000, '2023': 960000, '2024': 960000, '2025': 960000, '2026': 960000 },
    totalSubscriptionUpTo2025: 4700000,
    loanEligibility: ugx(4700000 * 0.25),
    welfareByYear: { '2021': 120000, '2022': 190000, '2023': 240000, '2024': 240000, '2025': 240000, '2026': 240000 },
    glaByYear: { '2024': 312000, '2025': 312000, '2026': 312000 },
    unitTrustByYear: { '2024': 240000, '2025': 240000, '2026': 240000 },
    dividendsTotal: 590503,
    notes: 'Former Chairperson. Investment Committee Chair 2026-2028. Fully paid 2026.'
  },

  {
    id: 'luutu_daniel',
    accountType: 'joint',
    primary: { name: 'Daniel Luutu', role: 'Secretary' },
    secondary: { name: 'Ruth Nagawa Luutu', role: 'Deputy Secretary' },
    displayName: 'Mr & Mrs Daniel Luutu',
    email: 'daniel.luutu@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 80000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 410000, '2021': 600000, '2022': 810000, '2023': 960000, '2024': 960000, '2025': 960000, '2026': 0 },
    totalSubscriptionUpTo2025: 4700000,
    loanEligibility: ugx(4700000 * 0.25),
    welfareByYear: { '2021': 120000, '2022': 190000, '2023': 240000, '2024': 240000, '2025': 240000, '2026': 0 },
    glaByYear: { '2024': 312000, '2025': 312000, '2026': 0 },
    unitTrustByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    dividendsTotal: 582148,
    notes: 'Secretary 2026-2028. Ruth Nagawa is Deputy Secretary. Dividends paid Jan 2026. Kids: Lael & Liam Orion Luutu (Juniors).'
  },

  {
    id: 'kigonya_antonio',
    accountType: 'joint',
    primary: { name: 'Antonio Kigonya', role: 'Chairperson' },
    secondary: { name: 'Aidah Bangi Kigonya', role: 'Welfare Chairperson' },
    displayName: 'Mr & Mrs Antonio Kigonya',
    email: 'antonio.kigonya@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 80000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 410000, '2021': 600000, '2022': 810000, '2023': 960000, '2024': 960000, '2025': 960000, '2026': 40000 },
    totalSubscriptionUpTo2025: 4700000,
    loanEligibility: ugx(4700000 * 0.25),
    welfareByYear: { '2021': 120000, '2022': 190000, '2023': 240000, '2024': 240000, '2025': 240000, '2026': 0 },
    glaByYear: { '2024': 312000, '2025': 312000, '2026': 0 },
    unitTrustByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    dividendsTotal: 575960,
    notes: 'Chairperson 2026-2028. Only Jan sub paid so far in 2026 (no welfare/GLA/UT yet).'
  },

  {
    id: 'ssali_simon',
    accountType: 'joint',
    primary: { name: 'Simon Ssali', role: 'Member' },
    secondary: { name: 'Mrs Ssali', role: 'Member' },
    displayName: 'Mr & Mrs Simon Ssali',
    email: 'simon.ssali@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'diaspora',
    monthlySubscription: 80000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 410000, '2021': 600000, '2022': 810000, '2023': 960000, '2024': 960000, '2025': 960000, '2026': 0 },
    totalSubscriptionUpTo2025: 4700000,
    loanEligibility: ugx(4700000 * 0.25),
    welfareByYear: { '2021': 120000, '2022': 190000, '2023': 240000, '2024': 240000, '2025': 240000, '2026': 0 },
    glaByYear: { '2024': 312000, '2025': 312000, '2026': 0 },
    unitTrustByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    dividendsTotal: 590503,
    notes: 'Diaspora. Investment Committee member 2026-2028.'
  },

  {
    id: 'matovu_julius',
    accountType: 'joint',
    primary: { name: 'Julius Matovu', role: 'Welfare Committee Secretary' },
    secondary: { name: 'Faith Matovu', role: 'Member' },
    displayName: 'Mr & Mrs Julius Matovu',
    email: 'julius.matovu@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'active',
    monthlySubscription: 80000,
    joinYear: 2022,
    subscriptionByYear: { '2022': 810000, '2023': 960000, '2024': 960000, '2025': 960000, '2026': 0 },
    totalSubscriptionUpTo2025: 3690000,
    loanEligibility: ugx(3690000 * 0.25),
    welfareByYear: { '2022': 190000, '2023': 240000, '2024': 240000, '2025': 240000, '2026': 0 },
    glaByYear: { '2024': 312000, '2025': 312000, '2026': 0 },
    unitTrustByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    dividendsTotal: 84878,
    notes: 'Welfare Committee Secretary 2026-2028. Diaspora fees from Q4 2025.'
  },

  {
    id: 'ssetumba_david',
    accountType: 'joint',
    primary: { name: 'David Ssetumba', role: 'Member' },
    secondary: { name: 'Mrs Ssetumba', role: 'Member' },
    displayName: 'Mr & Mrs David Ssetumba',
    email: 'david.ssetumba@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'inactive',
    monthlySubscription: 80000,
    joinYear: 2022,
    subscriptionByYear: { '2022': 810000, '2023': 960000, '2024': 960000, '2025': 0, '2026': 0 },
    totalSubscriptionUpTo2025: 2730000,
    loanEligibility: 0,
    welfareByYear: { '2022': 190000, '2023': 240000, '2024': 240000, '2025': 0, '2026': 0 },
    glaByYear: { '2024': 312000, '2025': 0, '2026': 0 },
    unitTrustByYear: { '2024': 240000, '2025': 0, '2026': 0 },
    dividendsTotal: 229605,
    notes: 'Inactive — stopped paying in 2025.'
  },

  // ─────────────────────────────────────────────
  // INDIVIDUAL ACCOUNTS
  // ─────────────────────────────────────────────

  {
    id: 'kyamulabi_diana',
    accountType: 'individual',
    primary: { name: 'Diana Kyamulabi', role: 'Club Mobiliser' },
    displayName: 'Diana Kyamulabi',
    email: 'diana.kyamulabi@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 2350000,
    loanEligibility: ugx(2350000 * 0.25),
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 288651,
    notes: 'Club Mobiliser 2026-2028.'
  },

  {
    id: 'claire_namutebi',
    accountType: 'individual',
    primary: { name: 'Claire Namutebi', role: 'Treasurer' },
    displayName: 'Claire Namutebi',
    email: 'claire.namutebi@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 2350000,
    loanEligibility: ugx(2350000 * 0.25),
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 293163,
    notes: 'Treasurer 2026-2028. Dividends paid Oct 2025.'
  },

  {
    id: 'naggayi_constance',
    accountType: 'individual',
    primary: { name: 'Constance Naggayi', role: 'Member' },
    displayName: 'Constance Naggayi',
    email: 'constance.naggayi@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 2350000,
    loanEligibility: ugx(2350000 * 0.25),
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 290550,
    notes: ''
  },

  {
    id: 'nabuuma_teopista',
    accountType: 'individual',
    primary: { name: 'Teopista Nabuuma', role: 'Deputy Treasurer' },
    displayName: 'Teopista Nabuuma',
    email: 'teopista.nabuuma@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 2350000,
    loanEligibility: ugx(2350000 * 0.25),
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 295251,
    notes: 'Deputy Treasurer 2026-2028.'
  },

  {
    id: 'nuwahereza_edson',
    accountType: 'individual',
    primary: { name: 'Edson Nuwahereza', role: 'Vice-Chairperson' },
    displayName: 'Edson Nuwahereza',
    email: 'edson.nuwahereza@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 40000 },
    totalSubscriptionUpTo2025: 2350000,
    loanEligibility: ugx(2350000 * 0.25),
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 10000 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 13000 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 10000 },
    dividendsTotal: 293835,
    notes: 'Vice-Chairperson 2026-2028. Paid Jan 2026.'
  },

  {
    id: 'kintu_ernest',
    accountType: 'individual',
    primary: { name: 'Ernest Kintu', role: 'Member' },
    displayName: 'Ernest Kintu',
    email: 'ernest.kintu@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'inactive',
    monthlySubscription: 40000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000, '2024': 480000, '2025': 352000, '2026': 0 },
    totalSubscriptionUpTo2025: 2222000,
    loanEligibility: 0,
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 120000, '2025': 80000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 104000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 80000, '2026': 0 },
    dividendsTotal: 291575,
    notes: 'Stopped paying mid-2025. Outstanding balance owed.'
  },

  {
    id: 'namubiru_rose',
    accountType: 'individual',
    primary: { name: 'Rose Namubiru', role: 'Welfare Committee Member' },
    displayName: 'Rose Namubiru',
    email: 'rose.namubiru@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'platinum',
    status: 'diaspora',
    monthlySubscription: 40000,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 2350000,
    loanEligibility: ugx(2350000 * 0.25),
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 295251,
    notes: 'Diaspora. Welfare Committee member 2026-2028. Dividends paid Dec 2025.'
  },

  {
    id: 'nalukenge_rashida',
    accountType: 'individual',
    primary: { name: 'Rashida Nalukenge', role: 'Welfare Committee Member' },
    displayName: 'Rashida Nalukenge',
    email: 'rashida.nalukenge@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'diaspora',
    monthlySubscription: 40000,
    joinYear: 2022,
    subscriptionByYear: { '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 1845000,
    loanEligibility: ugx(1845000 * 0.25),
    welfareByYear: { '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 117153,
    notes: 'Diaspora. Welfare Committee member 2026-2028. Also pays diaspora fees.'
  },

  {
    id: 'nakakande_shebah',
    accountType: 'individual',
    primary: { name: 'Batsheba Nakakande', role: 'Chief Whip' },
    displayName: 'Batsheba Nakakande',
    email: 'batsheba.nakakande@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2022,
    subscriptionByYear: { '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 1845000,
    loanEligibility: ugx(1845000 * 0.25),
    welfareByYear: { '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 115737,
    notes: 'Chief Whip / Disciplinary Committee 2026-2028.'
  },

  {
    id: 'nsubuga_moses',
    accountType: 'individual',
    primary: { name: 'Moses Nsubuga', role: 'Investment Committee Secretary' },
    displayName: 'Moses Nsubuga',
    email: 'moses.nsubuga@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2022,
    subscriptionByYear: { '2022': 405000, '2023': 480000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 1845000,
    loanEligibility: ugx(1845000 * 0.25),
    welfareByYear: { '2022': 95000, '2023': 120000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 46616,
    notes: 'Investment Committee Secretary 2026-2028.'
  },

  {
    id: 'nakiwala_ruth',
    accountType: 'individual',
    primary: { name: 'Ruth Nakiwala', role: 'Diaspora Coordinator' },
    displayName: 'Ruth Nakiwala',
    email: 'ruth.nakiwala@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'diaspora',
    monthlySubscription: 40000,
    joinYear: 2023,
    subscriptionByYear: { '2023': 320000, '2024': 480000, '2025': 480000, '2026': 0 },
    totalSubscriptionUpTo2025: 1280000,
    loanEligibility: ugx(1280000 * 0.25),
    welfareByYear: { '2023': 80000, '2024': 120000, '2025': 120000, '2026': 0 },
    glaByYear: { '2024': 156000, '2025': 156000, '2026': 0 },
    unitTrustByYear: { '2024': 120000, '2025': 120000, '2026': 0 },
    dividendsTotal: 291107,
    notes: 'Diaspora Coordinator 2026-2028. Also pays diaspora fees. Received Namuyimba Kenneth dividends as next of kin (290,000 paid Nov 2025).'
  },

  {
    id: 'nabunnya_shamera',
    accountType: 'individual',
    primary: { name: 'Shamera Nabunnya', role: 'Welfare Committee Treasurer' },
    displayName: 'Shamera Nabunnya',
    email: 'shamera.nabunnya@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2025,
    subscriptionByYear: { '2025': 480000, '2026': 120000 },
    totalSubscriptionUpTo2025: 480000,
    loanEligibility: ugx(480000 * 0.25),
    welfareByYear: { '2025': 120000, '2026': 30000 },
    glaByYear: { '2025': 156000, '2026': 39000 },
    unitTrustByYear: { '2025': 120000, '2026': 30000 },
    dividendsTotal: 291074,
    notes: 'Welfare Committee Treasurer 2026-2028. Dividends paid Mar 2026.'
  },

  {
    id: 'babirye_joan',
    accountType: 'individual',
    primary: { name: 'Joan Babirye', role: 'Investment Committee Member' },
    displayName: 'Joan Babirye',
    email: 'joan.babirye@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2025,
    subscriptionByYear: { '2025': 120000, '2026': 80000 },
    totalSubscriptionUpTo2025: 120000,
    loanEligibility: ugx(120000 * 0.25),
    welfareByYear: { '2025': 30000, '2026': 20000 },
    glaByYear: { '2025': 39000, '2026': 26000 },
    unitTrustByYear: { '2025': 30000, '2026': 20000 },
    dividendsTotal: 0,
    notes: 'New member 2025. Investment Committee member 2026-2028.'
  },

  {
    id: 'mabaale_james',
    accountType: 'individual',
    primary: { name: 'James Mabaale', role: 'Member' },
    displayName: 'James Mabaale',
    email: 'james.mabaale@letsgrowinvestmentclub.com',
    phone: '',
    memberType: 'golden',
    status: 'active',
    monthlySubscription: 40000,
    joinYear: 2025,
    subscriptionByYear: { '2025': 0, '2026': 0 },
    totalSubscriptionUpTo2025: 0,
    loanEligibility: 0,
    welfareByYear: {},
    glaByYear: {},
    unitTrustByYear: {},
    dividendsTotal: 0,
    notes: 'New member 2025 (paid registration 410,000). Yet to start regular subscriptions.'
  },

  // ─────────────────────────────────────────────
  // EXITED MEMBERS
  // ─────────────────────────────────────────────

  {
    id: 'nakimuli_annet',
    accountType: 'individual',
    primary: { name: 'Annet Nakimuli', role: 'Member' },
    displayName: 'Annet Nakimuli',
    email: '',
    phone: '',
    memberType: 'platinum',
    status: 'exited',
    monthlySubscription: 0,
    joinYear: 2021,
    subscriptionByYear: { '2021': 300000, '2022': 205000 },
    totalSubscriptionUpTo2025: 505000,
    loanEligibility: 0,
    welfareByYear: { '2021': 60000, '2022': 40000 },
    glaByYear: {},
    unitTrustByYear: {},
    dividendsTotal: 112451,
    notes: 'Exited 2022. Paid out 30% of savings (294,000 UGX) per constitution Aug 2023.'
  },

  {
    id: 'namubiru_winnie',
    accountType: 'individual',
    primary: { name: 'Winnie Namubiru', role: 'Member' },
    displayName: 'Winnie Namubiru',
    email: '',
    phone: '',
    memberType: 'platinum',
    status: 'exited',
    monthlySubscription: 0,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000, '2024': 200000 },
    totalSubscriptionUpTo2025: 1590000,
    loanEligibility: 0,
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 50000 },
    glaByYear: { '2024': 65000 },
    unitTrustByYear: { '2024': 50000 },
    dividendsTotal: 291747,
    notes: 'Exited 2024. Cashed out Oct 2025 (included in 2,540,000 payout).'
  },

  {
    id: 'nansubuga_jane',
    accountType: 'individual',
    primary: { name: 'Jane Frances Nansubuga', role: 'Member' },
    displayName: 'Jane Frances Nansubuga',
    email: '',
    phone: '',
    memberType: 'platinum',
    status: 'exited',
    monthlySubscription: 0,
    joinYear: 2021,
    subscriptionByYear: { '2021': 300000, '2022': 405000, '2023': 480000, '2024': 120000 },
    totalSubscriptionUpTo2025: 1305000,
    loanEligibility: 0,
    welfareByYear: { '2021': 60000, '2022': 95000, '2023': 120000, '2024': 30000 },
    glaByYear: { '2024': 39000 },
    unitTrustByYear: { '2024': 30000 },
    dividendsTotal: 225038,
    notes: 'Exited 2024. Cashed out Oct 2025 (included in 2,540,000 payout).'
  },

  // ─────────────────────────────────────────────
  // DECEASED — ESTATE ACCOUNTS
  // ─────────────────────────────────────────────

  {
    id: 'namuyimba_keneth',
    accountType: 'individual',
    primary: { name: 'Kenneth Namuyimba', role: 'Member' },
    displayName: 'Kenneth Namuyimba',
    email: '',
    phone: '',
    memberType: 'platinum',
    status: 'deceased',
    monthlySubscription: 0,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000 },
    totalSubscriptionUpTo2025: 0,
    loanEligibility: 0,
    welfareByYear: {},
    glaByYear: {},
    unitTrustByYear: {},
    dividendsTotal: 291107,
    estateValue: 1181500,
    notes: 'Deceased April 2023. Dividends paid to Nakiwala Ruth (next of kin) Nov 2025.'
  },

  {
    id: 'nakachwa_fortunate',
    accountType: 'individual',
    primary: { name: 'Fortunate Nakachwa', role: 'Member' },
    displayName: 'Fortunate Nakachwa',
    email: '',
    phone: '',
    memberType: 'platinum',
    status: 'deceased',
    monthlySubscription: 0,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 300000, '2022': 405000, '2023': 480000 },
    totalSubscriptionUpTo2025: 0,
    loanEligibility: 0,
    welfareByYear: {},
    glaByYear: {},
    unitTrustByYear: {},
    dividendsTotal: 293835,
    estateValue: 1649136,
    notes: 'Deceased Sept 2023. Estate: principal 1,457,500 + dividends 191,636 = 1,649,136 UGX.'
  },

  // ─────────────────────────────────────────────
  // INACTIVE / DEPARTED
  // ─────────────────────────────────────────────

  {
    id: 'batenga_diana',
    accountType: 'individual',
    primary: { name: 'Diana Batenga Nalubega', role: 'Member' },
    displayName: 'Diana Batenga',
    email: '',
    phone: '',
    memberType: 'platinum',
    status: 'inactive',
    monthlySubscription: 0,
    joinYear: 2020,
    subscriptionByYear: { '2020': 205000, '2021': 176500 },
    totalSubscriptionUpTo2025: 381500,
    loanEligibility: 0,
    welfareByYear: { '2021': 35000 },
    glaByYear: {},
    unitTrustByYear: {},
    dividendsTotal: 0,
    notes: 'Stopped contributing mid-2021.'
  },

  {
    id: 'nampeewo_winfred',
    accountType: 'individual',
    primary: { name: 'Winfred Nampeewo', role: 'Member' },
    displayName: 'Winfred Nampeewo',
    email: '',
    phone: '',
    memberType: 'golden',
    status: 'diaspora',
    monthlySubscription: 20000,
    joinYear: 2025,
    subscriptionByYear: { '2025': 0, '2026': 0 },
    totalSubscriptionUpTo2025: 0,
    loanEligibility: 0,
    welfareByYear: {},
    glaByYear: {},
    unitTrustByYear: {},
    dividendsTotal: 0,
    notes: 'Diaspora. Pays diaspora fees only. Started Q4 2025.'
  }
];

// ============================================================
// JUNIORS COLLECTION
// Children of members — tracked under their own collection
// ============================================================
const juniors = [
  {
    id: 'lael_luutu',
    name: 'Lael Luutu',
    parentMemberId: 'luutu_daniel',
    parentName: 'Mr & Mrs Daniel Luutu',
    status: 'active',
    notes: 'Child of Daniel Luutu and Ruth Nagawa Luutu.'
  },
  {
    id: 'liam_orion_luutu',
    name: 'Liam Orion Luutu',
    parentMemberId: 'luutu_daniel',
    parentName: 'Mr & Mrs Daniel Luutu',
    status: 'active',
    notes: 'Child of Daniel Luutu and Ruth Nagawa Luutu.'
  }
];

// ============================================================
// COMMITTEES
// holder: 'primary' = husband/main member
// holder: 'secondary' = wife/co-member
// ============================================================
const committees = [
  {
    id: 'executive',
    name: 'Executive Committee',
    term: '2026-2028',
    members: [
      { memberId: 'kigonya_antonio',  holder: 'primary',   role: 'Chairperson' },
      { memberId: 'nuwahereza_edson', holder: 'primary',   role: 'Vice-Chairperson' },
      { memberId: 'luutu_daniel',     holder: 'primary',   role: 'Secretary' },
      { memberId: 'luutu_daniel',     holder: 'secondary', role: 'Deputy Secretary' },
      { memberId: 'claire_namutebi',  holder: 'primary',   role: 'Treasurer' },
      { memberId: 'nabuuma_teopista', holder: 'primary',   role: 'Deputy Treasurer' },
      { memberId: 'kyamulabi_diana',  holder: 'primary',   role: 'Club Mobiliser' },
    ]
  },
  {
    id: 'investment',
    name: 'Investment Committee',
    term: '2026-2028',
    members: [
      { memberId: 'kirabira_jude',   holder: 'primary', role: 'Chairperson' },
      { memberId: 'nsubuga_moses',   holder: 'primary', role: 'Secretary' },
      { memberId: 'babirye_joan',    holder: 'primary', role: 'Member' },
      { memberId: 'ssali_simon',     holder: 'primary', role: 'Member' },
    ]
  },
  {
    id: 'welfare',
    name: 'Welfare Committee',
    term: '2026-2028',
    members: [
      { memberId: 'kigonya_antonio',  holder: 'secondary', role: 'Chairperson' },
      { memberId: 'matovu_julius',    holder: 'primary',   role: 'Secretary' },
      { memberId: 'nabunnya_shamera', holder: 'primary',   role: 'Treasurer' },
      { memberId: 'namubiru_rose',    holder: 'primary',   role: 'Member' },
      { memberId: 'nalukenge_rashida',holder: 'primary',   role: 'Member' },
    ]
  },
  {
    id: 'disciplinary',
    name: 'Disciplinary Committee',
    term: '2026-2028',
    members: [
      { memberId: 'lule_stephen', holder: 'primary',   role: 'Patron / Chair' },
      { memberId: 'lule_stephen', holder: 'secondary', role: 'Patron' },
      { memberId: 'nakakande_shebah', holder: 'primary', role: 'Chief Whip' },
    ]
  },
  {
    id: 'diaspora',
    name: 'Diaspora',
    term: '2026-2028',
    members: [
      { memberId: 'nakiwala_ruth', holder: 'primary', role: 'Coordinator' },
    ]
  }
];

// ============================================================
// INVESTMENTS
// ============================================================
const investments = [
  {
    id: 'land_2023',
    name: 'Land Purchase',
    type: 'real_estate',
    dateAcquired: '2023-03-24',
    amountInvested: 33000000,
    currentValue: 250000000,
    status: 'active',
    description: 'Land purchased March 2023 for 33M UGX. Estimated current value 250M UGX.'
  },
  {
    id: 'unit_trust',
    name: 'ICEA Unit Trust Fund',
    type: 'unit_trust',
    dateAcquired: '2024-01-01',
    amountInvested: 6990000,
    currentValue: 6990000,
    status: 'active',
    description: 'Unit Trust contributions 2024-2026. 10,000/member/month (couples: 20,000).'
  },
  {
    id: 'gla',
    name: 'ICEA Group Life Assurance',
    type: 'insurance',
    dateAcquired: '2024-01-01',
    amountInvested: 9087000,
    currentValue: 9087000,
    status: 'active',
    description: 'GLA contributions 2024-2026. 13,000/member/month (couples: 26,000).'
  },
  {
    id: 'agro_chemicals',
    name: 'Nsanja Agro-Chemicals Trading',
    type: 'trading',
    dateAcquired: '2021-05-17',
    amountInvested: 52200000,
    totalReturns: 14850000,
    status: 'completed',
    description: 'Multiple rounds of agro-chemical trading 2021-2025. Total returns 14.85M UGX.'
  },
  {
    id: 'micro_lending',
    name: 'Micro-lending (2Fumbe, Eldaz)',
    type: 'micro_credit',
    dateAcquired: '2023-03-14',
    amountInvested: 10000000,
    totalReturns: 7500000,
    status: 'partially_recovered',
    description: 'Lending to 2Fumbe Kitchen Supplies and Eldaz Meat Parlour. Eldaz property recovered via legal action 2024.'
  }
];

// ============================================================
// CLUB FINANCIALS
// ============================================================
const clubFinancials = {
  asOf: '2026-03-29',
  bankBalance: {
    total: 40300878,
    breakdown: {
      welfare: {
        label: 'Welfare Fund',
        amount: 15035000,
        description: 'Total welfare contributions 2021-2026'
      },
      gla: {
        label: 'Group Life Assurance (ICEA)',
        amount: 9087000,
        description: 'GLA contributions 2024-2026 — held with ICEA'
      },
      unitTrust: {
        label: 'Unit Trust (ICEA)',
        amount: 6990000,
        description: 'Unit Trust contributions 2024-2026 — invested with ICEA'
      },
      letsGrowJunior: {
        label: "Let's Grow Juniors",
        amount: 4680000,
        description: 'Junior club subscriptions and welfare — separate account'
      },
      loansPool: {
        label: 'Available Loans Pool',
        amount: 4508878,
        description: 'Available for member loans. Max 25% of total subscription per member.'
      }
    }
  },
  investments: {
    land: { value: 250000000, description: 'Land purchase 2023 — estimated current value' },
    unitTrust: { value: 6990000, description: 'ICEA Unit Trust — ongoing' },
    gla: { value: 9087000, description: 'ICEA Group Life Assurance — ongoing' }
  },
  totalAssets: 306377878,
  totalIncome: 134393100,
  totalExpenses: 94092222,
  returnOnInvestment: 22850000,
  lastUpdated: '2026-03-29'
};

const bankBalance = {
  total: 40300878,
  welfare: 15035000,
  gla: 9087000,
  unitTrust: 6990000,
  letsGrowJunior: 4680000,
  loansPool: 4508878,
  lastUpdated: '2026-03-29'
};

const loanRules = {
  eligibilityBasis: 'Total subscription contributions up to end of previous year',
  maxLoanPercent: 0.25,
  currentReferenceYear: 2025,
  requirement: 'Member must be fully subscribed up to current active month to qualify',
  interestRate: 0.10,
  description: 'Loans available after 5 years of club operation. Max 25% of total subscriptions to end of previous year.'
};

// ============================================================
// SEED TO FIRESTORE
// ============================================================
async function seed() {
  // Batch 1: Members + club docs
  const batch1 = db.batch();
  for (const m of members) {
    batch1.set(
      db.collection('members').doc(m.id),
      { ...m, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    );
  }
  batch1.set(db.collection('club').doc('financials'), clubFinancials);
  batch1.set(db.collection('club').doc('bankBalance'), bankBalance);
  batch1.set(db.collection('club').doc('loanRules'), loanRules);
  await batch1.commit();
  console.log(`✅ Batch 1: ${members.length} members + club docs`);

  // Batch 2: Committees + Investments
  const batch2 = db.batch();
  for (const c of committees) {
    batch2.set(db.collection('committees').doc(c.id), c);
  }
  for (const inv of investments) {
    batch2.set(db.collection('investments').doc(inv.id), inv);
  }
  await batch2.commit();
  console.log(`✅ Batch 2: ${committees.length} committees + ${investments.length} investments`);

  // Batch 3: Juniors
  const batch3 = db.batch();
  for (const j of juniors) {
    batch3.set(db.collection('juniors').doc(j.id), j);
  }
  await batch3.commit();
  console.log(`✅ Batch 3: ${juniors.length} juniors`);

  console.log('\n🎉 All data seeded successfully!');
  console.log(`📊 Bank Balance: UGX ${bankBalance.total.toLocaleString()}`);
  console.log(`👨‍👩‍👧‍👦 Joint accounts: ${members.filter(m => m.accountType === 'joint').length}`);
  console.log(`👤 Individual accounts: ${members.filter(m => m.accountType === 'individual').length}`);
  console.log(`🧒 Juniors: ${juniors.length}`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
