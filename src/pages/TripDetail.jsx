import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Plus, X, Download, FileText, ZoomIn, Clock, Trash2 } from 'lucide-react';
import {
  getTLTrip, getPlace, updateTLTrip, calcTripTotal,
} from '../utils/tlStorage';
import { uuid } from '../utils/storage';
import { exportTripPDF } from '../utils/pdf';
import AddSpotModal from '../components/AddSpotModal';
import { SPOT_CATEGORIES } from '../utils/categories';

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
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingSpot, setEditingSpot] = useState(null);
  const [filterDay, setFilterDay]     = useState('all');

  const spots = trip.spots || [];

  function handleSaveSpot(spotData) {
    let updatedSpots;
    const exists = spots.some(s => s.id === spotData.id);
    if (exists) {
      updatedSpots = spots.map(s => s.id === spotData.id ? spotData : s);
    } else {
      updatedSpots = [...spots, spotData];
    }

    const updated = updateTLTrip(trip.id, { spots: updatedSpots });
    onChange(updated);
    setEditingSpot(null);
  }

  function deleteSpot(spotId, e) {
    e?.stopPropagation();
    const updatedSpots = spots.filter(s => s.id !== spotId);
    const updated = updateTLTrip(trip.id, { spots: updatedSpots });
    onChange(updated);
  }

  // Extract unique days
  const days = Array.from(new Set(spots.map(s => s.dayNum || 1))).sort((a, b) => a - b);
  const maxDay = days.length ? Math.max(...days) : 1;

  // Filter & sort spots chronologically by day and time
  const filtered = (filterDay === 'all' ? spots : spots.filter(s => (s.dayNum || 1) === Number(filterDay)))
    .sort((a, b) => {
      const dayDiff = (a.dayNum || 1) - (b.dayNum || 1);
      if (dayDiff !== 0) return dayDiff;
      return (a.time || '00:00').localeCompare(b.time || '00:00');
    });

  // Group by day for timeline display
  const groupedByDay = {};
  filtered.forEach(s => {
    const d = s.dayNum || 1;
    if (!groupedByDay[d]) groupedByDay[d] = [];
    groupedByDay[d].push(s);
  });

  return (
    <div className="tl-tab-content">
      <AddSpotModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSpot(null); }}
        onSave={handleSaveSpot}
        existingSpot={editingSpot}
        dayCount={maxDay}
      />

      {/* Top Filter & Add Bar */}
      <div className="tl-spots-bar">
        <div className="tl-spots-filter-scroll">
          <button
            className={`tl-spot-filter-chip ${filterDay === 'all' ? 'active' : ''}`}
            onClick={() => setFilterDay('all')}
          >
            All Days ({spots.length})
          </button>
          {days.map(d => (
            <button
              key={d}
              className={`tl-spot-filter-chip ${filterDay === String(d) ? 'active' : ''}`}
              onClick={() => setFilterDay(String(d))}
            >
              Day {d}
            </button>
          ))}
        </div>

        <motion.button
          className="tl-btn-primary tl-btn-sm"
          onClick={() => { setEditingSpot(null); setModalOpen(true); }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        >
          <Plus size={15} /> Add Detailed Spot
        </motion.button>
      </div>

      {spots.length === 0 ? (
        <div className="tl-tab-empty">
          <div className="tl-tab-empty-icon">📍</div>
          <div>No spots recorded yet</div>
          <p className="tl-tab-hint" style={{ marginTop: 4 }}>Add day-wise spots with exact times, categories, ticket codes & notes!</p>
          <motion.button
            className="tl-btn-primary"
            onClick={() => { setEditingSpot(null); setModalOpen(true); }}
            style={{ marginTop: 12 }}
          >
            <Plus size={16} /> Add First Spot
          </motion.button>
        </div>
      ) : (
        <div className="tl-day-timeline-container">
          {Object.keys(groupedByDay).map(dayKey => {
            const daySpots = groupedByDay[dayKey];
            return (
              <div key={dayKey} className="tl-day-group">
                <div className="tl-day-group-header">
                  <span className="tl-day-group-badge">Day {dayKey}</span>
                  <span className="tl-day-group-count">{daySpots.length} spot{daySpots.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="tl-spot-cards-list">
                  {daySpots.map((spot, i) => {
                    const catObj = SPOT_CATEGORIES.find(c => c.key === spot.category) || SPOT_CATEGORIES[6];
                    return (
                      <motion.div
                        key={spot.id}
                        className="tl-spot-card-rich"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => { setEditingSpot(spot); setModalOpen(true); }}
                      >
                        {/* Time & Category Badge */}
                        <div className="tl-spot-card-top">
                          <div className="tl-spot-time-tag">
                            <Clock size={12} /> {spot.time || '10:00'}
                          </div>
                          <span
                            className="tl-spot-cat-badge"
                            style={{ background: catObj.bg, color: catObj.color }}
                          >
                            {catObj.icon} {catObj.label}
                          </span>
                        </div>

                        {/* Title & Location */}
                        <div className="tl-spot-card-name">{spot.name}</div>

                        {/* Metadata Tags (Ticket code, Cost) */}
                        <div className="tl-spot-card-tags">
                          {spot.ticketCode && (
                            <span className="tl-spot-tag-ticket">
                              🎟️ Ref: {spot.ticketCode}
                            </span>
                          )}
                          {spot.cost > 0 && (
                            <span className="tl-spot-tag-cost">
                              {INR(spot.cost)}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {spot.notes && (
                          <div className="tl-spot-card-notes">
                            {spot.notes}
                          </div>
                        )}

                        {/* Photos */}
                        {spot.photos?.length > 0 && (
                          <div className="tl-spot-card-photos">
                            {spot.photos.map(p => (
                              <img key={p.id} src={p.url} alt="" className="tl-spot-photo-thumb" />
                            ))}
                          </div>
                        )}

                        {/* Delete Action */}
                        <button
                          className="tl-spot-card-del"
                          onClick={e => deleteSpot(spot.id, e)}
                          title="Delete Spot"
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
