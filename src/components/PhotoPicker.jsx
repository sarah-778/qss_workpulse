import { useRef, useState } from 'react';
import Icon from './Icon';
import { PHOTO } from '../config';
import { fileToPhoto } from '../utils/photo';

// Supervisor side: take a picture with the phone camera or choose one from the gallery.
export default function PhotoPicker({ photos, onChange, stampText }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const room = PHOTO.max - photos.length;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, Math.max(room, 0));
    e.target.value = '';
    if (files.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const added = [];
      for (const f of files) added.push(await fileToPhoto(f, stampText()));
      onChange((prev) => [...prev, ...added].slice(0, PHOTO.max));
    } catch (ex) {
      setError(ex.message || 'Could not add that picture.');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id) => onChange((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="field">
      <span>5. Photo proof {PHOTO.required ? '(required)' : '(recommended)'}</span>
      <p className="muted small m0">The client sees these pictures with this record, so they can confirm the service is happening.</p>

      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((p) => (
            <div className="photo-tile" key={p.id}>
              <img src={p.data} alt="Attached work" />
              <button type="button" className="photo-remove" aria-label="Remove photo" onClick={() => remove(p.id)}><Icon name="x" size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="alert alert-error small" role="alert"><Icon name="warn" size={16} /> {error}</div>}

      <div className="row-gap">
        <button type="button" className="btn btn-soft" disabled={busy || room <= 0} onClick={() => cameraRef.current && cameraRef.current.click()}>
          <Icon name="camera" /> {busy ? 'Adding…' : 'Take photo'}
        </button>
        <button type="button" className="btn btn-ghost" disabled={busy || room <= 0} onClick={() => galleryRef.current && galleryRef.current.click()}>
          <Icon name="image" /> From gallery
        </button>
        <span className="muted small photo-count">{photos.length}/{PHOTO.max} added</span>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFiles} />
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
    </div>
  );
}
