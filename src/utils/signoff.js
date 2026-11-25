import { summariseDay } from './calculations';
import { daysBetween, todayISO } from './dates';
import { uid } from './id';
import { CURRENCY } from '../config';

export const money = (n) => (n == null ? '—' : `${CURRENCY} ${Math.round(n).toLocaleString()}`);

// Look-and-feel for each sign-off state (same palette as the status colours).
export const SIGNOFF = {
  confirmed: { key: 'confirmed', label: 'CONFIRMED', hex: '#16A34A', soft: '#DCFCE7', text: '#166534' },
  disputed: { key: 'disputed', label: 'DISPUTED', hex: '#DC2626', soft: '#FEE2E2', text: '#991B1B' },
  revised: { key: 'revised', label: 'REVISED · RE-CONFIRM', hex: '#F59E0B', soft: '#FEF3C7', text: '#92400E' },
  pending: { key: 'pending', label: 'AWAITING SIGN-OFF', hex: '#2563EB', soft: '#DBEAFE', text: '#1E40AF' },
  open: { key: 'open', label: 'DAY IN PROGRESS', hex: '#94A3B8', soft: '#E2E8F0', text: '#475569' },
  nodata: { key: 'nodata', label: 'NO DATA', hex: '#94A3B8', soft: '#E2E8F0', text: '#475569' },
};

export const findSignoff = (signoffs, clientId, date) =>
  (signoffs || []).find((s) => s.clientId === clientId && s.date === date) || null;

// A day can be signed off once every shift has reported, or once the day is over.
export const canSignOff = (summary, date) => summary.hasData && (summary.complete || date < todayISO());

// What is the sign-off state of this day right now?
// If supervisors changed the records AFTER the client decided, the decision is stale ("revised").
export function signoffState(signoff, summary, date) {
  if (!summary.hasData) return SIGNOFF.nodata;
  if (signoff && Number(signoff.actual) !== summary.totalActual) return SIGNOFF.revised;
  if (signoff) return signoff.decision === 'confirmed' ? SIGNOFF.confirmed : SIGNOFF.disputed;
  return canSignOff(summary, date) ? SIGNOFF.pending : SIGNOFF.open;
}

// The record we store when a client taps Confirm / Dispute. It snapshots the numbers
// (output, contract target, price) so a later price change never rewrites a confirmed day.
export function makeSignoff(client, summary, date, { decision, reason, user }) {
  return {
    id: uid(), clientId: client.id, date, decision,
    reason: decision === 'disputed' ? (reason || '').trim() : '',
    actual: summary.totalActual, dailyTarget: summary.dailyTarget,
    unitPrice: client.unitPrice > 0 ? Number(client.unitPrice) : null,
    byUserId: user.id, byName: user.name, at: new Date().toISOString(),
  };
}

export const hasPrice = (client) => Number(client.unitPrice) > 0;

// Everything the invoice-ready report needs for one client between two dates (inclusive).
// Only CONFIRMED days count towards "amount payable".
export function buildInvoice(client, logs, signoffs, from, to) {
  const rows = [];
  daysBetween(from, to).forEach((date) => {
    const summary = summariseDay(client, logs, date);
    if (!summary.hasData) return;
    const signoff = findSignoff(signoffs, client.id, date);
    const state = signoffState(signoff, summary, date);
    const confirmed = state.key === 'confirmed';
    const price = confirmed ? signoff.unitPrice : (hasPrice(client) ? Number(client.unitPrice) : null);
    const actual = confirmed ? Number(signoff.actual) : summary.totalActual;
    const target = confirmed && signoff.dailyTarget ? Number(signoff.dailyTarget) : summary.dailyTarget;
    rows.push({
      date, actual, target, state, signoff, confirmed, price,
      pct: target > 0 ? Math.round((actual / target) * 100) : 0,
      amount: price ? actual * price : null,
    });
  });

  const sum = (list, f) => list.reduce((s, r) => s + f(r), 0);
  const conf = rows.filter((r) => r.confirmed);
  const notConf = rows.filter((r) => !r.confirmed);
  const confirmedOutput = sum(conf, (r) => r.actual);
  const confirmedContract = sum(conf, (r) => r.target);
  const priced = conf.some((r) => r.price);
  return {
    rows,
    confirmedDays: conf.length,
    confirmedOutput,
    confirmedContract,
    achievementPct: confirmedContract > 0 ? Math.round((confirmedOutput / confirmedContract) * 100) : 0,
    amountPayable: priced ? sum(conf, (r) => r.amount || 0) : null,
    awaitingDays: notConf.filter((r) => ['pending', 'open', 'revised'].includes(r.state.key)).length,
    disputedDays: notConf.filter((r) => r.state.key === 'disputed').length,
    unconfirmedOutput: sum(notConf, (r) => r.actual),
    unconfirmedAmount: hasPrice(client) ? sum(notConf, (r) => r.amount || 0) : null,
  };
}
