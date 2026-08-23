import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   HighlightViewer
   Full-screen Instagram-style story viewer.

   Props:
     slides   – array of { url?, emoji?, tripName, status, spots?: [] }
     startAt  – initial slide index (default 0)
     onClose  – callback to close viewer
     avatar   – { emoji, photo } for top-left avatar ring
     title    – place/trip name in top-left header
   ───────────────────────────────────────────────────────────────────────────── */
export default function HighlightViewer({ slides = [], startAt = 0, onClose, avatar, title }) {
  const [idx,      setIdx]      = useState(Math.min(startAt, Math.max(0, slides.length - 1)));
  const [progress, setProgress] = useState(0);
  const [paused,   setPaused]   = useState(false);
  const timerRef = useRef(null);

  // Sync index when startAt / slides change (viewer re-opened with different content)
  useEffect(() => {
    setIdx(Math.min(startAt, Math.max(0, slides.length - 1)));
    setProgress(0);
  }, [startAt, slides]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Keyboard nav — deps include next/prev/onClose to avoid stale closures
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape')     onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const next = useCallback(() => {
    if (idx < slides.length - 1) { setIdx(i => i + 1); setProgress(0); }
    else onClose();
  }, [idx, slides.length, onClose]);

  const prev = useCallback(() => {
    if (idx > 0) { setIdx(i => i - 1); setProgress(0); }
  }, [idx]);

  // Auto-advance progress bar
  useEffect(() => {
    if (paused || !slides.length) return;
    clearInterval(timerRef.current);
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { next(); return 0; }
        return p + (100 / (5000 / 75)); // 5s total
      });
    }, 75);
    return () => clearInterval(timerRef.current);
  }, [idx, paused, slides.length, next]);

  useEffect(() => { setProgress(0); }, [idx]);

  if (!slides.length) return null;
  const slide = slides[idx];

  const STATUS_LABEL = { planned: '📌 Planned', ongoing: '⚡ Ongoing', completed: '✓ Done' };

  return (
    <AnimatePresence>
      <motion.div
        className="tl-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Progress bars ── */}
        <div className="tl-viewer-bars">
          {slides.map((_, i) => (
            <div key={i} className="tl-viewer-bar-track">
              <div
                className="tl-viewer-bar-fill"
                style={{ width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div className="tl-viewer-header">
          <div className="tl-viewer-avatar-row">
            <div className="tl-viewer-avatar">
              {avatar?.photo
                ? <img src={avatar.photo} alt="" />
                : <span>{avatar?.emoji || '📍'}</span>}
            </div>
            <div>
              <div className="tl-viewer-title">{title || slide.tripName}</div>
              {slide.status && (
                <div className="tl-viewer-status-text">{STATUS_LABEL[slide.status] || slide.status}</div>
              )}
            </div>
          </div>
          <div className="tl-viewer-header-right">
            <span className="tl-viewer-counter">{idx + 1} / {slides.length}</span>
            <button className="tl-viewer-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* ── Photo or Emoji background ── */}
        {slide.url ? (
          <motion.img
            key={`img-${idx}`}
            src={slide.url}
            className="tl-viewer-photo"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <motion.div
            key={`bg-${idx}`}
            className="tl-viewer-emoji-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tl-viewer-big-emoji">{slide.emoji || '✈️'}</div>
            <div className="tl-viewer-trip-name">{slide.tripName}</div>
            {slide.status && (
              <div className="tl-viewer-status-badge">{STATUS_LABEL[slide.status] || slide.status}</div>
            )}
          </motion.div>
        )}

        {/* ── Gradient overlay ── */}
        <div className="tl-viewer-overlay" />

        {/* ── Spots chips ── */}
        {slide.spots?.length > 0 && (
          <div className="tl-viewer-spots">
            {slide.spots.map(s => (
              <span key={s.id} className="tl-viewer-spot-chip">📍 {s.name}</span>
            ))}
          </div>
        )}

        {/* ── Bottom trip info ── */}
        {slide.url && (
          <div className="tl-viewer-bottom">
            <div className="tl-viewer-bottom-name">{slide.tripName}</div>
            {slide.status && (
              <div className="tl-viewer-bottom-status">{STATUS_LABEL[slide.status]}</div>
            )}
          </div>
        )}

        {/* ── Tap zones ── */}
        <div
          className="tl-viewer-tap tl-viewer-tap-left"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onClick={prev}
        />
        <div
          className="tl-viewer-tap tl-viewer-tap-right"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => { setPaused(false); next(); }}
          onClick={() => {}}
        />

        {/* ── Arrow buttons ── */}
        {idx > 0 && (
          <button className="tl-viewer-arrow tl-viewer-arrow-left" onClick={prev}>
            <ChevronLeft size={22} />
          </button>
        )}
        {idx < slides.length - 1 && (
          <button className="tl-viewer-arrow tl-viewer-arrow-right" onClick={next}>
            <ChevronRight size={22} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
