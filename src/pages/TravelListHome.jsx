import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Play, Trash2, ChevronRight } from 'lucide-react';
import {
  getPlaces, deletePlace, getTLTripsByPlace, calcPlaceTotal,
} from '../utils/tlStorage';
import { getCurrentUser } from '../utils/auth';
import AddPlaceModal    from '../components/AddPlaceModal';
import HighlightViewer from '../components/HighlightViewer';
import { buildPlaceSlides } from '../utils/slides';
import AnalyticsDrawer  from '../components/AnalyticsDrawer';

const INR = n => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

/* ── Indian States → Domestic group key ─ */
const DOMESTIC_GROUPS_ORDER = [
  'Goa','Maharashtra','Rajasthan','Kerala','Karnataka','Himachal Pradesh',
  'Uttarakhand','Tamil Nadu','Gujarat','Andhra Pradesh','Telangana','Punjab',
  'Delhi','West Bengal','Odisha','Madhya Pradesh','Bihar','Uttar Pradesh',
  'Assam','Meghalaya','Manipur','Nagaland','Tripura','Arunachal Pradesh',
  'Mizoram','Sikkim','Chhattisgarh','Jharkhand','Haryana',
  'Andaman & Nicobar Islands','Ladakh','Jammu & Kashmir','Puducherry',
  'Chandigarh','Lakshadweep','Dadra & Nagar Haveli','Daman & Diu',
];

/* ── Continent → International group key ─ */
const CONTINENT_ORDER = [
  'Europe','East Asia','Southeast Asia','South Asia','Middle East',
  'North America','South America','Africa','Oceania','Caribbean','Central Asia',
];

/* ─── Place Highlight Ring ─────────────────────────────────────────────────── */
function PlaceRing({ place, trips, onOpen }) {
  const [imgErr, setImgErr] = useState(false);
  const photo   = place.coverPhoto || trips[0]?.photos?.[0]?.url;
  const hasPlanned = trips.some(t => t.status === 'planned' || t.status === 'ongoing');

  return (
    <motion.div
      className="tl-ring-wrap"
      onClick={() => onOpen(place, trips)}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`tl-ring ${hasPlanned ? 'tl-ring-green' : 'tl-ring-gray'}`}>
        <div className="tl-ring-inner">
          {photo && !imgErr
            ? <img src={photo} alt={place.name} className="tl-ring-img" onError={() => setImgErr(true)} />
            : <div className="tl-ring-emoji">{place.emoji || '📍'}</div>}
        </div>
      </div>
      <span className="tl-ring-name">{place.name.length > 8 ? place.name.slice(0, 7) + '…' : place.name}</span>
    </motion.div>
  );
}

/* ─── Add Ring ─────────────────────────────────────────────────────────────── */
function AddRing({ onClick }) {
  return (
    <motion.div className="tl-ring-wrap" onClick={onClick} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
      <div className="tl-ring tl-ring-add">
        <div className="tl-ring-inner tl-ring-inner-add">
          <Plus size={22} />
        </div>
      </div>
      <span className="tl-ring-name" style={{ color: 'var(--em)' }}>New</span>
    </motion.div>
  );
}

