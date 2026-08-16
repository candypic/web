import React from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaCameraRetro, FaHeart } from 'react-icons/fa';

const About = () => {
  const chips = [
    { icon: FaMapMarkerAlt, label: 'Based in Kumta' },
    { icon: FaCameraRetro, label: 'Weddings & Events' },
    { icon: FaHeart, label: 'Story-First Approach' },
  ];

  return (
    <div
      name="about"
      className="relative w-full overflow-hidden bg-brand-dark py-24 md:py-32"
    >
      {/* Decorative script word */}
      <span className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 select-none font-script text-7xl md:text-9xl text-white/[0.03] whitespace-nowrap">
        the creative eye
      </span>

      {/* Subtle background glows */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-brand-gold/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-red/10 blur-[120px]" />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 md:grid-cols-2 md:gap-12 md:px-10">

        {/* Image Side */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="group relative mx-auto w-full max-w-md md:mx-0 mb-10 sm:mb-0"
        >
          {/* Offset gold frame */}
          <div className="absolute -left-3 sm:-left-4 -top-3 sm:-top-4 h-full w-full rounded-3xl border border-brand-gold/40" />
          {/* Offset red frame */}
          <div className="absolute -bottom-3 sm:-bottom-4 -right-3 sm:-right-4 h-full w-full rounded-3xl border border-brand-red/40" />

          {/* Portrait */}
          <div className="relative z-10 overflow-hidden rounded-3xl shadow-2xl">
            <img
              src="/chandan.jpg"
              alt="Chandan Naik"
              className="h-full w-full object-cover grayscale transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
            />
            {/* Tint overlay that fades on hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-darker/60 via-transparent to-transparent transition-opacity duration-700 group-hover:opacity-0" />
          </div>

          {/* Floating name plate */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="absolute -bottom-6 left-1/2 z-20 w-[80%] -translate-x-1/2 rounded-2xl border border-white/10 bg-brand-deep/90 px-6 py-4 text-center shadow-2xl backdrop-blur-xl md:left-auto md:right-6 md:w-auto md:-translate-x-0 md:text-left"
          >
            <h3 className="font-serif text-xl tracking-[0.3em] text-brand-gold md:text-2xl">
              CHANDAN NAIK
            </h3>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-brand-muted">
              Lead Artist
            </p>
          </motion.div>
        </motion.div>

        {/* Text Side */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="flex flex-col justify-center pt-10 md:pt-0"
        >
          {/* Eyebrow */}
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-brand-gold/50" />
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-brand-gold md:text-sm">
              The Creative Eye
            </span>
          </div>

          {/* Heading */}
          <h2 className="mb-6 font-serif text-4xl leading-tight text-white md:text-5xl lg:text-6xl">
            Hi, I'm{' '}
            <span className="bg-gradient-to-r from-brand-gold to-brand-gold-soft bg-clip-text text-transparent">
              Chandan
            </span>
          </h2>

          {/* Body */}
          <p className="mb-6 text-base font-light leading-relaxed text-brand-muted md:text-lg">
            With Candy Pic, I capture emotions that words can’t describe — love, laughter, and
            everything in between. I believe wedding photography is more than just taking pictures —
            it’s about preserving emotions, stories, and the magic that unfolds between moments.
          </p>

          <p className="mb-8 text-base font-light leading-relaxed text-brand-muted md:text-lg">
            Every frame I create is a blend of art, emotion, and storytelling — reflecting the true
            essence of your love story. At{' '}
            <span className="italic text-brand-gold">Weddings by Chandan</span>, your story is in
            good hands.
          </p>

          {/* Pull-quote */}
          <blockquote className="mb-8 border-l-2 border-brand-gold pl-5">
            <p className="font-serif text-xl italic leading-relaxed text-brand-text md:text-2xl">
              “It’s not just photography — it’s the art of turning moments into memories that last
              forever.”
            </p>
          </blockquote>

          {/* Credential chips */}
          <div className="flex flex-wrap gap-3">
            {chips.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.15em] text-brand-muted backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-gold/40 hover:text-brand-text md:text-sm"
              >
                <Icon className="text-brand-gold" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
