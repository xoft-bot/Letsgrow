// fix_email_and_balance.js
// 1. Links pedsoule@gmail.com to nuwahereza_edson
// 2. Corrects bank balance fields to match Income Statement exactly
// Run: node fix_email_and_balance.js

const admin = require('firebase-admin');
const sa = require('./serviceAccount.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function fix() {
  // 1. Link email
  await db.collection('members').doc('nuwahereza_edson').update({
    email: 'pedsoule@gmail.com',
    name: 'Edson Nuwahereza',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ Email linked: pedsoule@gmail.com → nuwahereza_edson');

  // 2. Correct bank balance to exactly match Income Statement
  // Total cash inflow: 134,393,100
  // Total cash outflow (expenses + investments): 94,092,222
  // Bank balance: 40,300,878
  //
  // Breakdown from Income Statement:
  // Welfare collected 2021-2026: 1,475,000+2,890,000+3,680,000+3,560,000+3,130,000+300,000 = 15,035,000
  // GLA 2024-2026: 4,628,000+4,069,000+390,000 = 9,087,000
  // Unit Trust 2024-2026: 3,560,000+3,130,000+300,000 = 6,990,000
  // Juniors sub 2024-2026: 2,360,000+1,140,000+240,000 = 3,740,000
  // Juniors welfare 2024-2026: 595,000+285,000+60,000 = 940,000
  // Total juniors: 4,680,000
  // Loans pool (residual from bank balance for lending): bank - welfare - juniors = available core
  // Per constitution, loans pool is separate working capital
  // Using 4,508,878 as loans pool (40,300,878 - 15,035,000 - 9,087,000 - 6,990,000 - 4,680,000 = 508,878... )
  // Actually the balance 40.3M IS the net bank balance after all outflows including investments
  // The breakdown shows WHERE money is allocated/earmarked within that balance:

  const bankBalance = {
    total: 40300878,
    // Earmarked allocations within the total:
    welfare: 15035000,       // welfare contributions net of welfare expenses
    gla: 9087000,            // GLA paid to ICEA (already deployed)
    unitTrust: 6990000,      // Unit trust deployed to ICEA
    letsGrowJunior: 4680000, // Junior account (separate)
    loansPool: 4508878,      // Available for member loans
    // Summary figures from income statement:
    totalInflow: 134393100,
    totalExpenses: 18632222,
    totalInvested: 75460000,
    returnOnInvestment: 22850000,
    asOf: '2026-03-29',
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('club').doc('bankBalance').set(bankBalance);
  console.log('✅ Bank balance corrected: UGX 40,300,878');
  console.log('   Welfare:         UGX 15,035,000');
  console.log('   GLA (ICEA):      UGX  9,087,000');
  console.log('   Unit Trust:      UGX  6,990,000');
  console.log('   Juniors:         UGX  4,680,000');
  console.log('   Loans Pool:      UGX  4,508,878');

  // 3. Also update club/financials with correct totals
  await db.collection('club').doc('financials').update({
    'bankBalance.total': 40300878,
    totalIncome: 134393100,
    totalExpenses: 94092222,
    returnOnInvestment: 22850000,
    asOf: '2026-03-29'
  });
  console.log('✅ Club financials updated');

  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
