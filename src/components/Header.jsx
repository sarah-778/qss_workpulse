import Icon from './Icon';
import { APP_NAME } from '../config';
import { useStore } from '../context/StoreContext';

export default function Header({ subtitle }) {
  const { user, logout } = useStore();
  return (
    <header className="header no-print">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-logo"><Icon name="activity" size={20} /></div>
          <div>
            <div className="brand-name">{APP_NAME}</div>
            <div className="brand-sub">{subtitle}</div>
          </div>
        </div>
        <div className="header-user">
          <div className="header-user-text">
            <strong>{user.name}</strong>
            <span>{user.role === 'supervisor' ? 'Supervisor' : 'Client'}</span>
          </div>
          <button type="button" className="btn btn-light btn-sm" onClick={logout}>
            <Icon name="logout" size={16} /> <span className="hide-xs">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
