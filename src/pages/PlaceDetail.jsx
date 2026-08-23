import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Plus, Trash2 } from 'lucide-react';
import {
  getPlace, getTLTripsByPlace, calcTripTotal, deleteTLTrip,
} from '../utils/tlStorage';
import AddTripModal    from '../components/AddTripModal';
import HighlightViewer from '../components/HighlightViewer';
import { buildPlaceSlides } from '../utils/slides';

const INR    = n => `₹${(Number(n)||0).toLocaleString('en-IN')}`;
const STATUS = {
  planned:   { label: '📌 Planned',   cls: 'tl-status-planned'   },
  ongoing:   { label: '⚡ Ongoing',   cls: 'tl-status-ongoing'   },
  completed: { label: '✓ Done',       cls: 'tl-status-completed' },
};

export default function PlaceDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [place,    setPlace]    = useState(null);
  const [trips,    setTrips]    = useState([]);
  const [addOpen,  setAddOpen]  = useState(false);
  const [viewer,   setViewer]   = useState(null); // { slides, startAt }

  function reload() {
    const p = getPlace(id);
    if (!p) { navigate('/travellist'); return; }
    setPlace(p);
    setTrips(getTLTripsByPlace(id));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [id]);

  function handleAddTrip(trip) { setTrips(prev => [...prev, trip]); }

  function handleDelete(tripId, e) {
    e.stopPropagation();
    if (!confirm('Delete this trip?')) return;
    deleteTLTrip(tripId);
    setTrips(prev => prev.filter(t => t.id !== tripId));
  }

  function openHighlight(startIdx = 0) {
    const slides = buildPlaceSlides(place, trips);
    if (!slides.length) return;
    setViewer({ slides, startAt: startIdx });
  }

  function openTripHighlight(trip, e) {
    e.stopPropagation();
    const slides = buildPlaceSlides(place, [trip]);
    if (!slides.length) return;
    setViewer({ slides, startAt: 0 });
  }

  if (!place) return null;

  const coverBg = place.coverPhoto
    ? `url(${place.coverPhoto}) center/cover no-repeat`
    : 'linear-gradient(135deg, #064E3B 0%, #0EA5E9 100%)';

  return (
    <div className="tl-page">
      {/* Highlight Viewer */}
      <AnimatePresence>
        {viewer && (
          <HighlightViewer
            slides={viewer.slides}
            startAt={viewer.startAt}
            onClose={() => setViewer(null)}
            avatar={{ emoji: place.emoji, photo: place.coverPhoto }}
            title={place.name}
          />
        )}
      </AnimatePresence>

      {/* Add Trip Modal */}
      <AddTripModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={handleAddTrip}
        placeId={id}
      />

      {/* ── Hero Banner ── */}
      <div className="tl-place-hero" style={{ background: coverBg }}>
        <div className="tl-place-hero-overlay" />

        {/* Back + Highlight buttons */}
        <div className="tl-place-hero-nav">
          <button className="tl-icon-btn" onClick={() => navigate('/travellist')}>
            <ArrowLeft size={20} />
          </button>
          <button
            className="tl-icon-btn tl-icon-btn-gold"
            onClick={() => openHighlight()}
            title="View Highlights"
          >
            <Play size={18} fill="currentColor" />
          </button>
        </div>

        {/* Hero text */}
        <div className="tl-place-hero-content">
          <div className="tl-place-hero-emoji">{place.emoji}</div>
          <div className="tl-place-hero-name">{place.name}</div>
          <div className="tl-place-hero-sub">
            {place.stateOfIndia
              ? `${place.stateOfIndia}, India`
              : `${place.country}${place.continent ? ` · ${place.continent}` : ''}`}
          </div>
          <div className="tl-place-hero-meta">
            <span>{trips.length} trip{trips.length !== 1 ? 's' : ''}</span>
            {trips.length > 0 && <span>·</span>}
            {trips.length > 0 && (
              <span>{INR(trips.reduce((s, t) => s + calcTripTotal(t), 0))} spent</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Trip List ── */}
      <div className="tl-place-body">
        <div className="tl-place-section-hd">
          <span className="tl-section-title">Trips</span>
          <motion.button
            className="tl-btn-primary tl-btn-sm"
            onClick={() => setAddOpen(true)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          >
            <Plus size={15} /> Add Trip
          </motion.button>
        </div>

        {trips.length === 0 ? (
          <motion.div
            className="tl-empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="tl-empty-icon">✈️</div>
            <div className="tl-empty-title">No trips yet</div>
            <div className="tl-empty-desc">Start planning your first trip to {place.name}!</div>
            <motion.button
              className="tl-btn-primary"
              onClick={() => setAddOpen(true)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <Plus size={16} /> Plan First Trip
            </motion.button>
          </motion.div>
        ) : (
          <div className="tl-trip-list">
            {trips.map((trip, i) => {
              const total  = calcTripTotal(trip);
              const status = STATUS[trip.status] || STATUS.planned;
              return (
                <motion.div
                  key={trip.id}
                  className="tl-trip-row"
                  onClick={() => navigate(`/tl-trip/${trip.id}`)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="tl-trip-row-icon">{trip.emoji}</div>
                  <div className="tl-trip-row-info">
                    <div className="tl-trip-row-name">{trip.name}</div>
                    <div className="tl-trip-row-meta">
                      <span>{trip.year}</span>
                      {trip.tripNotes && <span>· {trip.tripNotes.slice(0, 40)}{trip.tripNotes.length > 40 ? '…' : ''}</span>}
                    </div>
                    <div className="tl-trip-row-badges">
                      {total > 0 && <span className="tl-badge-rupee">{INR(total)}</span>}
                      <span className={`tl-status-pill ${status.cls}`}>{status.label}</span>
                    </div>
                  </div>
                  <div className="tl-trip-row-actions">
                    <button
                      className="tl-icon-btn tl-icon-btn-sm tl-icon-btn-gold"
                      onClick={e => openTripHighlight(trip, e)}
                      title="View trip highlights"
                    >
                      <Play size={13} fill="currentColor" />
                    </button>
                    <button
                      className="tl-icon-btn tl-icon-btn-sm tl-icon-btn-danger"
                      onClick={e => handleDelete(trip.id, e)}
                      title="Delete trip"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
