import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, Trash2 } from 'lucide-react';

export default function HighlightGallery({ highlights = [], startIndex = 0, onClose, onDelete }) {
  const [hlIdx,    setHlIdx]    = useState(startIndex);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused,   setPaused]   = useState(false);
  const timerRef  = useRef(null);
  const touchXRef = useRef(null);

  const hl     = highlights[hlIdx];
  const photos = hl?.photos?.length ? hl.photos : (hl?.url ? [{ id: hl.id, url: hl.url }] : []);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  useEffect(() => { setPhotoIdx(0); setProgress(0); }, [hlIdx]);
  useEffect(() => { setProgress(0); }, [photoIdx]);

  const prevPhoto = useCallback(() => {
    if (photoIdx > 0) setPhotoIdx(i => i - 1);
    else if (hlIdx > 0) setHlIdx(i => i - 1);
  }, [photoIdx, hlIdx]);

  const nextPhoto = useCallback(() => {
    if (photoIdx < photos.length - 1) setPhotoIdx(i => i + 1);
    else if (hlIdx < highlights.length - 1) setHlIdx(i => i + 1);
    else onClose?.();
  }, [photoIdx, photos.length, hlIdx, highlights.length, onClose]);

  useEffect(() => {
    if (paused || !photos.length) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(timerRef.current); nextPhoto(); return 0; } return p + 2.5; });
    }, 75);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, photoIdx, hlIdx, photos.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevPhoto, nextPhoto, onClose]);

  if (!hl || !photos.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex', flexDirection: 'column', maxWidth: 520, left: '50%', transform: 'translateX(-50%)' }}
        onTouchStart={e => { touchXRef.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchXRef.current === null) return;
          const dx = e.changedTouches[0].clientX - touchXRef.current;
          if (Math.abs(dx) > 40) {
            if (dx < 0) nextPhoto();
            else prevPhoto();
          }
          touchXRef.current = null;
        }}
      >
        <div style={{ position: 'absolute', top: 48, left: 12, right: 12, display: 'flex', gap: 3, zIndex: 10 }}>
          {photos.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,.3)', borderRadius: 99 }}>
              <div style={{ height: '100%', borderRadius: 99, background: '#fff', width: i < photoIdx ? '100%' : i === photoIdx ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 58, left: 16, right: 16, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={18} color="#fff" /></div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{hl.title || 'Travel Highlight'}</div>
              {hl.caption && <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>{hl.caption}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onDelete && <button onClick={() => onDelete(hl.id)} style={{ background: 'rgba(239,68,68,.25)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FCA5A5' }}><Trash2 size={15} /></button>}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={18} /></button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.img key={`${hlIdx}-${photoIdx}`} src={photos[photoIdx]?.url} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </AnimatePresence>
        {highlights.length > 1 && (
          <div style={{ position: 'absolute', top: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5, zIndex: 11 }}>
            {highlights.map((_, i) => <div key={i} onClick={() => setHlIdx(i)} style={{ width: i === hlIdx ? 18 : 6, height: 6, borderRadius: 99, background: i === hlIdx ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer', transition: 'all .2s' }} />)}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top,rgba(0,0,0,.7),transparent)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 32 }}>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: 600 }}>{photoIdx + 1} / {photos.length}{highlights.length > 1 && <span style={{ marginLeft: 10, opacity: .6 }}>· Album {hlIdx + 1}/{highlights.length}</span>}</div>
        </div>
        <div style={{ position: 'absolute', top: 100, left: 0, width: '35%', bottom: 0, zIndex: 5, cursor: 'pointer' }} onClick={prevPhoto} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} />
        <div style={{ position: 'absolute', top: 100, right: 0, width: '35%', bottom: 0, zIndex: 5, cursor: 'pointer' }} onClick={nextPhoto} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} />
        {(photoIdx > 0 || hlIdx > 0) && <button onClick={prevPhoto} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', zIndex: 6 }}><ChevronLeft size={20} /></button>}
        {(photoIdx < photos.length - 1 || hlIdx < highlights.length - 1) && <button onClick={nextPhoto} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', zIndex: 6 }}><ChevronRight size={20} /></button>}
      </motion.div>
    </AnimatePresence>
  );
}
