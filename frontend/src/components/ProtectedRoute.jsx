import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const user = sessionStorage.getItem('user');
  const token = sessionStorage.getItem('token');

  if (!user || !token) {
    // Not logged in, redirect to signin
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
