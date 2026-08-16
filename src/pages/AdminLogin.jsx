import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaExclamationCircle,
  FaUserPlus,
  FaCamera,
  FaBell,
  FaCheckCircle,
  FaPhone,
  FaMapMarkerAlt,
  FaShieldAlt,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { registerCrewMember } from '../lib/galleryApi';
import { requestForToken } from '../lib/firebase';
import { showCrewNotification } from '../lib/notifications';

export default function AdminLogin() {
  const { session, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'crew_register'
  const [mode, setMode] = useState('login');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Crew Registration State
  const [crewForm, setCrewForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Candid Photographer',
    city: 'Kumta',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [enablingNotifs, setEnablingNotifs] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Already authenticated → go straight to the dashboard.
  if (!authLoading && session) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // --- 1. HANDLE ADMIN SIGN IN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { error: signInError } = await signIn(trimmedEmail, password);
      if (signInError) {
        setError(signInError.message || 'Unable to sign in. Please check your details.');
        return;
      }

      if (
        trimmedEmail === 'chandan@candypic.com' ||
        trimmedEmail === 'admin@candypic.in' ||
        trimmedEmail === 'prajnaprabhu9@gmail.com'
      ) {
        navigate('/admin/dashboard');
      } else {
        navigate('/crew/calendar');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 2. HANDLE ENABLE NOTIFICATIONS (MANDATORY FOR CREW) ---
  const handleEnablePush = async () => {
    setEnablingNotifs(true);
    setError('');
    try {
      if (!('Notification' in window)) {
        alert('This browser does not support push notifications.');
        setNotificationsEnabled(true);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Push notification permission was not granted. Please click "Allow" in your browser prompt.');
        return;
      }

      // Generate FCM / Web Push Token
      const token = await requestForToken().catch(() => null);
      setPushToken(token || 'web_push_granted');
      setNotificationsEnabled(true);

      // Trigger immediate instant confirmation notification
      try {
        await showCrewNotification('🎉 Notifications Enabled!', {
          body: 'Candy Pic shoot assignments and schedule updates will appear on this device.',
        });
      } catch (notifErr) {
        console.warn('Native notification banner warning:', notifErr);
      }
    } catch (err) {
      console.warn('Push error:', err);
      setNotificationsEnabled(true); // Fallback so user can complete registration
    } finally {
      setEnablingNotifs(false);
    }
  };

  // --- 3. HANDLE CREW REGISTRATION ---
  const handleCrewRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!crewForm.name.trim() || !crewForm.email.trim() || !crewForm.phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!notificationsEnabled) {
      setError('⚠️ You must enable device notifications below to receive shoot assignments.');
      return;
    }

    setSubmitting(true);
    try {
      await registerCrewMember({
        ...crewForm,
        pushToken: pushToken,
      });

      // Remember registered crew identity on this device even before login
      try {
        localStorage.setItem('candy_crew_name', crewForm.name.trim());
        localStorage.setItem('candy_crew_email', crewForm.email.trim());
      } catch (e) {}

      setRegisterSuccess(true);

      // Trigger instant application submission push
      try {
        await showCrewNotification('👥 Application Submitted!', {
          body: 'Your profile has been sent to Super Admin (chandan@candypic.com) for approval.',
        });
      } catch (e) {}
    } catch (err) {
      setError(err?.message || 'Could not submit crew registration. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center bg-brand-dark overflow-hidden px-4 py-12">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] bg-brand-red/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Decorative background script */}
      <span
        aria-hidden="true"
        className="absolute inset-0 hidden sm:flex items-center justify-center font-script text-brand-gold/5 text-[16rem] lg:text-[22rem] leading-none select-none pointer-events-none"
      >
        Candy
      </span>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl px-6 py-8 sm:px-9 sm:py-10">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-black/40 border border-white/10 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === 'login'
                  ? 'bg-brand-gold text-brand-dark shadow-md'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              Studio Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('crew_register');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === 'crew_register'
                  ? 'bg-brand-gold text-brand-dark shadow-md'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              Join Crew (Register)
            </button>
          </div>

          {/* =========================================================================
              VIEW A: STUDIO LOGIN
              ========================================================================= */}
          {mode === 'login' && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="h-px w-8 bg-brand-gold/50" />
                <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-medium">
                  Studio Admin
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-white leading-tight">
                Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-soft">Back</span>
              </h1>
              <p className="mt-2 text-brand-muted text-xs sm:text-sm font-light">
                Sign in to manage vaults, calendar holds, and crew assignments.
              </p>

              <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
                {/* Email */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1.5 font-semibold">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/70 text-sm pointer-events-none" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@candypic.in"
                      className="w-full rounded-2xl bg-black/20 border border-white/10 pl-11 pr-4 py-3 text-sm text-white placeholder-brand-muted/50 outline-none transition-all focus:border-brand-gold/50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1.5 font-semibold">
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/70 text-sm pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl bg-black/20 border border-white/10 pl-11 pr-12 py-3 text-sm text-white placeholder-brand-muted/50 outline-none transition-all focus:border-brand-gold/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-muted hover:text-white transition-colors"
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 rounded-2xl bg-brand-red/15 border border-brand-red/40 px-3.5 py-2.5 text-xs text-red-100">
                    <FaExclamationCircle className="mt-0.5 shrink-0 text-brand-red" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full py-3.5 bg-brand-gold text-brand-dark font-bold tracking-wide uppercase text-xs hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Signing in…' : 'Sign In to Hub'}
                </button>
              </form>
            </div>
          )}

          {/* =========================================================================
              VIEW B: CREW MEMBER REGISTRATION
              ========================================================================= */}
          {mode === 'crew_register' && (
            <div>
              {registerSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                    <FaCheckCircle />
                  </div>
                  <h2 className="font-serif text-2xl text-white">Application Submitted!</h2>
                  <p className="text-xs text-brand-muted font-light leading-relaxed">
                    Thank you, <strong className="text-white">{crewForm.name}</strong>. Your profile has been sent to Super Admin (<strong>chandan@candypic.com</strong>).
                  </p>
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-brand-gold font-light">
                    🔔 Once approved, you will appear in the crew roster and receive shoot assignments with client &amp; venue details.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterSuccess(false);
                      setMode('login');
                    }}
                    className="rounded-full px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="h-px w-8 bg-brand-gold/50" />
                    <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-medium">
                      Join Our Crew
                    </span>
                  </div>

                  <h1 className="font-serif text-2xl sm:text-3xl text-white leading-tight">
                    Crew Registration
                  </h1>
                  <p className="mt-1.5 text-brand-muted text-xs font-light">
                    Register as a photographer or crew member to receive shoot bookings.
                  </p>

                  <form onSubmit={handleCrewRegister} className="mt-5 space-y-3.5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Naik"
                        value={crewForm.name}
                        onChange={(e) => setCrewForm({ ...crewForm, name: e.target.value })}
                        className="w-full rounded-xl bg-black/25 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                      />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="vikram@gmail.com"
                          value={crewForm.email}
                          onChange={(e) => setCrewForm({ ...crewForm, email: e.target.value })}
                          className="w-full rounded-xl bg-black/25 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-brand-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                          WhatsApp Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={crewForm.phone}
                          onChange={(e) => setCrewForm({ ...crewForm, phone: e.target.value })}
                          className="w-full rounded-xl bg-black/25 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    {/* Role & City */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                          Role / Specialization
                        </label>
                        <select
                          value={crewForm.role}
                          onChange={(e) => setCrewForm({ ...crewForm, role: e.target.value })}
                          className="w-full rounded-xl bg-brand-deep border border-white/15 px-2.5 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                        >
                          <option value="Candid Photographer">Candid Photographer</option>
                          <option value="Traditional Photographer">Traditional Photographer</option>
                          <option value="Drone Pilot / Aerial Cinema">Drone Pilot / Aerial Cinema</option>
                          <option value="Cinematographer">Cinematographer</option>
                          <option value="Editor / Retoucher">Editor / Retoucher</option>
                          <option value="Assistant / Lighting">Assistant / Lighting</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                          Base City / Location
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Kumta / Gokarna"
                          value={crewForm.city}
                          onChange={(e) => setCrewForm({ ...crewForm, city: e.target.value })}
                          className="w-full rounded-xl bg-black/25 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    {/* MANDATORY NOTIFICATION PERMISSION STEP */}
                    <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <FaBell className="text-brand-gold" /> Push Notifications
                        </span>
                        {notificationsEnabled ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FaCheckCircle /> Enabled
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-brand-red uppercase">
                            Required *
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-brand-muted font-light leading-relaxed">
                        You must enable notifications so Chandan can assign you shoots and send instant lock-screen alerts.
                      </p>

                      {!notificationsEnabled && (
                        <button
                          type="button"
                          onClick={handleEnablePush}
                          disabled={enablingNotifs}
                          className="w-full rounded-xl py-2 bg-brand-gold/20 hover:bg-brand-gold hover:text-brand-dark text-brand-gold text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FaBell size={11} />
                          {enablingNotifs ? 'Requesting Permission…' : 'Tap to Enable Notifications'}
                        </button>
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="flex items-start gap-2.5 rounded-xl bg-brand-red/15 border border-brand-red/40 p-2.5 text-xs text-red-100">
                        <FaExclamationCircle className="mt-0.5 shrink-0 text-brand-red" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Submit Registration */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-full py-3.5 bg-brand-gold text-brand-dark font-bold tracking-wide uppercase text-xs hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {submitting ? 'Submitting Application…' : 'Submit Crew Application'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back to site */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-brand-muted hover:text-brand-gold transition-colors rounded-full px-3 py-1 outline-none uppercase tracking-widest"
          >
            <FaArrowLeft size={10} />
            Return to Homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
