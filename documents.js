// documents.js — Let's Grow Investment Club
// Handles document upload (admin), listing, and viewing.
// Uses Firebase Storage (storageBucket already configured in app.js).
// Load order: after app.js sets window.__lg
// ─────────────────────────────────────────────────────────────

import {
  getStorage, ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

function _wait(fn) {
  if (window.__lg?.STATE?.user) fn();
  else setTimeout(() => _wait(fn), 150);
}

_wait(function () {
  const { db, STATE, toast } = window.__lg;
  const storage = getStorage();

  // ── Inject the Documents section if it doesn't exist ─────────
  if (!document.getElementById('sec-documents')) {
    const sec = document.createElement('div');
    sec.className = 'section';
    sec.id = 'sec-documents';
    sec.style.cssText = 'padding-top:58px;padding-bottom:80px';
    sec.innerHTML = `
      <div style="padding:0 16px">
        <div style="font-size:18px;font-weight:800;color:var(--ink);margin-bottom:4px">📁 Club Documents</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:16px">Official records & shared files</div>
        <div id="docs-upload-area" style="display:none;margin-bottom:16px"></div>
        <div id="docs-list"><div class="empty"><div class="spinner" style="margin:0 auto"></div></div></div>
      </div>`;
    document.getElementById('app')?.appendChild(sec);
  }

  // ── Load documents list ───────────────────────────────────────
  window._loadDocumentsSection = async function () {
    const list = document.getElementById('docs-list');
    const uploadArea = document.getElementById('docs-upload-area');
    if (!list) return;

    // Show upload form for admins
    if (STATE.isAdmin && uploadArea) {
      uploadArea.style.display = 'block';
      if (!uploadArea.dataset.built) {
        uploadArea.dataset.built = '1';
        uploadArea.innerHTML = `
          <div class="card" style="border:2px dashed var(--gold)">
            <div class="card-title" style="margin-bottom:8px">⬆️ Upload Document</div>
            <div style="display:grid;gap:8px">
              <input type="text" id="doc-title" placeholder="Document title (e.g. AGM Minutes 2025)"
                style="width:100%;padding:9px;border-radius:8px;border:1px solid var(--border);font-size:13px;box-sizing:border-box">
              <select id="doc-category" style="width:100%;padding:9px;border-radius:8px;border:1px solid var(--border);font-size:13px">
                <option value="constitution">Constitution</option>
                <option value="minutes">AGM / Meeting Minutes</option>
                <option value="financial">Financial Reports</option>
                <option value="declarations">Member Declarations</option>
                <option value="policies">Policies & Rules</option>
                <option value="other">Other</option>
              </select>
              <div id="doc-drop-zone" style="border:2px dashed var(--border);border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:border-color .2s"
                   onclick="document.getElementById('doc-file-input').click()"
                   ondragover="event.preventDefault();this.style.borderColor='#c9a84c'"
                   ondragleave="this.style.borderColor='var(--border)'"
                   ondrop="_handleDocDrop(event)">
                <div style="font-size:24px;margin-bottom:6px">📎</div>
                <div style="font-size:12px;color:var(--muted)">Tap to select or drag & drop</div>
                <div style="font-size:10px;color:var(--muted);margin-top:4px">PDF, Word, Excel, Images (max 10MB)</div>
              </div>
              <input type="file" id="doc-file-input" style="display:none"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onchange="_handleDocFile(this.files[0])">
              <div id="doc-progress" style="display:none">
                <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                  <div id="doc-progress-bar" style="height:100%;background:#c9a84c;width:0%;transition:width .3s;border-radius:3px"></div>
                </div>
                <div id="doc-progress-label" style="font-size:11px;color:var(--muted);margin-top:4px;text-align:center">Uploading…</div>
              </div>
              <button class="btn-primary btn-gold" style="width:100%" onclick="_submitDocUpload()">Upload Document</button>
              <div id="doc-upload-msg" style="font-size:11px;min-height:14px;text-align:center"></div>
            </div>
          </div>`;
      }
    }

    // Load docs from Firestore
    list.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';
    try {
      const snap = await getDocs(query(collection(db, 'documents'), orderBy('uploadedAt', 'desc')));
      if (snap.empty) {
        list.innerHTML = '<div class="empty">📭 No documents uploaded yet</div>';
        return;
      }

      const catIcons = {
        constitution:'📜', minutes:'📋', financial:'📊',
        declarations:'✍️', policies:'📏', other:'📄'
      };

      let html = '<div style="display:grid;gap:10px">';
      snap.forEach(d => {
        const doc = d.data();
        const icon = catIcons[doc.category] || '📄';
        const date = doc.uploadedAt?.toDate?.()?.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) || '—';
        const size = doc.sizeBytes ? (doc.sizeBytes > 1e6 ? (doc.sizeBytes/1e6).toFixed(1)+'MB' : Math.round(doc.sizeBytes/1024)+'KB') : '';
        html += `
          <div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 14px">
            <div style="font-size:28px;flex-shrink:0">${icon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${doc.title || 'Untitled'}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px">${date}${size ? ' · '+size : ''} · ${doc.uploadedBy || 'Admin'}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <a href="${doc.url}" target="_blank" rel="noopener"
                 style="padding:6px 12px;background:var(--gold);color:#fff;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none">View</a>
              ${STATE.isAdmin ? `<button onclick="_deleteDoc('${d.id}','${doc.storagePath||''}')" style="padding:6px 10px;background:rgba(239,68,68,.12);color:#ef4444;border:none;border-radius:8px;font-size:11px;cursor:pointer">🗑</button>` : ''}
            </div>
          </div>`;
      });
      html += '</div>';
      list.innerHTML = html;
    } catch (e) {
      list.innerHTML = `<div class="empty" style="font-size:12px">Error loading documents: ${e.message}</div>`;
    }
  };

  // ── File selection & upload ───────────────────────────────────
  let _pendingFile = null;

  window._handleDocFile = function (file) {
    if (!file) return;
    _pendingFile = file;
    const zone = document.getElementById('doc-drop-zone');
    if (zone) {
      zone.style.borderColor = '#c9a84c';
      zone.innerHTML = `<div style="font-size:20px;margin-bottom:4px">✅</div><div style="font-size:12px;font-weight:600;color:var(--ink)">${file.name}</div><div style="font-size:10px;color:var(--muted)">${(file.size/1024).toFixed(0)} KB</div>`;
    }
  };

  window._handleDocDrop = function (e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) window._handleDocFile(file);
    document.getElementById('doc-drop-zone').style.borderColor = '#c9a84c';
  };

  window._submitDocUpload = async function () {
    const title = document.getElementById('doc-title')?.value?.trim();
    const category = document.getElementById('doc-category')?.value || 'other';
    const msg = document.getElementById('doc-upload-msg');
    const progress = document.getElementById('doc-progress');
    const bar = document.getElementById('doc-progress-bar');
    const label = document.getElementById('doc-progress-label');

    if (!title) { if (msg) { msg.style.color='#991b1b'; msg.textContent='Please enter a title.'; } return; }
    if (!_pendingFile) { if (msg) { msg.style.color='#991b1b'; msg.textContent='Please select a file.'; } return; }
    if (_pendingFile.size > 10 * 1024 * 1024) { if (msg) { msg.style.color='#991b1b'; msg.textContent='File must be under 10MB.'; } return; }

    if (msg) { msg.style.color='var(--muted)'; msg.textContent='Uploading…'; }
    if (progress) progress.style.display = 'block';

    try {
      const ext = _pendingFile.name.split('.').pop();
      const path = `documents/${Date.now()}_${title.replace(/[^a-z0-9]/gi,'_')}.${ext}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, _pendingFile);

      task.on('state_changed',
        snap => {
          const pct = Math.round(snap.bytesTransferred / snap.totalBytes * 100);
          if (bar) bar.style.width = pct + '%';
          if (label) label.textContent = `Uploading… ${pct}%`;
        },
        err => { throw err; },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          await addDoc(collection(db, 'documents'), {
            title, category, url,
            storagePath: path,
            fileName: _pendingFile.name,
            sizeBytes: _pendingFile.size,
            uploadedBy: STATE.user?.email || 'Admin',
            uploadedAt: serverTimestamp(),
          });
          if (msg) { msg.style.color='#166534'; msg.textContent='✅ Uploaded successfully!'; }
          if (progress) progress.style.display = 'none';
          _pendingFile = null;
          document.getElementById('doc-title').value = '';
          // Rebuild drop zone
          const zone = document.getElementById('doc-drop-zone');
          if (zone) zone.innerHTML = '<div style="font-size:24px;margin-bottom:6px">📎</div><div style="font-size:12px;color:var(--muted)">Tap to select or drag & drop</div>';
          // Reload list
          setTimeout(() => window._loadDocumentsSection(), 500);
        }
      );
    } catch (e) {
      if (msg) { msg.style.color='#991b1b'; msg.textContent='Upload failed: ' + e.message; }
      if (progress) progress.style.display = 'none';
    }
  };

  window._deleteDoc = async function (docId, storagePath) {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDoc(doc(db, 'documents', docId));
      if (storagePath) {
        await deleteObject(ref(storage, storagePath)).catch(() => {});
      }
      toast('Document deleted');
      window._loadDocumentsSection();
    } catch (e) {
      toast('Delete failed: ' + e.message, 'error');
    }
  };

  console.log('✓ documents.js loaded');
});
