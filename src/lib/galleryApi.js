import { supabase } from './supabaseClient';

/**
 * Gallery & Client Portal API — Centralized service layer for:
 *   - Public Showcase Gallery
 *   - Private Client Event Vaults (Proofing, Selection, Notes)
 *   - Cloudflare R2 Uploads via signed URLs
 *   - Realtime Admin Notifications Hub
 */

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

const R2_PUBLIC_URL = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');

// Helper to get auth header for edge functions
async function authHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

// =========================================================================
// 1. Storage Upload Engine (Cloudflare R2 + Supabase Storage Fallback)
// =========================================================================

export async function uploadFileToR2(file, folder = 'gallery', onProgress) {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${cleanName}`;
  const bucketName = folder.startsWith('events') ? 'event-photos' : 'gallery';

  // 1. First Attempt: Cloudflare R2 presigned upload if r2-sign edge function is active
  if (FUNCTIONS_URL) {
    try {
      const headers = await authHeader();
      const res = await fetch(`${FUNCTIONS_URL}/r2-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'upload',
          filename: key,
          contentType: file.type || 'image/jpeg',
        }),
      });

      if (res.ok) {
        const { uploadUrl, key: r2Key, publicUrl } = await res.json();
        if (uploadUrl) {
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            if (file.type) xhr.setRequestHeader('Content-Type', file.type);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`R2 status ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error('R2 Network error'));
            xhr.send(file);
          });

          const finalUrl = publicUrl || (R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${r2Key}` : r2Key);
          return { key: r2Key, publicUrl: finalUrl };
        }
      }
    } catch (r2Err) {
      console.warn('R2 edge function skipped, using Supabase Storage:', r2Err);
    }
  }

  // 2. Second Attempt (Rock Solid): Supabase Storage
  try {
    const { data, error: uploadErr } = await supabase.storage
      .from(bucketName)
      .upload(key, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadErr) {
      // If bucket doesn't exist, try default 'gallery'
      const { data: fbData, error: fbErr } = await supabase.storage
        .from('gallery')
        .upload(key, file, { cacheControl: '3600', upsert: true });

      if (fbErr) throw fbErr;
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(key);
    if (onProgress) onProgress(100);
    return { key, publicUrl: urlData.publicUrl };
  } catch (storageErr) {
    console.error('Supabase storage upload error:', storageErr);
    throw new Error(
      `Upload failed: ${storageErr.message || 'Please create the storage bucket in Supabase.'}`
    );
  }
}

// =========================================================================
// 2. Public Showcase Gallery API
// =========================================================================

