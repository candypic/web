import React from "react";
import { FaInstagram, FaFacebookF, FaWhatsapp, FaPhone } from "react-icons/fa";
import logo from "/logo-nonsquare.png";

const Footer = () => {
  return (
    <footer name="contact" className="bg-black text-white pt-16 pb-10 border-t border-white/10 relative">
      
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-12 items-center">

        {/* Logo + Subtitle */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <img 
            src={logo} 
            alt="Candy Pic Logo" 
            className="h-16 w-auto object-contain  drop-shadow-md"
          />
          <p className="text-gray-400 text-sm mt-1">
            Crafting emotions into timeless frames.
          </p>
        </div>

        {/* Contact Section */}
        <div className="text-center md:text-center">
          <a 
            href="tel:9743174487" 
            className="inline-flex items-center gap-2 text-lg font-medium hover:text-brand-red transition-colors"
          >
            <FaPhone className="text-brand-red" /> 9743174487
          </a>

          <p className="text-gray-500 text-xs mt-2">
            Send a Hey on whatsapp or call for enquiry
          </p>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center md:justify-end gap-6">
          <a href="#">
            <FaInstagram className="text-2xl hover:text-brand-red hover:scale-110 transition-all cursor-pointer" />
          </a>
          <a href="#">
            <FaFacebookF className="text-2xl hover:text-brand-red hover:scale-110 transition-all cursor-pointer" />
          </a>
          <a href="#">
            <FaWhatsapp className="text-2xl hover:text-brand-red hover:scale-110 transition-all cursor-pointer" />
          </a>
        </div>

      </div>

      {/* Divider Line */}
      <div className="w-full border-t border-white/10 mt-12"></div>

      {/* Bottom Note */}
      <div className="text-center text-gray-600 text-xs mt-6">
        © 2025 Candy Pic. Crafted with love by Chandan Naik.
      </div>

    </footer>
  );
};

export default Footer;
