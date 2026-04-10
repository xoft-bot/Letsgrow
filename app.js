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
  addDoc, serverTimestamp, query, where, orderBy, limit
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

// ── EXPOSE SHARED OBJECTS FOR loans.js ───────────────────────
// loans.js reads window.__lg to access db, STATE, helpers.
// This is set after Firebase is initialised (right here).
window.__lg = { db, auth, STATE, fmt, fmtFull, toast, MONTHS, serverTimestamp, log,
                getDoc, setDoc, addDoc, collection, getDocs, doc, query, where, orderBy, limit };

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
    let memberId = null;
    let isAdmin  = false;

    const approvedSnap = await getDoc(doc(db, 'approvedEmails', user.email));
    if (approvedSnap.exists()) {
      const data = approvedSnap.data();
      memberId = data.memberId;
      isAdmin  = data.role === 'admin';
    }

    const membersByEmail = await getDocs(query(collection(db,'members'), where('email','==', user.email)));
    if (!membersByEmail.empty) {
      const mDoc = membersByEmail.docs[0];
      if (!memberId) memberId = mDoc.id;
      STATE.member = { id: mDoc.id, ...mDoc.data() };
      if (['pedsoule@gmail.com'].includes(user.email)) isAdmin = true;
    }

    if (!STATE.member && memberId) {
      const mSnap = await getDoc(doc(db, 'members', memberId));
      if (mSnap.exists()) STATE.member = { id: mSnap.id, ...mSnap.data() };
    }

    if (!STATE.member && !approvedSnap.exists()) {
      toast('Access denied — not registered.', 'error');
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

    if (STATE.isAdmin) {
      document.getElementById('admin-pill').style.display = 'inline';
      document.getElementById('nav-admin').style.display  = 'flex';
    }

    loading.style.display = 'none';
    loginEl.classList.remove('visible');
    appEl.classList.add('visible');

    await Promise.all([loadDashboard(), loadNotifications()]);
    if (STATE.isAdmin) populateMemberSelect();

  } catch(e) {
    log('Auth error: ' + e.message);
    toast('Error loading profile.', 'error');
    loading.style.display = 'none';
    loginEl.classList.add('visible');
  }
});

// ── NAVIGATION ────────────────────────────────────────────────
window.showSection = function(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-'+name)?.classList.add('active');
  btn?.classList.add('active');
  if (name === 'members')       loadMembers();
  if (name === 'investments')   loadInvestments();
  if (name === 'account')       { loadMyAccount(); setTimeout(() => window.loadLoanStatus?.(), 400); }
  if (name === 'notifications') markNotifsRead();
  if (name === 'admin') {
    showAdminTab('general');
    if (STATE.isAdmin) document.getElementById('balance-breakdown').style.display='block';
  }
  if (name === 'dashboard' && STATE.isAdmin) document.getElementById('balance-breakdown').style.display='block';
};

