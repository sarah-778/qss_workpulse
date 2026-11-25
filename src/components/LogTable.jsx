import Icon from './Icon';
import PhotoStrip from './PhotoStrip';
import { SHIFTS } from '../config';
import { statusFromPct } from '../utils/calculations';
import { fmtTime } from '../utils/dates';

export default function LogTable({ logs, client, onEdit, onDelete, title = 'Work records', showClient, clients }) {
  return (
    <section className="card">
      <div className="card-head row-between">
        <h3 className="h3 m0">{title}</h3>
        <span className="muted small">{logs.length} record{logs.length === 1 ? '' : 's'}</span>
      </div>
      {logs.length === 0 && <p className="empty">No work has been recorded yet.</p>}
      <div className="log-list">
        {logs.map((l) => {
          const shift = SHIFTS.find((s) => s.id === l.shiftId);
          const pct = l.target > 0 ? Math.round((l.actual / l.target) * 100) : 0;
          const st = statusFromPct(pct, true);
          const c = client || (clients || []).find((x) => x.id === l.clientId);
          return (
            <div className="log" key={l.id}>
              <div className="log-main">
                {showClient && c && <div className="eyebrow">{c.name}</div>}
                <div className="log-title">
                  <strong>{shift ? shift.name : l.shiftId}</strong>
                  <span className="pill pill-sm" style={{ background: st.soft, color: st.text }}>{pct}%</span>
                </div>
                <div className="muted small">
                  {l.date} · {fmtTime(l.createdAt)} · {l.supervisorName} · {l.issue}
                </div>
                {l.note && <div className="log-note">“{l.note}”</div>}
                <PhotoStrip photos={l.photos} caption={shift ? shift.name : ''} />
              </div>
              <div className="log-qty">
                <strong>{Number(l.actual).toLocaleString()}</strong>
                <span className="muted small">of {Number(l.target).toLocaleString()}{c ? ` ${c.unit.toLowerCase()}` : ''}</span>
              </div>
              {(onEdit || onDelete) && (
                <div className="log-actions no-print">
                  {onEdit && <button type="button" className="icon-btn" aria-label="Edit record" onClick={() => onEdit(l)}><Icon name="edit" size={16} /></button>}
                  {onDelete && <button type="button" className="icon-btn danger" aria-label="Delete record" onClick={() => onDelete(l)}><Icon name="trash" size={16} /></button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
