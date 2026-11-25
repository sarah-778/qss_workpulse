# Pitch guide – QSS WorkPulse

## One-line pitch
"QSS clients pay for work done, not heads sent. WorkPulse also gets that work signed off daily, so invoicing is ready, and warns mid-day when a target is slipping.

Original line: "QSS clients pay for work done, not heads sent. WorkPulse lets a supervisor record the work in 20 seconds and shows the client, every day, whether it is on track."

## Map to the judging questions
| Question | Our answer | Show |
|---|---|---|
| It works? | Records work → compares to target → shows client | Full live flow |
| Easy for supervisor on a phone? | Bottom tabs, big number box, +/- buttons, tap tags, 4 taps to submit | Open Record on your phone |
| Clear to client at a glance? | Giant green / amber / red word + % | Client dashboard |

## 5-minute demo script
1. **(30s) Problem.** Clients pay for output; today they only see headcount.
2. **(60s) Supervisor on phone.** Login `supervisor`. Record → Mukwano → Afternoon → 1,100 → "Power Interruption" → note → Record. Say: "Under 20 seconds."
3. **(60s) Client reaction.** Second tab, login `mukwano`. It was **At Risk**; now it updates live with the new shift. Point at the status word, %, shift breakdown and the reason.
4. **(30s) Fairness.** Mid-day shows "compared to work expected so far", not a false alarm.
5. **(60s) Supervisor creates a client.** Clients → New client → copy login → log in as that client.
6. **(60s) Get paid.** Client tab (`movit`): confirm yesterday, dispute one day with a reason. Supervisor tab: the dispute appears on Overview, fix the record, client re-confirms. Open **Invoice report**: confirmed output vs contract and amount payable, then CSV / Print.
6b. **(45s) Proactive.** Overview shows "Needs your attention": Movit is on pace for 68 of 80, afternoon needs 46. Tap Handover note, then Record: the form shows the catch-up number.
7. **(30s) Next.** Real database, SMS/WhatsApp alerts, photo proof, more shifts via one config line.

## Demo checklist
- Run `npm run dev` before you go on stage; open **two tabs** (supervisor + client) on the same browser.
- Charge your phone; if you show it on the phone, use the Network address on the same Wi-Fi (note: phone data is separate from the laptop's; use Data → Full backup → Restore to copy it).
- Data → **Reset demo data** gives you a clean start: green / amber / red today.
- Have a screenshot of each screen as backup in case Wi-Fi fails.

## Likely questions
- **Does it work offline / multi-device?** Today it stores data in the browser for the demo; the data layer is one file, ready to point at a database (see DATA_FORMAT.md).
- **Security?** Role-based screens now; production adds hashed passwords and server-side access rules.
- **Different clients, different units?** Yes: each client has its own unit and targets.
- **Different number of shifts?** One line in `config.js`.
- **Why not just a spreadsheet?** Clients see a live status without asking; supervisors do not need to format anything; history and targets are built in.
