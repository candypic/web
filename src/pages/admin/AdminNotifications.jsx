import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaBell,
  FaCheckCircle,
  FaCalendarAlt,
  FaPaperPlane,
  FaExternalLinkAlt,
  FaTrashAlt,
  FaCheckDouble,
  FaInfoCircle,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { listAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../lib/galleryApi';
import { supabase } from '../../lib/supabaseClient';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await listAdminNotifications(60);
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const channel = supabase
      .channel('admin-notifs-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, () => {
        fetchNotifs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout
      title="Studio Alert Feed"
      subtitle="Realtime notifications for wedding bookings, date holds, and client album submissions"
      actions={
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
        >
          <FaCheckDouble size={12} /> Mark All as Read
        </button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {loading ? (
          <p className="text-center text-xs text-brand-muted py-12">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center text-brand-muted">
            <FaBell className="text-4xl text-brand-gold/40 mx-auto mb-3" />
            <h3 className="font-serif text-xl text-white mb-1">No Alerts Right Now</h3>
            <p className="text-xs font-light">New client inquiries &amp; album submissions will appear here live.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isUnread = !n.is_read;
              const isAlbum = n.type === 'album_submission';

              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                    isUnread
                      ? 'bg-brand-gold/10 border-brand-gold/40 shadow-lg shadow-brand-gold/5'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                        isAlbum
                          ? 'bg-brand-gold text-brand-dark font-bold'
                          : 'bg-brand-red/20 text-brand-red'
                      }`}
                    >
                      {isAlbum ? <FaPaperPlane /> : <FaCalendarAlt />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base text-white font-medium">{n.title}</h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-brand-muted font-light mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-brand-gold/70 font-mono block mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {n.link && (
                      <Link
                        to={n.link}
                        className="rounded-full px-4 py-1.5 bg-brand-gold text-brand-dark text-xs font-semibold uppercase tracking-wider flex items-center gap-1 hover:bg-brand-gold-soft"
                      >
                        View <FaExternalLinkAlt size={9} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
