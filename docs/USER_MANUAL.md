# QSS WorkPulse – User Manual

## 1. Signing in
1. Open the app and enter your **username** and **password** (use *Show* to check what you typed).
2. Supervisors land on the **Supervisor console**; clients land on their **dashboard**.
3. Tap **Log out** (top right) when you finish, especially on shared phones.

Demo logins: supervisor `supervisor` / `Super@123`; clients `nilebev`, `movit`, `mukwano` / `Client@123`.

---

## 2. For supervisors

### Recording a shift (takes about 20 seconds)
1. Tap **Record** (bottom bar).
2. Choose the **Client**.
3. Choose the **Shift**. A shift already reported shows "reported ✓".
4. Type the **work done** (for example cartons packed). Use **+1, +10, −1, −10** or **= Target** for speed. The app instantly shows how far above or below the shift target you are.
5. Tap what happened on shift (No Delays, Machine Downtime, …) and add an optional **note** for the client.
6. Tap **Record work output**. The client can see it straight away.

Forgot yesterday? Change the **Date** field and record it. Two entries for the same shift are added together.

### Checking all clients
**Overview** shows every client for the chosen day with a green, amber or red status, progress against the daily target, and which shift is still missing. Use the arrows or date picker to look at other days. **Client view** shows exactly what that client sees.

### Catch-up alerts and disputes (Overview)
- **Needs your attention** lists clients whose remaining shift must beat its normal target to still hit the daily target (e.g. "Afternoon needs 46, +6 catch-up"). Tap **Handover note** to copy a message for the next shift, or **Record**.
- When you open Record for that shift, a **Catch-up needed** hint shows the number to aim for.
- A **Disputed** day shows the client's reason. Tap **Review day**, correct the record (pencil icon). The day becomes "Revised" and the client is asked to re-confirm.

### Fixing a mistake
Open **Records** (or a client's view), then tap the pencil to edit or the bin to delete a record.

### Creating a client
1. **Clients → New client**.
2. Fill in the company name, location, what is counted (for example *Cartons Packed*), the **target per shift** and **target per day**. The daily target fills itself (shifts × shift target); change it if the contract says otherwise.
3. Set the client's **username** and **password** (a password is suggested).
4. Tap **Create client**. A green box shows the login details. Tap **Copy details** and send them to the client.

Optionally enter a **price per unit** (UGX). With a price, the client's invoice report shows amounts payable.

To change a target or reset a password: **Clients → Edit**. Leave the password blank to keep it.
Deleting a client also deletes their login and all their records.

### Bulk upload and backups (Data tab)
- **Import CSV**: add many records at once. Download the template, fill it in, import it. Lines with problems are skipped and listed.
- **Export**: all records as CSV, or a full JSON backup.
- **Restore backup / Reset demo data**.

---

## 3. For clients

Your dashboard answers one question: *is the work on track today?*

- **Status banner**: ON TRACK (green, 100% or more), BEHIND (amber, 80–99%), AT RISK (red, under 80%) or NO DATA YET (grey).
- If the day is not finished, the status compares against the work expected **so far**, and tells you which shift is still to report.
- **Cards**: daily target, work delivered, % of target, work still to go.
- **Shift by shift**: what each team delivered, with the supervisor's reason when a shift fell short.
- **Last 7 days**: bars against the target line.
- **Records**: every entry with time, supervisor and notes.
- **Pace forecast** (today only): "On pace for 940 of 1,000", with what the next shift needs to make up.
- **Daily sign-off**: once every shift has reported (or the day has ended), tap **Confirm day** if the numbers match your records, or **Dispute** and say what looks wrong.
- **Invoice report** tab: pick a period (last 7/30 days, this month, last month, or custom dates). Shows confirmed output against contract and, if a price is set, the amount payable. Only confirmed days are payable. **CSV** and **Print / PDF** give you the document.
- Arrows or the date picker show earlier days. **CSV** downloads your records; **Print report** makes a clean one-page report (or save as PDF).

---

## 4. Troubleshooting
| Problem | Fix |
|---|---|
| "Wrong username or password" | Usernames are not case sensitive; passwords are. Ask your supervisor to reset it. |
| Client cannot see new records | Records appear instantly in the same browser. See "Important to know" in the README about separate devices. |
| Lost everything | Data > Restore backup, or Reset demo data. |
