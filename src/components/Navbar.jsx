import React, { useState, useEffect } from 'react';
import { Link as ScrollLink } from 'react-scroll'; // Rename to avoid conflict
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'; // Route navigation
import { FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '/logo-nonsquare.png'; // Logo lives in the public folder

const SAMPLES_URL =
  'https://drive.google.com/drive/folders/1BaMppIppC1-VIZkcXsYDr02WvGdoJacG';

// Scroll-anchor links rendered on the home page (in-page sections)
const SCROLL_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'portfolio', label: 'Portfolio' },
];

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

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = nav ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [nav]);

  // When not on the home route, go home first, then smooth-scroll to the section
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

  const isHome = location.pathname === '/';

  // Shared classes for the elegant gold underline-on-hover effect
  const linkBase =
    'group relative cursor-pointer text-sm tracking-wide text-brand-text/90 transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark rounded-sm';
  const underline =
    'pointer-events-none absolute -bottom-1.5 left-0 h-px w-0 bg-gradient-to-r from-brand-gold to-brand-gold-soft transition-all duration-300 group-hover:w-full';

  // Renders a scroll-or-route nav link with the gold underline
  const renderScrollLink = ({ id, label }) => (
    <li key={id} className={linkBase}>
      {isHome ? (
        <ScrollLink to={id} smooth duration={500} className="block py-1">
          {label}
          <span className={underline} />
        </ScrollLink>
      ) : (
        <span onClick={() => handleNav(id)} className="block py-1">
          {label}
          <span className={underline} />
        </span>
      )}
    </li>
  );

  return (
    <div
      className={`fixed w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-brand-dark/95 shadow-lg shadow-black/20 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-6 md:px-10">
        {/* LOGO */}
        <div className="flex items-center">
          {isHome ? (
            <ScrollLink
              to="home"
              smooth
              duration={500}
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-md"
            >
              <img src={logo} alt="Candy Pic — wedding & event photography studio" className="h-12 w-auto" />
            </ScrollLink>
          ) : (
            <RouterLink
              to="/"
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-md"
            >
              <img src={logo} alt="Candy Pic — wedding & event photography studio" className="h-12 w-auto" />
            </RouterLink>
          )}
        </div>

        {/* DESKTOP MENU */}
        <ul className="hidden md:flex items-center gap-9">
          {/* Scroll links */}
          {SCROLL_LINKS.map(renderScrollLink)}

          {/* Gallery — route link */}
          <li className={linkBase}>
            <RouterLink to="/gallery" className="block py-1">
              Gallery
              <span className={underline} />
            </RouterLink>
          </li>

          {/* Packages — route link */}
          <li className={linkBase}>
            <RouterLink to="/quotation" className="block py-1">
              Packages
              <span className={underline} />
            </RouterLink>
          </li>

          {/* Client Vault — private wedding portal */}
          <li className={linkBase}>
            <RouterLink to="/portal" className="block py-1 text-brand-gold font-medium">
              Client Vault
              <span className={underline} />
            </RouterLink>
          </li>

          {/* Samples — external Google Drive */}
          <li className={linkBase}>
            <a
              href={SAMPLES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1"
            >
              Samples
              <span className={underline} />
            </a>
          </li>

          {/* Contact — premium gold pill */}
          <li className="ml-2">
            {isHome ? (
              <ScrollLink
                to="contact"
                smooth
                duration={500}
                className="inline-flex rounded-full px-7 py-2.5 border border-brand-gold/70 text-brand-gold text-sm uppercase tracking-wide font-medium hover:bg-brand-gold hover:text-brand-dark hover:border-brand-gold transition-all duration-300 shadow-lg shadow-brand-gold/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
              >
                Contact
              </ScrollLink>
            ) : (
              <span
                onClick={() => handleNav('contact')}
                className="inline-flex rounded-full px-7 py-2.5 border border-brand-gold/70 text-brand-gold text-sm uppercase tracking-wide font-medium hover:bg-brand-gold hover:text-brand-dark hover:border-brand-gold transition-all duration-300 shadow-lg shadow-brand-gold/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
              >
                Contact
              </span>
            )}
          </li>
        </ul>

        {/* MOBILE HAMBURGER */}
        <button
          type="button"
          onClick={() => setNav(!nav)}
          aria-label={nav ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={nav}
          className="md:hidden z-50 text-brand-gold p-2 -mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-md transition-colors hover:text-brand-gold-soft"
        >
          {nav ? <FaTimes size={26} /> : <FaBars size={26} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {nav && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-brand-darker/95 backdrop-blur-xl"
              onClick={() => setNav(false)}
            />

            {/* Decorative gold glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Menu items */}
            <motion.ul
              className="relative flex flex-col justify-center items-center w-full h-full gap-7 text-center"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
              }}
            >
              {[
                ...SCROLL_LINKS,
                { id: 'gallery', label: 'Gallery', route: '/gallery' },
                { id: 'packages', label: 'Packages', route: '/quotation' },
                { id: 'portal', label: 'Client Vault', route: '/portal' },
                { id: 'samples', label: 'Samples', external: SAMPLES_URL },
              ].map((item) => (
                <motion.li
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {item.external ? (
                    <a
                      href={item.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setNav(false)}
                      className="font-serif text-3xl text-brand-text hover:text-brand-gold transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : item.route ? (
                    <RouterLink
                      to={item.route}
                      onClick={() => setNav(false)}
                      className="font-serif text-3xl text-brand-text hover:text-brand-gold transition-colors"
                    >
                      {item.label}
                    </RouterLink>
                  ) : isHome ? (
                    <ScrollLink
                      to={item.id}
                      smooth
                      duration={500}
                      onClick={() => setNav(false)}
                      className="font-serif text-3xl text-brand-text hover:text-brand-gold transition-colors cursor-pointer"
                    >
                      {item.label}
                    </ScrollLink>
                  ) : (
                    <span
                      onClick={() => {
                        handleNav(item.id);
                        setNav(false);
                      }}
                      className="font-serif text-3xl text-brand-text hover:text-brand-gold transition-colors cursor-pointer"
                    >
                      {item.label}
                    </span>
                  )}
                </motion.li>
              ))}

              {/* Contact — gold pill */}
              <motion.li
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                className="mt-4"
              >
                {isHome ? (
                  <ScrollLink
                    to="contact"
                    smooth
                    duration={500}
                    onClick={() => setNav(false)}
                    className="inline-flex rounded-full px-9 py-3.5 bg-brand-gold text-brand-dark font-semibold uppercase tracking-wide text-sm hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 cursor-pointer"
                  >
                    Contact
                  </ScrollLink>
                ) : (
                  <span
                    onClick={() => {
                      handleNav('contact');
                      setNav(false);
                    }}
                    className="inline-flex rounded-full px-9 py-3.5 bg-brand-gold text-brand-dark font-semibold uppercase tracking-wide text-sm hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 cursor-pointer"
                  >
                    Contact
                  </span>
                )}
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
