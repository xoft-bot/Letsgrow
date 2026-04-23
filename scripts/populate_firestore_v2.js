// ============================================================
// LETS GROW INVESTMENT CLUB - FIRESTORE POPULATION SCRIPT V2
// Corrected member statuses based on 2025 payment data + AGM
// Run: node populate_firestore_v2.js
// ============================================================

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'letsgrowinvestmentclub-26878'
});

const db = admin.firestore();

// ============================================================
// MEMBER STATUS RULES:
// active   = fully paid all 12 months 2025
// partial  = paid some months 2025 (arrears)
// inactive = 0 months paid 2025
// deceased = confirmed departed (AGM Dec 2024)
// exited   = voluntarily left
// diaspora = active but paying diaspora rate
// ============================================================

const MEMBERS = [

  // ── PLATINUM COUPLES (joint accounts — each person separate doc) ──

  // SEKIRANDA family — 12 months paid 2025 ✅
  {
    id: 'sekiranda-simon',
    name: 'Sekiranda Simon',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'natuhwera-neria', jointLabel: 'MR & MRS SEKIRANDA',
    monthlyRate: 80000, joinYear: 2020,
    totalSubscriptions2025: 960000, totalWelfare2025: 240000,
    shareCapital: { 2020: 410000, 2021: 600000, 2022: 810000, 2023: 960000, 2024: 960000, 2025: 960000 },
    loanEligibility: Math.round(960000 * 0.25),
  },
  {
    id: 'natuhwera-neria',
    name: 'Natuhwera Neria',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'sekiranda-simon', jointLabel: 'MR & MRS SEKIRANDA',
    monthlyRate: 0, joinYear: 2020,
    note: 'Joint account with Sekiranda Simon. Also serves as Treasurer.',
  },

  // LULE family — 12 months paid 2025 ✅
  {
    id: 'lule-stephen',
    name: 'Lule Stephen Musisi',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'nabukeera-juliet', jointLabel: 'MR & MRS LULE STEPHEN',
    monthlyRate: 80000, joinYear: 2020,
    totalSubscriptions2025: 960000, totalWelfare2025: 240000,
    shareCapital: { 2020: 410000, 2021: 600000, 2022: 810000, 2023: 960000, 2024: 960000, 2025: 960000 },
    loanEligibility: Math.round(960000 * 0.25),
    note: 'Club Patron',
  },
  {
    id: 'nabukeera-juliet',
    name: 'Nabukeera Juliet',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'lule-stephen', jointLabel: 'MR & MRS LULE STEPHEN',
    monthlyRate: 0, joinYear: 2020,
  },

  // LUUTU family — 12 months paid 2025 ✅
  {
    id: 'luutu-daniel',
    name: 'Luutu Daniel',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'nagawa-ruth', jointLabel: 'MR & MRS LUUTU',
    monthlyRate: 80000, joinYear: 2020,
    totalSubscriptions2025: 960000, totalWelfare2025: 240000,
    shareCapital: { 2020: 410000, 2021: 600000, 2022: 810000, 2023: 960000, 2024: 960000, 2025: 960000 },
    loanEligibility: Math.round(960000 * 0.25),
  },
  {
    id: 'nagawa-ruth',
    name: 'Nagawa Ruth',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'luutu-daniel', jointLabel: 'MR & MRS LUUTU',
    monthlyRate: 0, joinYear: 2020,
  },

  // KIGONYA family — 12 months paid 2025 ✅
  {
    id: 'kigonya-antonio',
    name: 'Kigonya Antonio',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'bangi-aidah', jointLabel: 'MR & MRS KIGONYA',
    monthlyRate: 80000, joinYear: 2020,
    totalSubscriptions2025: 960000, totalWelfare2025: 240000,
    shareCapital: { 2020: 410000, 2021: 600000, 2022: 810000, 2023: 960000, 2024: 960000, 2025: 960000 },
    loanEligibility: Math.round(960000 * 0.25),
    note: 'Club Secretary',
  },
  {
    id: 'bangi-aidah',
    name: 'Bangi Aidah',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'kigonya-antonio', jointLabel: 'MR & MRS KIGONYA',
    monthlyRate: 0, joinYear: 2020,
  },

  // KIRABIRA family — 12 months paid 2025 ✅
  {
    id: 'kirabira-jude',
    name: 'Kirabira Jude',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'nansubuga-jane', jointLabel: 'MR & MRS KIRABIRA',
    monthlyRate: 80000, joinYear: 2020,
    totalSubscriptions2025: 960000, totalWelfare2025: 240000,
    shareCapital: { 2020: 410000, 2021: 600000, 2022: 810000, 2023: 960000, 2024: 960000, 2025: 960000 },
    loanEligibility: Math.round(960000 * 0.25),
    note: 'Outgoing Chairperson 2023-2025',
  },
  {
    id: 'nansubuga-jane',
    name: 'Nansubuga Jane Frances',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'kirabira-jude', jointLabel: 'MR & MRS KIRABIRA',
    monthlyRate: 0, joinYear: 2021,
  },

  // SSALI family — 12 months paid 2025 ✅
  {
    id: 'ssali-simon',
    name: 'Ssali Simon Peter',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'ndagire-rona', jointLabel: 'MR & MRS SSALI',
    monthlyRate: 80000, joinYear: 2020,
    totalSubscriptions2025: 960000, totalWelfare2025: 240000,
    shareCapital: { 2020: 410000, 2021: 600000, 2022: 810000, 2023: 960000, 2024: 960000, 2025: 960000 },
    loanEligibility: Math.round(960000 * 0.25),
  },
  {
    id: 'ndagire-rona',
    name: 'Ndagire Rona Jjukko',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'ssali-simon', jointLabel: 'MR & MRS SSALI',
    monthlyRate: 0, joinYear: 2020,
    note: 'Investment Committee Chairperson',
  },

  // MATOVU family — 12 months paid 2025 ✅
  {
    id: 'matovu-julius',
    name: 'Matovu Julius',
    tier: 'platinum', status: 'active',
    accountType: 'joint', jointWith: 'matovu-wife', jointLabel: 'MR & MRS MATOVU',
    monthlyRate: 80000, joinYear: 2021,
    totalSubscriptions2025: 960000, totalWelfare2025: 240000,
    shareCapital: { 2021: 600000, 2022: 810000, 2023: 960000, 2024: 960000, 2025: 960000 },
    loanEligibility: Math.round(960000 * 0.25),
  },

  // SSETUMBA family — 0 months paid 2025 ❌ INACTIVE
  {
    id: 'ssetumba-david',
    name: 'Ssetumba David',
    tier: 'platinum', status: 'inactive',
    accountType: 'joint', jointWith: 'ssetumba-wife', jointLabel: 'MR & MRS SSETUMBA',
    monthlyRate: 80000, joinYear: 2021,
    totalSubscriptions2025: 0, totalWelfare2025: 0,
    note: 'Absent with apology AGM 2024. 0 months paid 2025.',
    loanEligibility: 0,
  },

  // SAM SEBUDDE — 3 months paid 2025, then dropped ❌ EXITED
  {
    id: 'sam-sebudde',
    name: 'Ssebudde Samuel',
    tier: 'platinum', status: 'exited',
    accountType: 'single', jointWith: null,
    monthlyRate: 80000, joinYear: 2020,
    totalSubscriptions2025: 84000, totalWelfare2025: 20000,
    note: 'Exited mid-2025. Was active 2020-2024.',
    exitYear: 2025,
    shareCapital: { 2020: 410000, 2021: 600000, 2022: 810000, 2023: 960000, 2024: 960000 },
  },

  // ── PLATINUM INDIVIDUALS ──────────────────────────────────────

  { id: 'nabunya-shamera',   name: 'Nabunya Shamera',        tier: 'platinum', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 480000, shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'namubiru-winnie',   name: 'Namubiru Winnie',        tier: 'platinum', status: 'inactive', accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 0,      note: 'Not in 2025 sheet — inactive', loanEligibility: 0 },
  { id: 'kyamulabi-diana',   name: 'Kyamulabi Dianah',       tier: 'platinum', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 480000, shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'namutebi-claire',   name: 'Namutebi Claire',        tier: 'platinum', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 480000, shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'nuwahereza-edson',  name: 'Nuwahereza Edson',       tier: 'platinum', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 480000, shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25), email: 'pedsoule@gmail.com', role: 'admin' },
  { id: 'kintu-ernest',      name: 'Kintu Ernest Steven',    tier: 'platinum', status: 'partial',  accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 352000, note: '9 months paid 2025 — arrears', shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000, 2025: 352000 }, loanEligibility: Math.round(352000*0.25) },
  { id: 'naggayi-constance', name: 'Naggayi Constance',      tier: 'platinum', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 480000, shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'nabuuma-teopista',  name: 'Nabuuma Teopista',       tier: 'platinum', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 480000, shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'namubiru-rose',     name: 'Namubiru Rose',          tier: 'platinum', status: 'diaspora', accountType: 'single', monthlyRate: 40000, joinYear: 2020, totalSubscriptions2025: 480000, shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'mwidu-geofrey',     name: 'Mwidu Geofrey',          tier: 'platinum', status: 'inactive', accountType: 'single', monthlyRate: 40000, joinYear: 2020, note: 'Not in 2025 sheet', loanEligibility: 0 },
  { id: 'batenga-diana',     name: 'Batenga Diana Nalubega', tier: 'platinum', status: 'inactive', accountType: 'single', monthlyRate: 40000, joinYear: 2020, note: 'Not in 2025 sheet', loanEligibility: 0 },
  { id: 'nampeewo-winfred',  name: 'Nampeewo Winfred Faith', tier: 'platinum', status: 'inactive', accountType: 'single', monthlyRate: 40000, joinYear: 2021, note: 'Not in 2025 sheet', loanEligibility: 0 },
  { id: 'nakimuli-annet',    name: 'Nakimuli Annet',         tier: 'platinum', status: 'inactive', accountType: 'single', monthlyRate: 40000, joinYear: 2021, note: 'Not in 2025 sheet', loanEligibility: 0 },
  { id: 'nanfuka-jane',      name: 'Nanfuka Jane',           tier: 'platinum', status: 'inactive', accountType: 'single', monthlyRate: 40000, joinYear: 2020, note: 'Not in 2025 sheet', loanEligibility: 0 },

  // ── DECEASED (estate accounts preserved) ──────────────────────
  {
    id: 'namuyimba-keneth',
    name: 'Namuyimba Keneth',
    tier: 'platinum', status: 'deceased',
    accountType: 'single', monthlyRate: 40000, joinYear: 2020,
    deceasedYear: 2024,
    note: 'Departed. Remembered at AGM Dec 2024. Estate account active.',
    shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000 },
    estateAccount: true, estateValue: 1181500,
  },
  {
    id: 'nakachwa-fortunate',
    name: 'Nakachwa Fortunate',
    tier: 'platinum', status: 'deceased',
    accountType: 'single', monthlyRate: 40000, joinYear: 2020,
    deceasedYear: 2024,
    note: 'Departed. Remembered at AGM Dec 2024. Estate account active.',
    shareCapital: { 2020: 205000, 2021: 300000, 2022: 405000, 2023: 480000, 2024: 480000 },
    estateAccount: true, estateValue: 1457500,
  },

  // ── GOLDEN MEMBERS ────────────────────────────────────────────
  { id: 'nalukenge-rashida', name: 'Nalukenge Rashida',      tier: 'gold', status: 'diaspora', accountType: 'single', monthlyRate: 40000, joinYear: 2022, totalSubscriptions2025: 480000, shareCapital: { 2022: 240000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'nakakande-shebah',  name: 'Nakakande Batsheba',     tier: 'gold', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2022, totalSubscriptions2025: 480000, shareCapital: { 2022: 240000, 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'nsubuga-moses',     name: 'Nsubuga Moses',          tier: 'gold', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2023, totalSubscriptions2025: 480000, shareCapital: { 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'babirye-joan',      name: 'Babirye Joan',           tier: 'gold', status: 'partial',  accountType: 'single', monthlyRate: 40000, joinYear: 2023, totalSubscriptions2025: 120000, note: '3 months paid 2025 — arrears', loanEligibility: 0 },
  { id: 'nakiwala-ruth',     name: 'Nakiwala Ruth',          tier: 'gold', status: 'diaspora', accountType: 'single', monthlyRate: 40000, joinYear: 2023, totalSubscriptions2025: 480000, shareCapital: { 2023: 480000, 2024: 480000, 2025: 480000 }, loanEligibility: Math.round(480000*0.25) },
  { id: 'achom-phionah',     name: 'Achom Phionah',          tier: 'gold', status: 'inactive', accountType: 'single', monthlyRate: 40000, joinYear: 2022, note: 'Absent with apology AGM 2024. Not in 2025 sheet.', loanEligibility: 0 },
  { id: 'mabaale-james',     name: 'Mabaale James',          tier: 'gold', status: 'active',   accountType: 'single', monthlyRate: 40000, joinYear: 2026, totalSubscriptions2025: 410000, note: 'New entrant 2026', loanEligibility: 0 },
];

// ── JUNIORS ────────────────────────────────────────────────────
const JUNIORS = [
  { id: 'junior-nathan-jade',  name: 'Nathan Jade Lule Luutu',         parentId: 'lule-stephen',    monthlyRate: 20000, status: 'active', joinYear: 2024 },
  { id: 'junior-jasper-ssali', name: 'Jasper Ssali Ssewanonda',        parentId: 'ssali-simon',     monthlyRate: 20000, status: 'active', joinYear: 2024 },
  { id: 'junior-ryan-lule',    name: 'Ryan Cyprian Lule Lwanga',       parentId: 'lule-stephen',    monthlyRate: 20000, status: 'partial', joinYear: 2024, note: '4 months paid 2024' },
  { id: 'junior-hezel-matovu', name: 'Hezel Wenceslaus Adrian Matovu', parentId: 'matovu-julius',   monthlyRate: 20000, status: 'active', joinYear: 2024 },
  { id: 'junior-ndagire-sky',  name: 'Ndagire Catherine Skylar',       parentId: 'ndagire-rona',    monthlyRate: 20000, status: 'partial', joinYear: 2024, note: '1 month paid 2024' },
  { id: 'junior-erik-nuwah',   name: 'Erik Danil Nuwahereza',          parentId: 'nuwahereza-edson',monthlyRate: 20000, status: 'inactive', joinYear: 2024 },
];

// ── ESTATE ACCOUNTS ────────────────────────────────────────────
const ESTATES = [
  { id: 'estate-namuyimba',  memberId: 'namuyimba-keneth',   memberName: 'Namuyimba Keneth',   principal: 1181500, startDate: '2023-04-01', status: 'active', nextOfKin: 'TBD' },
  { id: 'estate-nakachwa',   memberId: 'nakachwa-fortunate', memberName: 'Nakachwa Fortunate', principal: 1457500, startDate: '2023-09-01', status: 'active', nextOfKin: 'TBD' },
];

// ── FINANCIALS ─────────────────────────────────────────────────
const FINANCIALS = {
  bankBalance:      37714589,
  totalInflow:      123183100,
  totalInvested:    75460000,
  confirmedROI:     17850000,
  unitTrustBalance: 8267148,
  closingYear:      2025,
  reportDate:       '2026-02-07',
};

// ── INVESTMENTS ────────────────────────────────────────────────
const INVESTMENTS = [
  { id: 'inv-nsanja-2021',   name: 'Nsanja Agro Chemicals (2021)',  type: 'trade',       amount: 4900000,  returns: 580000,  status: 'closed',  year: 2021 },
  { id: 'inv-2fumbe-2023a',  name: '2Fumbe Kitchen Supplies (Mar)', type: 'loan',        amount: 5000000,  returns: 790000,  status: 'closed',  year: 2023 },
  { id: 'inv-2fumbe-2023b',  name: '2Fumbe Kitchen Supplies (Mar)', type: 'loan',        amount: 2000000,  returns: 360000,  status: 'closed',  year: 2023 },
  { id: 'inv-elders-2023',   name: 'Elders Meat Parlour',           type: 'loan',        amount: 3000000,  returns: 960000,  status: 'partial', year: 2023, note: 'Collateral chairs sold. Balance UGX 1,000,000 pending as at AGM Dec 2024.' },
  { id: 'inv-land-2023',     name: 'Land / Estate — Busukuma',      type: 'real_estate', amount: 50000000, returns: 0,       status: 'active',  year: 2023, note: 'Strategic long-term asset. Members advised to find buyers or develop.' },
  { id: 'inv-nsanja-2024',   name: 'Nsanja Agro Chemicals (2024)',  type: 'trade',       amount: 5000000,  returns: 600000,  status: 'closed',  year: 2024 },
  { id: 'inv-unit-trust',    name: 'ICEA Uganda Money Market Fund', type: 'unit_trust',  amount: 7200000,  returns: 1067148, status: 'active',  year: 2024, balance: 8267148, annualReturn: 10.2, note: 'Stable low-risk investment. Monthly interest accruing.' },
];

// ── 2025 CONTRIBUTIONS (months 0-11 = Jan-Dec) ─────────────────
const CONTRIBUTIONS_2025 = [
  { memberId: 'sekiranda-simon',   months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 80000 },
  { memberId: 'lule-stephen',      months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 80000 },
  { memberId: 'luutu-daniel',      months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 80000 },
  { memberId: 'kigonya-antonio',   months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 80000 },
  { memberId: 'kirabira-jude',     months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 80000 },
  { memberId: 'ssali-simon',       months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 80000 },
  { memberId: 'matovu-julius',     months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 80000 },
  { memberId: 'nabunya-shamera',   months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'kyamulabi-diana',   months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'namutebi-claire',   months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'nuwahereza-edson',  months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'naggayi-constance', months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'nabuuma-teopista',  months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'namubiru-rose',     months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'nalukenge-rashida', months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'nakakande-shebah',  months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'nsubuga-moses',     months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  { memberId: 'nakiwala-ruth',     months: [0,1,2,3,4,5,6,7,8,9,10,11], rate: 40000 },
  // Partial
  { memberId: 'kintu-ernest',      months: [0,1,2,3,4,5,6,7,8], rate: 40000 },
  { memberId: 'sam-sebudde',       months: [0,1,2], rate: 80000 },
  { memberId: 'babirye-joan',      months: [0,1,2], rate: 40000 },
  { memberId: 'mabaale-james',     months: [0], rate: 40000 },
];

// ── APPROVED EMAILS ────────────────────────────────────────────
const APPROVED_EMAILS = [
  { email: 'pedsoule@gmail.com', role: 'admin', memberId: 'nuwahereza-edson', name: 'Nuwahereza Edson' },
];

// ── LOANS ──────────────────────────────────────────────────────
const LOANS = [
  { id: 'loan-2fumbe-1', memberName: '2Fumbe Kitchen Supplies', amount: 5000000, interestRate: 0.10, status: 'cleared', issuedDate: '2023-03-14', clearedDate: '2023-04-28', amountPaid: 5790000 },
  { id: 'loan-2fumbe-2', memberName: '2Fumbe Kitchen Supplies', amount: 2000000, interestRate: 0.10, status: 'cleared', issuedDate: '2023-03-21', clearedDate: '2023-04-28', amountPaid: 2360000 },
  { id: 'loan-elders',   memberName: 'Elders Meat Parlour',     amount: 3000000, interestRate: 0.15, status: 'partial', issuedDate: '2023-03-21', note: 'Balance UGX 1,000,000 pending', amountPaid: 2000000, balance: 1000000 },
];

// ── YEARLY FINANCIALS HISTORY ──────────────────────────────────
const YEARLY_SUMMARY = [
  { year: 2023, subscriptions: 14720000, welfare: 3680000, diaspora: 500000, investmentReturns: 2830000, totalInflows: 21730000 },
  { year: 2024, subscriptions: 16460000, welfare: 4120000, diaspora: 520000, gla: 4628000, unitTrust: 3560000, investmentReturns: 2400000, totalInflows: 31688000 },
  { year: 2025, subscriptions: 11998000, welfare: 2955000, diaspora: 600000, membershipFees: 1342600, gla: 3480000, unitTrust: 2657000, investmentReturns: 0, totalInflows: 23032600 },
];

// ============================================================
// WRITE TO FIRESTORE
// ============================================================
async function populate() {
  console.log('🚀 Starting corrected Firestore population V2...\n');

  // Clear old members first
  console.log('🧹 Clearing old member data...');
  const oldMembers = await db.collection('members').get();
  const delBatch = db.batch();
  oldMembers.docs.forEach(d => delBatch.delete(d.ref));
  await delBatch.commit();

  const oldContribs = await db.collection('contributions').get();
  const delBatch2 = db.batch();
  oldContribs.docs.forEach(d => delBatch2.delete(d.ref));
  await delBatch2.commit();
  console.log('   ✅ Old data cleared\n');

  // 1. Members
  console.log('📝 Writing members...');
  const bM = db.batch();
  for (const m of MEMBERS) {
    bM.set(db.collection('members').doc(m.id), { ...m, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await bM.commit();
  console.log(`   ✅ ${MEMBERS.length} members`);

  // 2. Juniors
  console.log('📝 Writing juniors...');
  const bJ = db.batch();
  for (const j of JUNIORS) {
    bJ.set(db.collection('juniors').doc(j.id), { ...j, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await bJ.commit();
  console.log(`   ✅ ${JUNIORS.length} juniors`);

  // 3. Estates
  console.log('📝 Writing estate accounts...');
  const bE = db.batch();
  for (const e of ESTATES) {
    bE.set(db.collection('estates').doc(e.id), { ...e, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await bE.commit();
  console.log(`   ✅ ${ESTATES.length} estate accounts`);

  // 4. Financials
  console.log('📝 Writing financials...');
  await db.collection('settings').doc('financials').set({ ...FINANCIALS, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log('   ✅ Financials');

  // 5. Yearly summary
  console.log('📝 Writing yearly summaries...');
  const bY = db.batch();
  for (const y of YEARLY_SUMMARY) {
    bY.set(db.collection('yearlySummary').doc(String(y.year)), { ...y, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await bY.commit();
  console.log(`   ✅ ${YEARLY_SUMMARY.length} yearly records`);

  // 6. Investments
  console.log('📝 Writing investments...');
  const bI = db.batch();
  for (const inv of INVESTMENTS) {
    bI.set(db.collection('investments').doc(inv.id), { ...inv, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await bI.commit();
  console.log(`   ✅ ${INVESTMENTS.length} investments`);

  // 7. Contributions
  console.log('📝 Writing 2025 contributions...');
  const bC = db.batch();
  let cCount = 0;
  for (const c of CONTRIBUTIONS_2025) {
    for (const mo of c.months) {
      bC.set(db.collection('contributions').doc(`${c.memberId}-2025-${mo}`), {
        memberId: c.memberId, month: mo, year: 2025,
        amount: c.rate, status: 'paid',
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      cCount++;
    }
  }
  await bC.commit();
  console.log(`   ✅ ${cCount} contribution records`);

  // 8. Loans
  console.log('📝 Writing loans...');
  const bL = db.batch();
  for (const loan of LOANS) {
    bL.set(db.collection('loans').doc(loan.id), { ...loan, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await bL.commit();
  console.log(`   ✅ ${LOANS.length} loans`);

  // 9. Approved emails
  console.log('📝 Writing approved emails...');
  const bAE = db.batch();
  for (const e of APPROVED_EMAILS) {
    bAE.set(db.collection('approvedEmails').doc(e.email), { ...e, addedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await bAE.commit();
  console.log(`   ✅ ${APPROVED_EMAILS.length} approved emails`);

  // 10. Committee
  await db.collection('settings').doc('committee').set({
    current: { chairperson: 'TBD — 2026 AGM', treasurer: 'Natuhwera Neria Sekiranda', secretary: 'Kigonya Antonio' },
    term: '2026-2028',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('\n🎉 DONE! Corrected Firestore populated.');
  console.log('\n📋 Member Status Summary:');
  const active   = MEMBERS.filter(m => m.status === 'active').length;
  const partial  = MEMBERS.filter(m => m.status === 'partial').length;
  const inactive = MEMBERS.filter(m => m.status === 'inactive').length;
  const deceased = MEMBERS.filter(m => m.status === 'deceased').length;
  const exited   = MEMBERS.filter(m => m.status === 'exited').length;
  const diaspora = MEMBERS.filter(m => m.status === 'diaspora').length;
  console.log(`   Active:   ${active}`);
  console.log(`   Diaspora: ${diaspora}`);
  console.log(`   Partial:  ${partial}`);
  console.log(`   Inactive: ${inactive}`);
  console.log(`   Deceased: ${deceased} (estate accounts preserved)`);
  console.log(`   Exited:   ${exited}`);

  process.exit(0);
}

populate().catch(err => { console.error('❌ Error:', err); process.exit(1); });
