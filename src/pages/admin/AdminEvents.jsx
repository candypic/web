import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FaFolderOpen,
  FaPlus,
  FaCloudUploadAlt,
  FaTrashAlt,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaShareAlt,
  FaWhatsapp,
  FaEye,
  FaImages,
  FaCommentAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaTimes,
  FaFilter,
  FaMagic,
  FaLock,
  FaDownload,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  listClientEvents,
  createClientEvent,
  updateClientEvent,
  deleteClientEvent,
  getEventPhotos,
  uploadEventPhoto,
  deleteEventPhoto,
  getAlbumSubmissions,
  formatLightroomList,
  downloadImage,
} from '../../lib/galleryApi';
import { runWithConcurrency } from '../../utils/concurrency';

const UPLOAD_CONCURRENCY = 4;

const CATEGORIES = [
  'Ceremony',
  'Highlights',
  'Haldi',
  'Mehendi',
  'Muhurtham',
  'Couple',
  'Reception',
  'Family',
];

export default function AdminEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEventIdParam = searchParams.get('select');

  // Events list & active selection
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active event photos & proofing
  const [photos, setPhotos] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'upload' | 'proofing' | 'settings'
  const [photosLoading, setPhotosLoading] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail' for phone screens

  // Create Event Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    slug: '',
    client_name: '',
    client_phone: '',
    event_date: '',
    passcode: '1234',
    guest_passcode: 'GUEST',
    target_album_photos: 100,
    is_live_gallery: false,
    announcement_text: 'Welcome to your private memory vault! Select your favourite photos for the wedding album.',
  });
  const [creating, setCreating] = useState(false);

  // Upload state
  const [uploadCategory, setUploadCategory] = useState('Ceremony');
  const [isHighlightBatch, setIsHighlightBatch] = useState(false);
  const [uploads, setUploads] = useState([]); // { id, name, progress, status, error }
  const fileInputRef = useRef(null);

  // Copy Feedback
  const [copiedLightroom, setCopiedLightroom] = useState(false);

  // 1. Fetch Events
  const loadEvents = useCallback(async (autoSelectId) => {
    try {
      setLoading(true);
      const data = await listClientEvents();
      setEvents(data);

      const targetId = autoSelectId || selectedEventIdParam;
      if (targetId) {
        const found = data.find((e) => e.id === targetId);
        if (found) {
          setSelectedEvent(found);
          return;
        }
      }

      setSelectedEvent((prev) => {
        if (prev && data.some((e) => e.id === prev.id)) return prev;
        return data.length > 0 ? data[0] : null;
      });
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEventIdParam]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 2. Fetch Photos and Submissions for Selected Event
  useEffect(() => {
    if (!selectedEvent?.id) {
      setPhotos([]);
      setSubmissions([]);
      return;
    }

    const loadEventDetails = async () => {
      try {
        setPhotosLoading(true);
        const [photoList, subList] = await Promise.all([
          getEventPhotos(selectedEvent.id),
          getAlbumSubmissions(selectedEvent.id),
        ]);
        setPhotos(photoList);
        setSubmissions(subList);
      } catch (err) {
        console.error('Error loading event photos:', err);
      } finally {
        setPhotosLoading(false);
      }
    };

    loadEventDetails();
  }, [selectedEvent?.id]);

  // Handle Event Selection
  const handleSelectEvent = (evt) => {
    setSelectedEvent(evt);
    setMobileView('detail');
    setSearchParams({ select: evt.id });
  };

  // Auto slug generation
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setNewEvent((prev) => ({ ...prev, title, slug: generatedSlug }));
  };

  // Create Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await createClientEvent(newEvent);
      setEvents((prev) => [created, ...prev]);
      setSelectedEvent(created);
      setIsCreateModalOpen(false);
      setNewEvent({
        title: '',
        slug: '',
        client_name: '',
        client_phone: '',
        event_date: '',
        passcode: '1234',
        guest_passcode: 'GUEST',
        target_album_photos: 100,
        is_live_gallery: false,
        announcement_text: 'Welcome to your private memory vault! Select your favourite photos for the wedding album.',
      });
    } catch (err) {
      alert(`Could not create event: ${err?.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Handle Uploads to R2
  const handleFiles = useCallback(
    async (fileList) => {
      if (!selectedEvent) return;
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;

      const batch = files.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        progress: 0,
        status: 'uploading',
        error: '',
      }));

      setUploads((prev) => [...batch, ...prev]);

      const pairs = files.map((file, i) => ({ file, item: batch[i] }));

      await runWithConcurrency(pairs, UPLOAD_CONCURRENCY, async ({ file, item }) => {
        try {
          const inserted = await uploadEventPhoto(file, selectedEvent.id, {
            category: uploadCategory,
            isHighlight: isHighlightBatch,
            onProgress: (p) =>
              setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, progress: p } : u))),
          });

          setPhotos((prev) => [...prev, inserted]);
          setUploads((prev) =>
            prev.map((u) => (u.id === item.id ? { ...u, progress: 100, status: 'done' } : u))
          );
        } catch (err) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: 'error', error: err?.message || 'Upload failed' } : u
            )
          );
        }
      });

      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status === 'error'));
      }, 4000);
    },
    [selectedEvent, uploadCategory, isHighlightBatch]
  );

  // Delete Photo
  const handleDeletePhoto = async (photo) => {
    if (!window.confirm(`Delete photo "${photo.filename}"?`)) return;
    try {
      await deleteEventPhoto(photo);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (err) {
      alert(`Could not delete photo: ${err?.message}`);
    }
  };

  // Selected Photos for Album
  const selectedAlbumPhotos = useMemo(() => {
    return photos.filter((p) => {
      const sel = p.photo_selections?.[0];
      return sel?.is_album_selected;
    });
  }, [photos]);

  // Copy Lightroom list
  const handleCopyLightroom = () => {
    const filenames = selectedAlbumPhotos.map((p) => p.filename);
    const formatted = formatLightroomList(filenames);
    navigator.clipboard.writeText(formatted);
    setCopiedLightroom(true);
    setTimeout(() => setCopiedLightroom(false), 2500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Filename', 'Category', 'Client Retouch Note'],
      ...selectedAlbumPhotos.map((p) => [
        p.filename,
        p.category,
        p.photo_selections?.[0]?.client_note || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEvent.slug}-album-selection.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update Status
  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await updateClientEvent(selectedEvent.id, { status: newStatus });
      setSelectedEvent(updated);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      alert(`Failed to update status: ${err?.message}`);
    }
  };

  return (
    <AdminLayout
      title="Client Vaults &amp; Proofing"
      subtitle="Manage private couple galleries, bulk R2 uploads, and album selections"
      actions={
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-full px-5 py-2.5 bg-brand-gold text-brand-dark font-semibold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 flex items-center gap-2 cursor-pointer"
        >
          <FaPlus size={10} /> New Client Vault
        </button>
      }
    >
      <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
        {/* =========================================================================
            1. LEFT PANEL: EVENTS LIST (Hidden on mobile when an event is selected)
            ========================================================================= */}
        <div className={`${mobileView === 'detail' && selectedEvent ? 'hidden lg:block' : 'block'} lg:col-span-4 space-y-4`}>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl">
            <h2 className="font-serif text-base sm:text-lg text-white mb-3 sm:mb-4">All Client Vaults ({events.length})</h2>

            {loading ? (
              <p className="text-xs text-brand-muted py-6 text-center">Loading client vaults...</p>
            ) : events.length === 0 ? (
              <p className="text-xs text-brand-muted py-6 text-center">No client vaults created yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
                {events.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleSelectEvent(evt)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-gold/15 border-brand-gold shadow-lg shadow-brand-gold/10'
                          : 'bg-black/20 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-serif text-sm text-white font-medium truncate">{evt.title}</h3>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                            evt.status === 'submitted'
                              ? 'bg-brand-gold text-brand-dark'
                              : evt.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/10 text-brand-muted'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </div>

                      <p className="text-xs text-brand-muted font-light truncate">
                        {evt.client_name} • {evt.event_date || 'No Date'}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-brand-gold/80 font-mono">
                        <span>PIN: {evt.passcode}</span>
                        <span>{evt.slug}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. RIGHT PANEL: SELECTED EVENT WORKSPACE
            ========================================================================= */}
        <div className={`${mobileView === 'list' && selectedEvent ? 'hidden lg:block' : 'block'} lg:col-span-8 space-y-6`}>
          {selectedEvent ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-8 shadow-xl">
              {/* Mobile Back Button */}
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="lg:hidden mb-4 px-3 py-1.5 rounded-full bg-white/10 text-xs text-brand-gold font-semibold flex items-center gap-1.5 hover:bg-white/20 transition-colors w-fit"
              >
                <FaChevronLeft size={10} /> Back to All Vaults
              </button>

              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-serif text-2xl sm:text-3xl text-white">{selectedEvent.title}</h2>
                    {selectedEvent.is_live_gallery && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider animate-pulse">
                        Live Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-brand-muted font-light">
                    {selectedEvent.client_name} ({selectedEvent.client_phone}) • Date: {selectedEvent.event_date} • PIN:{' '}
                    <span className="font-mono text-brand-gold font-bold">{selectedEvent.passcode}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/portal/${selectedEvent.slug}`}
                    target="_blank"
                    className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                  >
                    <FaExternalLinkAlt size={11} /> Open Portal
                  </Link>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `📸 Hi ${selectedEvent.client_name}! Your wedding gallery on Candy Pic is ready:\n${window.location.origin}/portal/${selectedEvent.slug}\nYour PIN: ${selectedEvent.passcode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full px-4 py-2 bg-[#25D366] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <FaWhatsapp size={13} /> Send PIN
                  </a>
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="flex items-center gap-3 mt-6 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === 'photos'
                      ? 'bg-brand-gold text-brand-dark'
                      : 'text-brand-muted hover:text-white bg-white/5'
                  }`}
                >
                  Gallery ({photos.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    activeTab === 'upload'
                      ? 'bg-brand-gold text-brand-dark'
                      : 'text-brand-muted hover:text-white bg-white/5'
                  }`}
                >
                  <FaCloudUploadAlt size={14} /> Bulk Upload
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('proofing')}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    activeTab === 'proofing'
                      ? 'bg-brand-gold text-brand-dark'
                      : 'text-brand-muted hover:text-white bg-white/5'
                  }`}
                >
                  <FaCheckCircle size={12} /> Album Proofs ({selectedAlbumPhotos.length})
                </button>
              </div>

              {/* TAB 1: PHOTO GALLERY */}
              {activeTab === 'photos' && (
                <div className="mt-6">
                  {photosLoading ? (
                    <p className="text-center text-xs text-brand-muted py-10">Loading photos...</p>
                  ) : photos.length === 0 ? (
                    <div className="text-center py-12 bg-black/20 rounded-3xl border border-dashed border-white/10 p-8">
                      <FaImages className="text-3xl text-brand-gold/60 mx-auto mb-3" />
                      <h3 className="font-serif text-lg text-white mb-1">No Photos in this Vault</h3>
                      <p className="text-xs text-brand-muted mb-4 font-light">
                        Upload high-res frames to this couple&apos;s gallery.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className="rounded-full px-6 py-2.5 bg-brand-gold text-brand-dark font-semibold text-xs uppercase tracking-wider"
                      >
                        Start Uploading
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                      {photos.map((p) => (
                        <div
                          key={p.id}
                          className="group relative aspect-[3/2] rounded-2xl overflow-hidden bg-brand-deep border border-white/10"
                        >
                          <img
                            src={p.public_url}
                            alt={p.filename}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=60';
                            }}
                            className="w-full h-full object-cover"
                          />

                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold w-fit">
                              {p.category}
                            </span>

                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono text-white/80 truncate">{p.filename}</span>
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(p)}
                                className="w-7 h-7 rounded-full bg-brand-red/80 hover:bg-brand-red text-white flex items-center justify-center text-xs"
                              >
                                <FaTrashAlt size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BULK UPLOAD TO R2 */}
              {activeTab === 'upload' && (
                <div className="mt-6 space-y-5">
                  {/* Category & Highlight Selector */}
                  <div className="flex flex-wrap items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/10">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                        Assign Category
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="rounded-xl bg-brand-deep border border-white/15 px-4 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-brand-muted cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        checked={isHighlightBatch}
                        onChange={(e) => setIsHighlightBatch(e.target.checked)}
                        className="rounded accent-brand-gold"
                      />
                      <span>Mark as Same-Day Highlights Reel</span>
                    </label>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-3xl border-2 border-dashed border-white/20 hover:border-brand-gold p-10 text-center bg-white/[0.02] hover:bg-brand-gold/5 transition-all"
                  >
                    <FaCloudUploadAlt className="text-5xl text-brand-gold/70 mx-auto mb-3" />
                    <p className="font-serif text-lg text-white">Click or drag photos to upload</p>
                    <p className="text-xs text-brand-muted mt-1">
                      Target category: <strong className="text-brand-gold">{uploadCategory}</strong>
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        handleFiles(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Upload Progress Chips */}
                  {uploads.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uploads.map((u) => (
                        <div key={u.id} className="p-3 bg-black/30 rounded-xl border border-white/5 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white truncate">{u.name}</span>
                            <span
                              className={`font-semibold ${
                                u.status === 'done'
                                  ? 'text-emerald-400'
                                  : u.status === 'error'
                                  ? 'text-brand-red'
                                  : 'text-brand-gold'
                              }`}
                            >
                              {u.status === 'done' ? 'Uploaded' : u.status === 'error' ? 'Failed' : `${u.progress}%`}
                            </span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-gold transition-all duration-200"
                              style={{ width: `${u.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ALBUM PROOFING & LIGHTROOM EXPORT */}
              {activeTab === 'proofing' && (
                <div className="mt-6 space-y-6">
                  {/* Status & Export Actions Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/30 border border-brand-gold/30">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand-gold font-semibold">
                        Couple&apos;s Album Shortlist
                      </p>
                      <p className="text-sm text-white font-medium mt-0.5">
                        <strong className="text-brand-gold">{selectedAlbumPhotos.length}</strong> of{' '}
                        {selectedEvent.target_album_photos} photos selected
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1-Click Copy Lightroom List */}
                      <button
                        type="button"
                        onClick={handleCopyLightroom}
                        disabled={selectedAlbumPhotos.length === 0}
                        className="rounded-full px-4 py-2 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-brand-gold-soft transition-all shadow-md disabled:opacity-50"
                      >
                        {copiedLightroom ? <FaCheck /> : <FaCopy />}
                        {copiedLightroom ? 'Copied Lightroom Filter!' : 'Copy for Lightroom'}
                      </button>

                      {/* Export CSV */}
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={selectedAlbumPhotos.length === 0}
                        className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <FaDownload size={11} /> Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Submission History / Client Notes */}
                  {submissions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
                      <p className="font-semibold text-white mb-1">Latest Submission Instructions:</p>
                      <p className="text-brand-muted italic font-light">
                        &quot;{submissions[0].client_notes || 'No special cover notes provided.'}&quot;
                      </p>
                    </div>
                  )}

                  {/* Proofing Grid */}
                  {selectedAlbumPhotos.length === 0 ? (
                    <p className="text-center text-xs text-brand-muted py-10">
                      The couple has not shortlisted any photos for their album yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedAlbumPhotos.map((p) => {
                        const note = p.photo_selections?.[0]?.client_note;
                        return (
                          <div
                            key={p.id}
                            className="group relative aspect-[3/2] rounded-2xl overflow-hidden bg-brand-deep border border-brand-gold/40 shadow-md"
                          >
                            <img src={p.public_url} alt={p.filename} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2.5 flex flex-col justify-between">
                              <span className="text-[9px] px-2 py-0.5 rounded bg-brand-gold text-brand-dark font-bold w-fit">
                                Selected
                              </span>

                              <div>
                                <p className="text-[10px] font-mono text-white font-semibold truncate">{p.filename}</p>
                                {note && (
                                  <p className="text-[9px] text-brand-gold-soft mt-0.5 truncate flex items-center gap-1">
                                    <FaCommentAlt size={8} /> {note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center text-brand-muted">
              <FaFolderOpen className="text-4xl text-brand-gold/40 mx-auto mb-3" />
              <h3 className="font-serif text-xl text-white mb-2">No Vault Selected</h3>
              <p className="text-xs font-light">Select a client vault from the left or create a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          CREATE EVENT MODAL
          ========================================================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg bg-brand-deep border border-brand-gold/40 rounded-3xl p-7 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
              >
                <FaTimes size={14} />
              </button>

              <h3 className="font-serif text-2xl text-white mb-1">Create New Client Vault</h3>
              <p className="text-xs text-brand-muted font-light mb-6">
                Set up a private wedding gallery for your couple with proofing and selection.
              </p>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-brand-muted mb-1 font-semibold">
                    Wedding Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya & Rahul's Wedding"
                    value={newEvent.title}
                    onChange={handleTitleChange}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-brand-muted mb-1 font-semibold">
                      Client Names
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Priya & Rahul"
                      value={newEvent.client_name}
                      onChange={(e) => setNewEvent({ ...newEvent, client_name: e.target.value })}
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-brand-muted mb-1 font-semibold">
                      Client Phone
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={newEvent.client_phone}
                      onChange={(e) => setNewEvent({ ...newEvent, client_phone: e.target.value })}
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-brand-muted mb-1 font-semibold">
                      Event Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newEvent.event_date}
                      onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-brand-muted mb-1 font-semibold">
                      Master PIN
                    </label>
                    <input
                      type="text"
                      required
                      value={newEvent.passcode}
                      onChange={(e) => setNewEvent({ ...newEvent, passcode: e.target.value })}
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-xs text-white outline-none focus:border-brand-gold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-brand-muted mb-1 font-semibold">
                      Target Photos
                    </label>
                    <input
                      type="number"
                      value={newEvent.target_album_photos}
                      onChange={(e) => setNewEvent({ ...newEvent, target_album_photos: e.target.value })}
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-xs text-white outline-none focus:border-brand-gold font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-brand-muted cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newEvent.is_live_gallery}
                    onChange={(e) => setNewEvent({ ...newEvent, is_live_gallery: e.target.checked })}
                    className="rounded accent-brand-gold"
                  />
                  <span>Enable Live Same-Day Gallery mode</span>
                </label>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-full px-5 py-2.5 text-xs text-brand-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-full px-6 py-2.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider disabled:opacity-60"
                  >
                    {creating ? 'Creating...' : 'Create Vault'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
