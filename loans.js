// ── loans.js — Let's Grow Investment Club ────────────────────
// All loan logic in one place:
//   - Member side: loadLoanStatus, submitLoanRequest, memberPayLoan
//   - Admin side:  loadLoansAdmin, loadPendingLoans, approveLoan,
//                  rejectLoan, adminRecordRepayment,
//                  laCheckElig, laIssueLoan, laFilter
//
// Shared state comes from window.__lg (set by app.js on load).
// Firebase SDK functions are re-imported from CDN (browser caches them).
//
// To fix a loan bug:  edit this file, push, pull, deploy.
// No other file needs to change.
// ─────────────────────────────────────────────────────────────

import {
  getDoc, setDoc, addDoc, collection, getDocs,
  doc, query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── READ SHARED STATE FROM app.js ────────────────────────────
// window.__lg is set synchronously in app.js before this module
// runs, so these destructure safely at call time via getters.
const lg = () => window.__lg || {};
const db      = () => lg().db;
const STATE   = () => lg().STATE;
const fmt     = (...a) => lg().fmt(...a);
const fmtFull = (...a) => lg().fmtFull(...a);
const toast   = (...a) => lg().toast(...a);
const log     = (...a) => lg().log(...a);

// ── CONSTANTS ─────────────────────────────────────────────────
const FUNCTIONS_BASE = 'https://us-central1-letsgrowinvestmentclub-26878.cloudfunctions.net';
const DAY = 86400000;

// Module-level state for the admin loans list
let laAllLoans = [];
let laFilter_current = 'all';

// ── MEMBER: LOAD LOAN STATUS (into any element by ID) ─────────
// Used in both My Account card and the dedicated Loans tab
window.loadLoanStatusInto = async function(targetId) {
  const wrap = document.getElementById(targetId);
  const member = STATE()?.member;
  if (!wrap || !member) return;
  await _renderLoanStatus(wrap, member);
};

window.loadLoanStatus = async function() {
  const wrap = document.getElementById('loan-status-wrap');
  const member = STATE()?.member;
  if (!wrap || !member) return;
  await _renderLoanStatus(wrap, member);
};

async function _renderLoanStatus(wrap, member) {
  const memberId = member.id;
  try {
    const [activeSnap, pendingSnap, profileSnap] = await Promise.all([
      getDocs(query(collection(db(),'loans'), where('memberId','==',memberId), where('status','in',['active','overdue']))),
      getDocs(query(collection(db(),'loans'), where('memberId','==',memberId), where('status','==','pending'))),
      getDoc(doc(db(),'memberLoanProfiles',memberId))
    ]);

    const profile  = profileSnap.exists() ? profileSnap.data() : {};
    // Eligibility = 25% of subscriptions to 2025 ONLY (no GLA, welfare, UT)
    const sc2025   = member.totalSubscriptionUpTo2025 || member.totalSubscriptions2025 || 0;
    const eligible = member.loanEligibility || Math.round(sc2025 * 0.25);
    const cycle    = profile.currentCycle || 1;
    const cycleMult= cycle<=1?0.60:cycle<=2?0.80:1.00;
    const maxLoan  = Math.floor(eligible * cycleMult);
    const cycleColors = {1:'#1e40af',2:'#6d28d9',3:'#166534'};

    // ── Cool-off period check (48-72hrs after loan closed) ──────
    const lastClosed = profile.lastClosedAt;
    const COOLOFF_MS = 48 * 60 * 60 * 1000; // 48 hours minimum
    const inCoolOff  = lastClosed && (Date.now() - lastClosed) < COOLOFF_MS;
    const coolOffHrsLeft = inCoolOff ? Math.ceil((COOLOFF_MS - (Date.now() - lastClosed)) / 3600000) : 0;

    // ── Has active loan ──────────────────────────────────────
    if (!activeSnap.empty) {
      const loan = { id: activeSnap.docs[0].id, ...activeSnap.docs[0].data() };
      const now  = Date.now();
      let instHtml = '';
      let anyOverdue = false;

      (loan.schedule||[]).forEach((inst,i) => {
        const daysLeft = Math.round((inst.dueDate - now) / DAY);
        const isOver   = !inst.paid && (now - inst.dueDate) / DAY > 7;
        if (isOver) anyOverdue = true;
        const dueTxt   = inst.paid
          ? '✅ Paid'
          : isOver
            ? `⚠️ ${Math.abs(daysLeft)}d overdue`
            : daysLeft <= 7
              ? `🔔 Due in ${daysLeft}d`
              : `Due ${new Date(inst.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}`;
        const bg     = inst.paid ? '#f0fdf4' : isOver ? '#fef2f2' : '#fffbeb';
        const border = inst.paid ? '#22c55e' : isOver ? '#ef4444' : '#f59e0b';

        instHtml += `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:10px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:12px;font-weight:600">Instalment ${inst.installment}</div>
            <div style="font-size:11px;font-weight:600">${fmtFull(inst.amount)}</div>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">${dueTxt}</div>
          ${!inst.paid ? `<button onclick="memberPayLoan('${loan.id}',${i})" style="margin-top:8px;width:100%;padding:8px;background:var(--ink);color:var(--gold);border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">Mark as Paid (notify admin)</button>` : ''}
        </div>`;
      });

      wrap.innerHTML = `
        <div style="background:${anyOverdue?'#fef2f2':'#f0f9ff'};border:1px solid ${anyOverdue?'#ef4444':'#3b82f6'};border-radius:10px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:4px">Active Loan</div>
          <div style="font-size:20px;font-weight:700">${fmtFull(loan.amount)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${loan.duration||60}-day · Total repayable: ${fmtFull(loan.totalRepayable)}</div>
        </div>
        ${instHtml}`;
      return;
    }

    // ── Has pending loan request ─────────────────────────────
    if (!pendingSnap.empty) {
      const loan = pendingSnap.docs[0].data();
      wrap.innerHTML = `
        <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:13px;font-weight:600;color:#92400e">⏳ Loan Request Pending</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">${fmtFull(loan.amount)} · ${loan.duration||60}-day</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Awaiting approval from admin</div>
        </div>`;
      return;
    }

    // ── Eligible — show request form ─────────────────────────
    // Eligibility: use explicit flags if set, otherwise fall back to member.status
    const memberIsActive  = member.isActive === true  || ['active','diaspora'].includes(member.status);
    const memberIsCurrent = member.contributionsUpToDate === true || member.status === 'active';

    // ── Eligibility summary card (always shown) ──────────────
    const eligCard = `
      <div style="background:#f8f4ec;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:6px">Your Loan Eligibility</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><div style="font-size:9px;color:var(--muted)">Subscriptions to 2025</div><div style="font-weight:700">${fmtFull(sc2025)}</div></div>
          <div><div style="font-size:9px;color:var(--muted)">Base Limit (25%)</div><div style="font-weight:700;color:var(--gold)">${fmtFull(eligible)}</div></div>
          <div><div style="font-size:9px;color:var(--muted)">Credit Cycle</div><div style="font-weight:700;color:${cycleColors[cycle]||'#888'}">Cycle ${cycle} · ${Math.round(cycleMult*100)}%</div></div>
          <div><div style="font-size:9px;color:var(--muted)">Max Loan</div><div style="font-weight:700;color:var(--ink)">${fmtFull(maxLoan)}</div></div>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:6px">Eligibility is 25% of subscription payments only — GLA, welfare and unit trust fees are excluded.</div>
      </div>`;

    // Cool-off active — show countdown
    if (inCoolOff) {
      wrap.innerHTML = eligCard + `
        <div style="background:#fff7ed;border:1px solid #f59e0b;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:20px;margin-bottom:6px">⏳</div>
          <div style="font-size:13px;font-weight:700;color:#92400e">Cool-off Period</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">Your last loan was recently settled. You can apply again in approximately <strong>${coolOffHrsLeft} hour${coolOffHrsLeft!==1?'s':''}</strong>.</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">This 48–72hr window allows the Treasurer to process and confirm the settlement before new lending.</div>
        </div>`;
      return;
    }

    if (memberIsActive && memberIsCurrent && maxLoan > 0) {
      wrap.innerHTML = eligCard + `
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:12px">
          <span>Rate: <strong>5% per instalment period</strong></span>
          <span>Interest not compounded</span>
        </div>
        <div style="margin-bottom:8px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);display:block;margin-bottom:5px">Amount (UGX)</label>
          <input id="req-amount" type="number" placeholder="e.g. 500000" max="${maxLoan}"
            style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);font-size:14px">
        </div>
        <div style="margin-bottom:8px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);display:block;margin-bottom:5px">Duration</label>
          <select id="req-duration" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);font-size:13px;background:#fff">
            <option value="60">60-Day — 5% reducing balance (2 instalments)</option>
            <option value="30">30-Day — 5% flat (1 instalment)</option>
          </select>
        </div>
        <div style="margin-bottom:14px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);display:block;margin-bottom:5px">Purpose</label>
          <input id="req-purpose" type="text" placeholder="e.g. School fees, business stock…"
            style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);font-size:13px">
        </div>
        <button onclick="submitLoanRequest()" style="width:100%;padding:12px;background:var(--gold);color:var(--ink);border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
          Submit Loan Request
        </button>
        <div id="req-msg" style="font-size:11px;margin-top:8px;text-align:center;min-height:16px"></div>`;
    } else {
      // Not eligible
      let reason = '';
      if (!memberIsActive)  reason = 'Your account is not currently active.';
      else if (!memberIsCurrent) reason = 'Contributions must be up to date to apply. Contact admin to update your status.';
      else if (maxLoan <= 0) reason = 'No eligible subscription savings on record yet.';
      wrap.innerHTML = eligCard + `<div style="text-align:center;color:var(--muted);font-size:12px;padding:8px 0">
        <div style="font-size:18px;margin-bottom:6px">🔒</div>
        <div>Not currently eligible</div>
        <div style="font-size:11px;margin-top:4px;color:#991b1b">${reason}</div>
      </div>`;
    }
  } catch(e) {
    wrap.innerHTML = '<div style="color:var(--muted);font-size:12px">Could not load loan info</div>';
    log('LoanStatus: '+e.message);
  }
};

// ── MEMBER: SUBMIT LOAN REQUEST ───────────────────────────────
window.submitLoanRequest = async function() {
  const amount   = Number(document.getElementById('req-amount')?.value);
  const duration = Number(document.getElementById('req-duration')?.value);
  const purpose  = document.getElementById('req-purpose')?.value.trim();
  const msgEl    = document.getElementById('req-msg');
  if (!amount || amount < 50000) { msgEl.style.color='#991b1b'; msgEl.textContent='Enter a valid amount (min UGX 50,000)'; return; }
  if (!purpose) { msgEl.style.color='#991b1b'; msgEl.textContent='Please state the purpose of the loan'; return; }

  const member   = STATE()?.member;
  const memberId = member.id;
  const sc2025   = member.totalSubscriptionUpTo2025 || 0;
  const eligible = member.loanEligibility || Math.round(sc2025 * 0.25);
  const profile  = (await getDoc(doc(db(),'memberLoanProfiles',memberId))).data() || {};
  const cycle    = profile.currentCycle || 1;
  const cycleMult= cycle<=1?0.60:cycle<=2?0.80:1.00;
  const maxLoan  = Math.floor(eligible * cycleMult);

  if (amount > maxLoan) { msgEl.style.color='#991b1b'; msgEl.textContent=`Max loan for your cycle is ${fmtFull(maxLoan)}`; return; }

  msgEl.style.color='var(--muted)'; msgEl.textContent='Submitting…';
  try {
    await addDoc(collection(db(),'loans'), {
      memberId,
      memberName:  member.name || member.displayName || '',
      memberEmail: member.email || '',
      amount,
      duration,
      purpose,
      status: 'pending',
      cycleAtRequest: cycle,
      requestedAt: serverTimestamp(),
      approvedAt: null, approvedBy: null,
      rejectedAt: null, rejectionReason: null,
      schedule: [],
      totalRepayable: 0,
    });

    await addDoc(collection(db(),'notifications'), {
      title: '📋 Loan Request — ' + (member.name||'Member'),
      body:  `${member.name||'A member'} has requested a loan of ${fmtFull(amount)} (${duration}-day) for: ${purpose}`,
      type:  'loan_request',
      memberId,
      read:  false,
      createdAt: serverTimestamp(),
    });

    msgEl.style.color='#166534';
    msgEl.textContent='✅ Request submitted! Admin will review and notify you.';
    setTimeout(() => window.loadLoanStatus?.(), 2000);
  } catch(e) { msgEl.style.color='#991b1b'; msgEl.textContent='Error: '+e.message; }
};

// ── MEMBER: MARK INSTALMENT AS PAID ──────────────────────────
// Creates a notification for admin to verify — no Firestore write to loan doc
window.memberPayLoan = async function(loanId, instIdx) {
  const confirmed = confirm('Confirm you have paid this instalment? Admin will verify and record it.');
  if (!confirmed) return;
  const member = STATE()?.member;
  try {
    const loanSnap = await getDoc(doc(db(),'loans',loanId));
    const loan     = loanSnap.data();
    const inst     = loan.schedule[instIdx];

    await addDoc(collection(db(),'notifications'), {
      title: '💰 Repayment — ' + (member?.name||'Member'),
      body:  `${member?.name||'Member'} reports payment of instalment ${inst.installment} (${fmtFull(inst.amount)}) for loan ${loanId}`,
      type:  'repayment_claim',
      loanId,
      memberId: member?.id,
      instIdx,
      read:  false,
      createdAt: serverTimestamp(),
    });
    toast('Admin notified — they will confirm your payment shortly', 'success');
  } catch(e) { toast('Error: '+e.message,'error'); }
};

// ── SAFE ELEMENT SETTER (works whether element exists or not) ──
function setEl(id, val, prop='textContent') {
  const el = document.getElementById(id);
  if (el) el[prop] = val;
}

// ── ADMIN: LOAD LOANS DASHBOARD ───────────────────────────────
window.loadLoansAdmin = async function() {
  try {
    const [bankSnap, loansSnap, membersSnap] = await Promise.all([
      getDoc(doc(db(),'club','bankBalance')),
      getDocs(query(collection(db(),'loans'), where('status','in',['active','overdue']))),
      getDocs(query(collection(db(),'members'), where('isActive','==',true)))
        .catch(() => ({ docs:[], forEach:()=>{} }))
    ]);
    const bank = bankSnap.exists() ? bankSnap.data() : {};
    const now = Date.now();
    laAllLoans = [];
    let totalOut = 0, totalOver = 0, overCount = 0;

    loansSnap.forEach(d => {
      const loan = { id: d.id, ...d.data() };
      let out = 0, over = 0;
      (loan.schedule||[]).forEach(inst => {
        if (!inst.paid) {
          out += inst.amount||0; totalOut += inst.amount||0;
          if ((now - inst.dueDate) / DAY > 7) { over += inst.amount||0; totalOver += inst.amount||0; }
        }
      });
      loan._out = out; loan._over = over; loan._isOver = over > 0;
      if (over > 0) overCount++;
      laAllLoans.push(loan);
    });

    const avail     = bank.loansPool || 0;
    const totalPool = avail + totalOut;
    const par  = totalOut > 0 ? (totalOver / totalOut) * 100 : 0;
    const util = totalPool > 0 ? (totalOut / totalPool) * 100 : 0;

    // Write stats — safe for both Admin tab and dedicated Loans section
    setEl('la-pool',      fmt(avail));
    setEl('la-out',       fmt(totalOut));
    setEl('la-outcount',  laAllLoans.length + ' active');
    setEl('la-over',      fmt(totalOver));
    setEl('la-overcount', overCount + ' overdue');
    setEl('la-total',     fmt(totalPool));
    setEl('la-par-pct',   par.toFixed(2) + '%');
    setEl('la-util',      util.toFixed(1) + '%');
    setEl('la-bank',      fmt(bank.total||0));

    const bar   = document.getElementById('la-par-bar');
    const badge = document.getElementById('la-par-badge');
    const card  = document.getElementById('la-par-card');
    if (bar && badge && card) {
      bar.style.width = Math.min(par,25)/25*100+'%';
      if (par > 15) {
        bar.style.background='#ef4444'; badge.textContent='RESTRICT'; badge.style.background='#ef4444';
        card.style.borderLeftColor='#ef4444';
        setEl('la-restrict', '', 'style');
        const ri = document.getElementById('la-restrict'); if (ri) ri.style.display='block';
      } else if (par > 10) {
        bar.style.background='#f59e0b'; badge.textContent='CAUTION'; badge.style.background='#f59e0b';
        card.style.borderLeftColor='#f59e0b';
      } else {
        bar.style.background='#22c55e'; badge.textContent='HEALTHY'; badge.style.background='#22c55e';
        card.style.borderLeftColor='#22c55e';
      }
    }

    // If we're in the dedicated Loans section, also write a summary card there
    const loanTabActive = document.getElementById('loan-tab-active');
    if (loanTabActive) {
      loanTabActive.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div class="stat-card bt-green"><label>Pool Available</label><div class="sv" style="font-size:18px">${fmt(avail)}</div><div class="ss">Ready to lend</div></div>
          <div class="stat-card bt-gold"><label>Outstanding</label><div class="sv" style="font-size:18px">${fmt(totalOut)}</div><div class="ss">${laAllLoans.length} active loans</div></div>
          <div class="stat-card" style="border-top:3px solid #ef4444"><label>Overdue</label><div class="sv" style="font-size:18px;color:#ef4444">${fmt(totalOver)}</div><div class="ss">${overCount} loans overdue</div></div>
          <div class="stat-card bt-blue"><label>PAR</label><div class="sv" style="font-size:18px;color:${par>15?'#ef4444':par>10?'#f59e0b':'#22c55e'}">${par.toFixed(1)}%</div><div class="ss">${par>15?'🚨 RESTRICT':par>10?'⚠ CAUTION':'✓ HEALTHY'}</div></div>
        </div>
        ${par>15?`<div style="background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;color:#991b1b;font-weight:600">🚨 PAR above 15% — lending restricted until overdue loans are resolved.</div>`:''}
        <div class="card" style="margin-bottom:12px">
          <div class="card-title" style="margin-bottom:10px">Active Loans</div>
          <div id="loan-tab-active-list"><div class="empty" style="padding:14px">No active loans</div></div>
        </div>`;
      laRenderLoansInto('loan-tab-active-list');
    }

    // Populate member dropdown in Admin tab Issue Loan form
    const sel = document.getElementById('la-member');
    if (sel) {
      sel.innerHTML = '<option value="">Select member…</option>';
      const mArr = [];
      membersSnap.forEach(d => mArr.push({ id: d.id, ...d.data() }));
      mArr.sort((a,b) => (a.name||'').localeCompare(b.name||''));
      mArr.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = (m.name||m.displayName||m.id) + (m.status==='diaspora'?' (diaspora)':'');
        sel.appendChild(opt);
      });
    }

    laRenderLoans(); // write to Admin tab la-loans-list if it exists

    // ── Closed & rejected loan history ────────────────────────
    const histSnap = await getDocs(query(
      collection(db(),'loans'),
      where('status','in',['closed','rejected']),
      limit(30)
    )).catch(()=>({ docs:[], forEach:()=>{} }));

    const histEl = document.getElementById('la-history-list');
    if (!histEl) return;
    const histLoans = [];
    histSnap.forEach(d => histLoans.push({ id:d.id, ...d.data() }));
    histLoans.sort((a,b) => {
      const ta = (a.requestedAt||a.approvedAt)?.toMillis?.() || 0;
      const tb = (b.requestedAt||b.approvedAt)?.toMillis?.() || 0;
      return tb - ta;
    });
    if (!histLoans.length) { histEl.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px 0">No closed or rejected loans</div>'; return; }
    histEl.innerHTML = histLoans.map(l => {
      const ts = l.requestedAt || l.approvedAt || l.createdAt;
      const date = ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : '—';
      const sc = l.status==='closed' ? '#166534' : '#991b1b';
      return `<div style="border-bottom:1px solid var(--border);padding:9px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:600;font-size:12px">${l.memberName||l.memberId}</div>
          <span style="font-size:9px;padding:2px 8px;border-radius:10px;background:${sc};color:#fff">${l.status}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">UGX ${(l.amount||0).toLocaleString()} · ${date}${l.purpose?' · '+l.purpose:''}</div>
        ${l.rejectionReason ? `<div style="font-size:10px;color:#991b1b;margin-top:2px">Rejected: ${l.rejectionReason}</div>` : ''}
      </div>`;
    }).join('');
  } catch(e) { log('LoansAdmin: '+e.message); }
};

// ── ADMIN: RENDER ACTIVE LOANS LIST ──────────────────────────
// Writes to a given element ID (defaults to Admin tab list)
function laRenderLoansInto(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const loans = laFilter_current === 'overdue' ? laAllLoans.filter(l => l._isOver) : laAllLoans;
  if (!loans.length) {
    el.innerHTML = `<div class="empty" style="padding:20px">No ${laFilter_current} loans</div>`;
    return;
  }
  el.innerHTML = loans.map(l => {
    const next     = (l.schedule||[]).find(s => !s.paid);
    const daysLeft = next ? Math.round((next.dueDate - Date.now()) / DAY) : null;
    const dueStr   = daysLeft !== null
      ? daysLeft < 0
        ? `<span style="color:#ef4444;font-weight:700">${Math.abs(daysLeft)}d overdue</span>`
        : daysLeft <= 7
          ? `<span style="color:#f59e0b;font-weight:700">${daysLeft}d left</span>`
          : `<span style="color:var(--muted)">${daysLeft}d left</span>`
      : '';
    const repayBtns = (l.schedule||[])
      .map((inst,i) => !inst.paid
        ? `<button onclick="adminRecordRepayment('${l.id}',${i})" style="flex:1;padding:7px;background:var(--ink);color:var(--gold);border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">Record Inst.${inst.installment}</button>`
        : '')
      .filter(Boolean).join('');
    return `<div style="border-bottom:1px solid var(--border);padding:10px 0">
      <div style="display:flex;justify-content:space-between">
        <div style="font-weight:600;font-size:13px">${l.memberName||l.memberId}</div>
        <div style="font-weight:700;font-size:13px">UGX ${(l.amount||0).toLocaleString()}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--muted)">
        <span>Outstanding: <strong style="color:#e67e22">UGX ${l._out.toLocaleString()}</strong></span>
        <span>${dueStr}</span>
      </div>
      ${l._over > 0 ? `<div style="font-size:11px;color:#ef4444;margin-top:2px">⚠️ Overdue: UGX ${l._over.toLocaleString()}</div>` : ''}
      <div style="margin-top:8px;display:flex;gap:6px">${repayBtns}</div>
    </div>`;
  }).join('');
}

function laRenderLoans() {
  laRenderLoansInto('la-loans-list');
  // Also refresh dedicated section if it's showing
  if (document.getElementById('loan-tab-active-list')) {
    laRenderLoansInto('loan-tab-active-list');
  }
}

// ── ADMIN: FILTER ACTIVE LOANS ────────────────────────────────
window.laFilter = function(f) {
  laFilter_current = f;
  document.getElementById('la-tab-all').style.background  = f==='all'     ? 'var(--ink)' : 'var(--border)';
  document.getElementById('la-tab-all').style.color       = f==='all'     ? '#fff' : 'var(--ink)';
  document.getElementById('la-tab-over').style.background = f==='overdue' ? 'var(--ink)' : 'var(--border)';
  document.getElementById('la-tab-over').style.color      = f==='overdue' ? '#fff' : 'var(--ink)';
  laRenderLoans();
};

// ── ADMIN: CHECK MEMBER ELIGIBILITY (Cloud Function) ──────────
window.laCheckElig = async function() {
  const memberId = document.getElementById('la-member').value;
  if (!memberId) return;
  const el   = document.getElementById('la-elig-result');
  const form = document.getElementById('la-issue-form');
  el.style.display = 'block'; el.innerHTML = 'Checking…'; form.style.display = 'none';
  try {
    const resp = await fetch(FUNCTIONS_BASE + '/checkEligibility?memberId=' + memberId);
    const data = await resp.json();
    if (data.eligible) {
      el.style.background = '#f0fdf4'; el.style.border = '1px solid #22c55e';
      el.innerHTML = `<div style="color:#166534;font-weight:700;margin-bottom:4px">✅ Eligible</div>
        <div style="font-size:11px">Savings: <strong>UGX ${(data.savings||0).toLocaleString()}</strong></div>
        <div style="font-size:11px">Max (25%): <strong>UGX ${(data.maxLoanBase||0).toLocaleString()}</strong></div>
        <div style="font-size:11px">Cycle ${data.currentCycle} limit (${data.cyclePercent}%): <strong>UGX ${(data.cycleLimit||0).toLocaleString()}</strong></div>`;
      document.getElementById('la-amount').max = data.cycleLimit;
      form.style.display = 'block';
    } else {
      el.style.background = '#fef2f2'; el.style.border = '1px solid #ef4444';
      el.innerHTML = `<div style="color:#991b1b;font-weight:700">❌ ${data.reason}</div>`;
    }
  } catch(e) { el.innerHTML = '<span style="color:red">Error: '+e.message+'</span>'; }
};

// ── ADMIN: ISSUE LOAN (Cloud Function override) ───────────────
window.laIssueLoan = async function() {
  const memberId = document.getElementById('la-member').value;
  const amount   = Number(document.getElementById('la-amount').value);
  const duration = Number(document.getElementById('la-duration').value);
  const msgEl    = document.getElementById('la-issue-msg');
  if (!memberId || !amount) return;
  msgEl.style.color = 'var(--muted)'; msgEl.textContent = 'Issuing…';
  try {
    const resp = await fetch(FUNCTIONS_BASE + '/createLoan', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ memberId, amount, duration })
    });
    const text = await resp.text();
    let data; try { data = JSON.parse(text); } catch { data = { error: text }; }
    if (data.success || data.loanId) {
      msgEl.style.color = '#166534'; msgEl.textContent = '✅ Loan issued! ID: '+(data.loanId||'');
      document.getElementById('la-issue-form').style.display = 'none';
      document.getElementById('la-elig-result').style.display = 'none';
      document.getElementById('la-member').value = '';
      window.loadLoansAdmin();
    } else {
      msgEl.style.color = '#991b1b'; msgEl.textContent = '❌ '+(data.error||data.message||text);
    }
  } catch(e) { msgEl.style.color='#991b1b'; msgEl.textContent='❌ '+e.message; }
};

// ── ADMIN: LOAD PENDING LOAN REQUESTS ─────────────────────────
window.loadPendingLoans = async function() {
  // Writes to whichever pending list elements exist
  const targets = ['la-pending-list','loan-tab-pending'].map(id => document.getElementById(id)).filter(Boolean);
  if (!targets.length) return;
  targets.forEach(el => el.innerHTML = '<div style="color:var(--muted);font-size:12px">Loading…</div>');
  try {
    const snap = await getDocs(query(
      collection(db(),'loans'),
      where('status','==','pending'),
      orderBy('requestedAt','desc')
    )).catch(()=>({ docs:[], forEach:()=>{} }));

    const emptyHtml = '<div style="color:var(--muted);font-size:12px;padding:8px 0">No pending requests</div>';
    if (!snap.docs?.length) { targets.forEach(el => el.innerHTML = emptyHtml); return; }

    let html = '';
    snap.forEach(d => {
      const l    = { id: d.id, ...d.data() };
      const date = l.requestedAt?.toDate ? l.requestedAt.toDate().toLocaleDateString('en-GB') : '—';
      html += `<div style="border:1px solid #f59e0b;border-radius:10px;padding:12px;margin-bottom:8px;background:#fffbeb">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div>
            <div style="font-weight:700;font-size:13px">${l.memberName||l.memberId}</div>
            <div style="font-size:11px;color:var(--muted)">${date} · Cycle ${l.cycleAtRequest||1}</div>
          </div>
          <div style="font-weight:700;font-size:14px;color:var(--gold)">${fmtFull(l.amount)}</div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:10px">Duration: ${l.duration||60}-day · Purpose: ${l.purpose||'Not stated'}</div>
        <div style="display:flex;gap:8px">
          <button onclick="approveLoan('${l.id}')" style="flex:1;padding:9px;background:#166534;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">✅ Approve</button>
          <button onclick="rejectLoan('${l.id}')"  style="flex:1;padding:9px;background:#991b1b;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">❌ Reject</button>
        </div>
      </div>`;
    });
    targets.forEach(el => el.innerHTML = html);
  } catch(e) {
    targets.forEach(el => el.innerHTML = '<div style="color:var(--muted);font-size:12px">Error loading requests</div>');
    log('PendingLoans: '+e.message);
  }
};

// ── ADMIN: APPROVE A LOAN REQUEST ────────────────────────────
window.approveLoan = async function(loanId) {
  const state = STATE();
  if (!state?.isAdmin) { toast('Admin only','error'); return; }
  try {
    const loanSnap = await getDoc(doc(db(),'loans',loanId));
    const loan = loanSnap.data();
    const now  = Date.now();
    const rate = 0.05;

    // Build repayment schedule
    let schedule;
    if (loan.duration === 30) {
      schedule = [{
        installment: 1,
        dueDate:  now + 30*DAY,
        amount:   Math.round(loan.amount*(1+rate)),
        paid: false, paidDate: null, penalty: 0
      }];
    } else {
      const half = Math.floor(loan.amount/2);
      const rest = loan.amount - half;
      schedule = [
        { installment:1, dueDate: now+30*DAY, amount: half + Math.round(loan.amount*rate), paid:false, paidDate:null, penalty:0 },
        { installment:2, dueDate: now+60*DAY, amount: rest + Math.round(rest*rate),         paid:false, paidDate:null, penalty:0 },
      ];
    }
    const totalRepayable = schedule.reduce((s,i)=>s+i.amount,0);

    await setDoc(doc(db(),'loans',loanId), {
      ...loan, status:'active', schedule, totalRepayable,
      approvedAt: serverTimestamp(),
      approvedBy: state.user?.email||'admin',
    });

    // Deduct from loans pool
    const bankSnap = await getDoc(doc(db(),'club','bankBalance'));
    const bank = bankSnap.data();
    await setDoc(doc(db(),'club','bankBalance'), { ...bank, loansPool: (bank.loansPool||0) - loan.amount });

    // Notify member
    await addDoc(collection(db(),'notifications'), {
      title: '✅ Loan Approved!',
      body:  `Your loan of ${fmtFull(loan.amount)} has been approved. First instalment due ${new Date(schedule[0].dueDate).toLocaleDateString('en-GB')}.`,
      type:  'loan_approved', memberId: loan.memberId, read: false, createdAt: serverTimestamp(),
    });

    toast('Loan approved!', 'success');
    window.loadLoansAdmin();
    window.loadPendingLoans();
  } catch(e) { toast('Error: '+e.message,'error'); log('ApproveLoan: '+e.message); }
};

// ── ADMIN: REJECT A LOAN REQUEST ─────────────────────────────
window.rejectLoan = async function(loanId) {
  const state = STATE();
  if (!state?.isAdmin) return;
  const reason = prompt('Reason for rejection (optional):') || 'Not approved at this time';
  try {
    await setDoc(doc(db(),'loans',loanId), {
      status:'rejected', rejectedAt: serverTimestamp(), rejectionReason: reason
    }, { merge:true });

    const loanSnap = await getDoc(doc(db(),'loans',loanId));
    await addDoc(collection(db(),'notifications'), {
      title: '❌ Loan Request Not Approved',
      body:  `Your loan request was not approved. Reason: ${reason}`,
      type:  'loan_rejected',
      memberId: loanSnap.data().memberId,
      read: false, createdAt: serverTimestamp(),
    });
    toast('Request rejected', 'success');
    window.loadPendingLoans();
  } catch(e) { toast('Error: '+e.message,'error'); }
};

// ── ADMIN: RECORD A REPAYMENT ─────────────────────────────────
window.adminRecordRepayment = async function(loanId, instIdx) {
  const state = STATE();
  if (!state?.isAdmin) return;
  const loanSnap = await getDoc(doc(db(),'loans',loanId));
  const loan = loanSnap.data();
  const inst = loan.schedule[instIdx];

  const amtIn = prompt(`Record repayment for instalment ${inst.installment}\nExpected: UGX ${inst.amount.toLocaleString()}\nEnter amount paid:`);
  if (!amtIn) return;
  const amtPaid = Number(amtIn.replace(/,/g,''));
  if (isNaN(amtPaid) || amtPaid <= 0) { toast('Invalid amount','error'); return; }

  try {
    const schedule = [...loan.schedule];
    const now      = Date.now();
    const daysOver = Math.max(0, (now - inst.dueDate - 7*DAY) / DAY);
    const penalty  = daysOver > 0 ? Math.round(inst.amount * 0.03 * daysOver/30) : 0;

    schedule[instIdx] = { ...inst, paid:true, paidDate:now, paidAmount:amtPaid, penalty, wasLate: daysOver>0 };
    const allPaid = schedule.every(s=>s.paid);

    await setDoc(doc(db(),'loans',loanId), {
      ...loan, schedule, status: allPaid ? 'closed' : 'active',
      totalRepaid: (loan.totalRepaid||0) + amtPaid,
      outstandingBalance: Math.max(0,(loan.amount||0) - schedule.filter(s=>s.paid).reduce((a,s)=>a+(s.paidAmount||0),0)),
    });

    // Return amount to loans pool
    const bankSnap = await getDoc(doc(db(),'club','bankBalance'));
    const bank = bankSnap.data();
    await setDoc(doc(db(),'club','bankBalance'), { ...bank, loansPool: (bank.loansPool||0) + amtPaid });

    if (allPaid) {
      // Advance member's credit cycle if repaid on time
      const profSnap = await getDoc(doc(db(),'memberLoanProfiles',loan.memberId));
      if (profSnap.exists()) {
        const prof = profSnap.data();
        const wasOnTime = !schedule.some(s=>s.wasLate);
        const newCycle  = wasOnTime && prof.currentCycle < 3 ? prof.currentCycle+1 : prof.currentCycle;
        await setDoc(doc(db(),'memberLoanProfiles',loan.memberId), {
          ...prof, activeLoanId:null, isEligible:true,
          currentCycle: newCycle,
          lastClosedAt: Date.now(), // starts 48-72hr cool-off window
          consecutiveOnTimeRepayments: wasOnTime ? (prof.consecutiveOnTimeRepayments||0)+1 : 0,
        });
      }
      toast('Loan fully repaid! Cycle updated.','success');
    } else {
      toast(`Instalment ${inst.installment} recorded`, 'success');
    }
    window.loadLoansAdmin();
  } catch(e) { toast('Error: '+e.message,'error'); log('Repayment: '+e.message); }
};
