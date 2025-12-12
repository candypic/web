import React from 'react';
import { motion } from 'framer-motion';
import { FaCamera, FaVideo, FaCalendarAlt } from 'react-icons/fa';

const Pricing = () => {
  return (
    <div name="pricing" className="w-full py-20 px-4  from-brand-dark to-black text-brand-text">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-2">Investment</h2>
          <p className="text-gray-400 uppercase tracking-widest text-sm">Customized Quotation For Your Special Day</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          
          {/* Card 1 */}
          <PricingCard 
             title="Wedding Day" 
             price="40,000rs" 
             delay={0}
             features={[
                 "Regular Photography (1 Album)",
                 "Regular Videography (Pendrive)",
                 "Captured with Heart & Purpose"
             ]}
          />

           {/* Card 2 - Highlighted */}
           <div className="relative transform md:-translate-y-4">
             <div className="absolute top-0 left-0 w-full h-full bg-brand-red/10 blur-xl"></div>
             <PricingCard 
                title="Pre-Wedding" 
                price="35,000rs" 
                subtitle="(2 Section)"
                highlight={true}
                delay={0.2}
                features={[
                    "2-3 Minute Video",
                    "100 Edited Photos (Raw inc)",
                    "Drone Coverage",
                    "Save the Date Video (30 sec)"
                ]}
             />
           </div>

           {/* Card 3 */}
           <PricingCard 
             title="Engagement" 
             price="22,000rs" 
             delay={0.4}
             features={[
                 "2-3 Minute Video",
                 "100 Edited Photos (Raw inc)",
                 "Drone Coverage",
                 "Save the Date Video"
             ]}
          />
        </div>

        {/* Additional & Total */}
        <div className="grid md:grid-cols-2 gap-12 bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
            <div>
                <h3 className="text-2xl font-serif text-brand-gold mb-6 border-b border-gray-700 pb-2">Additional Services</h3>
                <ul className="space-y-4 text-gray-300">
                    <li className="flex justify-between"><span>Haladi (2 hours)</span> <span className="font-bold">15,000rs</span></li>
                    <li className="flex justify-between"><span>Cinematic Highlights</span> <span className="font-bold">15,000rs</span></li>
                    <li className="flex justify-between"><span>Candid Photos</span> <span className="font-bold">15,000rs</span></li>
                </ul>
            </div>
            <div className="flex flex-col justify-center items-center text-center">
                <p className="text-sm uppercase tracking-widest text-gray-400 mb-2">Total Quotation</p>
                <div className="text-5xl font-serif font-bold text-brand-red mb-4">₹1,42,000</div>
                <div className="text-xs text-gray-500 max-w-xs">
                    *Payment Style: Advance, Wedding Day, and Remaining on Delivery.
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

const PricingCard = ({ title, subtitle, price, features, highlight, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay }}
        viewport={{ once: true }}
        className={`p-8 rounded-xl border ${highlight ? 'border-brand-gold bg-brand-light/20' : 'border-gray-700 bg-brand-dark'} flex flex-col items-center text-center hover:bg-brand-light/30 transition-colors duration-300`}
    >
        <h3 className="text-2xl font-serif mb-1">{title}</h3>
        {subtitle && <span className="text-xs text-gray-400 mb-4">{subtitle}</span>}
        <div className="text-3xl font-bold text-brand-red my-4">{price}</div>
        <ul className="text-sm text-gray-300 space-y-3 mt-4 w-full">
            {features.map((item, i) => (
                <li key={i} className="flex items-center justify-center gap-2 border-b border-gray-700/50 pb-2 last:border-0">
                    {item}
                </li>
            ))}
        </ul>
    </motion.div>
)

export default Pricing;