// ── sidebar.js — Let's Grow Investment Club ───────────────────
// Replaces the bottom nav with a slide-in sidebar drawer.
// Works for both members and admin — shows relevant sections only.
// Zero changes to app.js needed.
//
// HOW IT LOADS:
//   Add to index.html (after app.js):
//   <script type="module" src="sidebar.js"></script>
//   <link rel="stylesheet" href="sidebar.css">
//
// ─────────────────────────────────────────────────────────────

function _ready(fn) {
  if (window.__lg?.STATE) fn();
  else setTimeout(() => _ready(fn), 150);
}

_ready(function() {
  const { STATE } = window.__lg;

  // ── INJECT SIDEBAR HTML + OVERLAY ───────────────────────────
  const sidebarHTML = `
    <!-- Overlay -->
    <div id="sb-overlay" onclick="closeSidebar()"
      style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:800;transition:opacity .25s"></div>

    <!-- Drawer -->
    <nav id="sb-drawer" aria-label="Site navigation"
      style="position:fixed;top:0;left:-280px;width:272px;height:100%;background:var(--ink,#1a2332);
             display:flex;flex-direction:column;z-index:900;transition:left .3s cubic-bezier(.4,0,.2,1);
             box-shadow:4px 0 24px rgba(0,0,0,.35);overflow-y:auto">

      <!-- Header -->
      <div style="padding:20px 16px 12px;border-bottom:1px solid rgba(255,255,255,.1)">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:16px;font-weight:800;color:#c9a84c;letter-spacing:.5px">Let's Grow</div>
            <div style="font-size:10px;color:rgba(255,255,255,.5);letter-spacing:2px;text-transform:uppercase;margin-top:1px">Investment Club</div>
          </div>
          <button onclick="closeSidebar()"
            style="background:rgba(255,255,255,.08);border:none;color:rgba(255,255,255,.7);
                   width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px;
                   display:flex;align-items:center;justify-content:center">✕</button>
        </div>
        <!-- User identity pill -->
        <div id="sb-user" style="margin-top:12px;background:rgba(255,255,255,.06);border-radius:10px;padding:8px 10px;display:flex;align-items:center;gap:9px">
          <div id="sb-avatar" style="width:34px;height:34px;border-radius:50%;background:#c9a84c;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#1a2332;flex-shrink:0">?</div>
          <div style="min-width:0">
            <div id="sb-name" style="font-size:12px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">—</div>
            <div id="sb-role" style="font-size:10px;color:rgba(255,255,255,.5);margin-top:1px">Member</div>
          </div>
        </div>
      </div>

      <!-- Nav sections -->
      <div style="flex:1;padding:8px 0">
        <div id="sb-nav-member" style="padding:4px 8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.3);text-transform:uppercase;padding:10px 8px 4px">Navigation</div>
          ${_navItem('dashboard','🏠','Home')}
          ${_navItem('account','👤','My Account')}
          ${_navItem('members','👥','Members')}
          ${_navItem('investments','📈','Investments')}
          ${_navItem('notifications','📬','Inbox')}
        </div>

        <div id="sb-nav-admin" style="display:none;padding:4px 8px;border-top:1px solid rgba(255,255,255,.08);margin-top:4px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.3);text-transform:uppercase;padding:10px 8px 4px">Admin</div>
          ${_navItem('admin','⚙️','Admin Panel')}
          ${_navItem('loans','💰','Loans')}
        </div>
      </div>

      <!-- Footer actions -->
      <div style="padding:12px 16px 24px;border-top:1px solid rgba(255,255,255,.1)">
        <button onclick="doSignOut()" style="width:100%;padding:10px;background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.3px">
          Sign Out
        </button>
        <div style="text-align:center;font-size:9px;color:rgba(255,255,255,.2);margin-top:10px;letter-spacing:1px">LGIC v2.0 · Powered by Firebase</div>
      </div>
    </nav>

    <!-- Hamburger button (top-left trigger) -->
    <button id="sb-trigger" onclick="openSidebar()"
      style="position:fixed;top:12px;left:12px;z-index:750;background:var(--ink,#1a2332);border:none;
             width:40px;height:40px;border-radius:10px;cursor:pointer;display:flex;align-items:center;
             justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.3);transition:transform .15s"
      aria-label="Open menu">
      <div style="display:flex;flex-direction:column;gap:4px;padding:2px">
        <div style="width:18px;height:2px;background:#c9a84c;border-radius:2px"></div>
        <div style="width:14px;height:2px;background:#c9a84c;border-radius:2px"></div>
        <div style="width:18px;height:2px;background:#c9a84c;border-radius:2px"></div>
      </div>
    </button>`;

  // Inject sidebar into body
  const sidebarMount = document.createElement('div');
  sidebarMount.innerHTML = sidebarHTML;
  document.body.appendChild(sidebarMount);

  function _navItem(section, icon, label) {
    return `<button onclick="sbNav('${section}')"
      data-section="${section}"
      style="width:100%;display:flex;align-items:center;gap:11px;padding:10px 10px;border:none;background:none;
             color:rgba(255,255,255,.75);border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;
             text-align:left;margin-bottom:2px;transition:background .15s"
      onmouseenter="this.style.background='rgba(201,168,76,.12)'"
      onmouseleave="this.style.background=this.dataset.active?'rgba(201,168,76,.18)':'none'">
      <span style="font-size:16px;width:22px;text-align:center;flex-shrink:0">${icon}</span>
      <span>${label}</span>
    </button>`;
  }

  // ── SIDEBAR OPEN / CLOSE ─────────────────────────────────────
  window.openSidebar = function() {
    const d = document.getElementById('sb-drawer');
    const o = document.getElementById('sb-overlay');
    if (!d||!o) return;
    _refreshSidebarUser();
    d.style.left = '0';
    o.style.display = 'block';
    setTimeout(() => o.style.opacity='1', 10);
    document.body.style.overflow = 'hidden';
  };

  window.closeSidebar = function() {
    const d = document.getElementById('sb-drawer');
    const o = document.getElementById('sb-overlay');
    if (!d||!o) return;
    d.style.left = '-280px';
    o.style.opacity = '0';
    setTimeout(() => { o.style.display='none'; document.body.style.overflow=''; }, 280);
  };

  // ── NAVIGATE FROM SIDEBAR ─────────────────────────────────────
  window.sbNav = function(section) {
    closeSidebar();
    setTimeout(() => {
      // Find the corresponding nav button
      const navBtn = document.getElementById('nav-'+section) ||
                     document.querySelector(`[onclick*="showSection('${section}')"]`);
      window.showSection(section, navBtn);
    }, 300);
    _setActiveNavItem(section);
  };

  function _setActiveNavItem(section) {
    document.querySelectorAll('#sb-drawer [data-section]').forEach(btn => {
      const active = btn.dataset.section === section;
      btn.style.background = active ? 'rgba(201,168,76,.18)' : 'none';
      btn.style.color = active ? '#c9a84c' : 'rgba(255,255,255,.75)';
      btn.dataset.active = active ? '1' : '';
    });
  }

  // ── REFRESH USER INFO IN SIDEBAR ─────────────────────────────
  function _refreshSidebarUser() {
    const m    = STATE.member;
    const name = m?.name || m?.displayName || m?.primary?.name || STATE.user?.email || '—';
    const ini  = name[0]?.toUpperCase() || '?';
    const role = STATE.isAdmin ? 'Administrator' : (m?.memberType || m?.tier || 'Member');

    const avatarEl = document.getElementById('sb-avatar');
    const nameEl   = document.getElementById('sb-name');
    const roleEl   = document.getElementById('sb-role');

    if (avatarEl) avatarEl.textContent = ini;
    if (nameEl)   nameEl.textContent   = name;
    if (roleEl)   roleEl.textContent   = role.charAt(0).toUpperCase() + role.slice(1);

    // Show admin section if needed
    const adminSection = document.getElementById('sb-nav-admin');
    if (adminSection) adminSection.style.display = STATE.isAdmin ? 'block' : 'none';
  }

  // ── BADGE: UNREAD INBOX COUNT ─────────────────────────────────
  function _updateInboxBadge(count) {
    let badge = document.getElementById('sb-inbox-badge');
    const inboxBtn = document.querySelector('#sb-drawer [data-section="notifications"]');
    if (!inboxBtn) return;
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'sb-inbox-badge';
        badge.style.cssText = 'background:#ef4444;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;margin-left:auto';
        inboxBtn.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : count;
    } else if (badge) {
      badge.remove();
    }
  }

  // Watch the existing badge count element and mirror it to sidebar
  const _badgeObserver = new MutationObserver(() => {
    const badge = document.getElementById('notif-count');
    const count = badge && badge.style.display !== 'none' ? parseInt(badge.textContent||'0') : 0;
    _updateInboxBadge(count);
  });
  const badgeEl = document.getElementById('notif-count');
  if (badgeEl) _badgeObserver.observe(badgeEl, { childList:true, attributes:true, attributeFilter:['style'] });

  // ── HIDE BOTTOM NAV ───────────────────────────────────────────
  // The bottom nav still functions but sidebar is the primary UX
  // Hide it to avoid duplication
  function _hideBottomNav() {
    const bottomNav = document.querySelector('.bottom-nav, nav.nav-bar, #bottom-nav, [class*="bottom-nav"]');
    if (bottomNav) {
      bottomNav.style.display = 'none';
      // Give body back its bottom padding
      document.body.style.paddingBottom = '0';
      const app = document.getElementById('app');
      if (app) app.style.paddingBottom = '0';
    }
  }

  // ── SWIPE TO OPEN (mobile gesture) ───────────────────────────
  let _touchStartX = 0;
  document.addEventListener('touchstart', e => { _touchStartX = e.touches[0].clientX; }, { passive:true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _touchStartX;
    const drawer = document.getElementById('sb-drawer');
    if (!drawer) return;
    if (_touchStartX < 20 && dx > 60) window.openSidebar();                      // swipe right from edge
    if (drawer.style.left === '0px' && dx < -60) window.closeSidebar();           // swipe left to close
  }, { passive:true });

  // ── KEYBOARD: ESC to close ────────────────────────────────────
  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeSidebar(); });

  // ── PATCH showSection to highlight sidebar item ───────────────
  const _origShow = window.showSection;
  window.showSection = function(name, btn) {
    _origShow(name, btn);
    _setActiveNavItem(name);
  };

  // ── INIT ─────────────────────────────────────────────────────
  setTimeout(() => {
    _refreshSidebarUser();
    _hideBottomNav();
    // Highlight current section
    const active = document.querySelector('.section.active');
    if (active) _setActiveNavItem(active.id.replace('sec-',''));
    else _setActiveNavItem('dashboard');
  }, 500);

  console.log('✓ sidebar.js loaded');
});
