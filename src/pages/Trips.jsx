import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, MapPin, Trash2, ChevronRight } from 'lucide-react';
import { getTrips, createTrip, deleteTrip } from '../utils/storage';
import BottomSheet from '../components/BottomSheet';
import PlaceAutocompleteInput from '../components/PlaceAutocompleteInput';

const EMOJIS  = ['✈️','🏖️','🏔️','🌸','🗼','🏝️','🌴','🚗','🏕️','🌊','🗺️','🎒','🌅','🏯','🚢','🚂','🎿','🤿'];
const COVERS  = [
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&fit=crop',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&fit=crop',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&fit=crop',
  'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&fit=crop',
  'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&fit=crop',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&fit=crop',
];
const CURRENCIES = ['₹','$','€','£','¥','AED'];
const STATUSES   = ['planning','upcoming','ongoing','completed'];
const FILTERS    = ['All','Planning','Upcoming','Ongoing','Completed'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
  'West Bengal', 'Andaman and Nicobar', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

function statusClass(s) {
  const m = { planning:'s-planning', upcoming:'s-upcoming', ongoing:'s-ongoing', completed:'s-completed' };
  return `badge ${m[s] || 's-planning'}`;
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

/* ─── Trip Card ─────────────────────────────────────────────── */
function TripCard({ trip, onDelete }) {
  const navigate = useNavigate();
  const [err, setErr] = useState(false);
  const spent = (trip.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const pct   = trip.budget > 0 ? Math.min(100, (spent / trip.budget) * 100) : 0;

  return (
    <motion.div
      layout initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, scale:0.95 }}
      className="trip-card"
      onClick={() => navigate(`/trip/${trip.id}`)}
    >
      {/* Cover with status overlay */}
      <div className="trip-card-img-wrap">
        {trip.cover && !err
          ? <img src={trip.cover} alt={trip.name} onError={() => setErr(true)} />
          : <div className="trip-card-placeholder">{trip.emoji || '✈️'}</div>
        }
        <span className={`trip-card-status ${statusClass(trip.status)}`}>
          {trip.status ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1) : 'Planning'}
        </span>
      </div>

      {/* Body */}
      <div className="trip-card-body">
        <div className="trip-card-title">{trip.emoji} {trip.name || 'Untitled Trip'}</div>
        <div className="trip-card-meta">
          {trip.destination && <><MapPin size={13} color="var(--em)" /><span>{trip.destination}</span></>}
          {trip.startDate && <><Calendar size={13} color="var(--sky)" /><span>{fmtDate(trip.startDate)}{trip.endDate ? ` → ${fmtDate(trip.endDate)}` : ''}</span></>}
        </div>

        {/* Tags */}
        {trip.tags?.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {trip.tags.map(t => <span key={t} className="badge badge-em">{t}</span>)}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display:'flex', gap:12, marginBottom: trip.budget > 0 ? 10 : 0 }}>
          {(trip.days || []).length > 0 && <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>📅 {trip.days.length} days</span>}
          {(trip.pins || []).length > 0  && <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>📍 {trip.pins.length} pins</span>}
          {(trip.highlights || []).length > 0 && <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>📸 {trip.highlights.length} photos</span>}
        </div>

        {/* Budget bar */}
        {trip.budget > 0 && (
          <div className="budget-bar-wrap">
            <div className="budget-bar-hd">
              <span style={{ color:'var(--t3)', fontWeight:500 }}>Spent</span>
              <span style={{ fontWeight:800, color:'var(--t1)' }}>{trip.currency}{spent.toLocaleString()} / {trip.currency}{Number(trip.budget).toLocaleString()}</span>
            </div>
            <div className="budget-bar-track"><div className="budget-bar-fill" style={{ width:`${pct}%` }} /></div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
          <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); navigate(`/trip/${trip.id}`); }}>
            Open Workspace <ChevronRight size={14} />
          </button>
          <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDelete(trip.id); }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────── */
