import Icon from './Icon';
import { FORECAST } from '../config';
import { useStore } from '../context/StoreContext';
import { handoverNote } from '../utils/calculations';
import { copyText } from '../utils/clipboard';

// "On pace for 940 of 1,000" + what the next shift must deliver to close the gap.
// Same card for clients (a heads-up) and supervisors (adds a copyable handover note).
export default function PaceForecast({ client, summary, forecast: f }) {
  const { user, notify } = useStore();
  if (!f) return null;
  const isSupervisor = user && user.role === 'supervisor';
  const unit = client.unit.toLowerCase();
  const { status } = f;

  const scale = Math.max(f.dailyTarget, f.projected, 1);
  const pct = (v) => `${Math.min((v / scale) * 100, 100)}%`;

  const headline = f.reached
    ? 'Daily target already reached'
    : `On pace for ${f.projected.toLocaleString()} of ${f.dailyTarget.toLocaleString()}`;
  const sub = f.reached
    ? `${f.delivered.toLocaleString()} ${unit} delivered. Anything the next shift adds is extra.`
    : f.onPace
      ? 'The day is projected to hit the target if the next shift matches the pace so far.'
      : `About ${f.gap.toLocaleString()} ${unit} short of target if the next shift only matches the pace so far.`;

  const copy = async () => {
    const ok = await copyText(handoverNote(client, summary, f));
    notify(ok ? 'Handover note copied. Paste it into WhatsApp or SMS.' : 'Could not copy.', ok ? 'success' : 'error');
  };

  return (
    <section className="card pad stack-sm forecast" style={{ borderLeft: `6px solid ${status.hex}` }}>
      <div className="row-between wrap">
        <div>
          <div className="eyebrow">{isSupervisor ? 'Catch-up alert for the next shift' : 'Pace forecast'}</div>
          <h3 className="h3 forecast-head" style={{ color: status.text }}>{headline}</h3>
          <p className="muted small m0">{sub}</p>
        </div>
        <span className="pill" style={{ background: status.soft, color: status.text }}>
          {f.projectedPct}% projected
        </span>
      </div>

      <div className="pace-bar" aria-hidden="true">
        <div className="pace-done" style={{ width: pct(f.delivered), background: status.hex }} />
        <div className="pace-proj" style={{ left: pct(f.delivered), width: `calc(${pct(f.projected)} - ${pct(f.delivered)})`, color: status.hex }} />
        <div className="pace-target" style={{ left: pct(f.dailyTarget) }}><span>Target</span></div>
      </div>
      <div className="row-between muted small">
        <span>Delivered so far: <strong>{f.delivered.toLocaleString()}</strong></span>
        <span>Daily target: <strong>{f.dailyTarget.toLocaleString()}</strong></span>
      </div>

      {!f.reached && (
        <div className="pace-needs">
          {f.needs.map((n) => (
            <div className="pace-need" key={n.shift.id}>
              <span>
                <strong>{n.shift.name}</strong> needs <strong>{n.needed.toLocaleString()}</strong> {unit}
                <span className="muted"> (normal target {n.target.toLocaleString()})</span>
              </span>
              {n.extra > 0 && <span className="pill pill-sm" style={{ background: '#FEF3C7', color: '#92400E' }}>+{n.extra.toLocaleString()} catch-up</span>}
              {n.extra <= 0 && <span className="pill pill-sm" style={{ background: '#DCFCE7', color: '#166534' }}>normal pace is enough</span>}
            </div>
          ))}
        </div>
      )}

      {f.stretch && (
        <div className="alert alert-error small">
          <Icon name="warn" size={16} />
          <span>That is a stretch: over {FORECAST.stretchPct}% of a normal shift. {isSupervisor ? 'Consider extra staff or overtime, and warn the client early.' : 'QSS has been alerted and will need a stronger-than-normal shift to close the gap.'}</span>
        </div>
      )}

      <div className="row-between wrap">
        <span className="muted small">Based on {f.runRatePct}% of target delivered so far. Updates as soon as a shift is recorded.</span>
        {isSupervisor && (
          <button type="button" className="btn btn-soft btn-sm no-print" onClick={copy}><Icon name="copy" size={16} /> Copy handover note</button>
        )}
      </div>
    </section>
  );
}
