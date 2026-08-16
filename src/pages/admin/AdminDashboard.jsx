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
  FaPhoneAlt,
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
        setRecentEvents(events.slice(0, 5));

        // 2. Showcase
        const showcase = await listAllImages();

        // 3. Bookings
        const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5);
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
        <Link
          to="/admin/events"
          className="rounded-full px-5 py-2.5 bg-brand-gold text-brand-dark font-semibold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 flex items-center gap-2"
        >
          <FaPlus size={10} /> Create Client Vault
        </Link>
      }
    >
      {/* =========================================================================
          1. STATS OVERVIEW CARDS
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Card 1: Client Vaults */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-brand-muted font-medium">Client Vaults</span>
            <div className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
              <FaFolderOpen />
            </div>
          </div>
          <p className="font-serif text-3xl sm:text-4xl text-white font-bold">{stats.totalEvents}</p>
          <p className="text-[11px] text-brand-muted mt-1">{stats.activeEvents} currently active</p>
        </div>

        {/* Card 2: Album Proofs Ready for Design */}
        <div className="bg-white/5 backdrop-blur-xl border border-brand-gold/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-brand-gold font-semibold">Albums Submitted</span>
            <div className="w-10 h-10 rounded-xl bg-brand-gold text-brand-dark flex items-center justify-center font-bold">
              <FaPaperPlane />
            </div>
          </div>
          <p className="font-serif text-3xl sm:text-4xl text-white font-bold text-brand-gold">{stats.submittedAlbums}</p>
          <p className="text-[11px] text-brand-muted mt-1">Ready for album layout design</p>
        </div>

        {/* Card 3: Showcase Images */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-brand-muted font-medium">Showcase Photos</span>
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <FaImages />
            </div>
          </div>
          <p className="font-serif text-3xl sm:text-4xl text-white font-bold">{stats.totalShowcase}</p>
          <p className="text-[11px] text-brand-muted mt-1">Public portfolio gallery</p>
        </div>

        {/* Card 4: Booking Inquiries */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-brand-muted font-medium">Bookings / Leads</span>
            <div className="w-10 h-10 rounded-xl bg-brand-red/15 text-brand-red flex items-center justify-center">
              <FaCalendarAlt />
            </div>
          </div>
          <p className="font-serif text-3xl sm:text-4xl text-white font-bold">{stats.totalBookings}</p>
          <p className="text-[11px] text-brand-muted mt-1">Calendar holds &amp; requests</p>
        </div>
      </div>

      {/* =========================================================================
          2. TWO COLUMN WORKSPACE
          ========================================================================= */}
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        {/* LEFT 2 COLS: Recent Client Vaults */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-serif text-xl text-white">Recent Client Vaults</h2>
                <p className="text-xs text-brand-muted font-light">Photo proofing &amp; album selection status</p>
              </div>

              <Link
                to="/admin/events"
                className="text-xs font-semibold text-brand-gold hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                View All <FaArrowRight size={10} />
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <p className="text-sm text-brand-muted font-light py-8 text-center">No client vaults created yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      <p className="text-xs text-brand-muted font-light mt-0.5">
                        {evt.client_name} • PIN: <span className="font-mono text-brand-gold">{evt.passcode}</span> •{' '}
                        {evt.event_date ? new Date(evt.event_date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/portal/${evt.slug}`}
                        target="_blank"
                        className="rounded-full px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5"
                      >
                        <FaExternalLinkAlt size={10} /> Client Link
                      </Link>

                      <Link
                        to={`/admin/events?select=${evt.id}`}
                        className="rounded-full px-3 py-1.5 bg-brand-gold/20 text-brand-gold hover:bg-brand-gold hover:text-brand-dark text-xs font-semibold uppercase tracking-wider"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              to="/admin/events"
              className="bg-white/5 border border-white/10 hover:border-brand-gold/40 rounded-3xl p-5 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FaFolderOpen size={20} />
              </div>
              <h4 className="font-serif text-base text-white">Upload to Vault</h4>
              <p className="text-xs text-brand-muted font-light mt-1">Add photos to couple's private gallery</p>
            </Link>

            <Link
              to="/admin/gallery"
              className="bg-white/5 border border-white/10 hover:border-brand-gold/40 rounded-3xl p-5 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FaImages size={20} />
              </div>
              <h4 className="font-serif text-base text-white">Update Showcase</h4>
              <p className="text-xs text-brand-muted font-light mt-1">Publish new photos to homepage</p>
            </Link>

            <Link
              to="/admin/calendar"
              className="bg-white/5 border border-white/10 hover:border-brand-gold/40 rounded-3xl p-5 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FaCalendarAlt size={20} />
              </div>
              <h4 className="font-serif text-base text-white">Manage Dates</h4>
              <p className="text-xs text-brand-muted font-light mt-1">Check availability &amp; bookings</p>
            </Link>
          </div>
        </div>

        {/* RIGHT 1 COL: Recent Inquiries & Notifications */}
        <div className="space-y-6">
          {/* Recent Inquiries */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-white">Recent Inquiries</h2>
              <Link to="/admin/calendar" className="text-xs text-brand-gold hover:underline">
                Calendar
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <p className="text-xs text-brand-muted font-light py-4 text-center">No recent inquiries.</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div key={b.id} className="p-3.5 rounded-2xl bg-black/20 border border-white/5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{b.client_name}</p>
                        <p className="text-xs text-brand-gold mt-0.5">{b.booking_date || 'Date TBD'}</p>
                        {b.event_type && <p className="text-[11px] text-brand-muted mt-1">{b.event_type}</p>}
                      </div>

                      {b.client_phone && (
                        <a
                          href={`https://wa.me/${b.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hi ${b.client_name}, this is Chandan from Candy Pic! Thank you for inquiring about ${b.booking_date || 'your wedding date'}.`
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

          {/* Activity Alerts */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-white">Studio Alerts</h2>
              <Link to="/admin/notifications" className="text-xs text-brand-gold hover:underline">
                View All
              </Link>
            </div>

            {recentNotifs.length === 0 ? (
              <p className="text-xs text-brand-muted font-light py-4 text-center">All caught up!</p>
            ) : (
              <div className="space-y-2.5">
                {recentNotifs.map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
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
    </AdminLayout>
  );
}