export default function Trips() {
  const navigate  = useNavigate();
  const [trips,   setTrips]   = useState([]);
  const [filter,  setFilter]  = useState('All');
  const [open,    setOpen]    = useState(false);

  // Form
  const [name,     setName]     = useState('');
  const [emoji,    setEmoji]    = useState('✈️');
  const [cover,    setCover]    = useState(COVERS[0]);
  const [dest,      setDest]     = useState('');
  const [country,  setCountry]  = useState('India');
  const [stateOfIndia, setStateOfIndia] = useState('');
  const [start,    setStart]    = useState('');
  const [end,      setEnd]      = useState('');
  const [budget,   setBudget]   = useState('');
  const [currency, setCurrency] = useState('₹');
  const [status,   setStatus]   = useState('planning');
  const [tags,     setTags]     = useState('');
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(() => setTrips(getTrips()), []);
  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'All' ? trips : trips.filter(t => t.status === filter.toLowerCase());

  function reset() {
    setName(''); setEmoji('✈️'); setCover(COVERS[0]); setDest(''); setCountry('India'); setStateOfIndia('');
    setStart(''); setEnd(''); setBudget(''); setCurrency('₹'); setStatus('planning'); setTags('');
  }

  function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    const trip = createTrip({
      name: name.trim(), emoji, cover, destination: dest.trim(), country: country.trim(),
      stateOfIndia: country.trim().toLowerCase() === 'india' ? stateOfIndia : '',
      startDate: start, endDate: end, status,
      budget: Number(budget) || 0, currency,
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
    });
    setSaving(false);
    setOpen(false); reset(); load();
    navigate(`/trip/${trip.id}`);
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    deleteTrip(id); load();
  }

  return (
    <div className="page" style={{ background:'#F8FAFC' }}>

      {/* Page Header */}
      <div className="page-hd">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div className="page-hd-title">My Trips 🗺️</div>
            <div className="page-hd-sub">{trips.length} adventure{trips.length !== 1 ? 's' : ''}</div>
          </div>
          <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:99 }}>
            <Plus size={16} /> Plan Trip
          </button>
        </div>
        {trips.length > 0 && (
          <div style={{ display:'flex', gap:8, overflowX:'auto', marginTop:14, paddingBottom:2, scrollbarWidth:'none' }}>
            {FILTERS.map(f => (
              <button key={f} className={`filter-chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        )}
      </div>

      {/* Empty */}
      {trips.length === 0 && (
        <div className="empty">
          <div className="empty-icon">✈️</div>
          <div className="empty-title">No trips yet</div>
          <div className="empty-desc">Tap the + button to plan your first adventure. Everything lives here — itinerary, map, photos, budget.</div>
          <button className="btn btn-lg btn-primary" onClick={() => setOpen(true)}><Plus size={20} /> Plan First Adventure</button>
        </div>
      )}

      {/* Trip List */}
      {trips.length > 0 && (
        <div style={{ padding:'20px 20px 100px', display:'flex', flexDirection:'column', gap:16 }}>
          <AnimatePresence>
            {filtered.map(t => <TripCard key={t.id} trip={t} onDelete={handleDelete} />)}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'50px 0', color:'var(--t3)' }}>
              <div style={{ fontSize:40 }}>🔍</div>
              <div style={{ fontWeight:700, marginTop:10 }}>No {filter.toLowerCase()} trips</div>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => setOpen(true)} title="New Trip">+</button>

      {/* ── Create Trip Sheet ── */}
      <BottomSheet open={open} onClose={() => { setOpen(false); reset(); }} title="Plan a New Trip ✈️">

        <div className="field">
          <div className="field-label">Trip Icon</div>
          <div className="emoji-grid">
            {EMOJIS.map(e => (
              <button key={e} className={`emoji-btn${emoji === e ? ' sel' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">Trip Name *</div>
          <input className="input" placeholder="e.g. Goa Road Trip" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="field">
          <div className="field-label">Cover Photo</div>
          <div className="cover-grid">
            {COVERS.map(c => (
              <img key={c} src={c} className={`cover-thumb${cover === c ? ' sel' : ''}`} onClick={() => setCover(c)} alt="cover" />
            ))}
          </div>
          <input className="input input-sm" placeholder="Or paste any image URL…" value={cover} onChange={e => setCover(e.target.value)} style={{ marginTop:8 }} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="field">
            <div className="field-label">Destination</div>
            <PlaceAutocompleteInput
              placeholder="e.g. Goa, Manali, Jaipur…"
              value={dest}
              onChange={val => setDest(val)}
              onSelectLocation={loc => {
                setDest(loc.name);
                if (loc.address) {
                  const addrLower = loc.address.toLowerCase();
                  if (addrLower.includes('india') && !country) setCountry('India');
                  // Check if any state is in address
                  INDIAN_STATES.forEach(st => {
                    if (addrLower.includes(st.toLowerCase())) {
                      setStateOfIndia(st);
                      setCountry('India');
                    }
                  });
                }
              }}
            />
          </div>
          <div className="field">
            <div className="field-label">Country</div>
            <input className="input" placeholder="e.g. India" value={country} onChange={e => setCountry(e.target.value)} />
          </div>
        </div>

        {country.trim().toLowerCase() === 'india' && (
          <div className="field">
            <div className="field-label">State of India (optional)</div>
            <select className="input" value={stateOfIndia} onChange={e => setStateOfIndia(e.target.value)}>
              <option value="">-- Select State --</option>
              {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="field">
            <div className="field-label">Start Date</div>
            <input className="input" type="date" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">End Date</div>
            <input className="input" type="date" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'80px 1fr', gap:12 }}>
          <div className="field">
            <div className="field-label">Currency</div>
            <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <div className="field-label">Total Budget</div>
            <input className="input" type="number" placeholder="25000" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Status</div>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <div className="field">
          <div className="field-label">Tags</div>
          <input className="input" placeholder="e.g. Beach, Road Trip, Friends" value={tags} onChange={e => setTags(e.target.value)} />
          <div className="field-hint">Separate with commas</div>
        </div>

        <button
          className="btn btn-lg btn-primary btn-full"
          onClick={handleCreate}
          disabled={!name.trim() || saving}
          style={{ marginBottom:16 }}
        >
          {saving ? <div className="spinner" /> : <><Plus size={20} /> Create Trip</>}
        </button>
      </BottomSheet>
    </div>
  );
}
