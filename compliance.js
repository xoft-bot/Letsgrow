// ── compliance.js — Let's Grow Investment Club ────────────────
// Standalone compliance, warnings, and payment status module.
// Zero changes to app.js needed.
//
// What this does:
//   1. Dashboard banner — warns member immediately on login if behind
//   2. Quarterly fine countdown — days until Q-end fine triggers
//   3. At-risk detection — flags members 3+ months behind
//   4. Admin compliance sweep — scan all members, send notices
//   5. Member status badges on tracker — red/yellow/green full year
//   6. Suspension threshold alerts
//
// HOW IT LOADS:
//   Add to index.html (after app.js script tag):
//   <script type="module" src="compliance.js"></script>
//
// ─────────────────────────────────────────────────────────────

// ── Wait for app.js to set window.__lg ───────────────────────
function _ready(fn) {
  if (window.__lg?.STATE) { fn(); }
  else { setTimeout(() => _ready(fn), 150); }
}

_ready(function() {
  const { db, STATE, fmt, fmtFull, toast, MONTHS,
          serverTimestamp, log, getDoc, setDoc, addDoc,
          collection, getDocs, doc, query, where, limit } = window.__lg;

  // ── CONSTANTS ───────────────────────────────────────────────
  const FINE_ABSENT_MEETING   = 15000;   // UGX — absent from meeting in a quarter
  const FINE_LATE_MEETING_1   = 2000;    // < 15 min late
  const FINE_LATE_MEETING_2   = 3000;    // 15–30 min late
  const FINE_LATE_MEETING_3   = 5000;    // > 30 min late
  const FINE_MISCONDUCT_LOW   = 50000;
  const FINE_MISCONDUCT_HIGH  = 100000;
  const MONTHS_BEFORE_NOTICE  = 3;       // 3 months no payment → notice
  const MONTHS_BEFORE_EXPEL   = 4;       // 4th month after notice → expulsion risk
  const EXIT_REFUND_PCT       = 0.60;    // 60% of subscriptions on exit

  // Quarter end dates (month index 0-based)
  function _quarterEnd() {
    const now = new Date();
    const m   = now.getMonth();
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

  function _monthsBehind(member) {
    const now  = new Date();
    const yr   = now.getFullYear();
    const mo   = now.getMonth();
    const rate = member.monthlySubscription || member.monthlyRate || 40000;
    const paid = (member.subscriptionByYear || {})[String(yr)] || 0;
    const due  = rate * (mo + 1);
    return paid >= due ? 0 : Math.ceil((due - paid) / rate);
  }

  // ── 1. DASHBOARD COMPLIANCE BANNER ──────────────────────────
  // Injects a banner at the top of the dashboard section.
  // Called once on login; re-evaluates every time user opens dashboard.
  async function _injectComplianceBanner() {
    const member = STATE.member;
    if (!member || STATE.isAdmin) return;

    const behind   = _monthsBehind(member);
    const qEnd     = _quarterEnd();
    const daysLeft = _daysUntil(qEnd);
    const rate     = member.monthlySubscription || member.monthlyRate || 40000;
    const yr       = new Date().getFullYear();
    const mo       = new Date().getMonth();
    const paid     = (member.subscriptionByYear || {})[String(yr)] || 0;
    const owed     = Math.max(0, rate * (mo + 1) - paid);

    // Get unpaid fines
    let finesTotal = 0;
    try {
      const fs = await getDocs(query(collection(db,'fines'),
        where('memberId','==',member.id), where('status','==','unpaid')));
      fs.forEach(d => finesTotal += Number(d.data().amount||0));
    } catch(e) {}

    const totalDue = owed + finesTotal;
    const el = document.getElementById('compliance-banner');
    const container = document.getElementById('sec-dashboard');
    if (!container) return;

    // Create banner element if it doesn't exist
    let banner = el;
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'compliance-banner';
      banner.style.cssText = 'margin:0 0 12px 0';
      // Insert before first card
      const firstCard = container.querySelector('.card,.hero-card,[class*="hero"]');
      if (firstCard) container.insertBefore(banner, firstCard);
      else container.prepend(banner);
    }

    if (behind === 0 && finesTotal === 0) {
      // ── Green: up to date ────────────────────────────────────
      banner.innerHTML = `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px">
          <span style="font-size:22px">✅</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#166534">All contributions up to date</div>
            <div style="font-size:11px;color:#15803d;margin-top:2px">Next quarter ends in <strong>${daysLeft} days</strong> (${qEnd.toLocaleDateString('en-GB',{day:'numeric',month:'short'})})</div>
          </div>
        </div>`;
    } else {
      // ── Red/Amber: behind ────────────────────────────────────
      const sev  = behind >= MONTHS_BEFORE_EXPEL ? 3 : behind >= MONTHS_BEFORE_NOTICE ? 2 : 1;
      const cols = [
        ['#fffbeb','#fde68a','#92400e','⚠️'],   // 1 month
        ['#fef2f2','#fca5a5','#991b1b','🚨'],   // 2-3 months
        ['#fef2f2','#ef4444','#7f1d1d','🔴'],   // 4+ months
      ][sev-1];
      const [bg,border,clr,icon] = cols;

      const suspensionWarning = sev === 3 ? `
        <div style="background:#fee2e2;border-radius:7px;padding:8px 10px;margin-top:8px;font-size:11px;color:#7f1d1d;font-weight:700">
          ⚠️ Account at risk of suspension. Member may forfeit 60% of subscriptions (UGX ${fmtFull(Math.round((member.totalSubscriptionUpTo2025||0)*EXIT_REFUND_PCT))}) on exit. Contact admin immediately.
        </div>` : '';

      const fineWarning = daysLeft <= 30 ? `
        <div style="font-size:10px;color:${clr};opacity:.85;margin-top:3px">
          ⚡ Quarter ends in <strong>${daysLeft} days</strong> — late payment attracts UGX ${FINE_ABSENT_MEETING.toLocaleString()} fine
        </div>` : '';

      banner.innerHTML = `
        <div style="background:${bg};border:1.5px solid ${border};border-radius:12px;padding:13px 14px">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <span style="font-size:22px;flex-shrink:0">${icon}</span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:${clr}">${behind} month${behind!==1?'s':''} behind — UGX ${owed.toLocaleString()} subscription${finesTotal>0?` + UGX ${finesTotal.toLocaleString()} fines`:''} outstanding</div>
              <div style="font-size:11px;color:${clr};opacity:.85;margin-top:2px">Total due: <strong>${fmtFull(totalDue)}</strong></div>
              ${fineWarning}
            </div>
          </div>
          <div style="margin-top:8px;background:rgba(0,0,0,.08);border-radius:4px;height:4px;overflow:hidden">
            <div style="height:100%;border-radius:4px;background:${clr};width:${Math.min(100,Math.round(paid/(rate*(new Date().getMonth()+1))*100))}%"></div>
          </div>
          ${suspensionWarning}
        </div>`;
    }
  }

  // Re-run banner when dashboard section becomes visible
  const _origShow = window.showSection;
  window.showSection = function(name, btn) {
    _origShow(name, btn);
    if (name === 'dashboard') setTimeout(_injectComplianceBanner, 200);
  };

  // ── 2. MEMBER ACCOUNT: FULL-YEAR STATUS CARD ────────────────
  // Shows full 12-month grid with correct colours for ALL months
  // including past years (summary row per year)
  async function _injectFullYearStatus() {
    if (!STATE.member || STATE.isAdmin) return;
    const m    = STATE.member;
    const yr   = new Date().getFullYear();
    const mo   = new Date().getMonth();
    const rate = m.monthlySubscription || m.monthlyRate || 40000;

    const wrap = document.getElementById('full-year-status-card');
    if (!wrap) return;

    const years = Object.keys(m.subscriptionByYear||{}).sort().reverse();
    if (!years.length) { wrap.style.display='none'; return; }
    wrap.style.display = 'block';

    let html = '';
    for (const year of years.slice(0,3)) {
      const paid    = (m.subscriptionByYear||{})[year] || 0;
      const isCurrentYr = Number(year) === yr;
      const lastMo  = isCurrentYr ? mo : 11;
      const moLabels = ['J','F','M','A','M','J','J','A','S','O','N','D'];
      let dots = '';
      for (let i = 0; i < 12; i++) {
        const eom = rate * (i+1), bom = rate * i;
        let cls, lbl;
        if (paid >= eom)                    { cls='mo-paid';    lbl='✓'; }
        else if (paid > bom)                { cls='mo-partial'; lbl='~'; }
        else if (!isCurrentYr || i <= lastMo){ cls='mo-due';    lbl='!'; }
        else                                { cls='mo-future';  lbl=moLabels[i]; }
        dots += `<div class="mo ${cls}" title="${MONTHS[i]} ${year}">${lbl}</div>`;
      }
      const totalRate = rate * 12;
      const pct = Math.min(100, Math.round(paid/totalRate*100));
      const barColor = pct>=100?'#166534':pct>=50?'#d97706':'#991b1b';
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

  // Hook into account page load
  const _origLoadAccount = window.loadMyAccount;
  if (typeof _origLoadAccount === 'function') {
    // loadMyAccount is defined in app.js but called via window
    // We patch it after the fact
  }

  // Watch for the account-content element being populated
  const _accObserver = new MutationObserver(() => {
    if (document.getElementById('account-content')?.innerHTML?.length > 100) {
      setTimeout(_injectFullYearStatus, 100);
    }
  });
  const _accWrap = document.getElementById('account-content');
  if (_accWrap) _accObserver.observe(_accWrap, { childList: true, subtree: false });

  // ── 3. AT-RISK BADGE ON MEMBER ROWS (admin tracker) ─────────
  function _addAtRiskBadges() {
    if (!STATE.isAdmin) return;
    // Called after tracker renders
    document.querySelectorAll('.tracker-row').forEach(row => {
      const nameEl = row.querySelector('.tracker-name');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      const member = (window.__lg?.STATE?.allMembers||[]).find(m =>
        (m.name||m.displayName||'').trim() === name
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
      const snap = await getDocs(collection(db,'members'));
      const members = [];
      snap.forEach(d => members.push({ id: d.id, ...d.data() }));

      const active = members.filter(m => ['active','diaspora','partial'].includes(m.status||'active'));
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
          action = `${behind} month${behind>1?'s':''} behind`;
        }

        results.push({ member: m, behind, action, severity });

        // Send in-app notice for members at notice threshold
        if (behind >= MONTHS_BEFORE_NOTICE) {
          const rate  = m.monthlySubscription || m.monthlyRate || 40000;
          const yr    = new Date().getFullYear();
          const mo    = new Date().getMonth();
          const paid  = (m.subscriptionByYear||{})[String(yr)] || 0;
          const owed  = Math.max(0, rate*(mo+1) - paid);
          const msg   = behind >= MONTHS_BEFORE_EXPEL
            ? `Dear ${m.name||'Member'}, your subscription is ${behind} months in arrears (UGX ${owed.toLocaleString()} outstanding). Per club rules, members 4+ months behind risk suspension and may forfeit savings. Please settle urgently or contact admin.`
            : `Dear ${m.name||'Member'}, your subscription is ${behind} months in arrears (UGX ${owed.toLocaleString()} outstanding). Please settle promptly to avoid a fine and maintain your membership in good standing.`;

          // Only send if we haven't sent one this month
          const noticeKey = `notice-${m.id}-${yr}-${mo}`;
          const existing = await getDoc(doc(db,'complianceNotices',noticeKey)).catch(()=>null);
          if (!existing?.exists()) {
            await setDoc(doc(db,'complianceNotices',noticeKey), {
              memberId: m.id, memberName: m.name||m.id,
              monthsBehind: behind, sentAt: serverTimestamp(),
              message: msg
            });
            // Write to messages collection so it appears in their inbox
            await addDoc(collection(db,'messages'), {
              fromUid: 'admin-system',
              fromName: "Let's Grow Club",
              toUid: m.uid || m.id,
              toName: m.name || m.id,
              type: 'compliance_notice',
              body: msg,
              read: false,
              createdAt: serverTimestamp()
            });
            noticesSent++;
          }
        }
      }

      // Render results
      if (!output) { toast(`Sweep done — ${noticesSent} notices sent`, 'success'); return; }

      if (!results.length) {
        output.innerHTML = `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;font-size:12px;color:#166534">✅ All active members are up to date. No action needed.</div>`;
      } else {
        const colMap = { red:'#991b1b', orange:'#b45309', amber:'#d97706' };
        output.innerHTML = `
          <div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--ink)">${results.length} members behind · ${noticesSent} notices sent</div>
          ${results.sort((a,b)=>b.behind-a.behind).map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;background:${r.severity==='red'?'#fef2f2':r.severity==='orange'?'#fff7ed':'#fffbeb'};margin-bottom:6px;border:1px solid ${r.severity==='red'?'#fca5a5':r.severity==='orange'?'#fdba74':'#fde68a'}">
              <div>
                <div style="font-size:12px;font-weight:600;color:var(--ink)">${r.member.name||r.member.id}</div>
                <div style="font-size:10px;color:${colMap[r.severity]||'#92400e'}">${r.action}</div>
              </div>
              <div style="text-align:right;font-size:11px;color:${colMap[r.severity]||'#92400e'};font-weight:700">${r.behind}mo</div>
            </div>`).join('')}
          ${noticesSent > 0 ? `<div style="font-size:11px;color:var(--muted);margin-top:8px">📬 ${noticesSent} in-app notice${noticesSent>1?'s':''} sent to members' inboxes</div>` : ''}`;
      }
    } catch(e) {
      if (output) output.innerHTML = `<div style="color:#991b1b;font-size:12px">Error: ${e.message}</div>`;
      log('ComplianceSweep: '+e.message);
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
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">Scan all members for payment arrears. Members 3+ months behind receive an automatic in-app notice. 4+ months = suspension risk.</div>
      <div style="background:#f8f4ec;border-radius:8px;padding:10px;margin-bottom:10px;font-size:11px">
        <div style="font-weight:700;color:var(--ink);margin-bottom:4px">Constitution Rules:</div>
        <div style="color:var(--muted)">3 months arrears → formal notice required</div>
        <div style="color:var(--muted)">4th month → suspension risk, 60% refund on exit</div>
        <div style="color:var(--muted)">Absent from meeting (quarter) → UGX 15,000 fine</div>
        <div style="color:var(--muted)">Late (&lt;15min) → UGX 2,000 · (15-30min) → UGX 3,000 · (&gt;30min) → UGX 5,000</div>
      </div>
      <button id="compliance-sweep-btn" class="btn-primary" style="width:100%;padding:10px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer" onclick="runComplianceSweep()">
        🔍 Run Compliance Check
      </button>
      <div id="compliance-sweep-output" style="margin-top:10px"></div>`;

    adminTab.appendChild(panel);
  }

  // ── 6. FULL-YEAR STATUS CARD PLACEHOLDER ────────────────────
  // Creates the container div in the account section after render
  function _addFullYearCardPlaceholder() {
    if (STATE.isAdmin) return;
    const accountContent = document.getElementById('account-content');
    if (!accountContent || document.getElementById('full-year-status-card')) return;

    const existing = accountContent.querySelector('.card');
    if (!existing) return;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-title">Subscription History — All Years</div>
      <div id="full-year-status-card" style="display:none"></div>`;

    // Insert after the tracker card (3rd card)
    const cards = accountContent.querySelectorAll('.card');
    const anchor = cards[2] || cards[cards.length-1];
    if (anchor && anchor.nextSibling) anchor.parentNode.insertBefore(card, anchor.nextSibling);
    else accountContent.appendChild(card);

    _injectFullYearStatus();
  }

  // ── WIRE UP ──────────────────────────────────────────────────
  // Run banner on initial load
  setTimeout(_injectComplianceBanner, 800);

  // Re-run compliance panel injection when admin tab is shown
  const _origAdminTab = window.showAdminTab;
  if (typeof _origAdminTab === 'function') {
    window.showAdminTab = function(tab, btn) {
      _origAdminTab(tab, btn);
      if (tab === 'general' && STATE.isAdmin) setTimeout(_injectCompliancePanel, 100);
    };
  } else {
    // showAdminTab not yet loaded — watch for it
    const _tabWatcher = setInterval(() => {
      if (window.showAdminTab && window.showAdminTab !== window.showAdminTab) return;
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

  // Wire account page: add full-year card when account section opens
  const _origShowSection = window.showSection;
  window.showSection = function(name, btn) {
    _origShowSection(name, btn);
    if (name === 'dashboard') setTimeout(_injectComplianceBanner, 300);
    if (name === 'account')   setTimeout(_addFullYearCardPlaceholder, 600);
    if (name === 'admin')     setTimeout(_injectCompliancePanel, 300);
  };

  // Initial run if already on dashboard
  if (document.getElementById('sec-dashboard')?.classList.contains('active')) {
    setTimeout(_injectComplianceBanner, 500);
  }

  console.log('✓ compliance.js loaded');
});
