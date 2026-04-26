// ── app.js — Let's Grow Investment Club ──────────────────────
// Core: Firebase, Auth, Navigation, Dashboard, Tracker,
//       Account, Members, Investments, Notifications,
//       Admin General, Signup, Member Detail Modal.
//
// Loan logic lives in loans.js (imported at bottom of this file).
// To debug loans: edit loans.js only.
// To debug styling: edit styles.css only.
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, sendPasswordResetEmail,
  signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs,
  addDoc, serverTimestamp, query, where, orderBy, limit, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── FIREBASE INIT ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBAqSyHIn8IfwOKzWf0whgWwFP3-YUQ3vQ",
  authDomain: "letsgrowinvestmentclub-26878.firebaseapp.com",
  projectId: "letsgrowinvestmentclub-26878",
  storageBucket: "letsgrowinvestmentclub-26878.firebasestorage.app",
  messagingSenderId: "209749782294",
  appId: "1:209749782294:web:069f8353e806da0d6a2a37",
  measurementId: "G-L3215N99KY"
};

const fbApp = initializeApp(firebaseConfig);
const auth  = getAuth(fbApp);
const db    = getFirestore(fbApp);

// ── ERROR OVERLAY ─────────────────────────────────────────────
window.addEventListener('error', e => log(`[ERR] ${e.message} line:${e.lineno}`));
window.addEventListener('unhandledrejection', e => log(`[PROMISE] ${e.reason?.message||e.reason}`));
function log(msg) {
  document.getElementById('err-overlay').classList.add('show');
  document.getElementById('err-log').innerHTML += msg + '<br>';
}

// ── SHARED CONSTANTS & STATE ──────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATE  = { user: null, member: null, isAdmin: false, allMembers: [] };
// Declare shared caches at module top — prevents TDZ when showSection fires early
let allMembersCache = [];
// ── HELPERS ───────────────────────────────────────────────────
function fmt(n) {
  if (n === undefined || n === null) return '—';
  n = Number(n);
  if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
  if (n >= 1e3) return Math.round(n/1e3) + 'K';
  return n.toLocaleString();
}

function fmtFull(n) {
  if (!n) return '—';
  return 'UGX ' + Number(n).toLocaleString();
}

function toast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show' + (type ? ' '+type : '');
  setTimeout(() => t.className = '', 3000);
}

// ── PASSWORD SHOW/HIDE TOGGLE ─────────────────────────────────
window.togglePwd = function(inputId, btn) {
  const inp  = document.getElementById(inputId);
  const icon = btn.querySelector('svg');
  if (!inp) return;
  const isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  // Eye-off icon when showing, eye icon when hiding
  icon.innerHTML = isHidden
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  btn.style.color = isHidden ? '#c9a84c' : '#ffffff50';
};

// ── EXPOSE SHARED OBJECTS FOR loans.js ───────────────────────
// loans.js reads window.__lg to access db, STATE, helpers.
// This is set after Firebase is initialised (right here).
window.__lg = { db, auth, STATE, fmt, fmtFull, toast, MONTHS, serverTimestamp, log,
                getDoc, setDoc, addDoc, collection, getDocs, doc, query, where, orderBy, limit, deleteDoc };

// ── LOGIN UI ──────────────────────────────────────────────────
window.showForgot = () => {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('forgot-form').style.display = 'block';
  document.getElementById('login-error').classList.remove('show');
};
window.showLogin = () => {
  document.getElementById('forgot-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
};

window.doEmailLogin = async function() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.remove('show');
  if (!email || !pass) { errEl.textContent = 'Please enter email and password.'; errEl.classList.add('show'); return; }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e) {
    const msgs = {
      'auth/wrong-password': 'Incorrect password.',
      'auth/user-not-found': 'No account found for this email.',
      'auth/invalid-email':  'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
    };
    errEl.textContent = msgs[e.code] || 'Sign-in failed. Contact admin.';
    errEl.classList.add('show');
  }
};

