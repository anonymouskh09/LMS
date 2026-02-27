import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const user = sessionStorage.getItem('user');
  const token = sessionStorage.getItem('token');

  if (user && token) {
    // Already logged in, redirect to dashboard
    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role === 'teacher') {
        return <Navigate to="/teacher/dashboard" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    } catch (e) {
      // If parsing fails, treat as not logged in
      return children;
    }
  }

  return children;
};

export default PublicRoute;
