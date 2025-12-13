import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Import your pages
import Home from './pages/Home';
import Quotation from './pages/Quotation';
import AdminCalendar from './pages/AdminCalendar';
import Preloader from './components/Preloader';
import PwaInstallPrompt from './components/PwaInstallPrompt';

function App() {
  const [loading, setLoading] = useState(true);

  const handleLoadingComplete = () => {
    setLoading(false);
  };

  return (
    <>
      {/* 1. Preloader (Only shows on initial load) */}
      <AnimatePresence mode="wait">
        {loading && (
           <Preloader key="preloader" onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      {/* 2. Main App Routing */}
      {!loading && (
        <Router>
          <PwaInstallPrompt />
          {/* 'animate-fade-in' is a custom utility in your tailwind config */}
          <div className="font-sans antialiased bg-brand-dark text-brand-text min-h-screen animate-fade-in">
            <Routes>
              {/* Public Website Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/quotation" element={<Quotation />} />
              
              {/* Private PWA Route */}
              <Route path="/calendar" element={<AdminCalendar />} />
            </Routes>
          </div>
        </Router>
      )}
    </>
  );
}

export default App;