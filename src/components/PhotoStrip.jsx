import { useEffect, useState } from 'react';
import Icon from './Icon';
import { fmtDateTime } from '../utils/dates';

// A row of thumbnails. Tapping one opens it full size (client and supervisor both use this).
export default function PhotoStrip({ photos, caption }) {
  const [open, setOpen] = useState(null); // index of the picture being viewed
  const list = photos || [];

  useEffect(() => {
    if (open == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % list.length);
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + list.length) % list.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, list.length]);

  if (list.length === 0) return null;
  const current = open != null ? list[open] : null;

  return (
    <>
      <div className="photo-strip">
        {list.map((p, i) => (
          <button type="button" key={p.id} className="photo-thumb" onClick={() => setOpen(i)} aria-label={`View photo ${i + 1} of ${list.length}`}>
            <img src={p.data} alt={`Work photo ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {current && (
        <div className="lightbox no-print" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="icon-btn lightbox-close" aria-label="Close photo" onClick={() => setOpen(null)}><Icon name="x" /></button>
            <img src={current.data} alt="Work photo, full size" />
            <div className="lightbox-bar">
              <span>{caption ? `${caption} · ` : ''}Taken {fmtDateTime(current.at)}</span>
              {list.length > 1 && (
                <span className="row-gap">
                  <button type="button" className="icon-btn" aria-label="Previous photo" onClick={() => setOpen((open - 1 + list.length) % list.length)}><Icon name="left" /></button>
                  <span>{open + 1} / {list.length}</span>
                  <button type="button" className="icon-btn" aria-label="Next photo" onClick={() => setOpen((open + 1) % list.length)}><Icon name="right" /></button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
