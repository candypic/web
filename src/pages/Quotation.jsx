import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidingNumber } from '../components/SlidingNumber';
import { FaCheck, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Quotation = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Wedding Day Photography', price: 25000, category: 'Main', checked: true },
    { id: 2, name: 'Wedding Day Videography', price: 15000, category: 'Main', checked: true },
    { id: 3, name: 'Pre-Wedding Shoot', price: 35000, category: 'Main', checked: true },
    { id: 4, name: 'Engagement Coverage', price: 22000, category: 'Main', checked: true },
    { id: 5, name: 'Haldi Ceremony (2 Hrs)', price: 15000, category: 'Add-on', checked: true },
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

  // Separate by category
  const mainServices = items.filter(i => i.category === 'Main');
  const addOns = items.filter(i => i.category === 'Add-on');

  return (
    <div className="min-h-screen bg-brand-dark pt-24 pb-12 px-4 md:px-12 text-white">

      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-10">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-gold hover:text-white transition-all mb-6">
          <FaArrowLeft /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-serif font-light">Build Your Package</h1>
        <p className="text-gray-300 mt-2 text-sm md:text-base">
          All services are selected by default. Uncheck items to customize your package.
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">

        {/* LEFT LIST */}
        <div className="md:col-span-2 space-y-6">

          {/* Main Services */}
          <div>
            <h2 className="text-xl text-brand-gold font-semibold mb-4 border-b border-white/20 pb-2">Main Services</h2>
            <AnimatePresence initial={false}>
              {mainServices.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => toggleItem(item.id)}
                  className={`group p-5 rounded-xl border cursor-pointer flex justify-between items-center 
                    transition-all duration-300 backdrop-blur-xl
                    ${item.checked
                      ? 'bg-white/10 border-brand-gold/40 shadow-gold-glow'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all
                      ${item.checked ? 'bg-brand-red border-brand-red' : 'border-gray-400'}`}>
                      {item.checked && <FaCheck className="text-white text-xs" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{item.name}</h3>
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{item.category}</span>
                    </div>
                  </div>
                  <div className="font-bold text-brand-gold text-lg md:text-xl">₹{item.price.toLocaleString()}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add-ons */}
          <div className="mt-8">
            <h2 className="text-xl text-brand-gold font-semibold mb-4 border-b border-white/20 pb-2">Add-ons</h2>
            <AnimatePresence initial={false}>
              {addOns.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => toggleItem(item.id)}
                  className={`group p-5 rounded-xl border cursor-pointer flex justify-between items-center 
                    transition-all duration-300 backdrop-blur-xl
                    ${item.checked
                      ? 'bg-white/10 border-brand-gold/40 shadow-gold-glow'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all
                      ${item.checked ? 'bg-brand-red border-brand-red' : 'border-gray-400'}`}>
                      {item.checked && <FaCheck className="text-white text-xs" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{item.name}</h3>
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{item.category}</span>
                    </div>
                  </div>
                  <div className="font-bold text-brand-gold text-lg md:text-xl">₹{item.price.toLocaleString()}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>

        {/* TOTAL CARD */}
        <div className="md:col-span-1">
          <div className="sticky top-24 bg-white/10 backdrop-blur-2xl p-7 rounded-2xl border border-white/10 shadow-2xl space-y-6">

            <div>
              <h3 className="text-gray-400 uppercase text-xs tracking-widest mb-2">Estimated Total</h3>
              <div className="flex items-end text-brand-red font-bold font-serif gap-1">
                <span className="text-2xl">₹</span>
                <SlidingNumber number={total} className="text-5xl md:text-6xl font-bold" />
              </div>
            </div>

            <div className="w-full h-[1px] bg-white/10"></div>

            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Services Selected:</span>
                <span className="font-bold text-white">{items.filter(i => i.checked).length}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span>Excluded</span>
              </div>
            </div>

            <button className="w-full py-4 bg-brand-gold text-brand-dark font-bold rounded-xl hover:bg-white transition-all shadow-lg text-lg">
              Confirm & Contact
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Quotation;
