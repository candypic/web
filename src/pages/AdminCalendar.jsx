import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaWhatsapp, FaCamera, FaBan, FaUser, FaPhone, FaCalendarAlt, FaUserTag, FaTrashAlt, FaCheckCircle, FaInfoCircle, FaBell } from 'react-icons/fa';
import BottomDrawer from '../components/BottomDrawer';
import { requestForToken } from '../lib/firebase'; // Ensure you created this file in previous steps

// ---------------------------------------------
// 👥 TEAM CONFIGURATION
// ---------------------------------------------
const TEAM_MEMBERS = ["Chandan", "Rahul", "Prajna", "Team B"];

const AdminCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    endDate: '',
    assignedTo: '',
    additionalInfo: ''
  });

  // --- 1. FETCH DATA ---
  const fetchBookings = async () => {
    const { data } = await supabase.from('bookings').select('*');
    if (data) setBookings(data);
  };

  useEffect(() => {
    fetchBookings();
    const channel = supabase.channel('admin-calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- 2. NOTIFICATION REGISTRATION ---
  // --- 2. NOTIFICATION REGISTRATION (Updated) ---
  // --- 2. NOTIFICATION REGISTRATION (Debug Version) ---
  const handleEnableNotifications = async () => {
    const name = prompt("Enter your Name (e.g. Rahul):");
    if (!name) return;

    const phoneInput = prompt("Enter your Phone Number (e.g. 9876543210):");
    if (!phoneInput) return;

    const cleanPhone = phoneInput.replace(/\D/g, ''); 

    try {
        console.log("Requesting Token...");
        const token = await requestForToken();
        
        if (!token) {
            alert("Failed to get Token from Firebase. Check console for details.");
            return;
        }

        console.log("Got Token:", token);
        console.log("Saving to Supabase...");

        const { data, error } = await supabase
            .from('team_devices')
            .upsert({ 
                name: name, 
                phone: cleanPhone,
                push_token: token,
                last_active: new Date()
            }, { onConflict: 'push_token' })
            .select();

        if (error) {
            console.error("Supabase Error:", error);
            alert(`Database Error: ${error.message}`);
        } else {
            console.log("Success Data:", data);
            alert(`✅ Success! Device linked to ${cleanPhone}.`);
        }
    } catch (err) {
        console.error("Unexpected Error:", err);
        alert("An unexpected error occurred. See console.");
    }
  };
  // --- 3. CALENDAR MATH ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day) => {
    return bookings.filter(booking => {
        const bookingDate = booking.booking_date; 
        const [year, month, d] = bookingDate.split('-').map(Number);
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
    // Reset form, default endDate is selected date
    const dateStr = format(day, 'yyyy-MM-dd');
    setFormData({ 
        clientName: '', 
        clientPhone: '', 
        endDate: dateStr,
        assignedTo: '',
        additionalInfo: ''
    });
    setIsDrawerOpen(true);
  };

  // --- 4. CREATE ENTRY LOGIC ---
  const handleCreateEntry = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
        const formattedStartDate = format(selectedDate, 'yyyy-MM-dd');
        // Logic: If name is empty, it's a BLOCK. If name exists, it's a BOOKING.
        const isBlocking = !formData.clientName.trim(); 

        const payload = {
            booking_date: formattedStartDate,
            status: isBlocking ? 'blocked' : 'confirmed',
            event_type: isBlocking ? 'Block' : 'Manual Booking',
            
            client_name: isBlocking ? 'Date Blocked' : formData.clientName,
            client_phone: formData.clientPhone || null,
            assigned_to: formData.assignedTo || null,
            additional_info: formData.additionalInfo || null,
            // Only save end date if it's different from start date
            booking_end_date: formData.endDate !== formattedStartDate ? formData.endDate : null
        };

        const { error } = await supabase.from('bookings').insert(payload);
        if (error) throw error;
        
        await fetchBookings();
        setIsDrawerOpen(false);
    } catch (error) {
        alert(`Failed: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently delete this entry?")) return;
    setIsLoading(true);
    try {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
        await fetchBookings();
    } catch (error) {
        alert("Failed to delete");
    } finally {
        setIsLoading(false);
    }
  };

  const eventsOnSelectedDate = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#0b262d] text-white flex flex-col overflow-hidden font-sans">
      
      {/* --- HEADER --- */}
      <div className="pt-6 pb-4 px-4 flex justify-between items-center bg-[#0b262d] z-10 shadow-xl shadow-[#091f25]">
        <div>
            <h1 className="text-xl font-serif text-white tracking-wide">
                {format(currentDate, 'MMMM')}
            </h1>
            <div className="flex items-center gap-2">
                <p className="text-brand-gold text-xs uppercase tracking-[0.2em] opacity-80">
                    {format(currentDate, 'yyyy')}
                </p>
                {/* Notification Button */}
                <button onClick={handleEnableNotifications} className="bg-white/10 p-1 rounded-full text-brand-gold hover:bg-white/20">
                    <FaBell size={10} />
                </button>
            </div>
        </div>
        
        <div className="flex gap-2">
            <button onClick={prevMonth} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <FaChevronLeft size={12}/>
            </button>
            <button onClick={nextMonth} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <FaChevronRight size={12}/>
            </button>
        </div>
      </div>

      {/* --- WEEKDAYS --- */}
      <div className="grid grid-cols-7 px-2 mb-2 bg-[#0b262d]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className={`text-center text-[10px] font-bold py-2 ${i === 0 || i === 6 ? 'text-brand-red' : 'text-gray-500'}`}>
                {day}
            </div>
        ))}
      </div>

      {/* --- CALENDAR GRID --- */}
      <div className="flex-1 px-2 pb-20 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-7 gap-1 auto-rows-[minmax(80px,1fr)]">
            {calendarDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const dayEvents = getEventsForDay(day);
                
                // Logic for styling
                const isBlocked = dayEvents.some(ev => ev.event_type === 'Block' || ev.status === 'blocked');
                const activeBookings = dayEvents.filter(ev => ev.event_type !== 'Block' && ev.status !== 'blocked');
                const hasBooking = activeBookings.length > 0;
                
                let bgClass = "bg-white/[0.02]";
                let textClass = "text-white";
                let borderClass = "border-transparent";

                if (!isCurrentMonth) {
                    bgClass = "bg-transparent opacity-30";
                    textClass = "text-gray-500";
                } else if (isBlocked) {
                    bgClass = "bg-red-900/20"; 
                    borderClass = "border-red-500/20";
                } else if (hasBooking) {
                    bgClass = "bg-emerald-500/10"; 
                    borderClass = "border-emerald-500/30";
                }

                if (isToday) {
                    borderClass = "border-brand-gold";
                }

                return (
                    <div 
                        key={day.toString()} 
                        onClick={() => handleDateClick(day)}
                        className={`
                            ${bgClass} border ${borderClass}
                            rounded-xl p-2 flex flex-col justify-between items-center relative
                            transition-all active:scale-95 duration-200 cursor-pointer
                        `}
                    >
                        <span className={`text-xs font-medium ${isToday ? 'text-brand-gold font-bold' : textClass}`}>
                            {format(day, 'd')}
                        </span>

                        <div className="w-full flex justify-center items-center h-full">
                            {isBlocked ? (
                                <FaBan className="text-red-400/50 text-sm" />
                            ) : hasBooking ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-[#0b262d] flex items-center justify-center text-[10px] font-bold shadow-lg shadow-emerald-900/50">
                                    {activeBookings.length}
                                </div>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- BOTTOM DRAWER --- */}
      <BottomDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedDate ? format(selectedDate, 'EEEE, MMM do') : ''}
      >
        <div className="flex flex-col gap-6">
            
            {/* 1. CREATION FORM */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h4 className="text-xs uppercase tracking-widest text-brand-gold mb-3 font-bold">Manage Date</h4>
                
                <div className="flex flex-col gap-3">
                    
                    {/* Date Range */}
                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                        <FaCalendarAlt className="text-gray-500 ml-1" />
                        <span className="text-xs text-gray-400 mr-2">Till When?</span>
                        <input 
                            type="date"
                            value={formData.endDate}
                            min={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            className="bg-transparent border-none outline-none text-white text-sm w-full [color-scheme:dark]"
                        />
                    </div>

                    {/* Team & Phone Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                            <FaUserTag className="text-gray-500 ml-1" />
                            <select 
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                                className="bg-transparent border-none outline-none text-white text-sm w-full appearance-none"
                            >
                                <option value="" className="bg-black text-gray-500">Assign To...</option>
                                {TEAM_MEMBERS.map(m => (
                                    <option key={m} value={m} className="bg-black text-white">{m}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                            <FaPhone className="text-gray-500 ml-1" />
                            <input 
                                type="tel"
                                placeholder="Phone"
                                value={formData.clientPhone}
                                onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                            />
                        </div>
                    </div>

                    {/* Client Name (Logic Trigger) */}
                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                        <FaUser className="text-gray-500 ml-1" />
                        <input 
                            type="text"
                            placeholder="Client Name (Leave Empty to BLOCK)"
                            value={formData.clientName}
                            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                        />
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-start gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                        <FaInfoCircle className="text-gray-500 ml-1 mt-1" />
                        <textarea
                            placeholder="Additional Info..."
                            value={formData.additionalInfo}
                            onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600 h-10 resize-none pt-1"
                        />
                    </div>
                    
                    {/* Action Button */}
                    <button 
                        onClick={handleCreateEntry}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                            ${!formData.clientName.trim() 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30' // Block Style
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'} // Booking Style
                        `}
                    >
                        {isLoading ? 'Processing...' : (
                            !formData.clientName.trim()
                                ? <><FaBan /> Block Date</> 
                                : <><FaCheckCircle /> Create Booking</>
                        )}
                    </button>
                </div>
            </div>

            {/* 2. EXISTING EVENTS LIST */}
            {eventsOnSelectedDate.length > 0 && (
                <div>
                    <h4 className="text-xs uppercase tracking-widest text-brand-gold mb-3 font-bold px-1">Events on this day</h4>
                    <div className="space-y-3">
                        {eventsOnSelectedDate.map(ev => {
                            const isBlock = ev.event_type === 'Block' || ev.status === 'blocked';
                            return (
                                <div key={ev.id} className={`
                                    relative p-4 rounded-xl border flex justify-between items-start
                                    ${isBlock 
                                        ? 'bg-red-900/10 border-red-500/20' 
                                        : 'bg-emerald-900/10 border-emerald-500/20'}
                                `}>
                                    <div>
                                        <h5 className={`font-bold text-lg ${isBlock ? 'text-red-200' : 'text-white'}`}>
                                            {ev.client_name}
                                        </h5>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded w-fit
                                                ${ev.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 
                                                  ev.status === 'blocked' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}
                                            `}>
                                                {ev.status}
                                            </span>
                                            
                                            {!isBlock && (
                                                <div className="text-xs text-gray-400 mt-1 flex flex-col gap-0.5">
                                                    {ev.client_phone && <span>📞 {ev.client_phone}</span>}
                                                    {ev.assigned_to && <span>📸 Assigned: {ev.assigned_to}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {!isBlock && ev.client_phone && (
                                            <a href={`https://wa.me/${ev.client_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" 
                                               className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                                                <FaWhatsapp size={20} />
                                            </a>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleDelete(ev.id)}
                                            className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                                        >
                                            <FaTrashAlt size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
      </BottomDrawer>
    </div>
  );
};

export default AdminCalendar;