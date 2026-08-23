import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createTLTrip } from '../utils/tlStorage';

const TRIP_EMOJIS = ['✈️','🏕️','🗺️','📸','🌅','🏖️','🚗','🎒','🏔️','🚢','🎭','🌏','🏝️','🌄','🛕'];
const STATUS_OPTS = [
  { val: 'planned',   label: '📌 Planned'  },
  { val: 'ongoing',   label: '⚡ Ongoing'  },
  { val: 'completed', label: '✓ Completed' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

export default function AddTripModal({ open, onClose, onAdded, placeId }) {
  const [name,   setName]   = useState('');
  const [year,   setYear]   = useState(currentYear);
  const [notes,  setNotes]  = useState('');
  const [status, setStatus] = useState('planned');
  const [emoji,  setEmoji]  = useState('✈️');
  const [error,  setError]  = useState('');

  function reset() {
    setName(''); setYear(currentYear); setNotes('');
    setStatus('planned'); setEmoji('✈️'); setError('');
  }

  function handleClose() { reset(); onClose(); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Trip name is required.'); return; }
    const trip = createTLTrip({ placeId, name: name.trim(), year, tripNotes: notes.trim(), status, emoji });
    reset();
    onAdded(trip);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="tl-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="tl-modal-card"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="tl-modal-header">
              <div className="tl-modal-title">✈️ Add New Trip</div>
              <button className="tl-modal-close" onClick={handleClose}><X size={20} /></button>
            </div>

            <form className="tl-modal-body" onSubmit={handleSubmit}>
              <div className="tl-form-group">
                <label className="tl-form-label">Trip Name *</label>
                <input
                  className="tl-form-input"
                  placeholder="e.g. North Goa 2024, Paris Honeymoon"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="tl-form-row">
                <div className="tl-form-group" style={{ flex: 1 }}>
                  <label className="tl-form-label">Year</label>
                  <select className="tl-form-input" value={year} onChange={e => setYear(Number(e.target.value))}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="tl-form-group" style={{ flex: 1 }}>
                  <label className="tl-form-label">Status</label>
                  <select className="tl-form-input" value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUS_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="tl-form-group">
                <label className="tl-form-label">Notes (optional)</label>
                <textarea
                  className="tl-form-input tl-form-textarea"
                  placeholder='e.g. "Covered Baga, Anjuna, Fort Aguada"'
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="tl-form-group">
                <label className="tl-form-label">Trip Icon</label>
                <div className="tl-emoji-grid">
                  {TRIP_EMOJIS.map(e => (
                    <button
                      key={e} type="button"
                      className={`tl-emoji-btn ${emoji === e ? 'active' : ''}`}
                      onClick={() => setEmoji(e)}
                    >{e}</button>
                  ))}
                </div>
              </div>

              {error && <div className="tl-form-error">⚠️ {error}</div>}

              <div className="tl-modal-footer">
                <button type="button" className="tl-btn-ghost" onClick={handleClose}>Cancel</button>
                <motion.button
                  type="submit" className="tl-btn-primary"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                  Add Trip ✓
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
