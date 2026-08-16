import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaFolderOpen,
  FaImages,
  FaCalendarAlt,
  FaBell,
  FaArrowRight,
  FaPlus,
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaWhatsapp,
  FaKey,
  FaPaperPlane,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { listClientEvents, listAllImages, listAdminNotifications } from '../../lib/galleryApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    submittedAlbums: 0,
    totalShowcase: 0,
    totalBookings: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Events
        const events = await listClientEvents();
        setRecentEvents(events.slice(0, 6));

        // 2. Showcase
        const showcase = await listAllImages();

        // 3. Bookings
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        setRecentBookings(bookings || []);

        // 4. Notifications
        const notifs = await listAdminNotifications(5);
        setRecentNotifs(notifs);

        setStats({
          totalEvents: events.length,
          activeEvents: events.filter((e) => e.status === 'active' || e.status === 'in_selection').length,
          submittedAlbums: events.filter((e) => e.status === 'submitted').length,
          totalShowcase: showcase.length,
          totalBookings: bookings ? bookings.length : 0,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout
      title="Studio Command Center"
      subtitle="Overview of client vaults, album proofing submissions, and booking leads"
      actions={
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/calendar"
            className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <FaCalendarAlt size={11} className="text-brand-gold" /> Calendar
          </Link>
          <Link
            to="/admin/events"
            className="rounded-full px-5 py-2 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 flex items-center gap-1.5"
          >
            <FaPlus size={10} /> New Client Vault
          </Link>
        </div>
      }
    >
      <div className="space-y-7">
        {/* =========================================================================
            1. STATS OVERVIEW CARDS (Balanced Grid)
            ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {/* Card 1: Client Vaults */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden group hover:border-brand-gold/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-brand-muted font-medium">
                Client Vaults
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
                <FaFolderOpen />
              </div>
            </div>
            <p className="font-serif text-2xl sm:text-4xl text-white font-bold">{stats.totalEvents}</p>
            <p className="text-[11px] text-brand-muted mt-1">{stats.activeEvents} active galleries</p>
          </div>

          {/* Card 2: Album Proofs Ready for Design */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-brand-gold/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden group hover:border-brand-gold/60 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-brand-gold font-semibold">
                Albums Submitted
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-gold text-brand-dark flex items-center justify-center font-bold">
                <FaPaperPlane />
              </div>
            </div>
            <p className="font-serif text-2xl sm:text-4xl text-white font-bold text-brand-gold">
              {stats.submittedAlbums}
            </p>
            <p className="text-[11px] text-brand-muted mt-1">Ready for Lightroom / Print</p>
          </div>

          {/* Card 3: Showcase Images */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-brand-muted font-medium">
                Showcase Photos
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                <FaImages />
              </div>
            </div>
            <p className="font-serif text-2xl sm:text-4xl text-white font-bold">{stats.totalShowcase}</p>
            <p className="text-[11px] text-brand-muted mt-1">Live portfolio frames</p>
          </div>

          {/* Card 4: Booking Inquiries */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden group hover:border-brand-red/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-brand-muted font-medium">
                Bookings &amp; Holds
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-red/15 text-brand-red flex items-center justify-center">
                <FaCalendarAlt />
              </div>
            </div>
            <p className="font-serif text-2xl sm:text-4xl text-white font-bold">{stats.totalBookings}</p>
            <p className="text-[11px] text-brand-muted mt-1">Calendar schedule holds</p>
          </div>
        </div>

        {/* =========================================================================
            2. MAIN DASHBOARD CONTENT (Two Column Grid)
            ========================================================================= */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-7 items-start">
          {/* LEFT 7 COLUMNS: Recent Client Vaults & Quick Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recent Client Vaults */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
                <div>
                  <h2 className="font-serif text-xl text-white">Recent Client Vaults</h2>
                  <p className="text-xs text-brand-muted font-light mt-0.5">
                    Photo proofing &amp; couple selection status
                  </p>
                </div>

                <Link
                  to="/admin/events"
                  className="rounded-full px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-brand-gold text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  View All <FaArrowRight size={10} />
                </Link>
              </div>

              {recentEvents.length === 0 ? (
                <div className="text-center py-10 bg-black/20 rounded-2xl border border-white/5">
                  <p className="text-sm text-brand-muted font-light mb-3">No client vaults created yet.</p>
                  <Link
                    to="/admin/events"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-gold hover:underline font-semibold"
                  >
                    <FaPlus size={10} /> Create Your First Vault
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base text-white font-medium">{evt.title}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              evt.status === 'submitted'
                                ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40'
                                : evt.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-white/10 text-brand-muted'
                            }`}
                          >
                            {evt.status === 'submitted' ? 'Album Submitted' : evt.status}
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted font-light mt-1 flex flex-wrap items-center gap-2">
                          <span>{evt.client_name}</span>
                          <span>•</span>
                          <span>PIN: <strong className="font-mono text-brand-gold">{evt.passcode}</strong></span>
                          <span>•</span>
                          <span>{evt.event_date ? new Date(evt.event_date).toLocaleDateString() : 'No date'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/portal/${evt.slug}`}
                          target="_blank"
                          className="rounded-full px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <FaExternalLinkAlt size={10} className="text-brand-gold" /> Client Link
                        </Link>

                        <Link
                          to={`/admin/events?select=${evt.id}`}
                          className="rounded-full px-3.5 py-1.5 bg-brand-gold/20 text-brand-gold hover:bg-brand-gold hover:text-brand-dark text-xs font-semibold uppercase tracking-wider transition-all"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Shortcuts */}
            <div className="grid sm:grid-cols-3 gap-3.5">
              <Link
                to="/admin/events"
                className="bg-white/[0.04] border border-white/10 hover:border-brand-gold/40 rounded-2xl p-4 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                  <FaFolderOpen size={18} />
                </div>
                <h4 className="font-serif text-sm text-white font-medium">Upload to Vault</h4>
                <p className="text-[11px] text-brand-muted font-light mt-0.5">Add photos to couple's gallery</p>
              </Link>

              <Link
                to="/admin/gallery"
                className="bg-white/[0.04] border border-white/10 hover:border-brand-gold/40 rounded-2xl p-4 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                  <FaImages size={18} />
                </div>
                <h4 className="font-serif text-sm text-white font-medium">Showcase Gallery</h4>
                <p className="text-[11px] text-brand-muted font-light mt-0.5">Publish photos to homepage</p>
              </Link>

              <Link
                to="/admin/calendar"
                className="bg-white/[0.04] border border-white/10 hover:border-brand-gold/40 rounded-2xl p-4 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                  <FaCalendarAlt size={18} />
                </div>
                <h4 className="font-serif text-sm text-white font-medium">Calendar &amp; Holds</h4>
                <p className="text-[11px] text-brand-muted font-light mt-0.5">Block dates &amp; assign crew</p>
              </Link>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: Recent Inquiries & Live Studio Alerts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Recent Inquiries */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <h2 className="font-serif text-lg text-white">Recent Inquiries &amp; Holds</h2>
                  <p className="text-[11px] text-brand-muted font-light mt-0.5">Website booking leads</p>
                </div>
                <Link
                  to="/admin/calendar"
                  className="text-xs text-brand-gold hover:underline font-semibold uppercase tracking-wider"
                >
                  Calendar →
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <p className="text-xs text-brand-muted font-light py-6 text-center">No recent inquiries.</p>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-black/25 border border-white/5 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{b.client_name}</p>
                          <p className="text-xs text-brand-gold mt-0.5 font-medium">{b.booking_date || 'Date TBD'}</p>
                          {b.event_type && (
                            <p className="text-[11px] text-brand-muted mt-1 leading-snug">{b.event_type}</p>
                          )}
                        </div>

                        {b.client_phone && (
                          <a
                            href={`https://wa.me/${b.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hi ${b.client_name}, this is Chandan from Candy Pic regarding your photoshoot booking on ${b.booking_date || 'your date'}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs shrink-0 hover:opacity-90 transition-opacity"
                            title="Chat on WhatsApp"
                          >
                            <FaWhatsapp size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Studio Alerts Feed */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <h2 className="font-serif text-lg text-white">Live Alerts</h2>
                  <p className="text-[11px] text-brand-muted font-light mt-0.5">Realtime notification feed</p>
                </div>
                <Link
                  to="/admin/notifications"
                  className="text-xs text-brand-gold hover:underline font-semibold uppercase tracking-wider"
                >
                  All Alerts →
                </Link>
              </div>

              {recentNotifs.length === 0 ? (
                <p className="text-xs text-brand-muted font-light py-6 text-center">All caught up! No unread alerts.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentNotifs.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs hover:border-brand-gold/30 transition-colors"
                    >
                      <p className="font-medium text-white">{n.title}</p>
                      <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-brand-gold font-mono block mt-1">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
