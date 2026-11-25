export default function ProgressBar({ client, summary }) {
  const w = Math.min(summary.completionPct, 100);
  return (
    <section className="card pad">
      <div className="row-between">
        <div>
          <div className="eyebrow">Daily progress</div>
          <h3 className="h3">{client.unit}</h3>
        </div>
        <strong className="big-pct" style={{ color: summary.status.hex }}>{summary.completionPct}%</strong>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={summary.completionPct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${w}%`, background: summary.status.hex }} />
      </div>
      <p className="muted small">
        {summary.totalActual.toLocaleString()} of {summary.dailyTarget.toLocaleString()} {client.unit.toLowerCase()}
      </p>
    </section>
  );
}
