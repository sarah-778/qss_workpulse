import { useState } from 'react';
import Header from '../components/Header';
import ClientDashboard from '../components/ClientDashboard';
import { useStore } from '../context/StoreContext';
import { todayISO } from '../utils/dates';

export default function ClientApp() {
  const { db, user } = useStore();
  const [date, setDate] = useState(todayISO());
  const client = db.clients.find((c) => c.id === user.clientId);

  return (
    <div className="app">
      <Header subtitle="Client dashboard" />
      <main className="container">
        {client
          ? <ClientDashboard client={client} logs={db.logs} signoffs={db.signoffs} date={date} setDate={setDate} />
          : <div className="card pad"><p className="empty">Your account is not linked to a client. Please contact QSS.</p></div>}
      </main>
    </div>
  );
}
