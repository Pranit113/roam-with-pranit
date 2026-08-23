import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, DollarSign, Ticket, Camera, MapPin, FileText } from 'lucide-react';
import PlaceAutocompleteInput from './PlaceAutocompleteInput';
import { uuid } from '../utils/storage';
import { SPOT_CATEGORIES } from '../utils/categories';

export default function AddSpotModal({ open, onClose, onSave, existingSpot, dayCount = 3 }) {
  const [dayNum, setDayNum]         = useState(existingSpot?.dayNum || 1);
  const [time, setTime]             = useState(existingSpot?.time || '10:00');
  const [category, setCategory]     = useState(existingSpot?.category || 'viewpoint');
  const [name, setName]             = useState(existingSpot?.name || '');
  const [cost, setCost]             = useState(existingSpot?.cost || '');
  const [ticketCode, setTicketCode] = useState(existingSpot?.ticketCode || '');
  const [notes, setNotes]           = useState(existingSpot?.notes || '');
  const [lat, setLat]               = useState(existingSpot?.lat || null);
  const [lng, setLng]               = useState(existingSpot?.lng || null);
  const [photos, setPhotos]         = useState(existingSpot?.photos || []);
  const [error, setError]           = useState('');

  const daysList = Array.from({ length: Math.max(dayCount, dayNum) }, (_, i) => i + 1);

  function handleSelectPlace(place) {
    if (!place) return;
    setName(place.name || place.address);
    setLat(place.lat);
    setLng(place.lng);
  }

  function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let loaded = 0;
    const newPhotos = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        newPhotos.push({ id: uuid(), url: ev.target.result });
        loaded++;
        if (loaded === files.length) {
          setPhotos(prev => [...prev, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removePhoto(id) {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }

  function resetForm() {
    setName(''); setNotes(''); setCost(''); setTicketCode('');
    setPhotos([]); setError(''); setLat(null); setLng(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a spot name or location.'); return; }

    onSave({
      id: existingSpot?.id || uuid(),
      dayNum: Number(dayNum) || 1,
      time,
      category,
      name: name.trim(),
      cost: Number(cost) || 0,
      ticketCode: ticketCode.trim(),
      notes: notes.trim(),
      lat,
      lng,
      photos,
      createdAt: existingSpot?.createdAt || new Date().toISOString(),
    });

    resetForm();
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
          onClick={onClose}
        >
          <motion.div
            className="tl-modal-card"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div className="tl-modal-header">
              <div className="tl-modal-title">📍 {existingSpot ? 'Edit Spot' : 'Add Spot to Itinerary'}</div>
              <button className="tl-modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <form className="tl-modal-body" onSubmit={handleSubmit}>
              {/* Day & Time Row */}
              <div className="tl-form-row">
                <div className="tl-form-group" style={{ flex: 1 }}>
                  <label className="tl-form-label"><Calendar size={13} /> Select Day *</label>
                  <select className="tl-form-input" value={dayNum} onChange={e => setDayNum(Number(e.target.value))}>
                    {daysList.map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                    <option value={daysList.length + 1}>+ Add Day {daysList.length + 1}</option>
                  </select>
                </div>

                <div className="tl-form-group" style={{ flex: 1 }}>
                  <label className="tl-form-label"><Clock size={13} /> Time *</label>
                  <input
                    className="tl-form-input"
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Spot Category Pills */}
              <div className="tl-form-group">
                <label className="tl-form-label">Spot Category</label>
                <div className="tl-category-pills">
                  {SPOT_CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      className={`tl-cat-pill ${category === cat.key ? 'active' : ''}`}
                      onClick={() => setCategory(cat.key)}
                      style={{
                        borderColor: category === cat.key ? cat.color : 'transparent',
                        background: category === cat.key ? cat.bg : 'var(--g50)',
                        color: category === cat.key ? cat.color : 'var(--t2)',
                      }}
                    >
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spot Location Search */}
              <div className="tl-form-group">
                <label className="tl-form-label"><MapPin size={13} /> Spot / Location Name *</label>
                <PlaceAutocompleteInput
                  value={name}
                  onChange={setName}
                  onSelectPlace={handleSelectPlace}
                  placeholder="e.g. Baga Beach, Taj Mahal, Cafe Chill…"
                />
              </div>

              {/* Cost & Booking Reference */}
              <div className="tl-form-row">
                <div className="tl-form-group" style={{ flex: 1 }}>
                  <label className="tl-form-label"><DollarSign size={13} /> Cost (₹)</label>
                  <input
                    className="tl-form-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                  />
                </div>

                <div className="tl-form-group" style={{ flex: 1 }}>
                  <label className="tl-form-label"><Ticket size={13} /> Booking / Ticket Ref</label>
                  <input
                    className="tl-form-input"
                    placeholder="PNR, Ticket #, Ref"
                    value={ticketCode}
                    onChange={e => setTicketCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Details & Notes */}
              <div className="tl-form-group">
                <label className="tl-form-label"><FileText size={13} /> Small Details & Notes</label>
                <textarea
                  className="tl-form-input tl-form-textarea"
                  placeholder="Opening hours, dress code, tips, what to try, address details…"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Spot Photos */}
              <div className="tl-form-group">
                <label className="tl-form-label"><Camera size={13} /> Spot Photos</label>
                <div className="tl-spot-photo-uploader">
                  <label className="tl-upload-btn">
                    <Camera size={16} />
                    <span>Upload Spot Photos</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>

                  {photos.length > 0 && (
                    <div className="tl-spot-photo-grid">
                      {photos.map(p => (
                        <div key={p.id} className="tl-spot-photo-item">
                          <img src={p.url} alt="" />
                          <button type="button" className="tl-cover-remove" onClick={() => removePhoto(p.id)}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && <div className="tl-form-error">⚠️ {error}</div>}

              <div className="tl-modal-footer">
                <button type="button" className="tl-btn-ghost" onClick={onClose}>Cancel</button>
                <motion.button
                  type="submit"
                  className="tl-btn-primary"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  Save Spot Details ✓
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
