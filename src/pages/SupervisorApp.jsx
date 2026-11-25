import { useMemo, useRef, useState } from 'react';
import Header from '../components/Header';
import Icon from '../components/Icon';
import ClientDashboard from '../components/ClientDashboard';
import RecordForm from '../components/RecordForm';
import ClientForm from '../components/ClientForm';
import LogTable from '../components/LogTable';
import { useStore } from '../context/StoreContext';
import { forecastDay, handoverNote, summariseDay } from '../utils/calculations';
import { findSignoff, money, signoffState, hasPrice } from '../utils/signoff';
import { copyText } from '../utils/clipboard';
import { addDays, fmtLong, fmtShort, todayISO } from '../utils/dates';
import { csvToLogs, downloadFile, logsToCSV } from '../utils/csv';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'record', label: 'Record', icon: 'plus' },
  { id: 'records', label: 'Records', icon: 'list' },
  { id: 'clients', label: 'Clients', icon: 'users' },
  { id: 'data', label: 'Data', icon: 'database' },
];

export default function SupervisorApp() {
  const { db } = useStore();
  const [tab, setTab] = useState('overview');
  const [date, setDate] = useState(todayISO());
  const [recordClientId, setRecordClientId] = useState(null);
  const [viewClientId, setViewClientId] = useState(null);
  const [editingLog, setEditingLog] = useState(null);

  const goRecord = (clientId) => { setRecordClientId(clientId); setTab('record'); window.scrollTo(0, 0); };

  return (
    <div className="app has-bottom-nav">
      <Header subtitle="Supervisor console" />
      <nav className="tabs no-print" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`tab ${tab === t.id ? 'on' : ''}`}
            onClick={() => { setTab(t.id); setViewClientId(null); window.scrollTo(0, 0); }}>
            <Icon name={t.icon} size={20} /><span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="container">
        {tab === 'overview' && (
          viewClientId
            ? <ViewClient clientId={viewClientId} date={date} setDate={setDate} onBack={() => setViewClientId(null)} onEdit={setEditingLog} />
            : <Overview date={date} setDate={setDate} onOpen={setViewClientId} onRecord={goRecord} />
        )}
        {tab === 'record' && (
          <div className="narrow">
            <RecordForm key={recordClientId || 'x'} clients={db.clients} initialClientId={recordClientId} initialDate={date} />
          </div>
        )}
        {tab === 'records' && <RecordsTab onEdit={setEditingLog} />}
        {tab === 'clients' && <ClientsTab onOpen={(id) => { setViewClientId(id); setTab('overview'); }} onRecord={goRecord} />}
        {tab === 'data' && <DataTab />}
      </main>

      {editingLog && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <RecordForm clients={db.clients} editing={editingLog} onDone={() => setEditingLog(null)} onCancel={() => setEditingLog(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function DateBar({ date, setDate }) {
  const isToday = date === todayISO();
  return (
    <div className="card datebar">
      <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><Icon name="left" /></button>
      <div className="datebar-mid"><strong>{isToday ? 'Today' : fmtLong(date)}</strong>{isToday && <span className="muted small">{fmtLong(date)}</span>}</div>
      <button type="button" className="icon-btn" aria-label="Next day" disabled={date >= todayISO()} onClick={() => setDate(addDays(date, 1))}><Icon name="right" /></button>
      <input type="date" className="input date-input" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a date" />
      {!isToday && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDate(todayISO())}>Today</button>}
    </div>
  );
}

function Overview({ date, setDate, onOpen, onRecord }) {
  const { db, notify } = useStore();
  const rows = useMemo(() => db.clients.map((c) => {
    const s = summariseDay(c, db.logs, date);
    return { client: c, s, fc: forecastDay(c, s, date), so: signoffState(findSignoff(db.signoffs, c.id, date), s, date) };
  }), [db, date]);
  const count = (lvl) => rows.filter((r) => r.s.status.level === lvl).length;

  // Everything that needs a supervisor's attention: catch-up needed on today's remaining shifts,
  // and days the client disputed (or that were corrected and are waiting for re-confirmation).
  const catchUps = rows.filter((r) => r.fc && !r.fc.onPace && !r.fc.reached);
  const disputes = useMemo(() => db.signoffs
    .filter((x) => x.decision === 'disputed')
    .map((x) => {
      const client = db.clients.find((c) => c.id === x.clientId);
      if (!client) return null;
      const state = signoffState(x, summariseDay(client, db.logs, x.date), x.date);
      return state.key === 'disputed' || state.key === 'revised' ? { so: x, client, state } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.so.date.localeCompare(a.so.date))
    .slice(0, 6), [db]);

  const copyNote = async (client, s, fc) => {
    const ok = await copyText(handoverNote(client, s, fc));
    notify(ok ? 'Handover note copied. Paste it into WhatsApp or SMS.' : 'Could not copy.', ok ? 'success' : 'error');
  };

  return (
    <div className="stack">
      <DateBar date={date} setDate={setDate} />
      <div className="kpis">
        <div className="card kpi"><span className="kpi-label">Clients</span><strong className="kpi-value">{rows.length}</strong></div>
        <div className="card kpi"><span className="kpi-label" style={{ color: '#166534' }}>On track</span><strong className="kpi-value" style={{ color: '#16A34A' }}>{count('green')}</strong></div>
        <div className="card kpi"><span className="kpi-label" style={{ color: '#92400E' }}>Behind</span><strong className="kpi-value" style={{ color: '#D97706' }}>{count('amber')}</strong></div>
        <div className="card kpi"><span className="kpi-label" style={{ color: '#991B1B' }}>At risk</span><strong className="kpi-value" style={{ color: '#DC2626' }}>{count('red')}</strong></div>
      </div>

      {(catchUps.length > 0 || disputes.length > 0) && (
        <section className="card pad stack-sm attention" aria-label="Needs attention">
          <div className="eyebrow">Needs your attention</div>
          {catchUps.map(({ client, s, fc }) => (
            <div className="attn-row" key={`cu-${client.id}`}>
              <div className="attn-main">
                <strong>{client.name}</strong> · on pace for <strong>{fc.projected.toLocaleString()}</strong> of {fc.dailyTarget.toLocaleString()}
                <div className="muted small">
                  {fc.needs.map((n) => `${n.shift.name} needs ${n.needed.toLocaleString()}${n.extra > 0 ? ` (+${n.extra.toLocaleString()} catch-up)` : ''}`).join(' · ')}
                  {fc.stretch ? ' · a stretch' : ''}
                </div>
              </div>
              <div className="row-gap">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyNote(client, s, fc)}><Icon name="copy" size={16} /> Handover note</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onRecord(client.id)}>Record</button>
              </div>
            </div>
          ))}
          {disputes.map(({ so, client, state }) => (
            <div className="attn-row" key={`ds-${so.id}`}>
              <div className="attn-main">
                <span className="pill pill-sm" style={{ background: state.soft, color: state.text }}>{state.key === 'disputed' ? 'DISPUTED' : 'FIXED · AWAITING CLIENT'}</span>{' '}
                <strong>{client.name}</strong> · {fmtShort(so.date)}
                <div className="muted small">“{so.reason}”</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDate(so.date); onOpen(client.id); }}><Icon name="eye" size={16} /> Review day</button>
            </div>
          ))}
        </section>
      )}

      {rows.length === 0 && <div className="card pad"><p className="empty">No clients yet. Open the Clients tab to add one.</p></div>}
      <div className="client-grid">
        {rows.map(({ client, s, fc, so }) => (
          <div className="card pad stack-sm" key={client.id} style={{ borderTop: `5px solid ${s.status.hex}` }}>
            <div className="row-between">
              <div><strong>{client.name}</strong><div className="muted small">{client.location || client.unit}</div></div>
              <span className="pill" style={{ background: s.status.soft, color: s.status.text }}>{s.status.label}</span>
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${Math.min(s.completionPct, 100)}%`, background: s.status.hex }} /></div>
            <div className="row-between small">
              <span><strong>{s.totalActual.toLocaleString()}</strong> / {s.dailyTarget.toLocaleString()} {client.unit.toLowerCase()}</span>
              <strong>{s.completionPct}%</strong>
            </div>
            {!s.complete && <div className="alert alert-info small">Waiting for: {s.pendingShifts.map((p) => p.name).join(', ')}</div>}
            {fc && (
              <div className="small" style={{ color: fc.status.text }}>
                Forecast: <strong>{fc.projected.toLocaleString()}</strong> of {fc.dailyTarget.toLocaleString()} ({fc.projectedPct}%)
              </div>
            )}
            <div className="row-between small">
              <span className="muted">Client sign-off</span>
              <span className="pill pill-sm" style={{ background: so.soft, color: so.text }}>{so.label}</span>
            </div>
            <div className="row-gap">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onRecord(client.id)}><Icon name="plus" size={16} /> Record work</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpen(client.id)}><Icon name="eye" size={16} /> Client view</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewClient({ clientId, date, setDate, onBack, onEdit }) {
  const { db, deleteLog, notify } = useStore();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return null;
  const remove = (l) => {
    if (window.confirm('Delete this record? The client will no longer see it.')) {
      const r = deleteLog(l.id);
      notify(r.ok ? 'Record deleted.' : r.error, r.ok ? 'success' : 'error');
    }
  };
  return (
    <div className="stack">
      <button type="button" className="btn btn-ghost btn-sm self-start no-print" onClick={onBack}><Icon name="left" size={16} /> All clients</button>
      <div className="alert alert-info small no-print">This is exactly what <strong>{client.name}</strong> sees when they log in (plus edit buttons for you).</div>
      <ClientDashboard client={client} logs={db.logs} signoffs={db.signoffs} date={date} setDate={setDate} onEdit={onEdit} onDelete={remove} />
    </div>
  );
}

function RecordsTab({ onEdit }) {
  const { db, deleteLog, notify } = useStore();
  const [clientId, setClientId] = useState('all');
  const [date, setDate] = useState('');
  const list = useMemo(() => db.logs
    .filter((l) => (clientId === 'all' || l.clientId === clientId) && (!date || l.date === date))
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
    .slice(0, 100), [db.logs, clientId, date]);
  const remove = (l) => {
    if (window.confirm('Delete this record?')) {
      const r = deleteLog(l.id);
      notify(r.ok ? 'Record deleted.' : r.error, r.ok ? 'success' : 'error');
    }
  };
  return (
    <div className="stack">
      <div className="card pad filters">
        <label className="field"><span>Client</span>
          <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="all">All clients</option>
            {db.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        <label className="field"><span>Date (optional)</span>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        {date && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate('')}>Clear date</button>}
      </div>
      <LogTable logs={list} clients={db.clients} showClient title="Work records (latest 100)" onEdit={onEdit} onDelete={remove} />
    </div>
  );
}

function ClientsTab({ onOpen, onRecord }) {
  const { db, deleteClient, notify } = useStore();
  const [mode, setMode] = useState(null); // null | 'new' | client object
  const [created, setCreated] = useState(null);

  const remove = (c) => {
    if (window.confirm(`Delete ${c.name}? This also deletes their login and ALL their work records.`)) {
      const r = deleteClient(c.id);
      notify(r.ok ? 'Client deleted.' : r.error, r.ok ? 'success' : 'error');
    }
  };
  const copy = (text) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => notify('Copied to clipboard.'), () => notify('Could not copy.', 'error'));
  };

  if (mode) {
    return (
      <div className="narrow">
        <ClientForm client={mode === 'new' ? null : mode} onCancel={() => setMode(null)}
          onDone={(res) => { setMode(null); if (res.client) setCreated(res); }} />
      </div>
    );
  }

  return (
    <div className="stack">
      {created && (
        <div className="card pad stack-sm creds">
          <div className="row-between">
            <strong><Icon name="check" size={18} /> {created.client.name} is ready. Give them these login details:</strong>
            <button type="button" className="icon-btn" onClick={() => setCreated(null)} aria-label="Dismiss"><Icon name="x" /></button>
          </div>
          <code className="cred-box">Username: {created.username}{'\n'}Password: {created.password}</code>
          <div className="row-gap">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(`QSS WorkPulse login\nUsername: ${created.username}\nPassword: ${created.password}`)}><Icon name="copy" size={16} /> Copy details</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onRecord(created.client.id)}><Icon name="plus" size={16} /> Record first shift</button>
          </div>
        </div>
      )}
      <div className="row-between">
        <h2 className="h2 m0">Clients ({db.clients.length})</h2>
        <button type="button" className="btn btn-primary" onClick={() => setMode('new')}><Icon name="userPlus" size={18} /> New client</button>
      </div>
      {db.clients.length === 0 && <div className="card pad"><p className="empty">No clients yet.</p></div>}
      <div className="client-grid">
        {db.clients.map((c) => {
          const u = db.users.find((x) => x.clientId === c.id);
          return (
            <div className="card pad stack-sm" key={c.id}>
              <div><strong>{c.name}</strong><div className="muted small">{c.location || '—'}</div></div>
              <div className="meta-grid small">
                <span className="muted">Counts</span><span>{c.unit}</span>
                <span className="muted">Shift target</span><span>{c.shiftTarget.toLocaleString()}</span>
                <span className="muted">Daily target</span><span>{c.dailyTarget.toLocaleString()}</span>
                <span className="muted">Price / unit</span><span>{hasPrice(c) ? money(c.unitPrice) : '—'}</span>
                <span className="muted">Login</span><span><code>{u ? u.username : 'none'}</code></span>
              </div>
              <div className="row-gap">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpen(c.id)}><Icon name="eye" size={16} /> View</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(c)}><Icon name="edit" size={16} /> Edit</button>
                <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => remove(c)}><Icon name="trash" size={16} /> Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataTab() {
  const { db, user, importLogs, importDB, exportDB, resetDemo, notify } = useStore();
  const csvRef = useRef(null);
  const jsonRef = useRef(null);
  const [report, setReport] = useState(null);

  const readFile = (file, cb) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => cb(String(r.result));
    r.readAsText(file);
  };

  const onCSV = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    readFile(file, (text) => {
      const { logs, errors } = csvToLogs(text, db.clients, user);
      if (logs.length) importLogs(logs);
      setReport({ ok: logs.length, errors });
      notify(logs.length ? `Imported ${logs.length} record(s).` : 'Nothing imported.', logs.length ? 'success' : 'error');
    });
  };
  const onJSON = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!window.confirm('Importing replaces ALL current data (clients, logins and records). Continue?')) return;
    readFile(file, (text) => {
      const r = importDB(text);
      notify(r.ok ? 'Backup restored.' : r.error, r.ok ? 'success' : 'error');
    });
  };
  const onReset = () => {
    if (window.confirm('Reset to the original demo data? Everything you added will be lost.')) {
      resetDemo(); notify('Demo data restored.');
    }
  };

  return (
    <div className="stack narrow-wide">
      <section className="card pad stack-sm">
        <h3 className="h3 m0">Add many records at once (CSV)</h3>
        <p className="muted small m0">Columns: <code>date, client, shift, actual, issue, note</code>. Date is <code>YYYY-MM-DD</code>; client and shift use the exact names shown in the app.</p>
        <div className="row-gap">
          <a className="btn btn-ghost btn-sm" href="/templates/work-log-template.csv" download><Icon name="download" size={16} /> Download template</a>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => csvRef.current.click()}><Icon name="upload" size={16} /> Import CSV</button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={onCSV} />
        </div>
        {report && (
          <div className={`alert ${report.errors.length ? 'alert-error' : 'alert-info'} small`}>
            <div><strong>{report.ok}</strong> record(s) imported{report.errors.length ? `, ${report.errors.length} line(s) skipped:` : '.'}</div>
            {report.errors.slice(0, 8).map((er) => <div key={er}>• {er}</div>)}
          </div>
        )}
      </section>

      <section className="card pad stack-sm">
        <h3 className="h3 m0">Export</h3>
        <div className="row-gap">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadFile('qss-all-work-records.csv', logsToCSV(db.logs, db.clients))}><Icon name="download" size={16} /> All records (CSV)</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadFile('qss-workpulse-backup.json', exportDB(), 'application/json')}><Icon name="download" size={16} /> Full backup (JSON)</button>
        </div>
      </section>

      <section className="card pad stack-sm">
        <h3 className="h3 m0">Backup &amp; reset</h3>
        <div className="row-gap">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => jsonRef.current.click()}><Icon name="upload" size={16} /> Restore backup (JSON)</button>
          <input ref={jsonRef} type="file" accept=".json,application/json" hidden onChange={onJSON} />
          <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={onReset}><Icon name="trash" size={16} /> Reset demo data</button>
        </div>
        <p className="muted small m0">Data is stored in this browser. See docs/DATA_FORMAT.md for how to connect a real database later.</p>
      </section>
    </div>
  );
}
