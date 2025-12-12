import React from 'react';
import { motion } from 'framer-motion';

const photos = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511285560982-1356c11d4606?auto=format&fit=crop&w=800&q=80",
];

const Portfolio = () => {
  return (
    <div name="portfolio" className="w-full py-20 bg-brand-dark relative overflow-hidden">
      
      {/* Background Script Text */}
      <div className="absolute top-10 right-0 opacity-5 pointer-events-none">
         <h1 className="font-script text-[15rem] text-white">Forever</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-serif mb-4"
          >
            Captured Moments
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             transition={{ delay: 0.2, duration: 0.6 }}
             className="text-brand-gold italic text-lg max-w-2xl mx-auto"
          >
            "Together, we laugh, love, and grow — two hearts, one soul, and a lifetime of memories waiting to unfold."
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photos.map((src, index) => (
                <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative overflow-hidden rounded-lg shadow-xl group h-80 md:h-96 ${index === 0 || index === 3 ? 'md:col-span-2' : ''}`}
                >
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 z-10"></div>
                    <img src={src} alt="Portfolio" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;