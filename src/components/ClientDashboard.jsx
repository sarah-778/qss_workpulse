import { useMemo, useState } from 'react';
import Icon from './Icon';
import StatusBanner from './StatusBanner';
import KpiCards from './KpiCards';
import ProgressBar from './ProgressBar';
import ShiftBreakdown from './ShiftBreakdown';
import TrendChart from './TrendChart';
import LogTable from './LogTable';
import PaceForecast from './PaceForecast';
import SignOffCard from './SignOffCard';
import PhotoProof from './PhotoProof';
import InvoiceReport from './InvoiceReport';
import { buildTrend, forecastDay, summariseDay } from '../utils/calculations';
import { findSignoff } from '../utils/signoff';
import { addDays, fmtLong, todayISO } from '../utils/dates';
import { downloadFile, logsToCSV } from '../utils/csv';

// The one screen the client cares about. Also reused (with edit buttons) by supervisors.
export default function ClientDashboard({ client, logs, signoffs = [], date, setDate, onEdit, onDelete }) {
  const [view, setView] = useState('day'); // 'day' | 'report'
  const summary = useMemo(() => summariseDay(client, logs, date), [client, logs, date]);
  const forecast = useMemo(() => forecastDay(client, summary, date), [client, summary, date]);
  const signoff = findSignoff(signoffs, client.id, date);
  const readOnly = Boolean(onEdit || onDelete); // supervisors get edit buttons and a read-only sign-off
  const trend = useMemo(() => buildTrend(client, logs, date, 7), [client, logs, date]);
  const clientLogs = logs.filter((l) => l.clientId === client.id);
  const dayLogs = [...summary.dayLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const isToday = date === todayISO();

  const exportCSV = () => {
    downloadFile(`${client.name.replace(/\s+/g, '-')}-work-report.csv`, logsToCSV(clientLogs, [client]));
  };

  const toggle = (
    <div className="toggle no-print" role="tablist" aria-label="Dashboard view">
      <button type="button" role="tab" aria-selected={view === 'day'} className={`toggle-btn ${view === 'day' ? 'on' : ''}`} onClick={() => setView('day')}>Daily view</button>
      <button type="button" role="tab" aria-selected={view === 'report'} className={`toggle-btn ${view === 'report' ? 'on' : ''}`} onClick={() => setView('report')}>Invoice report</button>
    </div>
  );

  if (view === 'report') {
    return (
      <div className="stack">
        {toggle}
        <InvoiceReport client={client} logs={clientLogs} signoffs={signoffs.filter((x) => x.clientId === client.id)} readOnly={readOnly} />
      </div>
    );
  }

  return (
    <div className="stack">
      {toggle}
      <div className="card datebar no-print">
        <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><Icon name="left" /></button>
        <div className="datebar-mid">
          <strong>{isToday ? 'Today' : fmtLong(date)}</strong>
          {isToday && <span className="muted small">{fmtLong(date)}</span>}
        </div>
        <button type="button" className="icon-btn" aria-label="Next day" onClick={() => setDate(addDays(date, 1))} disabled={date >= todayISO()}><Icon name="right" /></button>
        <input type="date" className="input date-input" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a date" />
        {!isToday && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDate(todayISO())}>Today</button>}
        <div className="spacer" />
        <button type="button" className="btn btn-sm btn-ghost" onClick={exportCSV}><Icon name="download" size={16} /> <span className="hide-xs">CSV</span></button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => window.print()}><Icon name="printer" size={16} /> <span className="hide-xs">Print report</span></button>
      </div>

      <div className="print-only print-title">
        <h2>{client.name} · Daily work report</h2>
        <p>{fmtLong(date)}</p>
      </div>

      <StatusBanner client={client} summary={summary} />
      <PaceForecast client={client} summary={summary} forecast={forecast} />
      <PhotoProof logs={dayLogs} />
      <SignOffCard key={`${client.id}-${date}`} client={client} summary={summary} date={date} signoff={signoff} readOnly={readOnly} />
      <KpiCards client={client} summary={summary} />
      <div className="two-col">
        <ProgressBar client={client} summary={summary} />
        <ShiftBreakdown client={client} summary={summary} />
      </div>
      <TrendChart client={client} days={trend} />
      <LogTable logs={dayLogs} client={client} onEdit={onEdit} onDelete={onDelete} title={`Records for ${isToday ? 'today' : date}`} />
    </div>
  );
}
