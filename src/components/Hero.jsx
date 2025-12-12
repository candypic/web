import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import { FaChevronDown } from 'react-icons/fa';
import RotatingText from './Rotatingtext';
import img1 from '../assets/h4.webp'; 
import img2 from '../assets/h5.webp';
import img3 from '../assets/h6.webp';

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
    <div name="home" className="relative h-screen w-full flex items-center justify-center overflow-hidden">

      {/* Background Crossfade */}
      <div className="absolute inset-0 z-0">
        {bgImages.map((src, index) => (
          <motion.img
            key={index}
            src={src}
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover object-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: index === bgIndex ? 1 : 0 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        ))}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
        {/* Tagline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-12 bg-brand-gold" />
          <span className="text-brand-gold uppercase tracking-[0.4em] text-xs md:text-sm font-medium">
            Based in Kumta
          </span>
          <div className="w-12 bg-brand-gold" />
        </motion.div>

        {/* Rotating Text with Glass Morphic Backdrop */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-lg rounded-xl blur-sm -z-10" />
          <RotatingText
            texts={words}
            mainClassName="px-4 py-2 text-black font-bold text-5xl md:text-7xl lg:text-8xl font-serif rounded-xl backdrop-blur-lg bg-white/10"
            staggerFrom="last"
            rotationInterval={5000} // slower rotation
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          />
        </div>

        {/* Sub-headline */}
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="font-serif text-3xl md:text-5xl lg:text-6xl mb-8 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-white to-gray-400"
        >
          Photography & Videography
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-gray-300 text-lg md:text-xl max-w-2xl mb-12 font-light leading-relaxed"
        >
          Capturing the unscripted magic of your love story. From the Haldi glow to the final Vidaai, we freeze emotions in time.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row gap-6"
        >
          <RouterLink to="/quotation">
            <button className="group relative px-8 py-4 bg-brand-red text-white rounded-full overflow-hidden shadow-lg hover:shadow-brand-red/50 transition-all duration-300">
              <span className="absolute inset-0 w-full h-full from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              <span className="relative font-medium tracking-wider uppercase text-sm">View Packages & Quote</span>
            </button>
          </RouterLink>

          <ScrollLink to="portfolio" smooth duration={800} offset={-80}>
            <button className="px-8 py-4 border border-white/30 text-white rounded-full hover:bg-white/10 hover:border-white transition-all duration-300 tracking-wider uppercase text-sm backdrop-blur-sm">
              Explore Portfolio
            </button>
          </ScrollLink>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50"
      >
        <FaChevronDown size={24} />
      </motion.div>

    </div>
  );
};

export default Hero;
