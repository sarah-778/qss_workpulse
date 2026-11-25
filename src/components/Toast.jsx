import Icon from './Icon';
import { useStore } from '../context/StoreContext';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type} no-print`} role="status" key={toast.id}>
      <Icon name={toast.type === 'error' ? 'warn' : 'check'} />
      <span>{toast.msg}</span>
    </div>
  );
}
