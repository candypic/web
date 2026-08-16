import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-brand-dark">
        <div className="h-10 w-10 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}
