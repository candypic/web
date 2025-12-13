import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaWhatsapp, FaCamera, FaBan, FaUser, FaPhone, FaCalendarAlt, FaUserTag, FaTrashAlt, FaCheckCircle, FaAddressBook, FaInfoCircle } from 'react-icons/fa';
import BottomDrawer from '../components/BottomDrawer';

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
    assignedTo: [],
    additionalInfo: ''
  });

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

  // Calendar Math
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
    // Reset form when opening, default endDate to selectedDate
    const dateStr = format(day, 'yyyy-MM-dd');
    setFormData({ 
        clientName: '',
        clientPhone: '',
        endDate: dateStr,
        assignedTo: [],
        additionalInfo: ''
    });
    setIsDrawerOpen(true);
  };

  // ---------------------------------------------
  // 📞 CONTACT PICKER API LOGIC
  // ---------------------------------------------
  const handleSelectContacts = async () => {
    if ('contacts' in navigator && 'select' in navigator.contacts) {
      try {
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
        if (contacts.length > 0) {
          const selectedContacts = contacts.map(contact => ({
            name: contact.name[0],
            phone: contact.tel[0]
          }));
          
          // Add all selected contacts to the 'assignedTo' list WITHOUT auto-filling main fields
          setFormData(prev => {
            // Filter out duplicates based on phone number or name if phone is missing
            const newContacts = selectedContacts.filter(
                sc => !prev.assignedTo.some(existing => existing.phone === sc.phone && existing.name === sc.name)
            );
            
            return {
                ...prev,
                assignedTo: [...prev.assignedTo, ...newContacts]
            };
          });
        }
      } catch (ex) {
        console.error('Error selecting contacts:', ex);
        alert('Could not open contact picker. Make sure you are on a compatible device (like a mobile phone) and have granted permissions.');
      }
    } else {
      alert('Contact Picker API is not supported on this browser or device.');
    }
  };

  // ---------------------------------------------
  // ⚡ CREATE BOOKING / BLOCK LOGIC
  // ---------------------------------------------
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
            type: isBlocking ? 'block' : 'booking',
            
            client_name: isBlocking ? 'Date Blocked' : formData.clientName,
            client_phone: formData.clientPhone || null,
            // Format: "Name (Phone), Name (Phone)"
            assigned_to: formData.assignedTo.length > 0
                ? formData.assignedTo.map(c => `${c.name} (${c.phone})`).join(', ')
                : null,
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
      <div className="pt-6 pb-4 px-6 flex justify-between items-center bg-[#0b262d] z-10 shadow-xl shadow-[#091f25]">
        <div>
            <h1 className="text-2xl font-serif text-white tracking-wide">
                {format(currentDate, 'MMMM')}
            </h1>
            <p className="text-brand-gold text-sm uppercase tracking-[0.2em] opacity-80">
                {format(currentDate, 'yyyy')}
            </p>
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
                const isBlocked = dayEvents.some(ev => ev.type === 'block' || ev.status === 'blocked');
                const activeBookings = dayEvents.filter(ev => ev.type !== 'block' && ev.status !== 'blocked');
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
                <h4 className="text-xs uppercase tracking-widest text-brand-gold mb-3 font-bold">Create Entry</h4>
                
                <div className="flex flex-col gap-3">
                    {/* Range Selection */}
                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                        <FaCalendarAlt className="text-gray-500 ml-1" />
                        <span className="text-xs text-gray-400 mr-2">Till:</span>
                        <input 
                            type="date"
                            value={formData.endDate}
                            min={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            className="bg-transparent border-none outline-none text-white text-sm w-full [color-scheme:dark]"
                        />
                    </div>

                    {/* Client Name */}
                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                        <FaUser className="text-gray-500 ml-1" />
                        <input 
                            type="text"
                            placeholder="Client Name (Leave empty to Block)"
                            value={formData.clientName}
                            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                        />
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-2 gap-3">
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

                        <div className="flex items-center gap-2 bg-brand-gold/10 p-2 rounded-lg border border-brand-gold/20">
                            <FaAddressBook className="text-brand-gold ml-1" />
                            <button
                                onClick={handleSelectContacts}
                                className="bg-transparent border-none outline-none text-brand-gold text-sm w-full text-left font-semibold"
                            >
                                Select Contact
                            </button>
                        </div>
                    </div>

                    {/* Assigned To Display */}
                    {formData.assignedTo.length > 0 && (
                      <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                          <label className="text-xs text-gray-400 flex items-center gap-2 mb-2">
                              <FaUserTag /> Assigned
                          </label>
                          <div className="flex flex-col gap-2">
                              {formData.assignedTo.map((contact, index) => (
                                  <div key={index} className="bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-lg flex justify-between items-center">
                                      <span>{contact.name}</span>
                                      <span className="text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">{contact.phone}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                    )}
                    
                    {/* Additional Info */}
                    <div className="flex items-start gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                        <FaInfoCircle className="text-gray-500 ml-1 mt-1" />
                        <textarea
                            placeholder="Additional Info..."
                            value={formData.additionalInfo}
                            onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600 h-16 resize-none"
                        />
                    </div>
                    
                    {/* Action Button */}
                    <button 
                        onClick={handleCreateEntry}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                            ${!formData.clientName 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30' // Block Style
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'} // Booking Style
                        `}
                    >
                        {isLoading ? 'Processing...' : (
                            !formData.clientName 
                                ? <><FaBan /> Block Date Range</> 
                                : <><FaCheckCircle /> Create Booking</>
                        )}
                    </button>
                </div>
            </div>

            {/* 2. EXISTING EVENTS */}
            {eventsOnSelectedDate.length > 0 && (
                <div>
                    <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-bold px-1">Events on this day</h4>
                    <div className="space-y-3">
                        {eventsOnSelectedDate.map(ev => {
                            const isBlock = ev.type === 'block' || ev.status === 'blocked';
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
                                                    {ev.assigned_to && <span>📸 {ev.assigned_to}</span>}
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