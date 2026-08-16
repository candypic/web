import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import logo from '/logo-nonsquare.png';

// Hero background images — imported via Vite so hashed URLs work in production
import heroImg1 from '../assets/h4.jpg';
import heroImg2 from '../assets/h5.jpg';
import heroImg3 from '../assets/h6.jpg';

/* ─── All images the main page needs ─── */
const MAIN_PAGE_IMAGES = [
  // Hero slides (Vite-hashed paths)
  heroImg1,
  heroImg2,
  heroImg3,
  // Portfolio grid (public folder — no hash)
  '/p1.jpg',
  '/p2.jpg',
  '/p3.jpg',
  '/p4.jpg',
  '/p5.jpg',
  '/p6.jpg',
  '/p7.jpg',
  // About portrait
  '/chandan.jpg',
];


/* ─── Preload a single image, resolve with success/fail ─── */
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ src, ok: true });
    img.onerror = () => resolve({ src, ok: false }); // never reject — keep going
    img.src = src;
  });
}

/* ─── Cinematic Camera SVG (custom, detailed DSLR silhouette) ─── */
const CameraSVG = ({ className }) => (
  <svg
    viewBox="0 0 120 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Body */}
    <rect x="8" y="22" width="104" height="52" rx="7" fill="currentColor" opacity="0.95" />
    {/* Viewfinder hump */}
    <rect x="38" y="10" width="30" height="14" rx="4" fill="currentColor" />
    {/* Shutter button */}
    <circle cx="74" cy="10" r="5" fill="currentColor" opacity="0.7" />
    {/* Lens ring outer */}
    <circle cx="60" cy="48" r="22" fill="#0b262d" stroke="currentColor" strokeWidth="3" />
    {/* Lens ring inner */}
    <circle cx="60" cy="48" r="16" fill="#061a1f" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    {/* Lens glass */}
    <circle cx="60" cy="48" r="10" fill="#061a1f" />
    {/* Lens glass highlight */}
    <circle cx="56" cy="44" r="3" fill="white" opacity="0.12" />
    <circle cx="55" cy="43" r="1.2" fill="white" opacity="0.25" />
    {/* Mode dial */}
    <rect x="14" y="27" width="14" height="8" rx="2" fill="currentColor" opacity="0.5" />
    {/* Flash indicator light */}
    <rect x="30" y="14" width="6" height="4" rx="1" fill="#d4af37" opacity="0.8" />
    {/* Grip lines */}
    <rect x="10" y="30" width="3" height="30" rx="1.5" fill="white" opacity="0.06" />
    <rect x="14" y="30" width="1.5" height="30" rx="0.75" fill="white" opacity="0.04" />
  </svg>
);

