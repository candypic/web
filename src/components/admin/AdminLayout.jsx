import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTachometerAlt,
  FaImages,
  FaCalendarAlt,
  FaBell,
  FaSignOutAlt,
  FaExternalLinkAlt,
  FaFolderOpen,
  FaBars,
  FaTimes,
  FaPlus,
  FaUsers,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { listAdminNotifications, listCrewMembers } from '../../lib/galleryApi';
import logo from '/logo-nonsquare.png';

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { path: '/admin/events', label: 'Client Vaults & Proofs', icon: FaFolderOpen },
  { path: '/admin/gallery', label: 'Showcase Gallery', icon: FaImages },
  { path: '/admin/calendar', label: 'Calendar & Leads', icon: FaCalendarAlt },
  { path: '/admin/crew', label: 'Crew & Approvals', icon: FaUsers },
  { path: '/admin/notifications', label: 'Alerts', icon: FaBell },
];

export default function AdminLayout({ children, title, subtitle, actions }) {
  const { session, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCrewCount, setPendingCrewCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch unread notifications & pending crew
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const [notifs, crew] = await Promise.all([
          listAdminNotifications(50).catch(() => []),
          listCrewMembers('all').catch(() => []),
        ]);
        const unread = notifs.filter((n) => !n.is_read).length;
        setUnreadCount(unread);

        const pending = crew.filter((c) => c.status === 'pending').length;
        setPendingCrewCount(pending);
      } catch (err) {
        console.error('Error loading counters:', err);
      }
    };

    fetchCounters();

    // Auto-request notification permission for logged in admin if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const channel = supabase
      .channel('admin-layout-counters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, (payload) => {
        fetchCounters();
        if (payload.eventType === 'INSERT' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(payload.new?.title || '📸 Candy Pic Alert', {
              body: payload.new?.message || 'New studio activity',
              icon: '/logo-192.png',
            });
          } catch (e) {}
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_profiles' }, (payload) => {
        fetchCounters();
        if (payload.eventType === 'INSERT' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('👥 New Crew Registration', {
              body: `${payload.new?.name} (${payload.new?.role}) registered to join the crew. Awaiting your approval.`,
              icon: '/logo-192.png',
            });
          } catch (e) {}
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker text-brand-text flex flex-col md:flex-row relative selection:bg-brand-gold selection:text-brand-dark pb-16 md:pb-0">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-red/5 rounded-full blur-[130px] pointer-events-none" />

      {/* =========================================================================
          1. DESKTOP SIDEBAR
          ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 bg-brand-dark/95 border-r border-white/10 p-6 z-30 sticky top-0 h-screen">
        <div>
          {/* Studio Brand */}
          <Link to="/" className="flex items-center gap-3 mb-8 focus-visible:outline-none">
            <img src={logo} alt="Candy Pic" className="h-10 w-auto" />
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold block">
                Studio Admin
              </span>
              <span className="font-serif text-lg text-white font-semibold leading-none">
                Candy Pic Hub
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-gold text-brand-dark font-semibold shadow-lg shadow-brand-gold/20'
                      : 'text-brand-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={isActive ? 'text-brand-dark' : 'text-brand-gold/80'} size={16} />
                    <span>{item.label}</span>
                  </div>

                  {item.path === '/admin/notifications' && unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}

                  {item.path === '/admin/crew' && pendingCrewCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-brand-red text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {pendingCrewCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Live site + Sign out) */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider text-brand-muted hover:text-white hover:bg-white/5 transition-colors font-medium"
          >
            <FaExternalLinkAlt size={12} className="text-brand-gold" />
            <span>View Public Site</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider text-brand-muted hover:text-brand-red hover:bg-brand-red/10 transition-colors font-medium text-left cursor-pointer"
          >
            <FaSignOutAlt size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. MOBILE TOP HEADER
          ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 bg-brand-dark/95 backdrop-blur-xl border-b border-white/10 px-3.5 py-2.5 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Candy Pic" className="h-7 w-auto object-contain" />
          <span className="font-serif text-sm text-white font-semibold">Admin Hub</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link
            to="/admin/notifications"
            className="relative p-2 rounded-full bg-white/5 text-brand-gold hover:bg-white/10 transition-colors"
          >
            <FaBell size={14} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-brand-red text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/"
            target="_blank"
            className="p-2 rounded-full bg-white/5 text-brand-muted hover:text-white transition-colors"
            title="View Public Website"
          >
            <FaExternalLinkAlt size={12} />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 rounded-full bg-white/5 text-brand-muted hover:text-brand-red hover:bg-brand-red/10 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <FaSignOutAlt size={12} />
          </button>
        </div>
      </header>

      {/* =========================================================================
          3. MAIN CONTENT CONTAINER
          ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Top bar header */}
        <div className="border-b border-white/10 bg-brand-dark/50 px-3.5 sm:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="font-serif text-xl sm:text-3xl text-white leading-tight">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-brand-muted font-light mt-0.5 sm:mt-1">{subtitle}</p>}
            </div>

            {actions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">{actions}</div>}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-3 sm:p-8 max-w-7xl mx-auto w-full flex-1">{children}</div>
      </main>

      {/* =========================================================================
          4. MOBILE BOTTOM APP NAVIGATION BAR (Optimized 6-Column Layout)
          ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-brand-dark/95 backdrop-blur-2xl border-t border-white/10 px-1 py-1.5 flex items-center justify-around pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-2xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-[9px] font-medium transition-all relative ${
                isActive ? 'text-brand-gold font-bold bg-white/5' : 'text-brand-muted hover:text-white'
              }`}
            >
              <Icon size={16} className="mb-0.5" />
              <span className="truncate max-w-full text-center">{item.label.split(' ')[0]}</span>

              {item.path === '/admin/notifications' && unreadCount > 0 && (
                <span className="absolute top-0 right-2 w-3.5 h-3.5 rounded-full bg-brand-red text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}

              {item.path === '/admin/crew' && pendingCrewCount > 0 && (
                <span className="absolute top-0 right-2 px-1 py-0.2 rounded-full bg-brand-red text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
                  {pendingCrewCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
