// ── nav.js — Full sidebar navigation + header inbox button ────
// Loaded by app.js: import('./nav.js')
// Replaces bottom nav. Zero changes to index.html needed.
// ─────────────────────────────────────────────────────────────

(function() {
  function _wait(fn) { if(window.__lg?.STATE) fn(); else setTimeout(()=>_wait(fn),150); }

  _wait(function() {
    const { STATE } = window.__lg;

    // ── INJECT CSS ───────────────────────────────────────────
    const css = `
      #sb-overlay { display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:800;opacity:0;transition:opacity .25s; }
      #sb-drawer  { position:fixed;top:0;left:-285px;width:278px;height:100%;background:#1a2332;display:flex;flex-direction:column;z-index:900;transition:left .3s cubic-bezier(.4,0,.2,1);box-shadow:4px 0 24px rgba(0,0,0,.4);overflow-y:auto; }
      #sb-drawer::-webkit-scrollbar{width:3px} #sb-drawer::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
      #sb-trigger { position:fixed;top:10px;left:10px;z-index:750;background:#1a2332;border:none;width:40px;height:40px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35); }
      #sb-inbox-btn { position:fixed;top:10px;right:10px;z-index:750;background:#1a2332;border:none;width:40px;height:40px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);color:#c9a84c;font-size:18px; }
      #sb-inbox-badge { position:absolute;top:4px;right:4px;background:#ef4444;color:#fff;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:2px solid #1a2332;padding:0 3px; }
      .sb-navbtn { width:100%;display:flex;align-items:center;gap:11px;padding:10px 10px;border:none;background:none;color:rgba(255,255,255,.75);border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;text-align:left;margin-bottom:2px;transition:background .15s; }
      .sb-navbtn:hover,.sb-navbtn.active { background:rgba(201,168,76,.15);color:#c9a84c; }
      .sb-navbtn .icon { font-size:16px;width:22px;text-align:center;flex-shrink:0; }
      .sb-section-label { font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.3);text-transform:uppercase;padding:10px 10px 4px; }
      .bottom-nav, nav.nav-bar, #bottom-nav, [class*="bottom-nav"], .nav-tabs { display:none !important; }
      #app .section { padding-top:58px; }
      @media(min-width:768px){ #sb-drawer{left:0!important;box-shadow:none;border-right:1px solid rgba(255,255,255,.08);} #sb-overlay,#sb-trigger{display:none!important;} #app{margin-left:278px;} #app .section{padding-top:16px;} #sb-inbox-btn{right:auto;left:298px;} }`;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // ── BUILD SIDEBAR ─────────────────────────────────────────
    const sidebar = document.createElement('div');
    sidebar.innerHTML = `
      <div id="sb-overlay" onclick="closeSidebar()"></div>
      <nav id="sb-drawer" aria-label="Main navigation">
        <div style="padding:18px 14px 12px;border-bottom:1px solid rgba(255,255,255,.1)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div><div style="font-size:16px;font-weight:800;color:#c9a84c;letter-spacing:.5px">Let's Grow</div>
              <div style="font-size:9px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:1px">Investment Club</div></div>
            <button onclick="closeSidebar()" style="background:rgba(255,255,255,.08);border:none;color:rgba(255,255,255,.6);width:30px;height:30px;border-radius:7px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>
          </div>
          <div id="sb-user" style="margin-top:11px;background:rgba(255,255,255,.06);border-radius:9px;padding:8px 10px;display:flex;align-items:center;gap:8px">
            <div id="sb-avatar" style="width:32px;height:32px;border-radius:50%;background:#c9a84c;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#1a2332;flex-shrink:0">?</div>
            <div style="min-width:0"><div id="sb-name" style="font-size:12px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">—</div>
              <div id="sb-role" style="font-size:10px;color:rgba(255,255,255,.45);margin-top:1px">Member</div></div>
          </div>
        </div>
        <div style="flex:1;padding:6px 8px">
          <div class="sb-section-label">Navigation</div>
          <button class="sb-navbtn" id="sbn-dashboard"    onclick="sbGo('dashboard')"><span class="icon">🏠</span>Home</button>
          <button class="sb-navbtn" id="sbn-account"      onclick="sbGo('account')"><span class="icon">👤</span>My Account</button>
          <button class="sb-navbtn" id="sbn-members"      onclick="sbGo('members')"><span class="icon">👥</span>Members</button>
          <button class="sb-navbtn" id="sbn-investments"  onclick="sbGo('investments')"><span class="icon">📈</span>Investments</button>
          <button class="sb-navbtn" id="sbn-notifications" onclick="sbGo('notifications')"><span class="icon">📬</span>Inbox <span id="sb-badge" style="display:none;background:#ef4444;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px;margin-left:auto"></span></button>
          <button class="sb-navbtn" id="sbn-committees" onclick="sbShowCommittees()"><span class="icon">👨‍👩‍👧‍👦</span>Committees</button>
          <button class="sb-navbtn" id="sbn-documents" onclick="sbShowDocuments()"><span class="icon">📄</span>Club Documents</button>

          <div id="sb-admin-section" style="display:none">
            <div class="sb-section-label" style="margin-top:8px">Admin</div>
            <button class="sb-navbtn" id="sbn-admin"  onclick="sbGo('admin')"><span class="icon">⚙️</span>Admin Panel</button>
            <button class="sb-navbtn" id="sbn-loans"  onclick="sbGo('loans')"><span class="icon">💰</span>Loans</button>
          </div>
        </div>
        <div style="padding:12px 16px 28px;border-top:1px solid rgba(255,255,255,.1)">
          <button onclick="doSignOut()" style="width:100%;padding:9px;background:rgba(239,68,68,.12);color:#fca5a5;border:1px solid rgba(239,68,68,.25);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Sign Out</button>
          <div style="text-align:center;font-size:9px;color:rgba(255,255,255,.18);margin-top:8px;letter-spacing:.8px">LGIC · ${new Date().getFullYear()}</div>
        </div>
      </nav>

      <!-- Hamburger trigger -->
      <button id="sb-trigger" onclick="openSidebar()" aria-label="Open menu" style="position:fixed;top:10px;left:10px">
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="width:18px;height:2px;background:#c9a84c;border-radius:2px"></div>
          <div style="width:13px;height:2px;background:#c9a84c;border-radius:2px"></div>
          <div style="width:18px;height:2px;background:#c9a84c;border-radius:2px"></div>
        </div>
      </button>

      <!-- Inbox button top-right -->
      <button id="sb-inbox-btn" onclick="sbGo('notifications')" aria-label="Inbox" style="position:fixed;top:10px;right:10px">
        📬
        <span id="sb-inbox-badge" style="display:none;position:absolute;top:4px;right:4px;background:#ef4444;color:#fff;font-size:9px;font-weight:700;min-width:15px;height:15px;border-radius:8px;display:none;align-items:center;justify-content:center;border:2px solid #1a2332;padding:0 2px"></span>
      </button>`;
    document.body.appendChild(sidebar);

    // ── OPEN / CLOSE ─────────────────────────────────────────
    window.openSidebar = function() {
      const d=document.getElementById('sb-drawer'),o=document.getElementById('sb-overlay');
      if(!d||!o) return;
      _refreshUser();
      d.style.left='0';
      o.style.display='block';
      setTimeout(()=>o.style.opacity='1',10);
      document.body.style.overflow='hidden';
    };
    window.closeSidebar = function() {
      const d=document.getElementById('sb-drawer'),o=document.getElementById('sb-overlay');
      if(!d||!o) return;
      d.style.left='-285px';
      o.style.opacity='0';
      setTimeout(()=>{o.style.display='none';document.body.style.overflow='';},280);
    };

    // ── NAVIGATE ─────────────────────────────────────────────
    window.sbGo = function(section) {
      closeSidebar();
      setTimeout(()=>{
        const btn = document.getElementById('nav-'+section) ||
                    document.querySelector(`.nav-btn[onclick*="${section}"]`);
        window.showSection(section, btn);
      }, 280);
      _setActive(section);
    };

    function _setActive(section) {
      document.querySelectorAll('.sb-navbtn').forEach(b=>{b.classList.remove('active');});
      const btn = document.getElementById('sbn-'+section);
      if(btn) btn.classList.add('active');
    }

    function _refreshUser() {
      const m    = STATE.member;
      const name = m?.name||m?.displayName||m?.primary?.name||STATE.user?.email||'—';
      const ini  = name[0]?.toUpperCase()||'?';
      const role = STATE.isAdmin ? 'Administrator' : (m?.memberType||m?.tier||'Member');
      const _t = id => document.getElementById(id);
      if(_t('sb-avatar')) _t('sb-avatar').textContent = ini;
      if(_t('sb-name'))   _t('sb-name').textContent   = name;
      if(_t('sb-role'))   _t('sb-role').textContent   = role.charAt(0).toUpperCase()+role.slice(1);
      if(_t('sb-admin-section')) _t('sb-admin-section').style.display = STATE.isAdmin?'block':'none';
    }

    // ── COMMITTEES SECTION ───────────────────────────────────
    window.sbShowCommittees = function() {
      closeSidebar();
      setTimeout(()=>{
        // Navigate to account page and open committees widget
        window.sbGo('account');
        setTimeout(()=>{
          const w=document.getElementById('committees-widget');
          const chev=document.getElementById('comm-chev');
          if(w&&w.style.display==='none'){
            w.style.display='block';
            if(chev) chev.style.transform='rotate(90deg)';
            if(!w.dataset.loaded){w.dataset.loaded='1';window._loadCommitteesWidget?.();}
          }
        },500);
      },300);
    };

    // ── CLUB DOCUMENTS ───────────────────────────────────────
    window.sbShowDocuments = function() {
      closeSidebar();
      setTimeout(()=>{
        // Show a documents modal
        let modal = document.getElementById('sb-docs-modal');
        if(!modal){
          modal = document.createElement('div');
          modal.id='sb-docs-modal';
          modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:flex-end;justify-content:center;padding:0';
          modal.innerHTML=`
            <div style="background:var(--bg,#f8f4ec);border-radius:16px 16px 0 0;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;padding:20px 16px 32px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <div style="font-size:15px;font-weight:700;color:var(--ink,#1a2332)">📄 Club Documents</div>
                <button onclick="document.getElementById('sb-docs-modal').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">×</button>
              </div>
              <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Official documents for Let's Grow Investment Club</div>
              ${_docLinks()}
              <div style="margin-top:16px;padding:10px;background:#f0f4ff;border-radius:8px;font-size:11px;color:#1e40af">
                📌 To upload new documents, go to Admin → Club Records. New documents will appear here automatically.
              </div>
            </div>`;
          document.body.appendChild(modal);
        } else {
          modal.style.display='flex';
        }
      },300);
    };

    function _docLinks() {
      const docs = [
        { label:'Club Constitution',      icon:'📜', id:'constitution' },
        { label:'AGM Minutes 2024',        icon:'📋', id:'agm-2024' },
        { label:'AGM Minutes 2023',        icon:'📋', id:'agm-2023' },
        { label:'Member Declarations',    icon:'✍️', id:'declarations' },
        { label:'Beneficiary Records',    icon:'👨‍👩‍👧', id:'beneficiaries' },
      ];
      // Check Firestore for uploaded docs
      window._loadClubDocs?.();
      return docs.map(d=>`
        <div style="display:flex;align-items:center;gap:12px;padding:11px 10px;border-radius:9px;background:var(--bg,#fff);border:1px solid var(--border,#e5e0d8);margin-bottom:8px;cursor:pointer" onclick="toast('Document loading…')">
          <span style="font-size:20px">${d.icon}</span>
          <div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--ink,#1a2332)">${d.label}</div>
            <div style="font-size:10px;color:var(--muted)">Tap to view</div></div>
          <span style="font-size:14px;color:var(--muted)">›</span>
        </div>`).join('');
    }

    // ── SYNC INBOX BADGE ─────────────────────────────────────
    function _syncBadge() {
      const src  = document.getElementById('notif-count');
      const sb   = document.getElementById('sb-badge');
      const ibtn = document.getElementById('sb-inbox-badge');
      if(!src||!sb) return;
      const vis   = src.style.display !== 'none';
      const count = src.textContent || '';
      [sb, ibtn].forEach(el => {
        if(!el) return;
        el.textContent = count;
        el.style.display = vis ? 'flex' : 'none';
      });
    }
    const _badgeObs = new MutationObserver(_syncBadge);
    const _src = document.getElementById('notif-count');
    if(_src) _badgeObs.observe(_src, { childList:true, attributes:true, attributeFilter:['style'] });
    _syncBadge();

    // ── SWIPE + ESC ──────────────────────────────────────────
    let _tx=0;
    document.addEventListener('touchstart',e=>{_tx=e.touches[0].clientX;},{passive:true});
    document.addEventListener('touchend',e=>{
      const dx=e.changedTouches[0].clientX-_tx;
      const d=document.getElementById('sb-drawer');
      if(_tx<25&&dx>60) openSidebar();
      else if(d?.style.left==='0px'&&dx<-60) closeSidebar();
    },{passive:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape') closeSidebar();});

    // ── PATCH showSection ────────────────────────────────────
    const _origShow = window.showSection;
    window.showSection = function(name, btn) {
      _origShow(name, btn);
      _setActive(name);
    };

    // ── INIT ─────────────────────────────────────────────────
    setTimeout(()=>{
      _refreshUser();
      // Hide bottom nav
      document.querySelectorAll('.bottom-nav,nav.nav-bar,#bottom-nav,.nav-tabs,[id^="nav-"]:not(#nav-admin):not(#nav-loans)').forEach(el=>{
        // Only hide the bottom container, not individual nav-xxx links
        if((el.tagName==='NAV' && !el.classList.contains('bottomnav'))||el.classList.contains('bottom-nav')||el.classList.contains('nav-tabs')) el.style.display='none';
      });
        // bottom nav preserved — do not hide
      }
      const active = document.querySelector('.section.active');
      if(active) _setActive(active.id.replace('sec-',''));
      else _setActive('account');
    }, 400);

    console.log('✓ nav.js loaded');
  });
})();