/* ─── Main Preloader ─── */
const Preloader = ({ onComplete }) => {
  const [loadProgress, setLoadProgress] = useState(0);       // 0–100
  const [imagesReady, setImagesReady] = useState(false);
  const [phase, setPhase] = useState('loading');              // 'loading' | 'drop' | 'flash' | 'whiteout'
  const cameraControls = useAnimation();
  const hasTriggered = useRef(false);

  /* ── 1. Preload images in background ── */
  useEffect(() => {
    let loaded = 0;
    const total = MAIN_PAGE_IMAGES.length;

    Promise.all(
      MAIN_PAGE_IMAGES.map((src) =>
        loadImage(src).then((result) => {
          loaded += 1;
          setLoadProgress(Math.round((loaded / total) * 100));
          return result;
        })
      )
    ).then(() => {
      setImagesReady(true);
    });
  }, []);

  /* ── 2. Once images are ready, run the camera sequence ── */
  useEffect(() => {
    if (!imagesReady || hasTriggered.current) return;
    hasTriggered.current = true;

    const runSequence = async () => {
      // Brief pause so the 100% bar is visible
      await new Promise((r) => setTimeout(r, 200));

      setPhase('drop');

      // Camera drops with spring physics
      await cameraControls.start({
        y: 0,
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 160,
          damping: 14,
          mass: 1.1,
        },
      });

      // Pause at rest — shutter-click feel
      await new Promise((r) => setTimeout(r, 220));

      setPhase('flash');

      // Hold flash briefly then whiteout
      await new Promise((r) => setTimeout(r, 380));
      setPhase('whiteout');
    };

    runSequence();
  }, [imagesReady, cameraControls]);

  /* ── 3. When whiteout completes, call onComplete ── */
  const handleWhiteoutComplete = () => {
    setTimeout(onComplete, 60);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-darker overflow-hidden">

      {/* ── Ambient radial glow ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={phase === 'flash' ? { opacity: [0, 1, 0.6] } : { opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-brand-gold/8 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-red/5 rounded-full blur-[120px]" />
      </motion.div>

      {/* ── Decorative grid lines (editorial) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-brand-gold" />
        <div className="absolute right-1/4 top-0 bottom-0 w-px bg-brand-gold" />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-brand-gold" />
        <div className="absolute bottom-1/3 left-0 right-0 h-px bg-brand-gold" />
      </div>

      {/* ── Centre stack ── */}
      <div className="relative flex flex-col items-center gap-8 z-10">

        {/* LOGO */}
        <motion.img
          src={logo}
          alt="Candy Pic"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-14 sm:h-20 w-auto object-contain drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        />

        {/* CAMERA WRAPPER — drops from above */}
        <div className="relative flex items-center justify-center">

          {/* ── Flash rays (radiate outward on flash phase) ── */}
          <AnimatePresence>
            {phase === 'flash' && (
              <>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <motion.div
                    key={angle}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 1.8] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.018, ease: 'easeOut' }}
                    style={{ transform: `rotate(${angle}deg)` }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center"
                  >
                    <div
                      className="w-[2px] bg-gradient-to-r from-white to-transparent"
                      style={{ height: '60px', marginTop: '-60px' }}
                    />
                  </motion.div>
                ))}

                {/* Central burst orb */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 2.5, 3.8], opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full blur-[8px] shadow-[0_0_40px_20px_rgba(255,255,255,0.9)]"
                />

                {/* Outer corona ring */}
                <motion.div
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [0.2, 2.2, 3.5], opacity: [0, 0.6, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.04 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/60 blur-[2px]"
                />
              </>
            )}
          </AnimatePresence>

          {/* ── The Camera ── */}
          <motion.div
            animate={cameraControls}
            initial={{ y: -280, opacity: 0, rotate: -18, scale: 0.85 }}
            className="relative text-brand-gold"
          >
            <CameraSVG className="w-36 sm:w-48 md:w-56 drop-shadow-[0_0_28px_rgba(212,175,55,0.3)]" />

            {/* Shutter-button flash pop (tiny burst on top of the camera before global flash) */}
            <AnimatePresence>
              {phase === 'flash' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.6, 0], opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute -top-4 right-6 w-5 h-5 bg-white rounded-full blur-[5px] shadow-[0_0_20px_10px_rgba(255,255,255,0.8)]"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Progress area ── */}
        <div className="flex flex-col items-center gap-3 w-56 sm:w-72">
          {/* Eyebrow label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: imagesReady ? 0 : 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2"
          >
            <span className="h-px w-6 bg-brand-gold/40" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-brand-muted font-medium">
              {loadProgress < 100 ? 'Loading' : 'Ready'}
            </span>
            <span className="h-px w-6 bg-brand-gold/40" />
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: imagesReady ? 0 : 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative w-full"
          >
            {/* Track */}
            <div className="h-[3px] w-full rounded-full bg-white/8 overflow-hidden">
              {/* Fill */}
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-gold/70 via-brand-gold to-brand-gold-soft"
                style={{ width: `${loadProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>

            {/* Travelling shimmer on the fill */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
              style={{ width: `${loadProgress}%` }}
            >
              <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.7)_50%,transparent_70%)] bg-[length:200%_100%]" />
            </div>
          </motion.div>

          {/* Percentage counter */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: imagesReady ? 0 : 0.5 }}
            transition={{ duration: 0.4 }}
            className="text-[11px] font-mono text-brand-muted tabular-nums"
          >
            {loadProgress}%
          </motion.span>
        </div>
      </div>

      {/* ── Full-screen whiteout flash ── */}
      <AnimatePresence>
        {phase === 'whiteout' && (
          <motion.div
            key="whiteout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            onAnimationComplete={handleWhiteoutComplete}
            className="absolute inset-0 bg-white z-[102]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Preloader;
