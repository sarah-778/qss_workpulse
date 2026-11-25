import { useMemo, useState } from 'react';
import Icon from './Icon';
import { CURRENCY } from '../config';
import { statusFromPct } from '../utils/calculations';
import { addDays, fmtLong, fmtShort, monthStart, prevMonthRange, todayISO } from '../utils/dates';
import { buildInvoice, hasPrice, money } from '../utils/signoff';
import { downloadFile, invoiceToCSV } from '../utils/csv';

const PRESETS = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'last', label: 'Last month' },
];

function rangeFor(id) {
  const today = todayISO();
  if (id === '7') return { from: addDays(today, -6), to: today };
  if (id === 'month') return { from: monthStart(today), to: today };
  if (id === 'last') return prevMonthRange(today);
  return { from: addDays(today, -29), to: today };
}

// Output against contract for a period, built only from days the client has confirmed.
export default function InvoiceReport({ client, logs, signoffs, readOnly }) {
  const [preset, setPreset] = useState('30');
  const [range, setRange] = useState(rangeFor('30'));
  const from = range.from <= range.to ? range.from : range.to;
  const to = range.from <= range.to ? range.to : range.from;

  const inv = useMemo(() => buildInvoice(client, logs, signoffs, from, to), [client, logs, signoffs, from, to]);
  const priced = hasPrice(client);
  const unit = client.unit.toLowerCase();

  const pick = (id) => { setPreset(id); setRange(rangeFor(id)); };
  const setEnd = (k) => (e) => { if (e.target.value) { setPreset('custom'); setRange((r) => ({ ...r, [k]: e.target.value })); } };
  const exportCSV = () => downloadFile(`${client.name.replace(/\s+/g, '-')}-invoice-report-${from}-to-${to}.csv`, invoiceToCSV(client, inv, from, to));

  return (
    <div className="stack">
      <div className="card pad stack-sm no-print">
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={`chip ${preset === p.id ? 'on' : ''}`} onClick={() => pick(p.id)}>{p.label}</button>
          ))}
        </div>
        <div className="filters">
          <label className="field"><span>From</span><input type="date" className="input" value={range.from} max={todayISO()} onChange={setEnd('from')} /></label>
          <label className="field"><span>To</span><input type="date" className="input" value={range.to} max={todayISO()} onChange={setEnd('to')} /></label>
          <button type="button" className="btn btn-sm btn-ghost" onClick={exportCSV}><Icon name="download" size={16} /> CSV</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => window.print()}><Icon name="printer" size={16} /> Print / PDF</button>
        </div>
      </div>

      <div className="print-only print-title">
        <h2>{client.name} · Invoice-ready work report</h2>
        <p>{fmtLong(from)} to {fmtLong(to)}</p>
      </div>

      <div className="kpis">
        <div className="card kpi">
          <span className="kpi-label">Confirmed output</span>
          <strong className="kpi-value">{inv.confirmedOutput.toLocaleString()}</strong>
          <span className="kpi-note">{unit} · {inv.confirmedDays} confirmed day{inv.confirmedDays === 1 ? '' : 's'}</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Against contract</span>
          <strong className="kpi-value" style={{ color: statusFromPct(inv.achievementPct, inv.confirmedDays > 0).hex }}>{inv.confirmedDays ? `${inv.achievementPct}%` : '—'}</strong>
          <span className="kpi-note">of {inv.confirmedContract.toLocaleString()} contracted</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Amount payable</span>
          <strong className="kpi-value" style={{ fontSize: '1.3rem' }}>{inv.amountPayable == null ? '—' : money(inv.amountPayable)}</strong>
          <span className="kpi-note">{priced ? `at ${money(client.unitPrice)} per unit` : readOnly ? 'no price set (Clients → Edit)' : 'no price set for this contract'}</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Not yet payable</span>
          <strong className="kpi-value" style={{ color: inv.awaitingDays + inv.disputedDays ? '#D97706' : undefined }}>{inv.awaitingDays + inv.disputedDays}</strong>
          <span className="kpi-note">{inv.awaitingDays} awaiting · {inv.disputedDays} disputed</span>
        </div>
      </div>

      <section className="card">
        <div className="card-head row-between">
          <h3 className="h3 m0">Day by day</h3>
          <span className="muted small">{inv.rows.length} day{inv.rows.length === 1 ? '' : 's'} with work recorded</span>
        </div>
        {inv.rows.length === 0 && <p className="empty">No work was recorded in this period.</p>}
        {inv.rows.length > 0 && (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Day</th><th className="num">Output</th><th className="num c-contract">Contract</th><th className="num">%</th><th>Client sign-off</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {inv.rows.map((r) => {
                  const ps = statusFromPct(r.pct, true);
                  return (
                    <tr key={r.date} className={r.confirmed ? '' : 'dim'}>
                      <td>{fmtShort(r.date)}</td>
                      <td className="num"><strong>{r.actual.toLocaleString()}</strong></td>
                      <td className="num c-contract">{r.target.toLocaleString()}</td>
                      <td className="num" style={{ color: ps.text, fontWeight: 700 }}>{r.pct}%</td>
                      <td><span className="pill pill-sm" style={{ background: r.state.soft, color: r.state.text }}>{r.state.label}</span></td>
                      <td className="num">{r.confirmed && r.amount != null ? money(r.amount) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total confirmed</td>
                  <td className="num">{inv.confirmedOutput.toLocaleString()}</td>
                  <td className="num c-contract">{inv.confirmedContract.toLocaleString()}</td>
                  <td className="num">{inv.confirmedDays ? `${inv.achievementPct}%` : '—'}</td>
                  <td>{inv.confirmedDays} day{inv.confirmedDays === 1 ? '' : 's'}</td>
                  <td className="num">{inv.amountPayable == null ? '—' : money(inv.amountPayable)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
      <p className="muted small m0">
        Only days the client has confirmed count towards the amount payable{priced ? ` (${CURRENCY}, at the price agreed when each day was confirmed)` : ''}. Greyed days are awaiting sign-off, disputed, or were changed after sign-off.
        {inv.unconfirmedOutput > 0 ? ` ${inv.unconfirmedOutput.toLocaleString()} ${unit} are not yet confirmed${inv.unconfirmedAmount ? ` (worth ${money(inv.unconfirmedAmount)} once confirmed)` : ''}.` : ''}
      </p>
    </div>
  );
}
