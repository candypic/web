import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { session, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated → go straight to the dashboard.
  if (!authLoading && session) {
    return <Navigate to="/admin/gallery" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        setError(signInError.message || 'Unable to sign in. Please check your details.');
        return;
      }
      navigate('/admin/gallery');
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center bg-brand-dark overflow-hidden px-6 py-16">
      {/* Ambient gold glows */}
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
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl px-7 py-9 md:px-10 md:py-11">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-10 bg-brand-gold/50" />
            <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gold font-medium">
              Studio Admin
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight">
            Welcome{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-soft">
              back
            </span>
          </h1>
          <p className="mt-3 text-brand-muted text-base leading-relaxed font-light">
            Sign in to manage the Candy Pic gallery.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs uppercase tracking-[0.2em] text-brand-muted mb-2"
              >
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/70 text-sm pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@candypic.in"
                  className="w-full rounded-2xl bg-black/20 border border-white/10 pl-11 pr-4 py-3.5 text-white placeholder-brand-muted/50 outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-gold focus:border-brand-gold/40"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs uppercase tracking-[0.2em] text-brand-muted mb-2"
              >
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/70 text-sm pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-black/20 border border-white/10 pl-11 pr-12 py-3.5 text-white placeholder-brand-muted/50 outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-gold focus:border-brand-gold/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-muted hover:text-white transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-brand-gold outline-none"
                >
                  {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-2xl bg-brand-red/15 border border-brand-red/40 px-4 py-3 text-sm text-red-100"
                role="alert"
              >
                <FaExclamationCircle className="mt-0.5 shrink-0 text-brand-red" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full px-8 py-4 bg-brand-gold text-brand-dark font-semibold tracking-wide uppercase text-sm hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark outline-none flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-brand-dark/30 border-t-brand-dark animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Back to site */}
        <div className="mt-7 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-gold transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold rounded-full px-3 py-1 outline-none"
          >
            <FaArrowLeft size={11} />
            Back to site
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
