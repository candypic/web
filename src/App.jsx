import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Quotation from './pages/Quotation';

function App() {
  return (
    <Router>
      <div className="font-sans antialiased bg-brand-dark text-brand-text min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quotation" element={<Quotation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;