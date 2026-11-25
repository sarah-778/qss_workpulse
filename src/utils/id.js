export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'client';
