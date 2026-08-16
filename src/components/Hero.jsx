import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import { FaChevronDown } from 'react-icons/fa';
import RotatingText from './Rotatingtext';
import img1 from '../assets/h4.jpg';
import img2 from '../assets/h5.jpg';
import img3 from '../assets/h6.jpg';

const Hero = () => {
  const words = ["Cinematic", "Wedding", "Pre-Wedding", "Haldi", "Candid"];
  const bgImages = [img1, img2, img3];
  const [bgIndex, setBgIndex] = useState(0);

  // Preload images for smooth fade
  useEffect(() => {
    bgImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Cycle background
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % bgImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      name="home"
      className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-brand-darker"
    >
      {/* ── Background Crossfade ───────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {bgImages.map((src, index) => (
          <motion.img
            key={index}
            src={src}
            alt="Candy Pic wedding photography in Kumta, Karnataka"
            className="absolute inset-0 w-full h-full object-cover object-center"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{
              opacity: index === bgIndex ? 1 : 0,
              scale: index === bgIndex ? 1 : 1.08,
            }}
            transition={{
              opacity: { duration: 2, ease: 'easeInOut' },
              scale: { duration: 9, ease: 'linear' },
            }}
          />
        ))}

        {/* Cinematic gradient overlay — darker for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-darker/85 via-brand-dark/55 to-brand-darker/95" />
        {/* Side-to-center vignette to focus the eye */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(6,26,31,0.75)_100%)]" />
        {/* Subtle film grain */}
        <div className="absolute inset-0 bg-grain opacity-60 pointer-events-none" />
        {/* Warm gold glow, top-left */}
        <div className="absolute -top-32 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />
        {/* Cool deep glow, bottom-right */}
        <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] bg-brand-deep/40 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-4 sm:px-6 md:px-10 max-w-6xl mx-auto flex flex-col items-center w-full">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex items-center gap-4 mb-8"
        >
          <span className="h-px w-10 bg-brand-gold/50" />
          <span className="text-xs md:text-sm uppercase tracking-[0.4em] text-brand-gold font-medium">
            Based in Kumta
          </span>
          <span className="h-px w-10 bg-brand-gold/50" />
        </motion.div>

        {/* Headline lockup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="flex flex-col items-center gap-2 mb-6"
        >
          {/* Rotating word — single clean line with height locking */}
          <div className="h-12 sm:h-16 md:h-24 lg:h-28 flex items-center justify-center">
            <RotatingText
              texts={words}
              rotationInterval={3500}
              mainClassName="font-serif font-semibold text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-brand-gold-soft to-brand-gold text-shadow-soft"
            />
          </div>

          {/* Static line completing the lockup */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white leading-tight text-shadow-soft">
            Stories, Beautifully Told
          </h1>
        </motion.div>

        {/* Sub-headline */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="font-serif text-lg sm:text-xl md:text-3xl lg:text-4xl text-brand-light/90 mb-4 md:mb-6 tracking-wide"
        >
          Photography <span className="text-brand-gold">&amp;</span> Videography
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-brand-muted text-sm sm:text-base md:text-lg max-w-2xl mb-8 md:mb-10 font-light leading-relaxed px-2 sm:px-0"
        >
          Capturing the unscripted magic of your love story — from the Haldi glow
          to the final Vidaai, we freeze emotions in time.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-stretch sm:flex-row sm:items-center sm:flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-sm sm:max-w-none mb-12 sm:mb-0"
        >
          {/* Primary */}
          <RouterLink to="/quotation" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto rounded-full px-8 py-4 bg-brand-gold text-brand-dark font-semibold tracking-wide uppercase text-sm hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none cursor-pointer">
              View Packages &amp; Quote
            </button>
          </RouterLink>

          {/* Secondary — Explore Portfolio (scroll) */}
          <ScrollLink to="portfolio" smooth duration={800} offset={-80} className="w-full sm:w-auto">
            <button className="w-full sm:w-auto rounded-full px-8 py-4 border border-white/25 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm transition-all uppercase tracking-wide text-sm focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none cursor-pointer">
              Explore Portfolio
            </button>
          </ScrollLink>

          {/* View Gallery (route) */}
          <RouterLink to="/gallery" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto rounded-full px-8 py-4 border border-white/25 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm transition-all uppercase tracking-wide text-sm focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none cursor-pointer">
              View Gallery
            </button>
          </RouterLink>
        </motion.div>
      </div>

      {/* ── Scroll-Down Indicator ── */}
      <ScrollLink
        to="portfolio"
        smooth
        duration={800}
        offset={-80}
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-10 cursor-pointer group flex-col items-center gap-1.5"
        aria-label="Scroll to portfolio"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-brand-muted group-hover:text-brand-gold transition-colors">
          Scroll
        </span>
        <span className="flex items-center justify-center h-9 w-5 rounded-full border border-white/25 group-hover:border-brand-gold transition-colors">
          <motion.span
            animate={{ y: [0, 5, 0], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-brand-gold text-[10px]"
          >
            <FaChevronDown />
          </motion.span>
        </span>
      </ScrollLink>
    </div>
  );
};

export default Hero;