/* ─── Place Card ───────────────────────────────────────────────────────────── */
function PlaceCard({ place, trips, onHighlight, onDelete }) {
  const navigate   = useNavigate();
  const [imgErr,   setImgErr] = useState(false);
  const total      = calcPlaceTotal(place.id);
  const photo      = place.coverPhoto || trips[0]?.photos?.[0]?.url;

  return (
    <motion.div
      className="tl-place-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.13)' }}
      onClick={() => navigate(`/place/${place.id}`)}
    >
      {/* Cover */}
      <div className="tl-place-card-cover">
        {photo && !imgErr
          ? <img src={photo} alt={place.name} onError={() => setImgErr(true)} />
          : <div className="tl-place-card-emoji">{place.emoji || '📍'}</div>}
        <div className="tl-place-card-overlay" />
        {/* Action buttons */}
        <div className="tl-place-card-actions">
          <button
            className="tl-card-action-btn tl-card-action-play"
            onClick={e => { e.stopPropagation(); onHighlight(place, trips); }}
            title="View Highlights"
          >
            <Play size={14} fill="currentColor" /> Highlight
          </button>
          <button
            className="tl-card-action-btn tl-card-action-del"
            onClick={e => { e.stopPropagation(); onDelete(place); }}
            title="Delete Place"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="tl-place-card-info">
        <div className="tl-place-card-name">{place.name}</div>
        <div className="tl-place-card-country">
          {place.stateOfIndia
            ? `${place.stateOfIndia}, India`
            : `${place.country}${place.continent ? ` · ${place.continent}` : ''}`}
        </div>
        <div className="tl-place-card-meta">
          <span className="tl-place-card-trips">
            {trips.length} trip{trips.length !== 1 ? 's' : ''}
          </span>
          {total > 0 && <span className="tl-place-card-spent">{INR(total)} spent</span>}
          <ChevronRight size={14} className="tl-place-card-arrow" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Add Card ─────────────────────────────────────────────────────────────── */
function AddCard({ onClick }) {
  return (
    <motion.div
      className="tl-place-card tl-place-card-add"
      onClick={onClick}
      whileHover={{ y: -3 }}
    >
      <Plus size={28} color="var(--em)" />
      <span>Add Place</span>
    </motion.div>
  );
}

/* ─── Group Section ─────────────────────────────────────────────────────────── */
function GroupSection({ title, places, tripsMap, onHighlight, onDelete, onAdd }) {
  return (
    <div className="tl-group">
      <div className="tl-group-title">{title}</div>
      <div className="tl-place-grid">
        {places.map(place => (
          <PlaceCard
            key={place.id}
            place={place}
            trips={tripsMap[place.id] || []}
            onHighlight={onHighlight}
            onDelete={onDelete}
          />
        ))}
        <AddCard onClick={onAdd} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function TravelListHome() {
  const [tab,      setTab]      = useState('domestic');
  const [places,   setPlaces]   = useState([]);
  const [tripsMap, setTripsMap] = useState({});
  const [addOpen,  setAddOpen]  = useState(false);
  const [viewer,   setViewer]   = useState(null);
  const [drawer,   setDrawer]   = useState(false);
  const user = getCurrentUser();

  function reload() {
    const all = getPlaces();
    setPlaces(all);
    const map = {};
    all.forEach(p => { map[p.id] = getTLTripsByPlace(p.id); });
    setTripsMap(map);
  }

  useEffect(() => { reload(); }, []);

  function handleAddPlace(place) {
    reload();
    // Auto-switch to the tab matching the new place
    setTab(place.folder === 'domestic' ? 'domestic' : 'international');
  }

  function handleDelete(place) {
    if (!confirm(`Delete "${place.name}" and all its trips?`)) return;
    deletePlace(place.id);
    reload();
  }

  function openHighlight(place, trips) {
    if (!trips.length) {
      alert('No trips added to this place yet. Add a trip first!');
      return;
    }
    const slides = buildPlaceSlides(place, trips);
    // slides always has at least one emoji slide per trip
    setViewer({ slides, place });
  }

  // Group places
  const domestic      = places.filter(p => p.folder === 'domestic');
  const international = places.filter(p => p.folder === 'international');

  // Build domestic groups (by state)
  const domesticGroups = {};
  domestic.forEach(p => {
    const key = p.stateOfIndia || 'Other';
    if (!domesticGroups[key]) domesticGroups[key] = [];
    domesticGroups[key].push(p);
  });

  // Build international groups (by continent)
  const intlGroups = {};
  international.forEach(p => {
    const key = p.continent || p.country || 'Other';
    if (!intlGroups[key]) intlGroups[key] = [];
    intlGroups[key].push(p);
  });

  // Sort group keys by predefined order
  const sortedDomesticKeys = [
    ...DOMESTIC_GROUPS_ORDER.filter(k => domesticGroups[k]),
    ...Object.keys(domesticGroups).filter(k => !DOMESTIC_GROUPS_ORDER.includes(k)),
  ];
  const sortedIntlKeys = [
    ...CONTINENT_ORDER.filter(k => intlGroups[k]),
    ...Object.keys(intlGroups).filter(k => !CONTINENT_ORDER.includes(k)),
  ];

  const isEmptyDom  = domestic.length === 0;
  const isEmptyIntl = international.length === 0;

  return (
    <div className="tl-home">
      {/* Analytics Drawer */}
      <AnalyticsDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        onSignOut={() => window.location.reload()}
      />

      {/* Highlight Viewer */}
      <AnimatePresence>
        {viewer && (
          <HighlightViewer
            slides={viewer.slides}
            startAt={0}
            onClose={() => setViewer(null)}
            avatar={{ emoji: viewer.place?.emoji, photo: viewer.place?.coverPhoto }}
            title={viewer.place?.name}
          />
        )}
      </AnimatePresence>

      {/* Add Place Modal */}
      <AddPlaceModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={handleAddPlace} />

      {/* ── Top Bar ── */}
      <div className="tl-home-topbar">
        <button className="tl-burger" onClick={() => setDrawer(true)}>
          <Menu size={22} />
        </button>
        <div className="tl-home-logo">
          <span className="tl-home-logo-icon">✈️</span>
          <span className="tl-home-logo-text">TravelList</span>
        </div>
        <motion.button
          className="tl-btn-icon-round"
          onClick={() => setAddOpen(true)}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          title="Add Place"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {/* ── Greeting ── */}
      <div className="tl-home-greeting">
        <div className="tl-home-greeting-sub">Welcome back,</div>
        <div className="tl-home-greeting-name">{user?.name || 'Traveller'} <span>🌍</span></div>
        <div className="tl-home-greeting-count">
          {places.length === 0
            ? 'Your bucket list is empty — add your first place!'
            : `${places.length} place${places.length !== 1 ? 's' : ''} · ${domestic.length} domestic · ${international.length} international`}
        </div>
      </div>

      {/* ── Highlights Bar ── */}
      <div className="tl-highlights-bar">
        <div className="tl-highlights-scroll">
          <AddRing onClick={() => setAddOpen(true)} />
          {places.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', damping: 16 }}
            >
              <PlaceRing
                place={p}
                trips={tripsMap[p.id] || []}
                onOpen={openHighlight}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tl-main-tabs">
        <button
          className={`tl-main-tab ${tab === 'domestic' ? 'active' : ''}`}
          onClick={() => setTab('domestic')}
        >
          🇮🇳 Domestic {domestic.length > 0 && <span className="tl-main-tab-count">{domestic.length}</span>}
        </button>
        <button
          className={`tl-main-tab ${tab === 'international' ? 'active' : ''}`}
          onClick={() => setTab('international')}
        >
          🌍 International {international.length > 0 && <span className="tl-main-tab-count">{international.length}</span>}
        </button>
        <div className="tl-main-tab-underline" style={{ left: tab === 'domestic' ? 0 : '50%' }} />
      </div>

      {/* ── Content ── */}
      <div className="tl-main-content">
        <AnimatePresence mode="wait">
          {tab === 'domestic' ? (
            <motion.div
              key="domestic"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              {isEmptyDom ? (
                <div className="tl-folder-empty">
                  <div className="tl-folder-empty-icon">🇮🇳</div>
                  <div className="tl-folder-empty-title">No domestic places yet</div>
                  <div className="tl-folder-empty-desc">Add Indian destinations to your bucket list!</div>
                  <motion.button
                    className="tl-btn-primary"
                    onClick={() => setAddOpen(true)}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >
                    <Plus size={16} /> Add Domestic Place
                  </motion.button>
                </div>
              ) : (
                <>
                  {sortedDomesticKeys.map(key => (
                    <GroupSection
                      key={key}
                      title={key}
                      places={domesticGroups[key]}
                      tripsMap={tripsMap}
                      onHighlight={openHighlight}
                      onDelete={handleDelete}
                      onAdd={() => setAddOpen(true)}
                    />
                  ))}
                  <div className="tl-add-group">
                    <AddCard onClick={() => setAddOpen(true)} />
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="international"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22 }}
            >
              {isEmptyIntl ? (
                <div className="tl-folder-empty">
                  <div className="tl-folder-empty-icon">🌍</div>
                  <div className="tl-folder-empty-title">No international places yet</div>
                  <div className="tl-folder-empty-desc">Start dreaming bigger — add international destinations!</div>
                  <motion.button
                    className="tl-btn-primary"
                    onClick={() => setAddOpen(true)}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >
                    <Plus size={16} /> Add International Place
                  </motion.button>
                </div>
              ) : (
                <>
                  {sortedIntlKeys.map(key => (
                    <GroupSection
                      key={key}
                      title={key}
                      places={intlGroups[key]}
                      tripsMap={tripsMap}
                      onHighlight={openHighlight}
                      onDelete={handleDelete}
                      onAdd={() => setAddOpen(true)}
                    />
                  ))}
                  <div className="tl-add-group">
                    <AddCard onClick={() => setAddOpen(true)} />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
