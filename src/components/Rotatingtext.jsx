import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RotatingText = ({
  texts = ['Wedding', 'Pre-Wedding', 'Cinematic', 'Haldi', 'Candid'],
  rotationInterval = 3200,
  className = '',
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, rotationInterval);
    return () => clearInterval(timer);
  }, [texts.length, rotationInterval]);

  return (
    <div className="relative inline-flex items-center justify-center h-14 sm:h-20 md:h-24 lg:h-28 overflow-hidden px-4">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={texts[index]}
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -35 }}
          transition={{
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`font-serif font-semibold text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-brand-gold whitespace-nowrap select-none drop-shadow-[0_2px_15px_rgba(212,175,55,0.35)] ${className}`}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default RotatingText;
