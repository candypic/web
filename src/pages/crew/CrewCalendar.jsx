import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from 'date-fns';
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaPhone,
  FaWhatsapp,
  FaSignOutAlt,
  FaBell,
  FaCheckCircle,
  FaClock,
  FaUserCheck,
  FaCamera,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import logo from '/logo-nonsquare.png';

export default function CrewCalendar() {
  const { session, crewProfile: authCrewProfile, user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [localProfile, setLocalProfile] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  // 1. Resolve Crew Member Profile (from AuthContext, URL query param, or localStorage)
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
  const crewName = activeProfile?.name || user?.user_metadata?.name || 'Team Teammate';
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
    const normalizedName = crewName.toLowerCase().trim();
    const userEmail = (session?.user?.email || '').toLowerCase().trim();

    return bookings.filter((b) => {
      if (!b.assigned_to) return false;
      const assignedLower = b.assigned_to.toLowerCase();
      // Match crew member name or email
      return (
        assignedLower.includes(normalizedName) ||
        (crewProfile?.email && assignedLower.includes(crewProfile.email.toLowerCase())) ||
        assignedLower.includes(userEmail)
      );
    });
  }, [bookings, crewName, crewProfile, session]);

  // Calendar Math
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const jumpToday = () => setCurrentDate(new Date());

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

  // Shoots on selected date or upcoming shoots
  const displayShoots = selectedDate
    ? getShootsForDay(selectedDate)
    : myAssignedBookings.filter((b) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return (b.booking_end_date || b.booking_date) >= today;
      });

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans antialiased pb-20">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-brand-dark/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Candy Pic" className="h-7 w-auto object-contain" />
          <div className="border-l border-white/15 pl-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold block leading-none">
              Crew Portal
            </span>
            <span className="text-xs text-brand-muted font-medium">Candy Pic Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-white">{crewName}</span>
            <span className="text-[10px] text-brand-gold/80">{crewRole}</span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            title="Sign out of crew portal"
          >
            <FaSignOutAlt size={12} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand-gold/15 via-black/40 to-black/60 border border-brand-gold/25 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 border border-brand-gold/40 text-brand-gold flex items-center justify-center text-xl shadow-lg">
              <FaCamera />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl text-white font-medium">
                  Welcome, {crewName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider">
                  Active Crew
                </span>
              </div>
              <p className="text-xs text-brand-muted mt-0.5">
                Specialization: <span className="text-brand-gold font-medium">{crewRole}</span> • You have{' '}
                <strong className="text-white">{myAssignedBookings.length} total shoot(s)</strong> assigned by Chandan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={jumpToday}
            className="self-start sm:self-auto px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FaClock size={11} className="text-brand-gold" /> Today's Schedule
          </button>
        </div>

        {/* ── 2-Column Responsive Layout: Calendar (Left) + Shoots List (Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Mini Interactive Calendar (7 Cols) */}
          <div className="lg:col-span-7 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-serif text-lg text-white flex items-center gap-2">
                <FaCalendarAlt className="text-brand-gold" size={15} />
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <FaChevronLeft size={11} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <FaChevronRight size={11} />
                </button>
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-brand-muted tracking-wider uppercase">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
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
                    className={`min-h-[56px] sm:min-h-[64px] p-1.5 rounded-2xl flex flex-col items-center justify-between text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-brand-gold text-brand-dark font-bold border-brand-gold shadow-lg shadow-brand-gold/20 scale-[1.03]'
                        : hasShoot
                        ? 'bg-brand-gold/15 text-white border-brand-gold/40 hover:bg-brand-gold/25'
                        : isToday
                        ? 'bg-white/10 text-brand-gold font-bold border-white/20'
                        : isCurrentMonth
                        ? 'text-white/80 hover:bg-white/5 border-transparent'
                        : 'text-white/20 border-transparent opacity-40'
                    }`}
                  >
                    <span className="text-[11px]">{format(day, 'd')}</span>
                    {hasShoot && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold truncate max-w-full ${
                          isSelected
                            ? 'bg-brand-dark text-brand-gold'
                            : 'bg-brand-gold text-brand-dark'
                        }`}
                      >
                        Shoot ({dayShoots.length})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-[11px] text-brand-muted pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-gold" /> Assigned Shoot
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/40" /> Today
              </span>
            </div>
          </div>

          {/* RIGHT: Assigned Shoot Details & Direct Actions (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif text-lg text-white">
                {selectedDate
                  ? `Shoots on ${format(selectedDate, 'dd MMM yyyy')}`
                  : 'Upcoming Assigned Shoots'}
              </h3>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-brand-gold hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center bg-white/[0.03] rounded-3xl border border-white/10">
                <div className="h-6 w-6 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin mx-auto mb-2" />
                <p className="text-xs text-brand-muted">Loading your schedule...</p>
              </div>
            ) : displayShoots.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.03] rounded-3xl border border-white/10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 text-brand-muted flex items-center justify-center mx-auto text-xl">
                  <FaCalendarAlt />
                </div>
                <h4 className="text-sm font-semibold text-white">No Shoots on this Date</h4>
                <p className="text-xs text-brand-muted font-light leading-relaxed max-w-xs mx-auto">
                  {selectedDate
                    ? 'You have no shoots scheduled for this day.'
                    : 'You do not have any upcoming shoots assigned yet. Chandan will notify you when a shoot is booked!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayShoots.map((shoot) => {
                  const clientPhone = shoot.client_phone || '';
                  const cleanPhone = clientPhone.replace(/\D/g, '');

                  return (
                    <div
                      key={shoot.id}
                      className="bg-white/[0.04] backdrop-blur-xl border border-brand-gold/30 rounded-3xl p-5 shadow-xl space-y-4 transition-all hover:border-brand-gold/60"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/40 text-[10px] font-bold uppercase tracking-wider">
                            {shoot.event_type || 'Wedding Shoot'}
                          </span>
                          <h4 className="font-serif text-lg text-white font-medium mt-1">
                            {shoot.client_name}
                          </h4>
                        </div>

                        <div className="text-right">
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

                      {/* Shoot Itinerary Details */}
                      <div className="space-y-2 text-xs text-brand-muted font-light">
                        {shoot.additional_info && (
                          <div className="p-3 bg-black/40 rounded-2xl border border-white/10 text-white/90 text-xs leading-relaxed space-y-1">
                            <p className="whitespace-pre-line">{shoot.additional_info}</p>
                          </div>
                        )}
                      </div>

                      {/* 1-Tap Crew Actions: WhatsApp & Direct Call */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {cleanPhone ? (
                          <>
                            <a
                              href={`tel:${cleanPhone}`}
                              className="rounded-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <FaPhone size={11} className="text-brand-gold" /> Call Client
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${shoot.client_name}, I am ${crewName} from Candy Pic Photography regarding your upcoming shoot on ${shoot.booking_date}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full py-2.5 bg-[#25D366] text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                            >
                              <FaWhatsapp size={13} /> WhatsApp
                            </a>
                          </>
                        ) : (
                          <div className="col-span-2 text-center text-xs text-brand-muted italic py-1">
                            Contact Chandan for direct client coordination
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
