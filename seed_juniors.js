const admin = require('firebase-admin');
// Verify this filename matches exactly what you uploaded!
const serviceAccount = require("./serviceAccount.json"); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const juniors = [
  { id: 'nathan_jade', name: 'Nathan Jade Lule Luutu', paidMonths: 12, target: 2026 },
  { id: 'erik_n', name: 'Erik Nuwahereza', paidMonths: 0, target: 2026 },
  { id: 'elisha_n', name: 'Elisha Nuwahereza', paidMonths: 0, target: 2026 }
];

async function seed() {
  for (const j of juniors) {
    await db.collection('members').doc(j.id).set({
      name: j.name,
      type: 'junior',
      monthlyRate: 5000, // Example rate
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Seeded: ${j.name}`);
  }
  process.exit();
}

seed().catch(console.error);