// ── DASHBOARD ─────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [bankSnap, finSnap] = await Promise.all([
      getDoc(doc(db, 'club', 'bankBalance')),
      getDoc(doc(db, 'settings', 'financials'))
    ]);

    let bal = 0, inflow = 0, invested = 0, roi = 0, ut = 0;

    if (bankSnap.exists()) {
      const b = bankSnap.data();
      bal      = b.total        || 0;
      inflow   = b.totalInflow  || 134393100;
      invested = b.totalInvested|| 75460000;
      roi      = b.returnOnInvestment || 22850000;
      ut       = b.unitTrust    || 6990000;
      if (document.getElementById('bd-welfare'))  document.getElementById('bd-welfare').textContent  = fmtFull(b.welfare||0);
      if (document.getElementById('bd-gla'))      document.getElementById('bd-gla').textContent      = fmtFull(b.gla||0);
      if (document.getElementById('bd-ut'))       document.getElementById('bd-ut').textContent       = fmtFull(b.unitTrust||0);
      if (document.getElementById('bd-junior'))   document.getElementById('bd-junior').textContent   = fmtFull(b.letsGrowJunior||0);
      if (document.getElementById('bd-loanpool')) document.getElementById('bd-loanpool').textContent = fmtFull(b.loansPool||0);
    } else if (finSnap.exists()) {
      const d = finSnap.data();
      bal = d.bankBalance||0; inflow = d.totalInflow||0; invested = d.totalInvested||0;
      roi = d.confirmedROI||0; ut = d.unitTrustBalance||0;
    }

    document.getElementById('h-balance').textContent  = fmt(bal);
    document.getElementById('h-inflow').textContent   = fmt(inflow);
    document.getElementById('h-invested').textContent = fmt(invested);
    document.getElementById('h-roi').textContent      = fmt(roi);
    document.getElementById('h-ut').textContent       = fmt(ut);
    document.getElementById('s-balance').textContent  = fmt(bal);
    document.getElementById('s-invested').textContent = fmt(invested);

    if (STATE.isAdmin) {
      document.getElementById('f-balance').value  = bal      || '';
      document.getElementById('f-inflow').value   = inflow   || '';
      document.getElementById('f-invested').value = invested || '';
      document.getElementById('f-roi').value      = roi      || '';
      document.getElementById('f-ut').value       = ut       || '';
    }
  } catch(e) { log('Financials: '+e.message); }

  await loadTracker();
}

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
    if (mo > currentMonth) {
      statuses.push('future');
    } else {
      const expectedByEOM = rate * (mo + 1);
      const expectedByBOM = rate * mo;
      if (totalPaid >= expectedByEOM)       statuses.push('paid');
      else if (totalPaid > expectedByBOM)   statuses.push('partial');
      else                                   statuses.push('due');
    }
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
        if      (s==='paid')    { cls='mo-paid';    lbl='✓'; }
        else if (s==='partial') { cls='mo-partial'; lbl='~'; }
        else if (s==='due')     { cls='mo-due';     lbl='!'; }
        else                    { cls='mo-future';  lbl=moLabels[mo]||'·'; }
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
    if      (s==='paid')    { cls='mo-paid';    lbl='✓'; }
    else if (s==='partial') { cls='mo-partial'; lbl='~'; }
    else if (s==='due')     { cls='mo-due';     lbl='!'; }
    else                    { cls='mo-future';  lbl=MONTHS[mo][0]; }
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

    <div class="card" id="loan-request-card">
      <div class="card-title">Loan</div>
      <div id="loan-status-wrap"></div>
    </div>

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
}

