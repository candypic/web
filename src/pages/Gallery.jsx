import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaDownload,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaImages,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { listPublishedImages, downloadImage } from '../lib/galleryApi';

const ALL = 'All';

// --- Eyebrow label (design-system pattern) ---
const Eyebrow = ({ children }) => (
  <span className="inline-flex items-center gap-3">
    <span className="h-px w-10 bg-brand-gold/50" />
    <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gold font-medium">
      {children}
    </span>
  </span>
);

// --- Loading skeleton grid ---
const SkeletonGrid = () => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
    {Array.from({ length: 9 }).map((_, i) => (
      <div
        key={i}
        className="mb-6 break-inside-avoid rounded-3xl bg-white/5 border border-white/10 animate-pulse"
        style={{ height: `${220 + (i % 3) * 90}px` }}
        aria-hidden="true"
      />
    ))}
  </div>
);

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [lightboxIndex, setLightboxIndex] = useState(null); // index into filtered[]
  const [downloadingId, setDownloadingId] = useState(null);

  // --- Load published images on mount ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listPublishedImages();
        if (!cancelled) setImages(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled)
          setError(
            err?.message ||
              'We could not load the gallery right now. Please try again shortly.'
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Distinct categories for filter chips ---
  const categories = useMemo(() => {
    const set = new Set();
    images.forEach((img) => {
      if (img.category) set.add(img.category);
    });
    return [ALL, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [images]);

  // --- Client-side filtered grid ---
  const filtered = useMemo(() => {
    if (activeCategory === ALL) return images;
    return images.filter((img) => img.category === activeCategory);
  }, [images, activeCategory]);

  // If the active category disappears (e.g. after a reload), fall back to All.
  useEffect(() => {
    if (activeCategory !== ALL && !categories.includes(activeCategory)) {
      setActiveCategory(ALL);
    }
  }, [categories, activeCategory]);

  const currentImage =
    lightboxIndex !== null ? filtered[lightboxIndex] : null;

  // --- Download handler (shared by overlay + lightbox) ---
  const handleDownload = useCallback(async (image, e) => {
    if (e) e.stopPropagation();
    if (!image) return;
    try {
      setDownloadingId(image.id);
      await downloadImage(image);
    } catch {
      /* downloadImage already falls back to opening the URL */
    } finally {
      setDownloadingId((prev) => (prev === image.id ? null : prev));
    }
  }, []);

  // --- Lightbox controls ---
  const openLightbox = useCallback((index) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const showPrev = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? i : (i - 1 + filtered.length) % filtered.length
    );
  }, [filtered.length]);

  const showNext = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? i : (i + 1) % filtered.length
    );
  }, [filtered.length]);

  // --- Keyboard navigation + body scroll lock while lightbox open ---
  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = original;
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  return (
    <div name="gallery" className="bg-brand-dark min-h-screen text-brand-text">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20 md:pb-32">
        {/* ---------- HEADER ---------- */}
        <section className="relative overflow-hidden">
          {/* soft radial glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-10 right-0 w-80 h-80 bg-brand-red/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-10 md:pt-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center flex flex-col items-center"
            >
              <Eyebrow>Gallery</Eyebrow>
              <h1 className="mt-6 font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                The{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-brand-gold-soft">
                  Gallery
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-brand-muted text-base md:text-lg leading-relaxed font-light">
                Browse and download your favourite moments.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ---------- FILTER CHIPS ---------- */}
        {!loading && !error && images.length > 0 && categories.length > 1 && (
          <div className="max-w-7xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={active}
                    className={`rounded-full px-5 py-2.5 text-sm tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                      active
                        ? 'bg-brand-gold text-brand-dark font-semibold shadow-lg shadow-brand-gold/20'
                        : 'border border-white/15 text-brand-muted hover:text-white hover:border-white/40 hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- GRID / STATES ---------- */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 mt-10 md:mt-14">
          {/* Loading */}
          {loading && <SkeletonGrid />}

          {/* Error */}
          {!loading && error && (
            <div className="mx-auto max-w-lg bg-white/5 backdrop-blur-xl border border-brand-red/30 rounded-3xl shadow-2xl p-10 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/15 text-brand-red">
                <FaImages size={26} />
              </div>
              <h2 className="font-serif text-2xl text-white">Something went wrong</h2>
              <p className="mt-3 text-brand-muted font-light">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && images.length === 0 && (
            <div className="mx-auto max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                <FaImages size={30} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-white">
                No photos published yet
              </h2>
              <p className="mt-3 text-brand-muted font-light leading-relaxed">
                Our latest galleries are being curated. Please check back soon to
                browse and download your moments.
              </p>
            </div>
          )}

          {/* Empty within a filter */}
          {!loading && !error && images.length > 0 && filtered.length === 0 && (
            <div className="mx-auto max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-10 text-center">
              <h2 className="font-serif text-2xl text-white">Nothing here yet</h2>
              <p className="mt-3 text-brand-muted font-light">
                No photos in “{activeCategory}”.
              </p>
            </div>
          )}

          {/* Masonry grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
              {filtered.map((image, index) => (
                <motion.figure
                  key={image.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: (index % 3) * 0.05 }}
                  className="group relative mb-6 break-inside-avoid overflow-hidden rounded-3xl border border-white/10 bg-brand-deep shadow-2xl cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={image.public_url}
                    alt={image.title || 'Candy Pic gallery photograph'}
                    loading="lazy"
                    width={image.width || undefined}
                    height={image.height || undefined}
                    className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* gradient + meta + download overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-darker/85 via-brand-darker/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <figcaption className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="min-w-0">
                      {image.title && (
                        <p className="font-serif text-lg text-white truncate">
                          {image.title}
                        </p>
                      )}
                      {image.category && (
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-gold mt-1">
                          {image.category}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDownload(image, e)}
                      disabled={downloadingId === image.id}
                      aria-label={`Download ${image.title || 'photo'}`}
                      className="pointer-events-auto shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 bg-brand-gold text-brand-dark font-semibold uppercase tracking-wide text-xs hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:opacity-60"
                    >
                      <FaDownload />
                      {downloadingId === image.id ? 'Saving…' : 'Download'}
                    </button>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ---------- LIGHTBOX ---------- */}
      <AnimatePresence>
        {currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-darker/95 backdrop-blur-md p-4 sm:p-8"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={currentImage.title || 'Photo preview'}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close"
              className="absolute top-3 right-3 md:top-6 md:right-6 z-10 inline-flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              <FaTimes size={20} />
            </button>

            {/* Prev */}
            {filtered.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Previous photo"
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              >
                <FaChevronLeft size={20} />
              </button>
            )}

            {/* Next */}
            {filtered.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Next photo"
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              >
                <FaChevronRight size={20} />
              </button>
            )}

            {/* Image + meta panel */}
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="relative flex flex-col items-center max-w-5xl w-full px-10 md:px-0"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage.public_url}
                alt={currentImage.title || 'Candy Pic gallery photograph'}
                className="max-h-[50vh] sm:max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />

              <div className="mt-5 sm:mt-6 flex w-full flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="min-w-0">
                  {currentImage.title && (
                    <h3 className="font-serif text-xl md:text-2xl text-white truncate">
                      {currentImage.title}
                    </h3>
                  )}
                  {currentImage.category && (
                    <p className="text-xs uppercase tracking-[0.25em] text-brand-gold mt-1.5">
                      {currentImage.category}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDownload(currentImage, e)}
                  disabled={downloadingId === currentImage.id}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full px-8 py-4 bg-brand-gold text-brand-dark font-semibold tracking-wide uppercase text-sm hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:opacity-60"
                >
                  <FaDownload />
                  {downloadingId === currentImage.id ? 'Saving…' : 'Download'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Gallery;
