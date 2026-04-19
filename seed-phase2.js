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
  console.log('Phase 2: Diaspora fees...');
  const data = [
    { id:'nalukenge_rashida', fees:{'2022':160000,'2023':240000,'2024':220000,'2025':240000,'2026':0} },
    { id:'nakiwala_ruth',     fees:{'2023':160000,'2024':240000,'2025':240000,'2026':0} },
    { id:'ssali_simon',       fees:{'2024':60000,'2025':240000,'2026':0} },
    { id:'nanfuka_jane',      fees:{'2024':0,'2025':0,'2026':0} },
    { id:'sekiranda_simon',   fees:{'2024':0,'2025':0,'2026':0} },
    { id:'matovu_julius',     fees:{'2025':60000,'2026':0} },
    { id:'nampeewo_winniefred', fees:{'2025':60000,'2026':0} },
    { id:'namubiru_rose',     fees:{'2022':180000,'2023':60000} },
  ];
  for (const d of data) {
    await db.collection('members').doc(d.id).set({
      diasporaFeeByYear: d.fees,
      isDiaspora: true,
    }, { merge: true });
    console.log('  done: ' + d.id);
  }
  console.log('Phase 2 complete!');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
