import { statusFromPct } from '../utils/calculations';
import { fmtTime } from '../utils/dates';

export default function ShiftBreakdown({ client, summary }) {
  return (
    <section className="card pad">
      <div className="eyebrow">Shift by shift</div>
      <h3 className="h3">What each team delivered</h3>
      <div className="shift-list">
        {summary.shifts.map((s) => {
          const st = statusFromPct(s.pct, s.logged);
          const last = s.entries[0];
          return (
            <div className="shift-row" key={s.shift.id}>
              <div className="row-between">
                <div>
                  <strong>{s.shift.name}</strong>
                  <span className="muted small"> · {s.shift.hours}</span>
                </div>
                <span className="pill" style={{ background: st.soft, color: st.text }}>
                  {s.logged ? `${st.label} · ${s.pct}%` : 'Not reported yet'}
                </span>
              </div>
              <div className="progress progress-sm">
                <div className="progress-fill" style={{ width: `${Math.min(s.pct, 100)}%`, background: st.hex }} />
              </div>
              <div className="row-between muted small">
                <span>{s.actual.toLocaleString()} of {s.target.toLocaleString()} {client.unit.toLowerCase()}</span>
                {last && <span>{last.issue} · {fmtTime(last.createdAt)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
