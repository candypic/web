import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaPhoneAlt,
  FaUser,
  FaEnvelope,
  FaCheckCircle,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaArrowRight,
  FaImages,
  FaDownload,
} from 'react-icons/fa';
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

  // ⬇️ Month navigation state
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Prevent navigating to past months
  const isCurrentMonth =
    currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const goPrevMonth = () => {
    if (isCurrentMonth) return;

    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const daysArray = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const checkDate = new Date(iso);
      const todayZero = new Date();
      todayZero.setHours(0, 0, 0, 0);

      return {
        label: day,
        iso,
        blocked: blockedDates.includes(iso),
        isPast: checkDate < todayZero
      };
    })
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={isCurrentMonth}
          aria-label="Previous month"
          className={`w-10 h-10 flex items-center justify-center rounded-full border border-white/15 text-brand-muted transition-all focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none
            ${isCurrentMonth ? "opacity-30 cursor-not-allowed" : "hover:bg-brand-gold/10 hover:text-brand-gold hover:border-brand-gold/40"}`}
        >
          <FaChevronLeft size={12} />
        </button>

        <h3 className="font-serif text-2xl md:text-3xl text-white tracking-wide">
          {monthNames[currentMonth]}{' '}
          <span className="text-brand-gold">{currentYear}</span>
        </h3>

        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Next month"
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/15 text-brand-muted hover:bg-brand-gold/10 hover:text-brand-gold hover:border-brand-gold/40 transition-all focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
        >
          <FaChevronRight size={12} />
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-7 shadow-2xl">
        <div className="grid grid-cols-7 gap-1.5 md:gap-2 text-center mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div
              key={d}
              className="text-brand-gold/70 text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em]"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {daysArray.map((d, index) => {
            if (!d) return <div key={index} />;

            return (
              <button
                type="button"
                key={d.iso}
                disabled={d.blocked || d.isPast}
                onClick={() => onDateSelect(d.iso)}
                aria-label={d.blocked ? `${d.iso} unavailable` : `Select ${d.iso}`}
                aria-pressed={selectedDate === d.iso}
                className={`
                  aspect-square rounded-xl text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none
                  ${d.blocked
                    ? "bg-white/[0.02] text-brand-muted/30 line-through cursor-not-allowed"
                    : d.isPast
                      ? "text-brand-muted/20 cursor-not-allowed"
                      : selectedDate === d.iso
                        ? "bg-gradient-to-br from-brand-gold to-brand-gold-soft text-brand-dark font-bold scale-105 shadow-lg shadow-brand-gold/30"
                        : "bg-white/5 text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold"}
                `}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-white/10">
          <span className="flex items-center gap-2 text-xs text-brand-muted">
            <span className="w-3 h-3 rounded-md bg-gradient-to-br from-brand-gold to-brand-gold-soft" />
            Selected
          </span>
          <span className="flex items-center gap-2 text-xs text-brand-muted">
            <span className="w-3 h-3 rounded-md bg-white/5" />
            Available
          </span>
          <span className="flex items-center gap-2 text-xs text-brand-muted">
            <span className="w-3 h-3 rounded-md bg-white/[0.02] border border-white/10" />
            Booked
          </span>
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

      {/* -------- Gallery Teaser Band -------- */}
      <section className="relative bg-brand-darker overflow-hidden py-24 md:py-32">
        {/* Background Glows */}
        <div className="absolute -top-20 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-10 w-96 h-96 bg-brand-red/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">

            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px w-10 bg-brand-gold/50" />
                <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gold font-medium">
                  Your Memories
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
                Relive Every{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-soft">
                  Frame
                </span>
              </h2>

              <p className="text-brand-muted text-base md:text-lg leading-relaxed font-light mb-9 max-w-md">
                Your private gallery is where the celebration lives on. Browse the
                full collection of high-resolution photographs and download your
                favourites in stunning quality, anytime.
              </p>

              <RouterLink
                to="/gallery"
                className="inline-flex items-center gap-3 rounded-full px-8 py-4 bg-brand-gold text-brand-dark font-semibold tracking-wide uppercase text-sm hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
              >
                <FaDownload size={14} />
                View &amp; Download Photos
                <FaArrowRight size={14} />
              </RouterLink>
            </motion.div>

            {/* Preview thumbnails */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="hidden sm:grid grid-cols-2 gap-4"
            >
              <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl row-span-2 group">
                <img
                  src="/p2.jpg"
                  alt="Candy Pic wedding photography preview"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl group">
                <img
                  src="/p5.jpg"
                  alt="Candy Pic event photography preview"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl group">
                <img
                  src="/p7.jpg"
                  alt="Candy Pic cinematic photography preview"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-darker/80 to-transparent flex items-end p-4">
                  <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-light font-medium">
                    <FaImages className="text-brand-gold" /> Full Gallery
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* -------- Contact Section -------- */}
      <div id="contact" className="relative py-24 md:py-32 bg-brand-dark overflow-hidden">

        {/* Background Glows */}
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Decorative script word */}
        <span className="hidden md:block absolute top-10 right-16 font-script text-7xl text-white/[0.04] select-none pointer-events-none">
          forever
        </span>

        <div className="max-w-6xl mx-auto px-6 md:px-10 relative z-10">

          {/* Section Heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14 md:mb-20"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-10 bg-brand-gold/50" />
              <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gold font-medium">
                Book Your Date
              </span>
              <span className="h-px w-10 bg-brand-gold/50" />
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
              Secure Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-soft">
                Moment
              </span>
            </h2>

            <p className="text-brand-muted text-base md:text-lg leading-relaxed font-light mt-5 max-w-xl mx-auto">
              Our calendar fills quickly through the season. Choose your date below
              and our team will reach out to craft the perfect package for you.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* LEFT: Calendar Side */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col"
            >
              <CalendarSection
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setInquirySent(false); // Reset form if date changes
                }}
                blockedDates={bookedDates}
              />
            </motion.div>

            {/* RIGHT: Dynamic Form Side */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative min-h-[380px] sm:min-h-[440px] flex items-center"
            >

              {/* STATE 0: No Date Selected */}
              {!selectedDate && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="w-full bg-white/[0.03] backdrop-blur-xl border border-dashed border-white/15 rounded-3xl h-full flex flex-col items-center justify-center text-center p-10 min-h-[440px] shadow-2xl"
                >
                  <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mb-5 text-brand-gold">
                    <FaCalendarAlt size={24} />
                  </div>
                  <h3 className="font-serif text-2xl text-white mb-2">Choose a Date</h3>
                  <p className="text-brand-muted text-sm font-light max-w-xs">
                    Select an available day from the calendar to begin your booking inquiry.
                  </p>
                </motion.div>
              )}

              {/* STATE 1: Date Selected (Form Active) */}
              <AnimatePresence mode="wait">
                {selectedDate && !inquirySent && (
                  <motion.form
                    key="booking-form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.5 }}
                    className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-9 shadow-2xl relative"
                  >
                    <div className="absolute -top-4 left-8 bg-gradient-to-r from-brand-gold to-brand-gold-soft text-brand-dark px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-gold/30 flex items-center gap-2">
                      <FaCheckCircle /> {selectedDate}
                    </div>

                    <div className="space-y-6 mt-4">
                      <p className="text-brand-muted text-sm font-light">
                        Tell us where to reach you and we&apos;ll confirm availability
                        for this date.
                      </p>

                      {/* Name */}
                      <div className="group">
                        <label className="text-xs text-brand-gold uppercase tracking-[0.2em] mb-2 block ml-1">Your Name</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-gold transition-colors">
                            <FaUser size={14} />
                          </div>
                          <input name="name" type="text" required placeholder="Full Name"
                            className="w-full bg-brand-darker/60 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder:text-brand-muted/50 focus:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus:outline-none transition-all" />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="group">
                        <label className="text-xs text-brand-gold uppercase tracking-[0.2em] mb-2 block ml-1">Phone Number</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-gold transition-colors">
                            <FaPhoneAlt size={14} />
                          </div>
                          <input name="phone" type="tel" required placeholder="+91 98765 43210"
                            className="w-full bg-brand-darker/60 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder:text-brand-muted/50 focus:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus:outline-none transition-all" />
                        </div>
                      </div>

                      {/* Email (Optional) */}
                      <div className="group">
                        <label className="text-xs text-brand-gold uppercase tracking-[0.2em] mb-2 block ml-1">Email <span className="text-brand-muted/60 lowercase tracking-normal">(optional)</span></label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-gold transition-colors">
                            <FaEnvelope size={14} />
                          </div>
                          <input name="email" type="email" placeholder="you@example.com"
                            className="w-full bg-brand-darker/60 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder:text-brand-muted/50 focus:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus:outline-none transition-all" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-brand-gold text-brand-dark font-semibold rounded-full shadow-lg shadow-brand-gold/20 hover:bg-brand-gold-soft transition-all uppercase tracking-wide text-sm flex justify-center items-center gap-2 disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                      >
                        {isSubmitting ? <FaSpinner className="animate-spin" /> : 'Check Availability Now'}
                      </button>

                      <p className="text-center text-brand-muted text-xs flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
                        Our team will be in touch within a few minutes.
                      </p>
                    </div>
                  </motion.form>
                )}

                {/* STATE 2: Success (Inquiry Sent) */}
                {selectedDate && inquirySent && (
                  <motion.div
                    key="success-message"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full bg-white/5 backdrop-blur-xl border border-brand-gold/30 rounded-3xl p-9 text-center shadow-2xl min-h-[440px] flex flex-col items-center justify-center"
                  >
                    <div className="w-20 h-20 bg-brand-gold/15 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FaCheckCircle className="text-4xl text-brand-gold" />
                    </div>
                    <h3 className="font-serif text-3xl text-white mb-3">Request Received</h3>
                    <p className="text-brand-muted text-sm md:text-base font-light leading-relaxed mb-8 max-w-sm">
                      Thank you. We have noted your interest for{' '}
                      <strong className="text-brand-light font-medium">{selectedDate}</strong>.
                      Our team will call you shortly to discuss the perfect package.
                    </p>

                    {/* Add-to-calendar helpers */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                      <a
                        href={generateGoogleCalendarLink(calendarEventData)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-full px-5 py-3 border border-white/25 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm transition-all uppercase tracking-wide text-xs flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                      >
                        <FaCalendarAlt size={12} /> Google Calendar
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadICSFile(calendarEventData)}
                        className="flex-1 rounded-full px-5 py-3 border border-white/25 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm transition-all uppercase tracking-wide text-xs flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                      >
                        <FaDownload size={12} /> Add to Calendar
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setInquirySent(false); setSelectedDate(null); }}
                      className="mt-7 text-xs text-brand-muted underline underline-offset-4 hover:text-brand-gold transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none rounded"
                    >
                      Start New Inquiry
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
