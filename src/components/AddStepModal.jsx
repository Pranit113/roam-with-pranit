import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, MapPin, DollarSign, Calendar, Clock } from 'lucide-react';
import PlaceAutocompleteInput from './PlaceAutocompleteInput';
import { uuid } from '../utils/storage';

const TRANSPORTS = [
  { key: 'flight', label: 'Flight', icon: '✈️' },
  { key: 'train',  label: 'Train',  icon: '🚆' },
  { key: 'car',    label: 'Car',    icon: '🚗' },
  { key: 'boat',   label: 'Boat',   icon: '⛵' },
  { key: 'hike',   label: 'Hike',   icon: '🥾' },
  { key: 'bus',    label: 'Bus',    icon: '🚌' },
];

const WEATHERS = [
  { key: 'sunny',  label: 'Sunny',  icon: '☀️' },
  { key: 'cloudy', label: 'Cloudy', icon: '⛅' },
  { key: 'rainy',  label: 'Rainy',  icon: '🌧️' },
  { key: 'snowy',  label: 'Snowy',  icon: '❄️' },
];

export default function AddStepModal({ open, onClose, onSave, initialCoords }) {
  const [name, setName]           = useState('');
  const [lat, setLat]             = useState(initialCoords?.lat || 20.5937);
  const [lng, setLng]             = useState(initialCoords?.lng || 78.9629);
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime]           = useState('12:00');
  const [transport, setTransport] = useState('flight');
  const [weather, setWeather]     = useState('sunny');
  const [notes, setNotes]         = useState('');
  const [cost, setCost]           = useState('');
  const [photos, setPhotos]       = useState([]);
  const [error, setError]         = useState('');

  function handleSelectPlace(place) {
    if (!place) return;
    setName(place.name || place.address);
    setLat(place.lat);
    setLng(place.lng);
  }

  function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setPhotos(prev => [...prev, { id: uuid(), url: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(id) {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter or select a step location.'); return; }

    onSave({
      name: name.trim(),
      lat: Number(lat),
      lng: Number(lng),
      date,
      time,
      transportMode: transport,
      notes: notes.trim(),
      cost: Number(cost) || 0,
      photos,
      weather: WEATHERS.find(w => w.key === weather) || null,
    });

    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ps-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="ps-modal-card"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="ps-modal-header">
              <div className="ps-modal-title">📍 Record Travel Step</div>
              <button className="ps-modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <form className="ps-modal-body" onSubmit={handleSubmit}>
              {/* Location Autocomplete */}
              <div className="ps-form-group">
                <label className="ps-label">Location / Stop Name *</label>
                <PlaceAutocompleteInput
                  value={name}
                  onChange={setName}
                  onSelectPlace={handleSelectPlace}
                  placeholder="Search city, beach, airport, hotel…"
                />
                <div className="ps-coords-hint">
                  <MapPin size={12} color="var(--em)" />
                  <span>GPS: {lat.toFixed(4)}, {lng.toFixed(4)}</span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="ps-form-row">
                <div className="ps-form-group">
                  <label className="ps-label"><Calendar size={13} /> Date</label>
                  <input className="ps-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="ps-form-group">
                  <label className="ps-label"><Clock size={13} /> Time</label>
                  <input className="ps-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>

              {/* Transport Mode */}
              <div className="ps-form-group">
                <label className="ps-label">Transport Mode from Previous Stop</label>
                <div className="ps-option-pills">
                  {TRANSPORTS.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      className={`ps-option-pill ${transport === t.key ? 'active' : ''}`}
                      onClick={() => setTransport(t.key)}
                    >
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather & Cost */}
              <div className="ps-form-row">
                <div className="ps-form-group">
                  <label className="ps-label">Weather Status</label>
                  <div className="ps-option-pills">
                    {WEATHERS.map(w => (
                      <button
                        key={w.key}
                        type="button"
                        className={`ps-option-pill ${weather === w.key ? 'active' : ''}`}
                        onClick={() => setWeather(w.key)}
                      >
                        <span>{w.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ps-form-group">
                  <label className="ps-label"><DollarSign size={13} /> Step Cost (₹)</label>
                  <input
                    className="ps-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                  />
                </div>
              </div>

              {/* Journal Notes */}
              <div className="ps-form-group">
                <label className="ps-label">Travel Journal & Story Notes</label>
                <textarea
                  className="ps-input ps-textarea"
                  placeholder="Write your travel story, feelings, highlight of the day…"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Photo Upload */}
              <div className="ps-form-group">
                <label className="ps-label">Step Photos</label>
                <div className="ps-photo-uploader">
                  <label className="ps-photo-add-btn">
                    <Camera size={18} />
                    <span>Upload Photos</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>

                  <div className="ps-photo-preview-grid">
                    {photos.map(p => (
                      <div key={p.id} className="ps-photo-thumb">
                        <img src={p.url} alt="" />
                        <button type="button" className="ps-photo-remove" onClick={() => removePhoto(p.id)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && <div className="ps-form-error">⚠️ {error}</div>}

              <div className="ps-modal-footer">
                <button type="button" className="ps-btn-ghost" onClick={onClose}>Cancel</button>
                <motion.button
                  type="submit"
                  className="ps-btn-primary"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  Save Travel Step ✓
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
