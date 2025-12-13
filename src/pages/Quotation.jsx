import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaArrowLeft, FaGem, FaPaperPlane } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Quotation = () => {
  // ---------------- STATE FOR CUSTOM BUILDER ----------------
  const [customItems, setCustomItems] = useState([
    { id: 1, name: 'Wedding Day Photography', category: 'Main', checked: false },
    { id: 2, name: 'Wedding Day Videography', category: 'Main', checked: false },
    { id: 3, name: 'Pre-Wedding Shoot (2 Sections)', category: 'Main', checked: false },
    { id: 4, name: 'Engagement Coverage', category: 'Main', checked: false },
    { id: 5, name: 'Haladi Ceremony (2 Hours)', category: 'Add-on', checked: false },
    { id: 6, name: 'Cinematic Highlights', category: 'Add-on', checked: false },
    { id: 7, name: 'Candid Photography', category: 'Add-on', checked: false },
    { id: 8, name: 'Drone Coverage', category: 'Add-on', checked: false },
  ]);

  const toggleCustomItem = (id) => {
    setCustomItems(customItems.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleCustomSubmit = () => {
    const selectedServices = customItems.filter(item => item.checked).map(i => i.name);
    
    if (selectedServices.length === 0) {
        alert("Please select at least one service.");
        return;
    }

    console.log("--------------------------------");
    console.log("NEW INQUIRY RECEIVED");
    console.log("--------------------------------");
    console.log("Requested Services:", selectedServices);
    alert(`Inquiry sent for ${selectedServices.length} services! We will contact you with a quote.`);
  };

  // Animation Variants
  const containerVariants = { show: { transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-brand-dark pt-28 pb-12 px-4 md:px-12 text-white relative overflow-hidden">

      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-brand-light/10 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-16 relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-gold/80 hover:text-brand-gold transition-all mb-6 text-sm uppercase tracking-widest">
           <FaArrowLeft /> Return Home
        </Link>
        <h1 className="text-4xl md:text-6xl font-serif font-medium leading-tight mb-4">
           Complete Wedding <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-white">Collection</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
           Review our signature all-inclusive package below, or scroll down to customize your own requirement.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-20 relative z-10">

        {/* ================= SECTION 1: THE FIXED PREMIUM PACKAGE (PDF DATA) ================= */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/5 backdrop-blur-xl border border-brand-gold/30 rounded-3xl overflow-hidden shadow-2xl relative"
        >
            {/* Top Banner */}
            <div className="bg-brand-gold/10 p-8 text-center border-b border-white/5">
                <div className="inline-block px-4 py-1 rounded-full bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-[0.2em] mb-4">
                    Recommended
                </div>
                <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">The Complete Candy Pic Experience</h2>
                <p className="text-gray-400">Comprehensive coverage for your special days</p>
            </div>

            <div className="grid md:grid-cols-2 gap-0">
                {/* Left Side: Service List */}
                <div className="p-8 md:p-12 space-y-8 border-b md:border-b-0 md:border-r border-white/10">
                    
                    {/* Item 1 */}
                    <div>
                        <h3 className="text-xl font-bold text-brand-gold mb-2">Wedding Day Coverage</h3>
                        <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside marker:text-brand-red">
                            <li>Regular Photography (1 Album)</li>
                            <li>Regular Videography (Pendrive)</li>
                        </ul>
                    </div>

                    {/* Item 2 */}
                    <div>
                        <h3 className="text-xl font-bold text-brand-gold mb-2">Engagement</h3>
                        <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside marker:text-brand-red">
                            <li>2-3 Minute Video & 100 Edited Photos</li>
                            <li>Drone Coverage & Save the Date Video (30s)</li>
                        </ul>
                    </div>

                    {/* Item 3 */}
                    <div>
                        <h3 className="text-xl font-bold text-brand-gold mb-2">Pre-Wedding Package (2 Sections)</h3>
                        <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside marker:text-brand-red">
                            <li>2-3 Minute Video & 100 Edited Photos</li>
                            <li>Drone Coverage & Save the Date Video (30s)</li>
                        </ul>
                    </div>

                    {/* Item 4 */}
                    <div>
                        <h3 className="text-xl font-bold text-brand-gold mb-2">Additional Services Included</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
                            <div className="flex items-center gap-2"><FaCheck className="text-brand-red text-xs"/> Haladi (2 Hours)</div>
                            <div className="flex items-center gap-2"><FaCheck className="text-brand-red text-xs"/> Cinematic Highlights</div>
                            <div className="flex items-center gap-2"><FaCheck className="text-brand-red text-xs"/> Candid Photos</div>
                        </div>
                    </div>

                </div>

                {/* Right Side: Total & Action */}
                <div className="p-8 md:p-12 flex flex-col justify-center items-center text-center bg-black/20">
                    <FaGem className="text-5xl text-brand-gold/50 mb-6" />
                    <p className="text-gray-400 uppercase text-xs tracking-[0.2em] mb-2">Total Package Value</p>
                    
                    {/* HARDCODED PRICE FROM PDF */}
                    <div className="text-6xl md:text-7xl font-serif text-white font-medium mb-8">
                        ₹1,42,000
                    </div>

                    <div className="w-full space-y-4">
                        <button className="w-full py-4 bg-brand-red hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg text-sm uppercase tracking-wider">
                            Book Full Package
                        </button>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto">
                            *Payment Terms: ₹15,000 Advance, ₹1.05L on Wedding Day, Balance on Delivery.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>


        {/* ================= SECTION 2: CUSTOM BUILDER (NO PRICES) ================= */}
        <div id="custom-builder" className="pt-12">
            
            <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-4 mb-4 opacity-50">
                    <div className="h-px w-20 bg-white"></div>
                    <div className="text-2xl text-brand-gold">OR</div>
                    <div className="h-px w-20 bg-white"></div>
                </div>
                <h2 className="text-3xl font-serif text-white">Build Your Own Package</h2>
                <p className="text-gray-400 mt-2">Don't need everything? Select only what you need and send us an inquiry.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                
                {/* Custom Selection Grid */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="lg:col-span-2 grid md:grid-cols-2 gap-4"
                >
                    {customItems.map(item => (
                        <motion.div
                            key={item.id}
                            variants={itemVariants}
                            onClick={() => toggleCustomItem(item.id)}
                            className={`relative p-5 rounded-xl border cursor-pointer flex items-center gap-4 transition-all duration-300 select-none group
                            ${item.checked 
                                ? 'bg-brand-light/20 border-brand-gold/50' 
                                : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                        >
                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 flex-shrink-0
                                ${item.checked ? 'bg-brand-gold border-brand-gold' : 'border-gray-500 group-hover:border-white'}`}>
                                {item.checked && <FaCheck className="text-brand-dark text-xs" />}
                            </div>
                            
                            <div>
                                <h4 className={`font-medium text-lg ${item.checked ? 'text-white' : 'text-gray-400'}`}>{item.name}</h4>
                                <span className="text-[10px] uppercase tracking-widest text-brand-gold/70">{item.category}</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Sticky Sidebar: Inquiry Box */}
                <div className="lg:col-span-1 sticky top-28">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                        <h3 className="text-white font-serif text-xl mb-6">Your Selection</h3>
                        
                        <div className="min-h-[150px] mb-6">
                            {customItems.filter(i => i.checked).length === 0 ? (
                                <p className="text-gray-500 italic text-sm text-center mt-10">No services selected yet.<br/>Click items to add them.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {customItems.filter(i => i.checked).map((item, index) => (
                                        <li key={item.id} className="flex items-start gap-2 text-gray-300 text-sm border-b border-white/5 pb-2 last:border-0">
                                            <span className="text-brand-gold mt-1">✓</span> {item.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button 
                            onClick={handleCustomSubmit}
                            disabled={customItems.filter(i => i.checked).length === 0}
                            className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2
                            ${customItems.filter(i => i.checked).length > 0
                                ? 'bg-white text-brand-dark hover:bg-brand-gold cursor-pointer' 
                                : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
                        >
                            <FaPaperPlane /> Send Inquiry
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-4">We will calculate the best price for you.</p>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default Quotation;