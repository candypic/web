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
  FaChevronLeft,
  FaCalendarAlt,
  FaPhone,
  FaSearch,
  FaCog,
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
  'All',
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

  // Search & Filter for Master Grid
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'submitted' | 'active' | 'delivered'

  // Active event photos & proofing
  const [photos, setPhotos] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'upload' | 'proofing' | 'settings'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [photosLoading, setPhotosLoading] = useState(false);

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
  const [copiedPinId, setCopiedPinId] = useState(null);

  // 1. Fetch Events
  const loadEvents = useCallback(async (autoSelectId) => {
    try {
      setLoading(true);
      const data = await listClientEvents();
      setEvents(data || []);

      const targetId = autoSelectId || selectedEventIdParam;
      if (targetId) {
        const found = (data || []).find((e) => e.id === targetId);
        if (found) {
          setSelectedEvent(found);
          return;
        }
      }
      // If no explicit ID in URL, remain on master Vaults grid
      if (!targetId) {
        setSelectedEvent(null);
      }
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
        setPhotos(photoList || []);
        setSubmissions(subList || []);
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
    setActiveTab('photos');
    setSearchParams({ select: evt.id });
  };

  // Back to All Vaults Grid
  const handleBackToGrid = () => {
    setSelectedEvent(null);
    setSearchParams({});
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
      setSearchParams({ select: created.id });
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
      alert(`Could not create vault: ${err?.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Handle Uploads to R2 / Supabase Storage
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

  // Delete Vault
  const handleDeleteVault = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete the vault "${eventTitle}"? All uploaded photos will be removed.`)) return;
    try {
      await deleteClientEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      if (selectedEvent?.id === eventId) {
        handleBackToGrid();
      }
    } catch (err) {
      alert(`Failed to delete vault: ${err?.message}`);
    }
  };

  // Filtered Photos for Gallery Tab
  const filteredPhotos = useMemo(() => {
    if (selectedCategoryFilter === 'All') return photos;
    return photos.filter((p) => p.category === selectedCategoryFilter);
  }, [photos, selectedCategoryFilter]);

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

  // Copy PIN Helper
  const handleCopyPin = (pin, id) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinId(id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  // Filtered Vaults for Master Grid
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.client_phone && e.client_phone.includes(searchQuery)) ||
        e.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || e.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, statusFilter]);

  const submittedCount = events.filter((e) => e.status === 'submitted').length;
  const activeCount = events.filter((e) => e.status === 'active' || e.status === 'in_selection').length;

  return (
    <AdminLayout
      title={selectedEvent ? selectedEvent.title : 'Client Memory Vaults & Proofing'}
      subtitle={
        selectedEvent
          ? `Private Studio Workspace • Client: ${selectedEvent.client_name} • PIN: ${selectedEvent.passcode}`
          : 'Manage couple galleries, upload high-res images, and process album selections'
      }
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {selectedEvent && (
            <button
              type="button"
              onClick={handleBackToGrid}
              className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FaChevronLeft size={10} /> All Vaults
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full px-5 py-2 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 flex items-center gap-1.5 cursor-pointer"
          >
            <FaPlus size={10} /> New Client Vault
          </button>
        </div>
      }
    >
      {/* =========================================================================
          VIEW 1: ALL CLIENT VAULTS GRID (When no vault is actively opened)
          ========================================================================= */}
      {!selectedEvent && (
        <div className="space-y-6">
          {/* Summary Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-brand-muted font-medium">Total Vaults</p>
                <p className="font-serif text-xl sm:text-2xl text-white font-bold mt-0.5">{events.length}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
                <FaFolderOpen />
              </div>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-xl border border-brand-gold/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-brand-gold font-semibold">Albums Submitted</p>
                <p className="font-serif text-xl sm:text-2xl text-brand-gold font-bold mt-0.5">{submittedCount}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand-gold text-brand-dark flex items-center justify-center font-bold">
                <FaPaperPlane size={12} />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-brand-muted font-medium">Active Proofing</p>
                <p className="font-serif text-xl sm:text-2xl text-white font-bold mt-0.5">{activeCount}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <FaCheckCircle />
              </div>
            </div>
          </div>

          {/* Search & Status Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-3.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" size={12} />
              <input
                type="text"
                placeholder="Search by couple, phone, or wedding title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder:text-brand-muted/60 outline-none focus:border-brand-gold transition-colors"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'submitted', label: 'Submitted' },
                { id: 'active', label: 'Active' },
                { id: 'delivered', label: 'Delivered' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === s.id
                      ? 'bg-brand-gold text-brand-dark'
                      : 'bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vaults Visual Grid */}
          {loading ? (
            <div className="text-center py-16 bg-white/[0.02] border border-white/10 rounded-3xl">
              <div className="h-8 w-8 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin mx-auto mb-3" />
              <p className="text-xs text-brand-muted">Loading client memory vaults...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.02] border border-dashed border-white/15 rounded-3xl p-8">
              <FaFolderOpen className="text-4xl text-brand-gold/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg text-white mb-1">No Client Vaults Found</h3>
              <p className="text-xs text-brand-muted font-light mb-4">
                {searchQuery ? 'Try changing your search query or filter.' : 'Create your first couple wedding vault.'}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-full px-6 py-2.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FaPlus size={10} /> Create New Vault
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-brand-gold/40 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Title & Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-serif text-base text-white font-medium group-hover:text-brand-gold transition-colors line-clamp-1">
                        {evt.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          evt.status === 'submitted'
                            ? 'bg-brand-gold text-brand-dark'
                            : evt.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/10 text-brand-muted'
                        }`}
                      >
                        {evt.status === 'submitted' ? 'Album Ready' : evt.status}
                      </span>
                    </div>

                    {/* Couple & Date */}
                    <p className="text-xs text-brand-muted font-light mb-3 flex flex-wrap items-center gap-2">
                      <span>👤 {evt.client_name}</span>
                      <span>•</span>
                      <span>📅 {evt.event_date ? new Date(evt.event_date).toLocaleDateString() : 'Date TBD'}</span>
                    </p>

                    {/* Credentials Strip with 1-Click Copy */}
                    <div className="bg-black/30 rounded-2xl p-3 border border-white/5 space-y-1.5 mb-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-muted text-[11px]">Master PIN:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyPin(evt.passcode, `master-${evt.id}`)}
                          className="font-mono text-brand-gold font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          title="Click to copy PIN"
                        >
                          {evt.passcode} {copiedPinId === `master-${evt.id}` ? <FaCheck size={9} /> : <FaCopy size={9} />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-brand-muted">Client Phone:</span>
                        <span className="text-white/90 font-medium">{evt.client_phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {evt.client_phone && (
                        <a
                          href={`https://wa.me/${evt.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hi ${evt.client_name}, your wedding memory vault is live on Candy Pic!\n${window.location.origin}/portal/${evt.slug}\nYour PIN: ${evt.passcode}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                          title="Share credentials on WhatsApp"
                        >
                          <FaWhatsapp size={13} />
                        </a>
                      )}

                      <Link
                        to={`/portal/${evt.slug}`}
                        target="_blank"
                        className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-brand-muted hover:text-white transition-colors"
                        title="Open Client Portal"
                      >
                        <FaExternalLinkAlt size={11} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteVault(evt.id, evt.title)}
                        className="p-2 rounded-full bg-white/5 hover:bg-brand-red text-brand-muted hover:text-white transition-colors cursor-pointer"
                        title="Delete Vault"
                      >
                        <FaTrashAlt size={11} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectEvent(evt)}
                      className="rounded-full px-4 py-1.5 bg-brand-gold text-brand-dark hover:bg-brand-gold-soft font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-brand-gold/10 cursor-pointer"
                    >
                      Open Studio →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DEDICATED FULL-WIDTH VAULT STUDIO WORKSPACE (When a vault is selected)
          ========================================================================= */}
      {selectedEvent && (
        <div className="space-y-6">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-7 shadow-2xl">
            {/* Top Studio Control Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h2 className="font-serif text-xl sm:text-2xl text-white font-semibold">{selectedEvent.title}</h2>
                  <select
                    value={selectedEvent.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-brand-gold [color-scheme:dark] cursor-pointer"
                  >
                    <option value="active">Active (Selection Open)</option>
                    <option value="in_selection">In Selection</option>
                    <option value="submitted">Album Submitted</option>
                    <option value="delivered">Delivered &amp; Complete</option>
                  </select>
                </div>

                <p className="text-xs text-brand-muted font-light flex flex-wrap items-center gap-2">
                  <span>Couple: <strong className="text-white font-medium">{selectedEvent.client_name}</strong></span>
                  <span>•</span>
                  <span>Phone: <strong className="text-white font-medium">{selectedEvent.client_phone}</strong></span>
                  <span>•</span>
                  <span>Date: <strong>{selectedEvent.event_date || 'TBD'}</strong></span>
                  <span>•</span>
                  <span>PIN: <strong className="font-mono text-brand-gold font-bold">{selectedEvent.passcode}</strong></span>
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to={`/portal/${selectedEvent.slug}`}
                  target="_blank"
                  className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <FaExternalLinkAlt size={11} className="text-brand-gold" /> Client Portal
                </Link>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `📸 Hi ${selectedEvent.client_name}! Your wedding memory vault is ready on Candy Pic:\n${window.location.origin}/portal/${selectedEvent.slug}\nYour PIN: ${selectedEvent.passcode}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full px-4 py-2 bg-[#25D366] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <FaWhatsapp size={13} /> Send PIN
                </a>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-2 sm:gap-3 mt-5 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`rounded-full px-4 sm:px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'photos'
                    ? 'bg-brand-gold text-brand-dark'
                    : 'text-brand-muted hover:text-white bg-white/5'
                }`}
              >
                📸 Gallery ({photos.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`rounded-full px-4 sm:px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-brand-gold text-brand-dark'
                    : 'text-brand-muted hover:text-white bg-white/5'
                }`}
              >
                <FaCloudUploadAlt size={14} /> ☁️ Bulk Upload
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('proofing')}
                className={`rounded-full px-4 sm:px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'proofing'
                    ? 'bg-brand-gold text-brand-dark'
                    : 'text-brand-muted hover:text-white bg-white/5'
                }`}
              >
                <FaCheckCircle size={12} /> 📋 Album Proofs ({selectedAlbumPhotos.length} / {selectedEvent.target_album_photos})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`rounded-full px-4 sm:px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-brand-gold text-brand-dark'
                    : 'text-brand-muted hover:text-white bg-white/5'
                }`}
              >
                <FaCog size={12} /> ⚙️ Settings
              </button>
            </div>

            {/* TAB 1: PHOTO GALLERY */}
            {activeTab === 'photos' && (
              <div className="mt-6 space-y-4">
                {/* Category Filters Bar */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                          selectedCategoryFilter === cat
                            ? 'bg-white/20 text-brand-gold font-bold'
                            : 'bg-white/5 text-brand-muted hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="rounded-full px-4 py-1.5 bg-brand-gold/15 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold hover:text-brand-dark text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FaPlus size={9} /> Upload More Photos
                  </button>
                </div>

                {photosLoading ? (
                  <p className="text-center text-xs text-brand-muted py-12">Loading photos...</p>
                ) : filteredPhotos.length === 0 ? (
                  <div className="text-center py-16 bg-black/20 rounded-3xl border border-dashed border-white/10 p-8">
                    <FaImages className="text-4xl text-brand-gold/60 mx-auto mb-3" />
                    <h3 className="font-serif text-lg text-white mb-1">No Photos in this Category</h3>
                    <p className="text-xs text-brand-muted mb-4 font-light">
                      Upload high-resolution frames to this couple&apos;s vault.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="rounded-full px-6 py-2.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Start Bulk Upload
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-[65vh] overflow-y-auto pr-1 no-scrollbar">
                    {filteredPhotos.map((p) => (
                      <div
                        key={p.id}
                        className="group relative aspect-[3/2] rounded-2xl overflow-hidden bg-brand-deep border border-white/10 shadow-md"
                      >
                        <img
                          src={p.public_url}
                          alt={p.filename}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=60';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold font-bold w-fit">
                            {p.category}
                          </span>

                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono text-white/80 truncate">{p.filename}</span>
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(p)}
                              className="w-7 h-7 rounded-full bg-brand-red/80 hover:bg-brand-red text-white flex items-center justify-center text-xs shrink-0 cursor-pointer"
                              title="Delete photo"
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

            {/* TAB 2: BULK UPLOAD */}
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
                      className="rounded-xl bg-brand-deep border border-white/15 px-4 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark] cursor-pointer"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
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
                    <button
                      type="button"
                      onClick={handleCopyLightroom}
                      disabled={selectedAlbumPhotos.length === 0}
                      className="rounded-full px-4 py-2 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-brand-gold-soft transition-all shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {copiedLightroom ? <FaCheck /> : <FaCopy />}
                      {copiedLightroom ? 'Copied Lightroom Filter!' : 'Copy for Lightroom'}
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      disabled={selectedAlbumPhotos.length === 0}
                      className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
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

            {/* TAB 4: VAULT SETTINGS */}
            {activeTab === 'settings' && (
              <div className="mt-6 space-y-6 max-w-2xl">
                <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-4">
                  <h3 className="font-serif text-lg text-white">Vault Security &amp; Credentials</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-brand-muted mb-1 font-semibold">
                        Master Passcode (PIN)
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedEvent.passcode}
                        onBlur={(e) => updateClientEvent(selectedEvent.id, { passcode: e.target.value })}
                        className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-brand-gold font-mono outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-brand-muted mb-1 font-semibold">
                        Target Album Photo Count
                      </label>
                      <input
                        type="number"
                        defaultValue={selectedEvent.target_album_photos}
                        onBlur={(e) => updateClientEvent(selectedEvent.id, { target_album_photos: parseInt(e.target.value, 10) || 100 })}
                        className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-white font-mono outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-brand-red/10 border border-brand-red/30 p-5 rounded-2xl space-y-3">
                  <h4 className="font-serif text-sm text-brand-red font-semibold">Danger Zone</h4>
                  <p className="text-xs text-brand-muted font-light leading-relaxed">
                    Permanently delete this wedding vault and all associated photos. This action cannot be undone.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeleteVault(selectedEvent.id, selectedEvent.title)}
                    className="rounded-full px-5 py-2 bg-brand-red text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-red/80 transition-colors cursor-pointer"
                  >
                    Delete Vault Permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
              className="w-full max-w-lg bg-brand-deep border border-brand-gold/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>

              <h3 className="font-serif text-xl sm:text-2xl text-white mb-1">Create New Client Vault</h3>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    className="rounded-full px-5 py-2.5 text-xs text-brand-muted hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-full px-6 py-2.5 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider disabled:opacity-60 cursor-pointer"
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
