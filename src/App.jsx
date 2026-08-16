import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabaseClient';

// Public Pages
import Home from './pages/Home';
import Quotation from './pages/Quotation';
import Gallery from './pages/Gallery';

// Client Portal Pages
import PortalLogin from './pages/PortalLogin';
import ClientEventPortal from './pages/ClientEventPortal';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminGallery from './pages/AdminGallery';
import AdminCalendar from './pages/AdminCalendar';
import AdminCrew from './pages/admin/AdminCrew';
import AdminNotifications from './pages/admin/AdminNotifications';

// Shell & Context
import Preloader from './components/Preloader';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [loading, setLoading] = useState(true);

  // Global Realtime Push Listener for Android/iOS PWA devices
  useEffect(() => {
    if (!('Notification' in window)) return;

    const channel = supabase
      .channel('studio-live-events')
      .on('broadcast', { event: 'shoot-assigned' }, async ({ payload }) => {
        if (Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              if (reg && reg.showNotification) {
                reg.showNotification(payload.title || '📸 Candy Pic Shoot Assignment', {
                  body: payload.body || 'You have been assigned to an upcoming wedding shoot.',
                  icon: '/logo-nonsquare.png',
                  badge: '/logo-nonsquare.png',
                  data: { url: '/admin/calendar' },
                  vibrate: [200, 100, 200],
                });
                return;
              }
            }
            new Notification(payload.title || '📸 Candy Pic Shoot Assignment', {
              body: payload.body,
              icon: '/logo-nonsquare.png',
            });
          } catch (e) {
            console.warn('Realtime push display error:', e);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      {/* Preloader (initial load only) */}
      <AnimatePresence mode="wait">
        {loading && <Preloader key="preloader" onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <AuthProvider>
          <Router>
            <PwaInstallPrompt />
            <div className="font-sans antialiased bg-brand-dark text-brand-text min-h-screen animate-fade-in">
              <Routes>
                {/* ── Public Site ── */}
                <Route path="/" element={<Home />} />
                <Route path="/quotation" element={<Quotation />} />
                <Route path="/gallery" element={<Gallery />} />

                {/* ── Client Wedding Vaults & Proofing Portal ── */}
                <Route path="/portal" element={<PortalLogin />} />
                <Route path="/portal/:slug" element={<ClientEventPortal />} />
                <Route path="/portal/:slug/login" element={<PortalLogin />} />

                {/* ── Admin Authentication ── */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* ── Admin Management Hub (Protected) ── */}
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events"
                  element={
                    <ProtectedRoute>
                      <AdminEvents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/gallery"
                  element={
                    <ProtectedRoute>
                      <AdminGallery />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/calendar"
                  element={
                    <ProtectedRoute>
                      <AdminCalendar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={<Navigate to="/admin/calendar" replace />}
                />
                <Route
                  path="/admin/crew"
                  element={
                    <ProtectedRoute>
                      <AdminCrew />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <ProtectedRoute>
                      <AdminNotifications />
                    </ProtectedRoute>
                  }
                />

                {/* ── Fallback Catch-all ── */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      )}
    </>
  );
}

export default App;
