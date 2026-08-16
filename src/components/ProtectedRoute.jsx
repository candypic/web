import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { session, isAdmin, isCrew, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-brand-dark">
        <div className="h-10 w-10 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin" />
      </div>
    );
  }

  // Check if crew member has a saved device token or email param for 1-tap crew entry
  const params = new URLSearchParams(location.search);
  const hasCrewParam = Boolean(params.get('email'));
  let hasLocalCrew = false;
  try {
    hasLocalCrew = Boolean(localStorage.getItem('candy_crew_email') || localStorage.getItem('candy_crew_name'));
  } catch (e) {}

  // Allow crew member into /crew/calendar if authenticated, or has approved crew credentials
  if (!session && !requireAdmin && (hasCrewParam || hasLocalCrew || location.pathname.startsWith('/crew'))) {
    return children;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // If page requires full admin (vaults, showcase, crew approvals, finance) but user is only crew member
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/crew/calendar" replace />;
  }

  return children;
}
