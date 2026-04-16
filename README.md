// Durable Object: single source of truth for schedule + users + audit log

const DEFAULT_ADMIN = { username: 'admin', password: 'admin', displayName: 'Administrator', role: 'admin' };
const MAX_AUDIT_ENTRIES = 2000; // rolling log

export class ScheduleRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
    this.initPromise = this.init();
  }

  async init() {
    const users = await this.state.storage.get('users');
    if (!users) {
      // Seed default admin on first run
      const adminHash = await hashPassword(DEFAULT_ADMIN.password);
      await this.state.storage.put('users', [{
        username: DEFAULT_ADMIN.username,
        passwordHash: adminHash,
        displayName: DEFAULT_ADMIN.displayName,
        role: DEFAULT_ADMIN.role,
        createdAt: new Date().toISOString()
      }]);
    }
  }

  async fetch(request) {
    await this.initPromise;
    const url = new URL(request.url);
    const method = request.method;

    try {
      if (url.pathname === '/api/login' && method === 'POST') return this.handleLogin(request);
      if (url.pathname === '/api/logout' && method === 'POST') return this.handleLogout(request);
      if (url.pathname === '/api/me' && method === 'GET') return this.handleMe(request);
      if (url.pathname === '/api/users' && method === 'GET') return this.handleListUsers(request);
      if (url.pathname === '/api/users' && method === 'POST') return this.handleCreateUser(request);
      if (url.pathname.startsWith('/api/users/') && method === 'DELETE') return this.handleDeleteUser(request, url);
      if (url.pathname.startsWith('/api/users/') && method === 'PATCH') return this.handleUpdateUser(request, url);
      if (url.pathname === '/api/schedule' && method === 'GET') return this.handleGetSchedule(request);
      if (url.pathname === '/api/schedule' && method === 'PUT') return this.handlePutSchedule(request);
      if (url.pathname === '/api/audit' && method === 'GET') return this.handleGetAudit(request);
      if (url.pathname === '/api/ws') return this.handleWebSocket(request);
    } catch (err) {
      return new Response('Server error: ' + err.message, { status: 500 });
    }
    return new Response('Not found', { status: 404 });
  }

  // ---------- Auth helpers ----------

  async getUsers() {
    return (await this.state.storage.get('users')) || [];
  }

  async saveUsers(users) {
    await this.state.storage.put('users', users);
  }

  async getSessions() {
    return (await this.state.storage.get('sessions_map')) || {};
  }

  async saveSessions(map) {
    await this.state.storage.put('sessions_map', map);
  }

  async authFromRequest(request) {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return null;
    const sessions = await this.getSessions();
    const s = sessions[token];
    if (!s) return null;
    // Expire after 30 days
    if (Date.now() - s.createdAt > 30 * 24 * 3600 * 1000) {
      delete sessions[token];
      await this.saveSessions(sessions);
      return null;
    }
    const users = await this.getUsers();
    const user = users.find(u => u.username === s.username);
    if (!user) return null;
    return { user, token };
  }

  async handleLogin(request) {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;
    if (!username || !password) return Response.json({ error: 'Missing credentials' }, { status: 400 });
    const users = await this.getUsers();
    const user = users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    const sessions = await this.getSessions();
    sessions[token] = { username: user.username, createdAt: Date.now() };
    await this.saveSessions(sessions);

    return Response.json({
      token,
      user: sanitizeUser(user)
    });
  }

  async handleLogout(request) {
    const auth = await this.authFromRequest(request);
    if (auth) {
      const sessions = await this.getSessions();
      delete sessions[auth.token];
      await this.saveSessions(sessions);
    }
    return Response.json({ ok: true });
  }

  async handleMe(request) {
    const auth = await this.authFromRequest(request);
    if (!auth) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    return Response.json({ user: sanitizeUser(auth.user) });
  }

  // ---------- User management (admin only) ----------

  async handleListUsers(request) {
    const auth = await this.authFromRequest(request);
    if (!auth || auth.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const users = await this.getUsers();
    return Response.json({ users: users.map(sanitizeUser) });
  }

  async handleCreateUser(request) {
    const auth = await this.authFromRequest(request);
    if (!auth || auth.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const { username, password, displayName, role } = body;
    if (!username || !password || !displayName) {
      return Response.json({ error: 'username, password, displayName required' }, { status: 400 });
    }
    const users = await this.getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return Response.json({ error: 'Username already exists' }, { status: 409 });
    }
    const newUser = {
      username: String(username).trim(),
      passwordHash: await hashPassword(password),
      displayName: String(displayName).trim(),
      role: role === 'admin' ? 'admin' : 'editor',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    await this.saveUsers(users);
    await this.appendAudit({
      actor: auth.user.displayName,
      actorUsername: auth.user.username,
      action: 'user.create',
      summary: `created user "${newUser.displayName}" (${newUser.username}, ${newUser.role})`
    });
    return Response.json({ user: sanitizeUser(newUser) });
  }

  async handleUpdateUser(request, url) {
    const auth = await this.authFromRequest(request);
    if (!auth || auth.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const username = decodeURIComponent(url.pathname.split('/').pop());
    const body = await request.json().catch(() => ({}));
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx === -1) return Response.json({ error: 'User not found' }, { status: 404 });
    const user = users[idx];
    const changes = [];
    if (body.displayName && body.displayName !== user.displayName) {
      changes.push(`display name: "${user.displayName}" → "${body.displayName}"`);
      user.displayName = body.displayName;
    }
    if (body.password) {
      changes.push('password changed');
      user.passwordHash = await hashPassword(body.password);
    }
    if (body.role && body.role !== user.role && (body.role === 'admin' || body.role === 'editor')) {
      changes.push(`role: ${user.role} → ${body.role}`);
      user.role = body.role;
    }
    users[idx] = user;
    await this.saveUsers(users);
    if (changes.length) {
      await this.appendAudit({
        actor: auth.user.displayName,
        actorUsername: auth.user.username,
        action: 'user.update',
        summary: `updated user "${user.displayName}": ${changes.join(', ')}`
      });
    }
    return Response.json({ user: sanitizeUser(user) });
  }

  async handleDeleteUser(request, url) {
    const auth = await this.authFromRequest(request);
    if (!auth || auth.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const username = decodeURIComponent(url.pathname.split('/').pop());
    if (username === auth.user.username) return Response.json({ error: 'Cannot delete yourself' }, { status: 400 });
    let users = await this.getUsers();
    const target = users.find(u => u.username === username);
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });
    // Must keep at least one admin
    const remainingAdmins = users.filter(u => u.role === 'admin' && u.username !== username);
    if (remainingAdmins.length === 0) return Response.json({ error: 'Cannot remove the last admin' }, { status: 400 });
    users = users.filter(u => u.username !== username);
    await this.saveUsers(users);
    await this.appendAudit({
      actor: auth.user.displayName,
      actorUsername: auth.user.username,
      action: 'user.delete',
      summary: `deleted user "${target.displayName}" (${target.username})`
    });
    return Response.json({ ok: true });
  }

  // ---------- Schedule ----------

  async getSchedule() {
    const stored = await this.state.storage.get('schedule');
    return stored || { categories: [] };
  }

  async handleGetSchedule(request) {
    const auth = await this.authFromRequest(request);
    if (!auth) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    return Response.json(await this.getSchedule());
  }

  async handlePutSchedule(request) {
    const auth = await this.authFromRequest(request);
    if (!auth) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || !body.schedule || !Array.isArray(body.schedule.categories)) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const prev = await this.getSchedule();
    await this.state.storage.put('schedule', body.schedule);
    const events = Array.isArray(body.events) ? body.events : diffSchedule(prev, body.schedule);
    for (const ev of events) {
      await this.appendAudit({
        actor: auth.user.displayName,
        actorUsername: auth.user.username,
        action: ev.action,
        summary: ev.summary
      });
    }
    this.broadcast({ type: 'schedule', data: body.schedule });
    return Response.json({ ok: true });
  }

  // ---------- Audit ----------

  async appendAudit(entry) {
    const log = (await this.state.storage.get('audit')) || [];
    const full = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry
    };
    log.push(full);
    if (log.length > MAX_AUDIT_ENTRIES) log.splice(0, log.length - MAX_AUDIT_ENTRIES);
    await this.state.storage.put('audit', log);
    this.broadcast({ type: 'audit', entry: full });
    return full;
  }

  async handleGetAudit(request) {
    const auth = await this.authFromRequest(request);
    if (!auth) return Response.json({ error: 'Not authenticated' }, { status: 401 });
    const log = (await this.state.storage.get('audit')) || [];
    return Response.json({ entries: log });
  }

  // ---------- WebSocket ----------

  async handleWebSocket(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') return new Response('Expected WebSocket', { status: 426 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    const session = { ws: server, user: null };
    this.sessions.add(session);

    server.addEventListener('message', async (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.type === 'auth') {
        // Validate token
        const sessions = await this.getSessions();
        const s = sessions[msg.token];
        if (!s) { server.send(JSON.stringify({ type: 'auth-fail' })); return; }
        const users = await this.getUsers();
        const user = users.find(u => u.username === s.username);
        if (!user) { server.send(JSON.stringify({ type: 'auth-fail' })); return; }
        session.user = user;
        server.send(JSON.stringify({ type: 'auth-ok' }));
        const schedule = await this.getSchedule();
        server.send(JSON.stringify({ type: 'schedule', data: schedule }));
      } else if (msg.type === 'update' && session.user) {
        if (!msg.data || !Array.isArray(msg.data.categories)) return;
        const prev = await this.getSchedule();
        await this.state.storage.put('schedule', msg.data);
        const events = Array.isArray(msg.events) ? msg.events : diffSchedule(prev, msg.data);
        for (const ev of events) {
          await this.appendAudit({
            actor: session.user.displayName,
            actorUsername: session.user.username,
            action: ev.action,
            summary: ev.summary
          });
        }
        this.broadcast({ type: 'schedule', data: msg.data }, session);
      } else if (msg.type === 'ping') {
        server.send(JSON.stringify({ type: 'pong' }));
      }
    });

    const cleanup = () => this.sessions.delete(session);
    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(msg, except) {
    const payload = JSON.stringify(msg);
    for (const s of this.sessions) {
      if (s === except || !s.user) continue;
      try { s.ws.send(payload); } catch { this.sessions.delete(s); }
    }
  }
}

