// ── session.js — Session timeout + Device limit ───────────────
// Loaded by app.js: import('./session.js')
// Requires window.__lg to be set first.
// ─────────────────────────────────────────────────────────────

(async function() {
  function _wait(fn) { if(window.__lg?.STATE) fn(); else setTimeout(()=>_wait(fn),150); }

  _wait(function() {
    const { db, STATE, toast, log, getDoc, setDoc, doc, signOut } =
          { ...window.__lg, signOut: window.__lg.auth ? null : null };
    const _auth = window.__lg.auth || window.auth;
    const _signOut = async () => {
      try { const {signOut:so} = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'); await so(_auth); } catch(e){}
    };

    // ── Session timeout ──────────────────────────────────────
    let _timer = null;
    const TIMEOUT = STATE.isAdmin ? 30*60*1000 : 24*60*60*1000;
    const label   = STATE.isAdmin ? '30 minutes' : '24 hours';
    const reset = () => {
      clearTimeout(_timer);
      _timer = setTimeout(async () => {
        toast(`Session expired after ${label} of inactivity — please sign in again`, 'error');
        await _signOut();
      }, TIMEOUT);
    };
    ['click','keydown','touchstart','scroll','mousemove']
      .forEach(e => document.addEventListener(e, reset, { passive: true }));
    reset();

    // ── Device limit (max 2) ─────────────────────────────────
    (async function _registerDevice() {
      if (!STATE.user || !STATE.member) return;
      try {
        let did = localStorage.getItem('lgic_did');
        if (!did) {
          did = Math.random().toString(36).slice(2) + Date.now().toString(36);
          localStorage.setItem('lgic_did', did);
        }
        const mid = STATE.member.id;
        const ps  = await getDoc(doc(db, 'memberLoginProfiles', mid)).catch(()=>null);
        const devs = ((ps?.exists() ? ps.data() : {}).devices || []).filter(d => d.id !== did);
        if (devs.length >= 2) {
          toast('⚠ Maximum 2 devices — oldest session removed', '');
          devs.sort((a,b) => (a.ts||0)-(b.ts||0));
          devs.shift();
        }
        devs.push({ id: did, ts: Date.now(), ua: navigator.userAgent.slice(0,60) });
        await setDoc(doc(db, 'memberLoginProfiles', mid), { devices: devs }, { merge: true });
      } catch(e) { log('Device: '+e.message); }
    })();

    // ── FCM push notifications ───────────────────────────────
    const FCM_VAPID = 'YOUR_FCM_VAPID_KEY'; // fill in from Firebase Console
    (async function _initFCM() {
      if (FCM_VAPID === 'YOUR_FCM_VAPID_KEY') return;
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
      try {
        const { getMessaging, getToken, onMessage } =
          await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js');
        const msg = getMessaging(window.__lg.fbApp || window.fbApp);
        if (await Notification.requestPermission() !== 'granted') return;
        const sw  = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const tok = await getToken(msg, { vapidKey: FCM_VAPID, serviceWorkerRegistration: sw });
        if (tok && STATE.member) {
          await setDoc(doc(db,'members',STATE.member.id), { fcmToken: tok }, { merge: true });
        }
        onMessage(msg, p => toast(`📣 ${p.notification?.title||''}: ${p.notification?.body||''}`));
      } catch(e) { log('FCM: '+e.message); }
    })();
  });
})();
