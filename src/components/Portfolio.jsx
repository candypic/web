import React from "react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import { FaArrowRight, FaCamera } from "react-icons/fa";

const portraits = [
  { src: "/p3.jpg", title: "First Glance", caption: "Bridal Portrait" },
  { src: "/p4.jpg", title: "Quiet Vows", caption: "Ceremony" },
  { src: "/p5.jpg", title: "Golden Hour", caption: "Couple Session" },
  { src: "/p6.jpg", title: "Forever Begins", caption: "The Embrace" },
];

const wides = [
  { src: "/p1.jpg", title: "Sacred Union", caption: "The Ritual" },
  { src: "/p2.jpg", title: "Celebration", caption: "Reception" },
  { src: "/p7.jpg", title: "Endless Joy", caption: "Candid Frame" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const GalleryFrame = ({ src, title, caption, alt, className = "", index = 0 }) => (
  <motion.figure
    variants={fadeUp}
    transition={{ duration: 0.7, ease: "easeOut", delay: (index % 3) * 0.08 }}
    className={`group relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-brand-deep hover:-translate-y-1 transition-transform duration-500 ${className}`}
  >
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
    />

    {/* Gold-tinted gradient veil revealing on hover */}
    <div className="absolute inset-0 bg-gradient-to-t from-brand-darker/90 via-brand-darker/20 to-transparent opacity-70 group-hover:opacity-95 transition-opacity duration-500 pointer-events-none" />

    {/* Caption overlay */}
    <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-6 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
      <span className="flex items-center gap-3 mb-1.5">
        <span className="h-px w-6 bg-brand-gold/70" />
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-brand-gold font-medium">
          {caption}
        </span>
      </span>
      <h3 className="font-serif text-xl md:text-2xl text-white leading-snug">{title}</h3>
    </figcaption>

    {/* Thin gold frame on hover */}
    <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-brand-gold/0 group-hover:ring-brand-gold/40 transition-all duration-500 pointer-events-none" />
  </motion.figure>
);

const Portfolio = () => {
  return (
    <div
      name="portfolio"
      className="relative w-full overflow-hidden bg-brand-dark py-24 md:py-32"
    >
      {/* Decorative script word */}
      <div className="absolute -top-6 right-0 select-none pointer-events-none">
        <h1 className="font-script text-[8rem] sm:text-[12rem] lg:text-[16rem] leading-none text-white/[0.03] whitespace-nowrap pr-6">
          Forever
        </h1>
      </div>

      {/* Soft radial glows */}
      <div className="absolute -left-20 top-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -right-24 bottom-0 w-96 h-96 bg-brand-red/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="text-center mb-14 md:mb-20"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-5"
          >
            <span className="h-px w-10 bg-brand-gold/50" />
            <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gold font-medium">
              Portfolio
            </span>
            <span className="h-px w-10 bg-brand-gold/50" />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight"
          >
            Captured{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-soft">
              Moments
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="font-serif italic text-brand-gold/90 text-lg md:text-xl max-w-2xl mx-auto mt-5"
          >
            "Together, we laugh, love, and grow — two hearts, one soul."
          </motion.p>
        </motion.div>

        {/* Asymmetric editorial gallery */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6"
        >
          {/* LEFT column — two stacked portraits */}
          <div className="flex flex-col gap-5 md:gap-6">
            <GalleryFrame
              {...portraits[0]}
              alt={`${portraits[0].title} — ${portraits[0].caption} by Candy Pic`}
              className="h-[260px] sm:h-[300px] md:h-[330px]"
              index={0}
            />
            <GalleryFrame
              {...portraits[1]}
              alt={`${portraits[1].title} — ${portraits[1].caption} by Candy Pic`}
              className="h-[260px] sm:h-[300px] md:h-[330px]"
              index={1}
            />
          </div>

          {/* CENTER column — tall hero portrait */}
          <GalleryFrame
            {...portraits[3]}
            alt={`${portraits[3].title} — ${portraits[3].caption} by Candy Pic`}
            className="h-[320px] sm:h-[380px] md:h-full md:min-h-[684px]"
            index={2}
          />

          {/* RIGHT column — wide stack + one portrait */}
          <div className="flex flex-col gap-5 md:gap-6">
            <GalleryFrame
              {...wides[0]}
              alt={`${wides[0].title} — ${wides[0].caption} by Candy Pic`}
              className="h-[220px] sm:h-[210px] md:h-[210px]"
              index={0}
            />
            <GalleryFrame
              {...wides[1]}
              alt={`${wides[1].title} — ${wides[1].caption} by Candy Pic`}
              className="h-[220px] sm:h-[210px] md:h-[210px]"
              index={1}
            />
            <GalleryFrame
              {...wides[2]}
              alt={`${wides[2].title} — ${wides[2].caption} by Candy Pic`}
              className="h-[220px] sm:h-[210px] md:h-[210px]"
              index={2}
            />
          </div>
        </motion.div>

        {/* Lower accent row — portrait pair + wide-style spotlight */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 mt-5 md:mt-6"
        >
          <GalleryFrame
            {...portraits[2]}
            alt={`${portraits[2].title} — ${portraits[2].caption} by Candy Pic`}
            className="h-[220px] sm:h-[260px] md:h-[300px]"
            index={0}
          />
          <GalleryFrame
            {...wides[2]}
            alt={`${wides[2].title} — ${wides[2].caption} by Candy Pic, encore`}
            className="h-[220px] sm:h-[260px] md:h-[300px] col-span-1 sm:col-span-1 md:col-span-2"
            index={1}
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex justify-center mt-14 md:mt-20"
        >
          <RouterLink
            to="/gallery"
            className="group inline-flex items-center gap-3 rounded-full px-8 py-4 border border-white/25 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm transition-all uppercase tracking-wide text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            <FaCamera className="text-brand-gold" aria-hidden="true" />
            Explore Full Gallery
            <FaArrowRight
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </RouterLink>
        </motion.div>
      </div>
    </div>
  );
};

export default Portfolio;
