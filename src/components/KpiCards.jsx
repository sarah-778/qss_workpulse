export default function KpiCards({ client, summary }) {
  const { status } = summary;
  const over = summary.variance > 0;
  return (
    <div className="kpis">
      <div className="card kpi">
        <span className="kpi-label">Daily target</span>
        <strong className="kpi-value">{summary.dailyTarget.toLocaleString()}</strong>
        <span className="kpi-note">{client.unit}</span>
      </div>
      <div className="card kpi">
        <span className="kpi-label">Work delivered</span>
        <strong className="kpi-value">{summary.totalActual.toLocaleString()}</strong>
        <span className="kpi-note">{summary.hasData ? 'recorded by supervisors' : 'nothing recorded yet'}</span>
      </div>
      <div className="card kpi">
        <span className="kpi-label">Of daily target</span>
        <strong className="kpi-value" style={{ color: status.hex }}>{summary.completionPct}%</strong>
        <span className="kpi-note">{over ? `${summary.variance.toLocaleString()} above target` : 'achieved so far'}</span>
      </div>
      <div className="card kpi">
        <span className="kpi-label">Still to go</span>
        <strong className="kpi-value">{summary.remaining.toLocaleString()}</strong>
        <span className="kpi-note">{summary.remaining === 0 ? 'target reached' : `${client.unit.toLowerCase()} left`}</span>
      </div>
    </div>
  );
}
