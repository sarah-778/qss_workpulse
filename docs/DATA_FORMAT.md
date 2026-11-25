# Data format and how to extend the system

All data lives in one JSON object (browser key `qss_workpulse_db_v1`). Export it any time from **Data → Full backup (JSON)**.

```json
{
  "version": 1,
  "clients": [ ... ],
  "users":   [ ... ],
  "logs":    [ ... ],
  "signoffs": [ ... ]
}
```

## client
```json
{
  "id": "nile-bev",
  "name": "Nile Beverage Bottlers",
  "location": "Luzira Industrial Park",
  "unit": "Cartons Packed",
  "shiftTarget": 500,
  "dailyTarget": 1000,
  "unitPrice": 1200,
  "createdAt": "2026-11-25T08:00:00.000Z"
}
```

`unitPrice` is optional (null = report quantities only). Currency is `CURRENCY` in `config.js`.

## signoff (one client decision on one day)
```json
{
  "id": "k3j2h1", "clientId": "nile-bev", "date": "2026-11-24",
  "decision": "confirmed",
  "reason": "",
  "actual": 1040, "dailyTarget": 1000, "unitPrice": 1200,
  "byUserId": "u-nile-bev", "byName": "Nile Beverage Bottlers",
  "at": "2026-11-24T20:10:00.000Z"
}
```
`decision` is `"confirmed"` or `"disputed"` (with a `reason`). One per client per day (a new decision replaces the old). `actual`, `dailyTarget` and `unitPrice` are snapshots, so later price or target changes do not rewrite a confirmed day. If the day's records later total something other than `actual`, the day shows as "Revised" and is not payable until re-confirmed. Old backups without `signoffs` load fine.

## user (login)
```json
{ "id": "u-nile-bev", "username": "nilebev", "password": "Client@123",
  "name": "Nile Beverage Bottlers", "role": "client", "clientId": "nile-bev" }
```
`role` is `"supervisor"` or `"client"`. Clients must have a `clientId`; supervisors do not.

## log (one shift entry)
```json
{
  "id": "k3j2h1",
  "clientId": "nile-bev",
  "date": "2026-11-25",
  "shiftId": "morning",
  "actual": 520,
  "target": 500,
  "issue": "No Delays",
  "note": "Line 2 restarted after 10 min",
  "supervisorId": "u-supervisor",
  "supervisorName": "Sarah Kato",
  "createdAt": "2026-11-25T14:05:00.000Z"
}
```
`target` is a snapshot of the shift target at the time, so changing targets later does not rewrite history.

## CSV format for bulk import (Data → Import CSV)
```
date,client,shift,actual,issue,note
2026-11-24,Nile Beverage Bottlers,Morning Shift,520,No Delays,
```
Required: `date` (YYYY-MM-DD), `client` (exact name), `shift` (name or id), `actual` (number). Optional: `issue`, `note`. A template is in `public/templates/work-log-template.csv`.

## Adding things without touching components
Everything below is in **`src/config.js`**:

| Want to… | Change |
|---|---|
| Add a night shift | Add `{ id: 'night', name: 'Night Shift', hours: '22:00 - 06:00' }` to `SHIFTS`. A day is "complete" only when every shift has reported. |
| Add an issue tag | Add text to `ISSUE_TAGS` |
| Change the green/amber/red rule | Edit `THRESHOLDS` |
| Add unit suggestions | Edit `UNIT_SUGGESTIONS` |
| Rename the app | Edit `APP_NAME`, `TAGLINE` |

Adding a **new field to a record** (for example `rejects`, `headcount` or `hoursWorked`):
1. Add the input in `src/components/RecordForm.jsx` and include it in the `addLog` call.
2. Accept it in `addLog` / `updateLog` in `src/context/StoreContext.jsx`.
3. Show it in `src/components/LogTable.jsx` and, if needed, add a column in `src/utils/csv.js`.

Old records simply have no value for the new field, so nothing breaks.

## Moving to a real backend
`src/context/StoreContext.jsx` is the only file that stores or reads data. To go live:
1. Create tables `clients`, `users`, `logs` with the columns above (PostgreSQL, MySQL or Firebase all work).
2. Replace `commit(...)` and `readDB()` with API calls (for example Django REST, Flask or Node).
3. Replace the plain-text password check in `login` with a server-side check using hashed passwords and tokens.
4. Enforce on the server that clients can only read logs for their own `clientId`.
The screens do not need to change.

## Ideas for next steps
Automatic SMS/WhatsApp send of the handover note, photo proof per shift, per-client custom shifts, weekly PDF report by email, multiple client users per company.
