import React from "react";
import { motion } from "framer-motion";

const photos = {
  portrait1: "/p3.jpg",
  portrait2: "/p4.jpg",
  portrait3: "/p5.jpg",
  portrait4: "/p6.jpg",
  wide1: "/p1.jpg",
  wide2: "/p2.jpg",
  wide3: "/p7.jpg",
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

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* LEFT — Portrait Stack */}
          <div className="flex flex-col gap-6">
            {[photos.portrait1, photos.portrait2, photos.portrait3].map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative overflow-hidden rounded-xl shadow-xl h-[420px]"
              >
                <img src={src} className="w-full h-full object-cover" alt={`portrait-${i}`} />
              </motion.div>
            ))}
          </div>

          {/* CENTER — Highlight Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-xl shadow-xl h-[660px]"
          >
            <img
              src={photos.portrait4}
              className="w-full h-full object-cover"
              alt="highlight portrait"
            />
          </motion.div>

          {/* RIGHT — Wide Stack */}
          <div className="flex flex-col gap-6">
            {[photos.wide1, photos.wide2, photos.wide3].map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative overflow-hidden rounded-xl shadow-xl h-[240px]"
              >
                <img src={src} className="w-full h-full object-cover" alt={`wide-${i}`} />
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Portfolio;
