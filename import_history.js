// ── import_history.js — Let's Grow Investment Club ──────────────
// Run ONCE from Codespaces: node import_history.js
// Requires serviceAccount.json in the same folder.

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccount.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const clubIncome = {
  "2020": { subscriptions:4876000, welfare:0, gla:0, unitTrust:0, registration:0, diaspora:0, fines:0, roi:22850000, total:4876000 },
  "2021": { subscriptions:7376500, welfare:1475000, gla:0, unitTrust:0, registration:0, diaspora:0, fines:34000, total:8885500 },
  "2022": { subscriptions:12355000, welfare:2890000, gla:0, unitTrust:0, registration:490000, diaspora:340000, fines:309000, total:16384000 },
  "2023": { subscriptions:14720000, welfare:3680000, gla:0, unitTrust:0, registration:140000, diaspora:500000, fines:437000, total:19477000 },
  "2024": { subscriptions:14240000, welfare:3560000, gla:4628000, unitTrust:3560000, registration:0, diaspora:520000, juniorSub:2360000, juniorWelfare:595000, fines:150000, total:29613000 },
  "2025": { subscriptions:12556000, welfare:3130000, gla:4069000, unitTrust:3130000, registration:1342600, diaspora:840000, juniorSub:1140000, juniorWelfare:285000, fines:135000, total:26627600 },
  "2026": { subscriptions:1240000, welfare:300000, gla:390000, unitTrust:300000, registration:0, diaspora:0, juniorSub:240000, juniorWelfare:60000, fines:0, total:2530000 },
};

const clubExpenses = [
  { date:"2021-03-28", description:"Meetings' welfare as at 28/03/2021", amount:132000, category:"welfare", year:2021 },
  { date:"2021-03-29", description:"Club Registration", amount:60000, category:"admin", year:2021 },
  { date:"2021-12-08", description:"Investment club certification at Kira", amount:50000, category:"admin", year:2021 },
  { date:"2021-12-08", description:"Facilitation of CDO at Kira", amount:10000, category:"admin", year:2021 },
  { date:"2021-12-08", description:"Paid for L.C I recommendation", amount:10000, category:"admin", year:2021 },
  { date:"2021-08-13", description:"Certification of club resolution to open bank account", amount:20000, category:"admin", year:2021 },
  { date:"2021-08-13", description:"Bank account opening fees", amount:50000, category:"admin", year:2021 },
  { date:"2021-08-13", description:"Transportation", amount:10000, category:"transport", year:2021 },
  { date:"2021-10-15", description:"Re-certification of club resolution to open bank account", amount:20000, category:"admin", year:2021 },
  { date:"2021-10-20", description:"Bank closure fee for club's joint saving account", amount:25000, category:"admin", year:2021 },
  { date:"2021-10-20", description:"Money transfer fees to Lets Grow Investment A/C", amount:26000, category:"admin", year:2021 },
  { date:"2022-06-16", description:"Bought stamp for the Club", amount:55000, category:"admin", year:2022 },
  { date:"2022-06-16", description:"Bought three box files for the club", amount:18000, category:"admin", year:2022 },
  { date:"2022-06-16", description:"Transportation", amount:12000, category:"transport", year:2022 },
  { date:"2022-02-10", description:"Paid for design of the club official logo", amount:100000, category:"admin", year:2022 },
  { date:"2022-10-15", description:"Bought lunch for the constitution review committee", amount:63000, category:"welfare", year:2022 },
  { date:"2022-10-29", description:"Paid for Club's reunion", amount:1440000, category:"social", year:2022 },
  { date:"2023-01-29", description:"Hired venue for annual general meeting", amount:200000, category:"agm", year:2023 },
  { date:"2023-01-29", description:"Bought breakfast and lunch for members at AGM", amount:840000, category:"agm", year:2023 },
  { date:"2023-01-29", description:"Hired projector", amount:100000, category:"agm", year:2023 },
  { date:"2023-01-29", description:"Facilitated Reverend", amount:100000, category:"agm", year:2023 },
  { date:"2023-01-29", description:"Bought soft drinks", amount:40000, category:"agm", year:2023 },
  { date:"2023-01-29", description:"Transport", amount:20000, category:"transport", year:2023 },
  { date:"2023-08-01", description:"Paid off Mrs Nakimuli Annet (30% savings and dividends)", amount:294000, category:"member payout", year:2023 },
  { date:"2023-06-03", description:"Condolences for Kenneth's burial", amount:1000000, category:"welfare", year:2023 },
  { date:"2023-03-26", description:"1st quarter cake to Faith", amount:100000, category:"welfare", year:2023 },
  { date:"2023-06-25", description:"2nd quarter cake to Jane", amount:100000, category:"welfare", year:2023 },
  { date:"2023-09-19", description:"Condolences for Fortunate", amount:1000000, category:"welfare", year:2023 },
  { date:"2023-10-01", description:"3rd quarter cake to Faith", amount:100000, category:"welfare", year:2023 },
  { date:"2023-10-28", description:"Printing club minutes", amount:25000, category:"admin", year:2023 },
  { date:"2023-12-17", description:"Printing annual general minutes 2023", amount:350000, category:"admin", year:2023 },
  { date:"2023-12-17", description:"4th quarter cake to Jane", amount:100000, category:"welfare", year:2023 },
  { date:"2024-08-02", description:"Paid back money used to recover Eldaz Meat Parlour", amount:1270000, category:"investment", year:2024 },
  { date:"2024-11-03", description:"Condolences for Ms Hellen (Shammy & Rashidah's sister)", amount:500000, category:"welfare", year:2024 },
  { date:"2024-03-24", description:"1st Quarter cake to Faith", amount:100000, category:"welfare", year:2024 },
  { date:"2024-06-30", description:"2nd Quarter cake to Faith", amount:100000, category:"welfare", year:2024 },
  { date:"2024-09-29", description:"3rd Quarter cake to Jane", amount:100000, category:"welfare", year:2024 },
  { date:"2024-11-12", description:"Club Reunion", amount:850000, category:"social", year:2024 },
  { date:"2024-12-22", description:"4th Quarter cake to Faith", amount:100000, category:"welfare", year:2024 },
];

