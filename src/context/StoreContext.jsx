import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DB_KEY, DB_VERSION, PHOTO, SESSION_KEY } from '../config';
import { buildSeed } from '../data/seed';
import { slug, uid } from '../utils/id';
import { summariseDay } from '../utils/calculations';
import { canSignOff, makeSignoff } from '../utils/signoff';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

// Older saved data has no "signoffs" list yet; add it so nothing breaks.
const normalise = (d) => ({ ...d, signoffs: Array.isArray(d.signoffs) ? d.signoffs : [] });

function readDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.version === DB_VERSION && Array.isArray(d.clients) && Array.isArray(d.users) && Array.isArray(d.logs)) return normalise(d);
    }
  } catch { /* fall through to seed */ }
  const seeded = buildSeed();
  try { localStorage.setItem(DB_KEY, JSON.stringify(seeded)); } catch { /* storage blocked */ }
  return seeded;
}

const fail = (error) => ({ ok: false, error });

// Only keep well-formed pictures, and never more than the configured maximum.
const cleanPhotos = (list) => (Array.isArray(list) ? list : [])
  .filter((p) => p && typeof p.data === 'string' && p.data.startsWith('data:image/'))
  .slice(0, PHOTO.max)
  .map((p) => ({ id: p.id || uid(), data: p.data, at: p.at || new Date().toISOString(), stamp: p.stamp || '' }));

const STORAGE_FULL = 'Storage is full, so this could not be saved. Remove some photos or old records (Data tab > Export first), then try again.';
const isQuotaError = (e) => Boolean(e) && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);

