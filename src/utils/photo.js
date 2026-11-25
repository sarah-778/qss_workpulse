import { PHOTO } from '../config';
import { uid } from './id';

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as a picture. Try a JPG or PNG.')); };
  img.src = url;
});

// Shrinks a camera/gallery picture and burns a small caption into the bottom edge
// (client, date, time, supervisor) so the photo itself carries its proof.
export async function fileToPhoto(file, stamp = '') {
  if (!file || !String(file.type).startsWith('image/')) throw new Error('Please choose a picture file.');
  const img = await loadImage(file);
  const scale = Math.min(1, PHOTO.maxEdge / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  if (stamp) {
    const bar = Math.max(26, Math.round(w * 0.055));
    ctx.fillStyle = 'rgba(16, 43, 70, 0.78)';
    ctx.fillRect(0, h - bar, w, bar);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${Math.round(bar * 0.5)}px system-ui, Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(stamp, Math.round(bar * 0.35), h - bar / 2, w - bar * 0.7);
  }
  return { id: uid(), data: canvas.toDataURL('image/jpeg', PHOTO.quality), at: new Date().toISOString(), stamp };
}
