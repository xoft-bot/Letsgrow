// ============================================================
// LETS GROW INVESTMENT CLUB - FIRESTORE POPULATION SCRIPT
// Run: node populate_firestore.js
// Install deps first: npm install firebase-admin
// ============================================================

const admin = require('firebase-admin');

// ── PASTE YOUR SERVICE ACCOUNT KEY PATH OR INLINE IT ──────
// Option A: Download service account key from Firebase Console
// Project Settings → Service Accounts → Generate new private key
// Save as serviceAccount.json in same folder, then run script
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'letsgrowinvestmentclub-26878'
});

const db = admin.firestore();

// ============================================================
// DATA
// ============================================================

// ── PLATINUM MEMBERS (27 founders per constitution) ──────────
// Couples split into individual accounts per constitution Sec 15
// Joint accounts noted where applicable

const MEMBERS = [
  // PLATINUM - COUPLES (joint accounts)
  { id: 'sekiranda-simon',       name: 'Sekiranda Simon',        email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'sekiranda-neria',    monthlyRate: 80000 },
  { id: 'natuhwera-neria',       name: 'Natuhwera Neria',        email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'sekiranda-simon',    monthlyRate: 0 },
  { id: 'lule-stephen',         name: 'Lule Stephen Musisi',    email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'nabukeera-juliet',   monthlyRate: 80000 },
  { id: 'nabukeera-juliet',     name: 'Nabukeera Juliet',       email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'lule-stephen',       monthlyRate: 0 },
  { id: 'luutu-daniel',         name: 'Luutu Daniel',           email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'nagawa-ruth',        monthlyRate: 80000 },
  { id: 'nagawa-ruth',          name: 'Nagawa Ruth',            email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'luutu-daniel',       monthlyRate: 0 },
  { id: 'kigonya-antonio',      name: 'Kigonya Antonio',        email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'bangi-aidah',        monthlyRate: 80000 },
  { id: 'bangi-aidah',          name: 'Bangi Aidah',            email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'kigonya-antonio',    monthlyRate: 0 },
  { id: 'ssebudde-samuel',      name: 'Ssebudde Samuel',        email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'ssebudde-wife',      monthlyRate: 80000 },
  { id: 'kirabira-jude',        name: 'Kirabira Jude',          email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'nansubuga-jane',     monthlyRate: 80000 },
  { id: 'nansubuga-jane',       name: 'Nansubuga Jane Frances', email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'kirabira-jude',      monthlyRate: 0 },
  { id: 'ssali-simon',          name: 'Ssali Simon Peter',      email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'ndagire-rona',       monthlyRate: 80000 },
  { id: 'ndagire-rona',         name: 'Ndagire Rona Jjukko',    email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'ssali-simon',        monthlyRate: 0 },
  { id: 'matovu-julius',        name: 'Matovu Julius',          email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'matovu-wife',        monthlyRate: 80000 },
  { id: 'ssetumba-david',       name: 'Ssetumba David',         email: '',               tier: 'platinum', status: 'active',   accountType: 'joint',  jointWith: 'ssetumba-wife',      monthlyRate: 80000 },

  // PLATINUM - INDIVIDUAL
  { id: 'nabunya-shamera',      name: 'Nabunya Shamera',        email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'namubiru-winnie',      name: 'Namubiru Winnie',        email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'kyamulabi-diana',      name: 'Kyamulabi Dianah Catherine', email: '',           tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'namutebi-claire',      name: 'Namutebi Claire',        email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nuwahereza-edson',     name: 'Nuwahereza Edson',       email: 'pedsoule@gmail.com', tier: 'platinum', status: 'active', accountType: 'single', jointWith: null,               monthlyRate: 40000 },
  { id: 'kintu-ernest',         name: 'Kintu Ernest Steven',    email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'naggayi-constance',    name: 'Naggayi Constance',      email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nabuuma-teopista',     name: 'Nabuuma Teopista',       email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nanfuka-jane',         name: 'Nanfuka Jane',           email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'namubiru-rose',        name: 'Namubiru Rose',          email: '',               tier: 'platinum', status: 'diaspora', accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'mwidu-geofrey',        name: 'Mwidu Geofrey',          email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nakacwa-fortunate',    name: 'Nakacwa Fortunate',      email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'namuyimba-keneth',     name: 'Namuyimba Keneth',       email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'batenga-diana',        name: 'Batenga Diana Nalubega', email: '',               tier: 'platinum', status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },

  // GOLDEN MEMBERS (new entrants from sheets not in constitution)
  { id: 'nalukenge-rashida',    name: 'Nalukenge Rashida',      email: '',               tier: 'gold',     status: 'diaspora', accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nakakande-shebah',     name: 'Nakakande Shebah',       email: '',               tier: 'gold',     status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nsubuga-moses',        name: 'Nsubuga Moses',          email: '',               tier: 'gold',     status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'babirye-joan',         name: 'Babirye Joan',           email: '',               tier: 'gold',     status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nakiwala-ruth',        name: 'Nakiwala Ruth',          email: '',               tier: 'gold',     status: 'diaspora', accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'mabaale-james',        name: 'Mabaale James',          email: '',               tier: 'gold',     status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'achom-phionah',        name: 'Achom Phionah',          email: '',               tier: 'gold',     status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nakimuli-annet',       name: 'Nakimuli Annet',         email: '',               tier: 'gold',     status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'nampeewo-winfred',     name: 'Nampeewo Winfred Faith', email: '',               tier: 'gold',     status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
  { id: 'sam-sebudde',          name: 'Sam Sebudde',            email: '',               tier: 'gold',     status: 'active',   accountType: 'single', jointWith: null,                 monthlyRate: 40000 },
];

// ── JUNIOR MEMBERS ────────────────────────────────────────────
const JUNIORS = [
  { id: 'junior-nathan-jade',   name: 'Nathan Jade Lule Luutu',         parentId: 'lule-stephen',    monthlyRate: 20000, status: 'active' },
  { id: 'junior-jasper-ssali',  name: 'Jasper Ssali Ssewanonda',        parentId: 'ssali-simon',     monthlyRate: 20000, status: 'active' },
  { id: 'junior-ryan-lule',     name: 'Ryan Cyprian Lule Lwanga',       parentId: 'lule-stephen',    monthlyRate: 20000, status: 'active' },
  { id: 'junior-hezel-matovu',  name: 'Hezel Wenceslaus Adrian Matovu', parentId: 'matovu-julius',   monthlyRate: 20000, status: 'active' },
  { id: 'junior-ndagire-sky',   name: 'Ndagire Catherine Skylar',       parentId: 'ndagire-rona',    monthlyRate: 20000, status: 'active' },
  { id: 'junior-erik-nuwah',    name: 'Erik Danil Nuwahereza',          parentId: 'nuwahereza-edson',monthlyRate: 20000, status: 'active' },
];

// ── FINANCIALS (from financial report FY2023-2025) ────────────
const FINANCIALS = {
  bankBalance:   37714589,  // from bank statement March 2026
  totalInflow:   123183100,
  totalInvested: 75460000,
  confirmedROI:  17850000,
  unitTrustBalance: 8267148,
  closingYear:   2025,
  updatedAt:     new Date('2026-02-07'),
};

// ── INVESTMENTS ────────────────────────────────────────────────
const INVESTMENTS = [
  { id: 'inv-nsanja-2021',      name: 'Nsanja Agro Chemicals',        type: 'trade',      amount: 4900000,  returns: 580000,   status: 'closed',  year: 2021 },
  { id: 'inv-2fumbe-2023a',     name: '2Fumbe Kitchen Supplies (1)',  type: 'loan',       amount: 5000000,  returns: 790000,   status: 'closed',  year: 2023 },
  { id: 'inv-2fumbe-2023b',     name: '2Fumbe Kitchen Supplies (2)',  type: 'loan',       amount: 2000000,  returns: 360000,   status: 'closed',  year: 2023 },
  { id: 'inv-elders-2023',      name: 'Elders Meat Parlour',          type: 'loan',       amount: 3000000,  returns: 1200000,  status: 'partial', year: 2023 },
  { id: 'inv-land-2023',        name: 'Land / Estate Project',        type: 'real_estate',amount: 50000000, returns: 0,        status: 'active',  year: 2023, note: 'Long-term strategic asset' },
  { id: 'inv-nsanja-2024',      name: 'Nsanja Agro Chemicals 2024',   type: 'trade',      amount: 5000000,  returns: 600000,   status: 'closed',  year: 2024 },
  { id: 'inv-unit-trust',       name: 'ICEA Uganda Money Market Fund',type: 'unit_trust', amount: 7200000,  returns: 1067148,  status: 'active',  year: 2024, note: 'Balance: UGX 8,267,148' },
];

// ── CONTRIBUTIONS (2025 - months 0-11 = Jan-Dec) ──────────────
// Based on financial report: total subscriptions 2025 = 11,998,000
// All members who appear in 2025 sheet with data are marked paid
// SAM SEBUDDE dropped off mid-year (only 2 months + partial)
const CONTRIBUTIONS_2025 = [
  // Full year paid members (12 months)
  { memberId: 'sekiranda-simon',   months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'lule-stephen',      months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'luutu-daniel',      months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'kigonya-antonio',   months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'kirabira-jude',     months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'ssali-simon',       months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'matovu-julius',     months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'nabunya-shamera',   months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'kyamulabi-diana',   months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'namutebi-claire',   months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'nuwahereza-edson',  months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'kintu-ernest',      months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'naggayi-constance', months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'nabuuma-teopista',  months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'namubiru-rose',     months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'nalukenge-rashida', months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'nakakande-shebah',  months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'nsubuga-moses',     months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'babirye-joan',      months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'nakiwala-ruth',     months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { memberId: 'ssetumba-david',    months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  // Partial year
  { memberId: 'sam-sebudde',       months: [0,1] }, // dropped off
];

// ── APPROVED EMAILS (add all member emails here) ──────────────
const APPROVED_EMAILS = [
  { email: 'pedsoule@gmail.com', role: 'admin', name: 'Nuwahereza Edson', memberId: 'nuwahereza-edson' },
  // Add more emails as members register — admin can add via app
];

// ── LOANS (business loans from records) ───────────────────────
const LOANS = [
  { id: 'loan-2fumbe-1', memberName: '2Fumbe Kitchen Supplies', amount: 5000000, interestRate: 0.10, status: 'cleared', issuedDate: '2023-03-14', clearedDate: '2023-04-28' },
  { id: 'loan-2fumbe-2', memberName: '2Fumbe Kitchen Supplies', amount: 2000000, interestRate: 0.10, status: 'cleared', issuedDate: '2023-03-21', clearedDate: '2023-04-28' },
  { id: 'loan-elders',   memberName: 'Elders Meat Parlour',     amount: 3000000, interestRate: 0.15, status: 'partial', issuedDate: '2023-03-21', note: 'Repossessed property partially sold' },
];

// ============================================================
// WRITE TO FIRESTORE
// ============================================================

async function populate() {
  console.log('🚀 Starting Firestore population...\n');
  const batch1 = db.batch();
  const batch2 = db.batch();
  const batch3 = db.batch();
  let count = 0;

  // ── 1. MEMBERS ─────────────────────────────────────────────
  console.log('📝 Writing members...');
  for (const m of MEMBERS) {
    const ref = db.collection('members').doc(m.id);
    batch1.set(ref, {
      ...m,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;
  }
  await batch1.commit();
  console.log(`   ✅ ${MEMBERS.length} members written`);

  // ── 2. JUNIORS ─────────────────────────────────────────────
  console.log('📝 Writing junior members...');
  const batchJ = db.batch();
  for (const j of JUNIORS) {
    const ref = db.collection('juniors').doc(j.id);
    batchJ.set(ref, { ...j, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await batchJ.commit();
  console.log(`   ✅ ${JUNIORS.length} junior members written`);

  // ── 3. FINANCIALS ──────────────────────────────────────────
  console.log('📝 Writing financials...');
  await db.collection('settings').doc('financials').set({
    ...FINANCIALS,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('   ✅ Financials written');

  // ── 4. INVESTMENTS ─────────────────────────────────────────
  console.log('📝 Writing investments...');
  const batchInv = db.batch();
  for (const inv of INVESTMENTS) {
    const ref = db.collection('investments').doc(inv.id);
    batchInv.set(ref, { ...inv, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await batchInv.commit();
  console.log(`   ✅ ${INVESTMENTS.length} investments written`);

  // ── 5. CONTRIBUTIONS 2025 ──────────────────────────────────
  console.log('📝 Writing 2025 contributions...');
  const batchC = db.batch();
  let cCount = 0;
  for (const c of CONTRIBUTIONS_2025) {
    for (const mo of c.months) {
      const ref = db.collection('contributions').doc(`${c.memberId}-2025-${mo}`);
      batchC.set(ref, {
        memberId: c.memberId,
        month: mo,
        year: 2025,
        status: 'paid',
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      cCount++;
    }
  }
  await batchC.commit();
  console.log(`   ✅ ${cCount} contribution records written`);

  // ── 6. LOANS ───────────────────────────────────────────────
  console.log('📝 Writing loans...');
  const batchL = db.batch();
  for (const loan of LOANS) {
    const ref = db.collection('loans').doc(loan.id);
    batchL.set(ref, { ...loan, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await batchL.commit();
  console.log(`   ✅ ${LOANS.length} loans written`);

  // ── 7. APPROVED EMAILS ────────────────────────────────────
  console.log('📝 Writing approved emails...');
  const batchE = db.batch();
  for (const e of APPROVED_EMAILS) {
    const ref = db.collection('approvedEmails').doc(e.email);
    batchE.set(ref, { ...e, addedAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await batchE.commit();
  console.log(`   ✅ ${APPROVED_EMAILS.length} approved emails written`);

  // ── 8. COMMITTEE (current) ────────────────────────────────
  console.log('📝 Writing committee...');
  await db.collection('settings').doc('committee').set({
    exists: true,
    chairperson: 'Incoming (2026 AGM)',
    treasurer: 'TBD',
    secretary: 'TBD',
    term: '2026-2028',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('   ✅ Committee written');

  console.log('\n🎉 ALL DONE! Your Firestore is now populated.');
  console.log('\n📋 Summary:');
  console.log(`   - ${MEMBERS.length} members (platinum + gold)`);
  console.log(`   - ${JUNIORS.length} junior members`);
  console.log(`   - ${INVESTMENTS.length} investments`);
  console.log(`   - ${cCount} contribution records`);
  console.log(`   - ${LOANS.length} loans`);
  console.log('\n⚠️  Next steps:');
  console.log('   1. Add member Gmail addresses to APPROVED_EMAILS array');
  console.log('   2. Run script again to update emails, or add via Admin panel in app');
  console.log('   3. Update 2026 contributions as members pay monthly');

  process.exit(0);
}

populate().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
