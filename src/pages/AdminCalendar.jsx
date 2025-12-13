import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaWhatsapp, FaCamera } from 'react-icons/fa';

const AdminCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);

  // Fetch Data & Realtime Sync
  useEffect(() => {
    const fetchBookings = async () => {
      const { data } = await supabase.from('bookings').select('*');
      if (data) setBookings(data);
    };

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
        const start = parseISO(booking.booking_date);
        if (booking.booking_end_date) {
            const end = parseISO(booking.booking_end_date);
            return isWithinInterval(day, { start, end });
        }
        return isSameDay(start, day);
    });
  };

  return (
    // h-[100dvh] ensures full mobile screen without browser chrome scrolling
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#0f172a] text-white flex flex-col overflow-hidden">
      
      {/* App Header */}
      <div className="bg-[#1e293b]/80 backdrop-blur-md px-4 py-3 flex justify-between items-center border-b border-white/5 z-50 shrink-0">
        <div className="flex items-center gap-2 text-brand-gold font-bold">
            <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                <FaCamera size={14} />
            </div>
            <span className="text-sm tracking-wide">CALENDAR</span>
        </div>
        
        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors"><FaChevronLeft size={12}/></button>
            <span className="font-medium text-sm min-w-[100px] text-center">
                {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors"><FaChevronRight size={12}/></button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 bg-[#1e293b] py-2 shrink-0 border-b border-white/5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {day}
            </div>
        ))}
      </div>

      {/* Scrollable Calendar Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-7 min-h-full auto-rows-fr gap-[1px] bg-gray-800 border-b border-gray-800">
            
            {calendarDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const dayEvents = getEventsForDay(day);

                return (
                    <div 
                        key={day.toString()} 
                        className={`
                            bg-[#0f172a] p-1 flex flex-col relative min-h-[100px]
                            ${!isCurrentMonth ? 'bg-black/40 opacity-50' : ''}
                            ${isToday ? 'bg-brand-gold/5' : ''}
                        `}
                    >
                        {/* Date Number */}
                        <div className="flex justify-center mb-1">
                             <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full
                                ${isToday ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/50' : 'text-gray-500'}`}>
                                {format(day, 'd')}
                            </span>
                        </div>

                        {/* Events Dots/Bars */}
                        <div className="flex flex-col gap-1 w-full">
                            {dayEvents.map(ev => (
                                <div key={ev.id} className={`
                                    rounded-[3px] px-1 py-1 border-l-2 text-[9px] leading-tight shadow-sm relative group cursor-pointer
                                    ${ev.status === 'confirmed' 
                                        ? 'bg-[#064e3b] border-green-500 text-green-100' 
                                        : ev.status === 'rejected'
                                            ? 'bg-red-900/20 border-red-500 text-red-400 line-through decoration-red-500/50'
                                            : 'bg-yellow-900/20 border-yellow-500 text-yellow-100'}
                                `}>
                                    <div className="font-semibold truncate w-full">{ev.client_name.split(' ')[0]}</div>
                                    
                                    {ev.assigned_to && (
                                        <div className="opacity-70 text-[8px] truncate">
                                            {ev.assigned_to.replace('@', '')}
                                        </div>
                                    )}

                                    {/* Quick WhatsApp Action */}
                                    <a 
                                        href={`https://wa.me/${ev.client_phone?.replace(/\D/g,'')}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-0.5"
                                    >
                                        <FaWhatsapp className="text-green-400 text-[10px]" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
        
        {/* Footer Info */}
        <div className="p-4 text-center text-gray-600 text-[10px]">
             Live Sync Enabled • v2.0
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;