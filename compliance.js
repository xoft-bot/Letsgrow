// ── compliance.js — Let's Grow Investment Club ────────────────
// Compliance, warnings, and payment status module.
//
// CHANGES v2.1:
//   - Admins now receive compliance banners when they are behind
//   - Monthly total now includes subscription + welfare + GLA + UT + diaspora fee
//   - Diaspora members automatically have diaspora fee (20K/mo) added to owed amount
//   - Fixed double showSection wrapping bug
//   - Removed m is not defined risk in _injectFullYearStatus
// ─────────────────────────────────────────────────────────────

function _ready(fn) {
  if (window.__lg?.STATE) { fn(); }
  else { setTimeout(() => _ready(fn), 150); }
}

_ready(function() {
  const { db, STATE, fmt, fmtFull, toast, MONTHS,
          serverTimestamp, log, getDoc, setDoc, addDoc,
          collection, getDocs, doc, query, where, limit } = window.__lg;

  // ── CONSTANTS ───────────────────────────────────────────────
  const FINE_ABSENT_MEETING  = 15000;
  const MONTHS_BEFORE_NOTICE = 3;
  const MONTHS_BEFORE_EXPEL  = 4;
  const EXIT_REFUND_PCT      = 0.60;
  const DIASPORA_FEE_MONTHLY = 20000;  // UGX 20K/month for diaspora members

  // ── MONTHLY TOTAL CALCULATION ────────────────────────────────
  // Full monthly obligation = subscription + welfare + GLA + UT + diaspora
  // Derived from accounts data (2024+):
  //   welfare = 25% of subscription
  //   GLA     = 32.5% of subscription (13K/40K)
  //   UT      = 25% of subscription
  //   Total multiplier = 1.825x subscription
  // Diaspora: additional 20K/month flat fee
  function _fullMonthlyRate(member) {
    const sub      = member.monthlySubscription || member.monthlyRate || 40000;
    const welfare  = member.monthlyWelfare  || Math.round(sub * 0.25);
    const gla      = member.monthlyGLA      || Math.round(sub * 0.325);
    const ut       = member.monthlyUT       || Math.round(sub * 0.25);
    const diaspora = member.status === 'diaspora' ? DIASPORA_FEE_MONTHLY : 0;
    return { sub, welfare, gla, ut, diaspora, total: sub + welfare + gla + ut + diaspora };
  }

  // Quarter end dates
  function _quarterEnd() {
    const now = new Date();
    const y   = now.getFullYear();
    const ends = [
      new Date(y, 2, 31),   // Q1 → Mar 31
      new Date(y, 5, 30),   // Q2 → Jun 30
      new Date(y, 8, 30),   // Q3 → Sep 30
      new Date(y, 11, 31),  // Q4 → Dec 31
    ];
    return ends.find(d => d >= now) || ends[3];
  }

  function _daysUntil(date) {
    return Math.max(0, Math.ceil((date - new Date()) / 86400000));
  }

  // How many months behind on SUBSCRIPTION only (used for suspension logic)
  function _monthsBehind(member) {
    const now  = new Date();
    const yr   = now.getFullYear();
    const mo   = now.getMonth();
    const rate = member.monthlySubscription || member.monthlyRate || 40000;
    const paid = (member.subscriptionByYear || {})[String(yr)] || 0;
    const due  = rate * (mo + 1);
    return paid >= due ? 0 : Math.ceil((due - paid) / rate);
  }

  // Total UGX owed across all fee types this year to date
  function _totalOwed(member) {
    const now  = new Date();
    const yr   = now.getFullYear();
    const mo   = now.getMonth(); // 0-based, current month
    const rates  = _fullMonthlyRate(member);

    // What's due through end of current month for each fee type
    const subDue      = rates.sub      * (mo + 1);
    const welfareDue  = rates.welfare  * (mo + 1);
    const glaDue      = rates.gla      * (mo + 1);
    const utDue       = rates.ut       * (mo + 1);
    const diasporaDue = rates.diaspora * (mo + 1);

    // What's paid for each type this year
    const subPaid      = (member.subscriptionByYear  || {})[String(yr)] || 0;
    const welfarePaid  = (member.welfareByYear        || {})[String(yr)] || 0;
    const glaPaid      = (member.glaByYear            || {})[String(yr)] || 0;
    const utPaid       = (member.unitTrustByYear      || {})[String(yr)] || 0;
    const diasporaPaid = (member.diasporaByYear       || {})[String(yr)] || 0;

    const subOwed      = Math.max(0, subDue      - subPaid);
    const welfareOwed  = Math.max(0, welfareDue  - welfarePaid);
    const glaOwed      = Math.max(0, glaDue      - glaPaid);
    const utOwed       = Math.max(0, utDue       - utPaid);
    const diasporaOwed = Math.max(0, diasporaDue - diasporaPaid);
    const total        = subOwed + welfareOwed + glaOwed + utOwed + diasporaOwed;

    return { subOwed, welfareOwed, glaOwed, utOwed, diasporaOwed, total, subPaid };
  }

  // ── 1. DASHBOARD COMPLIANCE BANNER ──────────────────────────
  // Shows for ALL members including admin (admins are also members).
  async function _injectComplianceBanner() {
    const member = STATE.member;
    if (!member) return;   // ← admin check removed; admins pay dues too

    const behind   = _monthsBehind(member);
    const owed     = _totalOwed(member);
    const qEnd     = _quarterEnd();
    const daysLeft = _daysUntil(qEnd);
    const rates    = _fullMonthlyRate(member);

    // Get unpaid fines
    let finesTotal = 0;
    try {
      const fs = await getDocs(query(collection(db, 'fines'),
        where('memberId', '==', member.id), where('status', '==', 'unpaid')));
      fs.forEach(d => finesTotal += Number(d.data().amount || 0));
    } catch (e) {}

    const totalDue = owed.total + finesTotal;
    const container = document.getElementById('sec-dashboard');
    if (!container) return;

    let banner = document.getElementById('compliance-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'compliance-banner';
      banner.style.cssText = 'margin:0 0 12px 0';
      const firstCard = container.querySelector('.card,.hero-card,[class*="hero"]');
      if (firstCard) container.insertBefore(banner, firstCard);
      else container.prepend(banner);
    }

    if (behind === 0 && finesTotal === 0) {
      // Green: up to date
      banner.innerHTML = `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px">
          <span style="font-size:22px">✅</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#166534">All contributions up to date</div>
            <div style="font-size:11px;color:#15803d;margin-top:2px">Next quarter ends in <strong>${daysLeft} days</strong> (${qEnd.toLocaleDateString('en-GB',{day:'numeric',month:'short'})})</div>
          </div>
        </div>`;
    } else {
      // Behind on payments
      const sev  = behind >= MONTHS_BEFORE_EXPEL ? 3 : behind >= MONTHS_BEFORE_NOTICE ? 2 : 1;
      const cols = [
        ['#fffbeb','#fde68a','#92400e','⚠️'],
        ['#fef2f2','#fca5a5','#991b1b','🚨'],
        ['#fef2f2','#ef4444','#7f1d1d','🔴'],
      ][sev - 1];
      const [bg, border, clr, icon] = cols;

      // Build breakdown of what's owed
      const breakdownParts = [];
      if (owed.subOwed > 0)      breakdownParts.push(`Subscription: UGX ${owed.subOwed.toLocaleString()}`);
      if (owed.welfareOwed > 0)  breakdownParts.push(`Welfare: UGX ${owed.welfareOwed.toLocaleString()}`);
      if (owed.glaOwed > 0)      breakdownParts.push(`GLA: UGX ${owed.glaOwed.toLocaleString()}`);
      if (owed.utOwed > 0)       breakdownParts.push(`Unit Trust: UGX ${owed.utOwed.toLocaleString()}`);
      if (owed.diasporaOwed > 0) breakdownParts.push(`Diaspora Fee: UGX ${owed.diasporaOwed.toLocaleString()}`);
      if (finesTotal > 0)        breakdownParts.push(`Fines: UGX ${finesTotal.toLocaleString()}`);

      const suspensionWarning = sev === 3 ? `
        <div style="background:#fee2e2;border-radius:7px;padding:8px 10px;margin-top:8px;font-size:11px;color:#7f1d1d;font-weight:700">
          ⚠️ Account at risk of suspension. Member may forfeit 60% of subscriptions on exit. Contact admin immediately.
        </div>` : '';

      const fineWarning = daysLeft <= 30 ? `
        <div style="font-size:10px;color:${clr};opacity:.85;margin-top:3px">
          ⚡ Quarter ends in <strong>${daysLeft} days</strong> — unresolved arrears attract UGX ${FINE_ABSENT_MEETING.toLocaleString()} fine
        </div>` : '';

      const progressPct = Math.min(100, Math.round(
        owed.subPaid / (rates.sub * (new Date().getMonth() + 1)) * 100
      ));

      banner.innerHTML = `
        <div style="background:${bg};border:1.5px solid ${border};border-radius:12px;padding:13px 14px">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <span style="font-size:22px;flex-shrink:0">${icon}</span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:${clr}">${behind} month${behind !== 1 ? 's' : ''} behind — Total outstanding: <strong>${fmtFull(totalDue)}</strong></div>
              <div style="font-size:11px;color:${clr};opacity:.85;margin-top:2px">Monthly obligation: ${fmtFull(rates.total)}/month (sub + welfare + GLA + UT${member.status === 'diaspora' ? ' + diaspora' : ''})</div>
              ${fineWarning}
            </div>
          </div>
          ${breakdownParts.length > 0 ? `
          <div style="margin-top:8px;background:rgba(0,0,0,.06);border-radius:7px;padding:8px 10px">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${clr};margin-bottom:4px">Breakdown</div>
            ${breakdownParts.map(p => `<div style="font-size:11px;color:${clr};opacity:.9">${p}</div>`).join('')}
          </div>` : ''}
          <div style="margin-top:8px;background:rgba(0,0,0,.08);border-radius:4px;height:4px;overflow:hidden">
            <div style="height:100%;border-radius:4px;background:${clr};width:${progressPct}%"></div>
          </div>
          ${suspensionWarning}
        </div>`;
    }
  }

  // ── 2. MEMBER ACCOUNT: FULL-YEAR STATUS CARD ────────────────
  async function _injectFullYearStatus() {
    const member = STATE.member;
    if (!member) return;  // ← removed STATE.isAdmin check; admins are members too

    const yr   = new Date().getFullYear();
    const mo   = new Date().getMonth();
    const rate = member.monthlySubscription || member.monthlyRate || 40000;

    const wrap = document.getElementById('full-year-status-card');
    if (!wrap) return;

    const subByYear = member.subscriptionByYear || {};
    const years     = Object.keys(subByYear).sort().reverse();
    if (!years.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';

    let html = '';
    for (const year of years.slice(0, 3)) {
      const paid       = subByYear[year] || 0;
      const isCurrentYr = Number(year) === yr;
      const lastMo    = isCurrentYr ? mo : 11;
      const moLabels  = ['J','F','M','A','M','J','J','A','S','O','N','D'];
      let dots = '';
      for (let i = 0; i < 12; i++) {
        const eom = rate * (i + 1), bom = rate * i;
        let cls, lbl;
        if (paid >= eom)                         { cls = 'mo-paid';    lbl = '✓'; }
        else if (paid > bom)                     { cls = 'mo-partial'; lbl = '~'; }
        else if (!isCurrentYr || i <= lastMo)    { cls = 'mo-due';     lbl = '!'; }
        else                                     { cls = 'mo-future';  lbl = moLabels[i]; }
        dots += `<div class="mo ${cls}" title="${MONTHS[i]} ${year}">${lbl}</div>`;
      }
      const totalRate = rate * 12;
      const pct       = Math.min(100, Math.round(paid / totalRate * 100));
      const barColor  = pct >= 100 ? '#166534' : pct >= 50 ? '#d97706' : '#991b1b';
      html += `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
            <div style="font-size:11px;font-weight:700;color:var(--ink)">${year}</div>
            <div style="font-size:11px;color:${barColor};font-weight:600">${fmtFull(paid)} / ${fmtFull(totalRate)}</div>
          </div>
          <div style="background:var(--border);border-radius:3px;height:4px;margin-bottom:6px;overflow:hidden">
            <div style="height:100%;border-radius:3px;background:${barColor};width:${pct}%"></div>
          </div>
          <div class="months-grid">${dots}</div>
        </div>`;
    }
    wrap.innerHTML = html;
  }

  // Watch account-content for changes
  const _accWrap = document.getElementById('account-content');
  if (_accWrap) {
    const _accObserver = new MutationObserver(() => {
      if (_accWrap.innerHTML?.length > 100) {
        setTimeout(_injectFullYearStatus, 100);
      }
    });
    _accObserver.observe(_accWrap, { childList: true, subtree: false });
  }

  // ── 3. AT-RISK BADGE ON MEMBER ROWS ─────────────────────────
  function _addAtRiskBadges() {
    if (!STATE.isAdmin) return;
    document.querySelectorAll('.tracker-row').forEach(row => {
      const nameEl = row.querySelector('.tracker-name');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      const member = (window.__lg?.STATE?.allMembers || []).find(m =>
        (m.name || m.displayName || '').trim() === name
      );
      if (!member) return;
      const behind = _monthsBehind(member);
      if (behind >= MONTHS_BEFORE_EXPEL && !row.querySelector('.at-risk-badge')) {
        const badge = document.createElement('span');
        badge.className = 'at-risk-badge';
        badge.style.cssText = 'font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;background:#991b1b;color:#fff;margin-left:6px;vertical-align:middle';
        badge.textContent = 'AT RISK';
        nameEl.appendChild(badge);
      }
    });
  }

  // ── 4. ADMIN COMPLIANCE SWEEP ────────────────────────────────
  window.runComplianceSweep = async function() {
    if (!STATE.isAdmin) return;
    const btn    = document.getElementById('compliance-sweep-btn');
    const output = document.getElementById('compliance-sweep-output');
    if (btn)    { btn.disabled = true; btn.textContent = 'Scanning…'; }
    if (output) output.innerHTML = '<div style="color:var(--muted);font-size:12px">Scanning all members…</div>';

    try {
      const snap = await getDocs(collection(db, 'members'));
      const members = [];
      snap.forEach(d => members.push({ id: d.id, ...d.data() }));

      const active = members.filter(m => ['active','diaspora','partial'].includes(m.status || 'active'));
      const results = [];
      let noticesSent = 0;

      for (const m of active) {
        const behind = _monthsBehind(m);
        if (behind === 0) continue;

        let action = '';
        let severity = 'amber';

        if (behind >= MONTHS_BEFORE_EXPEL) {
          severity = 'red';
          action = `⚠️ ${behind} months behind — SUSPENSION RISK`;
        } else if (behind >= MONTHS_BEFORE_NOTICE) {
          severity = 'orange';
          action = `${behind} months behind — notice required`;
        } else {
          action = `${behind} month${behind > 1 ? 's' : ''} behind`;
        }

        const owed  = _totalOwed(m);
        const rates = _fullMonthlyRate(m);
        results.push({ member: m, behind, action, severity, owedTotal: owed.total, monthlyRate: rates.total });

        if (behind >= MONTHS_BEFORE_NOTICE) {
          const msg = behind >= MONTHS_BEFORE_EXPEL
            ? `Dear ${m.name || 'Member'}, your subscription is ${behind} months in arrears (UGX ${owed.total.toLocaleString()} total outstanding including welfare, GLA, and unit trust). Per club rules, members 4+ months behind risk suspension. Please settle urgently or contact admin.`
            : `Dear ${m.name || 'Member'}, your subscription is ${behind} months in arrears (UGX ${owed.total.toLocaleString()} total outstanding). Please settle promptly to avoid a fine and maintain your membership in good standing.`;

          const yr = new Date().getFullYear();
          const mo = new Date().getMonth();
          const noticeKey = `notice-${m.id}-${yr}-${mo}`;
          const existing = await getDoc(doc(db, 'complianceNotices', noticeKey)).catch(() => null);
          if (!existing?.exists()) {
            await setDoc(doc(db, 'complianceNotices', noticeKey), {
              memberId: m.id, memberName: m.name || m.id,
              monthsBehind: behind, sentAt: serverTimestamp(), message: msg
            });
            await addDoc(collection(db, 'messages'), {
              fromUid: 'admin-system',
              fromName: "Let's Grow Club",
              toUid: m.uid || m.id,
              toName: m.name || m.id,
              type: 'compliance_notice',
              body: msg, read: false,
              createdAt: serverTimestamp()
            });
            noticesSent++;
          }
        }
      }

      if (!output) { toast(`Sweep done — ${noticesSent} notices sent`, 'success'); return; }

      if (!results.length) {
        output.innerHTML = `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;font-size:12px;color:#166534">✅ All active members are up to date. No action needed.</div>`;
      } else {
        const colMap = { red: '#991b1b', orange: '#b45309', amber: '#d97706' };
        output.innerHTML = `
          <div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--ink)">${results.length} members behind · ${noticesSent} notices sent</div>
          ${results.sort((a, b) => b.behind - a.behind).map(r => `
            <div style="padding:8px 10px;border-radius:8px;background:${r.severity==='red'?'#fef2f2':r.severity==='orange'?'#fff7ed':'#fffbeb'};margin-bottom:6px;border:1px solid ${r.severity==='red'?'#fca5a5':r.severity==='orange'?'#fdba74':'#fde68a'}">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-size:12px;font-weight:600;color:var(--ink)">${r.member.name || r.member.id}</div>
                <div style="text-align:right;font-size:11px;color:${colMap[r.severity]||'#92400e'};font-weight:700">${r.behind}mo behind</div>
              </div>
              <div style="font-size:10px;color:${colMap[r.severity]||'#92400e'};margin-top:2px">${r.action}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px">Total owed: UGX ${r.owedTotal.toLocaleString()} · Monthly rate: UGX ${r.monthlyRate.toLocaleString()}</div>
            </div>`).join('')}
          ${noticesSent > 0 ? `<div style="font-size:11px;color:var(--muted);margin-top:8px">📬 ${noticesSent} in-app notice${noticesSent > 1 ? 's' : ''} sent to members' inboxes</div>` : ''}`;
      }
    } catch (e) {
      if (output) output.innerHTML = `<div style="color:#991b1b;font-size:12px">Error: ${e.message}</div>`;
      log('ComplianceSweep: ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🔍 Run Compliance Check'; }
    }
  };

  // ── 5. INJECT COMPLIANCE PANEL INTO ADMIN GENERAL TAB ───────
  function _injectCompliancePanel() {
    if (!STATE.isAdmin) return;
    if (document.getElementById('compliance-panel')) return;
    const adminTab = document.getElementById('admin-tab-general');
    if (!adminTab) return;

    const panel = document.createElement('div');
    panel.id = 'compliance-panel';
    panel.className = 'card';
    panel.style.marginTop = '12px';
    panel.innerHTML = `
      <div class="card-title">⚖️ Compliance Check</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">Scan all members for payment arrears. Members 3+ months behind receive an automatic in-app notice.</div>
      <div style="background:#f8f4ec;border-radius:8px;padding:10px;margin-bottom:10px;font-size:11px">
        <div style="font-weight:700;color:var(--ink);margin-bottom:6px">Monthly Obligations (per member type)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
          <div style="color:var(--muted)">Single member (40K sub):</div><div style="font-weight:600;color:var(--ink)">UGX 73,000/mo</div>
          <div style="color:var(--muted)">Joint account (80K sub):</div><div style="font-weight:600;color:var(--ink)">UGX 146,000/mo</div>
          <div style="color:var(--muted)">Diaspora (+ 20K fee):</div><div style="font-weight:600;color:var(--ink)">UGX 93,000/mo</div>
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);color:var(--muted)">3 months arrears → notice · 4th month → suspension risk (60% refund on exit)</div>
      </div>
      <button id="compliance-sweep-btn" class="btn-primary" style="width:100%;padding:10px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer" onclick="runComplianceSweep()">
        🔍 Run Compliance Check
      </button>
      <div id="compliance-sweep-output" style="margin-top:10px"></div>`;

    adminTab.appendChild(panel);
  }

  // ── 6. FULL-YEAR STATUS CARD PLACEHOLDER ────────────────────
  function _addFullYearCardPlaceholder() {
    if (!STATE.member) return;
    const accountContent = document.getElementById('account-content');
    if (!accountContent || document.getElementById('full-year-status-card')) return;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-title">Subscription Status — All Years</div>
      <div id="full-year-status-card" style="display:none"></div>`;

    const cards  = accountContent.querySelectorAll('.card');
    const anchor = cards[2] || cards[cards.length - 1];
    if (anchor && anchor.nextSibling) anchor.parentNode.insertBefore(card, anchor.nextSibling);
    else accountContent.appendChild(card);

    _injectFullYearStatus();
  }

  // ── WIRE UP ──────────────────────────────────────────────────
  // Single showSection patch — avoids double-wrapping
  const _origShow = window.showSection;
  window.showSection = function(name, btn) {
    _origShow(name, btn);
    if (name === 'dashboard') setTimeout(_injectComplianceBanner, 200);
    if (name === 'account')   setTimeout(_addFullYearCardPlaceholder, 600);
    if (name === 'admin') {
      setTimeout(_injectCompliancePanel, 100);
      setTimeout(_injectComplianceBanner, 200); // admin's own banner
    }
  };

  // Also patch showAdminTab
  const _origAdminTab = window.showAdminTab;
  if (typeof _origAdminTab === 'function') {
    window.showAdminTab = function(tab, btn) {
      _origAdminTab(tab, btn);
      if (tab === 'general' && STATE.isAdmin) setTimeout(_injectCompliancePanel, 100);
    };
  } else {
    const _tabWatcher = setInterval(() => {
      if (window.showAdminTab) {
        clearInterval(_tabWatcher);
        const orig = window.showAdminTab;
        window.showAdminTab = function(tab, btn) {
          orig(tab, btn);
          if (tab === 'general' && STATE.isAdmin) setTimeout(_injectCompliancePanel, 100);
        };
      }
    }, 300);
  }

  // Initial banner on load
  setTimeout(_injectComplianceBanner, 800);

  // If already on dashboard
  if (document.getElementById('sec-dashboard')?.classList.contains('active')) {
    setTimeout(_injectComplianceBanner, 500);
  }

  console.log('✓ compliance.js loaded (v2.1 — full fee tracking)');
});
