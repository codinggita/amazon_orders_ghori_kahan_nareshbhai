import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!accessToken || !user) {
    // Redirect to login but save current location for post-login redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    // Restrict non-admins from admin routes
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