window.doPasswordReset = async function() {
  const email = document.getElementById('reset-email').value.trim();
  const errEl = document.getElementById('login-error');
  if (!email) { errEl.textContent = 'Enter your email address.'; errEl.classList.add('show'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    document.getElementById('reset-success').classList.add('show');
  } catch(e) {
    errEl.textContent = 'Could not send reset email. Check the address.';
    errEl.classList.add('show');
  }
};

window.doSignOut = async function() {
  try { await signOut(auth); } catch(e) { toast(e.message,'error'); }
};

// ── AUTH STATE ────────────────────────────────────────────────

// Safety fallback — hide spinner after 3 seconds if auth doesn't fire
setTimeout(() => {
  const l = document.getElementById('loading-screen');
  const lg = document.getElementById('login-screen');
  if (l && l.style.display !== 'none') {
    l.style.display = 'none';
    if (lg) lg.classList.add('visible');
  }
}, 3000);

onAuthStateChanged(auth, async user => {
  const loading = document.getElementById('loading-screen');
  const loginEl = document.getElementById('login-screen');
  const appEl   = document.getElementById('app');

  if (!user) {
    loading.style.display = 'none';
    loginEl.classList.add('visible');
    appEl.classList.remove('visible');
    return;
  }

  try {
    let isAdmin = false;

    // ── STEP 1: approvedEmails is the authoritative source ───────
    // Screenshot confirms: pedsoule@gmail.com → memberId:"nuwahereza-edson", role:"admin"
    // This is CORRECT. We use memberId from here to load the right member doc.
    const approvedSnap = await getDoc(doc(db, 'approvedEmails', user.email));
    if (approvedSnap.exists()) {
      isAdmin = approvedSnap.data().role === 'admin';
      const memberId = approvedSnap.data().memberId;
      if (memberId) {
        const mSnap = await getDoc(doc(db, 'members', memberId));
        if (mSnap.exists()) {
          STATE.member = { id: mSnap.id, ...mSnap.data() };
        }
      }
    }

    // Hard-coded admin override
    if (['pedsoule@gmail.com'].includes(user.email)) isAdmin = true;

    // ── STEP 2: Fallback — search by uid (handles new signups) ───
    if (!STATE.member && user.uid) {
      const byUid = await getDocs(query(collection(db,'members'), where('uid','==', user.uid)));
      if (!byUid.empty) {
        STATE.member = { id: byUid.docs[0].id, ...byUid.docs[0].data() };
      }
    }

    // ── STEP 3: Last resort — email query ─────────────────────────
    // NOTE: This will incorrectly find Kigonya if his doc still has
    // pedsoule@gmail.com stored. Fix by going to Firestore console →
    // members → mr-and-mrs-antonio-kigonya (or similar) → delete the
    // email field or set it to his correct email.
    if (!STATE.member) {
      const byEmail = await getDocs(query(collection(db,'members'), where('email','==', user.email)));
      if (!byEmail.empty) {
        STATE.member = { id: byEmail.docs[0].id, ...byEmail.docs[0].data() };
      }
    }

    if (!STATE.member) {
      toast('Access denied — your email is not linked to any member record. Contact admin.', 'error');
      await signOut(auth);
      loading.style.display = 'none';
      loginEl.classList.add('visible');
      return;
    }

    STATE.user    = user;
    STATE.isAdmin = isAdmin || STATE.member?.role === 'admin';

    const displayName = STATE.member?.name || STATE.member?.displayName || STATE.member?.primary?.name || user.email;
    document.getElementById('user-initial').textContent = displayName[0].toUpperCase();

    const memberTier = STATE.member?.memberType || STATE.member?.tier || '';
    if (memberTier) {
      const pill = document.getElementById('tier-pill');
      pill.textContent = memberTier.charAt(0).toUpperCase() + memberTier.slice(1);
      pill.style.display = 'inline';
      pill.className = `tier-badge tier-${memberTier}`;
    }

//     const _na=document.getElementById('nav-admin'),_nl=document.getElementById('nav-loans');
//     if(_na)_na.style.display='none'; if(_nl)_nl.style.display='none';
    if (STATE.isAdmin) {
      document.getElementById('admin-pill').style.display = 'inline';
//       if(_na)_na.style.display='flex'; if(_nl)_nl.style.display='flex';
    }

    loading.style.display = 'none';
    loginEl.classList.remove('visible');
    appEl.classList.add('visible');
    showSection('account');

    await Promise.all([loadNotifications()]);
    if (STATE.isAdmin) populateMemberSelect();
    import('./session.js').catch(()=>{});
    // nav.js is now handled by sidebar.js loaded from index.html

  } catch(e) {
    log('Auth error: ' + e.message);
    toast('Error loading profile.', 'error');
    loading.style.display = 'none';
    loginEl.classList.add('visible');
  }
});

// ── NAVIGATION ────────────────────────────────────────────────
window.showSection = function(name, btn) {
  document.getElementById('app')?.scrollTo(0, 0);
  if (window.closeSidebar) closeSidebar();
  document.querySelectorAll('.section').forEach(s => { s.classList.remove('active'); s.style.display = ''; });
  const _js = document.getElementById('juniors-section'); if (_js) _js.style.display = 'none';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-'+name)?.classList.add('active');
  btn?.classList.add('active');
  if (name === 'members')       loadMembers();
  if (name === 'investments')   loadInvestments();
  if (name === 'loans')         loadLoansSection();
  if (name === 'account')       { loadMyAccount(); setTimeout(() => window.loadLoanStatus?.(), 400); }
  if (name === 'notifications') {
    markNotifsRead();
    loadInbox();
    if (STATE.isAdmin) {
      const bb=document.getElementById('inbox-broadcast-btn'); if(bb) bb.style.display='inline-block';
      const ta=document.getElementById('inbox-tab-all'); if(ta) ta.style.display='inline-block';
      populateInboxMemberSelect();
    }
  }
  if (name === 'admin') {
    showAdminTab('general');
    if (STATE.isAdmin) document.getElementById('balance-breakdown').style.display='block';
  }
  if (name === 'dashboard' && STATE.isAdmin) { document.getElementById('balance-breakdown').style.display='block'; loadDashboard(); }
};

// ── DASHBOARD ─────────────────────────────────────────────────
async function loadNoticeBoard() {
  try {
    const { getDocs, collection, query, where, orderBy, limit } = window.__lg;
    const q = query(
      collection(db, 'notifications'),
      where('pinned', '==', true),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);
    const wrap = document.getElementById('dashboard-notices');
    const list = document.getElementById('dashboard-notices-list');
    if (!wrap || !list) return;
    if (snap.empty) { wrap.style.display = 'none'; return; }
    list.innerHTML = '';
    snap.forEach(d => {
      const n = d.data();
      const date = n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
      const postedBy = n.postedBy || n.author || 'Admin';
      list.innerHTML += `<div style="background:var(--card);border:0.5px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:6px">
        <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:3px">${n.title||''}</div>
        <div style="font-size:12px;color:var(--ink);line-height:1.5;margin-bottom:6px">${n.body||n.message||''}</div>
        <div style="font-size:10px;color:var(--muted)">Posted by ${postedBy} · ${date}</div>
      </div>`;
    });
    wrap.style.display = 'block';
  } catch(e) { console.log('NoticeBoard:', e.message); }
}

async function loadDashboard() {
  try {
    const [bankSnap, finSnap, membersSnap] = await Promise.all([
      getDoc(doc(db, 'club', 'bankBalance')),
      getDoc(doc(db, 'settings', 'financials')),
      getDocs(collection(db, 'members')),
    ]);

    let bal=0, inflow=0, invested=0, roi=0, ut=0, loanPool=0;

    if (bankSnap.exists()) {
      const b = bankSnap.data();
      bal      = b.total || 0;
      inflow   = b.totalInflow || 0;
      invested = b.totalInvested || 0;
      roi      = b.returnOnInvestment || 0;
      ut       = b.unitTrust || 0;
      loanPool = Math.round((b.total||0)*0.30); // always live 30%
      const updated = b.updatedAt?.toDate ? b.updatedAt.toDate().toLocaleDateString('en-GB',{month:'short',year:'numeric'}) : '';
      if (updated) document.getElementById('h-balance-date').textContent = `Uganda Shillings · Updated ${updated}`;
      if (document.getElementById('bd-welfare'))  document.getElementById('bd-welfare').textContent  = fmtFull(b.welfare||0);
      if (document.getElementById('bd-gla'))      document.getElementById('bd-gla').textContent      = fmtFull(b.gla||0);
      if (document.getElementById('bd-ut'))       document.getElementById('bd-ut').textContent       = fmtFull(b.unitTrust||0);
      if (document.getElementById('bd-junior'))   document.getElementById('bd-junior').textContent   = fmtFull(b.letsGrowJunior||0);
      if (document.getElementById('bd-loanpool')) document.getElementById('bd-loanpool').textContent = fmtFull(loanPool);
    } else if (finSnap.exists()) {
      const d = finSnap.data();
      bal=d.bankBalance||0; inflow=d.totalInflow||0; invested=d.totalInvested||0;
      roi=d.confirmedROI||0; ut=d.unitTrustBalance||0;
    }

    // Hero
    const _s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    _s('h-balance',fmt(bal));_s('h-inflow',fmt(inflow));_s('h-invested',fmt(invested));
    _s('h-roi',fmt(roi));_s('h-ut',fmt(ut));_s('s-invested',fmt(invested));
    if(STATE.isAdmin){_s('s-loanpool',fmt(loanPool));}
    else{const _lp=document.getElementById('s-loanpool');if(_lp&&_lp.parentElement)_lp.parentElement.style.display='none';}

    // Active member count + FY2026 progress
    const currentYear = new Date().getFullYear();
    let activeCount = 0, upToDateCount = 0, totalSub2026 = 0, totalTarget2026 = 0;
    membersSnap.forEach(d => {
      const m = d.data();
      if (['active','diaspora'].includes(m.status)) {
        activeCount++;
        const rate    = m.monthlySubscription || m.monthlyRate || 40000;
        const paid    = m.subscriptionByYear?.[String(currentYear)] || 0;
        const target  = rate * 12;
        totalSub2026 += paid;
        totalTarget2026 += target;
        const curMonth = new Date().getMonth();
        const expectedNow = rate * (curMonth + 1);
        if (paid >= expectedNow) upToDateCount++;
      }
    });
    document.getElementById('s-active').textContent = activeCount;

    const subPct     = totalTarget2026 > 0 ? Math.round(totalSub2026/totalTarget2026*100) : 0;
    const memberPct  = activeCount > 0 ? Math.round(upToDateCount/activeCount*100) : 0;
    // loanUtil calculated in loans tab — no placeholder needed here

    document.getElementById('fy-year-badge').textContent = `Jan–Dec ${currentYear}`;
    document.getElementById('fy-sub-label').textContent  = `${fmt(totalSub2026)} / ${fmt(totalTarget2026)}`;
    document.getElementById('fy-sub-bar').style.width    = subPct + '%';
    document.getElementById('fy-sub-bar').style.background = subPct >= 80 ? '#166534' : subPct >= 50 ? '#d97706' : '#991b1b';
    document.getElementById('fy-members-label').textContent = `${upToDateCount} of ${activeCount} up to date`;
    document.getElementById('fy-members-bar').style.width   = memberPct + '%';

    if (STATE.isAdmin) {
      const fb=document.getElementById('f-balance');   if(fb)  fb.value  = bal||'';
      const fi=document.getElementById('f-inflow');    if(fi)  fi.value  = inflow||'';
      const fv=document.getElementById('f-invested');  if(fv)  fv.value  = invested||'';
      const fr=document.getElementById('f-roi');       if(fr)  fr.value  = roi||'';
      const fu=document.getElementById('f-ut');        if(fu)  fu.value  = ut||'';
      document.getElementById('balance-breakdown').style.display = 'block';
      const addEvtBtn = document.getElementById('add-event-btn');
      if (addEvtBtn) addEvtBtn.style.display = 'inline-block';
    } else {
      const addEvtBtn = document.getElementById('add-event-btn');
      if (addEvtBtn) addEvtBtn.style.display = 'none';
    }
  } catch(e) { log('Dashboard: '+e.message); }

  // Load finances summary + events in parallel
  await Promise.all([loadFinancesSummary(), loadEvents()]);
}

// ── FINANCES: INCOME & EXPENDITURE ───────────────────────────
let _financesData = null; // cached after first load

async function loadFinancesSummary() {
  try {
    const [incomeSnap, expSnap] = await Promise.all([
      getDocs(collection(db, 'clubIncome')),
      getDocs(collection(db, 'clubExpenses')),
    ]);

    const incomeByYear = {};
    incomeSnap.forEach(d => { incomeByYear[d.id] = d.data(); });

    const expByYear = {};
    let totalExpenses = 0;
    expSnap.forEach(d => {
      const e = d.data();
      const yr = e.year || (e.date ? new Date(e.date).getFullYear() : 'Unknown');
      if (!expByYear[yr]) expByYear[yr] = [];
      expByYear[yr].push({ id: d.id, ...e });
      totalExpenses += e.amount || 0;
    });

    const totalIncome = Object.values(incomeByYear).reduce((s, y) => s + (y.total || 0), 0);
    document.getElementById('fin-total-income').textContent   = fmtFull(totalIncome);
    document.getElementById('fin-total-expenses').textContent = fmtFull(totalExpenses);

    _financesData = { incomeByYear, expByYear };

    // Build year tabs
    const years = [...new Set([
      ...Object.keys(incomeByYear),
      ...Object.keys(expByYear)
    ])].filter(y => y !== 'Unknown').sort().reverse();

    const tabsEl = document.getElementById('fin-year-tabs');
    if (tabsEl && years.length) {
      tabsEl.innerHTML = years.map((y, i) =>
        `<button onclick="showFinancesYear('${y}',this)"
          style="padding:4px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;
          background:${i===0?'var(--ink)':'var(--border)'};color:${i===0?'#fff':'var(--ink)'}">${y}</button>`
      ).join('');
      if (years.length) showFinancesYear(years[0], tabsEl.firstChild);
    } else if (tabsEl) {
      tabsEl.innerHTML = '<div style="font-size:12px;color:var(--muted)">No data yet — admin can add entries below</div>';
    }

    const _faa=document.getElementById('fin-admin-add');if(_faa)_faa.style.display='none';
  } catch(e) { log('Finances: '+e.message); }
}

window.showFinancesYear = function(year, btn) {
  // Update tab styles
  document.querySelectorAll('#fin-year-tabs button').forEach(b => {
    b.style.background = 'var(--border)'; b.style.color = 'var(--ink)';
  });
  if (btn) { btn.style.background = 'var(--ink)'; btn.style.color = '#fff'; }

  if (!_financesData) return;
  const income  = _financesData.incomeByYear[year] || {};
  const expenses = _financesData.expByYear[year] || [];

  // Income rows
  const incomeFields = [
    ['subscriptions', 'Member Subscriptions'],
    ['welfare', 'Welfare Fees'],
    ['gla', 'Group Life Assurance'],
    ['unitTrust', 'Unit Trust'],
    ['registration', 'Registration Fees'],
    ['fines', 'Fines & Penalties'],
    ['diaspora', 'Diaspora Fees'],
    ['juniorSub', "Juniors' Subscriptions"],
    ['juniorWelfare', "Juniors' Welfare"],
    ['other', 'Other Income'],
  ];
  const incomeEl = document.getElementById('fin-income-rows');
  let totalInc = 0;
  incomeEl.innerHTML = incomeFields
    .filter(([k]) => income[k] > 0)
    .map(([k, label]) => {
      totalInc += income[k] || 0;
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
        <span style="color:var(--muted)">${label}</span>
        <span style="font-weight:500;color:#166534">${fmtFull(income[k])}</span>
      </div>`;
    }).join('') || '<div style="font-size:12px;color:var(--muted);padding:6px 0">No income data for this year</div>';

  if (totalInc > 0) {
    incomeEl.innerHTML += `<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:12px;font-weight:700">
      <span>Total Income</span><span style="color:#166534">${fmtFull(totalInc)}</span>
    </div>`;
  }

  // Expense rows
  const expEl = document.getElementById('fin-expense-rows');
  let totalExp = 0;
  expEl.innerHTML = expenses.length ? expenses.map(e => {
    totalExp += e.amount || 0;
    const dateStr = e.date ? new Date(e.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—';
    return `<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
      <div>
        <div>${e.particular || e.description || '—'}</div>
        <div style="font-size:10px;color:var(--muted)">${dateStr} · ${e.category||'other'}</div>
      </div>
      <span style="font-weight:500;color:#991b1b;flex-shrink:0;margin-left:8px">${fmtFull(e.amount)}</span>
    </div>`;
  }).join('') : '<div style="font-size:12px;color:var(--muted);padding:6px 0">No expenses recorded for this year</div>';

  if (totalExp > 0) {
    expEl.innerHTML += `<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:12px;font-weight:700">
      <span>Total Expenses</span><span style="color:#991b1b">${fmtFull(totalExp)}</span>
    </div>`;
  }

  // Net
  const net = totalInc - totalExp;
  const netEl = document.getElementById('fin-net-val');
  if (netEl) {
    netEl.textContent = fmtFull(Math.abs(net));
    netEl.style.color = net >= 0 ? '#166534' : '#991b1b';
    document.getElementById('fin-net-row').querySelector('span').textContent =
      net >= 0 ? 'Net Surplus' : 'Net Deficit';
  }
};

window.toggleFinances = function(card) {
  const detail   = document.getElementById('finances-detail');
  const chevron  = document.getElementById('finances-chevron');
  const isOpen   = detail.style.display !== 'none';
  detail.style.display = isOpen ? 'none' : 'block';
  chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
};

window.saveExpense = async function() {
  if (!STATE.isAdmin) return;
  const date   = document.getElementById('exp-date').value;
  const amount = Number(document.getElementById('exp-amount').value) || 0;
  const desc   = document.getElementById('exp-desc').value.trim();
  const cat    = document.getElementById('exp-cat').value;
  const msgEl  = document.getElementById('exp-msg');
  if (!desc || !amount || !date) { msgEl.style.color='#991b1b'; msgEl.textContent='Fill in all fields.'; return; }
  msgEl.style.color='var(--muted)'; msgEl.textContent='Saving…';
  try {
    const year = new Date(date).getFullYear();
    await addDoc(collection(db, 'clubExpenses'), {
      date, amount, particular: desc, category: cat, year,
      addedBy: STATE.user?.email, addedAt: serverTimestamp(),
    });
    msgEl.style.color='#166534'; msgEl.textContent='✅ Expense added';
    document.getElementById('exp-date').value = '';
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-desc').value = '';
    _financesData = null; // clear cache to force reload
    await loadFinancesSummary();
  } catch(e) { msgEl.style.color='#991b1b'; msgEl.textContent='Error: '+e.message; }
};

// ── EVENTS / CALENDAR ─────────────────────────────────────────
async function loadEvents() {
  const el = document.getElementById('events-list');
  if (!el) return;
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const snap  = await getDocs(collection(db, 'events'));
    const events = [];
    snap.forEach(d => events.push({ id: d.id, ...d.data() }));

    // Only show upcoming + last 3 days
    const relevant = events
      .filter(e => e.date && new Date(e.date) >= new Date(today.getTime() - 3*86400000))
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    if (!relevant.length) {
      el.innerHTML = '<div class="empty" style="padding:10px 0"><div class="empty-icon">📅</div>No upcoming events</div>';
      return;
    }

    const typeColors = {
      meeting:'#1e40af', agm:'#166534', social:'#6d28d9',
      deadline:'#991b1b', other:'#64748b'
    };
    const typeLabels = {
      meeting:'Meeting', agm:'AGM', social:'Social',
      deadline:'Deadline', other:'Event'
    };

    el.innerHTML = relevant.map(e => {
      const d      = new Date(e.date);
      const isPast = d < today;
      const isToday= d.toDateString() === today.toDateString();
      const dayStr = isToday ? 'TODAY' : d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
      const color  = typeColors[e.type] || '#64748b';
      return `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border);${isPast?'opacity:.5':''}">
        <div style="background:${color}15;border:1px solid ${color}40;border-radius:8px;padding:8px;text-align:center;min-width:52px;flex-shrink:0">
          <div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase">${typeLabels[e.type]||'Event'}</div>
          <div style="font-size:11px;font-weight:700;color:var(--ink);margin-top:2px">${dayStr}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px">${e.title||'Event'}</div>
          ${e.venue ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">📍 ${e.venue}</div>` : ''}
          ${isToday ? `<div style="font-size:10px;color:${color};font-weight:700;margin-top:2px">TODAY</div>` : ''}
        </div>
        ${STATE.isAdmin ? `<button onclick="deleteEvent('${e.id}')" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:0;line-height:1;flex-shrink:0">×</button>` : ''}
      </div>`;
    }).join('');

  } catch(e) { log('Events: '+e.message); }
}

window.toggleAddEvent = function() {
  if (!STATE.isAdmin) return;
  const form = document.getElementById('add-event-form');
  if(form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
};

window.saveEvent = async function() {
  if (!STATE.isAdmin) return;
  const date  = document.getElementById('ev-date').value;
  const type  = document.getElementById('ev-type').value;
  const title = document.getElementById('ev-title').value.trim();
  const venue = document.getElementById('ev-venue').value.trim();
  const msgEl = document.getElementById('ev-msg');
  if (!date || !title) { msgEl.style.color='#991b1b'; msgEl.textContent='Date and title are required.'; return; }
  msgEl.style.color='var(--muted)'; msgEl.textContent='Saving…';
  try {
    await addDoc(collection(db,'events'), {
      date, type, title, venue, createdBy: STATE.user?.email, createdAt: serverTimestamp()
    });
    msgEl.style.color='#166534'; msgEl.textContent='✅ Event saved';
    document.getElementById('ev-date').value = '';
    document.getElementById('ev-title').value = '';
    document.getElementById('ev-venue').value = '';
    await loadEvents();
  } catch(e) { msgEl.style.color='#991b1b'; msgEl.textContent='Error: '+e.message; }
};

window.deleteEvent = async function(eventId) {
  if (!STATE.isAdmin || !confirm('Delete this event?')) return;
  try {
    const { deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    await deleteDoc(doc(db,'events',eventId));
    toast('Event removed','success');
    await loadEvents();
  } catch(e) { toast('Error: '+e.message,'error'); }
};

// ── TRACKER HELPERS ───────────────────────────────────────────
// Derives month-by-month status from subscriptionByYear total.
// green = fully paid up to that month
// yellow = partially paid
// red = nothing paid and month has passed
// grey = future month
function getMonthStatuses(subByYear, monthlyRate, year, currentMonth) {
  const yearKey   = String(year);
  const totalPaid = subByYear?.[yearKey] || 0;
  const rate      = monthlyRate || 40000;
  const statuses  = [];

  for (let mo = 0; mo < 12; mo++) {
    const eom=rate*(mo+1),bom=rate*mo;
    if(totalPaid>=eom) statuses.push('paid');
    else if(totalPaid>bom) statuses.push(mo>currentMonth?'future-partial':'partial');
    else statuses.push(mo>currentMonth?'future':'due');
  }
  return statuses;
}

function getMemberOverallStatus(statuses, currentMonth) {
  const dueSoFar = statuses.slice(0, currentMonth + 1).filter(s => s === 'due').length;
  if (dueSoFar === 0) return 'green';
  if (dueSoFar <= 2)  return 'yellow';
  return 'red';
}

async function loadTracker() {
  const wrap         = document.getElementById('tracker-wrap');
  const currentMonth = new Date().getMonth();
  const currentYear  = new Date().getFullYear();

  try {
    if (!STATE.allMembers.length) {
      const mSnap = await getDocs(collection(db,'members'));
      mSnap.forEach(d => STATE.allMembers.push({ id: d.id, ...d.data() }));
    }

    let activeCount = 0;
    STATE.allMembers.forEach(m => {
      if (['active','diaspora'].includes(m.status)) activeCount++;
    });
    document.getElementById('s-active').textContent = activeCount;

    const active = STATE.allMembers.filter(m =>
      ['active','diaspora','partial'].includes(m.status)
    );

    if (!active.length) { wrap.innerHTML = '<div class="empty">No active members</div>'; return; }

    const withStatus = active.map(m => {
      const rate     = m.monthlySubscription || m.monthlyRate || 40000;
      const statuses = getMonthStatuses(m.subscriptionByYear, rate, currentYear, currentMonth);
      const overall  = getMemberOverallStatus(statuses, currentMonth);
      return { m, statuses, overall, rate };
    });
    withStatus.sort((a,b) => {
      const order = { red:0, yellow:1, green:2 };
      return (order[a.overall]||2) - (order[b.overall]||2);
    });

    const moLabels = { 0:'J',1:'F',2:'M',3:'A',4:'M',5:'J',6:'J',7:'A',8:'S',9:'O',10:'N',11:'D' };

    let html = '';
    for (const { m, statuses, overall, rate } of withStatus) {
      const displayName = m.name || m.displayName || m.primary?.name || m.id;
      const yearTotal   = m.subscriptionByYear?.[String(currentYear)] || 0;
      const expectedNow = rate * (currentMonth + 1);
      const pct         = expectedNow > 0 ? Math.min(100, Math.round(yearTotal / expectedNow * 100)) : 0;
      const statusDot   = overall === 'green'
        ? 'background:#166534;color:#bbf7d0'
        : overall === 'yellow'
        ? 'background:#78350f;color:#fde68a'
        : 'background:#7f1d1d;color:#fecaca';
      const barColor = overall==='green' ? '#166534' : overall==='yellow' ? '#d97706' : '#991b1b';

      let dots = '';
      for (let mo = 0; mo < 12; mo++) {
        const s = statuses[mo];
        let cls, lbl;
        if(s==='paid')                       {cls='mo-paid';    lbl='✓';}
        else if(s==='partial'||s==='future-partial'){cls='mo-partial'; lbl='~';}
        else if(s==='due')                    {cls='mo-due';     lbl='!';}
        else                                  {cls='mo-future';  lbl=moLabels[mo]||'·';}
        dots += `<div class="mo ${cls}" title="${MONTHS[mo]} ${currentYear}">${lbl}</div>`;
      }

      html += `<div class="tracker-row">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
          <div class="tracker-name" style="margin-bottom:0">${displayName}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;${statusDot}">
              ${overall==='green'?'UP TO DATE':overall==='yellow'?'PARTIAL':'BEHIND'}
            </span>
            <span style="font-size:9px;color:var(--muted)">${fmt(yearTotal)}</span>
          </div>
        </div>
        <div style="background:var(--border);border-radius:3px;height:4px;margin-bottom:6px;overflow:hidden">
          <div style="height:100%;border-radius:3px;background:${barColor};width:${pct}%;transition:width .5s"></div>
        </div>
        <div class="months-grid">${dots}</div>
      </div>`;
    }
    wrap.innerHTML = html || '<div class="empty">No data</div>';
  } catch(e) {
    wrap.innerHTML = '<div class="empty">Could not load tracker</div>';
    log('Tracker: '+e.message);
  }
}

// ── MY ACCOUNT ────────────────────────────────────────────────
async function loadMyAccount() {
  const wrap = document.getElementById('account-content');
  if (!STATE.member) {
    wrap.innerHTML = '<div class="empty">Profile not linked to a member record.<br>Contact admin.</div>';
    return;
  }
  const m = STATE.member;
  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const sc2025      = m.totalSubscriptionUpTo2025 || m.totalSubscriptions2025 || 0;
  const loanEligible = m.loanEligibility || Math.round(sc2025 * 0.25);
  const subByYear    = m.subscriptionByYear || {};
  const tierLabel    = (m.memberType || m.tier || 'member').charAt(0).toUpperCase() + (m.memberType || m.tier || 'member').slice(1);
  const displayName  = m.name || m.displayName || m.primary?.name || '—';
  const monthlyRate  = m.monthlySubscription || m.monthlyRate || 40000;

  const sub2026    = subByYear[String(currentYear)] || 0;
  const moStatuses = getMonthStatuses(subByYear, monthlyRate, currentYear, currentMonth);
  const paidMonths = moStatuses.filter(s => s==='paid').length;
  const pct        = Math.round((sub2026 / (monthlyRate * 12)) * 100);
  const overallSt  = getMemberOverallStatus(moStatuses, currentMonth);
  const barColor   = overallSt==='green' ? '#166534' : overallSt==='yellow' ? '#d97706' : '#991b1b';

  let dots = '';
  for (let mo = 0; mo < 12; mo++) {
    const s = moStatuses[mo];
    let cls, lbl;
    if(s==='paid')                       {cls='mo-paid';    lbl='✓';}
    else if(s==='partial'||s==='future-partial'){cls='mo-partial'; lbl='~';}
    else if(s==='due')                    {cls='mo-due';     lbl='!';}
    else                                  {cls='mo-future';  lbl=MONTHS[mo][0];}
    dots += `<div class="mo ${cls}" title="${MONTHS[mo]}">${lbl}</div>`;
  }

  const years = Object.keys(subByYear).sort();
  let historyRows = '';
  let grandTotal = 0;
  for (const yr of years) {
    const paid = subByYear[yr] || 0;
    grandTotal += paid;
    const rowStyle = paid === 0 ? 'color:var(--muted)' : '';
    historyRows += `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px;${rowStyle}">
      <span>${yr}</span>
      <span style="font-weight:500">${fmtFull(paid)}</span>
    </div>`;
  }
  if (!historyRows) historyRows = '<div style="color:var(--muted);font-size:12px">No history available</div>';

  const jointNote = m.accountType === 'joint'
    ? `<div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px">Joint Account · ${m.primary?.name||''} & ${m.secondary?.name||''}</div>` : '';

  const welfareTotal = Object.values(m.welfareByYear||{}).reduce((a,b)=>a+b,0);
  const glaTotal     = Object.values(m.glaByYear||{}).reduce((a,b)=>a+b,0);
  const utTotal      = Object.values(m.unitTrustByYear||{}).reduce((a,b)=>a+b,0);

  wrap.innerHTML = `
    <div class="account-hero">
      <div class="acc-name">${displayName}</div>
      <div class="acc-id">${tierLabel} Member · ${m.accountType==='joint'?'Joint':'Single'} Account · Since ${m.joinYear||'—'}</div>
      ${jointNote}
      <div style="margin-top:16px">
        <div class="acc-label">Total Subscriptions (up to 2025)</div>
        <div class="acc-value">${fmtFull(sc2025)}</div>
        <div class="acc-sub">Monthly rate: ${fmtFull(monthlyRate)} · Status: <span style="color:${m.status==='active'?'#4ade80':m.status==='diaspora'?'#60a5fa':'#fbbf24'}">${m.status||'—'}</span></div>
      </div>
      <div class="loan-eligibility">
        <div>
          <div class="le-label">Loan Eligibility</div>
          <div style="font-size:10px;opacity:.7">25% of subscriptions to 2025</div>
        </div>
        <div class="le-value">${fmtFull(loanEligible)}</div>
      </div>
    </div>

        <div id="amount-due-card"><div style="color:var(--muted);font-size:12px">Calculating…</div></div>
    <div class="card" id="loan-request-card"><div onclick="toggleLoanCard()" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;user-select:none"><div class="card-title" style="margin-bottom:0">Loan</div><span id="loan-card-chev" style="font-size:18px;color:var(--muted);transition:transform .25s">›</span></div><div id="loan-status-wrap" style="display:none;margin-top:12px"></div></div>
    <div class="card"><div onclick="toggleCommitteeCard()" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;user-select:none"><div class="card-title" style="margin-bottom:0">Club Committees</div><span id="comm-chev" style="font-size:18px;color:var(--muted);transition:transform .25s">›</span></div><div id="committees-widget" style="display:none;margin-top:10px"></div></div>

    <div class="card">
      <div class="card-title">${currentYear} Contribution Tracker</div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:8px">
        <span>UGX ${sub2026.toLocaleString()} paid · ~${paidMonths} months</span>
        <span style="font-weight:700;color:${barColor}">${overallSt==='green'?'Up to date':overallSt==='yellow'?'Partial':'Behind'}</span>
      </div>
      <div class="progress-bar" style="margin-bottom:12px">
        <div class="progress-fill" style="width:${Math.min(pct,100)}%;background:${barColor}"></div>
      </div>
      <div class="months-grid">${dots}</div>
    </div>

    <div class="card">
      <div class="card-title">Subscription History (All Years)</div>
      ${historyRows}
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:700;color:var(--gold)">
        <span>Grand Total</span><span>${fmtFull(grandTotal)}</span>
      </div>
    </div>

    ${welfareTotal > 0 || glaTotal > 0 || utTotal > 0 ? `
    <div class="card">
      <div class="card-title">Other Contributions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
        ${welfareTotal > 0 ? `<div style="background:#f8f4ec;border-radius:8px;padding:10px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Welfare</div><div style="font-size:13px;font-weight:700;color:var(--ink);margin-top:4px">${fmt(welfareTotal)}</div></div>` : ''}
        ${glaTotal > 0 ? `<div style="background:#f0f4ff;border-radius:8px;padding:10px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">GLA</div><div style="font-size:13px;font-weight:700;color:var(--ink);margin-top:4px">${fmt(glaTotal)}</div></div>` : ''}
        ${utTotal > 0 ? `<div style="background:#f0fff4;border-radius:8px;padding:10px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Unit Trust</div><div style="font-size:13px;font-weight:700;color:var(--ink);margin-top:4px">${fmt(utTotal)}</div></div>` : ''}
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-title">Membership Status</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">
        <span style="color:var(--muted);font-size:12px">Status</span>
        <span class="status-badge s-${m.status}">${m.status}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid var(--border)">
        <span style="color:var(--muted);font-size:12px">Tier</span>
        <span class="tier-badge tier-${m.memberType||m.tier||'gold'}">${tierLabel}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid var(--border)">
        <span style="color:var(--muted);font-size:12px">Member Since</span>
        <span style="font-size:12px;font-weight:500">${m.joinYear||'—'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid var(--border)">
        <span style="color:var(--muted);font-size:12px">Total Dividends</span>
        <span style="font-size:12px;font-weight:500;color:var(--gold)">${fmtFull(m.dividendsTotal||0)}</span>
      </div>
      ${m.notes ? `<div style="font-size:11px;color:var(--muted);margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">${m.notes}</div>` : ''}
    </div>
  `;
  _calcAmountDue(m).catch(()=>{});
  window.loadLoanStatus?.();
}

window.toggleLoanCard=function(){const w=document.getElementById('loan-status-wrap'),c=document.getElementById('loan-card-chev');if(!w)return;const o=w.style.display!=='none';w.style.display=o?'none':'block';if(c)c.style.transform=o?'':'rotate(90deg)';if(!o&&!w.dataset.loaded){w.dataset.loaded='1';window.loadLoanStatus?.();}};
window.toggleCommitteeCard=function(){const w=document.getElementById('committees-widget'),c=document.getElementById('comm-chev');if(!w)return;const o=w.style.display!=='none';w.style.display=o?'none':'block';if(c)c.style.transform=o?'':'rotate(90deg)';if(!o&&!w.dataset.loaded){w.dataset.loaded='1';_loadCommitteesWidget();}};
async function _calcAmountDue(member){const el=document.getElementById('amount-due-card');if(!el)return;const now=new Date(),yr=now.getFullYear(),mo=now.getMonth(),rate=member.monthlySubscription||member.monthlyRate||40000,paid=(member.subscriptionByYear||{})[String(yr)]||0,subDue=Math.max(0,rate*(mo+1)-paid),months=subDue>0?Math.ceil(subDue/rate):0;let fines=0;try{const fs=await getDocs(query(collection(db,'fines'),where('memberId','==',member.id),where('status','==','unpaid')));fs.forEach(d=>fines+=Number(d.data().amount||0));}catch(e){}const total=subDue+fines;if(total===0){el.innerHTML=`<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:11px 14px"><div style="font-size:11px;font-weight:700;color:#166534">✅ No outstanding balance</div><div style="font-size:10px;color:#15803d;opacity:.8;margin-top:2px">All payments up to date</div></div>`;return;}const sev=months>=4?'#7f1d1d':months>=2?'#991b1b':'#b45309';el.innerHTML=`<div style="background:#fef9f0;border:1.5px solid #f59e0b;border-radius:10px;padding:13px"><div style="font-size:22px;font-weight:800;color:${sev};margin-bottom:6px">${fmtFull(total)}</div><div style="border-top:1px solid var(--border);padding-top:8px">${subDue>0?`<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0"><span style="color:var(--muted)">Subscription (${months} mo behind)</span><span style="font-weight:600;color:${sev}">${fmtFull(subDue)}</span></div>`:''} ${fines>0?`<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0"><span style="color:var(--muted)">Unpaid fines</span><span style="font-weight:600;color:#991b1b">${fmtFull(fines)}</span></div>`:''}<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;padding:5px 0;border-top:1px solid var(--border);margin-top:4px"><span>Total Due</span><span style="color:${sev}">${fmtFull(total)}</span></div></div><div style="font-size:10px;color:var(--muted);margin-top:6px">Late payments attract UGX 15,000 fine per quarter</div></div>`;}
async function _loadCommitteesWidget(){const el=document.getElementById('committees-widget');if(!el)return;el.innerHTML='<div style="color:var(--muted);font-size:12px;padding:6px 0">Loading…</div>';try{const snap=await getDocs(collection(db,'committees'));if(snap.empty){el.innerHTML='<div style="color:var(--muted);font-size:12px">No committee data</div>';return;}let html='';snap.forEach(d=>{const c=d.data();html+=`<details style="margin-bottom:8px;border:1px solid var(--border);border-radius:8px;overflow:hidden"><summary style="padding:10px 12px;font-size:12px;font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center"><span>${c.name||'Committee'}</span><span style="font-size:10px;color:var(--muted);font-weight:400">${c.term||''} ▾</span></summary><div style="padding:4px 12px 10px">${(c.members||[]).map(m=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:11px"><span style="color:var(--muted)">${m.role||'—'}</span><span style="font-weight:600">${m.name||m.memberId?.replace(/-/g,' ')||'—'}</span></div>`).join('')}</div></details>`;});el.innerHTML=html;}catch(e){el.innerHTML='<div style="color:var(--muted);font-size:12px">Could not load committees</div>';}}

// ── MEMBERS ──────────────────────────────────────────────────
async function loadMembers() {
  const list = document.getElementById('members-list');
  list.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';

  try {
    if (!allMembersCache.length) {
      const snap = await getDocs(collection(db,'members'));
      snap.forEach(d => allMembersCache.push({ id: d.id, ...d.data() }));
    }
    const _mc=document.getElementById('member-count');if(_mc)_mc.textContent=`(${allMembersCache.length})`;
    renderMembers(allMembersCache);

    window._juniorsCache=[];
    const jSnap=await getDocs(collection(db,'juniors')).catch(()=>({empty:true,forEach:()=>{}}));
    jSnap.forEach(d=>window._juniorsCache.push({id:d.id,...d.data()}));
    window._estatesCache=[];
    const eSnap=await getDocs(collection(db,'estates')).catch(()=>({empty:true,forEach:()=>{}}));
    eSnap.forEach(d=>window._estatesCache.push({id:d.id,...d.data()}));
    if(!document.getElementById('flt-juniors')){
      const bar=document.querySelector('#sec-members .pill')?.parentElement;
      if(bar){
        if(window._juniorsCache.length){const b=document.createElement('button');b.id='flt-juniors';b.className='pill';b.style.cssText='background:var(--border);color:var(--ink);border:none;cursor:pointer;white-space:nowrap';b.textContent=`Juniors (${window._juniorsCache.length})`;b.onclick=function(){filterMembers('juniors',b);};bar.appendChild(b);}
        if(window._estatesCache.length){const b=document.createElement('button');b.id='flt-estates';b.className='pill';b.style.cssText='background:var(--border);color:var(--ink);border:none;cursor:pointer;white-space:nowrap';b.textContent=`Estates (${window._estatesCache.length})`;b.onclick=function(){filterMembers('estates',b);};bar.appendChild(b);}
      }
    }
  } catch(e) {
    list.innerHTML = '<div class="empty">Error loading members</div>';
    log('Members: '+e.message);
  }
}

function renderMembers(members) {
  const list = document.getElementById('members-list');
  if (!members.length) { list.innerHTML = '<div class="empty">No members found</div>'; return; }
  let html = '';
  members.forEach(m => {
    const _rawName = m.name || m.displayName || m.primary?.name || '';
    const displayName = (_rawName && _rawName !== 'null' && _rawName !== 'undefined' && _rawName.trim())
      ? _rawName.trim()
      : (m.id || 'member').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    const ini = (displayName[0] || '?').toUpperCase();
    const tier = m.memberType || m.tier || '';
    const subLine = [
      tier ? (tier.charAt(0).toUpperCase()+tier.slice(1)) : '',
      m.accountType==='joint' ? 'Joint' : 'Individual',
      m.joinYear ? `Since ${m.joinYear}` : ''
    ].filter(Boolean).join(' · ');
    html += `<div class="member-row" onclick="openMemberDetail('${m.id}')" style="cursor:pointer">
      <div class="m-avatar ${m.status==='deceased'?'deceased':''}">${ini}</div>
      <div class="m-info">
        <div class="m-name">${displayName}</div>
        <div class="m-sub">${subLine}</div>
      </div>
      <span class="status-badge s-${m.status}">${m.status}</span>
    </div>`;
  });
  list.innerHTML = html;
}

window.filterMembers = function(filter, btn) {
  document.querySelectorAll('#sec-members .pill').forEach(b=>{b.style.background='var(--border)';b.style.color='var(--ink)';});
  if(btn){btn.style.background='var(--ink)';btn.style.color='#fff';}
  const list=document.getElementById('members-list');
  if(filter==='juniors'){const jr=window._juniorsCache||[];if(!jr.length){if(list)list.innerHTML='<div class="empty">No junior records</div>';return;}const yr=new Date().getFullYear();if(list)list.innerHTML=jr.sort((a,b)=>(a.name||'').localeCompare(b.name||'')).map(j=>{const ini=(j.name||'?')[0].toUpperCase(),yp=(j.subscriptionByYear||{})[yr]||0,tgt=(j.monthlyRate||20000)*12,pct=Math.min(100,Math.round(yp/tgt*100)),bc=pct>=100?'#166534':pct>=50?'#d97706':'#991b1b',welf=(j.welfareByYear||{})[yr]||0;return `<div class="member-row" onclick="openJuniorDetail('${j.id}')" style="cursor:pointer;flex-direction:column;align-items:stretch;gap:5px"><div style="display:flex;align-items:center;gap:10px"><div class="m-avatar" style="background:#f5f0e8;color:var(--gold);font-size:13px;font-weight:700;flex-shrink:0">${ini}</div><div class="m-info" style="flex:1;min-width:0"><div class="m-name">${j.name||'—'}</div><div class="m-sub">Parent: ${j.parentName||'—'} · UGX ${(j.monthlyRate||20000).toLocaleString()}/mo</div></div><span class="status-badge s-${j.status||'active'}">${j.status||'active'}</span></div><div style="padding:0 4px"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:3px"><span>${yr}: UGX ${yp.toLocaleString()}${welf>0?' · UGX '+welf.toLocaleString()+' welfare':''}</span><span style="color:${bc};font-weight:600">${pct}%</span></div><div style="background:var(--border);border-radius:3px;height:3px;overflow:hidden"><div style="height:100%;background:${bc};width:${pct}%;border-radius:3px"></div></div></div></div>`;}).join('');return;}
  if(filter==='estates'){const es=window._estatesCache||[];if(!es.length){if(list)list.innerHTML='<div class="empty">No estate records</div>';return;}if(list)list.innerHTML=es.map(e=>`<div class="member-row" style="flex-direction:column;align-items:flex-start;gap:3px"><div style="font-weight:700;font-size:13px">Estate of ${e.memberName||'—'}</div><div style="font-size:11px;color:var(--muted)">Principal: ${e.startDate||'—'} · Next of Kin: ${e.nextOfKin||'TBD'}</div><div style="font-size:14px;font-weight:700;color:var(--gold)">${fmtFull(e.principal||0)}</div></div>`).join('');return;}
  if(filter==='all'){renderMembers(allMembersCache);return;}
  if(filter==='inactive'){renderMembers(allMembersCache.filter(m=>['inactive','exited','deceased'].includes(m.status)));return;}
  const tiers=filter==='gold'?['gold','golden']:[filter];
  renderMembers(allMembersCache.filter(m=>m.status===filter||tiers.includes(m.tier)||tiers.includes(m.memberType)));
};

// ── INVESTMENTS ───────────────────────────────────────────────
async function loadInvestments() {
  const list = document.getElementById('investments-list');
  list.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';
  try {
    const snap = await getDocs(collection(db,'investments'));

    // Admin "Add Investment" button at the top
    const addBtn = STATE.isAdmin
      ? `<div class="card" style="margin-bottom:12px">
          <div class="card-title">Add / Update Investment</div>
          <div class="form-group"><label>Investment Name</label><input type="text" id="inv-name" placeholder="e.g. Elders Meat Parlour"></div>
          <div class="form-group"><label>Type</label>
            <select id="inv-type">
              <option value="real_estate">Real Estate</option>
              <option value="receivable">Receivable</option>
              <option value="equity">Equity</option>
              <option value="fixed_deposit">Fixed Deposit</option>
              <option value="unit_trust">Unit Trust</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="form-group"><label>Amount Invested (UGX)</label><input type="number" id="inv-amount" placeholder="0"></div>
            <div class="form-group"><label>Current Value (UGX)</label><input type="number" id="inv-current" placeholder="0"></div>
          </div>
          <div class="form-group"><label>Status</label>
            <select id="inv-status">
              <option value="active">Active</option>
              <option value="partial">Partial</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div class="form-group"><label>Year</label><input type="number" id="inv-year" value="${new Date().getFullYear()}"></div>
          <div class="form-group"><label>Description / Notes</label><textarea id="inv-note" rows="2" placeholder="Details about this investment…" style="resize:vertical"></textarea></div>
          <button class="btn-primary btn-gold" onclick="saveInvestment()">Save Investment</button>
          <div id="inv-msg" style="font-size:11px;margin-top:8px;min-height:16px"></div>
        </div>`
      : '';

    if (snap.empty) {
      list.innerHTML = addBtn + '<div class="empty">No investments on record</div>';
      return;
    }

    // Portfolio summary
    let totalInvested = 0, totalCurrent = 0;
    const invArr = [];
    snap.forEach(d => { const inv = { id: d.id, ...d.data() }; invArr.push(inv); totalInvested += inv.amount||0; totalCurrent += inv.balance||inv.amount||0; });
    const roi = totalInvested > 0 ? ((totalCurrent - totalInvested)/totalInvested*100).toFixed(1) : '0.0';

    let html = addBtn;
    invArr.forEach(inv => {
      const tagClass = { active:'inv-active', closed:'inv-closed', partial:'inv-partial' }[inv.status] || 'inv-closed';
      const gain = (inv.balance||inv.amount||0) - (inv.amount||0);
      const gainColor = gain >= 0 ? '#166534' : '#991b1b';
      const updateBtn = STATE.isAdmin
        ? `<button onclick="openInvUpdate('${inv.id}')" style="margin-top:10px;width:100%;padding:8px;background:#f8f4ec;border:1px solid var(--border);border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;color:var(--ink)">✏️ Record Update</button>`
        : '';
      html += `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div>
            <div class="inv-name">${inv.name}</div>
            <div class="inv-type">${(inv.type||'').replace('_',' ')}</div>
          </div>
          <span class="inv-tag ${tagClass}">${inv.status}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
          <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Invested</div><div style="font-size:13px;font-weight:700">${fmt(inv.amount)}</div></div>
          <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Current</div><div style="font-size:13px;font-weight:700;color:var(--gold)">${fmt(inv.balance||inv.amount)}</div></div>
          <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Gain/Loss</div><div style="font-size:13px;font-weight:700;color:${gainColor}">${gain>=0?'+':''}${fmt(gain)}</div></div>
        </div>
        ${inv.returns ? `<div style="font-size:11px;color:#166534;margin-top:4px">✓ Returns received: ${fmtFull(inv.returns)}</div>` : ''}
        ${inv.note ? `<div style="font-size:11px;color:var(--muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);line-height:1.5">${inv.note}</div>` : ''}
        <div style="font-size:10px;color:var(--muted);margin-top:4px">Year: ${inv.year||'—'}</div>
        ${updateBtn}
      </div>`;
    });
    list.innerHTML = html;
  } catch(e) {
    list.innerHTML = '<div class="empty">Error loading investments</div>';
    log('Investments: '+e.message);
  }
}

window.saveInvestment = async function() {
  if (!STATE.isAdmin) return;
  const name    = document.getElementById('inv-name').value.trim();
  const type    = document.getElementById('inv-type').value;
  const amount  = Number(document.getElementById('inv-amount').value) || 0;
  const current = Number(document.getElementById('inv-current').value) || amount;
  const status  = document.getElementById('inv-status').value;
  const year    = Number(document.getElementById('inv-year').value) || new Date().getFullYear();
  const note    = document.getElementById('inv-note').value.trim();
  const msgEl   = document.getElementById('inv-msg');
  if (!name) { msgEl.style.color='#991b1b'; msgEl.textContent='Enter investment name.'; return; }
  msgEl.style.color='var(--muted)'; msgEl.textContent='Saving…';
  try {
    const invId = name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-') + '-' + year;
    await setDoc(doc(db,'investments',invId), { name, type, amount, balance:current, status, year, note, updatedAt: serverTimestamp() }, { merge:true });
    msgEl.style.color='#166534'; msgEl.textContent='✅ Investment saved!';
    document.getElementById('inv-name').value = '';
    document.getElementById('inv-amount').value = '';
    document.getElementById('inv-current').value = '';
    document.getElementById('inv-note').value = '';
    setTimeout(loadInvestments, 800);
  } catch(e) { msgEl.style.color='#991b1b'; msgEl.textContent='Error: '+e.message; }
};

// Quick update modal for existing investment value
window.openInvUpdate = async function(invId) {
  const newVal = prompt('Enter updated current value (UGX):');
  if (!newVal) return;
  const val = Number(newVal.replace(/,/g,''));
  if (isNaN(val) || val < 0) { toast('Invalid amount','error'); return; }
  try {
    await setDoc(doc(db,'investments',invId), { balance: val, updatedAt: serverTimestamp() }, { merge:true });
    toast('Investment updated','success');
    loadInvestments();
  } catch(e) { toast('Error: '+e.message,'error'); }
};

// ── LOANS SECTION (dedicated nav tab) ────────────────────────
function loadLoansSection() {
  const wrap = document.getElementById('loans-section-content');
  if (!wrap) return;
  if (STATE.isAdmin) {
    // Admin sees full loan management
    wrap.innerHTML = `
      <div style="display:flex;gap:6px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px">
        <button class="pill" id="ltab-active" style="background:var(--ink);color:#fff;border:none;cursor:pointer;white-space:nowrap" onclick="switchLoanTab('active',this)">Active</button>
        <button class="pill" id="ltab-pending" style="background:var(--border);color:var(--ink);border:none;cursor:pointer;white-space:nowrap" onclick="switchLoanTab('pending',this)">Pending</button>
        <button class="pill" id="ltab-history" style="background:var(--border);color:var(--ink);border:none;cursor:pointer;white-space:nowrap" onclick="switchLoanTab('history',this)">History</button>
      </div>
      <div id="loan-tab-active"></div>
      <div id="loan-tab-pending" style="display:none"></div>
      <div id="loan-tab-history" style="display:none"></div>`;
    window.loadLoansAdmin?.();
    window.loadPendingLoans?.();
    loadLoanHistory();
  } else {
    // Member sees their own loan status
    wrap.innerHTML = `<div id="loan-status-wrap-main"></div>`;
    setTimeout(() => window.loadLoanStatusInto?.('loan-status-wrap-main'), 100);
  }
}

window.switchLoanTab = function(tab, btn) {
  ['active','pending','history'].forEach(t => {
    const el = document.getElementById('loan-tab-'+t);
    const b  = document.getElementById('ltab-'+t);
    if (el) el.style.display = t===tab ? 'block' : 'none';
    if (b) { b.style.background = t===tab ? 'var(--ink)' : 'var(--border)'; b.style.color = t===tab ? '#fff' : 'var(--ink)'; }
  });
};

async function loadLoanHistory() {
  const el = document.getElementById('loan-tab-history');
  if (!el) return;
  try {
    const snap = await getDocs(query(collection(db,'loans'), where('status','in',['closed','rejected']), limit(40)))
      .catch(()=>({docs:[],forEach:()=>{}}));
    const loans = [];
    snap.forEach(d => loans.push({ id:d.id, ...d.data() }));
    loans.sort((a,b)=>((b.requestedAt||b.approvedAt)?.toMillis?.()|| 0)-((a.requestedAt||a.approvedAt)?.toMillis?.()||0));
    if (!loans.length) { el.innerHTML='<div class="empty">No closed or rejected loans</div>'; return; }
    el.innerHTML = loans.map(l => {
      const ts = l.requestedAt||l.approvedAt||l.createdAt;
      const date = ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : '—';
      const sc = l.status==='closed' ? '#166534' : '#991b1b';
      return `<div class="card" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:600;font-size:13px">${l.memberName||l.memberId}</div>
          <span style="font-size:9px;padding:2px 8px;border-radius:10px;background:${sc};color:#fff">${l.status}</span>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">UGX ${(l.amount||0).toLocaleString()} · ${date}</div>
        ${l.purpose?`<div style="font-size:11px;color:var(--muted)">Purpose: ${l.purpose}</div>`:''}
        ${l.totalRepaid?`<div style="font-size:11px;color:#166534">Repaid: UGX ${l.totalRepaid.toLocaleString()}</div>`:''}
        ${l.rejectionReason?`<div style="font-size:11px;color:#991b1b">Reason: ${l.rejectionReason}</div>`:''}
      </div>`;
    }).join('');
  } catch(e) { log('LoanHistory: '+e.message); }
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
// ── INBOX SYSTEM ─────────────────────────────────────────────
async function loadNotifications() {
  // Called on login — load inbox badge count
  try {
    if (!STATE.user) return;
    // Single where only — no compound clause — no composite index needed
    const q = query(collection(db,'messages'), where('toUid','in',[STATE.user.uid,'all']), limit(50));
    const snap = await getDocs(q);
    const unread = snap.docs.filter(d => !d.data().read).length;
    const badge = document.getElementById('notif-count');
    if (unread > 0) { badge.style.display='flex'; badge.textContent=unread; }
    else badge.style.display='none';
  } catch(e) { /* index may not exist yet — silent */ }
}

function markNotifsRead() { /* handled by loadInbox */ }

async function loadInbox() {
  const list = document.getElementById('inbox-list');
  if (!list) return;
  list.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:10px 0">Loading…</div>';
  try {
    let q;
    if (STATE.isAdmin && _inboxFilter === 'all') {
      q = query(collection(db,'messages'), limit(100));
    } else if (_inboxFilter === 'sent') {
      q = query(collection(db,'messages'), where('fromUid','==',STATE.user.uid), limit(50));
    } else {
      q = query(collection(db,'messages'), where('toUid','in',[STATE.user.uid,'all']), limit(50));
    }
    const snap = await getDocs(q);
    if (snap.empty) { list.innerHTML = '<div class="empty"><div class="empty-icon">📬</div>No messages yet</div>'; return; }
    let unread=0, html='';
    snap.forEach(d => {
      const m=d.data();
      const isUnread = !m.read && (m.toUid===STATE.user.uid || m.toUid==='all');
      if (isUnread && _inboxFilter!=='sent') unread++;
      const date = m.createdAt?.toDate?.()?.toLocaleDateString?.('en-GB',{day:'numeric',month:'short'})||'';
      const labels={loan_request:'💰 Loan',general:'💬 General',complaint:'⚠️ Issue',feedback:'✅ Feedback',broadcast:'📣 Broadcast',reply:'↩️ Reply',other:'📄 Other'};
      const lbl = labels[m.type||'general']||'📄';
      html+=`<div onclick="inboxOpen('${d.id}')" style="padding:11px 12px;border-radius:10px;background:${isUnread?'#eef2ff':'var(--bg)'};border:1px solid ${isUnread?'#b6c6ff':'var(--border)'};margin-bottom:8px;cursor:pointer;box-sizing:border-box;width:100%">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:10px;font-weight:700;color:var(--muted)">${lbl}</span>
          <span style="font-size:10px;color:var(--muted);flex-shrink:0;margin-left:6px">${date}</span>
        </div>
        <div style="font-size:13px;font-weight:${isUnread?700:500};color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.fromName||'Club'}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(m.body||'').substring(0,70)}</div>
      </div>`;
    });
    list.innerHTML = html;
    const badge=document.getElementById('notif-count');
    if (unread>0){badge.style.display='flex';badge.textContent=unread;}else badge.style.display='none';
  } catch(e) {
    list.innerHTML=`<div class="empty" style="font-size:12px">Error: ${e.message}<br><span style="font-size:10px;color:var(--muted)">If this is a new index error, check Firebase console for the link to create it.</span></div>`;
    log('Inbox: '+e.message);
  }
}

window.inboxFilter = function(filter, btn) {
  _inboxFilter = filter;
  document.querySelectorAll('#sec-notifications .pill').forEach(b=>{b.style.background='var(--border)';b.style.color='var(--ink)';});
  btn.style.background='var(--ink)'; btn.style.color='#fff';
  document.getElementById('inbox-detail').style.display='none';
  document.getElementById('inbox-list').style.display='block';
  loadInbox();
};

window.inboxOpen = async function(msgId) {
  try {
    const snap = await getDoc(doc(db,'messages',msgId));
    if (!snap.exists()) return;
    const m = snap.data();
    document.getElementById('inbox-list').style.display='none';
    document.getElementById('inbox-compose-form').style.display='none';
    const det = document.getElementById('inbox-detail');
    det.style.display='block';
    const labels={loan_request:'Loan Application',general:'General Message',complaint:'Complaint / Issue',feedback:'Feedback',broadcast:'Broadcast',reply:'Reply',other:'Message'};
    document.getElementById('inbox-detail-subject').textContent = labels[m.type||'general']||'Message';
    document.getElementById('inbox-detail-meta').textContent = `From: ${m.fromName||'Club'} · ${m.createdAt?.toDate?.()?.toLocaleDateString?.('en-GB',{day:'numeric',month:'short',year:'numeric'})||''}`;
    document.getElementById('inbox-detail-body').textContent = m.body||'';
    const rw=document.getElementById('inbox-reply-wrap');
    if (STATE.isAdmin && m.fromUid !== STATE.user.uid) { rw.style.display='block'; _inboxReplyTo=m; } else rw.style.display='none';
    if (!m.read && (m.toUid===STATE.user.uid||m.toUid==='all')) {
      await setDoc(doc(db,'messages',msgId),{read:true},{merge:true}).catch(()=>{});
    }
  } catch(e) { log('InboxOpen: '+e.message); }
};

window.inboxCloseDetail = function() {
  document.getElementById('inbox-detail').style.display='none';
  document.getElementById('inbox-list').style.display='block';
  _inboxReplyTo=null;
  loadInbox();
};

window.inboxCompose = function() {
  const f=document.getElementById('inbox-compose-form');
  const isOpen = f.style.display!=='none';
  f.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    document.getElementById('inbox-compose-title').textContent = STATE.isAdmin ? 'New Message' : 'Message to Club';
    if (STATE.isAdmin) { document.getElementById('inbox-to-wrap').style.display='block'; }
  }
};

window.inboxBroadcast = function() {
  const f=document.getElementById('inbox-compose-form');
  f.style.display='block';
  document.getElementById('inbox-compose-title').textContent='📣 Broadcast to All Members';
  document.getElementById('inbox-to-member').value='all';
  document.getElementById('inbox-to-wrap').style.display='none';
  document.getElementById('inbox-subject').value='broadcast';
};

window.inboxCancelCompose = function() {
  document.getElementById('inbox-compose-form').style.display='none';
};

window.inboxSend = async function() {
  const body=(document.getElementById('inbox-body').value||'').trim();
  const type=document.getElementById('inbox-subject').value||'general';
  const msgEl=document.getElementById('inbox-send-msg');
  if (!body){msgEl.style.color='#ef4444';msgEl.textContent='Please type a message.';return;}
  msgEl.style.color='var(--muted)';msgEl.textContent='Sending…';
  try {
    let toUid='admin', toName='Admin';
    if (STATE.isAdmin) {
      const sel=document.getElementById('inbox-to-member');
      toUid = (sel && sel.style.display!=='none') ? (sel.value||'all') : 'all';
      toName = toUid==='all' ? 'All Members' : (sel?.options[sel.selectedIndex]?.text||'Member');
    }
    await addDoc(collection(db,'messages'),{
      fromUid: STATE.user.uid,
      fromName: STATE.member?.name || STATE.user.email,
      toUid, toName, type, body, read:false,
      createdAt: serverTimestamp()
    });
    msgEl.style.color='#22c55e'; msgEl.textContent='✓ Sent!';
    document.getElementById('inbox-body').value='';
    setTimeout(()=>{ document.getElementById('inbox-compose-form').style.display='none'; msgEl.textContent=''; loadInbox(); },1200);
  } catch(e){ msgEl.style.color='#ef4444'; msgEl.textContent='Failed: '+e.message; log('InboxSend: '+e.message); }
};

window.inboxReply = async function() {
  const body=(document.getElementById('inbox-reply-body').value||'').trim();
  const msgEl=document.getElementById('inbox-reply-msg');
  if (!body||!_inboxReplyTo){if(msgEl)msgEl.textContent='';return;}
  if(msgEl){msgEl.style.color='var(--muted)';msgEl.textContent='Sending…';}
  try {
    await addDoc(collection(db,'messages'),{
      fromUid: STATE.user.uid,
      fromName: 'Club Admin',
      toUid: _inboxReplyTo.fromUid,
      toName: _inboxReplyTo.fromName,
      type:'reply', body, read:false,
      createdAt: serverTimestamp()
    });
    if(msgEl){msgEl.style.color='#22c55e';msgEl.textContent='✓ Reply sent!';}
    document.getElementById('inbox-reply-body').value='';
    setTimeout(()=>inboxCloseDetail(),1000);
  } catch(e){ if(msgEl){msgEl.style.color='#ef4444';msgEl.textContent='Failed: '+e.message;} log('InboxReply: '+e.message); }
};

// ── ADMIN GENERAL FUNCTIONS ───────────────────────────────────
async function populateMemberSelect() {
  const sel = document.getElementById('c-member');
  try {
    const snap = await getDocs(collection(db,'members'));
    snap.forEach(d => {
      const m = d.data();
      if (['active','diaspora','partial'].includes(m.status)) {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = m.name;
        sel.appendChild(opt);
      }
    });
  } catch(e) { log('MemberSelect: '+e.message); }
}

window.inviteMember = async function() {
  if (!STATE.isAdmin) return;
  const name  = document.getElementById('new-name').value.trim();
  const email = document.getElementById('new-email').value.trim();
  const tier  = document.getElementById('new-tier').value;
  const acct  = document.getElementById('new-acct-type').value;
  const rate  = Number(document.getElementById('new-rate').value);

  if (!name || !email) { toast('Enter name and email', 'error'); return; }

  try {
    const memberId = name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-');
    await setDoc(doc(db,'members',memberId), {
      name, email, tier, accountType: acct, monthlyRate: rate,
      status: 'active', joinYear: new Date().getFullYear(),
      loanEligibility: 0,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db,'approvedEmails',email), {
      email, role: 'member', memberId, name,
      addedAt: serverTimestamp(),
    });
    await sendPasswordResetEmail(auth, email);
    toast(`Invitation sent to ${email}`, 'success');
    document.getElementById('new-name').value  = '';
    document.getElementById('new-email').value = '';
    allMembersCache = [];
  } catch(e) {
    toast('Error: ' + e.message, 'error');
    log('Invite: '+e.message);
  }
};

window.saveFinancials = async function() {
  if (!STATE.isAdmin) return;
  const data = {
    bankBalance:      Number(document.getElementById('f-balance').value)  || 0,
    totalInflow:      Number(document.getElementById('f-inflow').value)   || 0,
    totalInvested:    Number(document.getElementById('f-invested').value) || 0,
    confirmedROI:     Number(document.getElementById('f-roi').value)      || 0,
    unitTrustBalance: Number(document.getElementById('f-ut').value)       || 0,
    updatedAt: serverTimestamp(),
  };
  try {
    // Write to settings/financials (legacy) AND club/bankBalance (used by loans pool)
    const bankBal = Number(document.getElementById('f-balance').value)||0;
    await Promise.all([
      setDoc(doc(db,'settings','financials'), data),
      setDoc(doc(db,'club','bankBalance'), {
        total: bankBal,
        totalInflow: data.totalInflow,
        totalInvested: data.totalInvested,
        returnOnInvestment: data.confirmedROI,
        unitTrust: data.unitTrustBalance,
        updatedAt: serverTimestamp()
      }, { merge: true })
    ]);
    toast('Financials saved', 'success');
    await loadDashboard(); await loadNoticeBoard();
  } catch(e) { toast('Error: '+e.message,'error'); }
};

window.recordContribution = async function() {
  if (!STATE.isAdmin) return;
  const memberId = document.getElementById('c-member').value;
  const month    = Number(document.getElementById('c-month').value);
  const year     = Number(document.getElementById('c-year').value);
  const status   = document.getElementById('c-status').value;
  const amount   = Number(document.getElementById('c-amount').value) || 0;
  if (!memberId) { toast('Select a member','error'); return; }
  try {
    await setDoc(doc(db,'contributions',`${memberId}-${year}-${month}`), {
      memberId, month, year, status, amount, recordedAt: serverTimestamp(),
    });
    toast('Contribution recorded','success');
  } catch(e) { toast('Error: '+e.message,'error'); }
};

window.postNotification = async function() {
  if (!STATE.isAdmin) return;
  const title = document.getElementById('notif-title').value.trim();
  const body  = document.getElementById('notif-body').value.trim();
  const date  = document.getElementById('notif-date').value;
  if (!title) { toast('Enter a title','error'); return; }
  try {
    await addDoc(collection(db,'notifications'), {
      title, body, eventDate: date, read: false,
      createdAt: serverTimestamp(),
    });
    toast('Notification posted','success');
    document.getElementById('notif-title').value = '';
    document.getElementById('notif-body').value  = '';
    document.getElementById('notif-date').value  = '';
    await loadNotifications();
  } catch(e) { toast('Error: '+e.message,'error'); }
};

// ── ADMIN TABS ────────────────────────────────────────────────
window.showAdminTab = function(tab, btn) {
  ['general','loans','committees'].forEach(t => {
    const el = document.getElementById('admin-tab-'+t);
    const b  = document.getElementById('atab-'+t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
    if (b)  { b.style.background = t === tab ? 'var(--ink)' : 'var(--border)'; b.style.color = t === tab ? '#fff' : 'var(--ink)'; }
  });
  // Loan functions live in loans.js — called via window globals
  if (tab === 'general')    { _injectAutoPayForm(); }
  if (tab === 'loans')      { window.loadLoansAdmin?.(); window.loadPendingLoans?.(); }
  if (tab === 'committees') loadCommittees();
};

// ── COMMITTEES ────────────────────────────────────────────────
async function loadCommittees() {
  const el = document.getElementById('committees-list');
  try {
    const snap = await getDocs(collection(db,'committees'));
    if (snap.empty) { el.innerHTML = '<div class="empty">No committee data</div>'; return; }
    let html = '';
    snap.forEach(d => {
      const c = d.data();
      html += `<div class="card" style="margin-bottom:12px">
        <div class="card-title">${c.name}</div>
        <div style="font-size:10px;color:var(--muted);margin-bottom:10px">${c.term||''}</div>
        ${(c.members||[]).map(m => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
            <span style="font-weight:500">${m.role}</span>
            <span style="color:var(--muted)">${m.memberId?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())||'—'}</span>
          </div>`).join('')}
      </div>`;
    });
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="empty">Error loading committees</div>'; log('Committees: '+e.message); }
}

// ── MEMBER DETAIL MODAL ───────────────────────────────────────
window.openMemberDetail = async function(memberId) {
  const modal = document.getElementById('member-detail-modal');
  const body  = document.getElementById('md-body');
  modal.style.display = 'block';
  document.getElementById('md-name').textContent = 'Loading…';
  document.getElementById('md-sub').textContent  = '';
  body.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';

  try {
    // Fetch member + loans in parallel. Loans query uses NO orderBy to avoid
    // composite index requirement — sorts client-side instead.
    const [mSnap, loansSnap] = await Promise.all([
      getDoc(doc(db,'members',memberId)),
      getDocs(query(collection(db,'loans'), where('memberId','==',memberId), limit(30)))
        .catch(() => ({ docs:[], forEach:()=>{} }))
    ]);
    if (!mSnap.exists()) { document.getElementById('md-name').textContent = 'Not found'; body.innerHTML=''; return; }
    const m = mSnap.data();
    const loans = [];
    loansSnap.forEach(d => loans.push({ id: d.id, ...d.data() }));
    // Sort loans newest first client-side
    loans.sort((a,b) => {
      const ta = (a.requestedAt || a.createdAt || a.approvedAt)?.toMillis?.() || 0;
      const tb = (b.requestedAt || b.createdAt || b.approvedAt)?.toMillis?.() || 0;
      return tb - ta;
    });

    const displayName = m.name || m.displayName || m.primary?.name || memberId;
    const tier = m.memberType || m.tier || '';
    document.getElementById('md-name').textContent = displayName;
    document.getElementById('md-sub').textContent  =
      (tier ? tier.charAt(0).toUpperCase()+tier.slice(1)+' · ' : '') +
      (m.accountType==='joint' ? 'Joint · ' : '') +
      'Since '+(m.joinYear||'—');

    // ── Computed values ──────────────────────────────────────
    const sc2025      = m.totalSubscriptionUpTo2025 || 0;
    const loanElig    = m.loanEligibility || Math.round(sc2025*0.25);
    const subByYear   = m.subscriptionByYear || {};
    const monthlyRate = m.monthlySubscription || m.monthlyRate || 40000;
    const years       = Object.keys(subByYear).sort();
    const wTotal      = Object.values(m.welfareByYear||{}).reduce((a,b)=>a+b,0);
    const glaTotal    = Object.values(m.glaByYear||{}).reduce((a,b)=>a+b,0);
    const utTotal     = Object.values(m.unitTrustByYear||{}).reduce((a,b)=>a+b,0);
    const grandTotal  = years.reduce((a,yr) => a+(subByYear[yr]||0), 0);
    const currentYear = new Date().getFullYear();
    const currentMonth= new Date().getMonth();

    // ── Month tracker for current year ───────────────────────
    const yearTotal    = subByYear[String(currentYear)] || 0;
    const moLabels     = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    let trackerDots    = '';
    for (let mo = 0; mo < 12; mo++) {
      const expectedByEOM = monthlyRate * (mo + 1);
      const expectedByBOM = monthlyRate * mo;
      let cls, lbl;
      if (mo > currentMonth)              { cls='mo-future';  lbl=moLabels[mo]; }
      else if (yearTotal >= expectedByEOM){ cls='mo-paid';    lbl='✓'; }
      else if (yearTotal > expectedByBOM) { cls='mo-partial'; lbl='~'; }
      else                                { cls='mo-due';     lbl='!'; }
      trackerDots += `<div class="mo ${cls}" title="${MONTHS[mo]} ${currentYear}">${lbl}</div>`;
    }
    const paidMonths   = Math.min(Math.floor(yearTotal / monthlyRate), currentMonth+1);
    const dueSoFar     = Array.from({length: currentMonth+1}, (_,mo) => {
      const eom = monthlyRate*(mo+1);
      const bom = monthlyRate*mo;
      return yearTotal >= eom ? 'paid' : yearTotal > bom ? 'partial' : 'due';
    }).filter(s=>s==='due').length;
    const barColor = dueSoFar===0 ? '#166534' : dueSoFar<=2 ? '#d97706' : '#991b1b';
    const pct = Math.min(Math.round(yearTotal/(monthlyRate*12)*100), 100);
    const statusText = dueSoFar===0 ? 'Up to date' : dueSoFar<=2 ? 'Partial' : 'Behind';

    // ── Status chips ─────────────────────────────────────────
    const statusColors = { active:'#166534', diaspora:'#1e40af', partial:'#854d0e', inactive:'#64748b', exited:'#991b1b', deceased:'#64748b' };
    const chips = [
      `<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:${statusColors[m.status]||'#888'};color:#fff">${(m.status||'—').toUpperCase()}</span>`
    ];
    if (m.contributionsUpToDate)
      chips.push(`<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:#166534;color:#fff">✓ UP TO DATE</span>`);
    else
      chips.push(`<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:#854d0e;color:#fff">⚠ NOT CURRENT</span>`);

    // ── Subscription history rows ────────────────────────────
    const histRows = years.length ? years.map(yr => {
      const paid = subByYear[yr]||0;
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px${paid===0?';color:var(--muted)':''}">
        <span>${yr}</span><span style="font-weight:500">${fmtFull(paid)}</span>
      </div>`;
    }).join('') : '<div style="color:var(--muted);font-size:12px;padding:8px 0">No history on record</div>';

    // ── Loan history rows (all statuses) ─────────────────────
    const loanStatusColors = { active:'#166534', overdue:'#991b1b', closed:'#475569', pending:'#92400e', rejected:'#991b1b' };
    const loanRows = loans.length ? loans.map(l => {
      const ts = l.requestedAt || l.createdAt || l.approvedAt;
      const dateStr = ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : '—';
      const sc = loanStatusColors[l.status] || '#64748b';
      const paidAmt = l.totalRepaid || 0;
      const outstanding = Math.max(0,(l.totalRepayable||0) - paidAmt);
      return `<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-weight:700;font-size:13px">UGX ${(l.amount||0).toLocaleString()} · ${l.duration||60}d</div>
          <span style="font-size:9px;padding:2px 8px;border-radius:10px;background:${sc};color:#fff">${l.status}</span>
        </div>
        <div style="font-size:11px;color:var(--muted)">Requested: ${dateStr}</div>
        <div style="font-size:11px;color:var(--muted)">Repayable: UGX ${(l.totalRepayable||0).toLocaleString()}${paidAmt>0?' · Paid: UGX '+paidAmt.toLocaleString():''}</div>
        ${outstanding > 0 && l.status !== 'closed' && l.status !== 'rejected' && l.status !== 'pending' ?
          `<div style="font-size:11px;color:#e67e22;font-weight:600">Outstanding: UGX ${outstanding.toLocaleString()}</div>` : ''}
        ${l.purpose ? `<div style="font-size:10px;color:var(--muted);margin-top:3px;font-style:italic">Purpose: ${l.purpose}</div>` : ''}
        ${l.rejectionReason ? `<div style="font-size:10px;color:#991b1b;margin-top:3px">Reason: ${l.rejectionReason}</div>` : ''}
        ${STATE.isAdmin && ['active','overdue'].includes(l.status) ? `
          <div style="margin-top:8px;display:flex;gap:6px">
            ${(l.schedule||[]).map((inst,i) => !inst.paid ?
              `<button onclick="closeMemberDetail();setTimeout(()=>adminRecordRepayment('${l.id}',${i}),200)"
                style="flex:1;padding:6px;background:var(--ink);color:var(--gold);border:none;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer">
                Record Inst.${inst.installment} (UGX ${inst.amount.toLocaleString()})
              </button>` : '').filter(Boolean).join('')}
          </div>` : ''}
      </div>`;
    }).join('') : '<div style="font-size:12px;color:var(--muted);padding:8px 0">No loan history</div>';

    // ── Admin-only eligibility toggle ────────────────────────
    const adminControls = STATE.isAdmin ? `
      <div style="background:#f8f4ec;border-radius:10px;padding:12px;margin-bottom:14px;border:1px solid var(--border)">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px">Admin Controls</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="toggleMemberEligibility('${memberId}', ${!!m.contributionsUpToDate})"
            style="flex:1;min-width:120px;padding:8px;border-radius:7px;border:none;font-size:11px;font-weight:600;cursor:pointer;
            background:${m.contributionsUpToDate?'#fef2f2':'#f0fdf4'};color:${m.contributionsUpToDate?'#991b1b':'#166534'}">
            ${m.contributionsUpToDate ? '⚠ Mark NOT Current' : '✓ Mark Up To Date'}
          </button>
          <button onclick="toggleMemberActive('${memberId}', ${!!m.isActive})"
            style="flex:1;min-width:120px;padding:8px;border-radius:7px;border:none;font-size:11px;font-weight:600;cursor:pointer;
            background:${m.isActive?'#fef2f2':'#f0fdf4'};color:${m.isActive?'#991b1b':'#166534'}">
            ${m.isActive ? '⚠ Mark Inactive' : '✓ Mark Active'}
          </button>
        </div>
      </div>` : '';

    body.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${chips.join('')}</div>

      ${adminControls}

      <!-- Stats grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="background:#f8f4ec;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Total Subs (to 2025)</div>
          <div style="font-size:15px;font-weight:700;color:var(--ink);margin-top:3px">${fmt(sc2025)}</div>
        </div>
        <div style="background:#f0f9ff;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Loan Eligibility (25%)</div>
          <div style="font-size:15px;font-weight:700;color:var(--gold);margin-top:3px">${fmt(loanElig)}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Dividends</div>
          <div style="font-size:15px;font-weight:700;color:var(--ink);margin-top:3px">${fmt(m.dividendsTotal||0)}</div>
        </div>
        <div style="background:#fafaf8;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Monthly Rate</div>
          <div style="font-size:15px;font-weight:700;color:var(--ink);margin-top:3px">${fmtFull(monthlyRate)}</div>
        </div>
      </div>

      <!-- Current year tracker -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink);margin-bottom:8px">${currentYear} Contributions</div>
      <div style="background:#f8f8f6;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px">
          <span>UGX ${yearTotal.toLocaleString()} paid · ~${paidMonths} months</span>
          <span style="font-weight:700;color:${barColor}">${statusText}</span>
        </div>
        <div style="background:var(--border);border-radius:3px;height:4px;margin-bottom:8px;overflow:hidden">
          <div style="height:100%;border-radius:3px;background:${barColor};width:${pct}%"></div>
        </div>
        <div class="months-grid">${trackerDots}</div>
      </div>

      <!-- Subscription history all years -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink);margin-bottom:8px">Subscription History (All Years)</div>
      <div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:4px 10px;margin-bottom:14px">
        ${histRows}
        <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;font-weight:700;color:var(--gold)">
          <span>Grand Total</span><span>${fmtFull(grandTotal)}</span>
        </div>
      </div>

      ${wTotal > 0 || glaTotal > 0 || utTotal > 0 ? `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink);margin-bottom:8px">Other Contributions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:14px">
        ${wTotal>0?`<div style="background:#f8f4ec;border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted)">Welfare</div><div style="font-size:12px;font-weight:700">${fmt(wTotal)}</div></div>`:''}
        ${glaTotal>0?`<div style="background:#f0f4ff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted)">GLA</div><div style="font-size:12px;font-weight:700">${fmt(glaTotal)}</div></div>`:''}
        ${utTotal>0?`<div style="background:#f0fff4;border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted)">Unit Trust</div><div style="font-size:12px;font-weight:700">${fmt(utTotal)}</div></div>`:''}
      </div>` : ''}

      <!-- Full loan history (all statuses) -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink);margin-bottom:8px">
        Loan History (${loans.length} record${loans.length!==1?'s':''})
      </div>
      ${loanRows}

      ${m.notes ? `<div style="font-size:11px;color:var(--muted);background:var(--border);border-radius:8px;padding:8px;margin-top:10px">${m.notes}</div>` : ''}
    `;
  } catch(e) {
    document.getElementById('md-name').textContent = 'Error loading member';
    body.innerHTML = `<div class="empty" style="color:#991b1b">${e.message}<br><br><span style="font-size:11px;color:var(--muted)">Check the error overlay for details</span></div>`;
    log('MemberDetail: '+e.message);
  }
};

// ── ADMIN: TOGGLE MEMBER ELIGIBILITY FLAGS ────────────────────
window.toggleMemberEligibility = async function(memberId, currentVal) {
  if (!STATE.isAdmin) return;
  const newVal = !currentVal;
  try {
    await setDoc(doc(db,'members',memberId), { contributionsUpToDate: newVal }, { merge:true });
    toast(newVal ? '✓ Member marked up to date' : '⚠ Member marked not current', newVal?'success':'');
    openMemberDetail(memberId); // reload modal
  } catch(e) { toast('Error: '+e.message,'error'); }
};

window.toggleMemberActive = async function(memberId, currentVal) {
  if (!STATE.isAdmin) return;
  const newVal = !currentVal;
  try {
    await setDoc(doc(db,'members',memberId), { isActive: newVal }, { merge:true });
    toast(newVal ? '✓ Member marked active' : '⚠ Member marked inactive', newVal?'success':'');
    openMemberDetail(memberId);
  } catch(e) { toast('Error: '+e.message,'error'); }
};

window.closeMemberDetail = function() {
  document.getElementById('member-detail-modal').style.display = 'none';
};

// ── JUNIOR DETAIL MODAL ───────────────────────────────────────
window.openJuniorDetail = async function(juniorId) {
  const modal = document.getElementById('member-detail-modal');
  const body  = document.getElementById('md-body');
  modal.style.display = 'block';
  document.getElementById('md-name').textContent = 'Loading…';
  document.getElementById('md-sub').textContent  = '';
  body.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';

  try {
    const snap = await getDoc(doc(db, 'juniors', juniorId));
    if (!snap.exists()) {
      document.getElementById('md-name').textContent = 'Not found';
      body.innerHTML = '';
      return;
    }
    const j = snap.data();

    document.getElementById('md-name').textContent = j.name || '—';
    document.getElementById('md-sub').textContent  =
      `Let's Grow Junior · Parent: ${j.parentName||'—'} · Since ${j.joinYear||'—'}`;

    // Contribution history
    const subByYear  = j.subscriptionByYear || {};
    const welfByYear = j.welfareByYear || {};
    const years      = [...new Set([...Object.keys(subByYear), ...Object.keys(welfByYear)])].sort();
    const currentYear = new Date().getFullYear();
    const rate        = j.monthlyRate || 20000;
    const yearTotal   = subByYear[String(currentYear)] || 0;
    const pct         = Math.min(Math.round(yearTotal / (rate * 12) * 100), 100);

    // Month tracker dots for current year
    const moLabels = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    const curMonth = new Date().getMonth();
    let dots = '';
    for (let mo = 0; mo < 12; mo++) {
      const eom = rate * (mo + 1);
      const bom = rate * mo;
      let cls, lbl;
      if (mo > curMonth)          { cls = 'mo-future';  lbl = moLabels[mo]; }
      else if (yearTotal >= eom)  { cls = 'mo-paid';    lbl = '✓'; }
      else if (yearTotal > bom)   { cls = 'mo-partial'; lbl = '~'; }
      else                        { cls = 'mo-due';     lbl = '!'; }
      dots += `<div class="mo ${cls}" title="${MONTHS[mo]} ${currentYear}">${lbl}</div>`;
    }
    const barColor = pct >= 100 ? '#166534' : pct > 50 ? '#d97706' : '#991b1b';

    let histRows = years.map(yr => {
      const sub  = subByYear[yr] || 0;
      const welf = welfByYear[yr] || 0;
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px${sub===0&&welf===0?';color:var(--muted)':''}">
        <span>${yr}</span>
        <span>Sub: ${fmtFull(sub)} · Welfare: ${fmtFull(welf)}</span>
      </div>`;
    }).join('') || '<div style="color:var(--muted);font-size:12px;padding:6px 0">No history on record</div>';

    // Admin edit controls
    const adminSection = STATE.isAdmin ? `
      <div style="background:#f8f4ec;border-radius:10px;padding:12px;margin-bottom:14px;border:1px solid var(--border)">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px">Admin — Record Contribution</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Year</label>
            <input id="jr-year" type="number" value="${currentYear}" min="2020" max="2030"
              style="width:100%;padding:8px;border-radius:7px;border:1px solid var(--border);font-size:13px">
          </div>
          <div>
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Sub Amount (UGX)</label>
            <input id="jr-sub-amt" type="number" placeholder="${rate * 12}"
              style="width:100%;padding:8px;border-radius:7px;border:1px solid var(--border);font-size:13px">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Welfare Amount (UGX)</label>
            <input id="jr-welf-amt" type="number" placeholder="0"
              style="width:100%;padding:8px;border-radius:7px;border:1px solid var(--border);font-size:13px">
          </div>
          <div>
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Status</label>
            <select id="jr-status" style="width:100%;padding:8px;border-radius:7px;border:1px solid var(--border);font-size:13px;background:#fafaf8">
              <option value="active" ${j.status==='active'?'selected':''}>Active</option>
              <option value="inactive" ${j.status==='inactive'?'selected':''}>Inactive</option>
            </select>
          </div>
        </div>
        <button onclick="saveJuniorRecord('${juniorId}')"
          style="width:100%;padding:9px;background:var(--gold);color:var(--ink);border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer">
          Save Changes
        </button>
        <div id="jr-save-msg" style="font-size:11px;margin-top:6px;text-align:center;min-height:14px"></div>
      </div>` : '';

    body.innerHTML = `
      <!-- Info chips -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:${j.status==='active'?'#166534':'#64748b'};color:#fff">${(j.status||'active').toUpperCase()}</span>
        <span style="font-size:10px;padding:3px 10px;border-radius:20px;background:#f5f0e8;color:var(--ink);font-weight:600">Junior Member</span>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="background:#f8f4ec;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Monthly Rate</div>
          <div style="font-size:15px;font-weight:700;margin-top:3px">${fmtFull(rate)}</div>
        </div>
        <div style="background:#f0f9ff;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">${currentYear} Paid</div>
          <div style="font-size:15px;font-weight:700;color:var(--gold);margin-top:3px">${fmtFull(yearTotal)}</div>
        </div>
        <div style="background:#fafaf8;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Parent / Guardian</div>
          <div style="font-size:13px;font-weight:600;margin-top:3px">${j.parentName||'—'}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Member Since</div>
          <div style="font-size:15px;font-weight:700;margin-top:3px">${j.joinYear||'—'}</div>
        </div>
      </div>

      <!-- Current year tracker -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink);margin-bottom:8px">${currentYear} Tracker</div>
      <div style="background:#f8f8f6;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px">
          <span>${pct}% of annual target</span>
          <span style="font-weight:700;color:${barColor}">${pct>=100?'Complete':pct>50?'Partial':'Behind'}</span>
        </div>
        <div style="background:var(--border);border-radius:3px;height:4px;margin-bottom:8px;overflow:hidden">
          <div style="height:100%;border-radius:3px;background:${barColor};width:${pct}%"></div>
        </div>
        <div class="months-grid">${dots}</div>
      </div>

      ${adminSection}

      <!-- History -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink);margin-bottom:8px">Contribution History</div>
      <div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:4px 10px;margin-bottom:14px">
        ${histRows}
      </div>

      ${j.notes ? `<div style="font-size:11px;color:var(--muted);background:var(--border);border-radius:8px;padding:8px">${j.notes}</div>` : ''}
    `;

  } catch(e) {
    document.getElementById('md-name').textContent = 'Error';
    body.innerHTML = `<div class="empty">${e.message}</div>`;
    log('JuniorDetail: ' + e.message);
  }
};

// ── ADMIN: SAVE JUNIOR RECORD ─────────────────────────────────
window.saveJuniorRecord = async function(juniorId) {
  if (!STATE.isAdmin) return;
  const year    = document.getElementById('jr-year').value;
  const subAmt  = Number(document.getElementById('jr-sub-amt').value) || 0;
  const welfAmt = Number(document.getElementById('jr-welf-amt').value) || 0;
  const status  = document.getElementById('jr-status').value;
  const msgEl   = document.getElementById('jr-save-msg');

  msgEl.style.color = 'var(--muted)'; msgEl.textContent = 'Saving…';
  try {
    const update = { status, updatedAt: serverTimestamp() };
    if (subAmt > 0)  update[`subscriptionByYear.${year}`] = subAmt;
    if (welfAmt > 0) update[`welfareByYear.${year}`] = welfAmt;

    await setDoc(doc(db, 'juniors', juniorId), update, { merge: true });
    msgEl.style.color = '#166534';
    msgEl.textContent = '✅ Saved successfully';
    setTimeout(() => openJuniorDetail(juniorId), 800); // reload modal
  } catch(e) {
    msgEl.style.color = '#991b1b';
    msgEl.textContent = 'Error: ' + e.message;
  }
};


// ── SIGN UP ───────────────────────────────────────────────────
window.openSignup = function() {
  const m = document.getElementById('signup-modal');
  m.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:600;align-items:center;justify-content:center;padding:16px;overflow-y:auto';
  ['su-name','su-email','su-pass','su-pass2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const msg = document.getElementById('su-msg');
  if (msg) msg.textContent = '';
  const btn = document.getElementById('su-create-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
  setTimeout(() => document.getElementById('su-name')?.focus(), 100);
};

window.closeSignup = function() {
  document.getElementById('signup-modal').style.display = 'none';
};

// Single-step: validate all fields, search DB silently, create account
window.suCreate = async function() {
  const nameInput = document.getElementById('su-name').value.trim();
  const email     = document.getElementById('su-email').value.trim();
  const pass      = document.getElementById('su-pass').value;
  const pass2     = document.getElementById('su-pass2').value;
  const msg       = document.getElementById('su-msg');
  const btn       = document.getElementById('su-create-btn');

  const setMsg = (text, color='#ef4444') => { msg.style.color = color; msg.textContent = text; };

  // ── Client-side validation ───────────────────────────────────
  if (!nameInput || nameInput.length < 2) { setMsg('Enter your registered full name.'); return; }
  if (!email || !email.includes('@'))      { setMsg('Enter a valid email address.'); return; }
  if (!pass)                               { setMsg('Create a password.'); return; }
  if (pass.length < 6)                     { setMsg('Password must be at least 6 characters.'); return; }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pass)) {
    setMsg('Password must include at least one special character (e.g. @, #, !, $).');
    return;
  }
  if (pass !== pass2) { setMsg('Passwords do not match — please re-enter.'); return; }

  // ── Search members collection ────────────────────────────────
  btn.disabled = true; btn.textContent = 'Checking…';
  setMsg('Verifying your name against club records…', 'rgba(255,255,255,0.5)');

  try {
    const snap = await getDocs(collection(db, 'members'));
    const norm  = s => (s || '').toLowerCase().replace(/[^a-z ]/g, '').trim();
    const inp   = norm(nameInput);
    const words = inp.split(' ').filter(w => w.length >= 2);

    const isPlaceholder = e => !e || e.endsWith('@letsgrowinvestmentclub.com') || e.endsWith('@letsgrow.com');

    let match = null;
    snap.forEach(d => {
      if (match) return;
      const m = d.data();
      // Check all name fields including both partners of a joint account
      const candidates = [
        m.name, m.displayName,
        m.primary?.name, m.secondary?.name,
        m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : null,
      ].filter(Boolean).map(norm);

      const found = candidates.some(c => {
        const cw = c.split(' ').filter(Boolean);
        if (c === inp || c.includes(inp) || inp.includes(c)) return true;
        // Match if at least 2 words overlap (or 1 if single-word input)
        const hits = words.filter(w => cw.some(cw2 => cw2 === w || cw2.startsWith(w)));
        return hits.length >= Math.min(2, words.length);
      });

      if (found) match = { id: d.id, ...m };
    });

    // ── Handle match results ─────────────────────────────────
    if (!match) {
      setMsg('❌ Name not found in club records. Check spelling, try surname first, or contact admin.');
      btn.disabled = false; btn.textContent = 'Create Account';
      return;
    }
    if (match.email && !isPlaceholder(match.email)) {
      setMsg('⚠️ This member already has an account. Use "Forgot Password" on the sign-in page.');
      btn.disabled = false; btn.textContent = 'Create Account';
      return;
    }
    if (['exited', 'deceased'].includes(match.status)) {
      setMsg('❌ This membership is no longer active. Contact admin.');
      btn.disabled = false; btn.textContent = 'Create Account';
      return;
    }

    // Show matched name as confirmation
    const matchedName = match.name || match.displayName || match.primary?.name || nameInput;
    const isJoint     = match.accountType === 'joint';
    setMsg(`✅ Matched: ${matchedName}${isJoint ? ' (Joint Account)' : ''} — creating account…`, '#4ade80');
    btn.textContent = 'Creating…';

    // ── Create Firebase Auth account ─────────────────────────
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Write real email + uid to member doc (overwrites placeholder)
    await setDoc(doc(db, 'members', match.id), { email, uid: cred.user.uid }, { merge: true });

    // Write correct approvedEmails — prevents future auth mismatches
    await setDoc(doc(db, 'approvedEmails', email), {
      email, role: 'member', memberId: match.id,
      name: matchedName, addedAt: serverTimestamp(),
    });

    setMsg('✅ Account created! Signing you in…', '#4ade80');
    setTimeout(() => closeSignup(), 1500);

  } catch(e) {
    btn.disabled = false; btn.textContent = 'Create Account';
    if (e.code === 'auth/email-already-in-use') {
      setMsg('⚠️ That email already has an account. Use "Forgot Password" to sign in.');
    } else if (e.code === 'auth/invalid-email') {
      setMsg('❌ Invalid email address format.');
    } else if (e.message?.includes('permission') || e.code === 'permission-denied') {
      setMsg('❌ Permission error — admin needs to deploy Firestore rules. Contact admin.');
    } else {
      setMsg('❌ ' + (e.message || 'Unknown error. Try again.'));
      log('suCreate: ' + e.code + ' — ' + e.message);
    }
  }
};



// ── INBOX MEMBER SELECT HELPER ────────────────────────────────
async function populateInboxMemberSelect() {
  const sel = document.getElementById('inbox-to-member');
  if (!sel || sel.options.length > 1) return;
  try {
    const snap = await getDocs(collection(db,'members'));
    const members=[];
    snap.forEach(d=>{ const m=d.data(); if(['active','diaspora','partial'].includes(m.status||'active')) members.push({id:d.id,...m}); });
    members.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    members.forEach(m=>{
      const opt=document.createElement('option');
      // Use uid for toUid field if available, fallback to doc id
      opt.value = m.uid || m.id;
      opt.textContent = m.name || m.id;
      sel.appendChild(opt);
    });
  } catch(e) {}
}

// ── CLUB RECORDS ──────────────────────────────────────────────
let crLoaded = {};
if (!window.toggleClubRecords) window.toggleClubRecords = function(){};

window.toggleClubRecords = function(card) {
  const t=window.event&&window.event.target;
  if(t&&['INPUT','SELECT','TEXTAREA','BUTTON','LABEL','OPTION'].includes(t.tagName.toUpperCase())) return;
  if(t){const det2=document.getElementById('club-records-detail');if(det2&&det2.contains(t))return;}
  const det=document.getElementById('club-records-detail');
  const chev=card.querySelector('.cr-chevron');
  const isOpen=det.style.display!=='none';
  det.style.display=isOpen?'none':'block';
  if(chev) chev.style.transform=isOpen?'':'rotate(180deg)';
  if(!isOpen&&!crLoaded.expenses) crLoadPanel('expenses');
};

window.crTab = function(tab, btn) {
  document.querySelectorAll('.cr-tab').forEach(b=>{b.style.background='var(--border)';b.style.color='var(--ink)';});
  btn.style.background='var(--ink)'; btn.style.color='#fff';
  document.querySelectorAll('.cr-panel').forEach(p=>p.style.display='none');
  document.getElementById('cr-'+tab).style.display='block';
  if (!crLoaded[tab]) crLoadPanel(tab);
};

async function crLoadPanel(tab) {
  crLoaded[tab]=true;
  if(tab==='expenses') await crLoadExpenses();
  if(tab==='fines') await crLoadFines();
  if(tab==='dividends') await crLoadDividends();
  if(tab==='diaspora') await crLoadDiaspora();
  if(tab==='registration') await crLoadRegistration();
  if (STATE.isAdmin) {
    // Show all admin add-forms
    ['expenses','fines','dividends','diaspora'].forEach(t=>{
      const el=document.getElementById('cr-'+t+'-admin'); if(el) el.style.display='block';
    });
    // Auto-fill today's date in expense and fine forms
    const today = new Date().toISOString().split('T')[0];
    ['cr-exp-date','cr-fine-date'].forEach(id=>{
      const el=document.getElementById(id); if(el&&!el.value) el.value=today;
    });
    // Populate member dropdowns (skip if already filled)
    try {
      const snap=await getDocs(collection(db,'members'));
      const members=[];
      snap.forEach(d=>{ const m=d.data(); if(['active','diaspora','partial'].includes(m.status||'active')) members.push({id:d.id,...m}); });
      members.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
      ['cr-fine-member','cr-div-member','cr-dia-member'].forEach(selId=>{
        const sel=document.getElementById(selId); if(!sel||sel.options.length>1) return;
        members.forEach(m=>{const opt=document.createElement('option');opt.value=m.id;opt.textContent=m.name||m.id;sel.appendChild(opt);});
      });
    } catch(e){}
  }
}

async function crLoadExpenses() {
  const el=document.getElementById('cr-expenses-list'); if(!el) return;
  try {
    const _eSnap=await getDocs(query(collection(db,'clubExpenses'),limit(100)));
    const snap={docs:_eSnap.docs.slice().sort((a,b)=>(b.data().date||'').localeCompare(a.data().date||'')),empty:_eSnap.empty};
    snap.forEach=fn=>snap.docs.forEach(fn);
    if(snap.empty){el.innerHTML='<div style="color:var(--muted);font-size:12px">No expenses recorded yet.</div>';return;}
    let total=0,html='';
    snap.forEach(d=>{const e=d.data();total+=Number(e.amount||0);
      html+=`<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px;gap:8px">
        <div style="min-width:0;flex:1"><div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.description||'—'}</div><div style="color:var(--muted);font-size:10px">${e.date||''} · ${e.category||''}</div></div>
        <div style="font-weight:600;color:#991b1b;flex-shrink:0">${fmtFull(e.amount)}</div></div>`;});
    el.innerHTML=html+`<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:700;color:#991b1b"><span>Total</span><span>${fmtFull(total)}</span></div>`;
  } catch(e){el.innerHTML=`<div style="color:#ef4444;font-size:12px">${e.message}</div>`;}
}

async function crLoadFines() {
  const el=document.getElementById('cr-fines-list'); if(!el) return;
  try {
    const _fSnap=await getDocs(query(collection(db,'fines'),limit(100)));
    const snap={docs:_fSnap.docs.slice().sort((a,b)=>(b.data().date||'').localeCompare(a.data().date||'')),empty:_fSnap.empty};
    snap.forEach=fn=>snap.docs.forEach(fn);
    if(snap.empty){el.innerHTML='<div style="color:var(--muted);font-size:12px">No fines recorded yet.</div>';return;}
    let out=0,html='';
    snap.forEach(d=>{const f=d.data();if(f.status!=='paid')out+=Number(f.amount||0);
      const badge=f.status==='paid'?'<span style="background:#dcfce7;color:#166534;font-size:9px;padding:2px 6px;border-radius:10px;font-weight:700">PAID</span>':'<span style="background:#fef2f2;color:#991b1b;font-size:9px;padding:2px 6px;border-radius:10px;font-weight:700">UNPAID</span>';
      const markBtn=STATE.isAdmin&&f.status!=='paid'?`<button onclick="crMarkFinePaid('${d.id}')" style="display:block;margin-top:3px;font-size:9px;padding:2px 6px;background:var(--gold);border:none;border-radius:6px;cursor:pointer;font-weight:600">Mark Paid</button>`:'';
      html+=`<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px;gap:8px">
        <div style="min-width:0;flex:1"><div style="font-weight:500">${f.memberName||'—'}</div><div style="color:var(--muted);font-size:10px">${f.reason||''} · ${f.date||''}</div></div>
        <div style="text-align:right;flex-shrink:0"><div style="font-weight:600">${fmtFull(f.amount)}</div>${badge}${markBtn}</div></div>`;});
    el.innerHTML=html+`<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:12px;font-weight:700;color:#d97706"><span>Outstanding</span><span>${fmtFull(out)}</span></div>`;
  } catch(e){el.innerHTML=`<div style="color:#ef4444;font-size:12px">${e.message}</div>`;}
}

async function crLoadDividends() {
  const el=document.getElementById('cr-dividends-list'); if(!el) return;
  try {
    const _dSnap=await getDocs(query(collection(db,'dividends'),limit(200)));
    const snap={docs:_dSnap.docs,empty:_dSnap.empty};
    snap.forEach=fn=>snap.docs.forEach(fn);
    if(snap.empty){el.innerHTML='<div style="color:var(--muted);font-size:12px">No dividends recorded yet.</div>';return;}
    let html='',byYear={};
    snap.forEach(d=>{const v=d.data();if(!byYear[v.year])byYear[v.year]=[];byYear[v.year].push({id:d.id,...v});});
    for(const yr of Object.keys(byYear).sort().reverse()){
      const ents=byYear[yr],tot=ents.reduce((a,b)=>a+Number(b.amount||0),0);
      html+=`<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);padding:8px 0 4px">${yr} — ${fmtFull(tot)}</div>`;
      ents.forEach(e=>{const b=e.status==='paid'?'<span style="background:#dcfce7;color:#166534;font-size:9px;padding:2px 6px;border-radius:10px;font-weight:700">PAID</span>':'<span style="background:#fef9c3;color:#92400e;font-size:9px;padding:2px 6px;border-radius:10px;font-weight:700">PENDING</span>';
        html+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;gap:8px"><div style="font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.memberName||'—'}</div><div style="text-align:right;flex-shrink:0"><div style="color:var(--gold);font-weight:700">${fmtFull(e.amount)}</div>${b}</div></div>`;});}
    el.innerHTML=html;
  } catch(e){el.innerHTML=`<div style="color:#ef4444;font-size:12px">${e.message}</div>`;}
}

async function crLoadDiaspora() {
  const el=document.getElementById('cr-diaspora-list'); if(!el) return;
  try {
    const _diasSnap=await getDocs(query(collection(db,'diasporaFees'),limit(100)));
    const snap={docs:_diasSnap.docs.slice().sort((a,b)=>(b.data().year||0)-(a.data().year||0)),empty:_diasSnap.empty};
    snap.forEach=fn=>snap.docs.forEach(fn);
    if(snap.empty){el.innerHTML='<div style="color:var(--muted);font-size:12px">No diaspora fees recorded yet.</div>';return;}
    let html='';
    snap.forEach(d=>{const f=d.data();html+=`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
      <div><div style="font-weight:500">${f.memberName||'—'}</div><div style="color:var(--muted);font-size:10px">${f.year||''}</div></div>
      <div style="font-weight:600;color:var(--gold);flex-shrink:0">${fmtFull(f.amount)}</div></div>`;});
    el.innerHTML=html;
  } catch(e){el.innerHTML=`<div style="color:#ef4444;font-size:12px">${e.message}</div>`;}
}

async function crLoadRegistration() {
  const el=document.getElementById('cr-registration-list'); if(!el) return;
  try {
    const snap=await getDocs(collection(db,'registrationFees'));
    if(snap.empty){el.innerHTML='<div style="color:var(--muted);font-size:12px">No registration records yet.</div>';return;}
    let total=0,html='';
    snap.forEach(d=>{const r=d.data();total+=Number(r.amount||0);html+=`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px"><span style="font-weight:500">${r.memberName||d.id}</span><span>${fmtFull(r.amount)}</span></div>`;});
    el.innerHTML=html+`<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:700;color:var(--gold)"><span>Total</span><span>${fmtFull(total)}</span></div>`;
  } catch(e){el.innerHTML=`<div style="color:#ef4444;font-size:12px">${e.message}</div>`;}
}

window.crMarkFinePaid = async function(id){try{await setDoc(doc(db,'fines',id),{status:'paid'},{merge:true});crLoaded.fines=false;crLoadFines();toast('Fine marked paid','success');}catch(e){toast(e.message,'error');}};
window.crAddExpense = async function(){
  const date=document.getElementById('cr-exp-date').value,amount=document.getElementById('cr-exp-amount').value,desc=document.getElementById('cr-exp-desc').value,cat=document.getElementById('cr-exp-cat').value,msg=document.getElementById('cr-exp-msg');
  if(!date||!amount||!desc){msg.style.color='#ef4444';msg.textContent='Fill all fields.';return;}
  try{await addDoc(collection(db,'clubExpenses'),{date,amount:Number(amount),description:desc,category:cat,createdAt:serverTimestamp(),createdBy:STATE.user.uid});msg.style.color='#22c55e';msg.textContent='✓ Added';crLoaded.expenses=false;setTimeout(()=>{msg.textContent='';crLoadExpenses();},1000);}catch(e){msg.style.color='#ef4444';msg.textContent=e.message;}
};
window.crAddFine = async function(){
  const memberId=document.getElementById('cr-fine-member').value,amount=document.getElementById('cr-fine-amount').value,reason=document.getElementById('cr-fine-reason').value,date=document.getElementById('cr-fine-date').value,status=document.getElementById('cr-fine-paid').value,msg=document.getElementById('cr-fine-msg');
  if(!memberId||!amount){msg.style.color='#ef4444';msg.textContent='Select member and amount.';return;}
  const memberName=document.getElementById('cr-fine-member').options[document.getElementById('cr-fine-member').selectedIndex].text;
  try{await addDoc(collection(db,'fines'),{memberId,memberName,amount:Number(amount),reason,date,status,createdAt:serverTimestamp(),createdBy:STATE.user.uid});msg.style.color='#22c55e';msg.textContent='✓ Recorded';crLoaded.fines=false;setTimeout(()=>{msg.textContent='';crLoadFines();},1000);}catch(e){msg.style.color='#ef4444';msg.textContent=e.message;}
};
window.crAddDividend = async function(){
  const memberId=document.getElementById('cr-div-member').value,year=document.getElementById('cr-div-year').value,amount=document.getElementById('cr-div-amount').value,status=document.getElementById('cr-div-status').value,msg=document.getElementById('cr-div-msg');
  if(!memberId||!amount||!year){msg.style.color='#ef4444';msg.textContent='Fill all fields.';return;}
  const memberName=document.getElementById('cr-div-member').options[document.getElementById('cr-div-member').selectedIndex].text;
  try{
    await addDoc(collection(db,'dividends'),{memberId,memberName,year:Number(year),amount:Number(amount),status,createdAt:serverTimestamp(),createdBy:STATE.user.uid});
    const mSnap=await getDoc(doc(db,'members',memberId));
    const cur=mSnap.exists()?(mSnap.data().dividendsTotal||0):0;
    await setDoc(doc(db,'members',memberId),{dividendsTotal:cur+Number(amount)},{merge:true});
    msg.style.color='#22c55e';msg.textContent='✓ Recorded';crLoaded.dividends=false;setTimeout(()=>{msg.textContent='';crLoadDividends();},1000);
  }catch(e){msg.style.color='#ef4444';msg.textContent=e.message;}
};
window.crAddDiaspora = async function(){
  const memberId=document.getElementById('cr-dia-member').value,year=document.getElementById('cr-dia-year').value,amount=document.getElementById('cr-dia-amount').value,msg=document.getElementById('cr-dia-msg');
  if(!memberId||!amount){msg.style.color='#ef4444';msg.textContent='Fill all fields.';return;}
  const memberName=document.getElementById('cr-dia-member').options[document.getElementById('cr-dia-member').selectedIndex].text;
  try{await addDoc(collection(db,'diasporaFees'),{memberId,memberName,year:Number(year),amount:Number(amount),createdAt:serverTimestamp()});msg.style.color='#22c55e';msg.textContent='✓ Recorded';crLoaded.diaspora=false;setTimeout(()=>{msg.textContent='';crLoadDiaspora();},1000);}catch(e){msg.style.color='#ef4444';msg.textContent=e.message;}
};

// ── AUTO-DISTRIBUTE PAYMENT ──────────────────────────────────
window.recordAutoPayment=async function(){if(!STATE.isAdmin)return;const memberId=document.getElementById('ap-member').value,totalAmt=Number(document.getElementById('ap-amount').value)||0,date=document.getElementById('ap-date').value,msgEl=document.getElementById('ap-msg');if(!memberId||!totalAmt||!date){msgEl.style.color='#991b1b';msgEl.textContent='Fill all fields.';return;}msgEl.style.color='var(--muted)';msgEl.textContent='Processing…';try{const mSnap=await getDoc(doc(db,'members',memberId));if(!mSnap.exists()){msgEl.style.color='#991b1b';msgEl.textContent='Member not found';return;}const m=mSnap.data(),yr=new Date(date).getFullYear(),rate=m.monthlySubscription||m.monthlyRate||40000;const buckets=[{key:'subscriptionByYear',rate,label:'Subscription'},{key:'welfareByYear',rate:m.welfareRate||Math.round(rate*0.25),label:'Welfare'},{key:'unitTrustByYear',rate:m.utRate||Math.round(rate*0.25),label:'Unit Trust'},{key:'glaByYear',rate:m.glaRate||Math.round(rate*0.325),label:'GLA'}];const updates={},breakdown=[];let rem=totalAmt;for(const b of buckets){if(rem<=0)break;const already=(m[b.key]||{})[String(yr)]||0,absorb=Math.min(rem,Math.max(0,b.rate*12-already));if(absorb>0){updates[`${b.key}.${yr}`]=already+absorb;breakdown.push({label:b.label,amount:absorb});rem-=absorb;}}if(rem>0){const c=(m.subscriptionByYear||{})[String(yr)]||0;updates[`subscriptionByYear.${yr}`]=(updates[`subscriptionByYear.${yr}`]||c)+rem;breakdown.push({label:'Sub (excess)',amount:rem});}if(yr<=2025&&updates[`subscriptionByYear.${yr}`]){const od=(m.subscriptionByYear||{})[String(yr)]||0,delta=updates[`subscriptionByYear.${yr}`]-od;if(delta>0)updates['totalSubscriptionUpTo2025']=(m.totalSubscriptionUpTo2025||0)+delta;}await setDoc(doc(db,'members',memberId),updates,{merge:true});await addDoc(collection(db,'paymentLedger'),{memberId,memberName:m.name||memberId,totalAmount:totalAmt,date,year:yr,breakdown,recordedBy:STATE.user.email,recordedAt:serverTimestamp()});msgEl.style.color='#166534';msgEl.textContent='✅ '+breakdown.map(b=>`${b.label}: ${fmtFull(b.amount)}`).join(' | ');document.getElementById('ap-amount').value='';setTimeout(()=>{msgEl.textContent='';},6000);}catch(e){msgEl.style.color='#991b1b';msgEl.textContent='Error: '+e.message;log('AutoPay: '+e.message);}};
function _injectAutoPayForm(){if(document.getElementById('auto-pay-form'))return;const anchor=document.getElementById('c-member')?.closest('.card');if(!anchor)return;const div=document.createElement('div');div.className='card';div.style.marginTop='12px';div.innerHTML=`<div class="card-title">Record Payment (Auto-Distribute)</div><div style="font-size:11px;color:var(--muted);margin-bottom:10px">Enter total received — splits Sub→Welfare→Unit Trust→GLA automatically.</div><div id="auto-pay-form"><div class="form-group"><label>Member</label><select id="ap-member" style="width:100%"><option value="">Select member…</option></select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="form-group"><label>Amount (UGX)</label><input type="number" id="ap-amount" placeholder="e.g. 150000" style="width:100%"></div><div class="form-group"><label>Date Paid</label><input type="date" id="ap-date" style="width:100%"></div></div><button class="btn-primary btn-gold" style="width:100%" onclick="recordAutoPayment()">Record & Distribute</button><div id="ap-msg" style="font-size:11px;margin-top:8px;min-height:16px"></div></div>`;anchor.parentNode.insertBefore(div,anchor.nextSibling);const sel=document.getElementById('ap-member'),de=document.getElementById('ap-date');if(de)de.value=new Date().toISOString().split('T')[0];getDocs(collection(db,'members')).then(snap=>{const arr=[];snap.forEach(d=>{const m=d.data();if(['active','diaspora','partial'].includes(m.status||'active'))arr.push({id:d.id,...m});});arr.sort((a,b)=>(a.name||'').localeCompare(b.name||''));arr.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.name||m.id;sel.appendChild(o);});}).catch(()=>{});}

// ── LOAD MODULES ──────────────────────────────────────────────
// Sidebar navigation is handled by sidebar.js (loaded from index.html)
import('./loans.js').catch(e=>log('loans.js: '+e.message));

