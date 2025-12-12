import React from 'react';

import Hero from '../components/Hero';
import About from '../components/About';
import Portfolio from '../components/Portfolio';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/* ----------------------- Calendar Component ----------------------- */
const CalendarSection = () => {
  const [selected, setSelected] = React.useState(null);

  // Hardcoded blocked dates for now (replace with backend response)
  const blockedDates = ["2025-12-20", "2025-12-23", "2025-12-27"];

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate dates list with ISO string
  const dates = [...Array(daysInMonth)].map((_, i) => {
    const d = new Date(year, month, i + 1);
    const iso = d.toISOString().split("T")[0];

    return {
      label: i + 1,
      iso,
      blocked: blockedDates.includes(iso),
    };
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 shadow-lg mt-10">
      <h3 className="text-xl font-serif text-white tracking-wide mb-6 text-center">
        Select Your Date
      </h3>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-3 text-center text-gray-400 text-sm mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {dates.map((d) => (
          <button
            key={d.iso}
            onClick={() => !d.blocked && setSelected(d.iso)}
            className={`
              py-3 rounded-lg text-sm font-medium transition-all
              ${d.blocked
                ? "bg-red-900/40 text-red-300 cursor-not-allowed opacity-50"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.05] active:scale-95"
              }
              ${selected === d.iso ? "bg-brand-red text-white scale-[1.1] shadow-lg" : ""}
            `}
          >
            {d.label}
          </button>
        ))}
      </div>

      {selected && (
        <p className="text-center text-brand-gold mt-6 font-medium tracking-wide">
          Selected Date: {selected}
        </p>
      )}
    </div>
  );
};

/* -------------------------- Home Page ----------------------------- */

const Home = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <About />
      <Portfolio />

      {/* -------- Contact Section with Calendar -------- */}
      <div
        id="contact"
        className="relative py-28 px-4 bg-gradient-to-b from-black via-black to-brand-dark"
      >
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-14">

          {/* Heading */}
          <div className="text-center mb-14">
            <h2 className="text-5xl font-serif text-white tracking-wide mb-4">
              Let’s Create Magic
            </h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Choose your date and share your details with us.
            </p>
          </div>

          {/* Calendar */}
          <CalendarSection />

          {/* ---- FORM ---- */}
          <form className="space-y-8 mt-12">

            {/* First Row */}
            <div className="grid sm:grid-cols-2 gap-8">

              <div className="group flex flex-col">
                <label className="text-sm text-brand-gold mb-2 opacity-80 group-focus-within:opacity-100 transition-opacity">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 
                             focus:border-brand-red/80 focus:shadow-[0_0_12px_rgba(255,0,0,0.35)] 
                             focus:outline-none transition-all"
                />
              </div>

              <div className="group flex flex-col">
                <label className="text-sm text-brand-gold mb-2 opacity-80 group-focus-within:opacity-100 transition-opacity">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 
                             focus:border-brand-red/80 focus:shadow-[0_0_12px_rgba(255,0,0,0.35)] 
                             focus:outline-none transition-all"
                />
              </div>

            </div>

            {/* Message */}
            <div className="group flex flex-col">
              <label className="text-sm text-brand-gold mb-2 opacity-80 group-focus-within:opacity-100 transition-opacity">
                Message (Optional)
              </label>
              <textarea
                rows="4"
                placeholder="Tell us about your shoot, event, or idea..."
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500
                           focus:border-brand-red/80 focus:shadow-[0_0_12px_rgba(255,0,0,0.35)]
                           focus:outline-none transition-all resize-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              className="w-full py-4 bg-gradient-to-r from-brand-red to-red-700 text-white font-semibold 
                         rounded-xl shadow-xl shadow-red-900/20 
                         hover:shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98]
                         transition-all tracking-wide"
            >
              Send Inquiry
            </button>

          </form>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
