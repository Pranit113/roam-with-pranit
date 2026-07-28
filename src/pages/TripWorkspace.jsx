import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import {
  getTrip, addDay, deleteDay, addActivity, deleteActivity,
  addNote, deleteNote, addExpense, deleteExpense,
  addHighlight, deleteHighlight,
  getJournalEntry, saveJournalEntry,
} from '../utils/storage';
import { uploadPhoto, deletePhotoFromStorage } from '../utils/supabase';
import MapView from '../components/MapView';
import BottomSheet from '../components/BottomSheet';

/* ── activity types ──────────────────────────────────────────── */
const ACT_TYPES = [
  { key:'flight',   emoji:'✈️', label:'Flight',    bg:'#EEF2FF', color:'#4F46E5' },
  { key:'hotel',    emoji:'🏨', label:'Hotel',     bg:'#F5F3FF', color:'#7C3AED' },
  { key:'food',     emoji:'🍽️', label:'Food',      bg:'#FFFBEB', color:'#B45309' },
  { key:'beach',    emoji:'🏖️', label:'Beach',     bg:'#F0F9FF', color:'#0369A1' },
  { key:'hike',     emoji:'🥾', label:'Hike',      bg:'#F7FEE7', color:'#4D7C0F' },
  { key:'drive',    emoji:'🚗', label:'Drive',     bg:'#F0FFF4', color:'#15803D' },
  { key:'shopping', emoji:'🛒', label:'Shopping',  bg:'#FFF7ED', color:'#C2410C' },
  { key:'activity', emoji:'🎭', label:'Activity',  bg:'#FDF2F8', color:'#BE185D' },
  { key:'temple',   emoji:'🛕', label:'Temple',    bg:'#FEF9C3', color:'#713F12' },
  { key:'boat',     emoji:'🚢', label:'Boat',      bg:'#E0F2FE', color:'#0284C7' },
  { key:'train',    emoji:'🚂', label:'Train',     bg:'#F1F5F9', color:'#475569' },
  { key:'sunrise',  emoji:'🌅', label:'Sunrise',   bg:'#FFF7ED', color:'#EA580C' },
];

/* ── expense categories ──────────────────────────────────────── */
const EXP_CATS = [
  { key:'transport',     emoji:'🚌', label:'Transport',    color:'#0EA5E9', bg:'#F0F9FF' },
  { key:'accommodation', emoji:'🏨', label:'Stay',         color:'#8B5CF6', bg:'#F5F3FF' },
  { key:'food',          emoji:'🍽️', label:'Food',         color:'#F59E0B', bg:'#FFFBEB' },
  { key:'activities',    emoji:'🎭', label:'Activities',   color:'#EC4899', bg:'#FDF2F8' },
  { key:'shopping',      emoji:'🛍️', label:'Shopping',     color:'#F97316', bg:'#FFF7ED' },
  { key:'other',         emoji:'📦', label:'Other',        color:'#64748B', bg:'#F1F5F9' },
];

const TABS = [
  { id:'itinerary', label:'Itinerary', icon:'🗓' },
  { id:'map',       label:'Map',       icon:'🗺️' },
  { id:'gallery',   label:'Gallery',   icon:'📸' },
  { id:'budget',    label:'Budget',    icon:'💰' },
  { id:'journal',   label:'Journal',   icon:'📖' },
  { id:'notes',     label:'Notes',     icon:'📝' },
];