export async function uploadImage(file, { title = '', category = 'General', onProgress } = {}) {
  const { key, publicUrl } = await uploadFileToR2(file, 'gallery', onProgress);

  const { data, error } = await supabase
    .from('gallery_images')
    .insert({
      r2_key: key,
      public_url: publicUrl,
      title: title || file.name.replace(/\.[^.]+$/, ''),
      category,
      content_type: file.type || 'image/jpeg',
      size_bytes: file.size || null,
      published: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listPublishedImages() {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAllImages() {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function setPublished(id, published) {
  const { error } = await supabase.from('gallery_images').update({ published }).eq('id', id);
  if (error) throw error;
}

export async function deleteImage(image) {
  try {
    const headers = await authHeader();
    await fetch(`${FUNCTIONS_URL}/r2-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ action: 'delete', key: image.r2_key }),
    });
  } catch {
    // Ignore R2 delete errors
  }
  const { error } = await supabase.from('gallery_images').delete().eq('id', image.id);
  if (error) throw error;
}

// =========================================================================
// 3. Client Events & Private Portals API
// =========================================================================

export async function listClientEvents() {
  const { data, error } = await supabase
    .from('client_events')
    .select('*, event_photos(count), album_submissions(count)')
    .order('event_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getClientEventBySlug(slug) {
  const { data, error } = await supabase
    .from('client_events')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
}

export async function createClientEvent(eventData) {
  const slug = eventData.slug || eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { data, error } = await supabase
    .from('client_events')
    .insert({
      title: eventData.title,
      slug,
      client_name: eventData.client_name,
      client_phone: eventData.client_phone,
      event_date: eventData.event_date,
      passcode: eventData.passcode || '1234',
      guest_passcode: eventData.guest_passcode || 'GUEST',
      target_album_photos: parseInt(eventData.target_album_photos, 10) || 100,
      cover_image_url: eventData.cover_image_url || null,
      status: eventData.status || 'active',
      is_live_gallery: eventData.is_live_gallery ?? false,
      announcement_text: eventData.announcement_text || undefined,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClientEvent(id, updates) {
  const { data, error } = await supabase
    .from('client_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClientEvent(id) {
  const { error } = await supabase.from('client_events').delete().eq('id', id);
  if (error) throw error;
}

// =========================================================================
// 4. Event Photos & Media API
// =========================================================================

export async function getEventPhotos(eventId) {
  const { data, error } = await supabase
    .from('event_photos')
    .select('*, photo_selections(*)')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function uploadEventPhoto(file, eventId, { category = 'Ceremony', isHighlight = false, onProgress } = {}) {
  const folder = `events/${eventId}`;
  const { key, publicUrl } = await uploadFileToR2(file, folder, onProgress);

  const { data, error } = await supabase
    .from('event_photos')
    .insert({
      event_id: eventId,
      r2_key: key,
      public_url: publicUrl,
      filename: file.name,
      category,
      content_type: file.type || 'image/jpeg',
      size_bytes: file.size || null,
      is_highlight: isHighlight,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEventPhoto(photo) {
  try {
    const headers = await authHeader();
    await fetch(`${FUNCTIONS_URL}/r2-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ action: 'delete', key: photo.r2_key }),
    });
  } catch {
    // Ignore R2 delete error
  }
  const { error } = await supabase.from('event_photos').delete().eq('id', photo.id);
  if (error) throw error;
}

// =========================================================================
// 5. Photo Selections & Album Proofing API
// =========================================================================

export async function togglePhotoSelection({ eventId, photoId, isAlbumSelected, isFavorite, clientNote }) {
  const updates = {
    event_id: eventId,
    photo_id: photoId,
    updated_at: new Date().toISOString(),
  };
  if (isAlbumSelected !== undefined) updates.is_album_selected = isAlbumSelected;
  if (isFavorite !== undefined) updates.is_favorite = isFavorite;
  if (clientNote !== undefined) updates.client_note = clientNote;

  const { data, error } = await supabase
    .from('photo_selections')
    .upsert(updates, { onConflict: 'event_id,photo_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitAlbumSelection({ eventId, clientName, clientPhone, selectedFilenames, clientNotes }) {
  // 1. Insert submission snapshot
  const { data: submission, error: subError } = await supabase
    .from('album_submissions')
    .insert({
      event_id: eventId,
      client_name: clientName,
      client_phone: clientPhone,
      selected_count: selectedFilenames.length,
      client_notes: clientNotes || '',
      selected_filenames: selectedFilenames,
      status: 'submitted',
    })
    .select()
    .single();

  if (subError) throw subError;

  // 2. Update event status to 'submitted'
  await supabase
    .from('client_events')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', eventId);

  // 3. Dispatch admin notification
  await createAdminNotification({
    title: '📖 New Album Selection Submitted!',
    message: `${clientName} finalized ${selectedFilenames.length} photos for their wedding album.`,
    type: 'album_submission',
    link: `/admin/events`,
    metadata: { event_id: eventId, count: selectedFilenames.length },
  });

  return submission;
}

export async function getAlbumSubmissions(eventId) {
  const { data, error } = await supabase
    .from('album_submissions')
    .select('*')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// =========================================================================
// 6. Realtime Admin Notifications Hub
// =========================================================================

export async function createAdminNotification({ title, message, type = 'booking', link = '/admin', metadata = {} }) {
  const { data, error } = await supabase
    .from('admin_notifications')
    .insert({
      title,
      message,
      type,
      link,
      metadata,
      is_read: false,
    })
    .select()
    .single();
  if (error) console.error('Notification dispatch error:', error);
  return data;
}

export async function listAdminNotifications(limit = 30) {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationAsRead(id) {
  const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsAsRead() {
  const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
  if (error) throw error;
}

// =========================================================================
// 7. Download & Export Utilities
// =========================================================================

export async function downloadImage(image) {
  try {
    const res = await fetch(image.public_url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = (image.content_type && image.content_type.split('/')[1]) || 'jpg';
    a.download = `${(image.filename || image.title || 'candy-pic').replace(/[^\w.-]+/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    window.open(image.public_url, '_blank', 'noopener');
  }
}

/**
 * Generate a formatted Lightroom / Photoshop search string
 * e.g., "DSC_1020, DSC_1021, DSC_1055"
 */
export function formatLightroomList(filenames = []) {
  return filenames
    .map((name) => name.replace(/\.[^/.]+$/, '')) // strip extension
    .filter(Boolean)
    .join(', ');
}
