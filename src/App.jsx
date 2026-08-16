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
    console.log('[CandyPic Push Listener] Initializing global realtime notification listener...');
    const hasNotification = typeof Notification !== 'undefined';
    console.log('[CandyPic Push Listener] Notification API supported:', hasNotification);
    if (hasNotification) {
      console.log('[CandyPic Push Listener] Current permission:', Notification.permission);
    }

    const channel = supabase.channel('studio-live-events', {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'shoot-assigned' }, async ({ payload }) => {
        console.log('[CandyPic Push Listener] 🔔 Incoming broadcast received! Payload:', payload);

        if (hasNotification && Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              console.log('[CandyPic Push Listener] ServiceWorker ready instance:', reg);
              if (reg && reg.showNotification) {
                await reg.showNotification(payload.title || '📸 Candy Pic Shoot Assignment', {
                  body: payload.body || 'You have been assigned to an upcoming wedding shoot.',
                  icon: '/logo-nonsquare.png',
                  badge: '/logo-nonsquare.png',
                  data: { url: '/admin/calendar' },
                  vibrate: [200, 100, 200],
                });
                console.log('[CandyPic Push Listener] ✅ ServiceWorker showNotification triggered successfully!');
                return;
              }
            }
            new Notification(payload.title || '📸 Candy Pic Shoot Assignment', {
              body: payload.body,
              icon: '/logo-nonsquare.png',
            });
            console.log('[CandyPic Push Listener] ✅ Window Notification triggered!');
          } catch (e) {
            console.error('[CandyPic Push Listener] ❌ Notification display error:', e);
          }
        } else {
          console.warn('[CandyPic Push Listener] ⚠️ Cannot show notification. Permission is:', hasNotification ? Notification.permission : 'unsupported');
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, async (payload) => {
        console.log('[CandyPic Push Listener] 🔔 Postgres Notification Insert received:', payload);
        const n = payload.new;
        if (n && hasNotification && Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              if (reg && reg.showNotification) {
                await reg.showNotification(n.title || '📸 Candy Pic Alert', {
                  body: n.message || 'New shoot assigned',
                  icon: '/logo-nonsquare.png',
                  badge: '/logo-nonsquare.png',
                  data: { url: n.link || '/admin/calendar' },
                  vibrate: [200, 100, 200],
                });
                return;
              }
            }
            new Notification(n.title || '📸 Candy Pic Alert', {
              body: n.message,
              icon: '/logo-nonsquare.png',
            });
          } catch (e) {
            console.error('[CandyPic Push Listener] Postgres notification display error:', e);
          }
        }
      })
      .subscribe((status) => {
        console.log('[CandyPic Push Listener] Channel studio-live-events subscription status:', status);
      });

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
