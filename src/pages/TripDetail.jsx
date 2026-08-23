import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Plus, X, Download, FileText, ZoomIn } from 'lucide-react';
import {
  getTLTrip, getPlace, updateTLTrip, calcTripTotal,
} from '../utils/tlStorage';
import { uuid } from '../utils/storage';
import { exportTripPDF } from '../utils/pdf';

const INR = n => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const EXPENSE_CATS = [
  { key: 'train',  label: 'Train',      icon: '🚂' },
  { key: 'car',    label: 'Car / Cab',  icon: '🚗' },
  { key: 'flight', label: 'Flight',     icon: '✈️'  },
  { key: 'food',   label: 'Food',       icon: '🍽️'  },
  { key: 'stay',   label: 'Stay / Hotel', icon: '🏨' },
];

/* ─── Photos Tab ─────────────────────────────────────────────────────────────── */
function PhotosTab({ trip, onChange }) {
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();

  function addPhotos(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Read all files, then write once to avoid race condition
    let loaded = 0;
    const newPhotos = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        newPhotos.push({ id: uuid(), url: ev.target.result });
        loaded++;
        if (loaded === files.length) {
          // All files read — merge and save once
          const updated = updateTLTrip(trip.id, {
            photos: [...(trip.photos || []), ...newPhotos],
          });
          onChange(updated);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function deletePhoto(photoId) {
    const photos  = (trip.photos || []).filter(p => p.id !== photoId);
    const updated = updateTLTrip(trip.id, { photos });
    onChange(updated);
    if (lightbox?.id === photoId) setLightbox(null);
  }

  const photos = trip.photos || [];

  return (
    <div className="tl-tab-content">
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="tl-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.img
              src={lightbox.url}
              className="tl-lightbox-img"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
            />
            <button className="tl-lightbox-close" onClick={() => setLightbox(null)}><X size={20} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="tl-photos-header">
        <span className="tl-tab-hint">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        <input type="file" accept="image/*" multiple ref={fileRef} style={{ display: 'none' }} onChange={addPhotos} />
        <motion.button
          className="tl-btn-primary tl-btn-sm"
          onClick={() => fileRef.current.click()}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        >
          <Camera size={15} /> Add Photos
        </motion.button>
      </div>

      {photos.length === 0 ? (
        <div className="tl-tab-empty">
          <div className="tl-tab-empty-icon">📸</div>
          <div>No photos yet</div>
          <button className="tl-btn-ghost" onClick={() => fileRef.current.click()}>
            Pick from device
          </button>
        </div>
      ) : (
        <div className="tl-photo-grid">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              className="tl-photo-thumb"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover="hover"
            >
              <img src={photo.url} alt="" onClick={() => setLightbox(photo)} />
              <motion.div className="tl-photo-thumb-overlay" variants={{ hover: { opacity: 1 } }} initial={{ opacity: 0 }}>
                <button className="tl-photo-zoom" onClick={() => setLightbox(photo)}><ZoomIn size={14} /></button>
                <button className="tl-photo-del" onClick={() => deletePhoto(photo.id)}><X size={14} /></button>
              </motion.div>
              {i === 0 && <span className="tl-photo-cover-badge">Cover</span>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Spots Tab ──────────────────────────────────────────────────────────────── */
function SpotsTab({ trip, onChange }) {
  const [input, setInput] = useState('');

  function addSpot() {
    if (!input.trim()) return;
    const spot    = { id: uuid(), name: input.trim() };
    const spots   = [...(trip.spots || []), spot];
    const updated = updateTLTrip(trip.id, { spots });
    onChange(updated);
    setInput('');
  }

  function deleteSpot(spotId) {
    const spots   = (trip.spots || []).filter(s => s.id !== spotId);
    const updated = updateTLTrip(trip.id, { spots });
    onChange(updated);
  }

  const spots = trip.spots || [];

  return (
    <div className="tl-tab-content">
      <div className="tl-spot-input-row">
        <input
          className="tl-form-input tl-spot-input"
          placeholder="e.g. Baga Beach, Fort Aguada…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSpot()}
        />
        <motion.button
          className="tl-btn-primary tl-btn-sm"
          onClick={addSpot}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} />
        </motion.button>
      </div>
      <p className="tl-tab-hint">Press Enter or + to add</p>

      {spots.length === 0 ? (
        <div className="tl-tab-empty">
          <div className="tl-tab-empty-icon">📍</div>
          <div>No spots recorded yet</div>
        </div>
      ) : (
        <div className="tl-spot-list">
          {spots.map((spot, i) => (
            <motion.div
              key={spot.id}
              className="tl-spot-row"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <span className="tl-spot-icon">📍</span>
              <span className="tl-spot-name">{spot.name}</span>
              <button className="tl-spot-del" onClick={() => deleteSpot(spot.id)}><X size={14} /></button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Expenses Tab ───────────────────────────────────────────────────────────── */
function ExpensesTab({ trip, onChange, place }) {
  const exp  = trip.expenses || { train: 0, car: 0, flight: 0, food: 0, stay: 0, activities: [] };
  const [actName, setActName] = useState('');
  const [actAmt,  setActAmt]  = useState('');

  function updateCat(cat, val) {
    const updated = updateTLTrip(trip.id, {
      expenses: { ...exp, [cat]: Number(val) || 0 },
    });
    onChange(updated);
  }

  function addActivity() {
    if (!actName.trim()) return;
    const activity = { id: uuid(), name: actName.trim(), amount: Number(actAmt) || 0 };
    const updated  = updateTLTrip(trip.id, {
      expenses: { ...exp, activities: [...(exp.activities || []), activity] },
    });
    onChange(updated);
    setActName(''); setActAmt('');
  }

  function deleteActivity(actId) {
    const updated = updateTLTrip(trip.id, {
      expenses: { ...exp, activities: (exp.activities || []).filter(a => a.id !== actId) },
    });
    onChange(updated);
  }

  const total = calcTripTotal(trip);

  return (
    <div className="tl-tab-content">
      {/* Fixed categories */}
      <div className="tl-expense-section-title">Transport & Stay</div>
      {EXPENSE_CATS.map(cat => (
        <div key={cat.key} className="tl-expense-row">
          <span className="tl-expense-icon">{cat.icon}</span>
          <span className="tl-expense-label">{cat.label}</span>
          <div className="tl-expense-input-wrap">
            <span className="tl-expense-rupee">₹</span>
            <input
              className="tl-expense-input"
              type="number"
              min="0"
              placeholder="0"
              value={exp[cat.key] || ''}
              onChange={e => updateCat(cat.key, e.target.value)}
            />
          </div>
        </div>
      ))}

      {/* Custom activities */}
      <div className="tl-expense-section-title" style={{ marginTop: 20 }}>🎯 Activities</div>
      {(exp.activities || []).map(a => (
        <div key={a.id} className="tl-expense-activity-row">
          <span className="tl-expense-icon">🎯</span>
          <span className="tl-expense-label">{a.name}</span>
          <span className="tl-expense-act-amt">{INR(a.amount)}</span>
          <button className="tl-spot-del" onClick={() => deleteActivity(a.id)}><X size={14} /></button>
        </div>
      ))}

      <div className="tl-expense-add-act">
        <input
          className="tl-form-input"
          placeholder="Activity name (e.g. Scuba diving)"
          value={actName}
          onChange={e => setActName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addActivity()}
          style={{ flex: 2 }}
        />
        <div className="tl-expense-input-wrap" style={{ flex: 1 }}>
          <span className="tl-expense-rupee">₹</span>
          <input
            className="tl-expense-input"
            type="number" min="0" placeholder="0"
            value={actAmt}
            onChange={e => setActAmt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addActivity()}
          />
        </div>
        <motion.button
          className="tl-btn-primary tl-btn-sm"
          onClick={addActivity}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} />
        </motion.button>
      </div>

      {/* Summary */}
      <div className="tl-expense-summary">
        <div className="tl-expense-section-title">Summary</div>
        {EXPENSE_CATS.map(cat => {
          const val = Number(exp[cat.key]) || 0;
          if (!val) return null;
          return (
            <div key={cat.key} className="tl-summary-row">
              <span>{cat.icon} {cat.label}</span>
              <span>{INR(val)}</span>
            </div>
          );
        })}
        {(exp.activities || []).map(a => (
          <div key={a.id} className="tl-summary-row">
            <span>🎯 {a.name}</span>
            <span>{INR(a.amount)}</span>
          </div>
        ))}
        <div className="tl-summary-total">
          <span>TOTAL</span>
          <span>{INR(total)}</span>
        </div>
      </div>

      {/* PDF Export */}
      <motion.button
        className="tl-pdf-btn"
        onClick={() => exportTripPDF(trip, place)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <FileText size={16} /> Export PDF Itinerary
        <Download size={14} />
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TripDetail Page
═══════════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'photos',   label: '📸 Photos'   },
  { id: 'spots',    label: '📍 Spots'    },
  { id: 'expenses', label: '₹ Expenses'  },
];

export default function TripDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [trip,    setTrip]  = useState(null);
  const [place,   setPlace] = useState(null);
  const [tab,     setTab]   = useState('photos');

  function reload() {
    const t = getTLTrip(id);
    if (!t) { navigate(-1); return; }
    setTrip(t);
    setPlace(getPlace(t.placeId));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [id]);

  if (!trip) return null;

  const STATUS_MAP = { planned: '📌 Planned', ongoing: '⚡ Ongoing', completed: '✓ Done' };
  const heroBg = trip.photos?.[0]?.url
    ? `url(${trip.photos[0].url}) center/cover no-repeat`
    : 'linear-gradient(135deg, #064E3B 0%, #0EA5E9 100%)';

  return (
    <div className="tl-page">
      {/* ── Hero ── */}
      <div className="tl-trip-hero" style={{ background: heroBg }}>
        <div className="tl-place-hero-overlay" />
        <div className="tl-place-hero-nav">
          <button className="tl-icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="tl-trip-hero-content">
          <div className="tl-trip-hero-emoji">{trip.emoji}</div>
          <div className="tl-trip-hero-name">{trip.name}</div>
          <div className="tl-trip-hero-meta">
            {place && <span>{place.name}</span>}
            <span>·</span>
            <span>{trip.year}</span>
            <span className="tl-trip-hero-status">{STATUS_MAP[trip.status]}</span>
          </div>
          {trip.tripNotes && (
            <div className="tl-trip-hero-notes">{trip.tripNotes}</div>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="tl-tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tl-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <div className="tl-tab-indicator" style={{ left: `${TABS.findIndex(t => t.id === tab) * (100 / TABS.length)}%`, width: `${100 / TABS.length}%` }} />
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'photos'   && <PhotosTab   trip={trip} onChange={setTrip} />}
          {tab === 'spots'    && <SpotsTab    trip={trip} onChange={setTrip} />}
          {tab === 'expenses' && <ExpensesTab trip={trip} place={place} onChange={setTrip} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
