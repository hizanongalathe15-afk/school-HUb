import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getDashboardPathForRole } from '../../utils/roleRoutes';

export default function RoleRedirect() {
  const role = useAuthStore((state) => state.user?.role);

  return <Navigate to={getDashboardPathForRole(role)} replace />;
}
