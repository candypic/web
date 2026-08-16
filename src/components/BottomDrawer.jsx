import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

const BottomDrawer = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#091b20]/95 backdrop-blur-2xl rounded-t-3xl shadow-2xl border-t border-white/15 max-h-[90vh] flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3.5 pb-1 cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 flex justify-between items-center border-b border-white/10 shrink-0">
              <h3 className="font-serif text-base sm:text-lg font-bold text-white">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomDrawer;
