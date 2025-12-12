// src/components/Pricing.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaStar } from 'react-icons/fa';

const Pricing = () => {
  return (
    <div name="pricing" className="w-full py-24 px-4 bg-brand-dark relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-light/20 rounded-full blur-[128px]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/10 rounded-full blur-[128px]"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-serif mb-4 text-white"
          >
            Curated Packages
          </motion.h2>
          <p className="text-brand-gold uppercase tracking-widest text-sm font-medium">Transparent Pricing for Your Big Day</p>
        </div>

        {/* Modern Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          
          {/* Standard Card */}
          <PricingCard 
             title="Engagement" 
             price="22,000" 
             delay={0}
             features={[
                 "2-3 Minute Cinematic Video",
                 "100 Edited Photos (Raw Included)",
                 "4K Drone Coverage",
                 "Save the Date Teaser"
             ]}
          />

           {/* Premium Card (Pre-Wedding) */}
           <div className="relative transform lg:-translate-y-6">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-red text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-lg z-20">
               Most Popular
             </div>
             <PricingCard 
                title="Pre-Wedding" 
                price="35,000" 
                subtitle="2 Sessions / Locations"
                highlight={true}
                delay={0.2}
                features={[
                    "2-3 Minute Cinematic Story",
                    "100+ High-End Edited Photos",
                    "Advanced Drone Shots",
                    "Creative Save the Date Reel"
                ]}
             />
           </div>

           {/* Standard Card */}
           <PricingCard 
             title="Wedding Day" 
             price="40,000" 
             delay={0.4}
             features={[
                 "Full Day Candid Photography",
                 "Traditional Videography (HD)",
                 "Premium Album Included",
                 "Raw Footage on Pendrive"
             ]}
          />
        </div>

        {/* Digital Receipt / Breakdown Section */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl"
        >
            <div className="flex flex-col md:flex-row justify-between gap-12">
                
                {/* Left: Add-ons */}
                <div className="flex-1">
                    <h3 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-8 bg-brand-gold rounded-full"></span>
                        Premium Add-ons
                    </h3>
                    <div className="space-y-4">
                        <AddOnItem name="Haladi Ceremony (2 hrs)" price="15,000" />
                        <AddOnItem name="Cinematic Highlights" price="15,000" />
                        <AddOnItem name="Pure Candid Photography" price="15,000" />
                    </div>
                </div>

                {/* Right: Total & Terms */}
                <div className="flex-1 bg-brand-dark/50 rounded-2xl p-8 border border-white/5 flex flex-col justify-center items-center text-center">
                    <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Estimated Total Bundle</p>
                    <div className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-200 mb-6">
                        ₹1,42,000
                    </div>
                    
                    <div className="w-full h-[1px] bg-white/10 mb-6"></div>
                    
                    <div className="text-left w-full space-y-3">
                        <p className="text-white text-sm font-bold mb-2">Payment Schedule:</p>
                        <PaymentStep step="1" text="₹15,000 Advance to Book" />
                        <PaymentStep step="2" text="₹1.05L on Wedding Day" />
                        <PaymentStep step="3" text="Balance on Delivery" />
                    </div>
                </div>
            </div>
        </motion.div>

      </div>
    </div>
  );
};

// Sub-components for cleaner code
const PricingCard = ({ title, subtitle, price, features, highlight, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay }}
        viewport={{ once: true }}
        className={`relative p-8 rounded-3xl border flex flex-col h-full 
            ${highlight 
                ? 'bg-gradient-to-b from-brand-light/30 to-brand-dark border-brand-gold/30 shadow-brand-gold/10 shadow-2xl' 
                : 'bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20'
            } transition-all duration-300 group hover:-translate-y-2`}
    >
        <h3 className="text-3xl font-serif text-white mb-1">{title}</h3>
        <span className="text-xs text-brand-gold uppercase tracking-wider mb-6 block h-6">{subtitle}</span>
        
        <div className="flex items-baseline gap-1 mb-8">
            <span className="text-xl text-gray-400">₹</span>
            <span className={`text-5xl font-bold ${highlight ? 'text-white' : 'text-gray-200'}`}>{price}</span>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
            {features.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                    <FaCheckCircle className={`mt-1 ${highlight ? 'text-brand-gold' : 'text-brand-light'}`} />
                    <span>{item}</span>
                </li>
            ))}
        </ul>

        <button className={`w-full py-3 rounded-xl font-medium transition-all duration-300 
            ${highlight 
                ? 'bg-brand-gold text-brand-dark hover:bg-white' 
                : 'bg-white/10 text-white hover:bg-white hover:text-brand-dark'
            }`}>
            Choose Plan
        </button>
    </motion.div>
);

const AddOnItem = ({ name, price }) => (
    <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
        <span className="text-gray-200 group-hover:text-white transition-colors">{name}</span>
        <span className="font-bold text-brand-gold">₹{price}</span>
    </div>
);

const PaymentStep = ({ step, text }) => (
    <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center text-white font-bold">{step}</span>
        {text}
    </div>
);

export default Pricing;