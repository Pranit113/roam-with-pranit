import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = 'https://gubmtyxbqepcsjrvowba.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1Ym10eXhicWVwY3NqcnZvd2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTYzMTgsImV4cCI6MjA5OTY3MjMxOH0.nKHMfhx9CJTg2lNeYAmzw1D2gwnf2YsVvXNWksLC-Yc';
const BUCKET = 'trip-photos';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─── Client-side image compression ─────────────────────────────
   Resizes to max 1200px and converts to JPEG ~82% quality.
   Keeps most photos under 200 KB so localStorage works fine.    */
function compressImage(file, maxPx = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale  = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ─── Try Supabase first, fall back to local base64 ──────────── */
export async function uploadPhoto(file, tripId) {
  // 1. Compress the image client-side first
  const base64 = await compressImage(file);

  // 2. Try Supabase Storage upload
  try {
    const blob     = await (await fetch(base64)).blob();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}.jpg`;
    const path     = `${tripId}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });

    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;   // ← Supabase CDN URL
    }
    // Fall through to local storage on any error
    console.warn('Supabase upload failed, saving locally:', error.message);
  } catch (err) {
    console.warn('Supabase unreachable, saving locally:', err.message);
  }

  // 3. Fall back: return base64 data URL (stored in localStorage via storage.js)
  return base64;
}

/* ─── Delete photo ───────────────────────────────────────────── */
export async function deletePhotoFromStorage(publicUrl) {
  // If it's a local base64 URL, nothing to delete from Supabase
  if (!publicUrl || publicUrl.startsWith('data:')) return;

  try {
    const marker = `/object/public/${BUCKET}/`;
    const idx    = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  } catch (err) {
    console.error('Delete from storage failed:', err);
  }
}
