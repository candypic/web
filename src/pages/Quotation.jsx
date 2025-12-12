import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidingNumber } from '../components/SlidingNumber';
import { FaCheck, FaArrowLeft, FaCamera, FaFilm } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Quotation = () => {
  // All items checked by default
  const [items, setItems] = useState([
    { id: 1, name: 'Wedding Day Photography', price: 25000, category: 'Main', checked: true, icon: <FaCamera /> },
    { id: 2, name: 'Wedding Day Videography', price: 15000, category: 'Main', checked: true, icon: <FaFilm /> },
    { id: 3, name: 'Pre-Wedding Shoot', price: 35000, category: 'Main', checked: true, icon: <FaCamera /> },
    { id: 4, name: 'Engagement Coverage', price: 22000, category: 'Main', checked: true, icon: <FaFilm /> },
    { id: 5, name: 'Haladi Ceremony (2 Hrs)', price: 15000, category: 'Add-on', checked: true },
    { id: 6, name: 'Cinematic Highlights', price: 15000, category: 'Add-on', checked: true },
    { id: 7, name: 'Traditional Candid Photos', price: 15000, category: 'Add-on', checked: true },
  ]);

  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(items.reduce((acc, item) => item.checked ? acc + item.price : acc, 0));
  }, [items]);

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const mainServices = items.filter(i => i.category === 'Main');
  const addOns = items.filter(i => i.category === 'Add-on');

  // Animation variants for staggering list items
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-brand-dark pt-28 pb-12 px-4 md:px-12 text-white relative overflow-hidden">

      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-brand-light/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-brand-red/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-12 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <Link to="/" className="inline-flex items-center gap-2 text-brand-gold/80 hover:text-brand-gold transition-all mb-4 text-sm uppercase tracking-widest">
            <FaArrowLeft /> Return Home
            </Link>
            <h1 className="text-4xl md:text-6xl font-serif font-medium leading-tight">
            Customize <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Your Package</span>
            </h1>
        </div>
        <p className="text-gray-400 max-w-sm text-sm md:text-right">
            Select the services you need. All premium options are included by default for the complete experience.
        </p>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8 md:gap-12 relative z-10">

        {/* LEFT COLUMN: SERVICE LIST */}
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="lg:col-span-2 space-y-10"
        >

          {/* Section 1: Main Events */}
          <div>
            <h2 className="text-lg text-brand-gold font-medium mb-5 flex items-center gap-3">
                <span className="h-[1px] w-8 bg-brand-gold/50"></span>
                Essential Coverage
            </h2>
            <div className="space-y-4">
              {mainServices.map(item => (
                <ServiceCard key={item.id} item={item} toggle={toggleItem} variants={itemVariants} />
              ))}
            </div>
          </div>

          {/* Section 2: Add-ons */}
          <div>
            <h2 className="text-lg text-brand-gold font-medium mb-5 flex items-center gap-3">
                <span className="h-[1px] w-8 bg-brand-gold/50"></span>
                Premium Add-ons
            </h2>
            <div className="space-y-4">
              {addOns.map(item => (
                <ServiceCard key={item.id} item={item} toggle={toggleItem} variants={itemVariants} />
              ))}
            </div>
          </div>

        </motion.div>

        {/* RIGHT COLUMN: STICKY TOTAL */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                
                {/* Decorative sheen effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                <h3 className="text-gray-400 uppercase text-xs tracking-[0.2em] mb-4">Final Quotation</h3>
                
                <div className="flex items-start text-white font-serif gap-1 mb-8">
                    <span className="text-2xl mt-2 text-brand-gold">₹</span>
                    <div className="text-6xl font-medium tracking-tight">
                         <SlidingNumber number={total} />
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm py-3 border-b border-white/5">
                        <span className="text-gray-400">Package Status</span>
                        <span className="text-brand-gold font-medium">Customized</span>
                    </div>
                    <div className="flex justify-between text-sm py-3 border-b border-white/5">
                        <span className="text-gray-400">Services Included</span>
                        <span className="text-white font-medium">{items.filter(i => i.checked).length} Items</span>
                    </div>
                    <div className="flex justify-between text-sm py-3 border-b border-white/5">
                        <span className="text-gray-400">Validity</span>
                        <span className="text-white font-medium">14 Days</span>
                    </div>
                </div>

                <button className="w-full py-4 bg-gradient-to-r from-brand-red to-[#c02b37] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-red/40 transition-all transform hover:-translate-y-1">
                    Book This Package
                </button>
                
                <p className="text-center text-xs text-gray-500 mt-4">
                    *50% Advance required to lock dates.
                </p>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Sub-component for cleaner code
const ServiceCard = ({ item, toggle, variants }) => (
    <motion.div
        variants={variants}
        layout
        onClick={() => toggle(item.id)}
        className={`relative p-6 rounded-2xl border cursor-pointer flex justify-between items-center group
        transition-all duration-300 overflow-hidden
        ${item.checked
            ? 'bg-gradient-to-r from-white/10 to-white/5 border-brand-gold/30 shadow-lg'
            : 'bg-transparent border-white/5 opacity-60 grayscale hover:opacity-80 hover:grayscale-0'
        }`}
    >
        {/* Hover Highlight */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="flex items-center gap-5 relative z-10">
            {/* Checkbox Circle */}
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${item.checked 
                    ? 'bg-brand-gold border-brand-gold scale-100' 
                    : 'border-gray-500 scale-90 group-hover:border-brand-gold'}`}>
                {item.checked && <FaCheck className="text-brand-dark text-sm" />}
            </div>
            
            <div>
                <h3 className={`font-medium text-lg transition-colors ${item.checked ? 'text-white' : 'text-gray-400'}`}>
                    {item.name}
                </h3>
                <span className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</span>
            </div>
        </div>

        <div className={`font-serif text-xl relative z-10 transition-colors ${item.checked ? 'text-brand-gold' : 'text-gray-600'}`}>
            ₹{item.price.toLocaleString()}
        </div>
    </motion.div>
);

export default Quotation;