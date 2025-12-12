import React from 'react';
import { FaInstagram, FaFacebookF, FaWhatsapp, FaPhone } from 'react-icons/fa';

const Footer = () => {
  return (
    <div name="contact" className="bg-black text-white py-12 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        
        <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-serif font-bold mb-2">Candy Pic</h2>
            <p className="text-gray-400 text-sm">Turning moments into memories.</p>
        </div>

        <div className="flex flex-col items-center md:items-end">
            <a href="tel:9743174487" className="flex items-center gap-2 text-xl hover:text-brand-red transition-colors mb-4">
                <FaPhone className="text-brand-red" /> 9743174487
            </a>
            
            <div className="flex gap-6">
                <FaInstagram className="text-2xl cursor-pointer hover:text-brand-red transition-colors" />
                <FaFacebookF className="text-2xl cursor-pointer hover:text-brand-red transition-colors" />
                <FaWhatsapp className="text-2xl cursor-pointer hover:text-brand-red transition-colors" />
            </div>
        </div>

      </div>
      <div className="text-center text-gray-600 text-xs mt-12">
        © 2025 Candy Pic. Designed by Chandan Naik.
      </div>
    </div>
  );
};

export default Footer;