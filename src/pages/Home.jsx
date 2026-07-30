import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTrips, getProfile } from '../utils/storage';

/* ─── helpers ────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date()) / 864e5);
}
function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}


/* ══════════════════════════════════════════════════════════════
   INSTAGRAM-STYLE STORY VIEWER
══════════════════════════════════════════════════════════════ */
function StoryViewer({ trip, onClose }) {
  const photos = [
    /* use cover as first slide if no highlights */
    ...(trip.highlights?.length ? [] : (trip.cover ? [{ url: trip.cover }] : [])),
    ...(trip.highlights || []),
  ];
  const [idx,      setIdx]      = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused,   setPaused]   = useState(false);
  const timerRef = useRef(null);

  /* lock scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* progress bar ticker */
  useEffect(() => {
    if (paused || !photos.length) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (idx < photos.length - 1) {
            setIdx(i => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return p + 2.5; /* 2.5 per 75ms = 3s total */
      });
    }, 75);
    return () => clearInterval(timerRef.current);
  }, [idx, paused, photos.length, onClose]);

  /* reset progress when slide changes */
  useEffect(() => { setProgress(0); }, [idx]);

  if (!photos.length) {
    /* trip has no photos — just navigate to workspace */
    onClose();
    return null;
  }

  function prev() { if (idx > 0) { setIdx(i => i - 1); setProgress(0); } }
  function next() { if (idx < photos.length - 1) { setIdx(i => i + 1); setProgress(0); } else onClose(); }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: '#000',
          display: 'flex', flexDirection: 'column',
          maxWidth: 480, left: '50%', transform: 'translateX(-50%)',
        }}
      >
        {/* ── Progress bars ── */}
        <div style={{ position: 'absolute', top: 52, left: 12, right: 12, display: 'flex', gap: 3, zIndex: 10 }}>
          {photos.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.35)', borderRadius: 99 }}>
              <div style={{
                height: '100%', borderRadius: 99, background: 'white',
                width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%',
                transition: i === idx ? 'none' : 'none',
              }} />
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div style={{ position: 'absolute', top: 62, left: 16, right: 16, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {trip.emoji || '✈️'}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{trip.name}</div>
              {trip.destination && <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>📍 {trip.destination}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Photo ── */}
        <motion.img
          key={idx}
          src={photos[idx].url}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* ── Bottom gradient + counter ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 32 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{idx + 1} / {photos.length}</div>
        </div>

        {/* ── Tap zones ── */}
        <div
          style={{ position: 'absolute', top: 100, left: 0, width: '35%', bottom: 0, cursor: 'pointer', zIndex: 5 }}
          onClick={prev}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => { setPaused(false); }}
        />
        <div
          style={{ position: 'absolute', top: 100, right: 0, width: '35%', bottom: 0, cursor: 'pointer', zIndex: 5 }}
          onClick={next}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => { setPaused(false); next(); }}
        />

        {/* ── Prev / Next arrows ── */}
        {idx > 0 && (
          <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 6 }}>
            <ChevronLeft size={20} />
          </button>
        )}
        {idx < photos.length - 1 && (
          <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 6 }}>
            <ChevronRight size={20} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Highlight Ring ──────────────────────────────────────────── */
function HighlightRing({ trip, onOpen }) {
  const [err, setErr] = useState(false);
  const cover = trip.highlights?.[0]?.url || trip.cover;
  const count = trip.highlights?.length || 0;

  return (
    <div className="hl-wrap" onClick={() => onOpen(trip)}>
      <div className="hl-ring">
        <div className="hl-white">
          {cover && !err
            ? <img className="hl-img" src={cover} alt={trip.name} onError={() => setErr(true)} />
            : <div className="hl-img-placeholder">{trip.emoji || '✈️'}</div>}
        </div>
      </div>
      <span className="hl-name">{trip.name}</span>
      {count > 0 && <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>{count} photo{count > 1 ? 's' : ''}</span>}
    </div>
  );
}

function AddRing() {
  const navigate = useNavigate();
  return (
    <div className="hl-wrap hl-add" onClick={() => navigate('/trips')}>
      <div className="hl-ring">
        <div className="hl-white" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--em)', borderRadius: '50%' }}>+</div>
      </div>
      <span className="hl-name" style={{ color: 'var(--em)' }}>New Trip</span>
    </div>
  );
}

