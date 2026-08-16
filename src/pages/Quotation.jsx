import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheck,
  FaArrowLeft,
  FaGem,
  FaPaperPlane,
  FaTimes,
  FaCameraRetro,
  FaVideo,
  FaHeart,
  FaRing,
  FaWhatsapp,
  FaDownload,
  FaPrint,
  FaPhoneAlt,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { createAdminNotification } from '../lib/galleryApi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// --- BOOKING / QUOTE MODAL ---
const BookingModal = ({ isOpen, onClose, packageDetails }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', date: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { type, items, total } = packageDetails;
    const isCustom = type === 'Custom Quote Request';

    const eventDescription = isCustom
      ? `Custom Quote Request (Total: ₹${(total || 0).toLocaleString()})`
      : type;

    const additionalInfo =
      isCustom && items && items.length > 0
        ? items.map((i) => `• ${i.name} (₹${i.price.toLocaleString()})`).join('\n')
        : null;

    try {
      const { error } = await supabase.from('bookings').insert([
        {
          client_name: formData.name,
          client_phone: formData.phone,
          booking_date: formData.date,
          event_type: eventDescription,
          status: 'pending',
          additional_info: additionalInfo,
        },
      ]);

      if (error) throw error;

      // Dispatch admin notification
      await createAdminNotification({
        title: '💼 New Quote / Date Inquiry!',
        message: `${formData.name} requested quote for ${formData.date || 'a celebration'}: ${eventDescription}`,
        type: 'quote_inquiry',
        link: '/admin/calendar',
        metadata: { name: formData.name, phone: formData.phone, date: formData.date },
      });

      setSubmitted(true);
    } catch (err) {
      alert('Error sending request. Please try again or message Chandan directly on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    `Hi Chandan! I'm interested in Candy Pic wedding photography services:\n` +
      `👤 Name: ${formData.name || 'Client'}\n` +
      `📅 Event Date: ${formData.date || 'Upcoming'}\n` +
      `💎 Package: ${packageDetails.type}\n` +
      (packageDetails.items?.length
        ? `📋 Services:\n${packageDetails.items.map((i) => `  - ${i.name} (₹${i.price})`).join('\n')}\n`
        : '') +
      `💰 Estimated Total: ₹${(packageDetails.total || 142000).toLocaleString()}\n\nPlease let me know your availability!`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-darker/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-brand-gold/30 bg-brand-deep/95 backdrop-blur-xl shadow-2xl p-7 sm:p-9"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 grid place-items-center w-8 h-8 rounded-full border border-white/10 text-brand-muted hover:text-white hover:bg-white/10 transition-all"
        >
          <FaTimes size={14} />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
              <FaCheck />
            </div>
            <h3 className="font-serif text-2xl text-white mb-2">Inquiry Received!</h3>
            <p className="text-xs text-brand-muted font-light mb-6 leading-relaxed">
              Thank you, {formData.name}! Chandan will review your requested date (<strong>{formData.date}</strong>) and contact you shortly.
            </p>

            {/* Direct WhatsApp follow up */}
            <a
              href={`https://wa.me/919743174487?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full py-3.5 bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <FaWhatsapp size={16} /> Chat Directly on WhatsApp
            </a>

            <button
              onClick={onClose}
              className="mt-4 text-xs text-brand-muted hover:underline"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-brand-gold/50" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-brand-gold font-medium">Reserve Date</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl text-white leading-tight mb-2">Check Availability</h3>
            <p className="text-xs text-brand-muted font-light mb-6 leading-relaxed">
              Inquiring for: <strong className="text-brand-gold">{packageDetails.type}</strong>
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-brand-muted ml-1 block mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="Your Name"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-brand-muted/40 outline-none focus:border-brand-gold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-brand-muted ml-1 block mb-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-brand-muted/40 outline-none focus:border-brand-gold"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-brand-muted ml-1 block mb-1">Event Date</label>
                <input
                  required
                  type="date"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-gold [color-scheme:dark]"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full py-3.5 bg-brand-gold text-brand-dark font-bold tracking-wide uppercase text-xs hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaPaperPlane size={11} />
                  {loading ? 'Sending...' : 'Send Inquiry to Studio'}
                </button>

                <a
                  href={`https://wa.me/919743174487?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full py-3 bg-[#25D366] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <FaWhatsapp size={14} /> Send Directly on WhatsApp
                </a>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

const serviceIcon = (name) => {
  if (/video|cinematic|highlight|drone/i.test(name)) return FaVideo;
  if (/photo|candid/i.test(name)) return FaCameraRetro;
  if (/engage/i.test(name)) return FaRing;
  if (/haldi|led|wall/i.test(name)) return FaGem;
  return FaHeart;
};

export default function Quotation() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState({ type: '', items: [], total: 0 });

  const [customItems, setCustomItems] = useState([
    { id: 1, name: 'Wedding Day Photography & Videography', price: 45000, category: 'Main', checked: false },
    { id: 2, name: 'Pre-Wedding Photography', price: 35000, category: 'Main', checked: false },
    { id: 3, name: 'Engagement Coverage', price: 25000, category: 'Main', checked: false },
    { id: 4, name: 'Haldi Ceremony', price: 15000, category: 'Add-on', checked: false },
    { id: 5, name: 'Cinematic Highlights', price: 17000, category: 'Add-on', checked: false },
    { id: 6, name: 'Candid Photography', price: 17000, category: 'Add-on', checked: false },
    { id: 7, name: 'Drone Coverage', price: 10000, category: 'Add-on', checked: false },
    { id: 8, name: 'LED Wall (6x8 ft)', price: 15000, category: 'Add-on', checked: false },
  ]);

  const toggleCustomItem = (id) => {
    setCustomItems(
      customItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleFullPackage = () => {
    setSelectedPackage({ type: 'Full Wedding Collection (₹1.42L)', items: [], total: 142000 });
    setModalOpen(true);
  };

  const handleCustomSubmit = () => {
    const selectedServices = customItems.filter((item) => item.checked);
    const total = selectedServices.reduce((sum, item) => sum + item.price, 0);

    if (selectedServices.length === 0) {
      alert('Please select at least one service to build a quote.');
      return;
    }

    setSelectedPackage({
      type: 'Custom Quote Request',
      items: selectedServices,
      total,
    });
    setModalOpen(true);
  };

  const selectedItems = customItems.filter((item) => item.checked);
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const collection = [
    {
      title: 'Wedding Day Coverage',
      points: [
        'Regular Photography 1 Album - (35 sheet luxury)',
        'Full HD / 4K Regular Videography (Pendrive)',
        'Cinematic Highlights Teaser Reel',
        'Candid Master Photos',
      ],
    },
    {
      title: 'Haladi Coverage (2 hours)',
      points: ['Regular Photos and videos (2 hours ceremony)'],
    },
    {
      title: 'Engagement Ceremony',
      points: ['Highlights and edited photos (soft copy)'],
    },
    {
      title: 'Pre-Wedding Experience',
      points: [
        '2-3 Minute Cinematic Video & 100 Edited Photos',
        'Drone Beach/Fort Aerial Coverage & Save the Date Reel',
      ],
    },
    {
      title: 'Bonus Inclusions',
      points: ['LED wall screen (6 x 8 ft) at reception venue'],
    },
  ];

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text relative overflow-hidden flex flex-col justify-between selection:bg-brand-gold selection:text-brand-dark">
      <Navbar />

      <AnimatePresence>
        {modalOpen && (
          <BookingModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            packageDetails={selectedPackage}
          />
        )}
      </AnimatePresence>

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-brand-gold/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="pt-28 pb-20 relative z-10 flex-1">
        {/* ================= HERO ================= */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 mb-12 sm:mb-16 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 text-xs uppercase tracking-[0.3em] text-brand-gold/80 hover:text-brand-gold transition-all"
          >
            <FaArrowLeft className="text-[0.7em]" /> Return Home
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-brand-gold/50" />
              <span className="text-xs uppercase tracking-[0.3em] text-brand-gold font-medium">
                Transparent Pricing
              </span>
              <span className="h-px w-8 bg-brand-gold/50" />
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white leading-tight mb-4">
              Investment &amp;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-soft">
                Collections
              </span>
            </h1>

            <p className="text-brand-muted text-sm sm:text-base leading-relaxed font-light max-w-xl mx-auto">
              Choose our signature all-inclusive wedding collection below, or customize individual services to tailor your exact budget.
            </p>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 space-y-16 sm:space-y-24">
          {/* ================= SECTION 1: FIXED SIGNATURE PACKAGE ================= */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-brand-gold/30 bg-white/5 backdrop-blur-2xl shadow-2xl"
          >
            <div className="relative p-6 sm:p-10 text-center border-b border-white/10 bg-gradient-to-b from-brand-gold/15 to-transparent">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-gold text-brand-dark font-bold text-[10px] uppercase tracking-[0.25em] mb-4 shadow-lg shadow-brand-gold/20">
                <FaGem size={10} /> Signature Experience
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl text-white leading-tight mb-2">
                The Complete Wedding Collection
              </h2>
              <p className="text-xs sm:text-sm text-brand-muted font-light">
                Full cinematic photo &amp; video coverage from Haldi to Vidaai.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 sm:p-10 space-y-6 border-b md:border-b-0 md:border-r border-white/10">
                {collection.map((group) => (
                  <div key={group.title}>
                    <h3 className="font-serif text-base sm:text-lg text-brand-gold mb-2">{group.title}</h3>
                    <ul className="space-y-1.5">
                      {group.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-xs sm:text-sm text-brand-muted font-light leading-relaxed">
                          <FaCheck className="mt-1 text-[0.65em] text-brand-gold shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="p-6 sm:p-10 flex flex-col justify-center items-center text-center bg-brand-darker/40">
                <FaGem className="text-4xl text-brand-gold/30 mb-4" />
                <p className="text-brand-muted uppercase text-[10px] tracking-[0.3em] mb-2">Complete Package Investment</p>
                <div className="font-serif text-5xl sm:text-6xl text-white font-semibold mb-2">₹1,42,000</div>
                <p className="text-xs text-brand-gold font-light mb-6">All inclusive (Photos + 4K Video + Album + Drone)</p>

                <div className="w-full max-w-xs space-y-3">
                  <button
                    onClick={handleFullPackage}
                    className="w-full rounded-full py-4 bg-brand-gold text-brand-dark font-bold tracking-wider uppercase text-xs hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/30 cursor-pointer"
                  >
                    Reserve Full Collection
                  </button>

                  <a
                    href="https://wa.me/919743174487?text=Hi%20Chandan,%20I'm%20interested%20in%20the%20Full%20Wedding%20Collection%20(₹1.42L)%20package!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-full py-3 bg-[#25D366] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <FaWhatsapp size={14} /> Quick WhatsApp Chat
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= SECTION 2: CUSTOM PACKAGE BUILDER ================= */}
          <div>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="h-px w-8 bg-brand-gold/50" />
                <span className="text-xs uppercase tracking-[0.3em] text-brand-gold font-medium">Bespoke Options</span>
                <span className="h-px w-8 bg-brand-gold/50" />
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl text-white leading-tight mb-2">Build Your Custom Quote</h2>
              <p className="text-xs sm:text-sm text-brand-muted font-light">Select only the specific rituals and add-ons you need.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 items-start">
              {/* Left 2 Cols: Custom Cards */}
              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3.5">
                {customItems.map((item) => {
                  const Icon = serviceIcon(item.name);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleCustomItem(item.id)}
                      className={`text-left p-4 sm:p-5 rounded-2xl border backdrop-blur-xl flex items-start gap-3.5 cursor-pointer transition-all duration-200 ${
                        item.checked
                          ? 'bg-brand-gold/15 border-brand-gold shadow-lg shadow-brand-gold/10'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                          item.checked ? 'bg-brand-gold border-brand-gold text-brand-dark' : 'border-white/30'
                        }`}
                      >
                        {item.checked && <FaCheck size={10} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif text-sm sm:text-base text-white font-medium">{item.name}</h4>
                          <Icon className={`shrink-0 ${item.checked ? 'text-brand-gold' : 'text-brand-muted'}`} size={14} />
                        </div>
                        <p className="text-brand-gold font-semibold text-xs sm:text-sm mt-1">₹{item.price.toLocaleString()}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Col: Live Summary */}
              <div className="lg:col-span-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
                <h3 className="font-serif text-lg text-white mb-4">Your Custom Selection</h3>

                {selectedItems.length === 0 ? (
                  <p className="text-xs text-brand-muted font-light py-8 text-center italic">
                    Tap the cards on the left to add services to your quote.
                  </p>
                ) : (
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                        <span className="text-brand-text truncate pr-2">{item.name}</span>
                        <span className="text-brand-gold font-mono shrink-0">₹{item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/10 pt-4 flex justify-between items-baseline mb-6">
                  <span className="font-serif text-sm text-white uppercase tracking-wider">Estimated Total</span>
                  <span className="font-serif text-2xl text-brand-gold font-bold">₹{totalAmount.toLocaleString()}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  disabled={selectedItems.length === 0}
                  className="w-full rounded-full py-3.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-gold/20 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-gold-soft transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaPaperPlane size={11} /> Request Custom Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
