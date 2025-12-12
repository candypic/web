import React from "react";
import { motion } from "framer-motion";

const photos = {
  portrait: "/p3.jpg",  // tall image
  wide1: "/p1.jpg",     // landscape 1
  wide2: "/p2.jpg",     // landscape 2
};

const Portfolio = () => {
  return (
    <div name="portfolio" className="w-full py-20 bg-brand-dark relative overflow-hidden">

      {/* Background Script Text */}
      <div className="absolute top-10 right-0 opacity-5 pointer-events-none select-none">
        <h1 className="font-script text-[15rem] text-white">Forever</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4">

        {/* Title */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-serif mb-4 text-white"
          >
            Captured Moments
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-brand-gold italic text-lg max-w-2xl mx-auto"
          >
            "Together, we laugh, love, and grow — two hearts, one soul."
          </motion.p>
        </div>

        {/* FINAL LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* LEFT — Portrait Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-xl shadow-xl md:col-span-1 h-[600px]"
          >
            <img
              src={photos.portrait}
              className="w-full h-full object-cover"
              alt="portrait"
            />
          </motion.div>

          {/* RIGHT — 2 Landscape Images */}
          <div className="flex flex-col gap-6 md:col-span-2">

            {/* Wide 1 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-xl shadow-xl h-[290px]"
            >
              <img
                src={photos.wide1}
                className="w-full h-full object-cover"
                alt="wide1"
              />
            </motion.div>

            {/* Wide 2 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative overflow-hidden rounded-xl shadow-xl h-[290px]"
            >
              <img
                src={photos.wide2}
                className="w-full h-full object-cover"
                alt="wide2"
              />
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Portfolio;