/* ══════════════════════════════════════════════════════════════ */
/*  ITINERARY TAB                                                 */
/* ══════════════════════════════════════════════════════════════ */
function ItineraryTab({ trip, refresh }) {
  const [openDay,   setOpenDay]   = useState(null);
  const [daySheet,  setDaySheet]  = useState(false);
  const [actSheet,  setActSheet]  = useState(false);
  const [targetDay, setTargetDay] = useState(null);

  const [dayDate,  setDayDate]  = useState('');
  const [dayTitle, setDayTitle] = useState('');
  const [actTime,  setActTime]  = useState('');
  const [actType,  setActType]  = useState('food');
  const [actTitle, setActTitle] = useState('');
  const [actPlace, setActPlace] = useState('');
  const [actCost,  setActCost]  = useState('');
  const [actNote,  setActNote]  = useState('');

  const autocompleteInstRef = useRef(null);

  // Attach autocomplete when sheet is opened
  useEffect(() => {
    if (!actSheet || !window.google || !window.google.maps || !window.google.maps.places) return;

    const timer = setTimeout(() => {
      const input = document.getElementById('activity-place-autocomplete');
      if (!input) return;

      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        fields: ['name', 'formatted_address', 'geometry'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.name || place.formatted_address) {
          setActPlace(place.name || place.formatted_address || '');
        }
      });

      autocompleteInstRef.current = autocomplete;
    }, 300);

    return () => {
      clearTimeout(timer);
      if (autocompleteInstRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstRef.current);
        autocompleteInstRef.current = null;
      }
    };
  }, [actSheet]);

  const atype = k => ACT_TYPES.find(t => t.key === k) || ACT_TYPES[2];

  function saveDay() {
    const num = (trip.days?.length || 0) + 1;
    addDay(trip.id, { day: num, date: dayDate, title: dayTitle || `Day ${num}` });
    refresh(); setDaySheet(false); setDayDate(''); setDayTitle('');
  }

  function saveActivity() {
    if (!targetDay || !actTitle.trim()) return;
    addActivity(trip.id, targetDay, {
      time: actTime, type: actType, title: actTitle.trim(),
      place: actPlace.trim(), cost: Number(actCost) || 0, note: actNote.trim(),
    });
    refresh(); setActSheet(false);
    setActTime(''); setActType('food'); setActTitle(''); setActPlace(''); setActCost(''); setActNote('');
  }

  /* empty state */
  if (!(trip.days?.length)) return (
    <>
      <div className="empty" style={{ minHeight:300 }}>
        <div className="empty-icon" style={{ fontSize:56 }}>🗓</div>
        <div className="empty-title">No days planned yet</div>
        <div className="empty-desc">Add your first day and start building your trip timeline.</div>
        <button className="btn btn-md btn-primary" onClick={() => setDaySheet(true)}><Plus size={18} /> Add First Day</button>
      </div>

      <BottomSheet open={daySheet} onClose={() => setDaySheet(false)} title="Add a Day">
        <div className="field"><div className="field-label">Date (optional)</div>
          <input className="input" type="date" value={dayDate} onChange={e => setDayDate(e.target.value)} /></div>
        <div className="field"><div className="field-label">Day Title</div>
          <input className="input" placeholder="e.g. Arrival Day, Beach Day…" value={dayTitle} onChange={e => setDayTitle(e.target.value)} /></div>
        <button className="btn btn-lg btn-primary btn-full" onClick={saveDay}><Plus size={18} /> Add Day</button>
      </BottomSheet>
    </>
  );

  return (
    <div>
      {/* Journey Ribbon */}
      <div className="timeline">
        {trip.days.map((day, idx) => {
          const isOpen = openDay === day.id;
          const isLast = idx === trip.days.length - 1;
          return (
            <div key={day.id} className="tl-item">
              <div className="tl-left">
                <div className="tl-dot">{day.day}</div>
                {!isLast && <div className="tl-line" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tl-card">
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', cursor:'pointer' }} onClick={() => setOpenDay(isOpen ? null : day.id)}>
                    <div>
                      <div className="tl-day-title">{day.title || `Day ${day.day}`}</div>
                      {day.date && <div className="tl-day-date">{new Date(day.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}</div>}
                      <div style={{ marginTop:4, fontSize:12, color:'var(--t3)' }}>{day.activities?.length || 0} activities</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <button onClick={e => { e.stopPropagation(); if (window.confirm('Remove this day?')) { deleteDay(trip.id, day.id); refresh(); }}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--g300)', padding:4 }}>
                        <Trash2 size={15} />
                      </button>
                      {isOpen ? <ChevronUp size={18} color="var(--t3)" /> : <ChevronDown size={18} color="var(--t3)" />}
                    </div>
                  </div>

                  {/* Activities accordion */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height:0, opacity:0 }}
                        animate={{ height:'auto', opacity:1 }}
                        exit={{ height:0, opacity:0 }}
                        transition={{ duration:0.25 }}
                        style={{ overflow:'hidden' }}
                      >
                        {(day.activities || []).length > 0 && (
                          <div style={{ marginTop:14, borderTop:'1px solid var(--g100)', paddingTop:10 }}>
                            {day.activities.map(act => {
                              const t = atype(act.type);
                              return (
                                <div key={act.id} className="act-row">
                                  <div className="act-icon" style={{ background: t.bg }}>{t.emoji}</div>
                                  <div className="act-content">
                                    <div className="act-time">{act.time || '—'}</div>
                                    <div className="act-name">{act.title}</div>
                                    {act.place && <div className="act-place">📍 {act.place}</div>}
                                    {act.note  && <div className="act-place" style={{ fontStyle:'italic' }}>"{act.note}"</div>}
                                  </div>
                                  {act.cost > 0 && <div className="act-cost">{trip.currency}{Number(act.cost).toLocaleString()}</div>}
                                  <button onClick={() => { deleteActivity(trip.id, day.id, act.id); refresh(); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--g300)', flexShrink:0 }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <button className="btn btn-sm btn-secondary" style={{ marginTop:12, width:'100%' }} onClick={() => { setTargetDay(day.id); setActSheet(true); }}>
                          <Plus size={15} /> Add Activity
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add another day */}
      <div style={{ padding:'0 20px 24px' }}>
        <button className="btn btn-md btn-ghost btn-full" onClick={() => setDaySheet(true)}><Plus size={16} /> Add Another Day</button>
      </div>

      {/* Add Day Sheet */}
      <BottomSheet open={daySheet} onClose={() => setDaySheet(false)} title="Add a Day">
        <div className="field"><div className="field-label">Date (optional)</div>
          <input className="input" type="date" value={dayDate} onChange={e => setDayDate(e.target.value)} /></div>
        <div className="field"><div className="field-label">Day Title</div>
          <input className="input" placeholder="e.g. Beach Day, Last Day…" value={dayTitle} onChange={e => setDayTitle(e.target.value)} /></div>
        <button className="btn btn-lg btn-primary btn-full" onClick={saveDay}><Plus size={18} /> Add Day</button>
      </BottomSheet>

      {/* Add Activity Sheet */}
      <BottomSheet open={actSheet} onClose={() => setActSheet(false)} title="Add an Activity">
        <div className="field">
          <div className="field-label">Activity Type</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {ACT_TYPES.map(t => (
              <button key={t.key}
                style={{ padding:'10px 4px', borderRadius:12, border:`2px solid ${actType === t.key ? t.color : '#E2E8F0'}`, background: actType === t.key ? t.bg : '#fff', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 150ms' }}
                onClick={() => setActType(t.key)}
              >
                <span style={{ fontSize:22 }}>{t.emoji}</span>
                <span style={{ fontSize:10, fontWeight:700, color: actType === t.key ? t.color : '#94A3B8' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:12 }}>
          <div className="field"><div className="field-label">Time</div>
            <input className="input" type="time" value={actTime} onChange={e => setActTime(e.target.value)} /></div>
          <div className="field"><div className="field-label">Activity Name *</div>
            <input className="input" placeholder="e.g. Lunch at Britto's" value={actTitle} onChange={e => setActTitle(e.target.value)} /></div>
        </div>
        <div className="field"><div className="field-label">Place / Location</div>
          <input id="activity-place-autocomplete" className="input" placeholder="e.g. Baga Beach, North Goa" value={actPlace} onChange={e => setActPlace(e.target.value)} /></div>
        <div className="field"><div className="field-label">Cost ({trip.currency})</div>
          <input className="input" type="number" placeholder="0" value={actCost} onChange={e => setActCost(e.target.value)} /></div>
        <div className="field"><div className="field-label">Notes</div>
          <textarea className="input" placeholder="Any notes…" value={actNote} onChange={e => setActNote(e.target.value)} style={{ minHeight:70 }} /></div>
        <button className="btn btn-lg btn-primary btn-full" onClick={saveActivity} disabled={!actTitle.trim()}><Plus size={18} /> Add Activity</button>
      </BottomSheet>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  GALLERY TAB                                                   */
/* ══════════════════════════════════════════════════════════════ */
function GalleryTab({ trip, refresh }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const [lightbox,  setLightbox]  = useState(null);
  const highlights = trip.highlights || [];

  async function handleFile(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setError('');
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) { setError('Max 10 MB per file'); continue; }
        const url = await uploadPhoto(file, trip.id);
        addHighlight(trip.id, url);
      }
      refresh();
    } catch (err) {
      setError(`Upload failed: ${err.message}. Make sure the "trip-photos" bucket exists and is Public in Supabase Storage.`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removePhoto(h) {
    if (!window.confirm('Remove this photo?')) return;
    await deletePhotoFromStorage(h.url);
    deleteHighlight(trip.id, h.id);
    refresh();
  }

  return (
    <div style={{ padding:16 }}>
      <label className={`upload-zone${uploading ? ' busy' : ''}`}>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFile} style={{ display:'none' }} disabled={uploading} />
        {uploading
          ? <><div className="spinner" style={{ borderTopColor:'var(--em)', borderColor:'var(--em-100)' }} /><div className="upload-lbl">Processing photo…</div></>
          : <><span style={{ fontSize:32 }}>📷</span><div className="upload-lbl">Tap to upload photos</div><div style={{ fontSize:12, color:'var(--t3)' }}>Saved locally · max 10 MB per photo</div></>}
      </label>

      {error && (
        <div style={{ background:'var(--rose-50)', border:'1px solid #fecdd3', borderRadius:12, padding:'12px 16px', marginTop:12, fontSize:13, color:'#9F1239' }}>{error}</div>
      )}

      {highlights.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--t3)', marginTop:12 }}>
          <div style={{ fontSize:48 }}>🖼️</div>
          <div style={{ fontWeight:700, marginTop:8 }}>No photos yet</div>
          <div style={{ fontSize:13, marginTop:4 }}>Upload your trip memories above</div>
        </div>
      ) : (
        <div className="masonry" style={{ marginTop:14 }}>
          {highlights.map((h, i) => (
            <div key={h.id} className="masonry-item" onClick={() => setLightbox(i)}>
              <img src={h.url} alt={`photo ${i+1}`} style={{ height: i % 3 === 0 ? 210 : 150 }} />
              <button
                onClick={e => { e.stopPropagation(); removePhoto(h); }}
                style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.55)', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}
              ><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div className="lightbox" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setLightbox(null)}>
            <motion.img src={highlights[lightbox].url} alt="full" initial={{ scale:.88 }} animate={{ scale:1 }} onClick={e => e.stopPropagation()} />
            <div style={{ position:'absolute', bottom:32, display:'flex', gap:10, alignItems:'center' }}>
              <button className="btn btn-sm btn-ghost" style={{ color:'white', borderColor:'rgba(255,255,255,.3)', background:'rgba(255,255,255,.12)' }} onClick={e => { e.stopPropagation(); setLightbox(l => Math.max(0,l-1)); }}>← Prev</button>
              <span style={{ color:'rgba(255,255,255,.7)', fontSize:13 }}>{lightbox+1} / {highlights.length}</span>
              <button className="btn btn-sm btn-ghost" style={{ color:'white', borderColor:'rgba(255,255,255,.3)', background:'rgba(255,255,255,.12)' }} onClick={e => { e.stopPropagation(); setLightbox(l => Math.min(highlights.length-1,l+1)); }}>Next →</button>
            </div>
            <button style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,.15)', border:'none', borderRadius:'50%', width:40, height:40, color:'white', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setLightbox(null)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  BUDGET TAB                                                    */
/* ══════════════════════════════════════════════════════════════ */
function AnimCount({ to }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0; const step = to / 28;
    const t = setInterval(() => { cur = Math.min(to, cur + step); setVal(Math.floor(cur)); if (cur >= to) clearInterval(t); }, 36);
    return () => clearInterval(t);
  }, [to]);
  return <>{val.toLocaleString()}</>;
}

function BudgetTab({ trip, refresh }) {
  const [sheet,     setSheet]     = useState(false);
  const [convSheet, setConvSheet] = useState(false);
  const [title,     setTitle]     = useState('');
  const [amount,    setAmount]    = useState('');
  const [cat,       setCat]       = useState('food');
  const [fromAmt,   setFromAmt]   = useState('1');
  const [fromCur,   setFromCur]   = useState('INR');
  const [toCur,     setToCur]     = useState('USD');
  const [rates,     setRates]     = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);

  // Built-in approximate rates relative to INR
  const FALLBACK_RATES = {
    INR:1, USD:0.012, EUR:0.011, GBP:0.0094, JPY:1.78, AED:0.044,
    SGD:0.016, THB:0.42, AUD:0.018, CAD:0.016, CHF:0.011, NPR:1.60,
  };

  async function loadRates() {
    setLoadingRates(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR');
      const data = await res.json();
      if (data.rates) setRates(data.rates);
    } catch { /* use fallback */ }
    setLoadingRates(false);
  }

  function openConverter() {
    setConvSheet(true);
    if (!rates) loadRates();
  }

  const r = rates || FALLBACK_RATES;
  const convertedAmt = fromAmt && r[fromCur] && r[toCur]
    ? ((Number(fromAmt) / r[fromCur]) * r[toCur]).toFixed(2)
    : '—';

  const CURRENCIES = [
    { code:'INR', flag:'🇮🇳', name:'Indian Rupee' },
    { code:'USD', flag:'🇺🇸', name:'US Dollar' },
    { code:'EUR', flag:'🇪🇺', name:'Euro' },
    { code:'GBP', flag:'🇬🇧', name:'British Pound' },
    { code:'JPY', flag:'🇯🇵', name:'Japanese Yen' },
    { code:'AED', flag:'🇦🇪', name:'UAE Dirham' },
    { code:'SGD', flag:'🇸🇬', name:'Singapore Dollar' },
    { code:'THB', flag:'🇹🇭', name:'Thai Baht' },
    { code:'AUD', flag:'🇦🇺', name:'Australian Dollar' },
    { code:'CAD', flag:'🇨🇦', name:'Canadian Dollar' },
    { code:'CHF', flag:'🇨🇭', name:'Swiss Franc' },
    { code:'NPR', flag:'🇳🇵', name:'Nepali Rupee' },
  ];

  const expenses  = trip.expenses || [];
  const spent     = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const budget    = Number(trip.budget) || 0;
  const remaining = budget - spent;
  const pct       = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  function save() {
    if (!title.trim() || !amount) return;
    addExpense(trip.id, { title: title.trim(), amount: Number(amount), category: cat });
    refresh(); setSheet(false); setTitle(''); setAmount(''); setCat('food');
  }

  /* Category totals */
  const bycat = EXP_CATS.map(c => ({ ...c, total: expenses.filter(e => e.category === c.key).reduce((s, e) => s + Number(e.amount || 0), 0) })).filter(c => c.total > 0);

  return (
    <div>
      {/* Overview card */}
      <div className="budget-overview">
        <div style={{ fontSize:13, fontWeight:600, opacity:.85 }}>Total Spent</div>
        <div className="budget-big">{trip.currency}<AnimCount to={Math.round(spent)} /></div>
        <div className="budget-sub">{budget > 0 ? `of ${trip.currency}${budget.toLocaleString()} budget` : 'No budget set'}</div>
        {budget > 0 && (
          <>
            <div className="budget-bar-white">
              <div className="budget-bar-white-fill" style={{ width:`${pct}%`, background: pct>=100?'#F87171': pct>=80?'#FCD34D':'white' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12, opacity:.9 }}>
              <span style={{ color: pct>=100?'#FCA5A5': pct>=80?'#FDE68A':'inherit' }}>{Math.round(pct)}% used {pct>=100?'⚠️ OVER BUDGET':pct>=80?'⚠️ Almost there':''}</span>
              <span>{remaining >= 0 ? `${trip.currency}${remaining.toLocaleString()} left` : `${trip.currency}${Math.abs(remaining).toLocaleString()} over`}</span>
            </div>
          </>
        )}
      </div>

      {/* Currency Converter button */}
      <div style={{ padding:'12px 20px 0' }}>
        <button onClick={openConverter}
          style={{ width:'100%', padding:'12px 16px', background:'linear-gradient(135deg,#0EA5E9,#6366F1)', borderRadius:14, border:'none', color:'white', fontFamily:'Outfit', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          💱 Currency Converter
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, padding:'16px 20px 0' }}>
        {[
          { label:'Budget',  val:`${trip.currency}${budget.toLocaleString()}`, color:'var(--em)' },
          { label:'Spent',   val:`${trip.currency}${spent.toLocaleString()}`,  color:'var(--amber)' },
          { label: remaining >= 0 ? 'Remaining':'Over Budget', val:`${trip.currency}${Math.abs(remaining).toLocaleString()}`, color: remaining >= 0 ? 'var(--sky)':'var(--rose)' },
        ].map(c => (
          <div key={c.label} style={{ background:'#fff', border:'1.5px solid var(--border)', borderRadius:16, padding:'14px 10px', textAlign:'center', boxShadow:'var(--sh-xs)' }}>
            <div style={{ fontSize:17, fontWeight:900, color:c.color }}>{c.val}</div>
            <div style={{ fontSize:11, color:'var(--t3)', fontWeight:700, marginTop:2, textTransform:'uppercase', letterSpacing:'.05em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {bycat.length > 0 && (
        <div style={{ padding:'16px 20px 0' }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>By Category</div>
          {bycat.map(c => (
            <div key={c.key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{c.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>{c.label}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:c.color }}>{trip.currency}{c.total.toLocaleString()}</span>
                </div>
                <div style={{ height:4, background:'var(--g100)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:c.color, borderRadius:99, width: spent > 0 ? `${Math.round(c.total/spent*100)}%` : '0%', transition:'width .6s var(--spring)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expenses list */}
      <div style={{ padding:'20px 20px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:16 }}>Expenses ({expenses.length})</div>
          <button className="btn btn-sm btn-primary" onClick={() => setSheet(true)}><Plus size={15} /> Add</button>
        </div>
        {expenses.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'var(--t3)' }}>
            <div style={{ fontSize:36 }}>💸</div>
            <div style={{ fontWeight:600, marginTop:8 }}>No expenses logged</div>
          </div>
        ) : (
          expenses.map(exp => {
            const c = EXP_CATS.find(c => c.key === exp.category) || EXP_CATS[5];
            return (
              <div key={exp.id} className="exp-item">
                <div className="exp-icon" style={{ background:c.bg }}>{c.emoji}</div>
                <div>
                  <div className="exp-title">{exp.title}</div>
                  <div className="exp-cat">{c.label}</div>
                </div>
                <div className="exp-amt">{trip.currency}{Number(exp.amount).toLocaleString()}</div>
                <button onClick={() => { deleteExpense(trip.id, exp.id); refresh(); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--g300)', marginLeft:8 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Add Expense">
        <div className="field">
          <div className="field-label">Category</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {EXP_CATS.map(c => (
              <button key={c.key}
                style={{ padding:'10px 6px', borderRadius:12, border:`2px solid ${cat===c.key?c.color:'#E2E8F0'}`, background:cat===c.key?c.bg:'#fff', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 150ms' }}
                onClick={() => setCat(c.key)}
              >
                <span style={{ fontSize:22 }}>{c.emoji}</span>
                <span style={{ fontSize:10, fontWeight:700, color:cat===c.key?c.color:'#94A3B8' }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field"><div className="field-label">Description *</div>
          <input className="input" placeholder="e.g. Hotel stay" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field"><div className="field-label">Amount ({trip.currency}) *</div>
          <input className="input" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <button className="btn btn-lg btn-primary btn-full" onClick={save} disabled={!title.trim()||!amount}><Plus size={18} /> Add Expense</button>
      </BottomSheet>

      {/* Currency Converter Sheet */}
      <BottomSheet open={convSheet} onClose={() => setConvSheet(false)} title="💱 Currency Converter">
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'center' }}>
            <div className="field">
              <div className="field-label">Amount</div>
              <input className="input" type="number" value={fromAmt} onChange={e=>setFromAmt(e.target.value)} placeholder="1" />
            </div>
            <div style={{ fontSize:20, paddingTop:20 }}>⇄</div>
            <div className="field">
              <div className="field-label">Converted</div>
              <div style={{ padding:'13px 16px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:12, fontSize:16, fontWeight:800, color:'#10B981' }}>{convertedAmt}</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="field">
              <div className="field-label">From</div>
              <select className="input" value={fromCur} onChange={e=>setFromCur(e.target.value)}>
                {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="field-label">To</div>
              <select className="input" value={toCur} onChange={e=>setToCur(e.target.value)}>
                {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
          </div>
          {loadingRates && <div style={{ textAlign:'center', fontSize:12, color:'#94A3B8' }}>Loading live rates…</div>}
          {!rates && !loadingRates && <div style={{ textAlign:'center', fontSize:11, color:'#94A3B8' }}>Using approximate rates. Tap to reload for live rates.</div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {CURRENCIES.map(c=>(
              <div key={c.code} style={{ background:'#F8FAFC', borderRadius:10, padding:'10px 8px', textAlign:'center', border:'1px solid #E2E8F0' }}>
                <div style={{ fontSize:14 }}>{c.flag}</div>
                <div style={{ fontSize:11, fontWeight:800, color:'#0F172A', marginTop:2 }}>
                  {r[c.code] ? (Number(fromAmt||1) / (r[fromCur]||1) * r[c.code]).toFixed(2) : '—'}
                </div>
                <div style={{ fontSize:9, color:'#94A3B8', fontWeight:600 }}>{c.code}</div>
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════════ */
/*  JOURNAL TAB                                                   */
/* ══════════════════════════════════════════════════════════════ */
const JOURNAL_PROMPTS = [
  '🌟 What was the highlight of today?',
  '🍽️ Best meal or drink you had?',
  '🤔 What surprised you the most?',
  '📸 Describe this day in one word.',
  '💪 What challenged you today?',
  '😍 What made you smile?',
  '🌍 What did you learn today?',
  '👫 Best interaction with a local?',
  '⭐ Rate today out of 10. Why?',
  '📝 What would you do differently?',
];

function JournalTab({ trip }) {
  const days = trip.days || [];
  const [entries, setEntries] = useState({});
  const [active,  setActive]  = useState(null);
  const [text,    setText]    = useState('');

  useEffect(() => {
    // Load all journal entries for this trip
    const loaded = {};
    days.forEach(d => {
      const e = getJournalEntry(trip.id, d.id);
      if (e) loaded[d.id] = e;
    });
    setEntries(loaded);
  }, [trip.id, days.length]);

  function openDay(dayId) {
    setActive(dayId);
    setText(entries[dayId]?.text || '');
  }

  function saveEntry(dayId) {
    saveJournalEntry(trip.id, dayId, { text });
    setEntries(prev => ({ ...prev, [dayId]: { text } }));
    setActive(null);
  }

  if (!days.length) return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'#94A3B8' }}>
      <div style={{ fontSize:48 }}>📖</div>
      <div style={{ fontWeight:700, marginTop:12 }}>No days added yet</div>
      <div style={{ fontSize:13, marginTop:6 }}>Add days to your itinerary first, then write your journal entries here.</div>
    </div>
  );

  return (
    <div style={{ padding:20 }}>
      <div style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>📖 Travel Journal</div>
      <div style={{ fontSize:13, color:'#64748B', marginBottom:18 }}>Capture your memories, one day at a time.</div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {days.map((day, idx) => {
          const entry   = entries[day.id];
          const prompt  = JOURNAL_PROMPTS[idx % JOURNAL_PROMPTS.length];
          const isOpen  = active === day.id;
          return (
            <div key={day.id}
              style={{ background:'white', borderRadius:18, border:`1.5px solid ${entry?'#D1FAE5':'#E2E8F0'}`, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div
                onClick={() => isOpen ? setActive(null) : openDay(day.id)}
                style={{ padding:'16px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background: entry?'#ECFDF5':'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {entry ? '✅' : '📖'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:'#0F172A' }}>Day {day.day} {day.title && `— ${day.title}`}</div>
                  <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>
                    {entry ? entry.text.slice(0,60) + (entry.text.length > 60 ? '…' : '') : prompt}
                  </div>
                </div>
                <div style={{ fontSize:12, color:'#94A3B8' }}>{isOpen?'▲':'▼'}</div>
              </div>
              {isOpen && (
                <div style={{ padding:'0 18px 16px', borderTop:'1px solid #F1F5F9' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748B', margin:'12px 0 8px' }}>{prompt}</div>
                  <textarea
                    value={text}
                    onChange={e=>setText(e.target.value)}
                    placeholder="Write your thoughts here…"
                    style={{ width:'100%', minHeight:120, padding:'12px', border:'1.5px solid #E2E8F0', borderRadius:12, fontFamily:'Outfit', fontSize:14, color:'#0F172A', resize:'vertical', outline:'none', lineHeight:1.6 }}
                  />
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    <button onClick={()=>setActive(null)}
                      style={{ flex:1, padding:'11px', borderRadius:12, border:'1.5px solid #E2E8F0', background:'white', fontFamily:'Outfit', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={()=>saveEntry(day.id)}
                      style={{ flex:2, padding:'11px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', fontFamily:'Outfit', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      Save Entry 💾
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  NOTES TAB                                                     */
/* ══════════════════════════════════════════════════════════════ */
function NotesTab({ trip, refresh }) {
  const [sheet,   setSheet]   = useState(false);
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');

  function save() {
    if (!title.trim()) return;
    addNote(trip.id, { title: title.trim(), content: content.trim() });
    refresh(); setSheet(false); setTitle(''); setContent('');
  }

  const notes = trip.notes || [];

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontWeight:800, fontSize:16 }}>Notes ({notes.length})</div>
        <button className="btn btn-sm btn-primary" onClick={() => setSheet(true)}><Plus size={15} /> Add</button>
      </div>
      {notes.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--t3)' }}>
          <div style={{ fontSize:48 }}>📋</div>
          <div style={{ fontWeight:600, marginTop:10 }}>No notes yet</div>
          <div style={{ fontSize:13, marginTop:4 }}>Add packing lists, tips, reminders…</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {notes.map(n => (
            <div key={n.id} className="note-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div className="note-title">{n.title}</div>
                <button onClick={() => { deleteNote(trip.id, n.id); refresh(); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--g300)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
              {n.content && <div className="note-content">{n.content}</div>}
            </div>
          ))}
        </div>
      )}
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Add Note">
        <div className="field"><div className="field-label">Title *</div>
          <input className="input" placeholder="e.g. Packing List" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field"><div className="field-label">Content</div>
          <textarea className="input" placeholder="Write your note here…" value={content} onChange={e => setContent(e.target.value)} style={{ minHeight:120 }} /></div>
        <button className="btn btn-lg btn-primary btn-full" onClick={save} disabled={!title.trim()}><Plus size={18} /> Save Note</button>
      </BottomSheet>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  WORKSPACE SHELL                                               */
/* ══════════════════════════════════════════════════════════════ */
export default function TripWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip,      setTrip]   = useState(null);
  const [activeTab, setActive] = useState('itinerary');

  const refresh = useCallback(() => {
    const t = getTrip(id);
    if (t) setTrip({ ...t });
  }, [id]);

  useEffect(() => {
    const t = getTrip(id);
    if (!t) { navigate('/trips'); return; }
    setTrip(t);
  }, [id, navigate]);

  if (!trip) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" style={{ borderTopColor:'var(--em)', borderColor:'var(--em-50)', width:32, height:32, borderWidth:3 }} />
    </div>
  );

  return (
    <div className="page" style={{ background:'var(--bg)', paddingBottom:88 }}>

      {/* ── Hero Banner ── */}
      <div className="trip-hero">
        {trip.cover
          ? <img src={trip.cover} alt={trip.name} />
          : <div className="trip-hero-ph" style={{ height:'100%' }}>{trip.emoji}</div>}
        <div className="trip-hero-overlay" />
        <button className="trip-hero-back" onClick={() => navigate('/trips')}>←</button>

        <div style={{ position:'absolute', top:68, right:16 }}>
          <div style={{ background:'rgba(255,255,255,.18)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.3)', borderRadius:12, padding:'6px 12px', fontSize:11, fontWeight:700, color:'white' }}>
            {trip.status ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1) : 'Planning'}
          </div>
        </div>

        <div className="trip-hero-content">
          <div className="trip-hero-title">{trip.emoji} {trip.name}</div>
          {trip.destination && <div className="trip-hero-meta">📍 {trip.destination}{trip.country ? `, ${trip.country}` : ''}</div>}
          {trip.startDate && (
            <div className="trip-hero-meta">
              📅 {new Date(trip.startDate + 'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
              {trip.endDate ? ` → ${new Date(trip.endDate + 'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}` : ''}
            </div>
          )}
          {/* Quick stats */}
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            {(trip.days||[]).length > 0 && <span style={{ fontSize:11, color:'rgba(255,255,255,.85)', fontWeight:700 }}>📅 {trip.days.length} days</span>}
            {(trip.pins||[]).length > 0  && <span style={{ fontSize:11, color:'rgba(255,255,255,.85)', fontWeight:700 }}>📍 {trip.pins.length} pins</span>}
            {(trip.highlights||[]).length > 0 && <span style={{ fontSize:11, color:'rgba(255,255,255,.85)', fontWeight:700 }}>📸 {trip.highlights.length} photos</span>}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => setActive(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:.18 }}>
          {activeTab === 'itinerary' && <ItineraryTab  trip={trip} refresh={refresh} />}
          {activeTab === 'map'       && <MapView tripId={trip.id} mapCenter={trip.mapCenter} />}
          {activeTab === 'gallery'   && <GalleryTab    trip={trip} refresh={refresh} />}
          {activeTab === 'budget'    && <BudgetTab     trip={trip} refresh={refresh} />}
          {activeTab === 'journal'   && <JournalTab    trip={trip} />}
          {activeTab === 'notes'     && <NotesTab      trip={trip} refresh={refresh} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
