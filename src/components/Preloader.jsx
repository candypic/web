import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCamera } from 'react-icons/fa';
import logo from '/logo-nonsquare.png'; // Ensure this path matches your project structure

const Preloader = ({ onComplete }) => {
  const [screenFlash, setScreenFlash] = useState(false);

  useEffect(() => {
    // Sequence:
    // 0s: Logo Fades In
    // 0.8s: Camera Drops
    // 1.4s: Camera Flash Burst (Visual)
    // 1.5s: Full Screen Whiteout
    const timer = setTimeout(() => {
      setScreenFlash(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden">
      
      {/* Centered Content */}
      <div className="relative flex items-center gap-4">
        
        {/* 1. LOGO IMAGE */}
        <motion.img
          src={logo}
          alt="Loading Logo"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-16 md:h-24 w-auto object-contain"
        />

        {/* 2. CAMERA CONTAINER */}
        <div className="relative">
            {/* The Camera Icon */}
            <motion.div
                initial={{ y: -100, opacity: 0, rotate: -15 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ 
                    type: "spring", 
                    stiffness: 120, 
                    damping: 10, 
                    delay: 0.8 
                }}
                className="text-4xl md:text-5xl text-brand-gold"
            >
                <FaCamera />
            </motion.div>

            {/* 3. THE FLASH BURST (Visual Pop above camera) */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 2, 0], opacity: [0, 1, 0] }}
                transition={{ 
                    duration: 0.2, 
                    delay: 1.4, // Happens right before screen whiteout
                    ease: "easeInOut" 
                }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full blur-md shadow-[0_0_20px_10px_rgba(255,255,255,0.8)]"
            />
        </div>
      </div>

      {/* 4. FULL SCREEN WHITEOUT OVERLAY */}
      <AnimatePresence onExitComplete={onComplete}>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, ease: "linear" }} // Instant flash
            onAnimationComplete={() => {
                // Keep white screen briefly then unmount
                setTimeout(onComplete, 200); 
            }}
            className="absolute inset-0 bg-white z-[101]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Preloader;