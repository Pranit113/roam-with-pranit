import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ArrowRight, X, ChevronLeft, ChevronRight,
  MapPin, Calendar, Search
} from 'lucide-react';
import { getTrips, getProfile, getTransactions } from '../utils/storage';

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
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ══════════════════════════════════════════════════════════════
   INSTAGRAM-STYLE STORY VIEWER
══════════════════════════════════════════════════════════════ */
function StoryViewer({ trip, onClose }) {
  const photos = [
    ...(trip.cover ? [{ url: trip.cover }] : []),
    ...(trip.highlights || []).flatMap(h =>
      h.photos?.length ? h.photos : (h.url ? [{ url: h.url }] : [])
    ),
  ];
  const seen = new Set();
  const deduped = photos.filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true; });
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (paused || !deduped.length) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (idx < deduped.length - 1) { setIdx(i => i + 1); return 0; }
          else { onClose(); return 100; }
        }
        return p + 2.5;
      });
    }, 75);
    return () => clearInterval(timerRef.current);
  }, [idx, paused, deduped.length, onClose]);

  useEffect(() => { setProgress(0); }, [idx]);

  if (!deduped.length) { onClose(); return null; }

  function prev() { if (idx > 0) { setIdx(i => i - 1); setProgress(0); } }
  function next() { if (idx < deduped.length - 1) { setIdx(i => i + 1); setProgress(0); } else onClose(); }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', flexDirection: 'column', maxWidth: 480, left: '50%', transform: 'translateX(-50%)' }}
      >
        <div style={{ position: 'absolute', top: 52, left: 12, right: 12, display: 'flex', gap: 3, zIndex: 10 }}>
          {deduped.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.35)', borderRadius: 99 }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'white', width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 62, left: 16, right: 16, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{trip.emoji || '✈️'}</div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{trip.name}</div>
              {trip.destination && <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>📍 {trip.destination}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={18} /></button>
        </div>
        <motion.img key={idx} src={deduped[idx]?.url} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 32 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{idx + 1} / {deduped.length}</div>
        </div>
        <div style={{ position: 'absolute', top: 100, left: 0, width: '35%', bottom: 0, cursor: 'pointer', zIndex: 5 }} onClick={prev} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} />
        <div style={{ position: 'absolute', top: 100, right: 0, width: '35%', bottom: 0, cursor: 'pointer', zIndex: 5 }} onClick={next} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => { setPaused(false); next(); }} />
        {idx > 0 && <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 6 }}><ChevronLeft size={20} /></button>}
        {idx < deduped.length - 1 && <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 6 }}><ChevronRight size={20} /></button>}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Highlight Ring ──────────────────────────────────────────── */
function HighlightRing({ trip, onOpen }) {
  const [err, setErr] = useState(false);
  const firstHl = trip.highlights?.[0];
  const cover = firstHl?.photos?.[0]?.url || firstHl?.url || trip.cover;
  const totalPhotos = (trip.highlights || []).reduce((s, h) =>
    s + (h.photos?.length || (h.url ? 1 : 0)), 0
  );

  return (
    <motion.div
      className="hl-wrap"
      onClick={() => onOpen(trip)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.95 }}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 76, flexShrink: 0 }}
    >
      <div style={{
        width: 68, height: 68, borderRadius: '50%',
        padding: 2.5,
        background: totalPhotos > 0
          ? 'linear-gradient(135deg, #10B981, #0EA5E9, #8B5CF6)'
          : 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
        boxShadow: totalPhotos > 0 ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
        transition: 'transform 0.2s',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', padding: 2, overflow: 'hidden' }}>
          {cover && !err
            ? <img src={cover} alt={trip.name} onError={() => setErr(true)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{trip.emoji || '✈️'}</div>
          }
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginTop: 6, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trip.name}</span>
      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{totalPhotos > 0 ? `${totalPhotos} photos` : 'Story'}</span>
    </motion.div>
  );
}

