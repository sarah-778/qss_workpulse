import { useState } from 'react';
import Icon from './Icon';
import { CURRENCY, SHIFTS, UNIT_SUGGESTIONS } from '../config';
import { useStore } from '../context/StoreContext';

const makePassword = () => `Qss@${Math.floor(1000 + Math.random() * 9000)}`;

// Create a client (with its login) or edit an existing one.
export default function ClientForm({ client, onDone, onCancel }) {
  const { db, addClient, updateClient, notify } = useStore();
  const clientUser = client ? db.users.find((u) => u.clientId === client.id) : null;
  const [f, setF] = useState({
    name: client?.name || '', location: client?.location || '', unit: client?.unit || '',
    shiftTarget: client ? String(client.shiftTarget) : '', dailyTarget: client ? String(client.dailyTarget) : '',
    unitPrice: client?.unitPrice ? String(client.unitPrice) : '',
    username: clientUser?.username || '', password: client ? '' : makePassword(),
  });
  const [dailyTouched, setDailyTouched] = useState(Boolean(client));
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const onShiftTarget = (e) => {
    const v = e.target.value;
    setF((p) => ({ ...p, shiftTarget: v, dailyTarget: dailyTouched ? p.dailyTarget : (v ? String(Number(v) * SHIFTS.length) : '') }));
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const res = client ? updateClient(client.id, f) : addClient(f);
    if (!res.ok) { setError(res.error); return; }
    notify(client ? 'Client updated.' : `Client "${f.name}" created.`);
    onDone(res);
  };

  return (
    <form className="card pad stack-sm" onSubmit={submit}>
      <div className="row-between">
        <div>
          <div className="eyebrow">{client ? 'Edit client' : 'New client'}</div>
          <h2 className="h2 m0">{client ? client.name : 'Add a client and their login'}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><Icon name="x" /></button>
      </div>
      {error && <div className="alert alert-error" role="alert"><Icon name="warn" size={16} /> {error}</div>}

      <label className="field"><span>Client / company name</span>
        <input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Nile Beverage Bottlers" required /></label>
      <label className="field"><span>Site / location</span>
        <input className="input" value={f.location} onChange={set('location')} placeholder="e.g. Luzira Industrial Park" /></label>
      <label className="field"><span>What is counted? (unit of work)</span>
        <input className="input" list="unit-list" value={f.unit} onChange={set('unit')} placeholder="e.g. Cartons Packed" required />
        <datalist id="unit-list">{UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}</datalist></label>

      <div className="two-fields">
        <label className="field"><span>Target per shift</span>
          <input type="number" inputMode="numeric" min="1" className="input" value={f.shiftTarget} onChange={onShiftTarget} required /></label>
        <label className="field"><span>Target per day</span>
          <input type="number" inputMode="numeric" min="1" className="input" value={f.dailyTarget}
            onChange={(e) => { setDailyTouched(true); set('dailyTarget')(e); }} required /></label>
      </div>
      <p className="muted small m0">Daily target is filled automatically ({SHIFTS.length} shifts × shift target) but you can change it to match the contract.</p>

      <label className="field"><span>Price per unit in {CURRENCY} (optional)</span>
        <input type="number" inputMode="decimal" min="0" step="any" className="input" value={f.unitPrice} onChange={set('unitPrice')} placeholder="e.g. 1200" /></label>
      <p className="muted small m0">If set, the client's invoice-ready report shows the amount payable for confirmed days. Leave blank to report quantities only. Days already confirmed keep the price they were confirmed at.</p>

      <div className="divider" />
      <div className="eyebrow">Client login</div>
      <div className="two-fields">
        <label className="field"><span>Username</span>
          <input className="input" value={f.username} onChange={set('username')} autoCapitalize="none" autoCorrect="off" placeholder="e.g. nilebev" required /></label>
        <label className="field"><span>{client ? 'New password (optional)' : 'Password'}</span>
          <input className="input" value={f.password} onChange={set('password')} placeholder={client ? 'Leave blank to keep' : ''} required={!client} /></label>
      </div>

      <div className="row-gap">
        <button type="submit" className="btn btn-primary"><Icon name="check" /> {client ? 'Save changes' : 'Create client'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
