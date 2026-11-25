import Icon from './Icon';

export default function StatusBanner({ client, summary }) {
  const { status } = summary;
  const icon = status.level === 'green' ? 'check' : status.level === 'amber' ? 'warn' : status.level === 'red' ? 'octagon' : 'clock';

  let message;
  if (!summary.hasData) {
    message = 'No shift has been reported for this day yet.';
  } else if (summary.complete) {
    message = `All shifts reported. ${summary.totalActual.toLocaleString()} of ${summary.dailyTarget.toLocaleString()} ${client.unit.toLowerCase()} delivered.`;
  } else {
    message = `Day in progress. ${summary.totalActual.toLocaleString()} delivered against ${summary.expected.toLocaleString()} expected so far. Waiting for: ${summary.pendingShifts.map((s) => s.name).join(', ')}.`;
  }

  return (
    <section className="card banner" style={{ borderLeft: `6px solid ${status.hex}` }}>
      <div className="banner-icon" style={{ background: status.soft, color: status.hex }}>
        <Icon name={icon} size={30} />
      </div>
      <div className="banner-main">
        <div className="eyebrow">{client.name}{client.location ? ` · ${client.location}` : ''}</div>
        <div className="banner-status" style={{ color: status.text }}>{status.label}</div>
        <p className="muted">{message}</p>
      </div>
      <div className="banner-pct" style={{ background: status.soft, color: status.text }}>
        <strong>{summary.hasData ? `${summary.pacePct}%` : '—'}</strong>
        <span>{summary.complete ? 'of daily target' : 'of target so far'}</span>
      </div>
    </section>
  );
}
