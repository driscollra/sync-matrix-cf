<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Staff Sync Matrix</title>
<style>
  :root {
    --color-background-primary: #ffffff;
    --color-background-secondary: #f5f4ef;
    --color-background-tertiary: #ebeae4;
    --color-background-info: #E6F1FB;
    --color-background-danger: #FCEBEB;
    --color-background-success: #EAF3DE;
    --color-text-primary: #1a1a1a;
    --color-text-secondary: #666666;
    --color-text-tertiary: #999999;
    --color-text-info: #185FA5;
    --color-text-danger: #A32D2D;
    --color-text-success: #3B6D11;
    --color-border-tertiary: rgba(0,0,0,0.12);
    --color-border-secondary: rgba(0,0,0,0.25);
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
    --border-radius-md: 8px;
    --border-radius-lg: 12px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --color-background-primary: #1f1f1e;
      --color-background-secondary: #2a2a29;
      --color-background-tertiary: #353533;
      --color-background-info: #0C447C;
      --color-background-danger: #501313;
      --color-background-success: #27500A;
      --color-text-primary: #ededed;
      --color-text-secondary: #a8a8a8;
      --color-text-tertiary: #6e6e6e;
      --color-text-info: #85B7EB;
      --color-text-danger: #F09595;
      --color-text-success: #97C459;
      --color-border-tertiary: rgba(255,255,255,0.14);
      --color-border-secondary: rgba(255,255,255,0.28);
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--color-background-tertiary); color: var(--color-text-primary); font-family: var(--font-sans); font-size: 14px; }
  body { padding: 1.5rem; min-height: 100vh; }
  .page-header { max-width: 1600px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .page-header h1 { font-size: 22px; font-weight: 500; margin: 0 0 0.25rem; }
  .page-header p { font-size: 13px; color: var(--color-text-secondary); margin: 0; }
  .page-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .page-content { max-width: 1600px; margin: 0 auto; display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
  @media (max-width: 1100px) { .page-content { grid-template-columns: 1fr; } }

  .sync-status { font-size: 12px; display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: var(--border-radius-md); background: var(--color-background-secondary); }
  .sync-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-text-tertiary); }
  .sync-status.connected .sync-dot { background: var(--color-text-success); }
  .sync-status.connecting .sync-dot { background: #EF9F27; }
  .sync-status.error .sync-dot { background: var(--color-text-danger); }

  .user-chip { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: var(--border-radius-md); background: var(--color-background-secondary); font-size: 12px; }
  .user-chip .user-avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--color-background-info); color: var(--color-text-info); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; }
  .user-chip .user-role { font-size: 10px; padding: 1px 6px; border-radius: 10px; background: var(--color-background-tertiary); color: var(--color-text-secondary); }
  .user-chip .user-role.admin { background: var(--color-background-info); color: var(--color-text-info); }

  button, input, select { font-family: inherit; color: inherit; }
  button { background: transparent; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); padding: 0 10px; cursor: pointer; transition: background 0.1s; }
  button:hover { background: var(--color-background-secondary); }
  button:active { transform: scale(0.98); }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  input[type="text"], input[type="password"], input[type="datetime-local"], select { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); padding: 0 10px; height: 32px; outline: none; }
  input:focus, select:focus { border-color: var(--color-text-info); box-shadow: 0 0 0 3px rgba(55,138,221,0.15); }

  /* ---- Login screen ---- */
  .login-overlay { position: fixed; inset: 0; background: var(--color-background-tertiary); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem; }
  .login-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 28px 28px 24px; width: 100%; max-width: 360px; }
  .login-card h2 { margin: 0 0 4px; font-size: 20px; font-weight: 500; }
  .login-card p { margin: 0 0 18px; font-size: 13px; color: var(--color-text-secondary); }
  .login-card label { display: block; font-size: 12px; color: var(--color-text-secondary); margin: 10px 0 4px; }
  .login-card input { width: 100%; }
  .login-card button { width: 100%; height: 38px; margin-top: 16px; background: var(--color-text-primary); color: var(--color-background-primary); border: none; font-weight: 500; }
  .login-card button:hover { opacity: 0.85; background: var(--color-text-primary); }
  .login-error { font-size: 12px; color: var(--color-text-danger); margin-top: 10px; min-height: 16px; }
  .login-hint { font-size: 11px; color: var(--color-text-tertiary); margin-top: 14px; text-align: center; line-height: 1.5; }

  /* ---- Matrix ---- */
  .sm-toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; padding: 10px 12px; background: var(--color-background-secondary); border-radius: var(--border-radius-md); }
  .sm-toolbar input[type="text"] { flex: 1; min-width: 160px; height: 32px; padding: 0 10px; font-size: 13px; }
  .sm-toolbar select, .sm-toolbar button { height: 32px; font-size: 13px; }
  .sm-nav { display: flex; align-items: center; gap: 6px; }
  .sm-nav button { width: 32px; padding: 0; }
  .sm-range { font-size: 13px; color: var(--color-text-secondary); min-width: 200px; text-align: center; }
  .sm-grid-wrap { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); overflow: hidden; background: var(--color-background-primary); }
  .sm-scroll { overflow-x: auto; }
  .sm-head { display: grid; background: var(--color-background-secondary); border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 12px; color: var(--color-text-secondary); }
  .sm-head-label { padding: 8px 10px; border-right: 0.5px solid var(--color-border-tertiary); font-weight: 500; }
  .sm-col-head { padding: 6px 4px; text-align: center; border-right: 0.5px solid var(--color-border-tertiary); white-space: nowrap; }
  .sm-col-head.today { background: var(--color-background-info); color: var(--color-text-info); font-weight: 500; }
  .sm-cat { border-bottom: 0.5px solid var(--color-border-tertiary); }
  .sm-cat:last-child { border-bottom: none; }
  .sm-cat-head { display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: var(--color-background-secondary); font-size: 13px; font-weight: 500; cursor: pointer; user-select: none; }
  .sm-cat-head:hover { background: var(--color-background-tertiary); }
  .sm-caret { display: inline-block; width: 10px; transition: transform 0.15s; font-size: 10px; color: var(--color-text-secondary); }
  .sm-cat.collapsed .sm-caret { transform: rotate(-90deg); }
  .sm-cat-title { flex: 1; }
  .sm-cat-count { font-size: 11px; color: var(--color-text-secondary); font-weight: 400; }
  .sm-cat-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.1s; }
  .sm-cat-head:hover .sm-cat-actions { opacity: 1; }
  .sm-cat-actions button { height: 24px; padding: 0 8px; font-size: 11px; }
  .sm-cat.collapsed .sm-rows { display: none; }
  .sm-row { display: grid; border-top: 0.5px solid var(--color-border-tertiary); min-height: 44px; position: relative; }
  .sm-row:first-child { border-top: none; }
  .sm-row-label { padding: 8px 10px; font-size: 13px; border-right: 0.5px solid var(--color-border-tertiary); background: var(--color-background-primary); display: flex; align-items: center; gap: 8px; position: sticky; left: 0; z-index: 2; }
  .sm-avatar { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; flex-shrink: 0; }
  .sm-row-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sm-cell { border-right: 0.5px solid var(--color-border-tertiary); background: transparent; }
  .sm-cell.today-col { background: rgba(55, 138, 221, 0.04); }
  .sm-tile { position: absolute; top: 6px; height: 32px; border-radius: var(--border-radius-md); font-size: 11px; padding: 4px 8px; display: flex; align-items: center; gap: 4px; cursor: grab; overflow: hidden; border: 0.5px solid; box-sizing: border-box; user-select: none; z-index: 3; }
  .sm-tile.dragging { cursor: grabbing; opacity: 0.7; z-index: 10; }
  .sm-tile-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; pointer-events: none; }
  .sm-tile-handle { position: absolute; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
  .sm-tile-handle.left { left: 0; }
  .sm-tile-handle.right { right: 0; }
  .sm-now-line { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--color-text-info); z-index: 4; pointer-events: none; }
  .sm-add-row { padding: 6px 10px; display: flex; gap: 6px; align-items: center; background: var(--color-background-primary); border-top: 0.5px dashed var(--color-border-tertiary); }
  .sm-add-row input { flex: 1; height: 28px; font-size: 12px; }
  .sm-add-row button { height: 28px; font-size: 12px; }
  .sm-empty { padding: 40px 20px; text-align: center; color: var(--color-text-secondary); font-size: 13px; }
  .sm-hint { font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; text-align: center; }
  .sm-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
  .sm-modal { background: var(--color-background-primary); border-radius: var(--border-radius-lg); padding: 16px 18px; width: 100%; max-width: 480px; border: 0.5px solid var(--color-border-tertiary); max-height: 90vh; overflow: auto; }
  .sm-modal h3 { margin: 0 0 12px; font-size: 15px; font-weight: 500; }
  .sm-modal label { display: block; font-size: 12px; color: var(--color-text-secondary); margin: 8px 0 4px; }
  .sm-modal input, .sm-modal select { width: 100%; height: 30px; font-size: 13px; }
  .sm-modal-actions { display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end; }

  /* ---- Audit panel ---- */
  .audit-panel { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); display: flex; flex-direction: column; max-height: 80vh; overflow: hidden; position: sticky; top: 1rem; }
  .audit-head { padding: 10px 12px; border-bottom: 0.5px solid var(--color-border-tertiary); background: var(--color-background-secondary); display: flex; align-items: center; gap: 8px; }
  .audit-head h3 { margin: 0; font-size: 14px; font-weight: 500; flex: 1; }
  .audit-head button { height: 26px; font-size: 11px; padding: 0 8px; }
  .audit-filter { padding: 8px 12px; border-bottom: 0.5px solid var(--color-border-tertiary); }
  .audit-filter input { width: 100%; height: 28px; font-size: 12px; }
  .audit-list { overflow-y: auto; flex: 1; }
  .audit-entry { padding: 10px 12px; border-bottom: 0.5px solid var(--color-border-tertiary); font-size: 12px; line-height: 1.4; }
  .audit-entry:last-child { border-bottom: none; }
  .audit-entry-head { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; }
  .audit-actor { font-weight: 500; font-size: 12px; }
  .audit-time { font-size: 10px; color: var(--color-text-tertiary); margin-left: auto; white-space: nowrap; }
  .audit-summary { color: var(--color-text-secondary); font-size: 12px; }
  .audit-action { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 3px; background: var(--color-background-tertiary); color: var(--color-text-secondary); margin-right: 4px; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 500; }
  .audit-action.shift { background: var(--color-background-info); color: var(--color-text-info); }
  .audit-action.category { background: #EEEDFE; color: #3C3489; }
  .audit-action.employee { background: #E1F5EE; color: #085041; }
  .audit-action.user { background: var(--color-background-success); color: var(--color-text-success); }
  .audit-action.delete { background: var(--color-background-danger); color: var(--color-text-danger); }
  .audit-empty { padding: 40px 20px; text-align: center; color: var(--color-text-secondary); font-size: 12px; }

  /* ---- Admin user panel ---- */
  .admin-users { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
  .admin-user-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--color-background-secondary); border-radius: var(--border-radius-md); font-size: 13px; }
  .admin-user-row .au-name { flex: 1; }
  .admin-user-row .au-role { font-size: 10px; padding: 2px 6px; border-radius: 10px; background: var(--color-background-tertiary); }
  .admin-user-row .au-role.admin { background: var(--color-background-info); color: var(--color-text-info); }
  .admin-user-row button { height: 26px; font-size: 11px; padding: 0 8px; }

  .sm-host { position: relative; }
</style>
</head>
<body>

<!-- Login overlay -->
<div class="login-overlay" id="login-overlay" style="display:none;">
  <div class="login-card">
    <h2>Sign in</h2>
    <p>Staff Sync Matrix</p>
    <label for="login-username">Username</label>
    <input type="text" id="login-username" autocomplete="username" />
    <label for="login-password">Password</label>
    <input type="password" id="login-password" autocomplete="current-password" />
    <button id="login-submit">Sign in</button>
    <div class="login-error" id="login-error"></div>
    <div class="login-hint">First time? Default admin is <code>admin</code> / <code>admin</code> — change the password and create users immediately.</div>
  </div>
</div>

<!-- Main app (hidden until logged in) -->
<div id="app-root" style="display:none;">
<div class="page-header">
  <div>
    <h1>Staff sync matrix</h1>
    <p>Shared live schedule · Changes sync instantly across all viewers</p>
  </div>
  <div class="page-meta">
    <div class="sync-status connecting" id="sync-status">
      <span class="sync-dot"></span>
      <span id="sync-status-text">Connecting...</span>
    </div>
    <div class="user-chip" id="user-chip">
      <span class="user-avatar" id="user-avatar">?</span>
      <span id="user-displayname">...</span>
      <span class="user-role" id="user-role"></span>
    </div>
    <button id="btn-admin" style="display:none; height:32px;">Users</button>
    <button id="btn-logout" style="height:32px;">Sign out</button>
  </div>
</div>
<div class="page-content">
<div>
<div class="sm-wrap" id="sm-wrap">
  <div class="sm-toolbar">
    <div class="sm-nav">
      <button id="sm-prev" title="Previous">‹</button>
      <button id="sm-today" style="width:auto; padding: 0 10px;">Today</button>
      <button id="sm-next" title="Next">›</button>
    </div>
    <div class="sm-range" id="sm-range"></div>
    <select id="sm-zoom">
      <option value="hour">Hourly (1 day)</option>
      <option value="day" selected>Daily (14 days)</option>
      <option value="week">Weekly (8 weeks)</option>
    </select>
    <select id="sm-color-mode">
      <option value="category">Color by category</option>
      <option value="employee">Color by employee</option>
    </select>
    <input type="text" id="sm-search" placeholder="Search employees, categories, notes..." />
    <button id="sm-export-json">Export JSON</button>
    <button id="sm-export-csv">Export CSV</button>
    <button id="sm-reset" title="Clear all data">Reset</button>
  </div>

  <div class="sm-grid-wrap sm-host" id="sm-host">
    <div class="sm-scroll" id="sm-scroll">
      <div id="sm-grid"></div>
    </div>
  </div>
  <div class="sm-hint">Drag tiles to move · Drag edges to resize · Double-click a tile to edit · Double-click an empty cell to add a shift · Click a category header to collapse</div>

  <div style="display:flex; gap:6px; margin-top:10px;">
    <input type="text" id="sm-new-cat" placeholder="New category name (e.g. Training, Patrol)" style="flex:1; height:32px; font-size:13px; padding:0 10px;" />
    <button id="sm-add-cat" style="height:32px; padding:0 12px;">+ Category</button>
  </div>
</div>
</div>

<!-- Audit log sidebar -->
<div class="audit-panel">
  <div class="audit-head">
    <h3>Activity log</h3>
    <button id="audit-export">Export</button>
  </div>
  <div class="audit-filter">
    <input type="text" id="audit-filter-input" placeholder="Filter by user, action, or text..." />
  </div>
  <div class="audit-list" id="audit-list">
    <div class="audit-empty">No activity yet.</div>
  </div>
</div>
</div>
</div>

<script>
(function(){
  // ---------- Elements ----------
  const loginOverlay = document.getElementById('login-overlay');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const loginSubmit = document.getElementById('login-submit');
  const loginError = document.getElementById('login-error');
  const appRoot = document.getElementById('app-root');
  const grid = document.getElementById('sm-grid');
  const rangeEl = document.getElementById('sm-range');
  const zoomEl = document.getElementById('sm-zoom');
  const colorModeEl = document.getElementById('sm-color-mode');
  const searchEl = document.getElementById('sm-search');
  const statusEl = document.getElementById('sync-status');
  const statusText = document.getElementById('sync-status-text');
  const userAvatar = document.getElementById('user-avatar');
  const userDisplayName = document.getElementById('user-displayname');
  const userRole = document.getElementById('user-role');
  const btnLogout = document.getElementById('btn-logout');
  const btnAdmin = document.getElementById('btn-admin');
  const auditList = document.getElementById('audit-list');
  const auditFilterInput = document.getElementById('audit-filter-input');
  const auditExportBtn = document.getElementById('audit-export');

  // ---------- Constants ----------
  const COLORS = ['c-purple','c-teal','c-coral','c-pink','c-blue','c-amber','c-green','c-red','c-gray'];
  const COLOR_HEX = {
    'c-purple': {bg:'#EEEDFE', border:'#7F77DD', text:'#3C3489'},
    'c-teal':   {bg:'#E1F5EE', border:'#1D9E75', text:'#085041'},
    'c-coral':  {bg:'#FAECE7', border:'#D85A30', text:'#712B13'},
    'c-pink':   {bg:'#FBEAF0', border:'#D4537E', text:'#72243E'},
    'c-blue':   {bg:'#E6F1FB', border:'#378ADD', text:'#0C447C'},
    'c-amber':  {bg:'#FAEEDA', border:'#EF9F27', text:'#633806'},
    'c-green':  {bg:'#EAF3DE', border:'#639922', text:'#27500A'},
    'c-red':    {bg:'#FCEBEB', border:'#E24B4A', text:'#791F1F'},
    'c-gray':   {bg:'#F1EFE8', border:'#888780', text:'#444441'}
  };

  // ---------- State ----------
  let state = { categories: [] };
  let view = { zoom: 'day', anchor: startOfDay(new Date()) };
  let searchTerm = '';
  let editingTile = null;
  let currentUser = null;
  let token = localStorage.getItem('sm-token') || '';
  let ws = null;
  let wsReconnectTimer = null;
  let pendingSave = null;
  let pendingEvents = []; // queued audit events to send with next save
  let auditLog = [];
  let auditFilter = '';

  function setStatus(kind, text){
    statusEl.className = 'sync-status ' + kind;
    statusText.textContent = text;
  }

  // ---------- API ----------
  async function api(path, opts){
    opts = opts || {};
    opts.headers = Object.assign({
      'Content-Type': 'application/json'
    }, opts.headers || {});
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(path, opts);
    return res;
  }

  // ---------- Auth flow ----------
  async function tryRestoreSession(){
    if (!token) return false;
    try {
      const res = await api('/api/me');
      if (res.ok){
        const data = await res.json();
        currentUser = data.user;
        return true;
      }
    } catch {}
    token = '';
    localStorage.removeItem('sm-token');
    return false;
  }

  async function doLogin(){
    loginError.textContent = '';
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    if (!username || !password){ loginError.textContent = 'Enter username and password.'; return; }
    loginSubmit.disabled = true;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username, password })
      });
      if (!res.ok){
        const err = await res.json().catch(() => ({}));
        loginError.textContent = err.error || 'Login failed.';
        loginSubmit.disabled = false;
        return;
      }
      const data = await res.json();
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('sm-token', token);
      showApp();
    } catch (e) {
      loginError.textContent = 'Connection error.';
    } finally {
      loginSubmit.disabled = false;
    }
  }

  async function doLogout(){
    try { await api('/api/logout', { method: 'POST' }); } catch {}
    token = '';
    currentUser = null;
    localStorage.removeItem('sm-token');
    if (ws) try { ws.close(); } catch {}
    location.reload();
  }

  function showLogin(){
    loginOverlay.style.display = 'flex';
    appRoot.style.display = 'none';
    setTimeout(() => loginUsername.focus(), 50);
  }

  async function showApp(){
    loginOverlay.style.display = 'none';
    appRoot.style.display = 'block';
    renderUserChip();
    btnAdmin.style.display = currentUser.role === 'admin' ? '' : 'none';
    await loadInitial();
    await loadAudit();
    render();
    connectWS();
  }

  function renderUserChip(){
    if (!currentUser) return;
    const initials = currentUser.displayName.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();
    userAvatar.textContent = initials;
    userDisplayName.textContent = currentUser.displayName;
    userRole.textContent = currentUser.role;
    userRole.className = 'user-role ' + (currentUser.role === 'admin' ? 'admin' : '');
  }

  // ---------- Live sync ----------
  function connectWS(){
    if (ws) try { ws.close(); } catch {}
    setStatus('connecting', 'Connecting...');
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}/api/ws`);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
    });
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === 'auth-ok'){
        setStatus('connected', 'Live');
      } else if (msg.type === 'auth-fail'){
        setStatus('error', 'Auth failed');
        doLogout();
      } else if (msg.type === 'schedule'){
        state = msg.data;
        render();
      } else if (msg.type === 'audit'){
        auditLog.push(msg.entry);
        if (auditLog.length > 2000) auditLog = auditLog.slice(-2000);
        renderAudit();
      }
    });
    ws.addEventListener('close', () => {
      setStatus('error', 'Disconnected — retrying...');
      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = setTimeout(connectWS, 2000);
    });
    ws.addEventListener('error', () => setStatus('error', 'Connection error'));
  }

  function queueEvent(action, summary){
    pendingEvents.push({ action, summary });
  }

  function pushState(){
    clearTimeout(pendingSave);
    pendingSave = setTimeout(async () => {
      const events = pendingEvents.splice(0);
      if (ws && ws.readyState === WebSocket.OPEN){
        ws.send(JSON.stringify({ type: 'update', data: state, events }));
      } else {
        await api('/api/schedule', {
          method: 'PUT',
          body: JSON.stringify({ schedule: state, events })
        }).catch(() => {});
      }
    }, 150);
  }

  async function loadInitial(){
    try {
      const res = await api('/api/schedule');
      if (res.ok){
        state = await res.json();
        if (!state.categories) state = { categories: [] };
      }
    } catch {}
  }

  async function loadAudit(){
    try {
      const res = await api('/api/audit');
      if (res.ok){
        const data = await res.json();
        auditLog = data.entries || [];
        renderAudit();
      }
    } catch {}
  }

  // ---------- Date helpers ----------
  function uid(){ return Math.random().toString(36).slice(2,9); }
  function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }

  function getRange(){
    const z = view.zoom;
    const a = new Date(view.anchor);
    if (z === 'hour'){
      const s = startOfDay(a);
      const e = new Date(s.getTime() + 24*3600000);
      return { start: s, end: e, unitMs: 3600000, cols: 24, unitLabel: h => String(h.getHours()).padStart(2,'0')+':00' };
    }
    if (z === 'day'){
      const s = startOfDay(a);
      const e = new Date(s.getTime() + 14*24*3600000);
      return { start: s, end: e, unitMs: 24*3600000, cols: 14,
               unitLabel: d => d.toLocaleDateString(undefined,{month:'short',day:'numeric'}) };
    }
    const s = startOfDay(a);
    const day = s.getDay();
    s.setDate(s.getDate() - day);
    const e = new Date(s.getTime() + 8*7*24*3600000);
    return { start: s, end: e, unitMs: 7*24*3600000, cols: 8,
             unitLabel: d => 'Wk ' + d.toLocaleDateString(undefined,{month:'short',day:'numeric'}) };
  }

  function shiftView(dir){
    const r = getRange();
    const ms = r.unitMs * Math.ceil(r.cols/2) * dir;
    view.anchor = new Date(view.anchor.getTime() + ms);
    render();
  }

  // ---------- Render schedule ----------
  function render(){
    const r = getRange();
    rangeEl.textContent = fmtRange(r);
    grid.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'sm-head';
    head.style.gridTemplateColumns = `180px repeat(${r.cols}, minmax(60px, 1fr))`;
    const hl = document.createElement('div');
    hl.className = 'sm-head-label';
    hl.textContent = 'Category / Employee';
    head.appendChild(hl);
    const now = new Date();
    for (let i=0; i<r.cols; i++){
      const t = new Date(r.start.getTime() + i*r.unitMs);
      const tEnd = new Date(t.getTime() + r.unitMs);
      const ch = document.createElement('div');
      ch.className = 'sm-col-head';
      if (now >= t && now < tEnd) ch.classList.add('today');
      ch.textContent = r.unitLabel(t);
      head.appendChild(ch);
    }
    grid.appendChild(head);

    if (!state.categories || !state.categories.length){
      const empty = document.createElement('div');
      empty.className = 'sm-empty';
      empty.textContent = 'No categories yet. Add one below to begin scheduling.';
      grid.appendChild(empty);
      return;
    }

    state.categories.forEach(cat => renderCategory(cat, r));
  }

  function fmtRange(r){
    const s = r.start, e = new Date(r.end.getTime() - 1);
    const opt = {year:'numeric', month:'short', day:'numeric'};
    return `${s.toLocaleDateString(undefined,opt)} → ${e.toLocaleDateString(undefined,opt)}`;
  }

  function matchesSearch(cat, emp, tiles){
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    if (cat.name.toLowerCase().includes(t)) return true;
    if (emp && emp.name.toLowerCase().includes(t)) return true;
    if (tiles && tiles.some(x => (x.note||'').toLowerCase().includes(t))) return true;
    return false;
  }

  function renderCategory(cat, r){
    const matchesCat = matchesSearch(cat, null, null);
    const wrapEl = document.createElement('div');
    wrapEl.className = 'sm-cat' + (cat.collapsed ? ' collapsed' : '');

    const hd = document.createElement('div');
    hd.className = 'sm-cat-head';
    const swatch = COLOR_HEX[cat.color] || COLOR_HEX['c-gray'];
    hd.innerHTML = `
      <span class="sm-caret">▼</span>
      <span style="width:10px; height:10px; border-radius:3px; background:${swatch.border}; flex-shrink:0;"></span>
      <span class="sm-cat-title">${escapeHtml(cat.name)}</span>
      <span class="sm-cat-count">${cat.employees.length} ${cat.employees.length===1?'person':'people'} · ${cat.tiles.length} shift${cat.tiles.length===1?'':'s'}</span>
      <span class="sm-cat-actions">
        <button data-act="rename">Rename</button>
        <button data-act="color">Color</button>
        <button data-act="delete">Delete</button>
      </span>
    `;
    hd.addEventListener('click', (ev) => {
      if (ev.target.closest('button')){
        const act = ev.target.dataset.act;
        ev.stopPropagation();
        if (act === 'rename') renameCategory(cat);
        else if (act === 'color') cycleColor(cat);
        else if (act === 'delete') deleteCategory(cat);
        return;
      }
      // Collapse toggle does not log (per spec: structural + shift edits only)
      cat.collapsed = !cat.collapsed;
      pushState(); render();
    });
    wrapEl.appendChild(hd);

    const rowsEl = document.createElement('div');
    rowsEl.className = 'sm-rows';
    cat.employees.forEach(emp => {
      const empTiles = cat.tiles.filter(t => t.empId === emp.id);
      const visible = !searchTerm || matchesCat || matchesSearch(cat, emp, empTiles);
      if (!visible) return;
      rowsEl.appendChild(renderRow(cat, emp, r));
    });

    const addEmp = document.createElement('div');
    addEmp.className = 'sm-add-row';
    addEmp.innerHTML = `
      <input type="text" placeholder="Add employee to ${escapeHtml(cat.name)}..." />
      <button>+ Add</button>
    `;
    const input = addEmp.querySelector('input');
    const btn = addEmp.querySelector('button');
    const doAdd = () => {
      const name = input.value.trim();
      if (!name) return;
      cat.employees.push({ id: 'e'+uid(), name });
      queueEvent('employee.create', `added employee "${name}" to ${cat.name}`);
      pushState(); render();
    };
    btn.addEventListener('click', doAdd);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
    rowsEl.appendChild(addEmp);

    wrapEl.appendChild(rowsEl);
    grid.appendChild(wrapEl);
  }

  function renderRow(cat, emp, r){
    const row = document.createElement('div');
    row.className = 'sm-row';
    row.style.gridTemplateColumns = `180px repeat(${r.cols}, minmax(60px, 1fr))`;

    const label = document.createElement('div');
    label.className = 'sm-row-label';
    const initials = emp.name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();
    const color = getColorFor(cat, emp);
    const swatch = COLOR_HEX[color];
    label.innerHTML = `
      <span class="sm-avatar" style="background:${swatch.bg}; color:${swatch.text};">${escapeHtml(initials)}</span>
      <span class="sm-row-name">${escapeHtml(emp.name)}</span>
      <button data-act="del-emp" style="height:20px; padding:0 6px; font-size:11px; opacity:0.5;" title="Remove employee">×</button>
    `;
    label.querySelector('[data-act="del-emp"]').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (confirm(`Remove ${emp.name} and all their shifts?`)){
        const shiftCount = cat.tiles.filter(t => t.empId === emp.id).length;
        cat.employees = cat.employees.filter(e => e.id !== emp.id);
        cat.tiles = cat.tiles.filter(t => t.empId !== emp.id);
        queueEvent('employee.delete', `removed "${emp.name}" from ${cat.name}${shiftCount ? ` (${shiftCount} shift${shiftCount>1?'s':''} also deleted)` : ''}`);
        pushState(); render();
      }
    });
    row.appendChild(label);

    const now = new Date();
    for (let i=0; i<r.cols; i++){
      const t = new Date(r.start.getTime() + i*r.unitMs);
      const tEnd = new Date(t.getTime() + r.unitMs);
      const cell = document.createElement('div');
      cell.className = 'sm-cell';
      if (now >= t && now < tEnd) cell.classList.add('today-col');
      cell.addEventListener('dblclick', (ev) => {
        if (ev.target !== cell) return;
        createTileAt(cat, emp, i, r);
      });
      row.appendChild(cell);
    }

    const track = document.createElement('div');
    track.style.position = 'absolute';
    track.style.top = '0'; track.style.bottom = '0';
    track.style.left = '180px'; track.style.right = '0';
    track.style.pointerEvents = 'none';
    row.appendChild(track);

    const nowOff = timeToOffset(now, r);
    if (nowOff !== null){
      const nl = document.createElement('div');
      nl.className = 'sm-now-line';
      nl.style.left = (nowOff*100) + '%';
      track.appendChild(nl);
    }

    const tiles = cat.tiles.filter(t => t.empId === emp.id);
    tiles.forEach(tile => {
      const startMs = new Date(tile.start).getTime();
      const endMs = new Date(tile.end).getTime();
      if (endMs <= r.start.getTime() || startMs >= r.end.getTime()) return;
      const clampedStart = Math.max(startMs, r.start.getTime());
      const clampedEnd = Math.min(endMs, r.end.getTime());
      const totalMs = r.end.getTime() - r.start.getTime();
      const leftPct = ((clampedStart - r.start.getTime()) / totalMs) * 100;
      const widthPct = ((clampedEnd - clampedStart) / totalMs) * 100;
      const el = buildTile(tile, cat, emp, leftPct, widthPct, r);
      track.appendChild(el);
    });

    return row;
  }

  function buildTile(tile, cat, emp, leftPct, widthPct, r){
    const color = getColorFor(cat, emp);
    const swatch = COLOR_HEX[color];
    const el = document.createElement('div');
    el.className = 'sm-tile';
    el.style.pointerEvents = 'auto';
    el.style.left = leftPct + '%';
    el.style.width = Math.max(widthPct, 1.5) + '%';
    el.style.background = swatch.bg;
    el.style.borderColor = swatch.border;
    el.style.color = swatch.text;

    const labelText = tile.note || fmtTileTime(tile);
    const hl = document.createElement('div'); hl.className = 'sm-tile-handle left';
    const hr = document.createElement('div'); hr.className = 'sm-tile-handle right';
    const lbl = document.createElement('span'); lbl.className = 'sm-tile-label';
    lbl.textContent = labelText;
    el.appendChild(hl); el.appendChild(lbl); el.appendChild(hr);

    el.addEventListener('dblclick', (ev) => {
      ev.stopPropagation();
      openTileEditor(tile, cat, emp);
    });

    attachTileDrag(el, tile, cat, emp, r);
    return el;
  }

  function fmtTileTime(tile){
    const s = new Date(tile.start); const e = new Date(tile.end);
    const sameDay = s.toDateString() === e.toDateString();
    const fmt = (d) => d.toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
    const fmtT = (d) => d.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
    if (sameDay) return `${fmt(s)} – ${fmtT(e)}`;
    return `${fmt(s)} – ${fmt(e)}`;
  }

  function fmtShiftShort(tile){
    const s = new Date(tile.start); const e = new Date(tile.end);
    const fmt = (d) => d.toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
    return `${fmt(s)} – ${fmt(e)}`;
  }

  function getColorFor(cat, emp){
    if (colorModeEl.value === 'employee'){
      let h = 0;
      for (let i=0;i<emp.id.length;i++) h = (h*31 + emp.id.charCodeAt(i)) >>> 0;
      return COLORS[h % COLORS.length];
    }
    return cat.color || 'c-gray';
  }

  function timeToOffset(t, r){
    const ms = t.getTime();
    if (ms < r.start.getTime() || ms > r.end.getTime()) return null;
    return (ms - r.start.getTime()) / (r.end.getTime() - r.start.getTime());
  }

  function attachTileDrag(el, tile, cat, emp, r){
    let mode = null, startX = 0, origStart = 0, origEnd = 0, trackWidth = 0;
    let beforeSnapshot = null;

    const onDown = (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      ev.preventDefault(); ev.stopPropagation();
      const target = ev.target;
      mode = target.classList.contains('sm-tile-handle')
        ? (target.classList.contains('left') ? 'resize-l' : 'resize-r')
        : 'move';
      trackWidth = el.parentElement.getBoundingClientRect().width;
      startX = ev.clientX;
      origStart = new Date(tile.start).getTime();
      origEnd = new Date(tile.end).getTime();
      beforeSnapshot = { start: tile.start, end: tile.end };
      el.classList.add('dragging');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const totalMs = r.end.getTime() - r.start.getTime();
      const msPerPx = totalMs / trackWidth;
      let deltaMs = dx * msPerPx;
      const snap = r.unitMs >= 24*3600000 ? 3600000*24 : (r.unitMs >= 3600000 ? 3600000 : r.unitMs);
      const snapMs = ev.shiftKey ? r.unitMs/4 : snap;
      deltaMs = Math.round(deltaMs / snapMs) * snapMs;

      let newStart = origStart, newEnd = origEnd;
      if (mode === 'move'){ newStart = origStart + deltaMs; newEnd = origEnd + deltaMs; }
      else if (mode === 'resize-l'){ newStart = Math.min(origStart + deltaMs, origEnd - snapMs); }
      else if (mode === 'resize-r'){ newEnd = Math.max(origEnd + deltaMs, origStart + snapMs); }
      tile.start = new Date(newStart).toISOString();
      tile.end = new Date(newEnd).toISOString();
      const leftPct = ((newStart - r.start.getTime()) / totalMs) * 100;
      const widthPct = ((newEnd - newStart) / totalMs) * 100;
      el.style.left = leftPct + '%';
      el.style.width = Math.max(widthPct, 1.5) + '%';
      el.querySelector('.sm-tile-label').textContent = tile.note || fmtTileTime(tile);
    };
    const onUp = () => {
      el.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      // Only log if something actually changed
      if (beforeSnapshot && (beforeSnapshot.start !== tile.start || beforeSnapshot.end !== tile.end)){
        const before = { start: beforeSnapshot.start, end: beforeSnapshot.end };
        const verb = mode === 'move' ? 'moved' : 'resized';
        queueEvent('shift.update', `${verb} ${emp.name}'s shift in ${cat.name}: ${fmtShiftShort(before)} → ${fmtShiftShort(tile)}`);
        pushState();
      }
      render();
    };
    el.addEventListener('mousedown', onDown);
  }

  function createTileAt(cat, emp, colIdx, r){
    const start = new Date(r.start.getTime() + colIdx * r.unitMs);
    const end = new Date(start.getTime() + r.unitMs);
    const tile = { id: 't'+uid(), empId: emp.id, start: start.toISOString(), end: end.toISOString(), note: '' };
    cat.tiles.push(tile);
    queueEvent('shift.create', `added shift for ${emp.name} in ${cat.name} (${fmtShiftShort(tile)})`);
    pushState(); render();
  }

  function openTileEditor(tile, cat, emp){
    if (editingTile) return;
    editingTile = tile.id;
    const bg = document.createElement('div');
    bg.className = 'sm-modal-bg';
    const fmtInput = (iso) => {
      const d = new Date(iso);
      const pad = (n)=>String(n).padStart(2,'0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    bg.innerHTML = `
      <div class="sm-modal" style="max-width:360px;">
        <h3>Edit shift</h3>
        <div style="font-size:12px; color:var(--color-text-secondary); margin-bottom:6px;">${escapeHtml(emp.name)} · ${escapeHtml(cat.name)}</div>
        <label>Note / label</label>
        <input type="text" id="sm-edit-note" value="${escapeHtml(tile.note||'')}" />
        <label>Start</label>
        <input type="datetime-local" id="sm-edit-start" value="${fmtInput(tile.start)}" />
        <label>End</label>
        <input type="datetime-local" id="sm-edit-end" value="${fmtInput(tile.end)}" />
        <div class="sm-modal-actions">
          <button id="sm-edit-del" style="color:var(--color-text-danger);">Delete</button>
          <button id="sm-edit-cancel">Cancel</button>
          <button id="sm-edit-save">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(bg);
    const close = () => { bg.remove(); editingTile = null; };
    bg.querySelector('#sm-edit-cancel').addEventListener('click', close);
    bg.addEventListener('click', (ev) => { if (ev.target === bg) close(); });
    bg.querySelector('#sm-edit-save').addEventListener('click', () => {
      const before = { note: tile.note || '', start: tile.start, end: tile.end };
      tile.note = bg.querySelector('#sm-edit-note').value.trim();
      const s = new Date(bg.querySelector('#sm-edit-start').value);
      const e = new Date(bg.querySelector('#sm-edit-end').value);
      if (!isNaN(s) && !isNaN(e) && e > s){
        tile.start = s.toISOString(); tile.end = e.toISOString();
      }
      const changes = [];
      if (before.note !== tile.note) changes.push(`note "${before.note}" → "${tile.note}"`);
      if (before.start !== tile.start || before.end !== tile.end){
        changes.push(`time ${fmtShiftShort(before)} → ${fmtShiftShort(tile)}`);
      }
      if (changes.length){
        queueEvent('shift.update', `edited ${emp.name}'s shift in ${cat.name}: ${changes.join('; ')}`);
      }
      pushState(); render(); close();
    });
    bg.querySelector('#sm-edit-del').addEventListener('click', () => {
      cat.tiles = cat.tiles.filter(t => t.id !== tile.id);
      queueEvent('shift.delete', `deleted ${emp.name}'s shift in ${cat.name} (${fmtShiftShort(tile)})`);
      pushState(); render(); close();
    });
  }

  function renameCategory(cat){
    const n = prompt('Rename category:', cat.name);
    if (n && n.trim() && n.trim() !== cat.name){
      const oldName = cat.name;
      cat.name = n.trim();
      queueEvent('category.rename', `renamed category "${oldName}" → "${cat.name}"`);
      pushState(); render();
    }
  }
  function cycleColor(cat){
    const i = COLORS.indexOf(cat.color);
    cat.color = COLORS[(i+1) % COLORS.length];
    queueEvent('category.update', `changed color of "${cat.name}"`);
    pushState(); render();
  }
  function deleteCategory(cat){
    if (confirm(`Delete "${cat.name}" and all its employees and shifts?`)){
      const empCount = cat.employees.length;
      const shiftCount = cat.tiles.length;
      state.categories = state.categories.filter(c => c.id !== cat.id);
      queueEvent('category.delete', `deleted category "${cat.name}" (${empCount} employee${empCount!==1?'s':''}, ${shiftCount} shift${shiftCount!==1?'s':''})`);
      pushState(); render();
    }
  }

  // ---------- Export ----------
  function exportJSON(){
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    downloadBlob(blob, 'schedule.json');
  }
  function exportCSV(){
    const rows = [['Category','Employee','Start','End','Note']];
    state.categories.forEach(c => {
      c.tiles.forEach(t => {
        const emp = c.employees.find(e => e.id === t.empId);
        rows.push([c.name, emp?emp.name:'(unknown)', t.start, t.end, t.note||'']);
      });
    });
    const csv = toCSV(rows);
    downloadBlob(new Blob([csv], {type:'text/csv'}), 'schedule.csv');
  }
  function exportAudit(){
    const rows = [['Timestamp','User','Username','Action','Summary']];
    auditLog.forEach(e => rows.push([e.timestamp, e.actor, e.actorUsername || '', e.action, e.summary]));
    downloadBlob(new Blob([toCSV(rows)], {type:'text/csv'}), 'audit-log.csv');
  }
  function toCSV(rows){
    return rows.map(r => r.map(cell => {
      const s = String(cell == null ? '' : cell);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
    }).join(',')).join('\n');
  }
  function downloadBlob(blob, name){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // ---------- Audit rendering ----------
  function actionCategoryClass(action){
    if (action.startsWith('shift.')) return action.endsWith('.delete') ? 'shift delete' : 'shift';
    if (action.startsWith('category.')) return action.endsWith('.delete') ? 'category delete' : 'category';
    if (action.startsWith('employee.')) return action.endsWith('.delete') ? 'employee delete' : 'employee';
    if (action.startsWith('user.')) return action.endsWith('.delete') ? 'user delete' : 'user';
    return '';
  }

  function fmtAuditTime(iso){
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    if (diff < 86400*7) return Math.floor(diff/86400) + 'd ago';
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }

  function renderAudit(){
    const filter = auditFilter.toLowerCase();
    const filtered = auditLog
      .slice()
      .reverse()
      .filter(e => !filter || (e.actor + ' ' + e.action + ' ' + e.summary).toLowerCase().includes(filter));

    if (!filtered.length){
      auditList.innerHTML = '<div class="audit-empty">' + (filter ? 'No matching entries.' : 'No activity yet.') + '</div>';
      return;
    }
    auditList.innerHTML = '';
    filtered.slice(0, 500).forEach(e => {
      const div = document.createElement('div');
      div.className = 'audit-entry';
      div.innerHTML = `
        <div class="audit-entry-head">
          <span class="audit-actor">${escapeHtml(e.actor || 'Unknown')}</span>
          <span class="audit-time" title="${escapeHtml(new Date(e.timestamp).toLocaleString())}">${fmtAuditTime(e.timestamp)}</span>
        </div>
        <div class="audit-summary"><span class="audit-action ${actionCategoryClass(e.action)}">${escapeHtml(e.action.split('.')[0])}</span>${escapeHtml(e.summary)}</div>
      `;
      auditList.appendChild(div);
    });
  }

  // ---------- Admin panel ----------
  async function openAdminPanel(){
    const res = await api('/api/users');
    if (!res.ok){ alert('Failed to load users.'); return; }
    const data = await res.json();
    const users = data.users;

    const bg = document.createElement('div');
    bg.className = 'sm-modal-bg';
    bg.innerHTML = `
      <div class="sm-modal">
        <h3>Manage users</h3>
        <div style="font-size:12px; color:var(--color-text-secondary);">Admins can add/edit/remove users. Editors can only edit the schedule.</div>
        <div class="admin-users" id="admin-users-list"></div>
        <div style="border-top:0.5px solid var(--color-border-tertiary); margin-top:14px; padding-top:14px;">
          <div style="font-size:13px; font-weight:500; margin-bottom:8px;">Add user</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <input type="text" id="new-username" placeholder="Username (login)" />
            <input type="text" id="new-displayname" placeholder="Display name" />
            <input type="password" id="new-password" placeholder="Password" />
            <select id="new-role"><option value="editor">Editor</option><option value="admin">Admin</option></select>
          </div>
          <button id="btn-add-user" style="margin-top:8px; width:100%; height:32px;">Add user</button>
        </div>
        <div class="sm-modal-actions">
          <button id="admin-close">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.querySelector('#admin-close').addEventListener('click', close);
    bg.addEventListener('click', (ev) => { if (ev.target === bg) close(); });

    const renderUserList = (userList) => {
      const listEl = bg.querySelector('#admin-users-list');
      listEl.innerHTML = '';
      userList.forEach(u => {
        const row = document.createElement('div');
        row.className = 'admin-user-row';
        row.innerHTML = `
          <span class="au-name"><strong>${escapeHtml(u.displayName)}</strong> <span style="color:var(--color-text-secondary); font-size:11px;">@${escapeHtml(u.username)}</span></span>
          <span class="au-role ${u.role === 'admin' ? 'admin' : ''}">${u.role}</span>
          <button data-act="password">Password</button>
          <button data-act="role">Make ${u.role === 'admin' ? 'editor' : 'admin'}</button>
          <button data-act="delete" ${u.username === currentUser.username ? 'disabled title="Cannot delete yourself"' : ''}>Delete</button>
        `;
        row.querySelector('[data-act="password"]').addEventListener('click', async () => {
          const p = prompt(`Set new password for ${u.displayName}:`);
          if (!p) return;
          const r = await api('/api/users/' + encodeURIComponent(u.username), { method: 'PATCH', body: JSON.stringify({ password: p }) });
          if (!r.ok){ alert('Failed.'); return; }
        });
        row.querySelector('[data-act="role"]').addEventListener('click', async () => {
          const newRole = u.role === 'admin' ? 'editor' : 'admin';
          const r = await api('/api/users/' + encodeURIComponent(u.username), { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
          if (!r.ok){ const err = await r.json().catch(()=>({})); alert(err.error || 'Failed.'); return; }
          const fresh = await api('/api/users'); const d = await fresh.json();
          renderUserList(d.users);
        });
        row.querySelector('[data-act="delete"]').addEventListener('click', async () => {
          if (!confirm(`Delete user "${u.displayName}"?`)) return;
          const r = await api('/api/users/' + encodeURIComponent(u.username), { method: 'DELETE' });
          if (!r.ok){ const err = await r.json().catch(()=>({})); alert(err.error || 'Failed.'); return; }
          const fresh = await api('/api/users'); const d = await fresh.json();
          renderUserList(d.users);
        });
        listEl.appendChild(row);
      });
    };
    renderUserList(users);

    bg.querySelector('#btn-add-user').addEventListener('click', async () => {
      const username = bg.querySelector('#new-username').value.trim();
      const displayName = bg.querySelector('#new-displayname').value.trim();
      const password = bg.querySelector('#new-password').value;
      const role = bg.querySelector('#new-role').value;
      if (!username || !displayName || !password){ alert('All fields required.'); return; }
      const r = await api('/api/users', { method: 'POST', body: JSON.stringify({ username, displayName, password, role }) });
      if (!r.ok){ const err = await r.json().catch(()=>({})); alert(err.error || 'Failed.'); return; }
      bg.querySelector('#new-username').value = '';
      bg.querySelector('#new-displayname').value = '';
      bg.querySelector('#new-password').value = '';
      const fresh = await api('/api/users'); const d = await fresh.json();
      renderUserList(d.users);
    });
  }

  // ---------- Wiring ----------
  loginSubmit.addEventListener('click', doLogin);
  [loginUsername, loginPassword].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); }));
  btnLogout.addEventListener('click', doLogout);
  btnAdmin.addEventListener('click', openAdminPanel);

  document.getElementById('sm-prev').addEventListener('click', () => shiftView(-1));
  document.getElementById('sm-next').addEventListener('click', () => shiftView(1));
  document.getElementById('sm-today').addEventListener('click', () => { view.anchor = startOfDay(new Date()); render(); });
  zoomEl.addEventListener('change', () => { view.zoom = zoomEl.value; render(); });
  colorModeEl.addEventListener('change', render);
  searchEl.addEventListener('input', () => { searchTerm = searchEl.value.trim(); render(); });
  document.getElementById('sm-export-json').addEventListener('click', exportJSON);
  document.getElementById('sm-export-csv').addEventListener('click', exportCSV);
  document.getElementById('sm-reset').addEventListener('click', () => {
    if (confirm('Clear all categories, employees, and shifts for EVERYONE? This cannot be undone.')){
      const catCount = state.categories.length;
      state = { categories: [] };
      queueEvent('schedule.reset', `cleared entire schedule (${catCount} categor${catCount===1?'y':'ies'})`);
      pushState(); render();
    }
  });
  document.getElementById('sm-add-cat').addEventListener('click', () => {
    const name = document.getElementById('sm-new-cat').value.trim();
    if (!name) return;
    const usedColors = state.categories.map(c => c.color);
    const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[state.categories.length % COLORS.length];
    state.categories.push({ id: 'cat'+uid(), name, color, collapsed: false, employees: [], tiles: [] });
    queueEvent('category.create', `added category "${name}"`);
    document.getElementById('sm-new-cat').value = '';
    pushState(); render();
  });
  document.getElementById('sm-new-cat').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('sm-add-cat').click();
  });
  auditFilterInput.addEventListener('input', () => { auditFilter = auditFilterInput.value.trim(); renderAudit(); });
  auditExportBtn.addEventListener('click', exportAudit);

  // Refresh relative timestamps every 30s
  setInterval(() => { if (appRoot.style.display !== 'none') renderAudit(); }, 30000);

  // ---------- Boot ----------
  (async () => {
    const restored = await tryRestoreSession();
    if (restored) showApp();
    else showLogin();
  })();
})();
</script>
</body>
</html>
