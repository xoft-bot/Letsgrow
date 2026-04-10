// patch_members.js — Let's Grow Investment Club
// Adds fields the app reads that weren't in the seed:
//   name, firstName, lastName (display)
//   savings (subscription total — used for loan calculations)
//   isActive, contributionsUpToDate, isFrozen, loanCycle, consecutiveDefaults
// Also deletes ghost v2 members from Firestore
// Run: node patch_members.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const validMemberIds = new Set([
  'lule_stephen', 'sekiranda_simon', 'ssebudde_samuel', 'kirabira_jude',
  'luutu_daniel', 'kigonya_antonio', 'ssali_simon', 'matovu_julius',
  'ssetumba_david', 'kyamulabi_diana', 'claire_namutebi', 'naggayi_constance',
  'nabuuma_teopista', 'nuwahereza_edson', 'kintu_ernest', 'namubiru_rose',
  'nalukenge_rashida', 'nakakande_shebah', 'nsubuga_moses', 'nakiwala_ruth',
  'nabunnya_shamera', 'babirye_joan', 'mabaale_james', 'nampeewo_winfred',
  'nakimuli_annet', 'namubiru_winnie', 'nansubuga_jane',
  'namuyimba_keneth', 'nakachwa_fortunate', 'batenga_diana',
]);

const activeStatuses = new Set(['active', 'diaspora', 'partial']);
const CURRENT_MONTH = 4; // April 2026

function isContributionsUpToDate(member) {
  if (!activeStatuses.has(member.status)) return false;
  const sub2026 = member.subscriptionByYear?.['2026'] || 0;
  const monthlyRate = member.monthlySubscription || 0;
  if (monthlyRate === 0) return false;
  const expectedByNow = monthlyRate * CURRENT_MONTH;
  return sub2026 >= expectedByNow - monthlyRate; // one month grace
}

function calculateSavings(member) {
  const base = member.totalSubscriptionUpTo2025 || 0;
  const current2026 = member.subscriptionByYear?.['2026'] || 0;
  return base + current2026;
}

async function patch() {
  const snapshot = await db.collection('members').get();
  console.log(`\nFound ${snapshot.size} total member docs in Firestore`);

  const toDelete = [];
  const toPatch  = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (!validMemberIds.has(doc.id)) {
      toDelete.push({ id: doc.id, displayName: data.name || data.displayName || data.firstName || '???' });
      continue;
    }

    const name = data.displayName || data.primary?.name || data.name || null;
    if (!name) { console.log(`⚠️  Cannot resolve name for ${doc.id}`); continue; }

    const nameParts = (data.primary?.name || name).split(' ');
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || '';

    toPatch.push({
      id: doc.id,
      fields: {
        name,
        firstName,
        lastName,
        savings: calculateSavings(data),
        isActive: activeStatuses.has(data.status),
        contributionsUpToDate: isContributionsUpToDate(data),
        isFrozen: data.isFrozen || false,
        loanCycle: data.loanCycle || 1,
        consecutiveDefaults: data.consecutiveDefaults || 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
  }

  console.log(`\n🗑️  Ghost members to delete (${toDelete.length}):`);
  for (const g of toDelete) console.log(`   ${g.id}  "${g.displayName}"`);

  if (toDelete.length > 0) {
    const batch = db.batch();
    for (const g of toDelete) batch.delete(db.collection('members').doc(g.id));
    await batch.commit();
    console.log(`✅ Deleted ${toDelete.length} ghost members`);
  }

  console.log(`\n🔧 Patching ${toPatch.length} members...`);
  for (let i = 0; i < toPatch.length; i += 400) {
    const batch = db.batch();
    for (const m of toPatch.slice(i, i + 400)) {
      batch.update(db.collection('members').doc(m.id), m.fields);
    }
    await batch.commit();
  }

  console.log('\n📋 Patch summary:');
  for (const m of toPatch) {
    const f = m.fields;
    console.log(`   ${m.id.padEnd(22)} savings:${String(f.savings).padStart(10)} | active:${String(f.isActive).padEnd(5)} | upToDate:${String(f.contributionsUpToDate).padEnd(5)} | cycle:${f.loanCycle}`);
  }

  // Seed club/funds alias
  const bankSnap = await db.collection('club').doc('bankBalance').get();
  if (bankSnap.exists) {
    const bank = bankSnap.data();
    await db.collection('club').doc('funds').set({
      liquidFunds: bank.total || 40300878,
      loanPool: bank.loansPool || 4508878,
      welfare: bank.welfare || 15035000,
      gla: bank.gla || 9087000,
      unitTrust: bank.unitTrust || 6990000,
      letsGrowJunior: bank.letsGrowJunior || 4680000,
      lastUpdated: bank.lastUpdated || '2026-03-29',
    });
    console.log('\n✅ club/funds seeded');
  }

  console.log(`\n🎉 Done! Deleted: ${toDelete.length} ghosts | Patched: ${toPatch.length} members`);
  process.exit(0);
}

patch().catch(err => { console.error('❌ Error:', err); process.exit(1); });
