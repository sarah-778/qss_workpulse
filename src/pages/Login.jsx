import { useState } from 'react';
import Icon from '../components/Icon';
import { APP_NAME, TAGLINE } from '../config';
import { useStore } from '../context/StoreContext';

const DEMO = [
  { label: 'Supervisor', who: 'Sarah Kato', u: 'supervisor', p: 'Super@123' },
  { label: 'Client', who: 'Nile Beverage Bottlers', u: 'nilebev', p: 'Client@123' },
  { label: 'Client', who: 'Movit Distribution Hub', u: 'movit', p: 'Client@123' },
  { label: 'Client', who: 'Mukwano Packaging Line B', u: 'mukwano', p: 'Client@123' },
];

export default function Login() {
  const { login } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const res = login(username, password);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="brand-logo big"><Icon name="activity" size={30} /></div>
        <h1>{APP_NAME}</h1>
        <p className="hero-tag">{TAGLINE}</p>
        <ul className="hero-points">
          <li><Icon name="check" size={18} /> Supervisors record work each shift in seconds, from a phone</li>
          <li><Icon name="check" size={18} /> Output is compared with the target agreed with the client</li>
          <li><Icon name="check" size={18} /> Clients see a clear green, amber or red status every day</li>
        </ul>
      </section>

      <section className="login-panel">
        <form className="card pad stack-sm" onSubmit={submit}>
          <h2 className="h2 m0">Sign in</h2>
          <p className="muted m0">Use the login QSS gave you.</p>
          {error && <div className="alert alert-error" role="alert"><Icon name="warn" size={16} /> {error}</div>}
          <label className="field"><span>Username</span>
            <input className="input" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoCapitalize="none" autoCorrect="off" autoComplete="username" required /></label>
          <label className="field"><span>Password</span>
            <div className="pw">
              <input className="input" type={show ? 'text' : 'password'} value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }} autoComplete="current-password" required />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</button>
            </div></label>
          <button className="btn btn-primary btn-lg" type="submit">Sign in</button>
        </form>

        <div className="card pad demo no-print">
          <div className="eyebrow">Demo accounts (tap to fill)</div>
          {DEMO.map((d) => (
            <button type="button" key={d.u} className="demo-row" onClick={() => { setUsername(d.u); setPassword(d.p); setError(''); }}>
              <span className="pill pill-sm" style={{ background: d.label === 'Supervisor' ? '#DBEAFE' : '#DCFCE7', color: d.label === 'Supervisor' ? '#1E40AF' : '#166534' }}>{d.label}</span>
              <span className="demo-who">{d.who}</span>
              <code>{d.u} / {d.p}</code>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
