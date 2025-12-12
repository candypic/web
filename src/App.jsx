import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Portfolio from './components/Portfolio';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

function App() {
  return (
    <div className="font-sans antialiased">
      <Navbar />
      <Hero />
      <About />
      <Portfolio />
      <Pricing />
      <Footer />
    </div>
  );
}

export default App;
