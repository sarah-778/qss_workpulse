# QSS WorkPulse

**Track the work, not just the workers.**
A simple React app for the QSS Hackathon: supervisors record the work each team produced in a shift, the app compares it to the target agreed with the client, and the client sees a clear green / amber / red view every day.

## Run it (2 minutes)

```bash
npm install
npm run dev
```

Open the address shown (usually http://localhost:5173). On the same Wi-Fi, `npm run dev` also prints a **Network** address, so you can open the supervisor screen on your phone.

Build for hosting: `npm run build` (output in `dist/`), preview with `npm run preview`.

## Logins (demo data is built in)

| Role | Username | Password |
|---|---|---|
| Supervisor | `supervisor` | `Super@123` |
| Client – Nile Beverage Bottlers | `nilebev` | `Client@123` |
| Client – Movit Distribution Hub | `movit` | `Client@123` |
| Client – Mukwano Packaging Line B | `mukwano` | `Client@123` |

The login page also has tap-to-fill buttons for these. Remove the `DEMO` list in `src/pages/Login.jsx` before real use.

## What is in the app

- **Login** with two roles. Clients only ever see their own company.
- **Supervisor console** (phone-friendly bottom tabs): Overview, Record, Records, Clients, Data.
- **Client dashboard**: status banner, KPIs, progress bar, shift-by-shift view, 7-day trend, records, CSV export and print report.
- Supervisors **create clients and their logins**, edit targets, reset passwords.
- **Daily client sign-off + invoice-ready report**: the client taps **Confirm** or **Dispute** (with a reason) on each day's output. Confirmed days roll into an *Invoice report* tab (output vs contract, optional price per unit = amount payable, CSV and print/PDF). If a supervisor edits a day after sign-off, it flips to "Revised" and the client is asked to re-confirm. Disputes appear on the supervisor's Overview.
- **Pace forecast + catch-up alert**: once a shift is recorded, the app shows "on pace for 940 of 1,000" and what the remaining shift must deliver to still hit the target. Supervisors get a "Needs your attention" panel, a copyable handover note for WhatsApp/SMS, and a catch-up hint on the Record screen.
- Fair status rule: mid-day the app compares against the work *expected so far*, so a client is not shown "at risk" just because the afternoon shift has not happened yet.

## Project layout

```
src/
  config.js              shifts, issue tags, status thresholds, unit suggestions
  main.jsx, App.jsx      entry + role routing
  context/StoreContext   all data + login logic (the "backend")
  data/seed.js           demo clients, logins and history
  utils/                 calculations (incl. forecast), signoff (+ invoice), dates, csv, ids, clipboard
  pages/                 Login, SupervisorApp, ClientApp
  components/            dashboard cards, forms, charts, icons
public/templates/        work-log-template.csv
docs/                    USER_MANUAL.md, DATA_FORMAT.md, PITCH.md
```

## Important to know

Data and logins are stored in the **browser** (localStorage); there is no server. That is perfect for a live demo on one laptop: open two tabs, one as supervisor and one as client, and the client tab updates live. Different devices do not share data until you connect a database; see `docs/DATA_FORMAT.md` ("Moving to a real backend"). Each browser tab keeps its own login, so one tab can be the supervisor and another the client.

Passwords are stored in plain text in this demo. A real deployment must use a backend with hashed passwords.