// ---------- Helpers ----------

function sanitizeUser(u) {
  return { username: u.username, displayName: u.displayName, role: u.role, createdAt: u.createdAt };
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, 100000);
  return `${toHex(salt)}:${toHex(hash)}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const hash = await pbkdf2(password, salt, 100000);
  return toHex(hash) === hashHex;
}

async function pbkdf2(password, salt, iterations) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(bits);
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i*2, 2), 16);
  return out;
}

// ---------- Schedule diff for audit events ----------
// Used as a fallback when the client doesn't send explicit events.
// Client-provided events are preferred because they're semantically richer.

function diffSchedule(prev, next) {
  const events = [];
  const prevCats = new Map((prev.categories || []).map(c => [c.id, c]));
  const nextCats = new Map((next.categories || []).map(c => [c.id, c]));

  for (const [id, cat] of nextCats) {
    if (!prevCats.has(id)) {
      events.push({ action: 'category.create', summary: `added category "${cat.name}"` });
    }
  }
  for (const [id, cat] of prevCats) {
    if (!nextCats.has(id)) {
      events.push({ action: 'category.delete', summary: `deleted category "${cat.name}"` });
    }
  }
  for (const [id, cat] of nextCats) {
    const prevCat = prevCats.get(id);
    if (!prevCat) continue;
    if (prevCat.name !== cat.name) {
      events.push({ action: 'category.rename', summary: `renamed category "${prevCat.name}" → "${cat.name}"` });
    }
    const prevEmps = new Map((prevCat.employees || []).map(e => [e.id, e]));
    const nextEmps = new Map((cat.employees || []).map(e => [e.id, e]));
    for (const [eid, emp] of nextEmps) {
      if (!prevEmps.has(eid)) events.push({ action: 'employee.create', summary: `added employee "${emp.name}" to ${cat.name}` });
    }
    for (const [eid, emp] of prevEmps) {
      if (!nextEmps.has(eid)) events.push({ action: 'employee.delete', summary: `removed "${emp.name}" from ${cat.name}` });
    }
    const prevTiles = new Map((prevCat.tiles || []).map(t => [t.id, t]));
    const nextTiles = new Map((cat.tiles || []).map(t => [t.id, t]));
    for (const [tid, tile] of nextTiles) {
      const emp = cat.employees.find(e => e.id === tile.empId);
      const who = emp ? emp.name : '?';
      if (!prevTiles.has(tid)) {
        events.push({ action: 'shift.create', summary: `added shift for ${who} in ${cat.name} (${fmtShift(tile)})` });
      } else {
        const p = prevTiles.get(tid);
        const changed = [];
        if (p.start !== tile.start || p.end !== tile.end) changed.push(`time ${fmtShift(p)} → ${fmtShift(tile)}`);
        if ((p.note || '') !== (tile.note || '')) changed.push(`note "${p.note||''}" → "${tile.note||''}"`);
        if (changed.length) events.push({ action: 'shift.update', summary: `updated ${who}'s shift in ${cat.name}: ${changed.join('; ')}` });
      }
    }
    for (const [tid, tile] of prevTiles) {
      if (!nextTiles.has(tid)) {
        const emp = (prevCat.employees || []).find(e => e.id === tile.empId);
        const who = emp ? emp.name : '?';
        events.push({ action: 'shift.delete', summary: `deleted shift for ${who} in ${cat.name} (${fmtShift(tile)})` });
      }
    }
  }
  return events;
}

function fmtShift(t) {
  try {
    const s = new Date(t.start);
    const e = new Date(t.end);
    const fmt = (d) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `${fmt(s)} – ${fmt(e)}`;
  } catch { return '?'; }
}
