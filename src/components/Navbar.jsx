import React, { useState, useEffect } from 'react';
import { Link as ScrollLink } from 'react-scroll'; // Rename to avoid conflict
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'; // New imports
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '/logo-nonsquare.png'; // Assuming logo.jpg is directly in the public folder relative to your component

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper to handle navigation
  const handleNav = (target) => {
    setNav(false);
    if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
            const element = document.getElementById(target);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
  };

  return (
    <div className={`fixed w-full h-20 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-dark/95 shadow-lg backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="flex justify-between items-center w-full h-full px-4 md:px-12">
        
        {/* LOGO */}
        <div className="flex items-center">
  {location.pathname === '/' ? (
    <ScrollLink to="home" smooth duration={500} className="cursor-pointer">
      <img src={logo} alt="Logo" className="h-12 w-auto" />
    </ScrollLink>
  ) : (
    <RouterLink to="/" className="cursor-pointer">
      <img src={logo} alt="Logo" className="h-12 w-auto" />
    </RouterLink>
  )}
</div>

        {/* DESKTOP MENU */}
        <ul className="hidden md:flex items-center gap-8">
            {/* Scroll Links */}
            {['home', 'about', 'portfolio'].map((item) => (
                <li key={item} className="cursor-pointer capitalize font-medium text-brand-text hover:text-brand-red transition-colors">
                    {location.pathname === '/' ? (
                        <ScrollLink to={item} smooth duration={500}>{item}</ScrollLink>
                    ) : (
                        <span onClick={() => handleNav(item)}>{item}</span>
                    )}
                </li>
            ))}
            
            {/* Route Link to Packages */}
            <li className="cursor-pointer capitalize font-medium text-brand-text hover:text-brand-red transition-colors">
                <RouterLink to="/quotation">Packages</RouterLink>
            </li>

            {/* New Samples Link */}
            <li className="cursor-pointer capitalize font-medium text-brand-text hover:text-brand-red transition-colors">
               <a href="https://drive.google.com/drive/folders/1BaMppIppC1-VIZkcXsYDr02WvGdoJacG" target="_blank" rel="noopener noreferrer">Samples</a>
            </li>

            <li className="ml-4">
               {location.pathname === '/' ? (
                   <ScrollLink to="contact" smooth duration={500} className="border border-brand-red text-brand-red px-6 py-2 rounded-full hover:bg-brand-red hover:text-white transition-all cursor-pointer">
                     Contact
                   </ScrollLink>
               ) : (
                   <RouterLink to="/" className="border border-brand-red text-brand-red px-6 py-2 rounded-full hover:bg-brand-red hover:text-white transition-all cursor-pointer">
                     Contact
                   </RouterLink>
               )}
            </li>
        </ul>

        {/* MOBILE HAMBURGER */}
        <div onClick={() => setNav(!nav)} className="cursor-pointer pr-4 z-50 md:hidden text-brand-text">
          {nav ? <FaTimes size={30} /> : <FaBars size={30} />}
        </div>

        {/* MOBILE MENU */}
       {nav && (
           <>
               <div
                   className="fixed inset-0 bg-black/70 z-30"
                   onClick={() => setNav(false)}
               ></div>
               <ul className="flex flex-col justify-center items-center absolute top-0 left-0 w-full h-screen bg-brand-dark text-brand-text z-40">
                   <li className="py-4 text-2xl"><RouterLink onClick={() => setNav(false)} to="/">Home</RouterLink></li>
                   <li className="py-4 text-2xl"><span onClick={() => {handleNav('about'); setNav(false);}} className="cursor-pointer">About</span></li>
                   <li className="py-4 text-2xl"><span onClick={() => {handleNav('portfolio'); setNav(false);}} className="cursor-pointer">Portfolio</span></li>
                   <li className="py-4 text-2xl"><RouterLink onClick={() => setNav(false)} to="/quotation">Packages</RouterLink></li>
                   <li className="py-4 text-2xl"><a href="https://drive.google.com/drive/folders/1BaMppIppC1-VIZkcXsYDr02WvGdoJacG" target="_blank" rel="noopener noreferrer">Samples</a></li>
                   <li className="py-4 text-2xl"><span onClick={() => {handleNav('contact'); setNav(false);}} className="cursor-pointer">Contact</span></li>
               </ul>
           </>
       )}
      </div>
    </div>
  );
};

export default Navbar;