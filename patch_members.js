// patch_members.js — Two fixes in one script
// Fix 1: Add `name` field back to all members (app reads member.name)
// Fix 2: Delete ghost v2 members that weren't in the new seed
// Run: node patch_members.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ─────────────────────────────────────────────────────────────
// These are the valid member IDs from populate_firestore_v3_final.js
// Any member in Firestore NOT in this list is a ghost from v2
// ─────────────────────────────────────────────────────────────
const validMemberIds = new Set([
  'lule_stephen', 'sekiranda_simon', 'ssebudde_samuel', 'kirabira_jude',
  'luutu_daniel', 'kigonya_antonio', 'ssali_simon', 'matovu_julius',
  'ssetumba_david', 'kyamulabi_diana', 'claire_namutebi', 'naggayi_constance',
  'nabuuma_teopista', 'nuwahereza_edson', 'kintu_ernest', 'namubiru_rose',
  'nalukenge_rashida', 'nakakande_shebah', 'nsubuga_moses', 'nakiwala_ruth',
  'nabunnya_shamera', 'babirye_joan', 'mabaale_james', 'nampeewo_winfred',
  'nakimuli_annet', 'namubiru_winnie', 'nansubuga_jane',
  'namuyimba_keneth', 'nakachwa_fortunate',
  'batenga_diana',
]);

async function patch() {
  const snapshot = await db.collection('members').get();
  console.log(`Found ${snapshot.size} members in Firestore\n`);

  const toDelete = [];
  const toPatch = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (!validMemberIds.has(doc.id)) {
      toDelete.push({ id: doc.id, name: data.name || data.displayName || data.firstName || '???' });
      continue;
    }

    // Build the name field the app expects
    // Try displayName first, fall back to primary.name
    const nameValue = data.displayName || data.primary?.name || null;
    if (!nameValue) {
      console.log(`⚠️  Cannot resolve name for ${doc.id} — skipping`);
      continue;
    }

    // Also rebuild firstName/lastName for individual members (some app components use these)
    let firstName = data.primary?.name?.split(' ')[0] || '';
    let lastName = data.primary?.name?.split(' ').slice(1).join(' ') || '';

    toPatch.push({
      id: doc.id,
      name: nameValue,
      firstName,
      lastName,
    });
  }

  // ── REPORT GHOSTS ──
  console.log(`🗑️  Ghost members to delete (${toDelete.length}):`);
  for (const g of toDelete) console.log(`   ${g.id} — "${g.name}"`);

  // ── DELETE GHOSTS ──
  if (toDelete.length > 0) {
    const deleteBatch = db.batch();
    for (const g of toDelete) {
      deleteBatch.delete(db.collection('members').doc(g.id));
    }
    await deleteBatch.commit();
    console.log(`✅ Deleted ${toDelete.length} ghost members\n`);
  }

  // ── PATCH NAME FIELDS ──
  console.log(`🔧 Patching name fields on ${toPatch.length} valid members...`);
  // Firestore batch limit is 500 — split if needed
  const chunkSize = 400;
  for (let i = 0; i < toPatch.length; i += chunkSize) {
    const chunk = toPatch.slice(i, i + chunkSize);
    const batch = db.batch();
    for (const m of chunk) {
      batch.update(db.collection('members').doc(m.id), {
        name: m.name,
        firstName: m.firstName,
        lastName: m.lastName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
  console.log(`✅ Patched name fields on ${toPatch.length} members\n`);

  // ── SUMMARY ──
  console.log('🎉 patch_members.js complete');
  console.log(`   Deleted: ${toDelete.length} ghost members`);
  console.log(`   Patched: ${toPatch.length} valid members`);
  console.log('\nNext: refresh your app — undefined names should be gone.');
  process.exit(0);
}

patch().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