const fines = [
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2022-03-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Nakimuli Annet",    reason:"Absent from meeting", date:"2022-03-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Ssetumba David",    reason:"Absent from meeting", date:"2022-03-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Achom Phionah",     reason:"Absent from meeting", date:"2022-03-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Nabuuma Teopista",  reason:"Absent from meeting", date:"2022-06-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Kintu Ernest",      reason:"Absent from meeting", date:"2022-06-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Namuyimba Kenneth", reason:"Absent from meeting", date:"2022-06-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Bangi Aidah",       reason:"Absent from meeting", date:"2022-06-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2022-06-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Neria",             reason:"Absent from meeting", date:"2022-09-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Nabuuma Teopista",  reason:"Absent from meeting", date:"2022-09-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Namuyimba Kenneth", reason:"Absent from meeting", date:"2022-09-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Nakimuli Annet",    reason:"Absent from meeting", date:"2022-09-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2022-09-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2022-09-30", amount:30000, status:"paid", year:2022 },
  { memberName:"Nakiwala Ruth",     reason:"Absent from meeting", date:"2022-09-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Achom Phionah",     reason:"Absent from meeting", date:"2022-09-30", amount:15000, status:"paid", year:2022 },
  { memberName:"Ssetumba David",    reason:"Absent from meeting", date:"2022-12-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Namubiru Winnie",   reason:"Absent from meeting", date:"2022-12-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Nansubuga Jane F",  reason:"Absent from meeting", date:"2022-12-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Fortunate",         reason:"Absent from meeting", date:"2022-12-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Nuwahereza Edson",  reason:"Absent from meeting", date:"2022-12-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Nakimuli Annet",    reason:"Absent from meeting", date:"2022-12-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2022-12-31", amount:15000, status:"paid", year:2022 },
  { memberName:"Nakiwala Ruth",     reason:"Absent from meeting", date:"2023-03-31", amount:15000, status:"paid", year:2023 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2023-03-31", amount:15000, status:"paid", year:2023 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2023-03-31", amount:15000, status:"paid", year:2023 },
  { memberName:"Mrs Lule Juliet",   reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Claire Namutebi",   reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Namubiru Winnie",   reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Nakachwa Fortunate",reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Nansubuga Jane F",  reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Nsubuga Moses",     reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Nampewo Winifred",  reason:"Absent from meeting", date:"2023-06-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2023-09-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Nagawa Ruth",       reason:"Absent from meeting", date:"2023-09-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Ssetumba David",    reason:"Absent from meeting", date:"2023-09-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Achom Phionah",     reason:"Absent from meeting", date:"2023-09-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2023-09-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Kintu Ernest",      reason:"Absent from meeting", date:"2023-09-30", amount:15000, status:"paid", year:2023 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2023-12-31", amount:15000, status:"paid", year:2023 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2024-03-31", amount:15000, status:"paid", year:2024 },
  { memberName:"Namubiru Winnie",   reason:"Absent from meeting", date:"2024-03-31", amount:15000, status:"paid", year:2024 },
  { memberName:"Kintu Ernest",      reason:"Absent from meeting", date:"2024-03-31", amount:15000, status:"paid", year:2024 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2024-06-30", amount:15000, status:"paid", year:2024 },
  { memberName:"Nakakande Shebah",  reason:"Absent from meeting", date:"2024-06-30", amount:15000, status:"paid", year:2024 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2024-06-30", amount:15000, status:"paid", year:2024 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2024-09-30", amount:15000, status:"paid", year:2024 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2024-09-30", amount:15000, status:"paid", year:2024 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2025-03-31", amount:15000, status:"paid", year:2025 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2025-03-31", amount:15000, status:"paid", year:2025 },
  { memberName:"Mrs Ssali",         reason:"Absent from meeting", date:"2025-03-31", amount:15000, status:"paid", year:2025 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2025-06-30", amount:15000, status:"paid", year:2025 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2025-06-30", amount:15000, status:"paid", year:2025 },
  { memberName:"Mrs Ssali",         reason:"Absent from meeting", date:"2025-06-30", amount:15000, status:"paid", year:2025 },
  { memberName:"Naggayi Constance", reason:"Absent from meeting", date:"2025-09-30", amount:15000, status:"paid", year:2025 },
  { memberName:"Kyamulabi Diana",   reason:"Absent from meeting", date:"2025-09-30", amount:15000, status:"unpaid", year:2025 },
  { memberName:"Mrs Ssali",         reason:"Absent from meeting", date:"2025-09-30", amount:15000, status:"paid", year:2025 },
];

const diasporaFees = [
  { memberName:"NALUKENGE RASHIDA",  year:2022, amount:160000 },
  { memberName:"NAMUBIRU ROSE",      year:2022, amount:180000 },
  { memberName:"NALUKENGE RASHIDA",  year:2023, amount:240000 },
  { memberName:"NAMUBIRU ROSE",      year:2023, amount:100000 },
  { memberName:"NAKIWALA RUTH",      year:2023, amount:160000 },
  { memberName:"NALUKENGE RASHIDA",  year:2024, amount:220000 },
  { memberName:"NAKIWALA RUTH",      year:2024, amount:240000 },
  { memberName:"SSALI SIMON",        year:2024, amount:60000  },
  { memberName:"NAKIWALA RUTH",      year:2025, amount:240000 },
  { memberName:"NALUKENGE RASHIDA",  year:2025, amount:240000 },
  { memberName:"SSALI SIMON",        year:2025, amount:240000 },
  { memberName:"MATOVU JULIUS",      year:2025, amount:60000  },
  { memberName:"NAMPEWO WINNIEFRED", year:2025, amount:60000  },
];

const dividends = [
  { memberName:"MR & MRS LULE STEPHEN",  year:2023, amount:583493, status:"paid" },
  { memberName:"KYAMULABI DIANA",         year:2023, amount:288651, status:"paid" },
  { memberName:"CLAIRE NAMUTEBI",         year:2023, amount:293163, status:"paid" },
  { memberName:"NAGGAYI COSTANCE",        year:2023, amount:290550, status:"paid" },
  { memberName:"NAMUBIRU WINNIE",         year:2023, amount:291747, status:"paid" },
  { memberName:"NAMUYIMBA KENETH",        year:2023, amount:291107, status:"paid" },
  { memberName:"MR & MRS SEKIRANDA",      year:2023, amount:588803, status:"paid" },
  { memberName:"MR & MRS SAM SEBUDDE",    year:2023, amount:582148, status:"paid" },
  { memberName:"NABUUMA TEOPISTA",        year:2023, amount:295251, status:"paid" },
  { memberName:"MR & MRS KIRABIRA",       year:2023, amount:590503, status:"paid" },
  { memberName:"MR & MRS LUUTU",          year:2023, amount:582148, status:"paid" },
  { memberName:"MR & MRS KIGONYA",        year:2023, amount:575960, status:"paid" },
  { memberName:"NAKACHWA FORTUNATE",      year:2023, amount:293835, status:"paid" },
  { memberName:"NUWAHEREZA EDSON",        year:2023, amount:293835, status:"paid" },
  { memberName:"MR & MRS SSALI",          year:2023, amount:590503, status:"paid" },
  { memberName:"KINTU ERNEST",            year:2023, amount:291575, status:"paid" },
  { memberName:"NAMUBIRU ROSE",           year:2023, amount:295251, status:"paid" },
  { memberName:"NANSUBUGA JANE FRANCES",  year:2023, amount:225038, status:"paid" },
  { memberName:"NAKIMULI ANNET",          year:2023, amount:112451, status:"paid" },
  { memberName:"NALUKENGE RASHIDA",       year:2023, amount:117153, status:"paid" },
  { memberName:"MR & MRS SSETUMBA",       year:2023, amount:229605, status:"paid" },
  { memberName:"NAKAKANDE SHEBAH",        year:2023, amount:115737, status:"paid" },
  { memberName:"NSUBUGA MOSES",           year:2023, amount:46616,  status:"paid" },
  { memberName:"MR & MRS MATOVU",         year:2023, amount:84878,  status:"paid" },
];

const registrationFees = [
  { memberName:"MR & MRS LULE STEPHEN",  amount:20000, status:"paid" },
  { memberName:"KYAMULABI DIANA",         amount:10000, status:"paid" },
  { memberName:"CLAIRE NAMUTEBI",         amount:10000, status:"paid" },
  { memberName:"CONSTANCE (WITH KIDS)",   amount:20000, status:"paid" },
  { memberName:"MR & MRS MWIDU",         amount:20000, status:"paid" },
  { memberName:"NAMUYIMBA KENNETH",       amount:10000, status:"paid" },
  { memberName:"MR & MRS SEKIRANDA",     amount:20000, status:"paid" },
  { memberName:"MR & MRS SAM SEBUDDE",   amount:20000, status:"paid" },
  { memberName:"NABUUMA TEOPISTA",        amount:10000, status:"paid" },
  { memberName:"MR & MRS KIRABIRA",      amount:20000, status:"paid" },
  { memberName:"NAKACHWA FORTUNATE",      amount:10000, status:"paid" },
  { memberName:"MR & MRS LUUTU",         amount:20000, status:"paid" },
  { memberName:"MR & MRS KIGONYA",       amount:20000, status:"paid" },
  { memberName:"NUWAHEREZA EDSON",        amount:10000, status:"paid" },
  { memberName:"MR & MRS SSALI",         amount:20000, status:"paid" },
  { memberName:"KINTU ERNEST",            amount:10000, status:"paid" },
  { memberName:"BATENGA N.DIANA",         amount:10000, status:"paid" },
  { memberName:"NANSUBUGA JANE FRANCES",  amount:10000, status:"paid" },
  { memberName:"NAMUBIRU ROSE",           amount:10000, status:"paid" },
];

async function importCollection(name, records, keyFn) {
  const snap = await db.collection(name).get();
  const existing = new Set(snap.docs.map(d => keyFn(d.data())));
  let added = 0, skipped = 0;
  for (const rec of records) {
    if (existing.has(keyFn(rec))) { skipped++; continue; }
    await db.collection(name).add({ ...rec, importedAt: Timestamp.now(), source: 'excel_import' });
    added++;
  }
  console.log(`  ${name}: ${added} added, ${skipped} already existed`);
}

async function run() {
  console.log('\nStarting import...\n');
  console.log('clubIncome...');
  for (const [yr, data] of Object.entries(clubIncome)) {
    await db.collection('clubIncome').doc(yr).set({ ...data, importedAt: Timestamp.now() }, { merge: true });
    process.stdout.write(`  ${yr} `);
  }
  console.log('\n');
  console.log('clubExpenses...');
  await importCollection('clubExpenses', clubExpenses, r => `${r.date}|${r.description}`);
  console.log('fines...');
  await importCollection('fines', fines, r => `${r.date}|${r.memberName}|${r.amount}`);
  console.log('diasporaFees...');
  await importCollection('diasporaFees', diasporaFees, r => `${r.year}|${r.memberName}`);
  console.log('dividends...');
  await importCollection('dividends', dividends, r => `${r.year}|${r.memberName}`);
  console.log('registrationFees...');
  await importCollection('registrationFees', registrationFees, r => r.memberName);
  console.log('\nDone. Refresh the app to see all Club Records data.\n');
  process.exit(0);
}
run().catch(e => { console.error('Error:', e.message); process.exit(1); });
