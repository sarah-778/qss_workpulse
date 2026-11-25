import { addDays, todayISO } from '../utils/dates';
import { DB_VERSION } from '../config';

// Demo accounts - shown on the login screen so judges can try the app.
//   Supervisor : supervisor / Super@123
//   Clients    : nilebev / Client@123 , movit / Client@123 , mukwano / Client@123
const CLIENT_SEEDS = [
  {
    id: 'nile-bev', name: 'Nile Beverage Bottlers', location: 'Luzira Industrial Park',
    unit: 'Cartons Packed', shiftTarget: 500, dailyTarget: 1000, unitPrice: 1200,
    history: [1.02, 0.92, 1.04, 1.0, 0.76, 1.06], today: { actual: 520, issue: 'No Delays' },
    username: 'nilebev',
  },
  {
    id: 'movit-logistics', name: 'Movit Distribution Hub', location: 'Namanve Industrial Park',
    unit: 'Pallets Dispatched', shiftTarget: 40, dailyTarget: 80, unitPrice: 15000,
    history: [1.02, 0.92, 1.0, 1.05, 0.75, 1.01], today: { actual: 34, issue: 'Raw Material Delay' },
    username: 'movit',
    // Demo: this client already disputed one day (shows up on the supervisor's Overview).
    dispute: { index: 3, reason: 'Our gate log shows 80 pallets left the dock, not 84.' },
  },
  {
    id: 'mukwano-fmcg', name: 'Mukwano Packaging Line B', location: 'Kampala Central',
    unit: 'Boxes Sealed', shiftTarget: 1000, dailyTarget: 2000, unitPrice: 300,
    history: [1.02, 0.92, 1.05, 1.0, 0.76, 1.04], today: { actual: 760, issue: 'Machine Downtime' },
    username: 'mukwano',
  },
];

export const SUPERVISOR = {
  id: 'u-supervisor', username: 'supervisor', password: 'Super@123',
  name: 'Sarah Kato', role: 'supervisor',
};

export function buildSeed() {
  const today = todayISO();
  const clients = [], users = [SUPERVISOR], logs = [], signoffs = [];

  CLIENT_SEEDS.forEach((c) => {
    clients.push({
      id: c.id, name: c.name, location: c.location, unit: c.unit,
      shiftTarget: c.shiftTarget, dailyTarget: c.dailyTarget, unitPrice: c.unitPrice,
      createdAt: new Date().toISOString(),
    });
    users.push({
      id: `u-${c.id}`, username: c.username, password: 'Client@123',
      name: c.name, role: 'client', clientId: c.id,
    });

    c.history.forEach((ratio, i) => {
      const date = addDays(today, -(c.history.length - i));
      const total = Math.round(c.dailyTarget * ratio);
      const morning = Math.round(total * 0.52);
      // Demo sign-offs: the older days are already confirmed, the newest two wait for the client to tap.
      if (i < 4) {
        const disputed = c.dispute && c.dispute.index === i;
        signoffs.push({
          id: `seed-so-${c.id}-${date}`, clientId: c.id, date, decision: disputed ? 'disputed' : 'confirmed',
          reason: disputed ? c.dispute.reason : '', actual: total, dailyTarget: c.dailyTarget, unitPrice: c.unitPrice,
          byUserId: `u-${c.id}`, byName: c.name, at: new Date(`${date}T23:10:00`).toISOString(),
        });
      }
      const issue = ratio < 0.85 ? 'Machine Downtime' : ratio < 1 ? 'Raw Material Delay' : 'No Delays';
      [['morning', morning, '14:05'], ['afternoon', total - morning, '22:05']].forEach(([shiftId, actual, time]) => {
        logs.push({
          id: `seed-${c.id}-${date}-${shiftId}`, clientId: c.id, date, shiftId, actual,
          target: c.shiftTarget, issue: shiftId === 'morning' ? 'No Delays' : issue, note: '',
          supervisorId: SUPERVISOR.id, supervisorName: SUPERVISOR.name,
          createdAt: new Date(`${date}T${time}:00`).toISOString(),
        });
      });
    });

    logs.push({
      id: `seed-${c.id}-today-morning`, clientId: c.id, date: today, shiftId: 'morning',
      actual: c.today.actual, target: c.shiftTarget, issue: c.today.issue, note: '',
      supervisorId: SUPERVISOR.id, supervisorName: SUPERVISOR.name,
      createdAt: new Date().toISOString(),
    });
  });

  return { version: DB_VERSION, clients, users, logs, signoffs };
}
