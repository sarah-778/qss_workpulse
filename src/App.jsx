import { useStore } from './context/StoreContext';
import Login from './pages/Login';
import SupervisorApp from './pages/SupervisorApp';
import ClientApp from './pages/ClientApp';
import Toast from './components/Toast';

export default function App() {
  const { user } = useStore();
  let page = <Login />;
  if (user) page = user.role === 'supervisor' ? <SupervisorApp /> : <ClientApp />;
  return (
    <>
      {page}
      <Toast />
    </>
  );
}
