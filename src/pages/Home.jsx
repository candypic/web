import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaPhoneAlt, FaUser, FaEnvelope, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient'; // Ensure this file exists
import { generateGoogleCalendarLink, downloadICSFile } from '../utils/calendarUtils'; // Ensure this file exists

import Hero from '../components/Hero';
import About from '../components/About';
import Portfolio from '../components/Portfolio';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/* ----------------------- Calendar Component ----------------------- */
const CalendarSection = ({ onDateSelect, selectedDate, blockedDates = [] }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); 

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Generate Calendar Grid
  // FIX: Used Array.from() to ensure the map function actually runs
  const daysArray = [
    ...Array(firstDayOfMonth).fill(null), 
    ...Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Fix 'isPast' to ensure today is clickable
      const checkDate = new Date(iso);
      const todayZero = new Date();
      todayZero.setHours(0,0,0,0);
      const isPast = checkDate < todayZero;
      
      const isBlocked = blockedDates.includes(iso);

      return {
        label: day,
        iso,
        blocked: isBlocked,
        isPast: isPast
      };
    })
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6 px-2">
        <h3 className="text-2xl font-serif text-white tracking-wide">
          {monthNames[month]} {year}
        </h3>
        <span className="text-xs text-brand-gold uppercase tracking-widest opacity-80">Select a Date</span>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="grid grid-cols-7 gap-2 text-center mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-brand-gold/60 text-xs font-bold uppercase tracking-wider">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysArray.map((d, index) => {
            // Render empty slots for layout alignment
            if (!d) return <div key={`empty-${index}`} />;

            return (
              <button
                key={d.iso}
                disabled={d.blocked || d.isPast}
                onClick={() => onDateSelect(d.iso)}
                className={`
                  aspect-square rounded-xl text-sm font-medium transition-all duration-300 relative group
                  ${d.blocked
                    ? "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5" // Booked/Blocked
                    : d.isPast 
                        ? "text-gray-700 cursor-not-allowed" // Past
                        : selectedDate === d.iso
                            ? "bg-gradient-to-br from-brand-red to-red-600 text-white shadow-lg shadow-brand-red/40 scale-110 z-10" // Selected
                            : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105" // Available
                  }
                `}
              >
                {d.label}
                {/* Booked Indicator */}
                {d.blocked && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-500 rounded-full"></div>}
              </button>
            );
          })}
        </div>
        
        <div className="flex gap-4 mt-6 text-xs text-gray-500 justify-center">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/10"></div> Available</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-red"></div> Selected</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-600 border border-gray-500"></div> Booked</div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------- Home Page ----------------------------- */

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  // 1. Fetch Confirmed Bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      // Fetch only 'confirmed' bookings to block them on calendar
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date')
        .eq('status', 'confirmed');

      if (data) {
        setBookedDates(data.map(b => b.booking_date));
      }
    };

    fetchBookings();

    // Realtime Listener: Updates calendar if Admin confirms a booking elsewhere
    const channel = supabase
      .channel('bookings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const email = formData.get('email');

    // Insert into Supabase
    const { error } = await supabase
      .from('bookings')
      .insert([{
         client_name: name,
         client_phone: phone,
         booking_date: selectedDate,
         status: 'pending' // Default status
      }]);

    setIsSubmitting(false);

    if (error) {
      alert("Something went wrong. Please try again.");
      console.error(error);
    } else {
      setInquirySent(true);
    }
  };

  // Helper for Calendar Buttons
  const calendarEventData = {
    title: `Photoshoot Inquiry: ${selectedDate}`,
    start: selectedDate || '',
    description: "Pending confirmation from Candy Pic Team.",
    location: "Kumta, Karnataka"
  };

  return (
    <div>
      <Navbar />
      <Hero />
      <About />
      <Portfolio />

      {/* -------- Contact Section -------- */}
      <div id="contact" className="relative py-28 px-4 bg-[#050505] overflow-hidden">
        
        {/* Background Glows */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-light/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-start relative z-10">

          {/* LEFT: Calendar Side */}
          <div className="flex flex-col">
            <div className="mb-10">
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
                  Secure Your <br/> <span className="text-brand-gold">Moment.</span>
                </h2>
                <p className="text-gray-400 text-lg font-light">
                  Availability is limited. Select a date to check our team's schedule.
                </p>
            </div>
            
            <CalendarSection 
                selectedDate={selectedDate} 
                onDateSelect={(date) => {
                    setSelectedDate(date);
                    setInquirySent(false); // Reset form if date changes
                }} 
                blockedDates={bookedDates}
            />
          </div>

          {/* RIGHT: Dynamic Form Side */}
          <div className="relative min-h-[400px] flex items-center">
            
            {/* STATE 0: No Date Selected */}
            {!selectedDate && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-full border border-dashed border-white/10 rounded-3xl h-full flex flex-col items-center justify-center text-center p-10 bg-white/[0.02]"
                >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-brand-gold">
                        <FaCalendarAlt size={24} />
                    </div>
                    <h3 className="text-xl text-white font-serif mb-2">No Date Selected</h3>
                    <p className="text-gray-500 text-sm">Please choose a date from the calendar to proceed.</p>
                </motion.div>
            )}

            {/* STATE 1: Date Selected (Form Active) */}
            <AnimatePresence mode="wait">
                {selectedDate && !inquirySent && (
                    <motion.form 
                        key="booking-form"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative"
                    >
                        <div className="absolute -top-4 left-8 bg-brand-gold text-brand-dark px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
                             <FaCheckCircle /> {selectedDate}
                        </div>

                        <div className="space-y-6 mt-4">
                            {/* Name */}
                            <div className="group">
                                <label className="text-xs text-brand-gold uppercase tracking-widest mb-2 block ml-1">Your Name</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-red transition-colors">
                                        <FaUser size={14} />
                                    </div>
                                    <input name="name" type="text" required placeholder="Full Name"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white focus:border-brand-red focus:outline-none transition-all" />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="group">
                                <label className="text-xs text-brand-gold uppercase tracking-widest mb-2 block ml-1">Phone Number</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-red transition-colors">
                                        <FaPhoneAlt size={14} />
                                    </div>
                                    <input name="phone" type="tel" required placeholder="+91 98765 43210"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white focus:border-brand-red focus:outline-none transition-all" />
                                </div>
                            </div>

                            {/* Email (Optional) */}
                            <div className="group">
                                <label className="text-xs text-brand-gold uppercase tracking-widest mb-2 block ml-1">Email <span className="text-gray-600 lowercase">(optional)</span></label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-red transition-colors">
                                        <FaEnvelope size={14} />
                                    </div>
                                    <input name="email" type="email" placeholder="you@example.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white focus:border-brand-red focus:outline-none transition-all" />
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-brand-red to-[#c02b37] text-white font-bold rounded-xl shadow-lg hover:shadow-brand-red/40 transition-all uppercase tracking-wide flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? <FaSpinner className="animate-spin" /> : 'Check Availability Now'}
                            </button>
                            
                            <p className="text-center text-gray-400 text-xs mt-4 flex items-center justify-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Our team will be in touch within a few minutes.
                            </p>
                        </div>
                    </motion.form>
                )}

                {/* STATE 2: Success (Inquiry Sent) */}
                {selectedDate && inquirySent && (
                    <motion.div
                        key="success-message"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full bg-green-900/10 border border-green-500/30 rounded-3xl p-8 text-center"
                    >
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaCheckCircle className="text-3xl text-green-500" />
                        </div>
                        <h3 className="text-2xl text-white font-serif mb-2">Request Received!</h3>
                        <p className="text-gray-400 text-sm mb-8">
                            We have received your details for <strong>{selectedDate}</strong>.<br/>
                            We will call you shortly to discuss the package.
                        </p>

                        
                        
                        <button 
                            onClick={() => { setInquirySent(false); setSelectedDate(null); }}
                            className="mt-6 text-xs text-gray-500 underline hover:text-white"
                        >
                            Start New Inquiry
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;