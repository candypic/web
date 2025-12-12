import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link  } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import { FaChevronDown } from 'react-icons/fa';
import RotatingText from './Rotatingtext'
const Hero = () => {
  const words = ["Cinematic", "Wedding", "Pre-Wedding", "Haldi", "Candid"];
  const [index, setIndex] = useState(0);

 

  return (
    <div name="home" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      
      {/* 1. Cinematic Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2000&auto=format&fit=crop" 
          alt="Cinematic Wedding" 
          className="w-full h-full object-cover scale-105"
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0  from-brand-dark/80 via-brand-dark/60 to-brand-dark/90"></div>
      </div>
      
      {/* 2. Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Small Tagline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className=" w-12 bg-brand-gold"></div>
          <span className="text-brand-gold uppercase tracking-[0.4em] text-xs md:text-sm font-medium">
            Based in Kumta
          </span>
          <div className=" w-12 bg-brand-gold"></div>
        </motion.div>

        {/* ROTATING TEXT SECTION */}
        <div className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 text-white leading-tight h-[1.2em] md:h-[1.1em] overflow-visible flex flex-col items-center justify-center">
            <RotatingText
              texts={words}
              mainClassName="px-2 sm:px-2 md:px-3 bg-cyan-300 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
        </div>

        {/* Static Sub-headline */}
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

        {/* 3. Modern Call to Action Buttons */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.8 }}
           className="flex flex-col md:flex-row gap-6"
        >
             {/* Primary Button */}
             <RouterLink to="/quotation" smooth duration={800} offset={-80}>
                <button className="group relative px-8 py-4 bg-brand-red text-white rounded-full overflow-hidden shadow-lg hover:shadow-brand-red/50 transition-all duration-300">
                    <span className="absolute inset-0 w-full h-full from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                    <span className="relative font-medium tracking-wider uppercase text-sm">View Packages & Quote</span>
                </button>
             </RouterLink>

             {/* Secondary Button */}
             <Link to="portfolio" smooth duration={800} offset={-80}>
                <button className="px-8 py-4 border border-white/30 text-white rounded-full hover:bg-white/10 hover:border-white transition-all duration-300 tracking-wider uppercase text-sm backdrop-blur-sm">
                    Explore Portfolio
                </button>
             </Link>
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