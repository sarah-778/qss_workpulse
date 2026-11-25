import { fmtWeekday } from '../utils/dates';

export default function TrendChart({ client, days }) {
  const max = Math.max(...days.map((d) => Math.max(d.actual, d.target)), 1);
  const targetFrac = days[0].target / max;
  return (
    <section className="card pad">
      <div className="row-between wrap">
        <div>
          <div className="eyebrow">Last 7 days</div>
          <h3 className="h3">Output vs daily target ({client.unit})</h3>
        </div>
        <div className="legend small muted">
          <span><i style={{ background: '#16A34A' }} />On track</span>
          <span><i style={{ background: '#F59E0B' }} />Behind</span>
          <span><i style={{ background: '#DC2626' }} />At risk</span>
        </div>
      </div>
      <div className="chart">
        <div className="plot">
          <div className="chart-target" style={{ bottom: `calc((100% - 18px) * ${targetFrac})` }}>
            <span>Target {days[0].target.toLocaleString()}</span>
          </div>
          {days.map((d) => {
            const frac = d.hasData ? Math.max(d.actual / max, 0.03) : 0.015;
            return (
              <div className="plot-col" key={d.date}>
                <span className="chart-val">{d.hasData ? d.actual.toLocaleString() : '–'}</span>
                <div
                  className="chart-bar"
                  style={{
                    height: `calc((100% - 18px) * ${frac})`,
                    background: d.status.hex,
                    opacity: d.complete || !d.hasData ? 1 : 0.55,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="axis">
          {days.map((d) => (
            <span key={d.date} className={d.isSelected ? 'on' : ''}>{d.isSelected ? 'Selected' : fmtWeekday(d.date)}</span>
          ))}
        </div>
      </div>
      <p className="muted small m0">Faded bars are days where not every shift has reported yet.</p>
    </section>
  );
}
