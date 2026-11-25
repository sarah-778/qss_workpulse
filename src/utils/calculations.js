import { FORECAST, SHIFTS, THRESHOLDS } from '../config';
import { addDays, todayISO } from './dates';

export const STATUS = {
  green: { level: 'green', label: 'ON TRACK', hex: '#16A34A', soft: '#DCFCE7', text: '#166534' },
  amber: { level: 'amber', label: 'BEHIND', hex: '#F59E0B', soft: '#FEF3C7', text: '#92400E' },
  red: { level: 'red', label: 'AT RISK', hex: '#DC2626', soft: '#FEE2E2', text: '#991B1B' },
  none: { level: 'none', label: 'NO DATA YET', hex: '#94A3B8', soft: '#E2E8F0', text: '#475569' },
};

export function statusFromPct(pct, hasData = true) {
  if (!hasData) return STATUS.none;
  if (pct >= THRESHOLDS.onTrack) return STATUS.green;
  if (pct >= THRESHOLDS.behind) return STATUS.amber;
  return STATUS.red;
}

const sum = (arr, f) => arr.reduce((s, x) => s + Number(f(x) || 0), 0);
const pctOf = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

// Everything the dashboards need for ONE client on ONE date.
export function summariseDay(client, logs, date) {
  const dayLogs = logs.filter((l) => l.clientId === client.id && l.date === date);

  const shifts = SHIFTS.map((shift) => {
    const entries = dayLogs.filter((l) => l.shiftId === shift.id);
    const actual = sum(entries, (e) => e.actual);
    const target = entries.length ? Number(entries[0].target) : Number(client.shiftTarget);
    return {
      shift, entries, actual, target,
      logged: entries.length > 0,
      pct: pctOf(actual, target),
    };
  });

  const loggedShifts = shifts.filter((s) => s.logged);
  const totalActual = sum(shifts, (s) => s.actual);
  const dailyTarget = Number(client.dailyTarget);
  const complete = loggedShifts.length === SHIFTS.length;
  const hasData = loggedShifts.length > 0;

  // If only some shifts are reported, compare against the work EXPECTED so far,
  // otherwise a client would look "at risk" at lunchtime for no reason.
  const expected = complete ? dailyTarget : sum(loggedShifts, (s) => s.target);
  const basisPct = pctOf(totalActual, expected);
  const status = statusFromPct(basisPct, hasData);

  return {
    dayLogs, shifts, totalActual, dailyTarget, complete, hasData,
    completionPct: pctOf(totalActual, dailyTarget),
    pacePct: basisPct,
    expected,
    remaining: Math.max(dailyTarget - totalActual, 0),
    variance: totalActual - dailyTarget,
    status,
    pendingShifts: shifts.filter((s) => !s.logged).map((s) => s.shift),
  };
}

// Last N days ending on `endDate` (oldest first) for the trend chart.
export function buildTrend(client, logs, endDate, n = 7) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(endDate, -i);
    const s = summariseDay(client, logs, date);
    days.push({
      date, actual: s.totalActual, target: s.dailyTarget,
      hasData: s.hasData, complete: s.complete, status: s.status,
      isSelected: i === 0,
    });
  }
  return days;
}

// Pace forecast for TODAY while the day is still open.
// Method (kept simple on purpose so a client can follow it):
//   run rate   = work delivered so far / work expected so far
//   projection = delivered + (remaining shifts' targets x run rate)
//   catch-up   = daily target - delivered, shared across the remaining shifts
// Returns null when there is nothing to forecast (past day, no data yet, or day complete).
export function forecastDay(client, summary, date) {
  if (date !== todayISO() || summary.complete || !summary.hasData) return null;
  const pending = summary.shifts.filter((s) => !s.logged);
  if (!pending.length) return null;

  const loggedTarget = sum(summary.shifts.filter((s) => s.logged), (s) => s.target);
  const runRate = loggedTarget > 0 ? summary.totalActual / loggedTarget : 0;
  const pendingTarget = sum(pending, (s) => s.target);
  const projected = Math.round(summary.totalActual + pendingTarget * runRate);
  const remaining = summary.remaining;

  let left = remaining;
  const needs = pending.map((p, i) => {
    const target = Number(p.target);
    const needed = i === pending.length - 1 ? Math.max(left, 0) : Math.round((remaining * target) / pendingTarget);
    left -= needed;
    return { shift: p.shift, target, needed, extra: needed - target, neededPct: pctOf(needed, target) };
  });

  const onPace = projected >= summary.dailyTarget;
  const stretch = remaining > 0 && needs.some((n) => n.neededPct > FORECAST.stretchPct);
  return {
    runRatePct: Math.round(runRate * 100),
    projected,
    projectedPct: pctOf(projected, summary.dailyTarget),
    gap: Math.max(summary.dailyTarget - projected, 0),
    status: statusFromPct(pctOf(projected, summary.dailyTarget)),
    onPace, stretch, reached: remaining === 0,
    delivered: summary.totalActual, dailyTarget: summary.dailyTarget, remaining,
    needs,
  };
}

// Plain-text note a supervisor can paste into WhatsApp / SMS for the next shift.
export function handoverNote(client, summary, f) {
  const unit = client.unit.toLowerCase();
  const done = summary.shifts.filter((s) => s.logged)
    .map((s) => `${s.shift.name} delivered ${s.actual.toLocaleString()} of ${s.target.toLocaleString()} ${unit} (${s.pct}%).`);
  const lines = [`QSS handover - ${client.name}`, ...done];
  if (f.reached) {
    lines.push(`Daily target of ${f.dailyTarget.toLocaleString()} already reached.`);
  } else {
    lines.push(`On pace for ${f.projected.toLocaleString()} of ${f.dailyTarget.toLocaleString()} today.`);
    f.needs.forEach((n) => lines.push(
      `${n.shift.name} needs ${n.needed.toLocaleString()} ${unit} (target ${n.target.toLocaleString()}${n.extra > 0 ? `, +${n.extra.toLocaleString()} catch-up` : ''}) to still hit the daily target.`,
    ));
  }
  return lines.join('\n');
}
