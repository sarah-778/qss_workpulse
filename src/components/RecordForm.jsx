import { useState } from 'react';
import Icon from './Icon';
import PhotoPicker from './PhotoPicker';
import { ISSUE_TAGS, SHIFTS } from '../config';
import { todayISO } from '../utils/dates';
import { forecastDay, summariseDay } from '../utils/calculations';
import { useStore } from '../context/StoreContext';

// Phone-first form. Used for new records and (with `editing`) for corrections.
export default function RecordForm({ clients, initialClientId, initialDate, editing, onDone, onCancel }) {
  const { db, user, addLog, updateLog, notify } = useStore();
  const [clientId, setClientId] = useState(editing ? editing.clientId : initialClientId || clients[0]?.id || '');
  const [date, setDate] = useState(editing ? editing.date : initialDate || todayISO());
  const [shiftId, setShiftId] = useState(editing ? editing.shiftId : SHIFTS[0].id);
  const [actual, setActual] = useState(editing ? String(editing.actual) : '');
  const [issue, setIssue] = useState(editing ? editing.issue : ISSUE_TAGS[0]);
  const [note, setNote] = useState(editing ? editing.note || '' : '');
  const [photos, setPhotos] = useState(editing && Array.isArray(editing.photos) ? editing.photos : []);
  const [error, setError] = useState('');

  const client = clients.find((c) => c.id === clientId);
  if (!client) return <div className="card pad"><p className="empty">Create a client first (Clients tab).</p></div>;

  const n = actual === '' ? null : Number(actual);
  const diff = n == null ? null : n - client.shiftTarget;
  const reported = (sid) => db.logs.some((l) => l.clientId === clientId && l.date === date && l.shiftId === sid && (!editing || l.id !== editing.id));
  // Catch-up hint: if an earlier shift fell short today, tell this shift what it must deliver.
  let need = null;
  if (!editing) {
    const f = forecastDay(client, summariseDay(client, db.logs, date), date);
    need = f && !f.reached ? f.needs.find((x) => x.shift.id === shiftId) : null;
  }
  // Caption burned into each picture: who, where, when.
  const stampText = () => {
    const t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${client.name} · ${date} ${t}${user ? ` · ${user.name}` : ''}`;
  };
  const bump = (delta) => setActual(String(Math.max(0, (Number(actual) || 0) + delta)));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const res = editing
      ? updateLog(editing.id, { actual, issue, note, shiftId, date, photos })
      : addLog({ clientId, date, shiftId, actual, issue, note, photos });
    if (!res.ok) { setError(res.error); return; }
    const photoMsg = photos.length ? ` with ${photos.length} photo${photos.length === 1 ? '' : 's'}` : '';
    notify(editing ? 'Record updated.' : `Recorded ${Number(actual).toLocaleString()} ${client.unit.toLowerCase()}${photoMsg}. The client can see it now.`);
    if (!editing) { setActual(''); setNote(''); setIssue(ISSUE_TAGS[0]); setPhotos([]); }
    if (onDone) onDone(res);
  };

  return (
    <form className="card pad stack-sm" onSubmit={submit}>
      <div className="row-between">
        <div>
          <div className="eyebrow">{editing ? 'Edit record' : 'Record new work'}</div>
          <h2 className="h2 m0">{client.name}</h2>
          <p className="muted small m0">Shift target: <strong>{client.shiftTarget.toLocaleString()}</strong> {client.unit.toLowerCase()}</p>
        </div>
        {onCancel && <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><Icon name="x" /></button>}
      </div>

      {error && <div className="alert alert-error" role="alert"><Icon name="warn" size={16} /> {error}</div>}

      {!editing && (
        <label className="field">
          <span>1. Client</span>
          <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>)}
          </select>
        </label>
      )}

      <div className="field">
        <span>2. Shift</span>
        <div className="seg">
          {SHIFTS.map((s) => (
            <button type="button" key={s.id} className={`seg-btn ${shiftId === s.id ? 'on' : ''}`} onClick={() => setShiftId(s.id)}>
              <strong>{s.name}</strong>
              <small>{s.hours}{reported(s.id) ? ' · reported ✓' : ''}</small>
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Date</span>
        <input type="date" className="input" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </label>

      <div className="field">
        <span>3. Work done ({client.unit})</span>
        <input
          type="number" inputMode="numeric" min="0" className="input qty-input" placeholder={`e.g. ${client.shiftTarget}`}
          value={actual} onChange={(e) => setActual(e.target.value)} required
        />
        <div className="stepper">
          {[-10, -1, 1, 10].map((d) => (
            <button type="button" key={d} className="btn btn-ghost" onClick={() => bump(d)}>{d > 0 ? `+${d}` : d}</button>
          ))}
          <button type="button" className="btn btn-soft" onClick={() => setActual(String(client.shiftTarget))}>= Target</button>
        </div>
        {need && need.extra > 0 && (
          <div className="alert alert-info small">
            <strong>Catch-up needed:</strong> to still hit today's target, this shift should deliver <strong>{need.needed.toLocaleString()}</strong> {client.unit.toLowerCase()} (normal target {need.target.toLocaleString()}, so <strong>+{need.extra.toLocaleString()}</strong> extra).
            {' '}<button type="button" className="linklike" onClick={() => setActual(String(need.needed))}>Use {need.needed.toLocaleString()}</button>
          </div>
        )}
        {diff != null && (
          <div className={`compare ${diff >= 0 ? 'good' : 'warn'}`}>
            {diff >= 0 ? `${diff.toLocaleString()} above shift target` : `${Math.abs(diff).toLocaleString()} below shift target`}
            {' '}({client.shiftTarget > 0 ? Math.round((n / client.shiftTarget) * 100) : 0}%)
          </div>
        )}
      </div>

      <div className="field">
        <span>4. What happened on shift?</span>
        <div className="chips">
          {ISSUE_TAGS.map((t) => (
            <button type="button" key={t} className={`chip ${issue === t ? 'on' : ''}`} onClick={() => setIssue(t)}>{t}</button>
          ))}
        </div>
      </div>

      <PhotoPicker photos={photos} onChange={setPhotos} stampText={stampText} />

      <label className="field">
        <span>Note for the client (optional)</span>
        <textarea className="input" rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Line 2 stopped for 30 min, caught up after lunch" />
      </label>

      <button type="submit" className="btn btn-primary btn-lg">
        <Icon name="check" /> {editing ? 'Save changes' : 'Record work output'}
      </button>
    </form>
  );
}
