import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div name="about" className="w-full py-20 px-4 bg-brand-dark">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        
        {/* Image Side */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
            <div className="absolute -top-4 -left-4 w-full h-full border-2 border-brand-red/50 rounded-lg"></div>
            <img 
                src="/chandan.jpg" 
                alt="Chandan Naik" 
                className="rounded-lg shadow-2xl relative z-10 w-full object-cover  grayscale hover:grayscale-0 transition-all duration-500" 
            />
             <div className="absolute -bottom-6 -right-6 bg-brand-light p-6 z-20 shadow-lg hidden md:block">
                <h3 className="font-serif text-2xl tracking-widest text-brand-gold">CHANDAN NAIK</h3>
             </div>
        </motion.div>

        {/* Text Side */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center"
        >
          <p className="text-brand-red font-bold uppercase tracking-widest mb-2">The Creative Eye</p>
          <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">Hi, I'm Chandan</h2>
          
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">
            With Candy Pic, I capture emotions that words can’t describe — love, laughter, and everything in between. 
            I believe wedding photography is more than just taking pictures — it’s about preserving emotions, stories, 
            and the magic that unfolds between moments.
          </p>
          
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Every frame I create is a blend of art, emotion, and storytelling — reflecting the true essence of your love story.
            At <span className="text-brand-gold italic">Weddings by Chandan</span>, your story is in good hands.
          </p>

          <div className="border-l-4 border-brand-red pl-4">
            <p className="font-serif italic text-xl text-brand-text">
                "It’s not just photography — it’s the art of turning moments into memories that last forever."
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;