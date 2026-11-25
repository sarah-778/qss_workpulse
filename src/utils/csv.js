import { SHIFTS } from '../config';
import { isValidISO } from './dates';
import { CURRENCY } from '../config';

const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadFile(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function logsToCSV(logs, clients) {
  const header = ['date', 'client', 'shift', 'actual', 'target', 'achievement_pct', 'issue', 'note', 'supervisor', 'recorded_at'];
  const rows = [...logs]
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt))
    .map((l) => {
      const c = clients.find((x) => x.id === l.clientId);
      const sh = SHIFTS.find((s) => s.id === l.shiftId);
      return [
        l.date, c ? c.name : l.clientId, sh ? sh.name : l.shiftId, l.actual, l.target,
        l.target > 0 ? Math.round((l.actual / l.target) * 100) : '',
        l.issue, l.note, l.supervisorName, l.createdAt,
      ].map(esc).join(',');
    });
  return [header.join(','), ...rows].join('\n');
}

// Small CSV parser that understands quoted fields.
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQ = false;
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

// Turns CSV text into valid log objects. Returns { logs, errors }.
// Required columns: date, client, shift, actual. Optional: issue, note.
export function csvToLogs(text, clients, supervisor) {
  const rows = parseCSV(text);
  if (rows.length < 2) return { logs: [], errors: ['The file has no data rows.'] };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name) => head.indexOf(name);
  const need = ['date', 'client', 'shift', 'actual'];
  const missing = need.filter((n) => col(n) < 0);
  if (missing.length) return { logs: [], errors: [`Missing column(s): ${missing.join(', ')}`] };

  const logs = [], errors = [];
  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2;
    const get = (n) => (col(n) >= 0 ? (r[col(n)] || '').trim() : '');
    const date = get('date');
    const client = clients.find((c) => c.name.toLowerCase() === get('client').toLowerCase() || c.id === get('client'));
    const shift = SHIFTS.find((s) => s.name.toLowerCase() === get('shift').toLowerCase() || s.id === get('shift').toLowerCase());
    const actual = Number(get('actual'));
    if (!isValidISO(date)) return errors.push(`Line ${line}: date must be YYYY-MM-DD.`);
    if (!client) return errors.push(`Line ${line}: client "${get('client')}" not found.`);
    if (!shift) return errors.push(`Line ${line}: shift "${get('shift')}" not recognised.`);
    if (!Number.isFinite(actual) || actual < 0) return errors.push(`Line ${line}: actual must be a number.`);
    logs.push({
      id: Math.random().toString(36).slice(2) + Date.now().toString(36) + idx,
      clientId: client.id, date, shiftId: shift.id, actual: Math.round(actual),
      target: client.shiftTarget, issue: get('issue') || 'No Delays', note: get('note'),
      supervisorId: supervisor.id, supervisorName: supervisor.name,
      createdAt: new Date(`${date}T12:00:00`).toISOString(),
    });
  });
  return { logs, errors };
}

// Invoice-ready export: one line per day with output, contract, sign-off and amount.
export function invoiceToCSV(client, invoice, from, to) {
  const header = ['date', 'client', 'unit', 'output', 'contract_target', 'achievement_pct', 'client_sign_off', 'signed_by', 'signed_at', 'price_per_unit', 'amount_' + CURRENCY.toLowerCase()];
  const lines = invoice.rows.map((r) => [
    r.date, client.name, client.unit, r.actual, r.target, r.pct, r.state.label.toLowerCase(),
    r.confirmed ? r.signoff.byName : '', r.confirmed ? r.signoff.at : '',
    r.price || '', r.confirmed && r.amount != null ? r.amount : '',
  ].map(esc).join(','));
  lines.push([
    `TOTAL CONFIRMED (${from} to ${to})`, client.name, client.unit, invoice.confirmedOutput, invoice.confirmedContract,
    invoice.achievementPct, `${invoice.confirmedDays} day(s)`, '', '', '', invoice.amountPayable == null ? '' : invoice.amountPayable,
  ].map(esc).join(','));
  return [header.join(','), ...lines].join('\n');
}
