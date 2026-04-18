// ── seed_juniors.js — Let's Grow Investment Club ─────────────
// Populates the Firestore 'juniors' collection with historical
// data from the PDF accounts (2024, 2025, 2026).
//
// RUN ONCE in Codespaces:
//   node seed_juniors.js
//
// REQUIRES:
//   1. firebase-admin installed: npm install firebase-admin
//   2. A service account key file from Firebase Console:
//      Firebase Console → Project Settings → Service Accounts
//      → Generate new private key → save as serviceAccountKey.json
//      in the same folder as this script
//
// SAFE TO RE-RUN: uses merge:true so existing data is not lost.
// ─────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId:  'letsgrowinvestmentclub-26878',
});

const db = admin.firestore();

// ── JUNIOR MEMBERS DATA (from PDF accounts) ───────────────────
// monthlyRate = 20,000 for all juniors
// subscriptionByYear = total subscription paid that year
// welfareByYear = total welfare paid that year
// Data sourced from Lets_Grow_Accounts.pdf junior section

const JUNIORS = [
  {
    id:          'nathan-jade-lule-luutu',
    name:        'Nathan Jade Lule Luutu',
    parentName:  'Luutu Daniel & Nagawa Ruth',
    parentId:    'luutu-daniel',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 12 months fully paid (240K sub, 60K welfare)
    // 2025: 12 months fully paid (240K sub, 60K welfare)
    // 2026: 12 months paid ahead (240K sub, 60K welfare) — target met
    subscriptionByYear: { '2024': 240000, '2025': 240000, '2026': 240000 },
    welfareByYear:      { '2024':  60000, '2025':  60000, '2026':  60000 },
  },
  {
    id:          'jasper-ssali-ssewanonda',
    name:        'Jasper Ssali Ssewanonda',
    parentName:  'Ssali Simon Peter & Ndagire Rona',
    parentId:    'ssali-simon-peter',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 12 months fully paid
    // 2025: 12 months fully paid
    // 2026: 0 paid (balance 300K outstanding)
    subscriptionByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    welfareByYear:      { '2024':  60000, '2025':  60000, '2026': 0 },
  },
  {
    id:          'hezel-wenceslaus-matovu',
    name:        'Hezel Wenceslaus Adrian Matovu',
    parentName:  'Julius Matovu & Faith Matovu',
    parentId:    'mr-and-mrs-matovu',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 12 months fully paid
    // 2025: 12 months fully paid
    // 2026: 0 paid
    subscriptionByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    welfareByYear:      { '2024':  60000, '2025':  60000, '2026': 0 },
  },
  {
    id:          'alpha-rashida-kulumba',
    name:        'Alpha Rashida Kulumba',
    parentName:  'Nalukenge Rashida',
    parentId:    'nalukenge-rashida',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 12 months fully paid
    // 2025: 9 months paid (180K sub, 45K welfare), balance 75K remaining
    // 2026: 0 paid
    subscriptionByYear: { '2024': 240000, '2025': 180000, '2026': 0 },
    welfareByYear:      { '2024':  60000, '2025':  45000, '2026': 0 },
  },
  {
    id:          'sekiranda-fortunate-grace',
    name:        'Sekiranda Fortunate Grace',
    parentName:  'Sekiranda Simon',
    parentId:    'sekiranda-simon',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 12 months fully paid
    // 2025: 12 months fully paid
    // 2026: 0 paid
    subscriptionByYear: { '2024': 240000, '2025': 240000, '2026': 0 },
    welfareByYear:      { '2024':  60000, '2025':  60000, '2026': 0 },
  },
  {
    id:          'ryan-cyprian-lule-lwanga',
    name:        'Ryan Cyprian Lule Lwanga',
    parentName:  'Lule Stephen Musisi & Nabukeera Juliet',
    parentId:    'mr-and-mrs-lule-stephen',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 4 months paid (80K sub, 20K welfare), balance 200K
    // 2025: 0 paid (balance 300K)
    // 2026: 0 paid
    subscriptionByYear: { '2024': 80000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024': 20000, '2025': 0, '2026': 0 },
  },
  {
    id:          'liam-joseph-luutu',
    name:        'Liam Joseph Luutu',
    parentName:  'Luutu Daniel & Nagawa Ruth',
    parentId:    'luutu-daniel',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 10 months paid (200K sub, 50K welfare), balance 50K
    // 2025: 0 paid
    // 2026: 0 paid
    subscriptionByYear: { '2024': 200000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024':  50000, '2025': 0, '2026': 0 },
  },
  {
    id:          'lael-orion-luutu',
    name:        'Lael Orion Luutu',
    parentName:  'Luutu Daniel & Nagawa Ruth',
    parentId:    'luutu-daniel',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 10 months paid (200K sub, 50K welfare), balance 50K
    // 2025: 0 paid
    // 2026: 0 paid
    subscriptionByYear: { '2024': 200000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024':  50000, '2025': 0, '2026': 0 },
  },
  {
    id:          'ndagire-catherine-skylar',
    name:        'Ndagire Catherine Skylar',
    parentName:  'Ssali Simon Peter & Ndagire Rona',
    parentId:    'ssali-simon-peter',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 1 month paid (20K), balance 275K
    // 2025: 0 paid
    subscriptionByYear: { '2024': 20000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024':  5000, '2025': 0, '2026': 0 },
  },
  {
    id:          'erik-danil-nuwahereza',
    name:        'Erik Danil Nuwahereza',
    parentName:  'Nuwahereza Edson',
    parentId:    'nuwahereza-edson',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 0 paid (balance 300K)
    // 2025: 0 paid
    subscriptionByYear: { '2024': 0, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024': 0, '2025': 0, '2026': 0 },
  },
  {
    id:          'elisha-joshua-nuwahereza',
    name:        'Elisha Joshua Nuwahereza',
    parentName:  'Nuwahereza Edson',
    parentId:    'nuwahereza-edson',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 0 paid (balance 300K)
    // 2025: 0 paid
    subscriptionByYear: { '2024': 0, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024': 0, '2025': 0, '2026': 0 },
  },
  {
    id:          'jayden-elvis-liam-izimba',
    name:        'Jayden Elvis Liam Izimba',
    parentName:  'Kirabira Jude',
    parentId:    'kirabira-jude',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 5 months paid (100K sub, 25K welfare), balance 175K
    // 2025: 0 paid
    subscriptionByYear: { '2024': 100000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024':  25000, '2025': 0, '2026': 0 },
  },
  {
    id:          'senyange-ziwa-jerom',
    name:        'Senyange Ziwa Jerom',
    parentName:  'Kigonya Antonio',
    parentId:    'mr-and-mrs-kigonya',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 6 months paid (120K sub, 30K welfare), balance 150K
    // 2025: 0 paid
    subscriptionByYear: { '2024': 120000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024':  30000, '2025': 0, '2026': 0 },
  },
  {
    id:          'kyambbadde-jayden',
    name:        'Kyambbadde Jayden',
    parentName:  'Naggayi Constance',
    parentId:    'naggayi-constance',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 6 months paid (120K sub, 30K welfare), balance 150K
    // 2025: 0 paid
    subscriptionByYear: { '2024': 120000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024':  30000, '2025': 0, '2026': 0 },
  },
  {
    id:          'nsimbi-jayson',
    name:        'Nsimbi Jayson',
    parentName:  'Nabuuma Teopista',
    parentId:    'nabuuma-teopista',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 6 months paid (120K sub, 30K welfare), balance 150K
    // 2025: 0 paid
    subscriptionByYear: { '2024': 120000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024':  30000, '2025': 0, '2026': 0 },
  },
  {
    id:          'nakirijja-esther-elyse',
    name:        'Nakirijja Esther Elyse',
    parentName:  'Nakakande Shebah',
    parentId:    'nakakande-shebah',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 3 months paid (60K sub, 15K welfare), balance 225K
    // 2025: 0 paid
    subscriptionByYear: { '2024': 60000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024': 15000, '2025': 0, '2026': 0 },
  },
  {
    id:          'bianca-ssali',
    name:        'Bianca Ssali',
    parentName:  'Ssali Simon Peter & Ndagire Rona',
    parentId:    'ssali-simon-peter',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 2 months paid (40K sub, 10K welfare), balance 250K
    // 2025: 0 paid
    subscriptionByYear: { '2024': 40000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024': 10000, '2025': 0, '2026': 0 },
  },
  {
    id:          'ssentongo-remigius-smith',
    name:        'Ssentongo Remigius Smith',
    parentName:  'Ssetumba David',
    parentId:    'mr-and-mrs-ssetumba',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: 3 months paid (60K sub, 15K welfare), balance 225K
    // 2025: 0 paid
    subscriptionByYear: { '2024': 60000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024': 15000, '2025': 0, '2026': 0 },
  },
  {
    id:          'nambatya-elyna-jenkins',
    name:        'Nambatya Elyna Jenkins',
    parentName:  'Namubiru Rose',
    parentId:    'namubiru-rose',
    joinYear:    2024,
    monthlyRate: 20000,
    status:      'active',
    // 2024: partial — 40K sub, 15K welfare (irregular, balance 245K)
    // 2025: 0 paid
    subscriptionByYear: { '2024': 40000, '2025': 0, '2026': 0 },
    welfareByYear:      { '2024': 15000, '2025': 0, '2026': 0 },
  },
  {
    id:          'archibald-wasaggo-ggenza',
    name:        'Archibald Chilion Wasaggo Ggenza',
    parentName:  'Nsubuga Moses',
    parentId:    'nsubuga-moses',
    joinYear:    2025,
    monthlyRate: 20000,
    status:      'active',
    // Joined 2025 — 0 paid (balance 300K)
    subscriptionByYear: { '2025': 0, '2026': 0 },
    welfareByYear:      { '2025': 0, '2026': 0 },
  },
];

// ── SEED FUNCTION ─────────────────────────────────────────────
async function seedJuniors() {
  console.log(`\nSeeding ${JUNIORS.length} junior members to Firestore…\n`);

  let success = 0;
  let skipped = 0;

  for (const junior of JUNIORS) {
    const { id, ...data } = junior;
    const ref = db.collection('juniors').doc(id);

    try {
      await ref.set({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });  // merge: true = safe to re-run

      const year2026sub = data.subscriptionByYear?.['2026'] || 0;
      const monthlyRate = data.monthlyRate || 20000;
      const pct2026     = Math.round((year2026sub / (monthlyRate * 12)) * 100);

      console.log(`✅ ${junior.name.padEnd(38)} 2026: ${pct2026}% paid`);
      success++;
    } catch(e) {
      console.error(`❌ Failed: ${junior.name} — ${e.message}`);
      skipped++;
    }
  }

  console.log(`\n──────────────────────────────────────────`);
  console.log(`Done. ${success} seeded, ${skipped} failed.`);
  console.log(`\nNote: Erik & Elisha Nuwahereza are in the system`);
  console.log(`but have never made a payment (0 paid, balance 300K each).`);
  console.log(`Nathan Jade Lule Luutu is fully paid for 2026 (paid ahead).`);

  process.exit(0);
}

seedJuniors().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
