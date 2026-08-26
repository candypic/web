import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isWithinInterval,
  differenceInDays,
  parseISO,
  isToday as checkIsToday,
  isTomorrow as checkIsTomorrow,
} from 'date-fns';
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaPhone,
  FaWhatsapp,
  FaSignOutAlt,
  FaClock,
  FaCamera,
  FaRoute,
  FaInfoCircle,
  FaCheck,
  FaCalendarDay,
  FaListUl,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import BottomDrawer from '../../components/BottomDrawer';
import logo from '/logo-nonsquare.png';

// Helper to filter out financial details from crew views
function sanitizeCrewDetails(info) {
  if (!info) return '';
  return info
    .split('|')
    .map((s) => s.trim())
    .filter(
      (s) =>
        !s.toLowerCase().includes('advance') &&
        !s.toLowerCase().includes('total') &&
        !s.toLowerCase().includes('budget') &&
        !s.includes('💰') &&
        !s.includes('💵')
    )
    .join('  •  ');
}

// Helper to get time of day greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function CrewCalendar() {
  const { session, crewProfile: authCrewProfile, user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [localProfile, setLocalProfile] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'calendar'
  const [selectedShootForDrawer, setSelectedShootForDrawer] = useState(null);

  // 1. Resolve Crew Member Profile
  useEffect(() => {
    const resolveCrewIdentity = async () => {
      if (authCrewProfile) {
        setLocalProfile(authCrewProfile);
        try {
          localStorage.setItem('candy_crew_name', authCrewProfile.name);
          localStorage.setItem('candy_crew_email', authCrewProfile.email);
        } catch (e) {}
        return;
      }

      let email = searchParams.get('email');
      if (!email) {
        try {
          email = localStorage.getItem('candy_crew_email');
        } catch (e) {}
      }

      if (email) {
        try {
          const { data } = await supabase
            .from('crew_profiles')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

          if (data) {
            setLocalProfile(data);
            try {
              localStorage.setItem('candy_crew_name', data.name);
              localStorage.setItem('candy_crew_email', data.email);
            } catch (e) {}
          }
        } catch (err) {
          console.warn('Error resolving crew profile from email:', err);
        }
      }
    };

    resolveCrewIdentity();
  }, [authCrewProfile, searchParams]);

  const activeProfile = localProfile || authCrewProfile;
  const crewName = activeProfile?.name || user?.user_metadata?.name || 'Photographer';
  const crewRole = activeProfile?.role || 'Photographer / Cinematographer';

  // Load all confirmed bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error loading crew calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('crew-live-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter ONLY shoots assigned to this crew member
  const myAssignedBookings = useMemo(() => {
    const normalizedName = activeProfile?.name ? crewName.toLowerCase().trim() : '';
    const userEmail = (session?.user?.email || '').toLowerCase().trim();
    const profileEmail = (activeProfile?.email || '').toLowerCase().trim();

    return bookings.filter((b) => {
      if (!b.assigned_to) return false;
      const assignedLower = b.assigned_to.toLowerCase();
      return (
        (Boolean(normalizedName) && assignedLower.includes(normalizedName)) ||
        (Boolean(profileEmail) && assignedLower.includes(profileEmail)) ||
        (Boolean(userEmail) && assignedLower.includes(userEmail))
      );
    });
  }, [bookings, crewName, activeProfile, session]);

  // Calendar Math
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const jumpToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getShootsForDay = (day) => {
    return myAssignedBookings.filter((b) => {
      if (!b.booking_date) return false;
      const [year, month, d] = b.booking_date.split('-').map(Number);
      const start = new Date(year, month - 1, d);

      if (b.booking_end_date) {
        const [endYear, endMonth, endD] = b.booking_end_date.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endD);
        return isWithinInterval(day, { start, end });
      }
      return isSameDay(start, day);
    });
  };

  // Find nearest upcoming shoot for the hero countdown
  const nextUpcomingShoot = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return myAssignedBookings.find((b) => (b.booking_end_date || b.booking_date) >= todayStr);
  }, [myAssignedBookings]);

  // Filtered shoots list based on selected date
  const displayShoots = useMemo(() => {
    if (selectedDate) {
      return getShootsForDay(selectedDate);
    }
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return myAssignedBookings.filter((b) => (b.booking_end_date || b.booking_date) >= todayStr);
  }, [selectedDate, myAssignedBookings]);

  // Calculate human friendly relative badge (Today, Tomorrow, In X days)
  const getRelativeDateBadge = (dateStr) => {
    if (!dateStr) return null;
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d);
      if (checkIsToday(targetDate)) {
        return { label: '🔥 Today - Shoot Day!', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      }
      if (checkIsTomorrow(targetDate)) {
        return { label: '⚡ Tomorrow', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      }
      const days = differenceInDays(targetDate, new Date());
      if (days > 0 && days <= 7) {
        return { label: `In ${days} days`, color: 'bg-brand-gold/20 text-brand-gold border-brand-gold/40' };
      }
      if (days < 0) {
        return { label: '✓ Completed', color: 'bg-white/10 text-white/50 border-white/15' };
      }
      return { label: format(targetDate, 'dd MMM'), color: 'bg-white/10 text-white/80 border-white/20' };
    } catch {
      return null;
    }
  };

  // Extract venue from additional_info
  const extractVenue = (info) => {
    if (!info) return '';
    const match = info.match(/📍\s*Venue:\s*([^|]+)/i);
    return match ? match[1].trim() : '';
  };

  // Extract slot from additional_info
  const extractSlot = (info) => {
    if (!info) return '';
    const match = info.match(/⏰\s*Slot:\s*([^|]+)/i);
    return match ? match[1].trim() : '';
  };

  return (
    <div className="min-h-screen bg-[#071317] text-white font-sans antialiased pb-28 selection:bg-brand-gold selection:text-black">
      {/* ── Top Mobile App Bar ── */}
      <header className="sticky top-0 z-40 bg-[#071317]/90 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Candy Pic" className="h-7 w-auto object-contain" />
          <div className="border-l border-white/15 pl-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold block leading-none">
              Crew Studio
            </span>
            <span className="text-[11px] text-brand-muted font-medium">Candy Pic Kumta</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-gold/20 text-brand-gold text-xs font-bold flex items-center justify-center">
              {crewName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-white/90 hidden sm:inline">{crewName}</span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="p-2 rounded-full bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="Sign out"
          >
            <FaSignOutAlt size={13} />
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* ── Hero Greeting Card with Luxury Glassmorphism ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-gold/15 via-[#0e272e] to-[#08171b] border border-brand-gold/30 p-5 sm:p-6 shadow-2xl"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-[10px] font-bold text-brand-gold tracking-wider uppercase mb-2">
                  <FaCamera size={10} /> {crewRole}
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl text-white font-medium">
                  {getGreeting()}, <span className="text-brand-gold">{crewName}</span>
                </h1>
                <p className="text-xs sm:text-sm text-brand-muted font-light mt-1">
                  {nextUpcomingShoot
                    ? `You're scheduled for ${nextUpcomingShoot.client_name} on ${nextUpcomingShoot.booking_date}.`
                    : 'No shoots scheduled today. Enjoy your day! 🌴'}
                </p>
              </div>

              <button
                type="button"
                onClick={jumpToday}
                className="shrink-0 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/15"
              >
                <FaClock size={12} className="text-brand-gold" />
                <span className="hidden sm:inline">Today</span>
              </button>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10 text-center">
              <div className="bg-black/30 rounded-2xl p-2.5 border border-white/5">
                <span className="text-base sm:text-lg font-bold text-brand-gold block leading-none">
                  {myAssignedBookings.length}
                </span>
                <span className="text-[10px] text-brand-muted uppercase tracking-wider">Total Shoots</span>
              </div>

              <div className="bg-black/30 rounded-2xl p-2.5 border border-white/5">
                <span className="text-base sm:text-lg font-bold text-emerald-400 block leading-none">
                  {displayShoots.length}
                </span>
                <span className="text-[10px] text-brand-muted uppercase tracking-wider">
                  {selectedDate ? 'On This Day' : 'Upcoming'}
                </span>
              </div>

              <div className="bg-black/30 rounded-2xl p-2.5 border border-white/5">
                <span className="text-base sm:text-lg font-bold text-white block leading-none">
                  {format(new Date(), 'dd MMM')}
                </span>
                <span className="text-[10px] text-brand-muted uppercase tracking-wider">Today</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── View Switcher Pills: Schedule Feed vs Monthly Calendar ── */}
        <div className="flex items-center justify-between gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('feed');
              setSelectedDate(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-brand-gold text-brand-dark shadow-md shadow-brand-gold/20'
                : 'text-brand-muted hover:text-white'
            }`}
          >
            <FaListUl size={12} />
            <span>Upcoming Shoots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-brand-gold text-brand-dark shadow-md shadow-brand-gold/20'
                : 'text-brand-muted hover:text-white'
            }`}
          >
            <FaCalendarAlt size={12} />
            <span>Calendar View</span>
          </button>
        </div>

        {/* ── TAB 1: MONTHLY CALENDAR VIEW ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4"
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="font-serif text-lg text-white flex items-center gap-2">
                  <FaCalendarAlt className="text-brand-gold" size={14} />
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors"
                  >
                    <FaChevronLeft size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors"
                  >
                    <FaChevronRight size={11} />
                  </button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-brand-muted tracking-widest uppercase">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const dayShoots = getShootsForDay(day);
                  const hasShoot = dayShoots.length > 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`min-h-[52px] sm:min-h-[60px] p-1 rounded-2xl flex flex-col items-center justify-between text-xs transition-all border cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-brand-gold text-brand-dark font-bold border-brand-gold shadow-lg shadow-brand-gold/20 scale-[1.03]'
                          : hasShoot
                          ? 'bg-brand-gold/15 text-white border-brand-gold/50 font-semibold hover:bg-brand-gold/25'
                          : isToday
                          ? 'bg-white/10 text-brand-gold font-bold border-white/25'
                          : isCurrentMonth
                          ? 'text-white/80 hover:bg-white/5 border-transparent'
                          : 'text-white/20 border-transparent opacity-30'
                      }`}
                    >
                      <span className="text-[11px] leading-none pt-1">{format(day, 'd')}</span>
                      {hasShoot && (
                        <span
                          className={`w-2 h-2 rounded-full mb-1 ${
                            isSelected ? 'bg-brand-dark' : 'bg-brand-gold animate-pulse'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend & Filter indicator */}
              <div className="flex items-center justify-between text-[11px] text-brand-muted pt-3 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-gold" /> Assigned Shoot
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white/20 border border-white/40" /> Today
                  </span>
                </div>
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="text-brand-gold hover:underline font-semibold"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SHOOT LIST / FEED (High-End Studio Pass Cards) ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-lg text-white flex items-center gap-2">
              <FaCalendarDay className="text-brand-gold" size={14} />
              {selectedDate
                ? `Shoots for ${format(selectedDate, 'EEEE, dd MMMM yyyy')}`
                : 'Upcoming Photoshoots'}
            </h2>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-xs text-brand-gold hover:underline font-medium"
              >
                Show All Upcoming
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white/[0.02] rounded-3xl border border-white/10">
              <div className="h-7 w-7 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin mx-auto mb-3" />
              <p className="text-xs text-brand-muted">Fetching your shoot schedule...</p>
            </div>
          ) : displayShoots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 text-center bg-white/[0.02] rounded-3xl border border-white/10 space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] text-brand-gold/70 flex items-center justify-center mx-auto text-2xl">
                <FaCalendarAlt />
              </div>
              <h3 className="text-base font-semibold text-white">No Shoots Scheduled</h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed max-w-sm mx-auto">
                {selectedDate
                  ? 'You have no shoots assigned on this date. Take rest or check upcoming dates!'
                  : 'You have no upcoming shoots scheduled right now. Chandan will notify you as soon as a client booking is assigned!'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {displayShoots.map((shoot, idx) => {
                const clientPhone = shoot.client_phone || '';
                const cleanPhone = clientPhone.replace(/\D/g, '');
                const venue = extractVenue(shoot.additional_info);
                const slot = extractSlot(shoot.additional_info);
                const badge = getRelativeDateBadge(shoot.booking_date);
                const sanitizedNotes = sanitizeCrewDetails(shoot.additional_info);

                return (
                  <motion.div
                    key={shoot.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] via-[#0d2229] to-[#071317] border border-white/15 p-5 sm:p-6 shadow-xl space-y-4 transition-all hover:border-brand-gold/50"
                  >
                    {/* Top Status & Date Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {badge && (
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-[10px] font-bold uppercase tracking-wider">
                          {shoot.event_type || 'Wedding Shoot'}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-white block">
                          {shoot.booking_date}
                        </span>
                        {shoot.booking_end_date && shoot.booking_end_date !== shoot.booking_date && (
                          <span className="text-[10px] text-brand-muted">
                            to {shoot.booking_end_date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Couple / Client Name */}
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl text-white font-medium leading-tight">
                        {shoot.client_name}
                      </h3>
                    </div>

                    {/* Key Itinerary Badges (Venue & Slot) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {venue && (
                        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/40 border border-white/5 text-white/90">
                          <FaMapMarkerAlt className="text-brand-gold shrink-0" size={13} />
                          <span className="truncate">{venue}</span>
                        </div>
                      )}

                      {slot && (
                        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/40 border border-white/5 text-white/90">
                          <FaClock className="text-brand-gold shrink-0" size={13} />
                          <span className="truncate">{slot}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes (Without Financials) */}
                    {sanitizedNotes && (
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-brand-muted font-light leading-relaxed">
                        <p className="line-clamp-2">{sanitizedNotes}</p>
                      </div>
                    )}

                    {/* Action Bar (Call, WhatsApp & View Full Brief) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {cleanPhone ? (
                        <>
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `Hello ${shoot.client_name}, I am ${crewName} from Candy Pic Photography regarding your upcoming shoot on ${shoot.booking_date}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-3 px-4 rounded-2xl bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                          >
                            <FaWhatsapp size={14} /> WhatsApp Client
                          </a>

                          <a
                            href={`tel:${cleanPhone}`}
                            className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/15 cursor-pointer"
                          >
                            <FaPhone size={11} className="text-brand-gold" /> Call Client
                          </a>
                        </>
                      ) : (
                        <div className="col-span-2 text-center text-xs text-brand-muted italic py-2">
                          Contact Chandan for client coordination
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedShootForDrawer(shoot)}
                        className="py-3 px-4 rounded-2xl bg-brand-gold/15 hover:bg-brand-gold text-brand-gold hover:text-brand-dark border border-brand-gold/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <FaInfoCircle size={12} /> View Full Brief
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── LUXURY BOTTOM DRAWER FOR FULL SHOOT BRIEF ── */}
      <BottomDrawer
        isOpen={Boolean(selectedShootForDrawer)}
        onClose={() => setSelectedShootForDrawer(null)}
        title="Photoshoot Brief & Itinerary"
      >
        {selectedShootForDrawer && (() => {
          const s = selectedShootForDrawer;
          const phone = s.client_phone || '';
          const cleanP = phone.replace(/\D/g, '');
          const venue = extractVenue(s.additional_info);
          const slot = extractSlot(s.additional_info);
          const sanitizedDetails = sanitizeCrewDetails(s.additional_info);

          return (
            <div className="space-y-5">
              {/* Couple Header */}
              <div className="bg-gradient-to-r from-brand-gold/15 to-transparent p-4 rounded-2xl border border-brand-gold/25">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30 text-[10px] font-bold uppercase tracking-wider">
                  {s.event_type || 'Wedding Shoot'}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mt-1">
                  {s.client_name}
                </h3>
                <span className="text-xs text-brand-gold font-semibold mt-0.5 block">
                  📅 {s.booking_date} {s.booking_end_date && s.booking_end_date !== s.booking_date ? `to ${s.booking_end_date}` : ''}
                </span>
              </div>

              {/* Schedule & Location Grid */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
                  Shoot Logistics
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-brand-muted block">⏰ Time Slot</span>
                    <span className="text-sm font-semibold text-white">{slot || 'Full Day (Morning to Night)'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-brand-muted block">👤 Assigned Team</span>
                    <span className="text-sm font-semibold text-brand-gold">{s.assigned_to || 'Chandan Naik'}</span>
                  </div>
                </div>

                {venue && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-brand-muted block">📍 Venue Location</span>
                    <p className="text-sm text-white font-medium">{venue}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-gold hover:underline font-semibold pt-1"
                    >
                      <FaRoute size={12} /> Open in Google Maps →
                    </a>
                  </div>
                )}
              </div>

              {/* Special Instructions (Sanitized) */}
              {sanitizedDetails && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-brand-gold font-bold block">
                    📝 Special Notes & Brief
                  </span>
                  <p className="text-xs text-white/90 leading-relaxed whitespace-pre-line">
                    {sanitizedDetails}
                  </p>
                </div>
              )}

              {/* Client Contact Actions */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
                  Client Direct Coordination
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {cleanP ? (
                    <>
                      <a
                        href={`https://wa.me/${cleanP}?text=${encodeURIComponent(
                          `Hello ${s.client_name}, I am ${crewName} from Candy Pic Photography regarding your upcoming shoot on ${s.booking_date}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
                      >
                        <FaWhatsapp size={15} /> WhatsApp
                      </a>

                      <a
                        href={`tel:${cleanP}`}
                        className="py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/15"
                      >
                        <FaPhone size={12} className="text-brand-gold" /> Call Client
                      </a>
                    </>
                  ) : (
                    <div className="col-span-2 text-center text-xs text-brand-muted italic py-2">
                      Client phone not attached. Contact Chandan.
                    </div>
                  )}
                </div>
              </div>

              {/* Studio Coordinator Contact Note */}
              <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Lead Coordinator: Chandan Naik</span>
                  <span className="text-[10px] text-brand-muted">+91 97431 74487 • Candy Pic Kumta</span>
                </div>
                <a
                  href="https://wa.me/919743174487"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-brand-gold text-brand-dark font-bold text-[10px] uppercase tracking-wider"
                >
                  Chat Chandan
                </a>
              </div>
            </div>
          );
        })()}
      </BottomDrawer>
    </div>
  );
}
