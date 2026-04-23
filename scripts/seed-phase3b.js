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
  console.log('Phase 3b: Juniors 11-20...');
  const juniors = [
    { id:'ssentongo_remigius', name:'Ssentongo Remigius Smith', parentMemberId:'kigonya_antonio', parentName:'Kigonya Antonio', joinYear:2024, sub:{'2024':60000,'2025':0,'2026':0}, wel:{'2024':15000,'2025':0,'2026':0} },
    { id:'liam_luutu', name:'Liam Joseph Luutu', parentMemberId:'luutu_daniel', parentName:'Luutu Daniel', joinYear:2024, sub:{'2024':200000,'2025':0,'2026':0}, wel:{'2024':50000,'2025':0,'2026':0} },
    { id:'lael_luutu', name:'Lael Orion Luutu', parentMemberId:'luutu_daniel', parentName:'Luutu Daniel', joinYear:2024, sub:{'2024':200000,'2025':0,'2026':0}, wel:{'2024':50000,'2025':0,'2026':0} },
    { id:'senyange_ziwa', name:'Senyange Ziwa Jerom', parentMemberId:'kigonya_antonio', parentName:'Kigonya Antonio', joinYear:2024, sub:{'2024':120000,'2025':0,'2026':0}, wel:{'2024':30000,'2025':0,'2026':0} },
    { id:'kyambbadde_jayden', name:'Kyambbadde Jayden', parentMemberId:'kigonya_antonio', parentName:'Kigonya Antonio', joinYear:2024, sub:{'2024':120000,'2025':0,'2026':0}, wel:{'2024':30000,'2025':0,'2026':0} },
    { id:'nsimbi_jayson', name:'Nsimbi Jayson', parentMemberId:'kirabira_jude', parentName:'Jude Kirabira', joinYear:2024, sub:{'2024':120000,'2025':0,'2026':0}, wel:{'2024':30000,'2025':0,'2026':0} },
    { id:'nakirijja_esther', name:'Nakirijja Esther Elyse', parentMemberId:'nabuuma_teopista', parentName:'Nabuuma Teopista', joinYear:2024, sub:{'2024':60000,'2025':0,'2026':0}, wel:{'2024':15000,'2025':0,'2026':0} },
    { id:'nambatya_elyna', name:'Nambatya Elyna Jenkins', parentMemberId:'nabuuma_teopista', parentName:'Nabuuma Teopista', joinYear:2024, sub:{'2024':40000,'2025':0,'2026':0}, wel:{'2024':15000,'2025':0,'2026':0} },
    { id:'sekiranda_fortunate', name:'Sekiranda Fortunate Grace', parentMemberId:'sekiranda_simon', parentName:'Sekiranda Simon', joinYear:2024, sub:{'2024':240000,'2025':240000,'2026':0}, wel:{'2024':60000,'2025':60000,'2026':0} },
    { id:'archibald_ggenza', name:'Archibald Chilion Wasaggo Ggenza', parentMemberId:'kigonya_antonio', parentName:'Kigonya Antonio', joinYear:2025, sub:{'2025':0,'2026':0}, wel:{'2025':0,'2026':0} },
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
  console.log('Phase 3b complete! ALL DONE.');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
