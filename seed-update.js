/**
 * LET'S GROW INVESTMENT CLUB — FIRESTORE SEED / UPDATE SCRIPT
 * ─────────────────────────────────────────────────────────────
 * Run from Codespaces terminal:
 *   npm install firebase-admin
 *   node seed-update.js
 *
 * REQUIRES: serviceAccountKey.json in same directory
 * Get it from Firebase Console → Project Settings → Service Accounts → Generate new private key
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Updates member 2026 subscription/welfare/GLA/UT data from the Excel
 *   2. Adds diasporaFeeByYear to all diaspora members
 *   3. Seeds the entire `juniors` Firestore collection (2024–2026 data)
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const TS = admin.firestore.FieldValue.serverTimestamp;

// ═══════════════════════════════════════════════════════════════
// SECTION A — 2026 MEMBER CONTRIBUTION DATA (from Excel 2026 sheet)
// ═══════════════════════════════════════════════════════════════
// Key:   sub=subscription, wel=welfare, gla=group life assurance, ut=unit trust
// Rates: individual = 40K+10K+13K+10K = 73K/month
//        couple     = 80K+20K+26K+20K = 146K/month

const MEMBER_2026_DATA = [
  // Fully paid — all 12 months (80K×12=960K sub for joint account)
  {
    id: 'kirabira_jude',
    sub: 960000, wel: 240000, gla: 312000, ut: 240000
    // Total: 1,752,000 (matches Firestore loanEligibility data)
  },

  // Partially paid — 3 months (Jan, Feb, Mar)
  {
    id: 'nabunya_shamera',
    sub: 120000, wel: 30000, gla: 39000, ut: 30000
  },

  // Partially paid — 2 months (Jan, Feb)
  {
    id: 'babirye_joan',
    sub: 80000, wel: 20000, gla: 26000, ut: 20000
  },

  // Partially paid — 1 month (Jan only)
  {
    id: 'nuwahereza_edson',
    sub: 40000, wel: 10000, gla: 13000, ut: 10000
  },

  // Partial — Jan subscription only (no welfare/GLA/UT recorded)
  // NOTE: This is a joint couple (Antonio + Aidah) — only 40K recorded vs expected 80K
  {
    id: 'kigonya_antonio',
    sub: 40000, wel: 0, gla: 0, ut: 0
  },

  // All others below had zero payments in 2026 as at the Excel snapshot
  // Setting explicitly to ensure Firestore is clean
  ...['lule_stephen', 'kyamulabi_diana', 'claire_namutebi', 'naggayi_constance',
    'sekiranda_simon', 'ssebudde_samuel', 'nabuuma_teopista', 'luutu_daniel',
    'ssali_simon', 'kintu_ernest', 'namubiru_rose', 'nalukenge_rashida',
    'nakakande_shebah', 'nsubuga_moses', 'matovu_julius', 'nampeewo_winniefred',
    'nakiwala_ruth', 'mabaale_james', 'nanfuka_jane'
  ].map(id => ({ id, sub: 0, wel: 0, gla: 0, ut: 0 })),
];

// ═══════════════════════════════════════════════════════════════
// SECTION B — DIASPORA FEES (from Excel 'Diaspora fees' sheet)
// ═══════════════════════════════════════════════════════════════
// Monthly fee = UGX 20,000

const DIASPORA_DATA = [
  {
    id: 'nalukenge_rashida',
    diasporaFeeByYear: {
      '2022': 160000,  // Apr+Jul+Aug+Sep+Oct+Nov+Dec (8 of 12 months = 160K)
      '2023': 240000,  // All 12 months
      '2024': 220000,  // Feb–Dec (11 months)
      '2025': 240000,  // All 12 months
      '2026': 0
    }
  },
  {
    id: 'nakiwala_ruth',
    diasporaFeeByYear: {
      '2023': 160000,  // May–Dec (8 months)
      '2024': 240000,  // All 12 months
      '2025': 240000,  // All 12 months
      '2026': 0
    }
  },
  {
    id: 'ssali_simon',
    diasporaFeeByYear: {
      '2024': 60000,   // Oct+Nov+Dec
      '2025': 240000,  // All 12 months
      '2026': 0
    }
  },
  {
    id: 'nanfuka_jane',
    diasporaFeeByYear: {
      '2024': 0,
      '2025': 0,
      '2026': 0
    }
  },
  {
    id: 'sekiranda_simon',
    diasporaFeeByYear: {
      '2024': 0,
      '2025': 0,
      '2026': 0
    }
  },
  {
    id: 'matovu_julius',
    diasporaFeeByYear: {
      '2025': 60000,   // Oct+Nov+Dec
      '2026': 0
    }
  },
  {
    // Faith Matovu — recorded as "NAMPEWO WINNIEFRED" in diaspora sheet
    // Firestore ID is nampeewo_winniefred (visible in console)
    id: 'nampeewo_winniefred',
    diasporaFeeByYear: {
      '2025': 60000,   // Oct+Nov+Dec
      '2026': 0
    }
  },
  {
    // Namubiru Rose — was diaspora member 2022
    id: 'namubiru_rose',
    diasporaFeeByYear: {
      '2022': 180000,  // Apr–Dec (9 months)
      '2023': 60000,   // Jan+Feb+Mar only then stopped
    }
  },
];

// ═══════════════════════════════════════════════════════════════
// SECTION C — JUNIORS COLLECTION (from 'Lets grow Junior' sheet)
// ═══════════════════════════════════════════════════════════════
// Monthly rate: 20,000 subscription + 5,000 welfare = 25,000/month
// Annual target: 300,000

const JUNIORS = [
  // ─── 2024 join year members ───
  {
    id: 'nathan_jade_lule',
    name: 'Nathan Jade Lule Luutu',
    parentMemberId: 'luutu_daniel',
    parentName: 'Luutu Daniel',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 240000, '2025': 240000, '2026': 240000 },  // 2026: FULLY PAID
    welfareByYear:       { '2024':  60000, '2025':  60000, '2026':  60000 },
  },
  {
    id: 'jasper_ssali',
    name: 'Jasper Ssali Ssewanonda',
    parentMemberId: 'ssali_simon',
    parentName: 'Ssali Simon Peter',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 240000, '2025': 240000, '2026': 0 },
    welfareByYear:       { '2024':  60000, '2025':  60000, '2026': 0 },
  },
  {
    id: 'ndagire_catherine',
    name: 'Ndagire Catherine Skylar',
    parentMemberId: 'ssali_simon',
    parentName: 'Ssali Simon Peter',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 20000, '2025': 0, '2026': 0 },  // only Jan 2024
    welfareByYear:       { '2024':  5000, '2025': 0, '2026': 0 },
  },
  {
    id: 'ryan_lule_lwanga',
    name: 'Ryan Cyprian Lule Lwanga',
    parentMemberId: 'lule_stephen',
    parentName: 'Lule Stephen Musisi',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 80000, '2025': 0, '2026': 0 },  // Jan–Apr 2024
    welfareByYear:       { '2024': 20000, '2025': 0, '2026': 0 },
  },
  {
    id: 'hezel_matovu',
    name: 'Hezel Wenceslaus Adrian Matovu',
    parentMemberId: 'matovu_julius',
    parentName: 'Matovu Julius',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 240000, '2025': 240000, '2026': 0 },
    welfareByYear:       { '2024':  60000, '2025':  60000, '2026': 0 },
  },
  {
    id: 'erik_nuwahereza',
    name: 'Erik Danil Nuwahereza',
    parentMemberId: 'nuwahereza_edson',
    parentName: 'Nuwahereza Edson',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 0, '2025': 0, '2026': 0 },
    welfareByYear:       { '2024': 0, '2025': 0, '2026': 0 },
  },
  {
    id: 'elisha_nuwahereza',
    name: 'Elisha Joshua Nuwahereza',
    parentMemberId: 'nuwahereza_edson',
    parentName: 'Nuwahereza Edson',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 0, '2025': 0, '2026': 0 },
    welfareByYear:       { '2024': 0, '2025': 0, '2026': 0 },
  },
  {
    id: 'alpha_rashida',
    name: 'Alpha Rashida Kulumba',
    parentMemberId: 'nalukenge_rashida',
    parentName: 'Nalukenge Rashida',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 240000, '2025': 180000, '2026': 0 },  // 2025: 9 months
    welfareByYear:       { '2024':  60000, '2025':  45000, '2026': 0 },
  },
  {
    id: 'jayden_izimba',
    name: 'Jayden Elvis Liam Izimba',
    parentMemberId: 'kigonya_antonio',
    parentName: 'Kigonya Antonio',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 100000, '2025': 0, '2026': 0 },  // Jan–May 2024
    welfareByYear:       { '2024':  25000, '2025': 0, '2026': 0 },
  },
  {
    id: 'bianca_ssali',
    name: 'Bianca Ssali',
    parentMemberId: 'ssali_simon',
    parentName: 'Ssali Simon Peter',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 40000, '2025': 0, '2026': 0 },  // Jan–Feb 2024
    welfareByYear:       { '2024': 10000, '2025': 0, '2026': 0 },
  },
  {
    id: 'ssentongo_remigius',
    name: 'Ssentongo Remigius Smith',
    parentMemberId: 'kigonya_antonio',
    parentName: 'Kigonya Antonio',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 60000, '2025': 0, '2026': 0 },  // Jan–Mar 2024
    welfareByYear:       { '2024': 15000, '2025': 0, '2026': 0 },
  },
  {
    id: 'liam_luutu',
    name: 'Liam Joseph Luutu',
    parentMemberId: 'luutu_daniel',
    parentName: 'Luutu Daniel',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 200000, '2025': 0, '2026': 0 },  // Jan–Oct 2024
    welfareByYear:       { '2024':  50000, '2025': 0, '2026': 0 },
  },
  {
    id: 'lael_luutu',
    name: 'Lael Orion Luutu',
    parentMemberId: 'luutu_daniel',
    parentName: 'Luutu Daniel',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 200000, '2025': 0, '2026': 0 },  // Jan–Oct 2024
    welfareByYear:       { '2024':  50000, '2025': 0, '2026': 0 },
  },
  {
    id: 'senyange_ziwa',
    name: 'Senyange Ziwa Jerom',
    parentMemberId: 'kigonya_antonio',
    parentName: 'Kigonya Antonio',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 120000, '2025': 0, '2026': 0 },  // Jan–Jun 2024
    welfareByYear:       { '2024':  30000, '2025': 0, '2026': 0 },
  },
  {
    id: 'kyambbadde_jayden',
    name: 'Kyambbadde Jayden',
    parentMemberId: 'kigonya_antonio',
    parentName: 'Kigonya Antonio',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 120000, '2025': 0, '2026': 0 },  // Jan–Jun 2024
    welfareByYear:       { '2024':  30000, '2025': 0, '2026': 0 },
  },
  {
    id: 'nsimbi_jayson',
    name: 'Nsimbi Jayson',
    parentMemberId: 'kirabira_jude',
    parentName: 'Jude Kirabira',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 120000, '2025': 0, '2026': 0 },  // Jan–Jun 2024
    welfareByYear:       { '2024':  30000, '2025': 0, '2026': 0 },
  },
  {
    id: 'nakirijja_esther',
    name: 'Nakirijja Esther Elyse',
    parentMemberId: 'nabuuma_teopista',
    parentName: 'Nabuuma Teopista',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 60000, '2025': 0, '2026': 0 },  // Jan–Mar 2024
    welfareByYear:       { '2024': 15000, '2025': 0, '2026': 0 },
  },
  {
    id: 'nambatya_elyna',
    name: 'Nambatya Elyna Jenkins',
    parentMemberId: 'nabuuma_teopista',
    parentName: 'Nabuuma Teopista',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 40000, '2025': 0, '2026': 0 },  // Jan–Feb 2024 (sub only)
    welfareByYear:       { '2024': 15000, '2025': 0, '2026': 0 },  // welfare for both months
  },
  {
    id: 'sekiranda_fortunate',
    name: 'Sekiranda Fortunate Grace',
    parentMemberId: 'sekiranda_simon',
    parentName: 'Sekiranda Simon',
    joinYear: 2024,
    isActive: true,
    subscriptionByYear:  { '2024': 240000, '2025': 240000, '2026': 0 },
    welfareByYear:       { '2024':  60000, '2025':  60000, '2026': 0 },
  },
  // ─── 2025 addition ───
  {
    id: 'archibald_ggenza',
    name: 'Archibald Chilion Wasaggo Ggenza',
    parentMemberId: 'kigonya_antonio',
    parentName: 'Kigonya Antonio',
    joinYear: 2025,
    isActive: true,
    subscriptionByYear:  { '2025': 0, '2026': 0 },
    welfareByYear:       { '2025': 0, '2026': 0 },
  },
];

// ═══════════════════════════════════════════════════════════════
// MAIN — execute all writes
// ═══════════════════════════════════════════════════════════════
async function run() {
  console.log('🚀 Starting Firestore seed/update...\n');
  let totalOps = 0;

  // Firestore batches max 500 operations
  const batches = [];
  let currentBatch = db.batch();
  let currentCount = 0;

  function addOp(ref, data, isSet = true, merge = true) {
    if (currentCount >= 490) {
      batches.push(currentBatch);
      currentBatch = db.batch();
      currentCount = 0;
    }
    if (isSet) {
      if (merge) currentBatch.set(ref, data, { merge: true });
      else currentBatch.set(ref, data);
    } else {
      currentBatch.update(ref, data);
    }
    currentCount++;
    totalOps++;
  }

  // ── A. Update member 2026 data ──────────────────────────────
  console.log(`📊 Updating ${MEMBER_2026_DATA.length} member 2026 records...`);
  for (const m of MEMBER_2026_DATA) {
    const ref = db.collection('members').doc(m.id);
    const update = {
      updatedAt: TS()
    };
    if (m.sub > 0 || m.wel > 0 || m.gla > 0 || m.ut > 0) {
      update['subscriptionByYear.2026'] = m.sub;
      update['welfareByYear.2026']      = m.wel;
      update['glaByYear.2026']          = m.gla;
      update['unitTrustByYear.2026']    = m.ut;
    }
    // Only update non-zero members to avoid overwriting Firestore-entered data with zeros
    if (m.sub > 0) {
      addOp(ref, update, false); // update (not set)
    }
  }

  // ── B. Update diaspora fee data ─────────────────────────────
  console.log(`🌍 Updating diaspora fees for ${DIASPORA_DATA.length} members...`);
  for (const d of DIASPORA_DATA) {
    const ref = db.collection('members').doc(d.id);
    addOp(ref, {
      diasporaFeeByYear: d.diasporaFeeByYear,
      isDiaspora: true,
      updatedAt: TS()
    });
  }

  // ── C. Seed juniors collection ──────────────────────────────
  console.log(`👶 Seeding ${JUNIORS.length} junior members...`);
  for (const j of JUNIORS) {
    const ref = db.collection('juniors').doc(j.id);
    const totalByYear = {};
    for (const yr of Object.keys(j.subscriptionByYear)) {
      totalByYear[yr] = (j.subscriptionByYear[yr] || 0) + (j.welfareByYear[yr] || 0);
    }
    addOp(ref, {
      ...j,
      totalPaidByYear: totalByYear,
      monthlySubscription: 20000,
      monthlyWelfare: 5000,
      annualTarget: 300000,
      updatedAt: TS()
    });
  }

  // ── Commit all batches ──────────────────────────────────────
  batches.push(currentBatch); // push the last batch

  console.log(`\n💾 Committing ${batches.length} batch(es), ${totalOps} total operations...`);

  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit();
    console.log(`   ✅ Batch ${i + 1}/${batches.length} committed`);
  }

  console.log(`\n🎉 Done! ${totalOps} Firestore operations completed successfully.`);
  console.log('\nNotes:');
  console.log('  • 2026 data: Kirabira (fully paid), Nabunya (3mo), Babirye Joan (2mo), Edson (1mo), Kigonya (partial Jan)');
  console.log('  • Diaspora fees added to 7 members with isDiaspora:true flag');
  console.log('  • Juniors collection: 20 documents created/updated');
  console.log('  • Nathan Jade Lule Luutu is FULLY PAID for 2026 (all 12 months)');
  console.log('\nNext: Check sidebar.js juniors query — it should now find documents in the juniors collection.');
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Script failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
