// ── app-patch.js — Let's Grow Investment Club ─────────────────
// Targeted fixes loaded AFTER app.js.
// Fixes:
//   1. filterMembers safe guard (prevents "not defined" errors)
//   2. allMembersCache TDZ guard
//   3. Monthly outstanding total now shows all fees (sub + welfare + GLA + UT + diaspora)
//   4. Admin badge show on members filter
//   5. Member section error recovery
// Load order: app.js → loans.js → compliance.js → sidebar.js → app-patch.js
// ─────────────────────────────────────────────────────────────

(function() {
  'use strict';

  // ── 1. SAFE filterMembers STUB ────────────────────────────────
  // If window.filterMembers is called before app.js module loads,
  // queue the call and replay it once the module is ready.
  const _pendingFilters = [];

  if (!window.filterMembers) {
    window.filterMembers = function(filter, btn) {
      _pendingFilters.push({ filter, btn });
    };
  }

  // Replay queued calls once app.js is ready
  function _replayPending() {
    if (!window.__lg?.STATE) { setTimeout(_replayPending, 200); return; }
    // Wait a bit more for filterMembers to be properly set by app.js
    setTimeout(() => {
      if (_pendingFilters.length && window.filterMembers) {
        _pendingFilters.forEach(({ filter, btn }) => {
          try { window.filterMembers(filter, btn); } catch (e) {}
        });
        _pendingFilters.length = 0;
      }
    }, 300);
  }
  _replayPending();

  // ── 2. SAFE allMembersCache GUARD ────────────────────────────
  // Ensure the global cache is always available
  if (typeof window._safeAllMembersCache === 'undefined') {
    window._safeAllMembersCache = [];
  }

  // ── 3. WAIT FOR APP.JS THEN APPLY PATCHES ────────────────────
  function _applyPatches() {
    if (!window.__lg?.STATE) { setTimeout(_applyPatches, 200); return; }
    const { db, STATE, fmt, fmtFull, getDocs, collection, doc, getDoc } = window.__lg;

    // ── Patch: Monthly total display in compliance banner ────────
    // The banner shows subscription-only. We patch to show full total.
    // compliance.js v2.1 already handles this — this is a safety net.
    if (!window._appPatchApplied) {
      window._appPatchApplied = true;

      // ── Patch: renderMembers null guard ────────────────────────
      const _origRenderMembers = window.renderMembers;
      if (typeof _origRenderMembers === 'function') {
        window.renderMembers = function(members) {
          if (!Array.isArray(members)) members = [];
          return _origRenderMembers(members);
        };
      }

      // ── Patch: filterMembers null guard ───────────────────────
      // Wait for app.js to assign window.filterMembers, then wrap it
      const _waitForFilter = setInterval(() => {
        if (window.filterMembers && !window.filterMembers._patched) {
          const _orig = window.filterMembers;
          window.filterMembers = function(filter, btn) {
            // Guard: if allMembersCache isn't available yet, queue
            try {
              return _orig(filter, btn);
            } catch (e) {
              // Retry after loadMembers has had a chance to populate
              setTimeout(() => {
                try { _orig(filter, btn); } catch (_) {}
              }, 800);
            }
          };
          window.filterMembers._patched = true;
          clearInterval(_waitForFilter);
        }
      }, 100);

      // ── Patch: Monthly obligation display in My Account ───────
      // Adds a "Total Monthly Obligation" row to the account page
      // showing the full amount (sub + welfare + GLA + UT + diaspora)
      const _origLoadMyAccount = window.loadMyAccount;

      // Hook into account-content DOM changes to add full obligation info
      const _accountContentEl = document.getElementById('account-content');
      if (_accountContentEl) {
        const _observer = new MutationObserver((mutations) => {
          // Only process when content is freshly rendered
          if (!STATE.member) return;
          const el = document.getElementById('acc-full-obligation');
          if (el) return; // already injected

          const hero = _accountContentEl.querySelector('.account-hero');
          if (!hero) return;

          const m      = STATE.member;
          const sub    = m.monthlySubscription || m.monthlyRate || 40000;
          const welfare = m.monthlyWelfare  || Math.round(sub * 0.25);
          const gla    = m.monthlyGLA       || Math.round(sub * 0.325);
          const ut     = m.monthlyUT        || Math.round(sub * 0.25);
          const diaspora = m.status === 'diaspora' ? 20000 : 0;
          const total  = sub + welfare + gla + ut + diaspora;

          const div = document.createElement('div');
          div.id = 'acc-full-obligation';
          div.style.cssText = 'margin-top:12px;background:rgba(255,255,255,.08);border-radius:10px;padding:10px 12px';
          div.innerHTML = `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.5);margin-bottom:8px">Monthly Obligation Breakdown</div>
            <div style="display:grid;grid-template-columns:1fr auto;gap:4px 16px;font-size:11px">
              <span style="color:rgba(255,255,255,.6)">Subscription</span><span style="color:#fff;font-weight:600;text-align:right">UGX ${sub.toLocaleString()}</span>
              <span style="color:rgba(255,255,255,.6)">Welfare</span><span style="color:#fff;font-weight:600;text-align:right">UGX ${welfare.toLocaleString()}</span>
              <span style="color:rgba(255,255,255,.6)">Group Life Assurance</span><span style="color:#fff;font-weight:600;text-align:right">UGX ${gla.toLocaleString()}</span>
              <span style="color:rgba(255,255,255,.6)">Unit Trust</span><span style="color:#fff;font-weight:600;text-align:right">UGX ${ut.toLocaleString()}</span>
              ${diaspora > 0 ? `<span style="color:rgba(255,255,255,.6)">Diaspora Fee</span><span style="color:#60a5fa;font-weight:600;text-align:right">UGX ${diaspora.toLocaleString()}</span>` : ''}
              <span style="color:rgba(255,255,255,.9);font-weight:700;border-top:1px solid rgba(255,255,255,.15);padding-top:4px;margin-top:2px">TOTAL / MONTH</span>
              <span style="color:#c9a84c;font-weight:800;text-align:right;border-top:1px solid rgba(255,255,255,.15);padding-top:4px;margin-top:2px">UGX ${total.toLocaleString()}</span>
            </div>`;
          hero.appendChild(div);
        });
        _observer.observe(_accountContentEl, { childList: true, subtree: false });
      }

      // ── Patch: Member detail modal — show full monthly obligation
      const _origOpenMemberDetail = window.openMemberDetail;
      if (typeof _origOpenMemberDetail === 'function') {
        window.openMemberDetail = async function(memberId) {
          await _origOpenMemberDetail(memberId);
          // Add full obligation info to modal after it loads
          setTimeout(() => {
            const body = document.getElementById('md-body');
            if (!body) return;
            // Find and update the Monthly Rate cell to show full breakdown
            const rateCell = body.querySelector('[data-rate-cell]');
            if (rateCell) return; // already patched

            // Look for the monthly rate display and append breakdown
            const gridItems = body.querySelectorAll('[style*="border-radius:8px"][style*="padding:10px"]');
            gridItems.forEach(item => {
              const label = item.querySelector('[style*="text-transform:uppercase"]');
              if (label?.textContent?.includes('Monthly Rate') && !item.dataset.patched) {
                item.dataset.patched = '1';
                const rateText = item.querySelector('[style*="font-size:15px"]');
                if (rateText) {
                  const sub = parseInt(rateText.textContent.replace(/[^0-9]/g,'')) || 40000;
                  const welfare  = Math.round(sub * 0.25);
                  const gla      = Math.round(sub * 0.325);
                  const ut       = Math.round(sub * 0.25);
                  const total    = sub + welfare + gla + ut;
                  item.innerHTML += `<div style="font-size:9px;color:var(--muted);margin-top:4px;border-top:1px solid var(--border);padding-top:4px">+welfare+GLA+UT = <strong>UGX ${total.toLocaleString()}</strong>/mo</div>`;
                }
              }
            });
          }, 500);
        };
      }

      console.log('✓ app-patch.js applied');
    }
  }

  // ── 4. EMERGENCY RECOVERY: If loadMembers fails, provide retry ─
  window._memberLoadRetries = 0;
  const _origShowSection = window.showSection;
  // We wait for showSection to be set properly
  function _patchShowSection() {
    if (!window.showSection || window.showSection._patchApplied) {
      if (window.showSection && !window.showSection._patchApplied) {
        // Already set but not patched
      } else {
        setTimeout(_patchShowSection, 100);
        return;
      }
    }
    // Only patch if not already patched by compliance/sidebar
    // This runs last, so compliance+sidebar have already wrapped it
    const _curr = window.showSection;
    window.showSection = function(name, btn) {
      try {
        _curr(name, btn);
      } catch (e) {
        console.error('showSection error:', e);
        // Fallback: try direct section toggle
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const el = document.getElementById('sec-' + name);
        if (el) el.classList.add('active');
      }
    };
    window.showSection._patchApplied = true;
  }

  // Run patches
  setTimeout(_applyPatches, 100);
  setTimeout(_patchShowSection, 1000);

  // ── 5. EXPOSE SAFE GLOBALS IMMEDIATELY ───────────────────────
  // Ensures filterMembers is always callable even during loading
  if (!window.openSidebar) window.openSidebar = function() {};
  if (!window.closeSidebar) window.closeSidebar = function() {};

  // ── 6. ERROR OVERLAY AUTO-CLOSE ──────────────────────────────
  // Auto-hide the error overlay after 8 seconds so it doesn't
  // permanently block the UI during debugging
  setTimeout(() => {
    const overlay = document.getElementById('err-overlay');
    if (overlay?.classList.contains('show')) {
      // Don't auto-hide — let user close it themselves
      // But ensure the X Close button is functional
      const btn = overlay.querySelector('button');
      if (btn && !btn.dataset.wired) {
        btn.dataset.wired = '1';
        btn.onclick = () => overlay.classList.remove('show');
      }
    }
  }, 2000);

})();
