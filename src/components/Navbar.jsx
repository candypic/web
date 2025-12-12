import React, { useState, useEffect } from 'react';
import { Link } from 'react-scroll';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { id: 1, link: 'home', text: 'Home' },
    { id: 2, link: 'about', text: 'About' },
    { id: 3, link: 'portfolio', text: 'Portfolio' },
    { id: 4, link: 'pricing', text: 'Packages' },
  ];

  return (
    <div className={`fixed w-full h-20 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-dark/95 shadow-lg backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="flex justify-between items-center w-full h-full px-4 md:px-12">
        <div className="font-serif text-3xl font-bold cursor-pointer">
          <span className="text-brand-red">C</span>andy <span className="text-brand-red">P</span>ic
        </div>

        <ul className="hidden md:flex">
          {links.map(({ id, link, text }) => (
            <li key={id} className="px-6 cursor-pointer capitalize font-medium hover:text-brand-red transition-colors duration-200">
              <Link to={link} smooth duration={500}>{text}</Link>
            </li>
          ))}
          <li className="ml-4">
             <Link to="contact" smooth duration={500} className="border border-brand-red text-brand-red px-6 py-2 rounded-full hover:bg-brand-red hover:text-white transition-all cursor-pointer">
               Contact
             </Link>
          </li>
        </ul>

        <div onClick={() => setNav(!nav)} className="cursor-pointer pr-4 z-10 md:hidden text-brand-text">
          {nav ? <FaTimes size={30} /> : <FaBars size={30} />}
        </div>

        {nav && (
          <ul className="flex flex-col justify-center items-center absolute top-0 left-0 w-full h-screen bg-brand-dark text-brand-text">
            {links.map(({ id, link, text }) => (
              <li key={id} className="px-4 cursor-pointer capitalize py-6 text-2xl">
                <Link onClick={() => setNav(false)} to={link} smooth duration={500}>{text}</Link>
              </li>
            ))}
             <li className="py-6">
                <Link onClick={() => setNav(false)} to="contact" smooth duration={500} className="text-2xl text-brand-red">Contact</Link>
             </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navbar;