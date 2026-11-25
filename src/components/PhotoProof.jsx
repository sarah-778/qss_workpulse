import Icon from './Icon';
import PhotoStrip from './PhotoStrip';
import { SHIFTS } from '../config';
import { fmtTime } from '../utils/dates';

// Client dashboard card: the pictures supervisors attached today, grouped by shift,
// shown just before the sign-off so the client can see the service is taking place.
export default function PhotoProof({ logs }) {
  const withPhotos = logs.filter((l) => Array.isArray(l.photos) && l.photos.length > 0);
  const total = withPhotos.reduce((n, l) => n + l.photos.length, 0);
  if (logs.length === 0) return null;

  return (
    <section className="card pad stack-sm">
      <div className="row-between wrap">
        <div>
          <div className="eyebrow">Photo proof</div>
          <h3 className="h3">{total > 0 ? 'Pictures from the site' : 'No pictures yet for this day'}</h3>
        </div>
        <span className="pill pill-sm" style={{ background: total > 0 ? '#DCFCE7' : '#E2E8F0', color: total > 0 ? '#166534' : '#475569' }}>
          <Icon name="camera" size={14} /> {total} photo{total === 1 ? '' : 's'}
        </span>
      </div>
      {total === 0 && <p className="muted small m0">The supervisor has not attached any photos to today&apos;s records yet.</p>}
      {withPhotos.map((l) => {
        const shift = SHIFTS.find((s) => s.id === l.shiftId);
        const label = `${shift ? shift.name : l.shiftId}`;
        return (
          <div key={l.id} className="stack-sm" style={{ gap: 8 }}>
            <div className="muted small"><strong>{label}</strong> · {fmtTime(l.createdAt)} · {l.supervisorName}</div>
            <PhotoStrip photos={l.photos} caption={label} />
          </div>
        );
      })}
    </section>
  );
}
