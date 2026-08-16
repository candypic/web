import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaHeart,
  FaRegHeart,
  FaCheckCircle,
  FaRegCheckCircle,
  FaDownload,
  FaShareAlt,
  FaCommentAlt,
  FaFilter,
  FaImages,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaPaperPlane,
  FaLock,
  FaCalendarAlt,
  FaMagic,
  FaCheck,
  FaInfoCircle,
  FaWhatsapp,
  FaRegSmileBeam,
} from 'react-icons/fa';
import {
  getClientEventBySlug,
  getEventPhotos,
  togglePhotoSelection,
  submitAlbumSelection,
  downloadImage,
} from '../lib/galleryApi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ALL_CATEGORY = 'All';

export default function ClientEventPortal() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // State
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [userRole, setUserRole] = useState('client'); // 'client' | 'guest'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & View Mode
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'album' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('');

  // Selections state: map of photoId -> { isAlbumSelected, isFavorite, clientNote }
  const [selections, setSelections] = useState({});

  // Lightbox & Modals
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeNotePhoto, setActiveNotePhoto] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientFinalNotes, setClientFinalNotes] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Check Auth and Fetch Event & Photos
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        setLoading(true);
        setError('');

        // Verify session authorization
        const authDataStr = sessionStorage.getItem(`portal_auth_${slug}`);
        if (!authDataStr) {
          navigate(`/portal/${slug}/login`);
          return;
        }

        const authData = JSON.parse(authDataStr);
        setUserRole(authData.role || 'client');

        // Fetch event metadata
        const eventData = await getClientEventBySlug(slug);
        if (!eventData) throw new Error('Event not found.');
        setEvent(eventData);

        // Fetch photos
        const photoList = await getEventPhotos(eventData.id);
        setPhotos(photoList);

        // Build selections map
        const initialSelections = {};
        photoList.forEach((p) => {
          if (p.photo_selections && p.photo_selections.length > 0) {
            const sel = p.photo_selections[0];
            initialSelections[p.id] = {
              isAlbumSelected: sel.is_album_selected || false,
              isFavorite: sel.is_favorite || false,
              clientNote: sel.client_note || '',
            };
          }
        });
        setSelections(initialSelections);
      } catch (err) {
        setError(err?.message || 'Could not load event gallery.');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [slug, navigate]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set();
    photos.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return [ALL_CATEGORY, ...Array.from(set).sort()];
  }, [photos]);

  // Filtered Photos
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      // Category filter
      if (activeCategory !== ALL_CATEGORY && p.category !== activeCategory) {
        return false;
      }
      // Proofing filter mode
      const sel = selections[p.id];
      if (filterMode === 'album' && !sel?.isAlbumSelected) return false;
      if (filterMode === 'favorites' && !sel?.isFavorite) return false;
      // Search query (by filename or category)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = (p.filename || '').toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        const matchesNote = (sel?.clientNote || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesNote) return false;
      }
      return true;
    });
  }, [photos, activeCategory, filterMode, searchQuery, selections]);

  // Highlights / Same-Day Photos
  const highlightPhotos = useMemo(() => {
    return photos.filter((p) => p.is_highlight);
  }, [photos]);

  // Total selected count
  const selectedAlbumCount = useMemo(() => {
    return Object.values(selections).filter((s) => s.isAlbumSelected).length;
  }, [selections]);

  const favoritesCount = useMemo(() => {
    return Object.values(selections).filter((s) => s.isFavorite).length;
  }, [selections]);

  const targetCount = event?.target_album_photos || 100;
  const progressPercent = Math.min(100, Math.round((selectedAlbumCount / targetCount) * 100));

  // Toggle Album Selection
  const handleToggleAlbum = useCallback(
    async (photoId, e) => {
      if (e) e.stopPropagation();
      if (userRole === 'guest') {
        alert('Guest view: Only the couple with the Master PIN can select album photos.');
        return;
      }

      const current = selections[photoId] || { isAlbumSelected: false, isFavorite: false, clientNote: '' };
      const nextState = !current.isAlbumSelected;

      // Optimistic update
      setSelections((prev) => ({
        ...prev,
        [photoId]: { ...current, isAlbumSelected: nextState },
      }));

      try {
        await togglePhotoSelection({
          eventId: event.id,
          photoId,
          isAlbumSelected: nextState,
        });
      } catch (err) {
        // Rollback
        setSelections((prev) => ({
          ...prev,
          [photoId]: current,
        }));
        console.error('Selection update error', err);
      }
    },
    [event, selections, userRole]
  );

  // Toggle Favorite
  const handleToggleFavorite = useCallback(
    async (photoId, e) => {
      if (e) e.stopPropagation();
      const current = selections[photoId] || { isAlbumSelected: false, isFavorite: false, clientNote: '' };
      const nextState = !current.isFavorite;

      setSelections((prev) => ({
        ...prev,
        [photoId]: { ...current, isFavorite: nextState },
      }));

      try {
        await togglePhotoSelection({
          eventId: event.id,
          photoId,
          isFavorite: nextState,
        });
      } catch (err) {
        setSelections((prev) => ({
          ...prev,
          [photoId]: current,
        }));
      }
    },
    [event, selections]
  );

  // Open Notes Modal
  const handleOpenNoteModal = (photo, e) => {
    if (e) e.stopPropagation();
    setActiveNotePhoto(photo);
    setNoteInput(selections[photo.id]?.clientNote || '');
  };

  // Save Note
  const handleSaveNote = async () => {
    if (!activeNotePhoto) return;
    const photoId = activeNotePhoto.id;
    const current = selections[photoId] || { isAlbumSelected: false, isFavorite: false, clientNote: '' };

    setSelections((prev) => ({
      ...prev,
      [photoId]: { ...current, clientNote: noteInput },
    }));

    try {
      await togglePhotoSelection({
        eventId: event.id,
        photoId,
        clientNote: noteInput,
      });
      setActiveNotePhoto(null);
    } catch (err) {
      console.error('Note save error', err);
    }
  };

  // Submit Album
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const selectedFilenames = photos
        .filter((p) => selections[p.id]?.isAlbumSelected)
        .map((p) => p.filename || p.r2_key);

      await submitAlbumSelection({
        eventId: event.id,
        clientName: event.client_name,
        clientPhone: event.client_phone,
        selectedFilenames,
        clientNotes: clientFinalNotes,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmitSuccess(false);
      }, 4000);
    } catch (err) {
      alert(`Submission failed: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Lightbox Navigation
  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  const showPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i - 1 + filteredPhotos.length) % filteredPhotos.length));
  }, [filteredPhotos.length]);

  const showNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i + 1) % filteredPhotos.length));
  }, [filteredPhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, showPrev, showNext]);

  // Copy share link
  const handleCopyLink = (role = 'guest') => {
    const url = `${window.location.origin}/portal/${slug}`;
    const message =
      role === 'guest'
        ? `📸 View ${event?.title || 'Wedding'} Photos on Candy Pic!\nLink: ${url}\nGuest Passcode: ${event?.guest_passcode || 'GUEST'}`
        : `📸 Client Access for ${event?.title || 'Wedding'}\nLink: ${url}\nMaster PIN: ${event?.passcode || '1234'}`;

    navigator.clipboard.writeText(message);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-brand-gold gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
        <p className="font-serif text-lg text-white">Opening Private Memory Vault...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center text-brand-text">
        <div className="w-16 h-16 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center text-2xl mb-4">
          <FaInfoCircle />
        </div>
        <h2 className="font-serif text-3xl text-white mb-2">Gallery Unavailable</h2>
        <p className="text-brand-muted max-w-md mb-6">{error || 'Event could not be loaded.'}</p>
        <Link
          to="/portal"
          className="rounded-full px-8 py-3.5 bg-brand-gold text-brand-dark font-semibold uppercase text-xs tracking-wider"
        >
          Enter Different Event PIN
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text relative selection:bg-brand-gold selection:text-brand-dark pb-28">
      <Navbar />

      {/* =========================================================================
          1. HERO HEADER (Cover Photo & Romantic Typography)
          ========================================================================= */}
      <section className="relative pt-24 pb-12 sm:pb-16 overflow-hidden bg-brand-darker">
        {/* Background Cover Overlay */}
        {event.cover_image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover object-center opacity-25 filter blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-darker/90 via-brand-darker/70 to-brand-dark" />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {/* Eyebrow / Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[11px] uppercase tracking-widest font-semibold">
                  <FaMagic size={10} /> Private Vault
                </span>

                {event.is_live_gallery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] uppercase tracking-widest font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Live Same-Day Gallery
                  </span>
                )}

                {userRole === 'guest' ? (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-brand-muted text-[11px] uppercase tracking-widest font-medium">
                    Guest View
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-brand-gold/20 text-brand-gold-soft text-[11px] uppercase tracking-widest font-medium">
                    Master / Selection Mode
                  </span>
                )}
              </div>

              {/* Event Title */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white leading-tight">
                {event.title}
              </h1>

              {/* Subtitle / Details */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-brand-muted text-sm font-light">
                <span className="flex items-center gap-1.5">
                  <FaCalendarAlt className="text-brand-gold" />
                  {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Celebration'}
                </span>
                <span>•</span>
                <span>{photos.length} High-Res Frames</span>
                <span>•</span>
                <span>Kumta &amp; Coastal Karnataka</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="rounded-full px-5 py-3 border border-white/20 text-white hover:border-brand-gold hover:text-brand-gold bg-white/5 backdrop-blur-md transition-all text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
              >
                <FaShareAlt /> Share Gallery
              </button>
            </div>
          </div>

          {/* Announcement Callout */}
          {event.announcement_text && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-white/[0.04] border border-brand-gold/20 p-4 flex items-start gap-3 text-xs sm:text-sm text-brand-muted font-light leading-relaxed"
            >
              <FaInfoCircle className="text-brand-gold text-base shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-medium">Studio Note: </strong>
                {event.announcement_text}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* =========================================================================
          2. SAME-DAY HIGHLIGHTS REEL (If marked as highlights)
          ========================================================================= */}
      {highlightPhotos.length > 0 && (
        <section className="py-8 bg-brand-darker/60 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping" />
                <h2 className="font-serif text-lg sm:text-xl text-white">Same-Day Highlights Reel</h2>
              </div>
              <span className="text-xs text-brand-muted uppercase tracking-widest font-medium">
                {highlightPhotos.length} Highlights
              </span>
            </div>

            {/* Horizontal Scroll Highlights */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
              {highlightPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(photos.findIndex((p) => p.id === photo.id))}
                  className="snap-start shrink-0 w-60 sm:w-72 aspect-[3/2] rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer shadow-xl bg-brand-deep"
                >
                  <img
                    src={photo.public_url}
                    alt={photo.filename}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between">
                    <span className="text-[11px] text-white font-serif truncate">{photo.category}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(photo);
                      }}
                      className="w-8 h-8 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center text-xs"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          3. CATEGORY CHIPS & PROOFING MODE SELECTOR
          ========================================================================= */}
      <section className="sticky top-20 z-30 bg-brand-dark/95 backdrop-blur-xl border-b border-white/10 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-brand-gold text-brand-dark shadow-md shadow-brand-gold/20'
                      : 'border border-white/10 text-brand-muted hover:text-white hover:border-white/30 bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Filter Mode: All vs Album Selection vs Favorites */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-white/20 text-white border border-white/40'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              All ({photos.length})
            </button>

            <button
              onClick={() => setFilterMode('album')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all ${
                filterMode === 'album'
                  ? 'bg-brand-gold text-brand-dark font-semibold'
                  : 'text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/10'
              }`}
            >
              <FaCheckCircle size={11} />
              Album ({selectedAlbumCount})
            </button>

            <button
              onClick={() => setFilterMode('favorites')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all ${
                filterMode === 'favorites'
                  ? 'bg-brand-red text-white font-semibold'
                  : 'text-brand-red/90 border border-brand-red/30 hover:bg-brand-red/10'
              }`}
            >
              <FaHeart size={11} />
              Starred ({favoritesCount})
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MAIN PHOTO GALLERY GRID (High-Res, Proofing Touchpoints)
          ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-8">
        {filteredPhotos.length === 0 ? (
          <div className="py-20 text-center bg-white/[0.02] border border-white/10 rounded-3xl p-10 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaImages />
            </div>
            <h3 className="font-serif text-2xl text-white mb-2">No Frames Found</h3>
            <p className="text-sm text-brand-muted font-light">
              {filterMode === 'album'
                ? 'You have not selected any photos for the album yet. Click the gold checkmark on photos to shortlist them!'
                : 'No photos match your current filter selection.'}
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
            {filteredPhotos.map((photo, index) => {
              const sel = selections[photo.id] || {};
              const isSelected = sel.isAlbumSelected;
              const isFav = sel.isFavorite;
              const hasNote = Boolean(sel.clientNote);

              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4 }}
                  className={`group relative mb-5 break-inside-avoid overflow-hidden rounded-2xl border transition-all duration-300 bg-brand-deep cursor-pointer ${
                    isSelected
                      ? 'border-brand-gold ring-2 ring-brand-gold shadow-xl shadow-brand-gold/20'
                      : 'border-white/10 hover:border-brand-gold/40'
                  }`}
                  onClick={() => setLightboxIndex(index)}
                >
                  {/* Photo Frame */}
                  <img
                    src={photo.public_url}
                    alt={photo.filename}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Gradient Veil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-70 group-hover:opacity-95 transition-opacity" />

                  {/* TOP ACTIONS: Favorite & Note */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(photo.id, e)}
                      aria-label="Star as favorite"
                      className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 ${
                        isFav
                          ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
                          : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60 border border-white/20'
                      }`}
                    >
                      {isFav ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                    </button>

                    {/* Note indicator / trigger */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenNoteModal(photo, e)}
                      aria-label="Add retouching notes"
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs backdrop-blur-md transition-all ${
                        hasNote
                          ? 'bg-brand-gold text-brand-dark font-bold shadow-md shadow-brand-gold/30'
                          : 'bg-black/40 text-white/70 hover:text-white border border-white/20'
                      }`}
                    >
                      <FaCommentAlt size={11} />
                      {hasNote && <span className="text-[10px] uppercase tracking-wider">Note</span>}
                    </button>
                  </div>

                  {/* BOTTOM ACTIONS: Album Selection Checkbox & Download */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
                    {/* Album Selection Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleAlbum(photo.id, e)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-lg active:scale-95 ${
                        isSelected
                          ? 'bg-brand-gold text-brand-dark shadow-brand-gold/30'
                          : 'bg-black/60 text-white hover:bg-brand-gold hover:text-brand-dark border border-white/20'
                      }`}
                    >
                      {isSelected ? <FaCheckCircle size={14} /> : <FaRegCheckCircle size={14} />}
                      {isSelected ? 'In Album' : 'Select for Album'}
                    </button>

                    {/* Quick Download */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(photo);
                      }}
                      aria-label="Download photo"
                      className="w-9 h-9 rounded-full bg-black/40 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-colors"
                    >
                      <FaDownload size={12} />
                    </button>
                  </div>

                  {/* Filename banner on bottom for reference */}
                  {photo.filename && (
                    <div className="absolute bottom-14 left-3 right-3 text-[10px] font-mono text-white/70 truncate pointer-events-none">
                      {photo.filename}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================================
          5. STICKY PROOFING DOCK (Floating Bottom App Bar)
          ========================================================================= */}
      {userRole === 'client' && (
        <div className="fixed bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-auto sm:right-8 sm:left-8 z-40 max-w-2xl mx-auto">
          <div className="bg-brand-darker/95 backdrop-blur-2xl border border-brand-gold/40 rounded-full p-2.5 sm:p-3 shadow-2xl shadow-black/80 flex items-center justify-between gap-3">
            {/* Progress counter & bar */}
            <div className="flex items-center gap-3 pl-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10 -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#d4af37"
                    strokeWidth="3"
                    strokeDasharray={100}
                    strokeDashoffset={100 - progressPercent}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[11px] font-mono font-bold text-brand-gold">
                  {selectedAlbumCount}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-white">
                  Album Selection: <span className="text-brand-gold">{selectedAlbumCount}</span> / {targetCount}
                </p>
                <p className="text-[10px] text-brand-muted font-light">
                  {selectedAlbumCount >= targetCount ? '✨ Target reached! Ready to submit.' : `${targetCount - selectedAlbumCount} more to choose`}
                </p>
              </div>
            </div>

            {/* Final Submit Button */}
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="rounded-full px-6 py-3 bg-brand-gold text-brand-dark font-semibold uppercase text-xs tracking-wider hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/30 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <FaPaperPlane size={11} /> Submit Album
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. LIGHTBOX MODAL (Fullscreen High-Res + Gestures + Notes)
          ========================================================================= */}
      <AnimatePresence>
        {currentLightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-3 sm:p-6"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <FaTimes size={18} />
            </button>

            {/* Prev */}
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FaChevronLeft size={18} />
              </button>
            )}

            {/* Next */}
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FaChevronRight size={18} />
              </button>
            )}

            {/* Lightbox Center Container */}
            <div
              className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentLightboxPhoto.public_url}
                alt={currentLightboxPhoto.filename}
                className="max-h-[70vh] sm:max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />

              {/* Bottom toolbar inside lightbox */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 w-full bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="text-left">
                  <p className="font-serif text-sm sm:text-base text-white">{currentLightboxPhoto.filename}</p>
                  <p className="text-xs text-brand-gold uppercase tracking-wider mt-0.5">
                    Category: {currentLightboxPhoto.category}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Select for album inside lightbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleAlbum(currentLightboxPhoto.id)}
                    className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                      selections[currentLightboxPhoto.id]?.isAlbumSelected
                        ? 'bg-brand-gold text-brand-dark'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    <FaCheckCircle />
                    {selections[currentLightboxPhoto.id]?.isAlbumSelected ? 'In Album' : 'Add to Album'}
                  </button>

                  {/* Add Note */}
                  <button
                    type="button"
                    onClick={() => handleOpenNoteModal(currentLightboxPhoto)}
                    className="rounded-full p-2.5 bg-white/10 text-white border border-white/20 hover:text-brand-gold"
                  >
                    <FaCommentAlt size={14} />
                  </button>

                  {/* Download */}
                  <button
                    type="button"
                    onClick={() => downloadImage(currentLightboxPhoto)}
                    className="rounded-full px-4 py-2.5 bg-brand-gold text-brand-dark font-semibold text-xs uppercase flex items-center gap-2"
                  >
                    <FaDownload /> Download
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          7. RETOUCH NOTE MODAL (Client specific photo instructions)
          ========================================================================= */}
      <AnimatePresence>
        {activeNotePhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md bg-brand-deep border border-brand-gold/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setActiveNotePhoto(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
              >
                <FaTimes size={14} />
              </button>

              <h3 className="font-serif text-2xl text-white mb-1">Retouching Instructions</h3>
              <p className="text-xs text-brand-muted font-light mb-4">
                Photo: <span className="text-brand-gold font-mono">{activeNotePhoto.filename}</span>
              </p>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {['Black & White version', 'Album Cover candidate', 'Retouch lighting', 'Crop background'].map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNoteInput((prev) => (prev ? `${prev}, ${preset}` : preset))}
                      className="text-[11px] rounded-full px-3 py-1 bg-white/5 border border-white/10 hover:border-brand-gold text-brand-muted hover:text-white transition-colors"
                    >
                      + {preset}
                    </button>
                  )
                )}
              </div>

              <textarea
                rows={3}
                placeholder="e.g. Please soften the glare on the left, or convert this frame into black and white..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full rounded-2xl bg-black/30 border border-white/10 p-4 text-white text-sm placeholder:text-brand-muted/40 outline-none focus:border-brand-gold"
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveNotePhoto(null)}
                  className="rounded-full px-5 py-2.5 text-xs text-brand-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="rounded-full px-6 py-2.5 bg-brand-gold text-brand-dark font-semibold text-xs uppercase tracking-wider"
                >
                  Save Instructions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          8. SUBMIT ALBUM MODAL (Finalization & Celebration)
          ========================================================================= */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg bg-brand-deep border border-brand-gold/40 rounded-3xl p-7 sm:p-10 shadow-2xl relative text-center"
            >
              {submitSuccess ? (
                <div className="py-8">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce">
                    <FaCheck />
                  </div>
                  <h3 className="font-serif text-3xl text-white mb-2">Album Selection Submitted!</h3>
                  <p className="text-sm text-brand-muted font-light max-w-sm mx-auto leading-relaxed">
                    Thank you, {event.client_name}! Chandan &amp; the Candy Pic team have received your shortlist of{' '}
                    <strong className="text-brand-gold">{selectedAlbumCount} photos</strong>. We will begin designing your physical album!
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 text-brand-gold flex items-center justify-center mx-auto mb-4 text-2xl">
                    <FaPaperPlane />
                  </div>

                  <h3 className="font-serif text-3xl text-white mb-2">Finalize Album Selection</h3>
                  <p className="text-sm text-brand-muted font-light mb-6">
                    You have shortlisted <strong className="text-brand-gold">{selectedAlbumCount}</strong> of{' '}
                    <strong>{targetCount}</strong> photos for your printed wedding album.
                  </p>

                  <div className="text-left mb-6">
                    <label className="block text-xs uppercase tracking-widest text-brand-gold font-medium mb-2">
                      Any Final Notes / Album Cover Wishes?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Please use the sunset portrait (DSC_0450) as the front embossed cover..."
                      value={clientFinalNotes}
                      onChange={(e) => setClientFinalNotes(e.target.value)}
                      className="w-full rounded-2xl bg-black/30 border border-white/10 p-4 text-white text-sm placeholder:text-brand-muted/40 outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(false)}
                      className="flex-1 rounded-full py-3.5 border border-white/20 text-white text-xs uppercase tracking-wider font-semibold"
                    >
                      Keep Editing
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleFinalSubmit}
                      className="flex-1 rounded-full py-3.5 bg-brand-gold text-brand-dark text-xs uppercase tracking-wider font-bold hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/30 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Submitting...' : 'Confirm & Send to Studio'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          9. SHARE GALLERY MODAL (Guest vs Family Access)
          ========================================================================= */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md bg-brand-deep border border-brand-gold/30 rounded-3xl p-7 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
              >
                <FaTimes size={14} />
              </button>

              <h3 className="font-serif text-2xl text-white mb-2">Share Your Wedding Gallery</h3>
              <p className="text-xs text-brand-muted font-light mb-6">
                Share this link with family and friends so they can view and download the wedding memories.
              </p>

              {/* Guest Share Card */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white">Guest Viewing Access</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-brand-gold">
                    PIN: {event.guest_passcode || 'GUEST'}
                  </span>
                </div>
                <p className="text-[11px] text-brand-muted font-light mb-3">
                  Guests can view the gallery and download individual photos (no album editing permissions).
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyLink('guest')}
                  className="w-full rounded-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs uppercase font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {copiedLink ? <FaCheck className="text-emerald-400" /> : <FaShareAlt />}
                  {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Guest Invite Link'}
                </button>
              </div>

              {/* WhatsApp Broadcast Shortcut */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `📸 View ${event.title} photos on Candy Pic:\n${window.location.origin}/portal/${slug}\nPasscode: ${event.guest_passcode || 'GUEST'}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-full py-3 bg-[#25D366] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <FaWhatsapp size={16} /> Share Directly on WhatsApp
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
