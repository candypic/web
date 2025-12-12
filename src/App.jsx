import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Home from './pages/Home';
import Quotation from './pages/Quotation';
import Preloader from './components/Preloader';

function App() {
  const [loading, setLoading] = useState(true);

  // We rely on the Preloader component to tell us when animation is done
  const handleLoadingComplete = () => {
    setLoading(false);
  };

  return (
    <>
      {/* The Preloader sits outside the Router logic to cover everything */}
      <AnimatePresence mode="wait">
        {loading && (
           <Preloader key="preloader" onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      {/* Main App Content - Only renders after loading is false */}
      {!loading && (
        <Router>
          <div className="font-sans antialiased bg-brand-dark text-brand-text min-h-screen animate-fade-in">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quotation" element={<Quotation />} />
            </Routes>
          </div>
        </Router>
      )}
    </>
  );
}

export default App;