function AddRing() {
  const navigate = useNavigate();
  return (
    <motion.div
      onClick={() => navigate('/trips')}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.95 }}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 76, flexShrink: 0 }}
    >
      <div style={{
        width: 68, height: 68, borderRadius: '50%',
        padding: 2.5,
        background: 'linear-gradient(135deg, #E2E8F0, #CBD5E1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#F8FAFC', border: '1.5px dashed #94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
          <Plus size={24} />
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginTop: 6 }}>New Trip</span>
      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Plan</span>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [profile, setProfile] = useState({ name: 'Pranit' });
  const [story, setStory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    setTrips(getTrips());
    setProfile(getProfile());
  }, []);

  const upcoming = trips.filter(t => t.status === 'upcoming');
  const ongoing  = trips.filter(t => t.status === 'ongoing');

  const heroTrip = ongoing[0] || upcoming.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))[0] || trips[0];
  const heroStatus = heroTrip
    ? heroTrip.status === 'ongoing'
      ? '🟢 Ongoing Adventure'
      : heroTrip.startDate ? `🗓️ ${daysUntil(heroTrip.startDate)} days away` : '📌 Planning Mode'
    : null;

  const totalSpent = getTransactions().reduce((sum, t) => sum + (Number(t.amount) || 0), 0) ||
    trips.reduce((s, t) => s + (t.expenses || []).reduce((es, e) => es + Number(e.amount || 0), 0), 0);

  const countriesCount = [...new Set(trips.map(t => t.country).filter(Boolean))].length;
  const totalPhotos = trips.reduce((s, t) => s + (t.highlights || []).reduce((hs, h) => hs + (h.photos?.length || (h.url ? 1 : 0)), 0), 0);

  const filteredTrips = trips.filter(t => {
    const matchesFilter = selectedFilter === 'all' || t.status === selectedFilter;
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.destination && t.destination.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 110 }}>

      {/* Story Viewer overlay */}
      <AnimatePresence>
        {story && <StoryViewer trip={story} onClose={() => setStory(null)} />}
      </AnimatePresence>

      {/* ── Top Bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10B981, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>
            🌿
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Roam<span style={{ color: '#10B981' }}>WithPranit</span>
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Personal Travel Journal</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button
            onClick={() => navigate('/profile')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #0EA5E9)',
              color: '#fff', fontWeight: 800, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16,185,129,0.25)', border: '2px solid #fff'
            }}
          >
            {(profile.name || 'P')[0].toUpperCase()}
          </motion.button>
        </div>
      </div>

      {/* ── Greeting Hero Banner ── */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{greeting()}</span>
              <span>·</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>Ready to Roam</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginTop: 2 }}>
              Where to next, <span className="grad-text">{profile.name || 'Pranit'}</span>? ✈️
            </div>
          </div>

          <motion.button
            onClick={() => navigate('/trips')}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              background: '#0F172A', color: '#fff', padding: '9px 15px', borderRadius: 99,
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 14px rgba(15,23,42,0.15)', border: 'none'
            }}
          >
            <Plus size={15} /> New Trip
          </motion.button>
        </div>

        {/* Search Bar */}
        <div style={{
          marginTop: 16, position: 'relative', display: 'flex', alignItems: 'center',
          background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)', padding: '0 14px'
        }}>
          <Search size={17} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search destinations, trips, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 10px', border: 'none', background: 'transparent',
              outline: 'none', fontSize: 13, fontFamily: 'Outfit', fontWeight: 500, color: '#0F172A'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: '#94A3B8', border: 'none', background: 'none' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── 4-Card Bento Stats Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, padding: '12px 10px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981', letterSpacing: '-0.02em' }}>{trips.length}</div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.04em' }}>Trips</div>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, padding: '12px 10px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0EA5E9', letterSpacing: '-0.02em' }}>{countriesCount}</div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.04em' }}>Countries</div>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: 16, padding: '12px 10px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#8B5CF6', letterSpacing: '-0.02em' }}>{totalPhotos}</div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.04em' }}>Photos</div>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} onClick={() => navigate('/transactions')} style={{ background: '#fff', borderRadius: 16, padding: '12px 10px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B', letterSpacing: '-0.02em' }}>
              ₹{totalSpent >= 1000 ? `${Math.round(totalSpent / 1000)}k` : totalSpent}
            </div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.04em' }}>Spent</div>
          </motion.div>
        </div>
      </div>

      {/* ── Highlights / Story Reels ── */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 10px' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>✨ Travel Highlights</span>
          </div>
          <button onClick={() => navigate('/trips')} style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>View all</button>
        </div>

        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 20px 12px', scrollbarWidth: 'none' }}>
          {trips.map(t => (
            <HighlightRing key={t.id} trip={t} onOpen={setStory} />
          ))}
          <AddRing />
        </div>
      </div>

      {/* ── Featured / Hero Journey Card ── */}
      {heroTrip && (
        <div style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
              {heroTrip.status === 'ongoing' ? '🟢 Current Adventure' : '🌟 Featured Journey'}
            </span>
            <button onClick={() => navigate('/trips')} style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>All trips</button>
          </div>

          <motion.div
            onClick={() => navigate(`/trip/${heroTrip.id}`)}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{
              position: 'relative',
              borderRadius: 24,
              overflow: 'hidden',
              height: 230,
              boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              background: '#0F172A'
            }}
          >
            {heroTrip.cover ? (
              <img src={heroTrip.cover} alt={heroTrip.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #10B981, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>
                {heroTrip.emoji || '✈️'}
              </div>
            )}

            {/* Dark gradient vignette */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.4) 50%, rgba(15,23,42,0.2) 100%)'
            }} />

            {/* Status Pill */}
            {heroStatus && (
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 800, color: '#0F172A',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                {heroStatus}
              </div>
            )}

            {/* Card Content Overlay */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, color: '#fff' }}>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{heroTrip.emoji}</span>
                <span>{heroTrip.name}</span>
              </div>

              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {heroTrip.destination && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={12} color="#10B981" /> {heroTrip.destination}
                  </span>
                )}
                {heroTrip.startDate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={12} color="#0EA5E9" /> {fmtDate(heroTrip.startDate)} {heroTrip.endDate ? `→ ${fmtDate(heroTrip.endDate)}` : ''}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: 8, fontWeight: 600 }}>
                  {(heroTrip.highlights || []).length} Highlights · {heroTrip.currency || '₹'}{heroTrip.budget || 0} Budget
                </span>
                <span style={{
                  background: '#10B981', color: '#fff', padding: '6px 14px', borderRadius: 99,
                  fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4,
                  boxShadow: '0 2px 10px rgba(16,185,129,0.4)'
                }}>
                  Open Workspace <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Quick Shortcut Hub ── */}
      <div style={{ padding: '8px 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <motion.div
          onClick={() => navigate('/scratchmap')}
          whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
          style={{
            background: '#fff', borderRadius: 18, padding: '16px', border: '1px solid #E2E8F0',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#10B981', flexShrink: 0 }}>
            🌍
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>Travel Map</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Pins & Scratch Map</div>
          </div>
        </motion.div>

        <motion.div
          onClick={() => navigate('/transactions')}
          whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
          style={{
            background: '#fff', borderRadius: 18, padding: '16px', border: '1px solid #E2E8F0',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#F59E0B', flexShrink: 0 }}>
            💳
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>Wallet</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>₹{totalSpent.toLocaleString('en-IN')} Spent</div>
          </div>
        </motion.div>
      </div>

      {/* ── Trips Exploration Section with Filters ── */}
      <div style={{ padding: '8px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Explore Journeys</span>
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{filteredTrips.length} found</span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'All Trips' },
            { id: 'ongoing', label: '🟢 Ongoing' },
            { id: 'upcoming', label: '🗓️ Upcoming' },
            { id: 'planning', label: '📋 Planning' },
            { id: 'completed', label: '🏆 Completed' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 99,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: selectedFilter === f.id ? '#0F172A' : '#fff',
                color: selectedFilter === f.id ? '#fff' : '#64748B',
                border: selectedFilter === f.id ? '1px solid #0F172A' : '1px solid #E2E8F0',
                boxShadow: selectedFilter === f.id ? '0 2px 8px rgba(15,23,42,0.15)' : 'none',
                transition: 'all 0.18s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Trips Grid / List */}
        {filteredTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0', marginTop: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✈️</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>No trips match your filter</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Try clearing the search or filter to see more.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 6 }}>
            {filteredTrips.map(trip => (
              <motion.div
                key={trip.id}
                onClick={() => navigate(`/trip/${trip.id}`)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: '#fff', borderRadius: 20, overflow: 'hidden',
                  border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ height: 130, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #ECFDF5, #E0F2FE)' }}>
                  {trip.cover ? (
                    <img src={trip.cover} alt={trip.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                      {trip.emoji || '✈️'}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: trip.status === 'completed' ? '#D1FAE5' : trip.status === 'ongoing' ? '#DBEAFE' : '#FEF3C7',
                    color: '#0F172A', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, textTransform: 'capitalize'
                  }}>
                    {trip.status || 'planning'}
                  </div>
                </div>

                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{trip.emoji}</span>
                      <span>{trip.name}</span>
                    </div>
                    {trip.destination && (
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="#10B981" /> {trip.destination}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                      {trip.startDate ? fmtDate(trip.startDate) : 'No date set'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 2 }}>
                      Workspace <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer CTA Banner ── */}
      <div style={{ padding: '16px 20px 24px' }}>
        <motion.div
          onClick={() => navigate('/trips')}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          style={{
            background: 'linear-gradient(135deg, #10B981, #0EA5E9)',
            borderRadius: 22, padding: '20px 24px', color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.01em' }}>Create a New Journey 🗺️</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 3 }}>Plan stops, track expenses & make memories</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={20} color="#fff" />
          </div>
        </motion.div>
      </div>

    </div>
  );
}