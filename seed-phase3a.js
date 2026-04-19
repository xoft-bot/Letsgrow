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
  console.log('Phase 3a: Juniors 1-10...');
  const juniors = [
    { id:'nathan_jade_lule', name:'Nathan Jade Lule Luutu', parentMemberId:'luutu_daniel', parentName:'Luutu Daniel', joinYear:2024, sub:{'2024':240000,'2025':240000,'2026':240000}, wel:{'2024':60000,'2025':60000,'2026':60000} },
    { id:'jasper_ssali', name:'Jasper Ssali Ssewanonda', parentMemberId:'ssali_simon', parentName:'Ssali Simon Peter', joinYear:2024, sub:{'2024':240000,'2025':240000,'2026':0}, wel:{'2024':60000,'2025':60000,'2026':0} },
    { id:'ndagire_catherine', name:'Ndagire Catherine Skylar', parentMemberId:'ssali_simon', parentName:'Ssali Simon Peter', joinYear:2024, sub:{'2024':20000,'2025':0,'2026':0}, wel:{'2024':5000,'2025':0,'2026':0} },
    { id:'ryan_lule_lwanga', name:'Ryan Cyprian Lule Lwanga', parentMemberId:'lule_stephen', parentName:'Lule Stephen Musisi', joinYear:2024, sub:{'2024':80000,'2025':0,'2026':0}, wel:{'2024':20000,'2025':0,'2026':0} },
    { id:'hezel_matovu', name:'Hezel Wenceslaus Adrian Matovu', parentMemberId:'matovu_julius', parentName:'Matovu Julius', joinYear:2024, sub:{'2024':240000,'2025':240000,'2026':0}, wel:{'2024':60000,'2025':60000,'2026':0} },
    { id:'erik_nuwahereza', name:'Erik Danil Nuwahereza', parentMemberId:'nuwahereza_edson', parentName:'Nuwahereza Edson', joinYear:2024, sub:{'2024':0,'2025':0,'2026':0}, wel:{'2024':0,'2025':0,'2026':0} },
    { id:'elisha_nuwahereza', name:'Elisha Joshua Nuwahereza', parentMemberId:'nuwahereza_edson', parentName:'Nuwahereza Edson', joinYear:2024, sub:{'2024':0,'2025':0,'2026':0}, wel:{'2024':0,'2025':0,'2026':0} },
    { id:'alpha_rashida', name:'Alpha Rashida Kulumba', parentMemberId:'nalukenge_rashida', parentName:'Nalukenge Rashida', joinYear:2024, sub:{'2024':240000,'2025':180000,'2026':0}, wel:{'2024':60000,'2025':45000,'2026':0} },
    { id:'jayden_izimba', name:'Jayden Elvis Liam Izimba', parentMemberId:'kigonya_antonio', parentName:'Kigonya Antonio', joinYear:2024, sub:{'2024':100000,'2025':0,'2026':0}, wel:{'2024':25000,'2025':0,'2026':0} },
    { id:'bianca_ssali', name:'Bianca Ssali', parentMemberId:'ssali_simon', parentName:'Ssali Simon Peter', joinYear:2024, sub:{'2024':40000,'2025':0,'2026':0}, wel:{'2024':10000,'2025':0,'2026':0} },
  ];
  for (const j of juniors) {
    await db.collection('juniors').doc(j.id).set({
      name: j.name, parentMemberId: j.parentMemberId, parentName: j.parentName,
      joinYear: j.joinYear, isActive: true,
      subscriptionByYear: j.sub, welfareByYear: j.wel,
      monthlySubscription: 20000, monthlyWelfare: 5000, annualTarget: 300000,
    }, { merge: true });
    console.log('  done: ' + j.name);
  }
  console.log('Phase 3a complete!');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