// ── MEMBERS ───────────────────────────────────────────────────
let allMembersCache = [];
async function loadMembers() {
  const list = document.getElementById('members-list');
  list.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';

  try {
    if (!allMembersCache.length) {
      const snap = await getDocs(collection(db,'members'));
      snap.forEach(d => allMembersCache.push({ id: d.id, ...d.data() }));
    }
    document.getElementById('member-count').textContent = `(${allMembersCache.length})`;
    renderMembers(allMembersCache);

    const eSnap = await getDocs(collection(db,'estates'));
    if (!eSnap.empty) {
      document.getElementById('estates-section').style.display = 'block';
      let eHtml = '';
      eSnap.forEach(d => {
        const e = d.data();
        eHtml += `<div class="estate-card">
          <div class="estate-name">Estate of ${e.memberName}</div>
          <div class="estate-sub">Principal Date: ${e.startDate||'—'} · Next of Kin: ${e.nextOfKin||'TBD'}</div>
          <div class="estate-val">${fmtFull(e.principal)}</div>
        </div>`;
      });
      document.getElementById('estates-list').innerHTML = eHtml;
    }

    const jSnap = await getDocs(collection(db,'juniors'));
    if (!jSnap.empty) {
      document.getElementById('juniors-section').style.display = 'block';
      let jHtml = '';
      jSnap.forEach(d => {
        const j = d.data();
        jHtml += `<div class="member-row">
          <div class="m-avatar" style="background:#f5f0e8;color:var(--ink);font-size:12px">JR</div>
          <div class="m-info">
            <div class="m-name">${j.name}</div>
            <div class="m-sub">Junior · UGX ${Number(j.monthlyRate||20000).toLocaleString()}/mo</div>
          </div>
          <span class="status-badge s-${j.status}">${j.status}</span>
        </div>`;
      });
      document.getElementById('juniors-list').innerHTML = jHtml;
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
    const displayName = m.name || m.displayName || m.primary?.name || '?';
    const ini = displayName[0].toUpperCase();
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
  document.querySelectorAll('[onclick^="filterMembers"]').forEach(b => {
    b.style.background = 'var(--border)'; b.style.color = 'var(--ink)';
  });
  btn.style.background = 'var(--ink)'; btn.style.color = '#fff';
  if (filter === 'all') { renderMembers(allMembersCache); return; }
  if (filter === 'inactive') {
    renderMembers(allMembersCache.filter(m => ['inactive','exited','deceased'].includes(m.status)));
    return;
  }
  renderMembers(allMembersCache.filter(m => m.status === filter || m.tier === filter));
};

// ── INVESTMENTS ───────────────────────────────────────────────
async function loadInvestments() {
  const list = document.getElementById('investments-list');
  list.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';
  try {
    const snap = await getDocs(collection(db,'investments'));
    if (snap.empty) { list.innerHTML = '<div class="empty">No investments on record</div>'; return; }
    let html = '';
    snap.forEach(d => {
      const inv = d.data();
      const tagClass = { active:'inv-active', closed:'inv-closed', partial:'inv-partial' }[inv.status] || 'inv-closed';
      html += `<div class="inv-row">
        <div class="inv-top">
          <div>
            <div class="inv-name">${inv.name}</div>
            <div class="inv-type ${inv.type}">${inv.type?.replace('_',' ') || ''}</div>
          </div>
          <span class="inv-tag ${tagClass}">${inv.status}</span>
        </div>
        <div class="amount">${fmtFull(inv.amount)}</div>
        ${inv.returns ? `<div class="returns">Returns: +${fmtFull(inv.returns)}</div>` : ''}
        ${inv.balance ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">Current balance: ${fmtFull(inv.balance)}</div>` : ''}
        ${inv.note   ? `<div style="font-size:11px;color:var(--muted);margin-top:6px;border-top:1px solid var(--border);padding-top:6px">${inv.note}</div>` : ''}
        <div style="font-size:10px;color:var(--muted);margin-top:4px">Year: ${inv.year||'—'}</div>
      </div>`;
    });
    list.innerHTML = html;
  } catch(e) {
    list.innerHTML = '<div class="empty">Error loading investments</div>';
    log('Investments: '+e.message);
  }
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
async function loadNotifications() {
  try {
    const snap = await getDocs(query(collection(db,'notifications'), orderBy('createdAt','desc'), limit(20)));
    const list = document.getElementById('notif-list');
    if (snap.empty) return;

    let html = '';
    let unread = 0;
    snap.forEach(d => {
      const n = d.data();
      const date = n.eventDate || (n.createdAt?.toDate?.()?.toLocaleDateString?.() || '');
      html += `<div class="notif-row">
        <div class="notif-dot ${n.read?'read':''}"></div>
        <div class="notif-body">
          <div class="notif-title">${n.title||'Notification'}</div>
          <div class="notif-text">${n.body||''}</div>
          ${date ? `<div class="notif-date">${date}</div>` : ''}
        </div>
      </div>`;
      if (!n.read) unread++;
    });
    list.innerHTML = html;

    if (unread > 0) {
      const badge = document.getElementById('notif-count');
      badge.style.display = 'flex';
      badge.textContent = unread;
    }
  } catch(e) { log('Notifs: '+e.message); }
}

function markNotifsRead() {
  document.getElementById('notif-count').style.display = 'none';
}

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
    await setDoc(doc(db,'settings','financials'), data);
    toast('Financials saved', 'success');
    await loadDashboard();
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
    const [mSnap, loansSnap] = await Promise.all([
      getDoc(doc(db,'members',memberId)),
      getDocs(query(collection(db,'loans'), where('memberId','==',memberId), orderBy('createdAt','desc'), limit(10)))
    ]);
    if (!mSnap.exists()) { document.getElementById('md-name').textContent = 'Not found'; body.innerHTML=''; return; }
    const m = mSnap.data();
    const loans = [];
    loansSnap.forEach(d => loans.push({ id: d.id, ...d.data() }));

    const displayName = m.name || m.displayName || m.primary?.name || memberId;
    const tier = m.memberType || m.tier || '';
    document.getElementById('md-name').textContent = displayName;
    document.getElementById('md-sub').textContent  = (tier?tier.charAt(0).toUpperCase()+tier.slice(1)+' · ':'') + (m.accountType==='joint'?'Joint · ':'') + 'Since '+(m.joinYear||'—');

    const sc2025     = m.totalSubscriptionUpTo2025 || 0;
    const loanElig   = m.loanEligibility || Math.round(sc2025*0.25);
    const subByYear  = m.subscriptionByYear || {};
    const years      = Object.keys(subByYear).sort();
    const wTotal     = Object.values(m.welfareByYear||{}).reduce((a,b)=>a+b,0);
    const glaTotal   = Object.values(m.glaByYear||{}).reduce((a,b)=>a+b,0);
    const utTotal    = Object.values(m.unitTrustByYear||{}).reduce((a,b)=>a+b,0);
    const grandTotal = years.reduce((a,yr) => a+(subByYear[yr]||0), 0);

    const statusColors = { active:'#166534', diaspora:'#1e40af', partial:'#854d0e', inactive:'#64748b', exited:'#991b1b', deceased:'#64748b' };
    const chips = [`<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:${statusColors[m.status]||'#888'};color:#fff">${(m.status||'').toUpperCase()}</span>`];
    if (m.contributionsUpToDate) chips.push(`<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:#166534;color:#fff">✓ UP TO DATE</span>`);
    else chips.push(`<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:#854d0e;color:#fff">⚠ NOT CURRENT</span>`);

    let histRows = years.map(yr => {
      const paid = subByYear[yr]||0;
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px${paid===0?';color:var(--muted)':''}">
        <span>${yr}</span><span style="font-weight:500">${fmtFull(paid)}</span>
      </div>`;
    }).join('');

    let loanRows = loans.length ? loans.map(l => {
      const statusColor = l.status==='active'?'#166534':l.status==='overdue'?'#991b1b':'#64748b';
      const dateStr = l.createdAt?.toDate ? l.createdAt.toDate().toLocaleDateString('en-GB') : '—';
      return `<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:600;font-size:13px">UGX ${(l.amount||0).toLocaleString()} · ${l.duration||60}d</div>
          <span style="font-size:9px;padding:2px 8px;border-radius:10px;background:${statusColor};color:#fff">${l.status}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px">Issued: ${dateStr} · Total repayable: UGX ${(l.totalRepayable||0).toLocaleString()}</div>
      </div>`;
    }).join('') : '<div style="font-size:12px;color:var(--muted)">No loan history</div>';

    body.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${chips.join('')}</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="background:#f8f4ec;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Total Subs (to 2025)</div>
          <div style="font-size:15px;font-weight:700;color:var(--ink);margin-top:3px">${fmt(sc2025)}</div>
        </div>
        <div style="background:#f0f9ff;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Loan Eligibility</div>
          <div style="font-size:15px;font-weight:700;color:var(--gold);margin-top:3px">${fmt(loanElig)}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Dividends</div>
          <div style="font-size:15px;font-weight:700;color:var(--ink);margin-top:3px">${fmt(m.dividendsTotal||0)}</div>
        </div>
        <div style="background:#fafaf8;border-radius:8px;padding:10px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Monthly Rate</div>
          <div style="font-size:15px;font-weight:700;color:var(--ink);margin-top:3px">${fmt(m.monthlySubscription||m.monthlyRate||0)}</div>
        </div>
      </div>

      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink);margin-bottom:8px">Subscription History</div>
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

      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink);margin-bottom:8px">Loan History</div>
      ${loanRows}

      ${m.notes ? `<div style="font-size:11px;color:var(--muted);background:var(--border);border-radius:8px;padding:8px;margin-top:10px">${m.notes}</div>` : ''}
    `;
  } catch(e) {
    document.getElementById('md-name').textContent = 'Error';
    body.innerHTML = '<div class="empty">'+e.message+'</div>';
    log('MemberDetail: '+e.message);
  }
};

window.closeMemberDetail = function() {
  document.getElementById('member-detail-modal').style.display = 'none';
};

// ── SIGN UP ───────────────────────────────────────────────────
let suVerifiedId = null;

window.openSignup = function() {
  const m = document.getElementById('signup-modal');
  m.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:600;align-items:center;justify-content:center;padding:20px';
  document.getElementById('su-step1').style.display = 'block';
  document.getElementById('su-step2').style.display = 'none';
  document.getElementById('su-name').value  = '';
  document.getElementById('su-email').value = '';
  document.getElementById('su-pass').value  = '';
  document.getElementById('su-msg1').textContent = '';
  document.getElementById('su-msg2').textContent = '';
  suVerifiedId = null;
  setTimeout(() => document.getElementById('su-name').focus(), 100);
};

window.closeSignup = function() {
  document.getElementById('signup-modal').style.display = 'none';
};

window.suVerify = async function() {
  const nameInput = document.getElementById('su-name').value.trim();
  const msg = document.getElementById('su-msg1');
  const btn = document.getElementById('su-verify-btn');
  if (!nameInput || nameInput.length < 3) { msg.style.color='#ef4444'; msg.textContent='Enter your full name.'; return; }

  btn.textContent = 'Checking…'; btn.disabled = true; msg.textContent = '';
  try {
    const snap = await getDocs(collection(db,'members'));
    const norm = s => (s||'').toLowerCase().replace(/[^a-z ]/g,'').trim();
    const inp  = norm(nameInput);
    let match  = null;

    snap.forEach(d => {
      const m = d.data();
      const candidates = [m.name, m.displayName, m.primary?.name,
        m.firstName && m.lastName ? m.firstName+' '+m.lastName : null,
        m.secondary?.name
      ].filter(Boolean).map(norm);

      if (candidates.some(c => c === inp || c.includes(inp) || inp.includes(c.split(' ')[0]))) {
        match = { id: d.id, ...m };
      }
    });

    if (!match) {
      msg.style.color='#ef4444'; msg.textContent='❌ Name not found. Check spelling or contact admin.';
    } else if (match.email) {
      msg.style.color='#ef4444'; msg.textContent='❌ This member already has an account. Use Forgot Password.';
    } else if (['exited','deceased'].includes(match.status)) {
      msg.style.color='#ef4444'; msg.textContent='❌ This account is no longer active.';
    } else {
      suVerifiedId = match.id;
      document.getElementById('su-step1').style.display = 'none';
      document.getElementById('su-step2').style.display = 'block';
      document.getElementById('su-verified-badge').innerHTML =
        '✅ Verified: <strong>'+(match.name||match.displayName||nameInput)+'</strong><br>' +
        '<span style="font-size:10px;color:rgba(255,255,255,.5)">'+(match.status||'active')+' · '+(match.memberType||match.tier||'member')+' member</span>';
      setTimeout(() => document.getElementById('su-email').focus(), 100);
    }
  } catch(e) { msg.style.color='#ef4444'; msg.textContent='Error: '+e.message; }
  btn.textContent = 'Verify Name'; btn.disabled = false;
};

window.suCreate = async function() {
  const email = document.getElementById('su-email').value.trim();
  const pass  = document.getElementById('su-pass').value;
  const msg   = document.getElementById('su-msg2');
  const btn   = document.getElementById('su-create-btn');
  if (!email || !pass) { msg.style.color='#ef4444'; msg.textContent='Fill in email and password.'; return; }
  if (pass.length < 6)  { msg.style.color='#ef4444'; msg.textContent='Password must be at least 6 characters.'; return; }
  if (!suVerifiedId)    { msg.style.color='#ef4444'; msg.textContent='Name verification required. Start over.'; return; }

  btn.textContent = 'Creating…'; btn.disabled = true; msg.textContent = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db,'members',suVerifiedId), { email, uid: cred.user.uid }, { merge: true });
    msg.style.color='#4ade80'; msg.textContent='✅ Account created! Signing you in…';
    setTimeout(() => closeSignup(), 1500);
  } catch(e) {
    btn.textContent = 'Create Account'; btn.disabled = false;
    msg.style.color = '#ef4444';
    if (e.code==='auth/email-already-in-use') msg.textContent='❌ That email already has an account.';
    else if (e.code==='auth/invalid-email') msg.textContent='❌ Invalid email address.';
    else msg.textContent = '❌ '+e.message;
  }
};

// ── LOAD LOANS MODULE ─────────────────────────────────────────
// loans.js is a separate file for all loan logic.
// It reads window.__lg for shared state.
// Bug in loans? Edit loans.js only — no need to touch this file.
import('./loans.js').catch(e => log('Failed to load loans.js: ' + e.message));
