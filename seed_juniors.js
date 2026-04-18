// ── seed_juniors.js — Fix/seed junior records in Firestore ────
// Run once from Codespaces: node seed_juniors.js
// Uses existing serviceAccount.json
// Safe to run multiple times — updates by name, never duplicates.
// ─────────────────────────────────────────────────────────────

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccount.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Parent-child mappings (confirmed by admin):
// Mr & Mrs Matovu    → Hezel Wenceslaus Adrian Matovu
// Mr & Mrs Ssali     → Jasper Ssali Ssewanonda + Bianca Ssali
// Mr & Mrs Kirabira  → Nathan Jade (Lule Luutu — listed under Kirabira)
// Mr & Mrs Kigonya   → Ryan Cyprian Lule Lwanga
// Mr & Mrs Sekiranda → Sekiranda Fortunate Grace
// Nabunya Shamera    → Ndagire Catherine Skylar

const juniors = [
  { name:'Nathan Jade Lule Luutu',         parentName:'Mr & Mrs Kirabira',  parentMemberId:'mr-and-mrs-kirabira',  monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':240000,'2025':240000,'2026':0}, welfareByYear:{'2024':60000,'2025':60000,'2026':0} },
  { name:'Jasper Ssali Ssewanonda',         parentName:'Mr & Mrs Ssali',     parentMemberId:'mr-and-mrs-ssali',     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':240000,'2025':240000,'2026':0}, welfareByYear:{'2024':60000,'2025':60000,'2026':0} },
  { name:'Bianca Ssali',                    parentName:'Mr & Mrs Ssali',     parentMemberId:'mr-and-mrs-ssali',     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':40000,'2025':0,'2026':0},    welfareByYear:{'2024':10000,'2025':0,'2026':0} },
  { name:'Ndagire Catherine Skylar',        parentName:'Nabunya Shamera',    parentMemberId:'nabunya-shamera',      monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':20000,'2025':0,'2026':0},    welfareByYear:{'2024':5000,'2025':0,'2026':0} },
  { name:'Ryan Cyprian Lule Lwanga',        parentName:'Mr & Mrs Kigonya',   parentMemberId:'mr-and-mrs-kigonya',   monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':80000,'2025':0,'2026':0},    welfareByYear:{'2024':20000,'2025':0,'2026':0} },
  { name:'Hezel Wenceslaus Adrian Matovu',  parentName:'Mr & Mrs Matovu',    parentMemberId:'mr-and-mrs-matovu',    monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':240000,'2025':240000,'2026':0}, welfareByYear:{'2024':60000,'2025':60000,'2026':0} },
  { name:'Sekiranda Fortunate Grace',       parentName:'Mr & Mrs Sekiranda', parentMemberId:'mr-and-mrs-sekiranda', monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':240000,'2025':240000,'2026':0}, welfareByYear:{'2024':60000,'2025':60000,'2026':0} },
  { name:'Erik Danil Nuwahereza',           parentName:'Nuwahereza Edson',   parentMemberId:'nuwahereza-edson',     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':0,'2025':0,'2026':0},         welfareByYear:{'2024':0,'2025':0,'2026':0} },
  { name:'Elisha Joshua Nuwahereza',        parentName:'Nuwahereza Edson',   parentMemberId:'nuwahereza-edson',     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':0,'2025':0,'2026':0},         welfareByYear:{'2024':0,'2025':0,'2026':0} },
  { name:'Alpha Rashida Kulumba',           parentName:'Nalukenge Rashida',  parentMemberId:'nalukenge-rashida',    monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':240000,'2025':180000,'2026':0}, welfareByYear:{'2024':60000,'2025':45000,'2026':0} },
  { name:'Jayden Elvis Liam Izimba',        parentName:'',                   parentMemberId:'',                     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':100000,'2025':0,'2026':0},   welfareByYear:{'2024':25000,'2025':0,'2026':0} },
  { name:'Liam Joseph Luutu',               parentName:'Mr & Mrs Luutu',     parentMemberId:'mr-and-mrs-luutu',     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':200000,'2025':200000,'2026':0}, welfareByYear:{'2024':50000,'2025':50000,'2026':0} },
  { name:'Lael Orion Luutu',                parentName:'Mr & Mrs Luutu',     parentMemberId:'mr-and-mrs-luutu',     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':200000,'2025':200000,'2026':0}, welfareByYear:{'2024':50000,'2025':50000,'2026':0} },
  { name:'Ssentongo Remigius Smith',        parentName:'',                   parentMemberId:'',                     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':60000,'2025':0,'2026':0},    welfareByYear:{'2024':15000,'2025':0,'2026':0} },
  { name:'Senyange Ziwa Jerome',            parentName:'',                   parentMemberId:'',                     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':120000,'2025':0,'2026':0},   welfareByYear:{'2024':30000,'2025':0,'2026':0} },
  { name:'Kyambadde Jayden',                parentName:'Kyamulabi Diana',    parentMemberId:'kyamulabi-diana',      monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':120000,'2025':0,'2026':0},   welfareByYear:{'2024':30000,'2025':0,'2026':0} },
  { name:'Nsimbi Jayson',                   parentName:'',                   parentMemberId:'',                     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':120000,'2025':0,'2026':0},   welfareByYear:{'2024':30000,'2025':0,'2026':0} },
  { name:'Nakirijja Esther Elyse',          parentName:'',                   parentMemberId:'',                     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':60000,'2025':0,'2026':0},    welfareByYear:{'2024':15000,'2025':0,'2026':0} },
  { name:'Nambatya Elyna Jenkins',          parentName:'',                   parentMemberId:'',                     monthlyRate:20000, welfareRate:5000, status:'active', joinYear:2024, subscriptionByYear:{'2024':40000,'2025':0,'2026':0},    welfareByYear:{'2024':15000,'2025':0,'2026':0} },
];

async function run() {
  console.log(`\nSeeding ${juniors.length} juniors…\n`);
  // Get existing docs keyed by name
  const snap = await db.collection('juniors').get();
  const existing = {};
  snap.forEach(d => { existing[d.data().name] = d.id; });

  let updated=0, created=0;
  for (const j of juniors) {
    const data = { ...j, updatedAt: Timestamp.now(), source: 'seed_juniors' };
    if (existing[j.name]) {
      await db.collection('juniors').doc(existing[j.name]).set(data, { merge: true });
      updated++;
      console.log(`  ✓ updated: ${j.name}`);
    } else {
      await db.collection('juniors').add(data);
      created++;
      console.log(`  + created: ${j.name}`);
    }
  }
  console.log(`\nDone. ${created} created, ${updated} updated.\n`);
  process.exit(0);
}
run().catch(e => { console.error('Error:', e.message); process.exit(1); });
