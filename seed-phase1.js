const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert({
  type: "service_account",
  project_id: "letsgrowinvestmentclub-26878",
  private_key_id: "6450b4f15a356befb988bd0120cb6707732d6b7e",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDY4TyYGsmorrQm\nFUag3k4vVyn+Nr8mN+tUs/fwV6aZejyDtADwS2riTZolqXeUFScXlICsfYaj2Byh\nHPNK6CYnZ2korUTi1HasxO4JFH1jpv0NzWcKbUcGTLXICs3iQjSZMYoSlRTki+kw\nEcNaSVa5mqHt6xbmqzoSpIa5n3zzl2Db3+Lsp3ZmfpV9tOhAlv+1gSmcDf2jEw8H\nPTjMTturuSKelCwW61WGfsP+iwIp3pPnfLYfCMXJosekQwywk/XpA6szT+C0P2vi\nSCWQBg3U6fzbnRa9uH2u6nwVIuHz3jHkyvtJ7Ij4lqhTTKq6TsdTbIPXfcNXI/6g\njlQngMEHAgMBAAECggEARaYLthNAOLYmL2a8wFO0Cxr0ZunA+C6UGicTlDEp1Pb+\n8RLBDGpD4HooazjhqIIkhDuSGRLUxtBT3V+1OBSWkCfzCved/DRcCj7R7MOSQwrx\nEFoq4ZvXZ8wBwsTJeoRlbN8OZspOo9jUobXKpTeRLNjecNADEj/hzfPdOkZgM7+N\nlA9sc5CJEe55uIMAuLcfNWTkR8I7RGrVBBlu+uej7tuPpE/nWeD2Eyb8bF4Yva9A\ndtZl4ZO9mbtSzt+PzWjJvghZhv3EXNGhaROfDmoWQ5qDWnabM+XReobsJ3smIGJc\nhjB15wvcvgs+21bnj8wKEdPGMLx6CVhPGoeagZ/raQKBgQDzlqPbtnoPqr+87uH9\nKALCLdD2anBZuD1YBWvzXHax2VTAYnnDk3LCEpyW9vjHOyRPTU9su9Mg8FNS/nKv\n9AzWAZGO88QcriIRGeyfwxE7e1wvts+kalcQgPv3iwMWpvri84QsV58uNHHmNPJd\neuWoyCaKhnNWkD9YdchZek/j+QKBgQDj7jXccduhWAQb/7LoOpWK82a8c5QakJYR\n5/VY6zSgYtDmmZkBIdYmk06pX4gYvlQ2y6jtKfK8eIanQHHM/PBTRE6kBpScQp3A\nDDYhXBbN8C8Q7OY9bSkztvL6w6dwzyv5d/nRcJ+YR0K5cFgQmpl3BfTsAnAYvb3y\nAK3MMmUM/wKBgD3dw6448VVrU5ljvqfycojo5ArBy9ktrv7dGabMlCTlgt395Nkk\naOAbpAO/pD3NqpItm3+NULkr8K3CjFReEqiD63k4NlXmcCaRxARrocPOuAIyVxh2\nHbjGWbhsaRNmw4/Cs44jjv1IOqlyRyAw54VvmEJUlZSlvED2YTVAmGvZAoGBAMA/\nUoSuMC6lG0o2YMNJboq1g+jdn4TMgRd3S1SFhmzlDAgEc64lyQfeZZGsdxFPr55M\nJx5qrEdVbVWyoIniqh3BVoc42a327jFm211F3CI1PK2M8yHKad8pp0XlMtyOkSuo\nizihQqthJ6FbZZwTme9vQcayw7PKjmSJOA4sT1knAoGAPLQb6nR8GjJndseF6r0P\nlNOnAoEa9PT/8ES9tNQ9posrASQRZHf5NPlESCpTD0wFWtRPBw52uxGX1ORztsq5\nl+pu8/BzD1hmppVdjFkZyyip9OvQFagD/idU77g0PKke4WaAoTG9Q5uW+veTYt3C\n+nBfPI2/xi6Lh9SBhXlVSAU=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@letsgrowinvestmentclub-26878.iam.gserviceaccount.com",
  client_id: "102327647256155860065"
})});
const db = admin.firestore();
async function run() {
  console.log('Phase 1b: remaining 4 members...');
  const updates = [
    { id:'nabunya_shamera',  sub:120000, wel:30000,  gla:39000,  ut:30000  },
    { id:'babirye_joan',     sub:80000,  wel:20000,  gla:26000,  ut:20000  },
    { id:'nuwahereza_edson', sub:40000,  wel:10000,  gla:13000,  ut:10000  },
    { id:'kigonya_antonio',  sub:40000,  wel:0,      gla:0,      ut:0      },
  ];
  for (const m of updates) {
    await db.collection('members').doc(m.id).set({
      subscriptionByYear: { '2026': m.sub },
      welfareByYear:      { '2026': m.wel },
      glaByYear:          { '2026': m.gla },
      unitTrustByYear:    { '2026': m.ut  },
    }, { merge: true });
    console.log('  done: ' + m.id);
  }
  console.log('Phase 1 complete!');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
