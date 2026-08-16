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
  isSameMonth,
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
  FaUserPlus,
} from 'react-icons/fa';
import BottomDrawer from '../components/BottomDrawer';
import AdminLayout from '../components/admin/AdminLayout';
import {
  listClientEvents,
  createClientEvent,
  listCrewMembers,
  approveCrewMember,
  rejectCrewMember,
  createAdminNotification,
  sendCrewPush,
} from '../lib/galleryApi';
import { Link } from 'react-router-dom';

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [clientEvents, setClientEvents] = useState([]);
  const [crewMembers, setCrewMembers] = useState([]);
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
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
    altPhone: '',
    startDate: '',
    endDate: '',
    eventType: 'Wedding Photography & Cinema',
    sessionSlot: 'Full Day (Morning to Night)',
    venueLocation: '',
    budgetTotal: '',
    advancePaid: '',
    assignedCrew: ['Chandan Naik'],
    customCrew: '',
    specialNotes: '',
    autoBlockCalendar: true,
    autoGenerateVault: true,
  });

  // Block Reason state
  const [blockReason, setBlockReason] = useState('Fully Booked');

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, vaultsData, crewData] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .order('booking_date', { ascending: true }),
        listClientEvents(),
        listCrewMembers('all').catch(() => []),
      ]);

      if (bookingsData.error) throw bookingsData.error;
      setBookings(bookingsData.data || []);
      setClientEvents(vaultsData || []);
      setCrewMembers(crewData || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-calendar-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_profiles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApproveCrew = async (id) => {
    try {
      setIsLoading(true);
      await approveCrewMember(id, 'chandan@candypic.com');
      await fetchData();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectCrew = async (id) => {
    if (!confirm('Reject this crew applicant?')) return;
    try {
      setIsLoading(true);
      await rejectCrewMember(id);
      await fetchData();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const approvedCrew = crewMembers.filter((c) => c.status === 'approved');
  const pendingCrew = crewMembers.filter((c) => c.status === 'pending');

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
      altPhone: '',
      startDate: dateStr,
      endDate: dateStr,
      eventType: 'Wedding Photography & Cinema',
      sessionSlot: 'Full Day (Morning to Night)',
      venueLocation: '',
      budgetTotal: '',
      advancePaid: '',
      assignedCrew: ['Chandan Naik'],
      customCrew: '',
      specialNotes: '',
      autoBlockCalendar: true,
      autoGenerateVault: true,
    });
    setEditingId(null);
    setViewMode('list');
    setIsDrawerOpen(true);
  };

  // --- 3. CREATE / UPDATE BOOKING WITH ALL DETAILS ---
  const handleSaveBooking = async (e) => {
    if (e) e.preventDefault();
    if (!formData.clientName.trim()) {
      alert('Please enter the client / couple name.');
      return;
    }
    if (!formData.clientPhone.trim()) {
      alert('Please enter the client phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const formattedStartDate = formData.startDate || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      const formattedEndDate = formData.endDate || formattedStartDate;

      // Consolidate extra details in additional_info JSON or formatted string
      const detailsList = [];
      if (formData.venueLocation) detailsList.push(`📍 Venue: ${formData.venueLocation}`);
      if (formData.sessionSlot) detailsList.push(`⏰ Slot: ${formData.sessionSlot}`);
      if (formData.budgetTotal) detailsList.push(`💰 Total: ${formData.budgetTotal}`);
      if (formData.advancePaid) detailsList.push(`💵 Advance: ${formData.advancePaid}`);
      if (formData.altPhone) detailsList.push(`📞 Alt Phone: ${formData.altPhone}`);
      if (formData.specialNotes) detailsList.push(`📝 Notes: ${formData.specialNotes}`);

      const compiledNotes = detailsList.join(' | ');

      // Compile multi-crew selection
      const allSelectedCrew = [...(formData.assignedCrew || [])];
      if (formData.customCrew && formData.customCrew.trim()) {
        allSelectedCrew.push(formData.customCrew.trim());
      }
      const compiledCrewString = allSelectedCrew.length > 0 ? allSelectedCrew.join(', ') : 'Chandan Naik';

      const payload = {
        client_name: formData.clientName.trim(),
        client_phone: formData.clientPhone.trim(),
        booking_date: formattedStartDate,
        booking_end_date: formattedEndDate,
        event_type: formData.eventType || 'Wedding Photography',
        status: 'confirmed',
        assigned_to: compiledCrewString,
        additional_info: compiledNotes,
      };

      if (editingId) {
        const { error } = await supabase.from('bookings').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bookings').insert([payload]);
        if (error) throw error;
      }

      // 1. Dispatch Assignment Notification for each selected crew member
      for (const memberName of allSelectedCrew) {
        const assignedMember = crewMembers.find((c) => c.name === memberName);
        const crewPhone = assignedMember?.phone || '';
        // Deep link straight into this crew member's own calendar — tapping the
        // notification resolves + persists their identity on this device (no
        // separate login step) instead of dropping them on the admin login page.
        const crewDeepLink = `/crew/calendar${
          assignedMember?.email ? `?email=${encodeURIComponent(assignedMember.email)}` : ''
        }`;

        try {
          await createAdminNotification({
            title: `📅 Shoot Assigned: ${memberName}`,
            message: `${memberName} assigned to ${formData.clientName} (${formData.eventType}) on ${formattedStartDate}.`,
            type: 'booking',
            link: crewDeepLink,
            metadata: {
              assigned_to: memberName,
              email: assignedMember?.email || '',
              phone: crewPhone,
              date: formattedStartDate,
              client: formData.clientName,
              venue: formData.venueLocation,
            },
          });

          // Realtime Push Broadcast across all PWA devices & crew phones
          const broadcastChannel = supabase.channel('studio-live-events', {
            config: { broadcast: { self: false } },
          });

          const sendPayload = {
            type: 'broadcast',
            event: 'shoot-assigned',
            payload: {
              title: `📸 Shoot Assigned: ${formData.eventType || 'Wedding Photography'}`,
              body: `Hi ${memberName}! You are assigned to ${formData.clientName} on ${formattedStartDate} (${formData.venueLocation || 'Gokarna / Kumta'}).`,
              assignedTeam: memberName,
              email: assignedMember?.email || '',
              date: formattedStartDate,
              client: formData.clientName,
              venue: formData.venueLocation,
              url: crewDeepLink,
            },
          };

          if (broadcastChannel.state === 'joined') {
            await broadcastChannel.send(sendPayload);
          } else {
            broadcastChannel.subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                await broadcastChannel.send(sendPayload);
              }
            });
          }

          // Real FCM lock-screen push — reaches the device even if the app is closed
          await sendCrewPush({
            tokens: [assignedMember?.push_token],
            title: sendPayload.payload.title,
            message: sendPayload.payload.body,
            link: crewDeepLink,
          });
        } catch (notifErr) {
          console.warn('Crew notification dispatch skipped for:', memberName, notifErr);
        }
      }

      // Auto-generate Client Memory Vault if toggle is checked
      if (formData.autoGenerateVault) {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        const guestPin = 'GUEST';
        const cleanSlug = `${formData.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${formattedStartDate.slice(0, 4)}`;

        try {
          const newVault = await createClientEvent({
            title: `${formData.clientName}'s Wedding`,
            slug: cleanSlug,
            client_name: formData.clientName.trim(),
            client_phone: formData.clientPhone.trim(),
            event_date: formattedStartDate,
            passcode: pin,
            guest_passcode: guestPin,
            target_album_photos: 100,
            status: 'active',
            is_live_gallery: false,
          });
          setGeneratedVault(newVault);
          await fetchData();
          setViewMode('credentials');
          return;
        } catch (vaultErr) {
          console.warn('Auto vault creation skipped:', vaultErr);
        }
      }

      await fetchData();
      setViewMode('list');
    } catch (error) {
      alert(`Failed to save booking: ${error.message}`);
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
      subtitle="Manage shoot bookings, block dates, crew assignments, and client portal credentials"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Crew Management & Approvals Button */}
          <button
            type="button"
            onClick={() => setIsCrewModalOpen(true)}
            className="relative px-3.5 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 hover:bg-brand-gold hover:text-brand-dark text-brand-gold text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-gold/5"
            title="Review crew member registrations and approval status"
          >
            <FaUserPlus size={11} /> Crew Roster ({approvedCrew.length})
            {pendingCrew.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-brand-red text-white text-[9px] font-bold animate-pulse">
                {pendingCrew.length} Pending
              </span>
            )}
          </button>

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
            CALENDAR GRID CONTAINER (Clean, viewport-optimized, no overflow scrolling)
            ========================================================================= */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div
                key={d}
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1 ${
                  i === 0 || i === 6 ? 'text-brand-red' : 'text-brand-muted'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isBlocked = dayEvents.some((e) => e.event_type === 'Block' || e.client_name === 'BLOCKED');
              const hasBooking = dayEvents.some((e) => e.event_type !== 'Block' && e.client_name !== 'BLOCKED');

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[58px] sm:min-h-[78px] md:min-h-[92px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                    !isCurrentMonth ? 'opacity-30 bg-white/[0.01] border-transparent' : ''
                  } ${
                    isSelected
                      ? 'border-brand-gold bg-brand-gold/15 ring-2 ring-brand-gold z-10'
                      : isBlocked
                      ? 'bg-brand-red/15 border-brand-red/40 hover:border-brand-red/80'
                      : hasBooking
                      ? 'bg-emerald-500/15 border-emerald-500/40 hover:border-emerald-500/80'
                      : isToday
                      ? 'bg-white/10 border-white/40'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/25 hover:bg-white/5'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-semibold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${
                        isToday
                          ? 'bg-brand-gold text-brand-dark font-bold'
                          : isSelected
                          ? 'text-brand-gold font-bold'
                          : isCurrentMonth
                          ? 'text-white/90'
                          : 'text-white/40'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Status Indicator Dots */}
                    <div className="flex items-center gap-1">
                      {isBlocked && (
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-red shrink-0" title="Blocked" />
                      )}
                      {hasBooking && !isBlocked && (
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shrink-0" title="Booked" />
                      )}
                    </div>
                  </div>

                  {/* Day Events Preview Chips */}
                  <div className="space-y-0.5 sm:space-y-1 mt-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const isBlk = ev.event_type === 'Block' || ev.client_name === 'BLOCKED';
                      return (
                        <div
                          key={ev.id}
                          className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded truncate font-medium ${
                            isBlk
                              ? 'bg-brand-red/30 text-red-200 border border-brand-red/40'
                              : 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                          }`}
                        >
                          {isBlk ? '🚫 Blocked' : ev.client_name}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[8px] sm:text-[9px] text-brand-gold font-mono block leading-none">
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

                              <div className="flex items-center gap-2">
                                {ev.assigned_to && (
                                  <a
                                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                      `📸 *Candy Pic — Shoot Assignment*\n\n` +
                                      `👤 *Assigned Lead:* ${ev.assigned_to}\n` +
                                      `💍 *Event:* ${ev.event_type || 'Wedding Photography'}\n` +
                                      `🗓 *Date:* ${ev.booking_date}\n` +
                                      `👥 *Client:* ${ev.client_name} (${ev.client_phone || 'No phone'})\n` +
                                      (ev.additional_info ? `📝 *Details:* ${ev.additional_info}\n` : '') +
                                      `\nPlease confirm your availability with Chandan.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full px-3 py-1.5 bg-brand-gold/15 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-brand-dark text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                    title="Send assignment brief to lead photographer"
                                  >
                                    <FaShareAlt size={11} /> Notify Lead
                                  </a>
                                )}

                                {ev.client_phone && (
                                  <a
                                    href={`https://wa.me/${ev.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                      `Hi ${ev.client_name}, this is Chandan from Candy Pic regarding your booking on ${ev.booking_date}.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full px-3.5 py-1.5 bg-[#25D366] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                                  >
                                    <FaWhatsapp size={13} /> Client WhatsApp
                                  </a>
                                )}
                              </div>
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

          {/* VIEW 2: CREATE BOOKING (Comprehensive Details & Auto-Block) */}
          {viewMode === 'create' && (
            <form onSubmit={handleSaveBooking} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="font-serif text-lg text-white">Create Booking &amp; Block Calendar</h3>
                  <p className="text-[11px] text-brand-muted font-light">
                    Schedules the shoot and automatically blocks the date range.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="text-xs text-brand-muted hover:text-white"
                >
                  ← Back to List
                </button>
              </div>

              {/* 1. Client Details */}
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold block">
                  1. Client / Couple Information
                </span>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                    Couple / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma &amp; Rahul Naik"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      Primary Phone (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      Alternate / Family Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="Optional"
                      value={formData.altPhone}
                      onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Schedule & Dates */}
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold block">
                  2. Date Range &amp; Shoot Schedule
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      End Date (Multi-Day Shoot)
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      Event / Shoot Type
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full rounded-xl bg-brand-deep border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                    >
                      <option value="Wedding Photography &amp; Cinema">Wedding Photography &amp; Cinema</option>
                      <option value="Pre-Wedding Shoot">Pre-Wedding Shoot</option>
                      <option value="Engagement Ceremony">Engagement Ceremony</option>
                      <option value="Haldi &amp; Mehendi">Haldi &amp; Mehendi</option>
                      <option value="Reception Coverage">Reception Coverage</option>
                      <option value="Maternity &amp; Baby Shoot">Maternity &amp; Baby Shoot</option>
                      <option value="Commercial / Event Shoot">Commercial / Event Shoot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      Shoot Slot / Timings
                    </label>
                    <select
                      value={formData.sessionSlot}
                      onChange={(e) => setFormData({ ...formData, sessionSlot: e.target.value })}
                      className="w-full rounded-xl bg-brand-deep border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                    >
                      <option value="Full Day (Morning to Night)">Full Day (Morning to Night)</option>
                      <option value="Morning Muhurtham (6 AM - 2 PM)">Morning Muhurtham (6 AM - 2 PM)</option>
                      <option value="Evening Reception (3 PM - 11 PM)">Evening Reception (3 PM - 11 PM)</option>
                      <option value="Golden Hour / Sunset Session">Golden Hour / Sunset Session</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Venue & Commercials */}
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold block">
                  3. Venue &amp; Commercials
                </span>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                    Venue / Shoot Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahabaleshwar Temple Gokarna / Nirvana Beach Kumta"
                    value={formData.venueLocation}
                    onChange={(e) => setFormData({ ...formData, venueLocation: e.target.value })}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      Agreed Total Package (₹)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹75,000"
                      value={formData.budgetTotal}
                      onChange={(e) => setFormData({ ...formData, budgetTotal: e.target.value })}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      Advance Received (₹)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹25,000"
                      value={formData.advancePaid}
                      onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1.5 font-semibold">
                      Assign Studio Crew (Select All That Apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {approvedCrew.map((crew) => {
                        const isSelected = (formData.assignedCrew || []).includes(crew.name);
                        return (
                          <button
                            key={crew.id}
                            type="button"
                            onClick={() => {
                              const current = formData.assignedCrew || [];
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  assignedCrew: current.filter((n) => n !== crew.name),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  assignedCrew: [...current, crew.name],
                                });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-brand-gold text-brand-dark font-bold border-brand-gold shadow-md shadow-brand-gold/20'
                                : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/25'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{crew.name}</span>
                            <span className={`text-[10px] opacity-80 ${isSelected ? 'text-brand-dark' : 'text-brand-gold'}`}>
                              ({crew.role})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      placeholder="+ Freelance / External Crew Name (optional)"
                      value={formData.customCrew || ''}
                      onChange={(e) => setFormData({ ...formData, customCrew: e.target.value })}
                      className="w-full mt-2 rounded-xl bg-black/40 border border-white/15 px-3.5 py-1.5 text-xs text-white outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                      Special Notes / Requirements
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Traditional + Candid drone..."
                      value={formData.specialNotes}
                      onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Automations */}
              <div className="p-3 bg-brand-gold/10 border border-brand-gold/25 rounded-2xl space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoBlockCalendar}
                    onChange={(e) => setFormData({ ...formData, autoBlockCalendar: e.target.checked })}
                    className="rounded accent-brand-gold w-4 h-4"
                  />
                  <span className="font-semibold">Block this date range on public website calendar</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoGenerateVault}
                    onChange={(e) => setFormData({ ...formData, autoGenerateVault: e.target.checked })}
                    className="rounded accent-brand-gold w-4 h-4"
                  />
                  <span className="font-semibold">Auto-generate Private Client Memory Vault &amp; 4-Digit PIN</span>
                </label>
              </div>

              {/* Form Buttons */}
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
                  className="rounded-full px-7 py-3 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 cursor-pointer"
                >
                  {isLoading ? 'Saving Booking...' : 'Save & Block Calendar'}
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
                  <FaWhatsapp size={15} /> Send PIN to Couple (WhatsApp)
                </a>

                {formData.assignedTeam && (
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `📸 *Candy Pic — Shoot Assignment*\n\n` +
                      `👤 *Assigned Lead:* ${formData.assignedTeam}\n` +
                      `💍 *Event:* ${formData.eventType || 'Wedding Photography'}\n` +
                      `🗓 *Date:* ${formData.startDate || generatedVault.event_date}\n` +
                      `👥 *Client:* ${formData.clientName} (${formData.clientPhone})\n` +
                      (formData.venueLocation ? `📍 *Venue:* ${formData.venueLocation}\n` : '') +
                      (formData.sessionSlot ? `⏰ *Slot:* ${formData.sessionSlot}\n` : '') +
                      (formData.specialNotes ? `📝 *Notes:* ${formData.specialNotes}\n` : '') +
                      `\nPlease confirm your availability with Chandan.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-full py-3 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-brand-dark transition-all"
                  >
                    <FaShareAlt size={13} /> Send Itinerary to {formData.assignedTeam} (WhatsApp)
                  </a>
                )}

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

      {/* =========================================================================
          CREW ROSTER & APPROVALS MODAL (SUPER ADMIN: CHANDAN@CANDYPIC.COM)
          ========================================================================= */}
      {isCrewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-white/15 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-serif text-xl text-white">Crew Roster &amp; Approvals</h3>
                <p className="text-xs text-brand-muted font-light mt-0.5">
                  Super Admin: <strong>chandan@candypic.com</strong> • Approved members appear in shoot assignment dropdown.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCrewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Section 1: Pending Approvals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-brand-gold font-bold">
                  Pending Applications ({pendingCrew.length})
                </span>
                {pendingCrew.length > 0 && (
                  <span className="text-[10px] text-brand-red bg-brand-red/15 px-2 py-0.5 rounded-full font-bold">
                    Action Required
                  </span>
                )}
              </div>

              {pendingCrew.length === 0 ? (
                <div className="p-4 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-brand-muted font-light">
                  No pending applications. All crew members are up to date!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingCrew.map((crew) => (
                    <div
                      key={crew.id}
                      className="p-4 rounded-2xl bg-black/40 border border-brand-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-base text-white font-medium">{crew.name}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                            {crew.role}
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted font-light mt-1 flex flex-wrap items-center gap-2">
                          <span>📧 {crew.email}</span>
                          <span>•</span>
                          <span>📞 {crew.phone}</span>
                          <span>•</span>
                          <span>📍 {crew.city || 'Kumta'}</span>
                        </p>
                        {crew.push_token && (
                          <span className="inline-block mt-1 text-[10px] text-emerald-400 font-semibold">
                            🔔 Push notifications registered on device
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApproveCrew(crew.id)}
                          disabled={isLoading}
                          className="rounded-full px-4 py-2 bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-600 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                        >
                          Approve ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectCrew(crew.id)}
                          disabled={isLoading}
                          className="rounded-full px-3 py-2 bg-white/5 hover:bg-brand-red text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Reject ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Approved Crew Roster */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <span className="text-[11px] uppercase tracking-widest text-brand-muted font-bold block">
                Active Studio Crew ({approvedCrew.length})
              </span>

              <div className="divide-y divide-white/5 bg-black/25 rounded-2xl border border-white/5 p-2">
                {approvedCrew.map((crew) => (
                  <div
                    key={crew.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-medium text-white flex items-center gap-2">
                        <span>{crew.name}</span>
                        <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full">
                          {crew.role}
                        </span>
                      </p>
                      <p className="text-[11px] text-brand-muted font-light mt-0.5">
                        {crew.phone} • {crew.city || 'Kumta'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <FaCheckCircle size={10} /> In Booking Dropdown
                      </span>
                      {crew.phone && (
                        <a
                          href={`https://wa.me/${crew.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs"
                          title="Message on WhatsApp"
                        >
                          <FaWhatsapp size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsCrewModalOpen(false)}
                className="rounded-full px-6 py-2.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
