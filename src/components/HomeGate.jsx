import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home';

// The "homepage" (both the browser route "/" and the installed PWA's
// launch destination) adapts to whichever device it's opened on:
//   - an approved crew member's device  -> straight into their calendar
//   - the studio admin's own device     -> straight into the admin dashboard
//   - anyone else                       -> the normal public marketing site
export default function HomeGate() {
  const { loading, isSuperAdmin, isApprovedCrew } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-brand-dark">
        <div className="h-10 w-10 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin" />
      </div>
    );
  }

  if (isApprovedCrew) {
    return <Navigate to="/crew/calendar" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Home />;
}