/* ── Mini Trip Card ──────────────────────────────────────────── */
function MiniTripCard({ trip, delay }) {
  const navigate = useNavigate();
  const [err, setErr] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      onClick={() => navigate(`/trip/${trip.id}`)}
      style={{ width: 150, flexShrink: 0, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: '#fff', boxShadow: 'var(--sh-sm)' }}
      whileHover={{ y: -4 }}
    >
      <div style={{ height: 96, background: 'linear-gradient(135deg,#ECFDF5,#E0F2FE)', overflow: 'hidden' }}>
        {trip.cover && !err
          ? <img src={trip.cover} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={trip.name} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>{trip.emoji || '✈️'}</div>}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trip.name}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{trip.destination || '—'}</div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [trips,   setTrips]   = useState([]);
  const [profile, setProfile] = useState({ name: 'Pranit' });
  const [story,   setStory]   = useState(null); /* trip to show in story viewer */

  useEffect(() => {
    setTrips(getTrips());
    setProfile(getProfile());
  }, []);

  const upcoming = trips.filter(t => t.status === 'upcoming');
  const ongoing  = trips.filter(t => t.status === 'ongoing');
  const planning = trips.filter(t => t.status === 'planning');
  const done     = trips.filter(t => t.status === 'completed');

  const heroTrip = ongoing[0] || upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
  const heroStatus = heroTrip
    ? heroTrip.status === 'ongoing'
      ? '🟢 Ongoing'
      : heroTrip.startDate ? `${daysUntil(heroTrip.startDate)} days away` : '📌 Upcoming'
    : null;

  /* All trips shown as highlight rings (every trip, even without photos) */
  const allTrips = trips;

  return (
    <div className="page" style={{ background: '#F8FAFC' }}>

      {/* Story Viewer overlay */}
      <AnimatePresence>
        {story && <StoryViewer trip={story} onClose={() => setStory(null)} />}
      </AnimatePresence>

      {/* ── Fixed Top Bar ── */}
      <div className="top-bar">
        <span className="top-bar-logo">RoamWithPranit</span>
        <div className="top-bar-right">
          <span className="top-bar-bell"><Bell size={22} /></span>
          <div className="top-bar-avatar" onClick={() => navigate('/profile')}>
            {(profile.name || 'P')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Greeting ── */}
      <div style={{ padding: '76px 20px 0', background: '#fff', borderBottom: '1px solid #E2E8F0', paddingBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{greeting()},</div>
        <div style={{ fontSize: 26, fontWeight: 900, marginTop: 2, letterSpacing: '-0.01em' }}>
          <span className="grad-text">{profile.name || 'Traveller'}</span> ✈️
        </div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
          {trips.length === 0 ? 'Ready for your first adventure?' : `${trips.length} trip${trips.length > 1 ? 's' : ''} · ${done.length} completed`}
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {trips.length === 0 && (
        <div className="empty">
          <div className="empty-icon">🌍</div>
          <div className="empty-title">No adventures yet</div>
          <div className="empty-desc">Every great journey starts with a single plan. Create your first trip and start building your travel story.</div>
          <motion.button className="btn btn-lg btn-primary" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/trips')}>
            <Plus size={20} /> Plan My First Adventure
          </motion.button>
        </div>
      )}

      {/* ── Upcoming / Ongoing HERO CARD ── */}
      {heroTrip && (
        <div style={{ marginTop: 24 }}>
          <div className="sec-hd">
            <span className="sec-title">{heroTrip.status === 'ongoing' ? '🟢 Right Now' : '🗓 Next Up'}</span>
            <button className="sec-link" onClick={() => navigate('/trips')}>All trips</button>
          </div>
          <div className="hero-trip-card" onClick={() => navigate(`/trip/${heroTrip.id}`)}>
            {heroTrip.cover
              ? <img src={heroTrip.cover} alt={heroTrip.name} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#ECFDF5,#E0F2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>{heroTrip.emoji}</div>
            }
            <div className="hero-trip-overlay" />
            {heroStatus && <div className="hero-trip-status">{heroStatus}</div>}
            <div className="hero-trip-content">
              <div className="hero-trip-name">{heroTrip.emoji} {heroTrip.name}</div>
              <div className="hero-trip-meta">
                {heroTrip.destination && `📍 ${heroTrip.destination}`}
                {heroTrip.startDate && ` · 📅 ${fmtDate(heroTrip.startDate)}${heroTrip.endDate ? ` → ${fmtDate(heroTrip.endDate)}` : ''}`}
              </div>
              <button className="hero-trip-btn">Continue Planning <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trip Highlights (Instagram Stories style) ── */}
      {allTrips.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="sec-hd">
            <span className="sec-title">✨ Trip Highlights</span>
            <button className="sec-link" onClick={() => navigate('/trips')}>View all</button>
          </div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '4px 20px 8px', scrollbarWidth: 'none' }}>
            {allTrips.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06, type: 'spring', damping: 18 }}>
                <HighlightRing trip={t} onOpen={setStory} />
              </motion.div>
            ))}
            <AddRing />
          </div>
          <div style={{ padding: '4px 20px 0', fontSize: 12, color: 'var(--t3)' }}>
            Tap a ring to view photos like Instagram Stories 👆
          </div>
        </div>
      )}

      {/* ── Planning Trips horizontal scroll ── */}
      {planning.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="sec-hd">
            <span className="sec-title">📋 In Planning</span>
            <button className="sec-link" onClick={() => navigate('/trips')}>See all</button>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 20px 8px', scrollbarWidth: 'none' }}>
            {planning.map((t, i) => <MiniTripCard key={t.id} trip={t} delay={i * 0.07} />)}
          </div>
        </div>
      )}



      {/* ── CTA Banner ── */}
      <div style={{ padding: '24px 20px 32px' }}>
        <motion.div className="cta-banner" onClick={() => navigate('/trips')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#fff' }}>Start a New Trip 🗺️</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>Build your itinerary, map & memories</div>
          </div>
          <ArrowRight size={24} color="white" />
        </motion.div>
      </div>
    </div>
  );
}
