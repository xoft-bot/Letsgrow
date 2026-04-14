// ── import_history.js — Let's Grow Investment Club ──────────────
// Imports historical income & expense data from Lets_Grow_Accounts.xlsx
// into Firestore so the app's Club Expenses & Income section shows real data.
//
// HOW TO RUN (in Codespaces):
//   npm install firebase-admin
//   node import_history.js
// ─────────────────────────────────────────────────────────────────

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// ── PASTE your Firebase service account JSON here ─────────────────
// Go to: Firebase Console → Project Settings → Service Accounts
// → Generate new private key → save as serviceAccount.json
const serviceAccount = require('./serviceAccount.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── HISTORICAL INCOME — one doc per year in clubIncome collection ─
// These totals come directly from the Income Statement sheet.
const clubIncome = {
  "2020": { subscriptions: 4876000, welfare: 0, gla: 0, unitTrust: 0, registration: 0, diaspora: 0, fines: 0, total: 4876000 },
  "2021": { subscriptions: 7376500, welfare: 1475000, gla: 0, unitTrust: 0, registration: 0, diaspora: 0, fines: 0, total: 8851500 },
  "2022": { subscriptions: 12355000, welfare: 2890000, gla: 0, unitTrust: 0, registration: 490000, diaspora: 340000, fines: 0, total: 16075000 },
  "2023": { subscriptions: 14720000, welfare: 3680000, gla: 0, unitTrust: 0, registration: 140000, diaspora: 500000, fines: 0, total: 19040000 },
  "2024": { subscriptions: 14240000, welfare: 3560000, gla: 4628000, unitTrust: 3560000, registration: 0, diaspora: 520000, juniorSub: 2360000, juniorWelfare: 595000, fines: 0, total: 29463000 },
  "2025": { subscriptions: 12556000, welfare: 3130000, gla: 4069000, unitTrust: 3130000, registration: 1342600, diaspora: 840000, juniorSub: 1140000, juniorWelfare: 285000, fines: 0, total: 26492600 },
  "2026": { subscriptions: 1240000, welfare: 300000, gla: 390000, unitTrust: 300000, registration: 0, diaspora: 0, juniorSub: 240000, juniorWelfare: 60000, fines: 0, total: 2530000 },
};

// ── HISTORICAL EXPENSES — from Club Expenses sheet (all 57 entries) ─
const clubExpenses = [
  { date: "2021-03-28", description: "Meetings' welfare as at 28/03/2021",                    amount: 132000, category: "welfare",      year: 2021 },
  { date: "2021-03-29", description: "Club Registration",                                       amount: 60000,  category: "admin",        year: 2021 },
  { date: "2021-12-08", description: "Investment club certification at Kira",                   amount: 50000,  category: "admin",        year: 2021 },
  { date: "2021-12-08", description: "Facilitation of CDO at Kira",                             amount: 10000,  category: "admin",        year: 2021 },
  { date: "2021-12-08", description: "Paid for L.C I recommendation",                           amount: 10000,  category: "admin",        year: 2021 },
  { date: "2021-08-13", description: "Certification of club resolution to open bank account",   amount: 20000,  category: "admin",        year: 2021 },
  { date: "2021-08-13", description: "Bank account opening fees",                               amount: 50000,  category: "admin",        year: 2021 },
  { date: "2021-08-13", description: "Transportation",                                          amount: 10000,  category: "transport",    year: 2021 },
  { date: "2021-10-15", description: "Re-certification of club resolution to open bank account",amount: 20000,  category: "admin",        year: 2021 },
  { date: "2021-10-20", description: "Bank closure fee for club's joint saving account",        amount: 25000,  category: "admin",        year: 2021 },
  { date: "2021-10-20", description: "Money transfer fees to Lets Grow Investment A/C",         amount: 26000,  category: "admin",        year: 2021 },
  { date: "2022-06-16", description: "Bought stamp for the Club",                               amount: 55000,  category: "admin",        year: 2022 },
  { date: "2022-06-16", description: "Bought three box files for the club",                     amount: 18000,  category: "admin",        year: 2022 },
  { date: "2022-06-16", description: "Transportation",                                          amount: 12000,  category: "transport",    year: 2022 },
  { date: "2022-02-10", description: "Paid for design of the club official logo",               amount: 100000, category: "admin",        year: 2022 },
  { date: "2022-10-15", description: "Bought lunch for the constitution review committee",      amount: 63000,  category: "welfare",      year: 2022 },
  { date: "2022-10-29", description: "Paid for Club's reunion",                                 amount: 1440000,category: "social",       year: 2022 },
  { date: "2023-01-29", description: "Hired venue for annual general meeting",                  amount: 200000, category: "agm",          year: 2023 },
  { date: "2023-01-29", description: "Bought breakfast and lunch for members at AGM",           amount: 840000, category: "agm",          year: 2023 },
  { date: "2023-01-29", description: "Hired projector",                                         amount: 100000, category: "agm",          year: 2023 },
  { date: "2023-01-29", description: "Facilitated Reverend",                                    amount: 100000, category: "agm",          year: 2023 },
  { date: "2023-01-29", description: "Bought soft drinks",                                      amount: 40000,  category: "agm",          year: 2023 },
  { date: "2023-01-29", description: "Transport",                                               amount: 20000,  category: "transport",    year: 2023 },
  { date: "2023-08-01", description: "Paid off Mrs Nakimuli Annet (30% savings and dividends)", amount: 294000, category: "member payout",year: 2023 },
  { date: "2023-06-03", description: "Condolences for Kenneth's burial",                        amount: 1000000,category: "welfare",      year: 2023 },
  { date: "2023-03-26", description: "1st quarter cake to Faith",                               amount: 100000, category: "welfare",      year: 2023 },
  { date: "2023-06-25", description: "2nd quarter cake to Jane",                                amount: 100000, category: "welfare",      year: 2023 },
  { date: "2023-09-19", description: "Condolences for Fortunate",                               amount: 1000000,category: "welfare",      year: 2023 },
  { date: "2023-10-01", description: "3rd quarter cake to Faith",                               amount: 100000, category: "welfare",      year: 2023 },
  { date: "2023-10-28", description: "Printing club minutes",                                   amount: 25000,  category: "admin",        year: 2023 },
  { date: "2023-12-17", description: "Printing annual general minutes 2023",                    amount: 350000, category: "admin",        year: 2023 },
  { date: "2023-12-17", description: "4th quarter cake to Jane",                                amount: 100000, category: "welfare",      year: 2023 },
  { date: "2024-08-02", description: "Paid back money used to recover Eldaz Meat Parlour",      amount: 1270000,category: "investment",   year: 2024 },
  { date: "2024-11-03", description: "Condolences for Ms Hellen (Shammy & Rashidah's sister)", amount: 500000, category: "welfare",      year: 2024 },
  { date: "2024-03-24", description: "1st Quarter cake to Faith",                               amount: 100000, category: "welfare",      year: 2024 },
  { date: "2024-06-30", description: "2nd Quarter cake to Faith",                               amount: 100000, category: "welfare",      year: 2024 },
  { date: "2024-09-29", description: "3rd Quarter cake to Jane",                                amount: 100000, category: "welfare",      year: 2024 },
  { date: "2024-11-12", description: "Club Reunion",                                            amount: 850000, category: "social",       year: 2024 },
  { date: "2024-12-22", description: "4th Quarter cake to Faith",                               amount: 100000, category: "welfare",      year: 2024 },
];

// ── IMPORT ────────────────────────────────────────────────────────
async function run() {
  console.log('Starting import...\n');

  // 1. Income — set each year doc
  for (const [year, data] of Object.entries(clubIncome)) {
    await db.collection('clubIncome').doc(year).set({ ...data, importedAt: Timestamp.now(), source: 'excel_import' }, { merge: true });
    console.log(`✓ clubIncome/${year} — total: ${data.total.toLocaleString()}`);
  }

  // 2. Expenses — add each as a new doc (check for duplicates by description+date)
  const existingSnap = await db.collection('clubExpenses').get();
  const existing = new Set(existingSnap.docs.map(d => `${d.data().date}|${d.data().description||d.data().particular}`));

  let added = 0, skipped = 0;
  for (const exp of clubExpenses) {
    const key = `${exp.date}|${exp.description}`;
    if (existing.has(key)) { skipped++; continue; }
    await db.collection('clubExpenses').add({ ...exp, particular: exp.description, addedAt: Timestamp.now(), source: 'excel_import' });
    added++;
  }

  console.log(`\n✓ Expenses: ${added} added, ${skipped} already existed`);
  console.log('\nDone! Refresh the app to see the data.');
  process.exit(0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
