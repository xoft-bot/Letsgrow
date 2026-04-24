// ── sidebar.js — Let's Grow Investment Club ───────────────────
// Slide-in sidebar drawer. Bottom nav remains visible.
// New sections: Let's Grow Juniors, Committees, Documents.
//
// HOW IT LOADS:
//   <script type="module" src="sidebar.js"></script>
//   <link rel="stylesheet" href="sidebar.css">
// ─────────────────────────────────────────────────────────────

function _ready(fn) {
  if (window.__lg?.STATE) fn();
  else setTimeout(() => _ready(fn), 150);
}

_ready(function() {
  const { STATE, db, getDocs, collection, addDoc, setDoc, doc, serverTimestamp, toast } = window.__lg;

  // ── NAV ITEM BUILDER ─────────────────────────────────────────
  function _navItem(section, icon, label, onclick) {
    const action = onclick || `sbNav('${section}')`;
    return `<button onclick="${action}"
      data-section="${section}"
      style="width:100%;display:flex;align-items:center;gap:11px;padding:10px 10px;border:none;background:none;
             color:rgba(255,255,255,.75);border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;
             text-align:left;margin-bottom:2px;transition:background .15s"
      onmouseenter="this.style.background='rgba(201,168,76,.12)'"
      onmouseleave="this.style.background=this.dataset.active?'rgba(201,168,76,.18)':'none'">
      <span style="font-size:16px;width:22px;text-align:center;flex-shrink:0">${icon}</span>
      <span style="flex:1">${label}</span>
    </button>`;
  }

  // ── INJECT SIDEBAR HTML + OVERLAY ───────────────────────────
  const sidebarHTML = `
    <!-- Overlay -->
    <div id="sb-overlay" onclick="closeSidebar()"
      style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:800;transition:opacity .25s"></div>

    <!-- Drawer -->
    <nav id="sb-drawer" aria-label="Site navigation"
      style="position:fixed;top:0;left:-290px;width:280px;height:100%;background:var(--ink,#1a2332);
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
      <div style="flex:1;padding:8px 0;overflow-y:auto">

        <!-- Main nav -->
        <div style="padding:4px 8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.3);text-transform:uppercase;padding:10px 8px 4px">Main</div>
          ${_navItem('dashboard','🏠','Home')}
          ${_navItem('account','👤','My Account')}
          ${_navItem('members','👥','Members')}
          ${_navItem('investments','📈','Investments')}
          ${_navItem('notifications','📬','Inbox')}
        </div>

        <!-- Club extras -->
        <div style="padding:4px 8px;border-top:1px solid rgba(255,255,255,.08);margin-top:4px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.3);text-transform:uppercase;padding:10px 8px 4px">Club</div>
          ${_navItem('juniors','👶',"Let's Grow Juniors")}
          ${_navItem('committees','🏛️','Committees')}
          ${_navItem('documents','📁','Documents')}
        </div>

        <!-- Admin -->
        <div id="sb-nav-admin" style="display:none;padding:4px 8px;border-top:1px solid rgba(255,255,255,.08);margin-top:4px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.3);text-transform:uppercase;padding:10px 8px 4px">Admin</div>
          ${_navItem('admin','⚙️','Admin Panel')}
          ${_navItem('loans','💰','Loans')}
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:12px 16px 24px;border-top:1px solid rgba(255,255,255,.1)">
        <button onclick="doSignOut()" style="width:100%;padding:10px;background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.3px">
          Sign Out
        </button>
        <div style="text-align:center;font-size:9px;color:rgba(255,255,255,.2);margin-top:10px;letter-spacing:1px">LGIC v2.1 · Powered by Firebase</div>
      </div>
    </nav>

    <!-- Hamburger trigger -->
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
    </button>

    <!-- ── EXTRA SECTIONS ───────────────────────────────────── -->

    <!-- JUNIORS SECTION -->
    <div id="sec-juniors" class="section"
      style="display:none;padding:60px 16px 100px;max-width:500px;margin:0 auto">
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;color:var(--ink)">Let's Grow Juniors</h2>
      <p style="font-size:12px;color:var(--muted);margin:0 0 16px">Junior members portal — children of club members</p>
      <div id="sb-juniors-list">
        <div class="empty"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>

    <!-- COMMITTEES SECTION -->
    <div id="sec-committees" class="section"
      style="display:none;padding:60px 16px 100px;max-width:500px;margin:0 auto">
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;color:var(--ink)">Committees</h2>
      <p style="font-size:12px;color:var(--muted);margin:0 0 16px">Executive Committee & Subcommittees</p>
      <div id="sb-committees-list">
        <div class="empty"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>

    <!-- DOCUMENTS SECTION -->
    <div id="sec-documents" class="section"
      style="display:none;padding:60px 16px 100px;max-width:500px;margin:0 auto">
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;color:var(--ink)">Documents</h2>
      <p style="font-size:12px;color:var(--muted);margin:0 0 16px">Club constitution, minutes, AGM reports & more</p>
      <div id="sb-docs-upload-wrap" style="display:none;margin-bottom:16px">
        <div class="card">
          <div class="card-title">Upload Document</div>
          <div class="form-group"><label>Document Title</label><input id="doc-title" type="text" placeholder="e.g. AGM Minutes 2025"></div>
          <div class="form-group"><label>Category</label>
            <select id="doc-category">
              <option value="minutes">Meeting Minutes</option>
              <option value="agm">AGM Reports</option>
              <option value="constitution">Constitution</option>
              <option value="financial">Financial Reports</option>
              <option value="investment">Investment Reports</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group"><label>Year</label><input id="doc-year" type="number" value="${new Date().getFullYear()}" min="2020" max="2030"></div>
          <div class="form-group"><label>File</label><input id="doc-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" style="padding:6px 0"></div>
          <div class="form-group"><label>Description (optional)</label><textarea id="doc-desc" rows="2" placeholder="Brief description of the document"></textarea></div>
          <button class="btn-primary btn-gold" onclick="sbSaveDocument()">Save Document</button>
          <div id="doc-save-msg" style="font-size:11px;margin-top:8px;min-height:16px"></div>
        </div>
      </div>
      <div id="sb-docs-list">
        <div class="empty"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>`;

  // Inject sidebar and extra section HTML
  const mount = document.createElement('div');
  mount.innerHTML = sidebarHTML;
  document.body.appendChild(mount);

  // ── SIDEBAR OPEN / CLOSE ─────────────────────────────────────
  window.openSidebar = function() {
    const d = document.getElementById('sb-drawer');
    const o = document.getElementById('sb-overlay');
    if (!d || !o) return;
    _refreshSidebarUser();
    d.style.left = '0';
    o.style.display = 'block';
    setTimeout(() => o.style.opacity = '1', 10);
    document.body.style.overflow = 'hidden';
  };

  window.closeSidebar = function() {
    const d = document.getElementById('sb-drawer');
    const o = document.getElementById('sb-overlay');
    if (!d || !o) return;
    d.style.left = '-290px';
    o.style.opacity = '0';
    setTimeout(() => { o.style.display = 'none'; document.body.style.overflow = ''; }, 280);
  };

  // ── NAVIGATE FROM SIDEBAR ─────────────────────────────────────
  window.sbNav = function(section) {
    closeSidebar();
    _setActiveNavItem(section);

    // Extra sections handled here in sidebar.js
    const extraSections = ['juniors','committees','documents'];
    if (extraSections.includes(section)) {
      setTimeout(() => {
        // Hide all main + extra sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        // Show extra section
        const el = document.getElementById('sec-' + section);
        if (el) {
          el.style.display = 'block';
          el.classList.add('active');
        }
        // Load content
        if (section === 'juniors')    _loadJuniorsSection();
        if (section === 'committees') _loadCommitteesSection();
        if (section === 'documents')  _loadDocumentsSection();
      }, 300);
    } else {
      setTimeout(() => {
        const navBtn = document.getElementById('nav-' + section) ||
                       document.querySelector(`[onclick*="showSection('${section}')"]`);
        window.showSection(section, navBtn);
      }, 300);
    }
  };

  function _setActiveNavItem(section) {
    document.querySelectorAll('#sb-drawer [data-section]').forEach(btn => {
      const active = btn.dataset.section === section;
      btn.style.background = active ? 'rgba(201,168,76,.18)' : 'none';
      btn.style.color       = active ? '#c9a84c' : 'rgba(255,255,255,.75)';
      btn.dataset.active    = active ? '1' : '';
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

    const adminSection = document.getElementById('sb-nav-admin');
    if (adminSection) adminSection.style.display = STATE.isAdmin ? 'block' : 'none';

    // Show admin upload button for documents
    const uploadWrap = document.getElementById('sb-docs-upload-wrap');
    if (uploadWrap) uploadWrap.style.display = STATE.isAdmin ? 'block' : 'none';
  }

  // ── INBOX BADGE MIRROR ────────────────────────────────────────
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

  const _badgeObserver = new MutationObserver(() => {
    const badge = document.getElementById('notif-count');
    const count = badge && badge.style.display !== 'none' ? parseInt(badge.textContent || '0') : 0;
    _updateInboxBadge(count);
  });
  const badgeEl = document.getElementById('notif-count');
  if (badgeEl) _badgeObserver.observe(badgeEl, { childList: true, attributes: true, attributeFilter: ['style'] });

  // ── NOTE: Bottom nav is intentionally NOT hidden ─────────────
  // The bottom nav is kept visible. The sidebar provides additional
  // navigation for Juniors, Committees, and Documents sections.

  // ── SWIPE TO OPEN ─────────────────────────────────────────────
  let _touchStartX = 0;
  document.addEventListener('touchstart', e => { _touchStartX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx     = e.changedTouches[0].clientX - _touchStartX;
    const drawer = document.getElementById('sb-drawer');
    if (!drawer) return;
    if (_touchStartX < 20 && dx > 60) window.openSidebar();
    if (drawer.style.left === '0px' && dx < -60) window.closeSidebar();
  }, { passive: true });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeSidebar(); });

  // ── PATCH showSection to highlight sidebar item ───────────────
  const _origShow = window.showSection;
  window.showSection = function(name, btn) {
    _origShow(name, btn);
    _setActiveNavItem(name);
    // Hide extra sections when navigating to a main section
    ['juniors','committees','documents'].forEach(s => {
      const el = document.getElementById('sec-' + s);
      if (el) { el.style.display = 'none'; el.classList.remove('active'); }
    });
  };

  // ── JUNIORS SECTION LOADER ────────────────────────────────────
  async function _loadJuniorsSection() {
    const list = document.getElementById('sb-juniors-list');
    if (!list) return;
    list.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';
    try {
      const snap = await getDocs(collection(db, 'juniors'));
      if (snap.empty) {
        list.innerHTML = '<div class="empty">No junior members on record</div>';
        return;
      }
      const currentYear = new Date().getFullYear();
      let html = '';
      snap.forEach(d => {
        const j   = d.data();
        const ini = (j.name || '?')[0].toUpperCase();
        const sub = (j.subscriptionByYear || {})[String(currentYear)] || 0;
        const rate = j.monthlyRate || 20000;
        const pct  = Math.min(100, Math.round(sub / (rate * 12) * 100));
        const behind = Math.max(0, Math.ceil(Math.max(0, rate * (new Date().getMonth() + 1) - sub) / rate));
        const statusColor = behind === 0 ? '#166534' : behind <= 2 ? '#d97706' : '#991b1b';
        html += `
          <div class="card" style="margin-bottom:10px;cursor:pointer" onclick="window.openJuniorDetail && window.openJuniorDetail('${d.id}')">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <div style="width:36px;height:36px;border-radius:50%;background:#f5f0e8;color:#c9a84c;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0">${ini}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:var(--ink)">${j.name || '—'}</div>
                <div style="font-size:11px;color:var(--muted)">Parent: ${j.parentName || '—'} · UGX ${rate.toLocaleString()}/mo</div>
              </div>
              <span class="status-badge s-${j.status || 'active'}">${j.status || 'active'}</span>
            </div>
            <div style="background:var(--border);border-radius:3px;height:4px;overflow:hidden">
              <div style="height:100%;background:${statusColor};width:${pct}%;transition:width .5s"></div>
            </div>
            <div style="font-size:10px;color:${statusColor};margin-top:4px;font-weight:600">
              ${behind === 0 ? '✅ Up to date' : `${behind} month${behind !== 1 ? 's' : ''} behind`} · ${currentYear}: UGX ${sub.toLocaleString()}
            </div>
          </div>`;
      });
      list.innerHTML = html;
    } catch (e) {
      list.innerHTML = '<div class="empty">Error loading juniors</div>';
    }
  }

  // ── COMMITTEES SECTION LOADER ─────────────────────────────────
  async function _loadCommitteesSection() {
    const list = document.getElementById('sb-committees-list');
    if (!list) return;
    list.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';
    try {
      const snap = await getDocs(collection(db, 'committees'));

      // Built-in committees from constitution if Firestore is empty
      const builtIn = [
        {
          name: 'Executive Committee',
          term: '2026 Cabinet',
          members: [
            { role: 'Chairman', name: 'Kigonya Antonio' },
            { role: 'Vice Chairman', name: 'Nuwahereza Edson' },
            { role: 'Treasurer', name: 'Namutebi Claire' },
            { role: 'Deputy Treasurer', name: 'Nabuuma Teopista' },
            { role: 'Secretary', name: 'Luutu Daniel' },
            { role: 'Deputy Secretary', name: 'Nagawa Ruth' },
          ]
        },
        {
          name: 'Investment Subcommittee',
          term: '2026',
          members: [{ role: 'Lead', name: 'Kirabira Jude' }]
        },
        {
          name: 'Welfare Subcommittee',
          term: '2026',
          members: [{ role: 'Lead', name: 'Bangi Aidah' }]
        },
        {
          name: 'Disciplinary Subcommittee',
          term: '2026',
          members: [{ role: 'Chair (Patron)', name: 'Lule Stephen Musisi' }]
        }
      ];

      let committeeData = [];
      if (!snap.empty) {
        snap.forEach(d => committeeData.push(d.data()));
      } else {
        committeeData = builtIn;
      }

      const colorMap = {
        'Executive Committee':       '#1a2332',
        'Investment Subcommittee':   '#166534',
        'Welfare Subcommittee':      '#1e40af',
        'Disciplinary Subcommittee': '#7c3aed',
      };

      let html = '';
      committeeData.forEach(c => {
        const color = colorMap[c.name] || '#1a2332';
        const membersArr = c.members || [];
        html += `
          <div class="card" style="margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <div style="width:40px;height:40px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🏛️</div>
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--ink)">${c.name}</div>
                ${c.term ? `<div style="font-size:10px;color:var(--muted)">${c.term}</div>` : ''}
              </div>
            </div>
            ${membersArr.map(mb => {
              const name = (mb.name || mb.memberId || '').replace(/[_-]/g,' ').replace(/\b\w/g, cc => cc.toUpperCase());
              return `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
                <span style="font-weight:600;color:var(--ink)">${mb.role}</span>
                <span style="color:var(--muted)">${name}</span>
              </div>`;
            }).join('')}
          </div>`;
      });
      list.innerHTML = html || '<div class="empty">No committee data</div>';
    } catch (e) {
      list.innerHTML = '<div class="empty">Error loading committees</div>';
    }
  }

  // ── DOCUMENTS SECTION LOADER ──────────────────────────────────
  const DOC_CATEGORIES = {
    minutes:      { label: 'Meeting Minutes',     icon: '📝', color: '#1e40af' },
    agm:          { label: 'AGM Reports',          icon: '🏛️', color: '#166534' },
    constitution: { label: 'Constitution',         icon: '📜', color: '#7c3aed' },
    financial:    { label: 'Financial Reports',    icon: '💰', color: '#c9a84c' },
    investment:   { label: 'Investment Reports',   icon: '📈', color: '#0891b2' },
    other:        { label: 'Other Documents',      icon: '📁', color: '#6b7280' },
  };

  async function _loadDocumentsSection() {
    const list = document.getElementById('sb-docs-list');
    if (!list) return;
    list.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';

    // Show upload button for admins
    const uploadWrap = document.getElementById('sb-docs-upload-wrap');
    if (uploadWrap) uploadWrap.style.display = STATE.isAdmin ? 'block' : 'none';

    try {
      const snap = await getDocs(collection(db, 'documents'));

      if (snap.empty) {
        list.innerHTML = `
          <div class="empty">
            <div style="font-size:32px;margin-bottom:8px">📁</div>
            <div style="font-weight:600;margin-bottom:4px">No documents yet</div>
            ${STATE.isAdmin ? '<div style="font-size:11px;color:var(--muted)">Use the form above to upload club documents</div>' : '<div style="font-size:11px;color:var(--muted)">Documents will appear here once uploaded by admin</div>'}
          </div>`;
        return;
      }

      // Group by category
      const grouped = {};
      snap.forEach(d => {
        const doc = { id: d.id, ...d.data() };
        const cat  = doc.category || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(doc);
      });

      let html = '';
      Object.entries(grouped).forEach(([cat, docs]) => {
        const catInfo = DOC_CATEGORIES[cat] || DOC_CATEGORIES.other;
        // Sort newest first
        docs.sort((a, b) => (b.year || 0) - (a.year || 0));
        html += `
          <div style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-size:16px">${catInfo.icon}</span>
              <div style="font-size:12px;font-weight:700;color:var(--ink);text-transform:uppercase;letter-spacing:1px">${catInfo.label}</div>
            </div>
            ${docs.map(dd => `
              <div style="background:#fff;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px">
                <div style="display:flex;align-items:flex-start;gap:10px">
                  <div style="width:36px;height:36px;border-radius:8px;background:${catInfo.color};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${catInfo.icon}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:700;color:var(--ink)">${dd.title || 'Untitled'}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:2px">${dd.year || '—'} ${dd.description ? '· ' + dd.description : ''}</div>
                    ${dd.link ? `<a href="${dd.link}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;padding:5px 12px;background:${catInfo.color};color:#fff;text-decoration:none;border-radius:6px;font-size:11px;font-weight:600">Open Document ↗</a>` : ''}
                  </div>
                  ${STATE.isAdmin ? `<button onclick="sbDeleteDocument('${dd.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:4px;flex-shrink:0" title="Delete">🗑️</button>` : ''}
                </div>
              </div>`).join('')}
          </div>`;
      });
      list.innerHTML = html;
    } catch (e) {
      list.innerHTML = '<div class="empty">Error loading documents</div>';
    }
  }

  // ── SAVE DOCUMENT ─────────────────────────────────────────────
  window.sbSaveDocument = async function() {
    if (!STATE.isAdmin) return;
    const title    = (document.getElementById('doc-title')?.value || '').trim();
    const category = document.getElementById('doc-category')?.value || 'other';
    const year     = Number(document.getElementById('doc-year')?.value) || new Date().getFullYear();
        const fileInput   = document.getElementById('doc-file');
        const file        = fileInput?.files?.[0];
        if (!file) { if (msgEl) { msgEl.style.color='#ef4444'; msgEl.textContent='Please select a file.'; } return; }
        if (msgEl) { msgEl.style.color='var(--muted)'; msgEl.textContent='Uploading…'; }
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js');
        const storage     = getStorage();
        const storageRef  = ref(storage, 'documents/' + Date.now() + '_' + file.name);
        const snapshot    = await uploadBytes(storageRef, file);
        const link        = await getDownloadURL(snapshot.ref);
    const desc     = (document.getElementById('doc-desc')?.value || '').trim();
    const msgEl    = document.getElementById('doc-save-msg');

    if (!title) { if (msgEl) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'Please enter a document title.'; } return; }
    if (msgEl) { msgEl.style.color = 'var(--muted)'; msgEl.textContent = 'Saving…'; }

    try {
      await addDoc(collection(db, 'documents'), {
        title, category, year, link, description: desc,
        uploadedBy: STATE.member?.name || 'Admin',
        createdAt: serverTimestamp()
      });
      if (msgEl) { msgEl.style.color = '#22c55e'; msgEl.textContent = '✓ Document saved!'; }
      document.getElementById('doc-title').value = '';
      document.getElementById('doc-file').value  = '';
      document.getElementById('doc-desc').value  = '';
      setTimeout(() => { if (msgEl) msgEl.textContent = ''; _loadDocumentsSection(); }, 1200);
    } catch (e) {
      if (msgEl) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'Error: ' + e.message; }
    }
  };

  // ── DELETE DOCUMENT ───────────────────────────────────────────
  window.sbDeleteDocument = async function(docId) {
    if (!STATE.isAdmin) return;
    if (!confirm('Delete this document?')) return;
    try {
      const { deleteDoc } = window.__lg;
      await deleteDoc(doc(db, 'documents', docId));
      _loadDocumentsSection();
    } catch (e) { alert('Error deleting: ' + e.message); }
  };

  // ── INIT ─────────────────────────────────────────────────────
  setTimeout(() => {
    _refreshSidebarUser();
    const active = document.querySelector('.section.active');
    if (active) _setActiveNavItem(active.id.replace('sec-', ''));
    else _setActiveNavItem('dashboard');
  }, 500);

  console.log('✓ sidebar.js loaded (v2.1 — bottom nav preserved)');
});
