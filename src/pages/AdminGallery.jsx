import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  FaCloudUploadAlt,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaImages,
  FaExclamationTriangle,
} from 'react-icons/fa';
import AdminLayout from '../components/admin/AdminLayout';
import { uploadImage, listAllImages, setPublished, deleteImage } from '../lib/galleryApi';
import { runWithConcurrency } from '../utils/concurrency';

const CATEGORIES = ['General', 'Wedding', 'Pre-Wedding', 'Engagement', 'Haldi', 'Event'];
const UPLOAD_CONCURRENCY = 4;

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminGallery() {
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [category, setCategory] = useState('General');
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // { id, name, progress, status, error }
  const [busyIds, setBusyIds] = useState([]); // ids currently toggling/deleting

  // --- Load images -----------------------------------------------------------
  const refresh = useCallback(async () => {
    setLoadError('');
    try {
      const data = await listAllImages();
      setImages(data);
    } catch (err) {
      setLoadError(err?.message || 'Could not load images.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // --- Uploads ---------------------------------------------------------------
  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;

      const batch = files.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        progress: 0,
        status: 'uploading', // uploading | done | error
        error: '',
      }));

      setUploads((prev) => [...batch, ...prev]);

      let anySucceeded = false;
      const pairs = files.map((file, i) => ({ file, item: batch[i] }));

      await runWithConcurrency(pairs, UPLOAD_CONCURRENCY, async ({ file, item }) => {
        try {
          await uploadImage(file, {
            category,
            onProgress: (p) =>
              setUploads((prev) =>
                prev.map((u) => (u.id === item.id ? { ...u, progress: p } : u))
              ),
          });
          anySucceeded = true;
          setUploads((prev) =>
            prev.map((u) => (u.id === item.id ? { ...u, progress: 100, status: 'done' } : u))
          );
        } catch (err) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id
                ? { ...u, status: 'error', error: err?.message || 'Upload failed.' }
                : u
            )
          );
        }
      });

      if (anySucceeded) await refresh();

      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status === 'error'));
      }, 4000);
    },
    [category, refresh]
  );

  const onInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // --- Publish toggle (optimistic) ------------------------------------------
  const togglePublished = async (image) => {
    const next = !image.published;
    setBusyIds((b) => [...b, image.id]);
    setImages((prev) => prev.map((it) => (it.id === image.id ? { ...it, published: next } : it)));
    try {
      await setPublished(image.id, next);
    } catch (err) {
      setImages((prev) =>
        prev.map((it) => (it.id === image.id ? { ...it, published: image.published } : it))
      );
      alert(`Could not update visibility: ${err?.message || 'Unknown error.'}`);
    } finally {
      setBusyIds((b) => b.filter((id) => id !== image.id));
    }
  };

  // --- Delete ----------------------------------------------------------------
  const handleDelete = async (image) => {
    if (!window.confirm(`Delete "${image.title || 'this image'}"? This cannot be undone.`)) return;
    setBusyIds((b) => [...b, image.id]);
    try {
      await deleteImage(image);
      setImages((prev) => prev.filter((it) => it.id !== image.id));
    } catch (err) {
      alert(`Could not delete image: ${err?.message || 'Unknown error.'}`);
    } finally {
      setBusyIds((b) => b.filter((id) => id !== image.id));
    }
  };

  const publishedCount = images.filter((i) => i.published).length;

  return (
    <AdminLayout
      title="Showcase Portfolio Manager"
      subtitle={`${images.length} total images · ${publishedCount} published on public website`}
      actions={
        <RouterLink
          to="/gallery"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2"
        >
          <FaExternalLinkAlt size={11} /> View Public Gallery
        </RouterLink>
      }
    >
      {/* --- Upload zone --- */}
      <section className="mb-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-10 bg-brand-gold/50" />
          <span className="text-xs uppercase tracking-[0.3em] text-brand-gold font-medium">
            Upload to Public Showcase
          </span>
        </div>

        {/* Category selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <label htmlFor="upload-category" className="text-xs text-brand-muted uppercase tracking-widest font-semibold">
            Category for this batch
          </label>
          <select
            id="upload-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl bg-brand-deep border border-white/15 px-4 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-brand-deep text-white">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`group cursor-pointer rounded-3xl border-2 border-dashed px-6 py-10 sm:py-14 text-center transition-all outline-none ${
            isDragging
              ? 'border-brand-gold bg-brand-gold/10'
              : 'border-white/15 bg-white/[0.02] hover:border-brand-gold/50 hover:bg-brand-gold/5'
          }`}
        >
          <FaCloudUploadAlt
            className={`mx-auto text-5xl mb-3 transition-colors ${
              isDragging ? 'text-brand-gold' : 'text-brand-gold/70 group-hover:text-brand-gold'
            }`}
          />
          <p className="font-serif text-lg sm:text-xl text-white">Drag &amp; drop portfolio photos here</p>
          <p className="text-brand-muted text-xs sm:text-sm font-light mt-1">
            or <span className="text-brand-gold underline underline-offset-4 font-semibold">browse files</span> · uploaded as{' '}
            <span className="text-brand-light font-medium">{category}</span>
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onInputChange} className="hidden" />
        </div>

        {/* Upload progress chips */}
        <AnimatePresence>
          {uploads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 space-y-2.5"
            >
              {uploads.map((u) => (
                <div key={u.id} className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-white truncate">{u.name}</span>
                    <span
                      className={`font-semibold ${
                        u.status === 'error'
                          ? 'text-brand-red'
                          : u.status === 'done'
                          ? 'text-emerald-400'
                          : 'text-brand-gold'
                      }`}
                    >
                      {u.status === 'error' ? 'Failed' : u.status === 'done' ? 'Done' : `${u.progress}%`}
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        u.status === 'error'
                          ? 'bg-brand-red'
                          : u.status === 'done'
                          ? 'bg-emerald-400'
                          : 'bg-brand-gold'
                      }`}
                      style={{ width: `${u.status === 'error' ? 100 : u.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* --- Image library --- */}
      <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-brand-gold/50" />
            <span className="text-xs uppercase tracking-[0.3em] text-brand-gold font-medium">Showcase Library</span>
          </div>
          <span className="text-xs text-brand-muted font-light">{images.length} frames</span>
        </div>

        {loadError && (
          <div className="flex items-start gap-3 rounded-2xl bg-brand-red/15 border border-brand-red/40 px-5 py-4 text-sm text-red-100 mb-6">
            <FaExclamationTriangle className="mt-0.5 shrink-0 text-brand-red" />
            <div>
              <p className="leading-relaxed">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  refresh();
                }}
                className="mt-2 text-xs uppercase tracking-wide text-brand-gold hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 aspect-[3/2] animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="py-12 text-center text-brand-muted">
            <FaImages className="text-4xl text-brand-gold/40 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-white mb-1">No showcase images yet</h3>
            <p className="text-xs font-light">Upload your first batch using the box above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => {
              const isBusy = busyIds.includes(img.id);

              return (
                <div
                  key={img.id}
                  className="group relative rounded-2xl overflow-hidden bg-brand-deep border border-white/10 shadow-md transition-all hover:border-brand-gold/50 flex flex-col"
                >
                  <div className="aspect-[3/2] relative overflow-hidden bg-black/40">
                    <img
                      src={img.public_url}
                      alt={img.title || 'Showcase frame'}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          img.published ? 'bg-emerald-500 text-black' : 'bg-black/60 text-white/70 border border-white/20'
                        }`}
                      >
                        {img.published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(img)}
                        disabled={isBusy}
                        className="w-7 h-7 rounded-full bg-black/60 hover:bg-brand-red text-white flex items-center justify-center text-xs transition-colors"
                      >
                        <FaTrashAlt size={10} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-brand-deep flex items-center justify-between gap-2 border-t border-white/5">
                    <div className="min-w-0">
                      <p className="text-xs text-white font-medium truncate">{img.title || 'Untitled'}</p>
                      <p className="text-[10px] text-brand-gold uppercase tracking-wider">{img.category}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePublished(img)}
                      disabled={isBusy}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                        img.published
                          ? 'bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-dark'
                          : 'bg-white/10 text-white hover:bg-emerald-500 hover:text-black'
                      }`}
                    >
                      {img.published ? <FaEye size={10} /> : <FaEyeSlash size={10} />}
                      {img.published ? 'Live' : 'Publish'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
