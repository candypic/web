import React from "react";
import { motion } from "framer-motion";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import {
  FaInstagram,
  FaFacebookF,
  FaWhatsapp,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import logo from "/logo-nonsquare.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

// TODO: Studio — replace these placeholder social links with the real
// Candy Pic Instagram and Facebook profile URLs.
const socials = [
  { Icon: FaInstagram, label: "Instagram", href: "#" },
  { Icon: FaFacebookF, label: "Facebook", href: "#" },
  { Icon: FaWhatsapp, label: "WhatsApp", href: "https://wa.me/919743174487" },
];

const Footer = () => {
  return (
    <footer
      name="contact"
      className="relative overflow-hidden bg-brand-darker text-brand-text pt-20 pb-10"
    >
      {/* Slim top gold divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent" />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-brand-gold/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand-red/10 blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Brand block */}
          <motion.div
            variants={fadeUp}
            custom={0}
            className="lg:pr-6"
          >
            <img
              src={logo}
              alt="Candy Pic logo"
              className="h-16 w-auto object-contain drop-shadow-md"
            />
            <p className="mt-5 font-serif text-xl text-white leading-snug">
              Crafting emotions into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-soft">
                timeless frames.
              </span>
            </p>
            <p className="mt-3 text-brand-muted text-sm leading-relaxed font-light">
              Premium wedding &amp; event photography and videography, led by
              Chandan Naik in Kumta, Karnataka.
            </p>
          </motion.div>

          {/* Quick links */}
          <motion.nav
            variants={fadeUp}
            custom={1}
            aria-label="Footer quick links"
          >
            <h3 className="font-serif text-lg text-white">Explore</h3>
            <span className="mt-3 block h-px w-10 bg-brand-gold/50" />
            <ul className="mt-5 space-y-3 text-brand-muted">
              <li>
                <ScrollLink
                  to="home"
                  smooth
                  duration={500}
                  className="cursor-pointer rounded-md font-light transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  Home
                </ScrollLink>
              </li>
              <li>
                <RouterLink
                  to="/gallery"
                  className="rounded-md font-light transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  Gallery
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  to="/quotation"
                  className="rounded-md font-light transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  Packages
                </RouterLink>
              </li>
              <li>
                <ScrollLink
                  to="contact"
                  smooth
                  duration={500}
                  className="cursor-pointer rounded-md font-light transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  Book Now
                </ScrollLink>
              </li>
            </ul>
          </motion.nav>

          {/* Contact column */}
          <motion.div variants={fadeUp} custom={2}>
            <h3 className="font-serif text-lg text-white">Get in touch</h3>
            <span className="mt-3 block h-px w-10 bg-brand-gold/50" />
            <ul className="mt-5 space-y-4 text-brand-muted">
              <li>
                <a
                  href="tel:9743174487"
                  className="group inline-flex items-center gap-3 rounded-md font-light transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-brand-dark">
                    <FaPhone className="text-sm" />
                  </span>
                  <span className="text-base text-white">9743174487</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/919743174487"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 rounded-md font-light transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-brand-dark">
                    <FaWhatsapp className="text-base" />
                  </span>
                  <span>Chat on WhatsApp</span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                  <FaMapMarkerAlt className="text-sm" />
                </span>
                <span className="font-light">Kumta, Karnataka</span>
              </li>
            </ul>
          </motion.div>

          {/* Social + CTA column */}
          <motion.div variants={fadeUp} custom={3}>
            <h3 className="font-serif text-lg text-white">Follow along</h3>
            <span className="mt-3 block h-px w-10 bg-brand-gold/50" />
            <div className="mt-5 flex gap-4">
              {socials.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-brand-muted backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-gold hover:bg-brand-gold hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <Icon className="text-lg" />
                </a>
              ))}
            </div>
            <p className="mt-5 text-brand-muted text-sm leading-relaxed font-light">
              Send a hey on WhatsApp or call us for any enquiry — we&apos;d love
              to tell your story.
            </p>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <div className="mt-16 h-px w-full bg-white/10" />

        {/* Bottom note */}
        <div className="mt-6 text-center text-xs tracking-wide text-brand-muted/70">
          &copy; 2026 Candy Pic. Crafted with love by Chandan Naik.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
