import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-scroll';

const Hero = () => {
  return (
    <div name="home" className="relative h-screen w-full bg-brand-dark overflow-hidden flex items-center justify-center">
      {/* Background Texture/Gradient */}
      <div className="absolute inset-0  from-transparent to-brand-dark z-10"></div>
      
      {/* Main Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-brand-gold uppercase tracking-[0.3em] mb-4 text-sm md:text-base"
        >
          We Capture Your Memories
        </motion.p>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight"
        >
          Wedding <br/> <span className="italic text-brand-light/50">Quotation</span>
        </motion.h1>

        {/* The Oval Image Effect */}
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-64 h-80 md:w-80  rounded-[50%] overflow-hidden border-4 border-brand-light/30 shadow-2xl mb-8 relative group"
        >
            <img 
                src="https://images.unsplash.com/photo-1621621667797-e06afc217fb0?q=80&w=1000&auto=format&fit=crop" 
                alt="Wedding Couple" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1 }}
        >
             <Link to="pricing" smooth duration={500}>
                <button className="border border-brand-text px-8 py-3 rounded-full hover:bg-brand-red hover:border-brand-red transition-all duration-300 tracking-wider uppercase text-sm">
                    View Packages
                </button>
             </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;