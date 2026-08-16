import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaLock, FaKey, FaArrowRight, FaArrowLeft, FaHeart, FaShieldAlt, FaCamera } from 'react-icons/fa';
import { getClientEventBySlug } from '../lib/galleryApi';
import Navbar from '../components/Navbar';

export default function PortalLogin() {
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();

  const [slug, setSlug] = useState(routeSlug || '');
  const [passcode, setPasscode] = useState('');
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If slug is provided in URL, load event details
  useEffect(() => {
    if (routeSlug) {
      setLoading(true);
      getClientEventBySlug(routeSlug)
        .then((data) => {
          setEventData(data);
          // Check if already authenticated in sessionStorage
          const savedAuth = sessionStorage.getItem(`portal_auth_${routeSlug}`);
          if (savedAuth) {
            navigate(`/portal/${routeSlug}`);
          }
        })
        .catch(() => {
          setError('Event gallery not found. Please check your link or event code.');
        })
        .finally(() => setLoading(false));
    }
  }, [routeSlug, navigate]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');
    const targetSlug = slug.trim().toLowerCase();

    if (!targetSlug) {
      setError('Please enter your event code.');
      return;
    }
    if (!passcode.trim()) {
      setError('Please enter your private passcode / PIN.');
      return;
    }

    setLoading(true);
    try {
      const event = eventData || (await getClientEventBySlug(targetSlug));
      if (!event) {
        throw new Error('Event not found.');
      }

      const inputPin = passcode.trim().toUpperCase();
      const masterPin = (event.passcode || '1234').toUpperCase();
      const guestPin = (event.guest_passcode || 'GUEST').toUpperCase();

      if (inputPin === masterPin) {
        // Master access (selection + download + high-res)
        sessionStorage.setItem(`portal_auth_${event.slug}`, JSON.stringify({ role: 'client', eventId: event.id }));
        navigate(`/portal/${event.slug}`);
      } else if (inputPin === guestPin) {
        // Guest access (view only)
        sessionStorage.setItem(`portal_auth_${event.slug}`, JSON.stringify({ role: 'guest', eventId: event.id }));
        navigate(`/portal/${event.slug}`);
      } else {
        setError('Incorrect passcode. Please verify with the bride/groom or studio.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to unlock gallery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-dark text-brand-text flex flex-col justify-between relative overflow-hidden">
      <Navbar />

      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] bg-brand-gold/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/10 rounded-full blur-[130px] pointer-events-none" />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-28 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Card Container */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Top gold accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent" />

            {/* Header Lock Icon */}
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold mb-6 shadow-lg shadow-brand-gold/10">
              <FaLock className="text-xl" />
            </div>

            {/* Title / Eyebrow */}
            <div className="text-center mb-7">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-brand-gold font-medium mb-2">
                <FaShieldAlt className="text-xs" /> Client Memory Vault
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-white leading-tight">
                {eventData ? eventData.title : 'Private Gallery Access'}
              </h1>
              <p className="text-sm text-brand-muted font-light mt-2 leading-relaxed">
                {eventData
                  ? `Enter your private PIN to access high-res photos & album selection.`
                  : 'Enter your event code & passcode provided by Candy Pic.'}
              </p>
            </div>

            {/* Unlock Form */}
            <form onSubmit={handleUnlock} className="space-y-4">
              {/* Event Code (only shown if not directly visiting /portal/:slug) */}
              {!routeSlug && (
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-brand-muted ml-1 mb-1.5 font-medium">
                    Event Code / Slug
                  </label>
                  <div className="relative">
                    <FaCamera className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/60 text-sm pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. priya-rahul"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full rounded-2xl bg-black/30 border border-white/10 pl-11 pr-4 py-3.5 text-white placeholder:text-brand-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus:border-brand-gold/50 transition-all font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Passcode / PIN */}
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-brand-muted ml-1 mb-1.5 font-medium">
                  Passcode / PIN
                </label>
                <div className="relative">
                  <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/60 text-sm pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your 4-digit PIN"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full rounded-2xl bg-black/30 border border-white/10 pl-11 pr-4 py-3.5 text-white placeholder:text-brand-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus:border-brand-gold/50 transition-all font-mono text-sm tracking-widest text-center"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl bg-brand-red/15 border border-brand-red/30 p-3 text-xs text-red-200 text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-full py-4 bg-brand-gold text-brand-dark font-semibold tracking-wide uppercase text-sm hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-gold disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-brand-dark border-t-transparent animate-spin" />
                    Unlocking...
                  </span>
                ) : (
                  <>
                    Unlock Gallery <FaArrowRight size={12} />
                  </>
                )}
              </button>
            </form>

            {/* Help link */}
            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <p className="text-xs text-brand-muted font-light">
                Lost your PIN?{' '}
                <a
                  href="https://wa.me/919743174487?text=Hi%20Chandan,%20I%20need%20help%20accessing%20my%20Candy%20Pic%20gallery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-gold hover:underline font-medium"
                >
                  Contact Chandan on WhatsApp
                </a>
              </p>
            </div>
          </div>

          {/* Back Home */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-muted hover:text-white transition-colors"
            >
              <FaArrowLeft size={10} /> Return to Home
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
