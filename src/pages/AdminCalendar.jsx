import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaWhatsapp, FaCamera, FaBan, FaUser, FaPhone, FaCalendarAlt, FaUserTag, FaTrashAlt, FaCheckCircle, FaInfoCircle, FaBell, FaAddressBook, FaPlus, FaArrowLeft, FaEdit, FaTimes } from 'react-icons/fa';
import BottomDrawer from '../components/BottomDrawer';
import { requestForToken } from '../lib/firebase'; // Ensure you created this file in previous steps
import AdminLayout from '../components/admin/AdminLayout';

const AdminCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tempName, setTempName] = useState(''); // For manual input
  
  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    endDate: '',
    assignedTo: [], // Array of { name, phone }
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

        const { data, error } = await supabase
            .from('team_devices')
            .upsert({ 
                name: name, 
                phone: cleanPhone, 
                fcm_token: token,
                updated_at: new Date()
            }, { onConflict: 'fcm_token' });

        if (error) {
            console.error("Supabase Error:", error);
            alert(`Supabase Error: ${error.message}`);
        } else {
            console.log("Supabase Success:", data);
            alert("✅ Device Registered! Test notification sent.");
            
            // --- TEST TRIGGER ---
            try {
                await fetch('https://tikqxpgqgfciuyvaspdi.supabase.co/functions/v1/booking-created', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        record: { 
                            client_name: "Test User", 
                            booking_date: new Date().toISOString().split('T')[0],
                            status: "test" 
                        } 
                    })
                });
            } catch (triggerErr) {
                console.error("Trigger failed:", triggerErr);
            }
        }
    } catch (err) {
        console.error("Critical Error:", err);
        alert(`Error: ${err.message}`);
    }
  };

  const handleAddPerson = () => {
    if (!tempName.trim()) return;
    setFormData(prev => ({
        ...prev,
        assignedTo: [...prev.assignedTo, { name: tempName.trim(), phone: '' }]
    }));
    setTempName('');
  };

  const removePerson = (name) => {
    setFormData(prev => ({ ...prev, assignedTo: prev.assignedTo.filter(p => p.name !== name) }));
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
    const dateStr = format(day, 'yyyy-MM-dd');
    setFormData({ 
        clientName: '', 
        clientPhone: '', 
        endDate: dateStr,
        assignedTo: [],
        additionalInfo: ''
    });
    setEditingId(null);
    setViewMode('list');
    setIsDrawerOpen(true);
  };

  const handleEdit = (ev) => {
    const names = ev.assigned_to ? ev.assigned_to.split(', ') : [];
    const phones = ev.assigned_phones || [];
    const people = names.map((name, i) => ({ name, phone: phones[i] || '' }));

    setFormData({
        clientName: ev.event_type === 'Block' ? '' : ev.client_name,
        clientPhone: ev.client_phone || '',
        endDate: ev.booking_end_date || ev.booking_date,
        assignedTo: people,
        additionalInfo: ev.additional_info || ''
    });
    setEditingId(ev.id);
    setViewMode('create');
  };

  // --- 4. CREATE / UPDATE ENTRY LOGIC ---
  const handleCreateEntry = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
        const formattedStartDate = format(selectedDate, 'yyyy-MM-dd');
        const isBlocking = !formData.clientName.trim(); 

        const payload = {
            client_name: isBlocking ? 'BLOCKED' : formData.clientName,
            client_phone: formData.clientPhone,
            booking_date: formattedStartDate,
            booking_end_date: formData.endDate || formattedStartDate,
            event_type: isBlocking ? 'Block' : 'Booking',
            status: isBlocking ? 'confirmed' : (editingId ? undefined : 'confirmed'),
            assigned_to: formData.assignedTo.map(p => p.name).join(', '),
            assigned_phones: formData.assignedTo.map(p => p.phone),
            additional_info: formData.additionalInfo
        };

        if (editingId) {
            const { error } = await supabase
                .from('bookings')
                .update(payload)
                .eq('id', editingId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('bookings')
                .insert([payload]);
            if (error) throw error;
        }

        await fetchBookings();
        setIsDrawerOpen(false);
    } catch (error) {
        console.error("Save failed:", error);
        alert(`Failed to save: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
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

  const handleConfirm = async (id) => {
    if (!confirm("Confirm this booking?")) return;
    setIsLoading(true);
    try {
        const { error } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id);
        if (error) throw error;
        await fetchBookings();
    } catch (error) {
        alert("Failed to confirm");
    } finally {
        setIsLoading(false);
    }
  };

  const eventsOnSelectedDate = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <AdminLayout
      title="Studio Calendar &amp; Dates"
      subtitle="Track photoshoot bookings, blocked dates, and photographer assignments"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <FaChevronLeft size={11} />
          </button>
          <span className="font-serif text-sm font-semibold text-white px-2">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <FaChevronRight size={11} />
          </button>
        </div>
      }
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl max-w-5xl mx-auto">
        {/* --- WEEKDAYS --- */}
        <div className="grid grid-cols-7 px-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={i} className={`text-center text-xs font-bold py-2 uppercase tracking-wider ${i === 0 || i === 6 ? 'text-brand-red' : 'text-brand-muted'}`}>
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
        title={
            viewMode === 'list' 
                ? (selectedDate ? format(selectedDate, 'EEEE, MMM do') : '')
                : 'New Booking'
        }
      >
        {viewMode === 'list' ? (
            <div className="flex flex-col gap-4">
                {/* 1. EXISTING EVENTS LIST (View Mode) */}
                {eventsOnSelectedDate.length > 0 ? (
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

                                        {ev.status === 'pending' && (
                                            <button 
                                                onClick={() => handleConfirm(ev.id)}
                                                className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                                title="Confirm Booking"
                                            >
                                                <FaCheckCircle size={14} />
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleEdit(ev)}
                                            className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/30 transition-colors"
                                        >
                                            <FaEdit size={14} />
                                        </button>

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
                ) : (
                    <div className="py-10 text-center text-gray-500 flex flex-col items-center gap-2">
                        <FaCalendarAlt size={30} className="opacity-20" />
                        <p>No bookings for this day</p>
                    </div>
                )}

                {/* CREATE BUTTON */}
                <button 
                    onClick={() => {
                        // Reset form for new entry
                        const dateStr = format(selectedDate, 'yyyy-MM-dd');
                        setFormData({ 
                            clientName: '', 
                            clientPhone: '', 
                            endDate: dateStr,
                            assignedTo: [],
                            additionalInfo: ''
                        });
                        setEditingId(null);
                        setViewMode('create');
                    }}
                    className="w-full py-4 bg-[#D4AF37] text-[#0b262d] font-bold rounded-xl flex items-center justify-center gap-2 mt-2 shadow-lg hover:bg-[#c4a030] transition-colors"
                >
                    <FaPlus /> Add New Booking
                </button>
            </div>
        ) : (
            <div className="flex flex-col gap-4">
                {/* BACK BUTTON */}
                <button 
                    onClick={() => { setViewMode('list'); setEditingId(null); }}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit px-2"
                >
                    <FaArrowLeft size={12} /> <span className="text-xs uppercase tracking-widest">Back to List</span>
                </button>

                {/* 2. CREATION FORM (Create Mode) */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h4 className="text-xs uppercase tracking-widest text-brand-gold mb-3 font-bold">
                        {editingId ? 'Edit Booking' : 'New Booking'}
                    </h4>
                    
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
                        <div className="grid grid-cols-1 gap-3">
                            {/* ASSIGNED TO (Multi-Select) */}
                            <div className="bg-black/20 p-2 rounded-lg border border-white/5 relative">
                                {/* Chips */}
                                {formData.assignedTo.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.assignedTo.map(p => (
                                            <span key={p.name} className="bg-brand-gold/20 text-brand-gold text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-brand-gold/30">
                                                {p.name} 
                                                <button onClick={() => removePerson(p.name)} className="hover:text-white"><FaTimes size={10}/></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="flex flex-col gap-2">
                                    {/* Contact Picker Button */}
                                    <button 
                                        onClick={handlePickContact}
                                        className="w-full bg-white/5 border border-white/10 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-white/10 transition-colors text-brand-gold"
                                    >
                                        <FaAddressBook /> Add from Contacts
                                    </button>
                                    
                                    {/* Manual Input Fallback */}
                                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                                        <FaUserTag className="text-gray-500" />
                                        <input 
                                            id="manual-name-input"
                                            type="text" 
                                            placeholder="Or type name manually..." 
                                            value={tempName}
                                            onChange={e => setTempName(e.target.value)}
                                            onKeyDown={e => { 
                                                if(e.key === 'Enter') { 
                                                    e.preventDefault(); 
                                                    addPerson(tempName); 
                                                    setTempName(''); 
                                                } 
                                            }}
                                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                                        />
                                        <button 
                                            onClick={() => { addPerson(tempName); setTempName(''); }}
                                            className="text-gray-400 hover:text-white transition-colors"
                                            disabled={!tempName.trim()}
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phone Row */}
                        <div className="grid grid-cols-1 gap-3">
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
                                    ? (editingId ? <><FaBan /> Update Block</> : <><FaBan /> Block Date</>) 
                                    : (editingId ? <><FaCheckCircle /> Update Booking</> : <><FaCheckCircle /> Create Booking</>)
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </BottomDrawer>
      </div>
    </AdminLayout>
  );
};

export default AdminCalendar;
