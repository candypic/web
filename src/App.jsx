import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabaseClient';

// Public Pages
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
import HomeGate from './components/HomeGate';
import { AuthProvider, useAuth } from './context/AuthContext';
import { showCrewNotification } from './lib/notifications';

// Component that listens for targeted notifications for the currently logged-in crew member
function RealtimePushManager() {
  const { session, user, crewProfile, isSuperAdmin } = useAuth();

  useEffect(() => {
    const hasNotification = typeof Notification !== 'undefined';
    if (!hasNotification) return;

    let localCrewName = '';
    let localCrewEmail = '';
    try {
      localCrewName = (localStorage.getItem('candy_crew_name') || '').toLowerCase().trim();
      localCrewEmail = (localStorage.getItem('candy_crew_email') || '').toLowerCase().trim();
    } catch (e) {}

    const currentEmail = (user?.email || session?.user?.email || localCrewEmail || '').toLowerCase().trim();
    const currentName = (crewProfile?.name || localCrewName || '').toLowerCase().trim();

    console.log('[CandyPic Push Listener] Initialized for crew identity:', currentName || '(unnamed)', currentEmail || '(no email)');

    // Every deep link carries the crew member's email so tapping the
    // notification both opens their calendar AND resolves/persists their
    // identity on this device — a 1-tap "login" with no separate step.
    const crewCalendarUrl = (email) =>
      `/crew/calendar${email ? `?email=${encodeURIComponent(email)}` : ''}`;

    const channel = supabase.channel('studio-live-events', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'shoot-assigned' }, async ({ payload }) => {
        console.log('[CandyPic Push Listener] 🔔 Incoming shoot assignment broadcast:', payload);

        // Targeted Recipient Check:
        const assignedTarget = (payload.assignedTeam || '').toLowerCase().trim();
        const assignedEmail = (payload.email || '').toLowerCase().trim();
        const assignedList = Array.isArray(payload.assignedCrew)
          ? payload.assignedCrew.map((c) => c.toLowerCase().trim())
          : [assignedTarget];

        // Is this device's user among the assigned crew?
        const isRecipient =
          (currentName && assignedList.some((name) => name.includes(currentName) || currentName.includes(name))) ||
          (currentEmail && (assignedEmail === currentEmail || assignedList.some((name) => name.includes(currentEmail) || currentEmail.includes(name)))) ||
          (!currentEmail && !currentName); // Unregistered PWA fallback

        if (!isRecipient) {
          console.log(`[CandyPic Push Listener] ⏭️ Notification is targeted for ${assignedTarget}. Skipping on this device (${currentName || currentEmail}).`);
          return;
        }

        console.log(`[CandyPic Push Listener] 🎯 Notification matches this device (${currentName || currentEmail}). Triggering alert...`);

        await showCrewNotification(payload.title || '📸 Candy Pic Shoot Assignment', {
          body: payload.body || 'You have been assigned to an upcoming wedding shoot.',
          url: payload.url || crewCalendarUrl(payload.email || currentEmail),
        });
      })
      .on('broadcast', { event: 'profile-approved' }, async ({ payload }) => {
        console.log('[CandyPic Push Listener] 🔔 Profile approved broadcast received:', payload);

        const targetName = (payload.assignedTeam || '').toLowerCase().trim();
        const targetEmail = (payload.email || '').toLowerCase().trim();

        const matchesMe =
          (currentName && (targetName.includes(currentName) || currentName.includes(targetName))) ||
          (currentEmail && (targetEmail.includes(currentEmail) || currentEmail.includes(targetEmail))) ||
          (!currentEmail && !currentName);

        if (!matchesMe) {
          console.log(`[CandyPic Push Listener] ⏭️ Approval notification is for ${targetName}. Skipping on this device.`);
          return;
        }

        console.log(`[CandyPic Push Listener] 🎯 Profile approved for this device!`);

        // Save approved credentials locally
        try {
          if (payload.assignedTeam) localStorage.setItem('candy_crew_name', payload.assignedTeam);
          if (payload.email) localStorage.setItem('candy_crew_email', payload.email);
        } catch (e) {}

        await showCrewNotification(payload.title || '🎉 Profile Approved! Welcome to Crew', {
          body: payload.body || 'Chandan approved your crew profile. Tap to open your schedule.',
          url: payload.url || crewCalendarUrl(payload.email),
          vibrate: [300, 100, 300],
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, async (payload) => {
        const n = payload.new;
        if (!n) return;

        // If it's a general admin alert (e.g. new applicant), only show to Super Admin
        if (n.type === 'general' && !isSuperAdmin) {
          return;
        }

        // If it's targeted at a specific crew member (shoot assignment,
        // profile approval), only that device should be alerted — even if
        // this happens to be the admin's own device, e.g. right after they
        // performed the approval/assignment themselves. Being super admin
        // only bypasses the *untargeted* check above.
        if (n.metadata?.assigned_to) {
          const target = n.metadata.assigned_to.toLowerCase().trim();
          const targetEmail = (n.metadata.email || '').toLowerCase().trim();
          const matchesMe =
            (currentName && (target.includes(currentName) || currentName.includes(target))) ||
            (currentEmail && (targetEmail === currentEmail || target.includes(currentEmail) || currentEmail.includes(target)));

          if (!matchesMe) {
            return;
          }
        }

        await showCrewNotification(n.title || '📸 Candy Pic Alert', {
          body: n.message || 'New shoot assigned',
          url: n.link || crewCalendarUrl(n.metadata?.email || currentEmail),
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'crew_profiles' }, async (payload) => {
        const newProfile = payload.new;
        console.log('[CandyPic Push Listener] 🔔 crew_profiles UPDATE received:', newProfile);
        if (newProfile && newProfile.status === 'approved') {
          const targetName = (newProfile.name || '').toLowerCase().trim();
          const targetEmail = (newProfile.email || '').toLowerCase().trim();

          const matchesMe =
            (currentName && (targetName.includes(currentName) || currentName.includes(targetName))) ||
            (currentEmail && (targetEmail.includes(currentEmail) || currentEmail.includes(targetEmail))) ||
            (!currentEmail && !currentName);

          if (!matchesMe) {
            console.log(`[CandyPic Push Listener] ⏭️ Approval update is for ${targetName}. Skipping on this device.`);
            return;
          }

          console.log('[CandyPic Push Listener] 🎯 Profile approved via database update! Triggering alert...');

          // Save credentials locally
          try {
            localStorage.setItem('candy_crew_name', newProfile.name);
            localStorage.setItem('candy_crew_email', newProfile.email);
          } catch (e) {}

          await showCrewNotification('🎉 Profile Approved! Welcome to Crew', {
            body: `Hi ${newProfile.name}! Chandan approved your profile as ${newProfile.role}. Tap to open your schedule.`,
            url: crewCalendarUrl(newProfile.email),
            vibrate: [300, 100, 300],
          });
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
                <Route path="/" element={<HomeGate />} />
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
