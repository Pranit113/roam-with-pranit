import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload } from 'lucide-react';
import { createPlace } from '../utils/tlStorage';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const CONTINENTS = [
  'East Asia','South Asia','Southeast Asia','Central Asia','Middle East',
  'Europe','North America','South America','Africa','Oceania','Caribbean',
];

const EMOJIS = ['🏝️','🗼','🏔️','🌊','🏜️','🌸','🏛️','🌋','🏯','🌾','🏙️','🗺️','🌴','🏕️','🦁','🐘','🗽','🎭','🍣','🌺'];

export default function AddPlaceModal({ open, onClose, onAdded }) {
  const [name,       setName]      = useState('');
  const [folder,     setFolder]    = useState('domestic');
  const [state,      setState]     = useState('');
  const [continent,  setContinent] = useState('');
  const [country,    setCountry]   = useState('');
  const [emoji,      setEmoji]     = useState('📍');
  const [coverPhoto, setCover]     = useState('');
  const [error,      setError]     = useState('');
  const fileRef = useRef();

  function reset() {
    setName(''); setFolder('domestic'); setState('');
    setContinent(''); setCountry(''); setEmoji('📍');
    setCover(''); setError('');
  }

  function handleClose() { reset(); onClose(); }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCover(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Place name is required.'); return; }
    if (folder === 'domestic' && !state) { setError('Please select a state.'); return; }
    if (folder === 'international' && !country.trim()) { setError('Please enter a country.'); return; }

    const place = createPlace({
      name: name.trim(),
      folder,
      stateOfIndia: folder === 'domestic' ? state : '',
      continent:    folder === 'international' ? continent : '',
      country:      folder === 'domestic' ? 'India' : country.trim(),
      emoji,
      coverPhoto,
    });
    // Reset before closing so next open is clean
    const savedPlace = place;
    reset();
    onAdded(savedPlace);
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
              <div className="tl-modal-title">📍 Add New Place</div>
              <button className="tl-modal-close" onClick={handleClose}><X size={20} /></button>
            </div>

            <form className="tl-modal-body" onSubmit={handleSubmit}>
              {/* Place name */}
              <div className="tl-form-group">
                <label className="tl-form-label">Place Name *</label>
                <input
                  className="tl-form-input"
                  placeholder="e.g. Goa, Paris, Manali, Tokyo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Folder */}
              <div className="tl-form-group">
                <label className="tl-form-label">Category</label>
                <div className="tl-folder-tabs">
                  <button
                    type="button"
                    className={`tl-folder-tab ${folder === 'domestic' ? 'active' : ''}`}
                    onClick={() => setFolder('domestic')}
                  >🇮🇳 Domestic</button>
                  <button
                    type="button"
                    className={`tl-folder-tab ${folder === 'international' ? 'active' : ''}`}
                    onClick={() => setFolder('international')}
                  >🌍 International</button>
                </div>
              </div>

              {/* State or Country */}
              {folder === 'domestic' ? (
                <div className="tl-form-group">
                  <label className="tl-form-label">Indian State *</label>
                  <select className="tl-form-input" value={state} onChange={e => setState(e.target.value)}>
                    <option value="">Select state…</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div className="tl-form-group">
                    <label className="tl-form-label">Country *</label>
                    <input
                      className="tl-form-input"
                      placeholder="e.g. France, Japan, UAE"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="tl-form-group">
                    <label className="tl-form-label">Continent</label>
                    <select className="tl-form-input" value={continent} onChange={e => setContinent(e.target.value)}>
                      <option value="">Select continent…</option>
                      {CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Emoji picker */}
              <div className="tl-form-group">
                <label className="tl-form-label">Cover Icon</label>
                <div className="tl-emoji-grid">
                  {EMOJIS.map(e => (
                    <button
                      key={e} type="button"
                      className={`tl-emoji-btn ${emoji === e ? 'active' : ''}`}
                      onClick={() => setEmoji(e)}
                    >{e}</button>
                  ))}
                </div>
              </div>

              {/* Cover photo */}
              <div className="tl-form-group">
                <label className="tl-form-label">Cover Photo (optional)</label>
                <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handlePhoto} />
                {coverPhoto ? (
                  <div className="tl-cover-preview">
                    <img src={coverPhoto} alt="cover" />
                    <button type="button" className="tl-cover-remove" onClick={() => setCover('')}><X size={14} /></button>
                  </div>
                ) : (
                  <button type="button" className="tl-upload-btn" onClick={() => fileRef.current.click()}>
                    <Upload size={16} /> Upload Photo
                  </button>
                )}
              </div>

              {error && <div className="tl-form-error">⚠️ {error}</div>}

              <div className="tl-modal-footer">
                <button type="button" className="tl-btn-ghost" onClick={handleClose}>Cancel</button>
                <motion.button
                  type="submit" className="tl-btn-primary"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                  Add Place ✓
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
