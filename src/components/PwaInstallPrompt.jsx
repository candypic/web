import React, { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaShareSquare, FaPlusSquare } from 'react-icons/fa';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return; 
    }

    // 2. Listen for Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Detect iOS
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // Only show iOS prompt if not in standalone mode
    if (isIos && !window.navigator.standalone) {
        // We can show it immediately or after a delay. Let's show a small banner.
        setShowIosPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  // --- ANDROID / DESKTOP BUTTON ---
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-bounce-in">
        <div className="bg-brand-gold text-black p-4 rounded-xl shadow-2xl flex items-center justify-between border border-white/20">
          <div className="flex items-center gap-3">
            <div className="bg-black/10 p-2 rounded-lg">
                <FaDownload />
            </div>
            <div>
                <p className="font-bold text-sm">Install App</p>
                <p className="text-xs opacity-80">Add to home screen for better experience</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setDeferredPrompt(null)} className="p-2 text-black/50 hover:text-black">
                <FaTimes />
             </button>
             <button 
                onClick={handleInstallClick}
                className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg active:scale-95 transition-transform"
             >
                INSTALL
             </button>
          </div>
        </div>
      </div>
    );
  }

  // --- IOS INSTRUCTIONS ---
  if (showIosPrompt) {
    return (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-[#0b262d] text-white p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 transform transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-serif text-brand-gold">Install App</h3>
                    <p className="text-xs text-gray-400 mt-1">Install this application on your iPhone for quick access.</p>
                </div>
                <button onClick={() => setShowIosPrompt(false)} className="text-gray-500 p-1">
                    <FaTimes />
                </button>
            </div>
            
            <div className="flex flex-col gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full text-xs font-bold">1</span>
                    <span>Tap the <FaShareSquare className="inline mx-1 text-blue-400"/> share button below.</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full text-xs font-bold">2</span>
                    <span>Scroll down and select <span className="text-white font-bold">"Add to Home Screen"</span> <FaPlusSquare className="inline mx-1"/>.</span>
                </div>
            </div>
            
            <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 translate-y-full border-[10px] border-transparent border-t-[#0b262d]"></div>
        </div>
    );
  }

  return null;
};

export default PwaInstallPrompt;