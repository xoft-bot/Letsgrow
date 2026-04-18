// stubs.js — Let's Grow Investment Club
// MUST load before app.js (plain <script>, not module).
// Defines safe no-op stubs for every window function called
// from HTML onclick="" attributes, so the page doesn't throw
// "not defined" errors during the brief window while modules download.
// app.js / sidebar.js will overwrite these with real implementations.
// ─────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // Queue of pending calls to replay once app is ready
  const _queue = {};

  function _stub(name, replayable) {
    if (window[name]) return; // already defined — don't overwrite
    _queue[name] = [];
    window[name] = function () {
      if (replayable) {
        _queue[name].push(Array.from(arguments));
      }
      console.info('[stubs] ' + name + ' called before app loaded' + (replayable ? ' — queued' : ''));
    };
    window[name]._isStub = true;
  }

  // ── Navigation ───────────────────────────────────────────────
  _stub('showSection',       false);
  _stub('sbNav',             false);
  _stub('openSidebar',       false);
  _stub('closeSidebar',      false);
  _stub('doSignOut',         false);

  // ── Dashboard toggles ─────────────────────────────────────────
  _stub('toggleClubRecords', false);
  _stub('toggleLoanCard',    false);
  _stub('toggleCommitteeCard', false);

  // ── Members ───────────────────────────────────────────────────
  _stub('filterMembers',     false);
  _stub('openMemberDetail',  false);

  // ── Inbox ─────────────────────────────────────────────────────
  _stub('inboxFilter',       false);
  _stub('inboxOpen',         false);

  // ── Admin tabs ────────────────────────────────────────────────
  _stub('showAdminTab',      false);
  _stub('switchLoanTab',     false);
  _stub('crTab',             false);

  // ── Loans ────────────────────────────────────────────────────
  _stub('laFilter',          false);
  _stub('approveLoan',       false);
  _stub('rejectLoan',        false);

  // ── Misc ─────────────────────────────────────────────────────
  _stub('toast',             false);
  _stub('togglePwd',         false);

  // ── Replay mechanism ─────────────────────────────────────────
  // After app.js overwrites a stub, call _replayStubs('fnName')
  // so any queued interactions are processed.
  window._replayStubs = function (name) {
    const q = _queue[name] || [];
    if (!q.length) return;
    _queue[name] = [];
    q.forEach(args => {
      try { window[name].apply(null, args); }
      catch (e) { console.warn('[stubs] replay error for ' + name, e); }
    });
  };

  console.info('[stubs.js] Safety stubs loaded ✓');
})();