export function StoreProvider({ children }) {
  const [db, setDb] = useState(readDB);
  // sessionStorage = one login per browser TAB, so you can keep a supervisor tab
  // and a client tab open side by side during the demo.
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem(SESSION_KEY));
  const [toast, setToast] = useState(null);
  const dbRef = useRef(db);
  dbRef.current = db;

  const user = db.users.find((u) => u.id === sessionId) || null;
  const userRef = useRef(user);
  userRef.current = user;

  // Live sync between tabs: a supervisor saves, the client tab updates.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === DB_KEY && e.newValue) {
        try { setDb(normalise(JSON.parse(e.newValue))); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: uid() });
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const commit = useCallback((updater) => {
    const next = updater(dbRef.current);
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(next));
    } catch (e) {
      // Out of space: refuse the change so the screen never shows data that would vanish on refresh.
      if (isQuotaError(e)) return false;
      /* any other storage problem (e.g. private mode): keep working in memory */
    }
    dbRef.current = next;
    setDb(next);
    return true;
  }, []);

  const isSupervisor = () => userRef.current && userRef.current.role === 'supervisor';

  // ---------- auth ----------
  const login = (username, password) => {
    const u = dbRef.current.users.find(
      (x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password,
    );
    if (!u) return fail('Wrong username or password.');
    sessionStorage.setItem(SESSION_KEY, u.id);
    setSessionId(u.id);
    return { ok: true, user: u };
  };
  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSessionId(null);
  };

  // ---------- work records ----------
  const addLog = ({ clientId, date, shiftId, actual, issue, note, photos }) => {
    if (!isSupervisor()) return fail('Only supervisors can record work.');
    const client = dbRef.current.clients.find((c) => c.id === clientId);
    if (!client) return fail('Choose a client.');
    const n = Number(actual);
    if (!Number.isFinite(n) || n < 0) return fail('Enter the quantity produced.');
    const pics = cleanPhotos(photos);
    if (PHOTO.required && pics.length === 0) return fail('Add at least one photo as proof of the work.');
    const log = {
      id: uid(), clientId, date, shiftId, actual: Math.round(n), target: client.shiftTarget,
      issue: issue || 'No Delays', note: (note || '').trim(), photos: pics,
      supervisorId: userRef.current.id, supervisorName: userRef.current.name,
      createdAt: new Date().toISOString(),
    };
    if (!commit((d) => ({ ...d, logs: [log, ...d.logs] }))) return fail(STORAGE_FULL);
    return { ok: true };
  };

  const updateLog = (id, fields) => {
    if (!isSupervisor()) return fail('Only supervisors can edit records.');
    const n = Number(fields.actual);
    if (!Number.isFinite(n) || n < 0) return fail('Enter the quantity produced.');
    const withPhotos = fields.photos !== undefined ? { photos: cleanPhotos(fields.photos) } : {};
    if (PHOTO.required && withPhotos.photos && withPhotos.photos.length === 0) return fail('Add at least one photo as proof of the work.');
    const saved = commit((d) => ({
      ...d,
      logs: d.logs.map((l) => (l.id === id
        ? { ...l, ...fields, ...withPhotos, actual: Math.round(n), note: (fields.note || '').trim() }
        : l)),
    }));
    if (!saved) return fail(STORAGE_FULL);
    return { ok: true };
  };

  const deleteLog = (id) => {
    if (!isSupervisor()) return fail('Only supervisors can delete records.');
    commit((d) => ({ ...d, logs: d.logs.filter((l) => l.id !== id) }));
    return { ok: true };
  };

  const importLogs = (logs) => {
    if (!isSupervisor()) return fail('Only supervisors can import.');
    commit((d) => ({ ...d, logs: [...logs, ...d.logs] }));
    return { ok: true, count: logs.length };
  };

  // ---------- client sign-off ----------
  // A client confirms or disputes ONE day of their own output. Numbers are snapshotted
  // (see utils/signoff.js) so the invoice stays stable. Supervisors cannot sign off for clients.
  const signOffDay = ({ clientId, date, decision, reason }) => {
    const u = userRef.current;
    if (!u || u.role !== 'client' || u.clientId !== clientId) return fail('Only the client can sign off their own work.');
    if (decision !== 'confirmed' && decision !== 'disputed') return fail('Choose Confirm or Dispute.');
    if (decision === 'disputed' && (reason || '').trim().length < 3) return fail('Please say briefly what looks wrong.');
    const client = dbRef.current.clients.find((c) => c.id === clientId);
    if (!client) return fail('Client not found.');
    const summary = summariseDay(client, dbRef.current.logs, date);
    if (!canSignOff(summary, date)) return fail('This day cannot be signed off yet. Wait until every shift has reported.');
    const record = makeSignoff(client, summary, date, { decision, reason: (reason || '').trim().slice(0, 300), user: u });
    commit((d) => ({
      ...d,
      signoffs: [record, ...d.signoffs.filter((x) => !(x.clientId === clientId && x.date === date))],
    }));
    return { ok: true };
  };

  // ---------- clients (supervisor only) ----------
  const validateTargets = (f) => {
    if (!f.name || !f.name.trim()) return 'Client name is required.';
    if (!f.unit || !f.unit.trim()) return 'Say what is being counted (e.g. Cartons Packed).';
    if (!(Number(f.shiftTarget) > 0)) return 'Shift target must be more than 0.';
    if (!(Number(f.dailyTarget) > 0)) return 'Daily target must be more than 0.';
    if (f.unitPrice !== '' && f.unitPrice != null && !(Number(f.unitPrice) >= 0)) return 'Price per unit must be a number (or leave it blank).';
    return null;
  };

  const priceOf = (f) => (f.unitPrice === '' || f.unitPrice == null || Number(f.unitPrice) === 0 ? null : Number(f.unitPrice));

  const addClient = (f) => {
    if (!isSupervisor()) return fail('Only supervisors can create clients.');
    const err = validateTargets(f);
    if (err) return fail(err);
    const username = (f.username || '').trim();
    if (username.length < 3) return fail('Login username must be at least 3 characters.');
    if (/\s/.test(username)) return fail('Username cannot contain spaces.');
    if (dbRef.current.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return fail('That username is already taken.');
    }
    if ((f.password || '').length < 6) return fail('Password must be at least 6 characters.');

    const clientId = `${slug(f.name)}-${uid().slice(-4)}`;
    const client = {
      id: clientId, name: f.name.trim(), location: (f.location || '').trim(), unit: f.unit.trim(),
      shiftTarget: Number(f.shiftTarget), dailyTarget: Number(f.dailyTarget), unitPrice: priceOf(f),
      createdAt: new Date().toISOString(),
    };
    const newUser = {
      id: `u-${clientId}`, username, password: f.password, name: client.name,
      role: 'client', clientId,
    };
    commit((d) => ({ ...d, clients: [...d.clients, client], users: [...d.users, newUser] }));
    return { ok: true, client, username, password: f.password };
  };

  const updateClient = (clientId, f) => {
    if (!isSupervisor()) return fail('Only supervisors can edit clients.');
    const err = validateTargets(f);
    if (err) return fail(err);
    const clientUser = dbRef.current.users.find((u) => u.clientId === clientId);
    const username = (f.username || '').trim();
    if (clientUser && username !== clientUser.username) {
      if (username.length < 3 || /\s/.test(username)) return fail('Username must be 3+ characters with no spaces.');
      if (dbRef.current.users.some((u) => u.id !== clientUser.id && u.username.toLowerCase() === username.toLowerCase())) {
        return fail('That username is already taken.');
      }
    }
    if (f.password && f.password.length < 6) return fail('New password must be at least 6 characters.');
    commit((d) => ({
      ...d,
      clients: d.clients.map((c) => (c.id === clientId ? {
        ...c, name: f.name.trim(), location: (f.location || '').trim(), unit: f.unit.trim(),
        shiftTarget: Number(f.shiftTarget), dailyTarget: Number(f.dailyTarget), unitPrice: priceOf(f),
      } : c)),
      users: d.users.map((u) => (u.clientId === clientId ? {
        ...u, name: f.name.trim(), username: username || u.username,
        password: f.password ? f.password : u.password,
      } : u)),
    }));
    return { ok: true };
  };

  const deleteClient = (clientId) => {
    if (!isSupervisor()) return fail('Only supervisors can delete clients.');
    commit((d) => ({
      ...d,
      clients: d.clients.filter((c) => c.id !== clientId),
      users: d.users.filter((u) => u.clientId !== clientId),
      logs: d.logs.filter((l) => l.clientId !== clientId),
      signoffs: d.signoffs.filter((x) => x.clientId !== clientId),
    }));
    return { ok: true };
  };

  // ---------- data tools ----------
  const exportDB = () => JSON.stringify(dbRef.current, null, 2);

  const importDB = (text) => {
    if (!isSupervisor()) return fail('Only supervisors can import.');
    let parsed;
    try { parsed = JSON.parse(text); } catch { return fail('That file is not valid JSON.'); }
    if (!parsed || !Array.isArray(parsed.clients) || !Array.isArray(parsed.users) || !Array.isArray(parsed.logs)) {
      return fail('File must contain "clients", "users" and "logs" lists.');
    }
    if (!parsed.users.some((u) => u.role === 'supervisor')) return fail('File must include at least one supervisor user.');
    const next = normalise({ ...parsed, version: DB_VERSION });
    commit(() => next);
    if (!next.users.some((u) => u.id === userRef.current.id)) logout();
    return { ok: true };
  };

  const resetDemo = () => {
    if (!isSupervisor()) return fail('Only supervisors can reset.');
    const seeded = buildSeed();
    commit(() => seeded);
    sessionStorage.setItem(SESSION_KEY, 'u-supervisor');
    setSessionId('u-supervisor');
    return { ok: true };
  };

  const value = {
    db, user, toast, notify,
    login, logout, addLog, updateLog, deleteLog, importLogs, signOffDay,
    addClient, updateClient, deleteClient, exportDB, importDB, resetDemo,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
