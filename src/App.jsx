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
import CrewCalendar from './pages/crew/CrewCalendar';

// Shell & Context
import Preloader from './components/Preloader';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Component that listens for targeted notifications for the currently logged-in crew member
function RealtimePushManager() {
  const { session, user, crewProfile, isSuperAdmin } = useAuth();

  useEffect(() => {
    const hasNotification = typeof Notification !== 'undefined';
    if (!hasNotification) return;

    const currentEmail = (user?.email || session?.user?.email || '').toLowerCase().trim();
    const currentName = (crewProfile?.name || '').toLowerCase().trim();

    console.log('[CandyPic Push Listener] Initialized for user:', currentEmail, currentName || '(admin)');

    const channel = supabase.channel('studio-live-events', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'shoot-assigned' }, async ({ payload }) => {
        console.log('[CandyPic Push Listener] 🔔 Incoming shoot assignment broadcast:', payload);

        // Targeted Recipient Check:
        const assignedTarget = (payload.assignedTeam || '').toLowerCase().trim();
        const assignedList = Array.isArray(payload.assignedCrew)
          ? payload.assignedCrew.map((c) => c.toLowerCase().trim())
          : [assignedTarget];

        // Is this device's logged-in user among the assigned crew?
        const isRecipient =
          (currentName && assignedList.some((name) => name.includes(currentName) || currentName.includes(name))) ||
          (currentEmail && assignedList.some((name) => name.includes(currentEmail) || currentEmail.includes(name))) ||
          (!currentEmail && !currentName); // Standalone PWA without login yet

        if (!isRecipient) {
          console.log(`[CandyPic Push Listener] ⏭️ Notification is targeted for ${assignedTarget}. Skipping display on this device.`);
          return;
        }

        console.log(`[CandyPic Push Listener] 🎯 Notification matches this device (${currentName || currentEmail}). Triggering alert...`);

        if (Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              if (reg && reg.showNotification) {
                await reg.showNotification(payload.title || '📸 Candy Pic Shoot Assignment', {
                  body: payload.body || 'You have been assigned to an upcoming wedding shoot.',
                  icon: '/logo-nonsquare.png',
                  badge: '/logo-nonsquare.png',
                  data: { url: '/crew/calendar' },
                  vibrate: [200, 100, 200],
                });
                console.log('[CandyPic Push Listener] ✅ ServiceWorker showNotification triggered for assigned crew!');
                return;
              }
            }
            new Notification(payload.title || '📸 Candy Pic Shoot Assignment', {
              body: payload.body,
              icon: '/logo-nonsquare.png',
            });
          } catch (e) {
            console.error('[CandyPic Push Listener] ❌ Notification display error:', e);
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, async (payload) => {
        const n = payload.new;
        if (!n) return;

        // If it's a general admin alert (e.g. new applicant), only show to Super Admin
        if (n.type === 'general' && !isSuperAdmin) {
          return;
        }

        // If it's a shoot assignment, check target metadata
        if (n.metadata?.assigned_to) {
          const target = n.metadata.assigned_to.toLowerCase().trim();
          const matchesMe =
            (currentName && (target.includes(currentName) || currentName.includes(target))) ||
            (currentEmail && (target.includes(currentEmail) || currentEmail.includes(target)));

          if (!matchesMe && !isSuperAdmin) {
            return;
          }
        }

        if (Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              if (reg && reg.showNotification) {
                await reg.showNotification(n.title || '📸 Candy Pic Alert', {
                  body: n.message || 'New shoot assigned',
                  icon: '/logo-nonsquare.png',
                  badge: '/logo-nonsquare.png',
                  data: { url: n.link || '/crew/calendar' },
                  vibrate: [200, 100, 200],
                });
                return;
              }
            }
            new Notification(n.title || '📸 Candy Pic Alert', {
              body: n.message,
              icon: '/logo-nonsquare.png',
            });
          } catch (e) {}
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, user, crewProfile, isSuperAdmin]);

  return null;
}

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {/* Preloader (initial load only) */}
      <AnimatePresence mode="wait">
        {loading && <Preloader key="preloader" onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <AuthProvider>
          <RealtimePushManager />
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
                    <ProtectedRoute requireAdmin={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminEvents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/gallery"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminGallery />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/calendar"
                  element={
                    <ProtectedRoute requireAdmin={true}>
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
                    <ProtectedRoute requireAdmin={true}>
                      <AdminCrew />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminNotifications />
                    </ProtectedRoute>
                  }
                />

                {/* ── Dedicated Crew Member Portal (Assigned Calendar Only) ── */}
                <Route
                  path="/crew/calendar"
                  element={
                    <ProtectedRoute>
                      <CrewCalendar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/crew"
                  element={<Navigate to="/crew/calendar" replace />}
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
