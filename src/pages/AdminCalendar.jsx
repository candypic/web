import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
} from 'date-fns';
import {
  FaChevronLeft,
  FaChevronRight,
  FaWhatsapp,
  FaBan,
  FaUser,
  FaPhone,
  FaCalendarAlt,
  FaTrashAlt,
  FaCheckCircle,
  FaInfoCircle,
  FaPlus,
  FaEdit,
  FaTimes,
  FaKey,
  FaFolderOpen,
  FaExternalLinkAlt,
  FaCheck,
  FaLock,
  FaShieldAlt,
  FaFilter,
  FaShareAlt,
} from 'react-icons/fa';
import BottomDrawer from '../components/BottomDrawer';
import AdminLayout from '../components/admin/AdminLayout';
import { listClientEvents, createClientEvent } from '../lib/galleryApi';
import { Link } from 'react-router-dom';

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [clientEvents, setClientEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create' | 'block' | 'credentials'
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'bookings' | 'blocks' | 'pending'

  // Generated Credentials Modal State
  const [generatedVault, setGeneratedVault] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    endDate: '',
    eventType: 'Wedding Photography',
    assignedTo: [],
    additionalInfo: '',
  });

  // Block Reason state
  const [blockReason, setBlockReason] = useState('Fully Booked');

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    const [{ data: bookingsData }, eventsData] = await Promise.all([
      supabase.from('bookings').select('*').order('booking_date', { ascending: true }),
      listClientEvents().catch(() => []),
    ]);

    if (bookingsData) setBookings(bookingsData);
    if (eventsData) setClientEvents(eventsData);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin-calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 2. CALENDAR MATH ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const jumpToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day) => {
    return bookings.filter((booking) => {
      if (!booking.booking_date) return false;
      const [year, month, d] = booking.booking_date.split('-').map(Number);
      const start = new Date(year, month - 1, d);

      if (booking.booking_end_date) {
        const [endYear, endMonth, endD] = booking.booking_end_date.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endD);
        return isWithinInterval(day, { start, end });
      }
      return isSameDay(start, day);
    });
  };

  const handleDateClick = (day) => {
    setSelectedDate(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    setFormData({
      clientName: '',
      clientPhone: '',
      endDate: dateStr,
      eventType: 'Wedding Photography',
      assignedTo: [],
      additionalInfo: '',
    });
    setEditingId(null);
    setViewMode('list');
    setIsDrawerOpen(true);
  };

  // --- 3. CREATE / UPDATE BOOKING ---
  const handleSaveBooking = async (e) => {
    if (e) e.preventDefault();
    if (!selectedDate || !formData.clientName.trim()) {
      alert('Please enter client name');
      return;
    }

    setIsLoading(true);
    try {
      const formattedStartDate = format(selectedDate, 'yyyy-MM-dd');
      const payload = {
        client_name: formData.clientName.trim(),
        client_phone: formData.clientPhone.trim(),
        booking_date: formattedStartDate,
        booking_end_date: formData.endDate || formattedStartDate,
        event_type: formData.eventType || 'Wedding Photography',
        status: 'confirmed',
        assigned_to: formData.assignedTo.map((p) => p.name).join(', '),
        assigned_phones: formData.assignedTo.map((p) => p.phone),
        additional_info: formData.additionalInfo,
      };

      if (editingId) {
        const { error } = await supabase.from('bookings').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bookings').insert([payload]);
        if (error) throw error;
      }

      await fetchData();
      setViewMode('list');
    } catch (error) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. QUICK BLOCK DATE ---
  const handleBlockDate = async (reason) => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const payload = {
        client_name: 'BLOCKED',
        client_phone: '',
        booking_date: formattedDate,
        booking_end_date: formattedDate,
        event_type: 'Block',
        status: 'confirmed',
        additional_info: reason || blockReason,
      };

      const { error } = await supabase.from('bookings').insert([payload]);
      if (error) throw error;

      await fetchData();
      setViewMode('list');
    } catch (error) {
      alert(`Failed to block date: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. DELETE / UNBLOCK ---
  const handleDelete = async (id) => {
    if (!confirm('Delete / unblock this calendar entry?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      alert('Failed to delete entry');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 6. GENERATE CLIENT VAULT & CREDENTIALS ---
  const handleGenerateCredentials = async (booking) => {
    setIsLoading(true);
    try {
      // Check if client event already exists for this booking date and client
      const existing = clientEvents.find(
        (e) =>
          e.client_phone === booking.client_phone ||
          (e.event_date === booking.booking_date && e.client_name.toLowerCase() === booking.client_name.toLowerCase())
      );

      if (existing) {
        setGeneratedVault(existing);
        setViewMode('credentials');
        return;
      }

      // Generate random 4-digit PIN and clean slug
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      const guestPin = 'GUEST';
      const cleanSlug = `${booking.client_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${booking.booking_date.slice(0, 4)}`;

      const newVault = await createClientEvent({
        title: `${booking.client_name}'s Wedding`,
        slug: cleanSlug,
        client_name: booking.client_name,
        client_phone: booking.client_phone || '+91 98765 43210',
        event_date: booking.booking_date,
        passcode: pin,
        guest_passcode: guestPin,
        target_album_photos: 100,
        status: 'active',
        is_live_gallery: false,
      });

      await fetchData();
      setGeneratedVault(newVault);
      setViewMode('credentials');
    } catch (err) {
      alert(`Could not generate credentials: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy WhatsApp Invite
  const handleCopyWhatsAppInvite = () => {
    if (!generatedVault) return;
    const url = `${window.location.origin}/portal/${generatedVault.slug}`;
    const text =
      `📸 *Candy Pic — Private Wedding Memory Vault*\n\n` +
      `Hello ${generatedVault.client_name}!\n` +
      `Your private wedding photo gallery and album selection portal is ready:\n\n` +
      `🔗 *Portal Link:* ${url}\n` +
      `🔑 *Master PIN:* ${generatedVault.passcode} (for photo selection & high-res downloads)\n` +
      `👥 *Guest PIN:* ${generatedVault.guest_passcode} (share with family & friends)\n\n` +
      `Warm regards,\n` +
      `Chandan Naik | Candy Pic Kumta`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const eventsOnSelectedDate = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <AdminLayout
      title="Studio Calendar &amp; Client Access"
      subtitle="Manage shoot bookings, block dates, and generate client portal credentials"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={jumpToday}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-white/10 rounded-full p-0.5">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <FaChevronLeft size={11} />
            </button>
            <span className="font-serif text-xs font-semibold text-white px-3 whitespace-nowrap">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <FaChevronRight size={11} />
            </button>
          </div>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* =========================================================================
            CALENDAR GRID CONTAINER
            ========================================================================= */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-7 shadow-2xl">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div
                key={d}
                className={`text-[11px] font-bold uppercase tracking-wider py-2 ${
                  i === 0 || i === 6 ? 'text-brand-red' : 'text-brand-muted'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isBlocked = dayEvents.some((e) => e.event_type === 'Block' || e.client_name === 'BLOCKED');
              const hasBooking = dayEvents.some((e) => e.event_type !== 'Block' && e.client_name !== 'BLOCKED');

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[80px] sm:min-h-[105px] p-2 sm:p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'border-brand-gold bg-brand-gold/15 ring-2 ring-brand-gold'
                      : isBlocked
                      ? 'bg-brand-red/10 border-brand-red/30 hover:border-brand-red/60'
                      : hasBooking
                      ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60'
                      : isToday
                      ? 'bg-white/10 border-white/30'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday
                          ? 'bg-brand-gold text-brand-dark font-bold'
                          : isSelected
                          ? 'text-brand-gold'
                          : 'text-white/80'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Quick indicator badge */}
                    {isBlocked && (
                      <span className="w-2 h-2 rounded-full bg-brand-red shrink-0" title="Date Blocked" />
                    )}
                    {hasBooking && !isBlocked && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Shoot Booked" />
                    )}
                  </div>

                  {/* Day Events Preview Chips */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const isBlk = ev.event_type === 'Block' || ev.client_name === 'BLOCKED';
                      return (
                        <div
                          key={ev.id}
                          className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                            isBlk
                              ? 'bg-brand-red/20 text-red-200 border border-brand-red/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isBlk ? '🚫 Blocked' : ev.client_name}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-brand-gold font-mono block">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            CALENDAR LEGEND
            ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-brand-muted">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span>Confirmed Photoshoot</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-red" />
              <span>Blocked / Unavailable</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-gold" />
              <span>Today</span>
            </span>
          </div>

          <span className="text-brand-gold font-light">Tip: Tap any date to view details, block it, or generate client PINs.</span>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM / SIDE DRAWER FOR DATE DETAILS & ACTIONS
          ========================================================================= */}
      <BottomDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <div className="p-5 sm:p-7 max-w-2xl mx-auto text-white">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-brand-gold font-bold">
                Date Workspace
              </span>
              <h2 className="font-serif text-2xl text-white">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Selected Date'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <FaTimes size={13} />
            </button>
          </div>

          {/* VIEW 1: LIST ACTIVITIES ON SELECTED DATE */}
          {viewMode === 'list' && (
            <div className="space-y-6">
              {/* Actions Bar */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('create')}
                  className="rounded-2xl p-3.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 cursor-pointer"
                >
                  <FaPlus size={12} /> Add Booking
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('block')}
                  className="rounded-2xl p-3.5 bg-brand-red/20 text-red-200 border border-brand-red/40 font-bold text-xs uppercase tracking-wider hover:bg-brand-red/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FaBan size={12} /> Block This Date
                </button>
              </div>

              {/* Entries on this date */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-brand-muted font-semibold mb-3">
                  Activities on this Date ({eventsOnSelectedDate.length})
                </h3>

                {eventsOnSelectedDate.length === 0 ? (
                  <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/5 text-brand-muted text-xs font-light">
                    No bookings or blocks on this date. Click buttons above to schedule.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventsOnSelectedDate.map((ev) => {
                      const isBlk = ev.event_type === 'Block' || ev.client_name === 'BLOCKED';
                      const existingVault = clientEvents.find(
                        (vault) =>
                          vault.event_date === ev.booking_date &&
                          vault.client_name.toLowerCase() === ev.client_name.toLowerCase()
                      );

                      return (
                        <div
                          key={ev.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isBlk ? 'bg-brand-red/10 border-brand-red/30' : 'bg-black/30 border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-serif text-lg text-white font-medium">
                                  {isBlk ? '🚫 Date Blocked' : ev.client_name}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    isBlk
                                      ? 'bg-brand-red text-white'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {ev.event_type}
                                </span>
                              </div>

                              {!isBlk && (
                                <p className="text-xs text-brand-muted mt-1 font-light flex items-center gap-2">
                                  <span>{ev.client_phone || 'No phone'}</span>
                                  {ev.assigned_to && (
                                    <span>• Team: <strong className="text-white">{ev.assigned_to}</strong></span>
                                  )}
                                </p>
                              )}

                              {ev.additional_info && (
                                <p className="text-xs text-brand-gold/80 italic mt-1 font-light">
                                  Note: &quot;{ev.additional_info}&quot;
                                </p>
                              )}
                            </div>

                            {/* Delete / Actions */}
                            <button
                              type="button"
                              onClick={() => handleDelete(ev.id)}
                              className="w-8 h-8 rounded-full bg-white/5 hover:bg-brand-red text-white flex items-center justify-center text-xs transition-colors shrink-0"
                              title="Delete / Unblock"
                            >
                              <FaTrashAlt size={11} />
                            </button>
                          </div>

                          {/* Client Credentials & WhatsApp Row (For Bookings Only) */}
                          {!isBlk && (
                            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                              {existingVault ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                    <FaCheckCircle /> Vault Active (PIN: {existingVault.passcode})
                                  </span>
                                  <Link
                                    to={`/admin/events?select=${existingVault.id}`}
                                    className="text-[11px] text-brand-gold hover:underline font-semibold"
                                  >
                                    Manage Photos
                                  </Link>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateCredentials(ev)}
                                  disabled={isLoading}
                                  className="rounded-full px-4 py-2 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-brand-gold-soft transition-all shadow-md shadow-brand-gold/10 cursor-pointer"
                                >
                                  <FaKey size={11} /> Generate Client PIN &amp; Vault
                                </button>
                              )}

                              {ev.client_phone && (
                                <a
                                  href={`https://wa.me/${ev.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                    `Hi ${ev.client_name}, this is Chandan from Candy Pic regarding your booking on ${ev.booking_date}.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-full px-3.5 py-1.5 bg-[#25D366] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                                >
                                  <FaWhatsapp size={13} /> WhatsApp
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: CREATE BOOKING */}
          {viewMode === 'create' && (
            <form onSubmit={handleSaveBooking} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg text-white">Add New Photoshoot Booking</h3>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="text-xs text-brand-muted hover:text-white"
                >
                  ← Back to List
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                  Client / Couple Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya & Varun"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                    Event Type
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full rounded-xl bg-brand-deep border border-white/15 px-3 py-2.5 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                  >
                    <option value="Wedding Photography">Wedding Photography</option>
                    <option value="Pre-Wedding Shoot">Pre-Wedding Shoot</option>
                    <option value="Engagement Ceremony">Engagement Ceremony</option>
                    <option value="Haldi Ceremony">Haldi Ceremony</option>
                    <option value="Event Coverage">Event Coverage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                  Additional Notes (Venue, Timings)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Nirvana Beach Kumta, sunrise session..."
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="rounded-full px-5 py-2.5 text-xs text-brand-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full px-6 py-2.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all shadow-md shadow-brand-gold/20"
                >
                  {isLoading ? 'Saving...' : 'Save Booking'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: BLOCK DATE */}
          {viewMode === 'block' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg text-white">Block This Date</h3>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="text-xs text-brand-muted hover:text-white"
                >
                  ← Back to List
                </button>
              </div>

              <p className="text-xs text-brand-muted font-light">
                Blocking this date marks it as unavailable on the public website calendar.
              </p>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-semibold">
                  Select Reason
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['Fully Booked', 'Personal / Holiday', 'Out of Town Shoot', 'Equipment Maintenance'].map(
                    (reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setBlockReason(reason)}
                        className={`p-3 rounded-xl border text-xs text-left transition-all ${
                          blockReason === reason
                            ? 'bg-brand-red/20 border-brand-red text-white font-semibold'
                            : 'bg-black/30 border-white/10 text-brand-muted hover:text-white'
                        }`}
                      >
                        {reason}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="rounded-full px-5 py-2.5 text-xs text-brand-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleBlockDate(blockReason)}
                  className="rounded-full px-6 py-2.5 bg-brand-red text-white font-bold text-xs uppercase tracking-wider hover:bg-red-600 transition-all shadow-md shadow-red-900/30"
                >
                  {isLoading ? 'Blocking...' : 'Confirm Block Date'}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: GENERATED CREDENTIALS CARD */}
          {viewMode === 'credentials' && generatedVault && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 text-brand-gold flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-brand-gold/10">
                  <FaKey />
                </div>
                <h3 className="font-serif text-2xl text-white">Client Vault &amp; PIN Generated!</h3>
                <p className="text-xs text-brand-muted font-light mt-1">
                  Share these credentials with {generatedVault.client_name} to access their gallery.
                </p>
              </div>

              {/* Credentials Box */}
              <div className="bg-black/40 border border-brand-gold/30 rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-brand-muted uppercase tracking-wider">Client Name:</span>
                  <span className="font-semibold text-white">{generatedVault.client_name}</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-brand-muted uppercase tracking-wider">Direct Portal Link:</span>
                  <span className="font-mono text-brand-gold">{`${window.location.origin}/portal/${generatedVault.slug}`}</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-brand-muted uppercase tracking-wider">Master PIN (Couple):</span>
                  <span className="font-mono text-xl text-brand-gold font-bold">{generatedVault.passcode}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-brand-muted uppercase tracking-wider">Guest PIN (Family):</span>
                  <span className="font-mono text-white font-semibold">{generatedVault.guest_passcode}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppInvite}
                  className="w-full rounded-full py-3.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 cursor-pointer"
                >
                  {copiedText ? <FaCheck /> : <FaShareAlt />}
                  {copiedText ? 'Copied to Clipboard!' : 'Copy Full WhatsApp Invite'}
                </button>

                <a
                  href={`https://wa.me/${(generatedVault.client_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `📸 *Candy Pic — Private Wedding Memory Vault*\n\nHello ${generatedVault.client_name}!\nYour private wedding photo gallery and album selection portal is ready:\n\n🔗 *Link:* ${window.location.origin}/portal/${generatedVault.slug}\n🔑 *Master PIN:* ${generatedVault.passcode}\n👥 *Guest PIN:* ${generatedVault.guest_passcode}\n\nWarm regards,\nChandan Naik | Candy Pic`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full py-3 bg-[#25D366] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <FaWhatsapp size={15} /> Send Directly on WhatsApp
                </a>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="text-xs text-brand-muted hover:text-white"
                  >
                    ← Back to Calendar
                  </button>

                  <Link
                    to={`/admin/events?select=${generatedVault.id}`}
                    className="text-xs text-brand-gold hover:underline font-semibold flex items-center gap-1"
                  >
                    <FaFolderOpen /> Open Vault &amp; Upload Photos →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </BottomDrawer>
    </AdminLayout>
  );
}
