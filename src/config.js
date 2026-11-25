// ============================================================
//  QSS WorkPulse - central settings. Edit here, no other code
//  needs to change.
// ============================================================

export const APP_NAME = 'QSS WorkPulse';
export const TAGLINE = 'Track the work, not just the workers.';

// Shifts used across the whole app. To add a night shift, add one more
// object here (the id must be unique and never change once data exists).
export const SHIFTS = [
  { id: 'morning', name: 'Morning Shift', hours: '06:00 - 14:00' },
  { id: 'afternoon', name: 'Afternoon Shift', hours: '14:00 - 22:00' },
];

// Quick "what happened on shift" tags the supervisor can tap.
export const ISSUE_TAGS = [
  'No Delays',
  'Machine Downtime',
  'Raw Material Delay',
  'Power Interruption',
  'Quality Re-check',
  'Staff Shortage',
];

// Status rules (percent of target):
//   >= onTrack  -> ON TRACK (green)
//   >= behind   -> BEHIND   (amber)
//   below that  -> AT RISK  (red)
export const THRESHOLDS = { onTrack: 100, behind: 80 };

// Suggestions shown when a supervisor creates a client (free text still allowed).
export const UNIT_SUGGESTIONS = [
  'Cartons Packed',
  'Items Moved',
  'Pallets Dispatched',
  'Boxes Sealed',
  'Units Assembled',
  'Bags Loaded',
  'Parcels Sorted',
];

// Currency shown on invoice-ready reports (clients with a price per unit).
export const CURRENCY = 'UGX';

// Pace forecast: if the remaining shift(s) would have to beat their own target
// by more than this percent to still hit the daily target, flag it as a stretch.
export const FORECAST = { stretchPct: 115 };

// Photo proof: supervisors attach pictures to a record so the client can see the
// work is really happening. Pictures are shrunk before saving (this demo keeps data
// in the browser, which holds about 5 MB in total).
//   max      - pictures per record
//   maxEdge  - longest side in pixels after shrinking
//   quality  - JPEG quality 0-1
//   required - true = a record cannot be saved without at least one photo
export const PHOTO = { max: 3, maxEdge: 960, quality: 0.68, required: false };

export const DB_KEY = 'qss_workpulse_db_v1';
export const SESSION_KEY = 'qss_workpulse_session';
export const DB_VERSION = 1;
