import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, MapPin, X, Trash2 } from 'lucide-react';
import { addPin, deletePin, getTrip } from '../utils/storage';

const CAT = {
  landmark: { label: 'Landmark', color: '#10B981', bg: '#ECFDF5' },
  food:     { label: 'Food',     color: '#F59E0B', bg: '#FFFBEB' },
  hotel:    { label: 'Hotel',    color: '#8B5CF6', bg: '#F5F3FF' },
  beach:    { label: 'Beach',    color: '#0EA5E9', bg: '#F0F9FF' },
  temple:   { label: 'Temple',   color: '#EC4899', bg: '#FDF2F8' },
  shopping: { label: 'Shopping', color: '#F97316', bg: '#FFF7ED' },
  nature:   { label: 'Nature',   color: '#84CC16', bg: '#F7FEE7' },
  travel:   { label: 'Travel',   color: '#6366F1', bg: '#EEF2FF' },
};

const MAPPLS_KEY = 'lifbgrgdylewzefownzpslvqbdqdgtgdvtmk';

export default function MapView({ tripId, mapCenter }) {
  const mapRef     = useRef(null);
  const mapInst    = useRef(null);
  const markersRef = useRef({});
  const searchRef  = useRef(null);
  const pluginRef  = useRef(null);

  const [ready,   setReady]   = useState(false);
  const [pins,    setPins]    = useState([]);
  const [pending, setPending] = useState(null);
  const [selCat,  setSelCat]  = useState('landmark');
  const [note,    setNote]    = useState('');
  const [query,   setQuery]   = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);

  /* Reload pins */
  const loadPins = useCallback(() => {
    const trip = getTrip(tripId);
    setPins(trip?.pins || []);
  }, [tripId]);

  useEffect(() => { loadPins(); }, [loadPins]);

  /* Wait for Mappls SDK */
  useEffect(() => {
    function checkReady() {
      if (window.mappls && window.mappls.Map) {
        setReady(true);
      } else {
        setTimeout(checkReady, 200);
      }
    }
    checkReady();
  }, []);

  /* Init Mappls map */
  useEffect(() => {
    if (!ready || !mapRef.current || mapInst.current) return;

    const center = mapCenter
      ? [mapCenter.lng, mapCenter.lat]
      : [78.9629, 20.5937]; // India center [lng, lat]

    const map = new window.mappls.Map(mapRef.current, {
      center,
      zoom: mapCenter ? 11 : 5,
      search: false,
    });

    mapInst.current = map;

    /* Draw existing pins */
    const trip = getTrip(tripId);
    (trip?.pins || []).forEach(p => addMarker(map, p));
  }, [ready, tripId, mapCenter]);

  /* Add a Mappls marker */
  function addMarker(map, pin) {
    const color = CAT[pin.category]?.color || '#10B981';
    const marker = new window.mappls.Marker({
      map,
      position: { lat: pin.lat, lng: pin.lng },
      popupHtml: `<div style="font-family:'Outfit',sans-serif;padding:6px 8px;min-width:150px">
        <b style="color:#0F172A;font-size:14px">${pin.name}</b>
        <div style="color:#64748B;font-size:12px;margin-top:2px">${CAT[pin.category]?.label || pin.category}</div>
        ${pin.note ? `<div style="color:#334155;font-size:12px;margin-top:4px;font-style:italic">"${pin.note}"</div>` : ''}
      </div>`,
      popupOptions: { openPopup: false },
      icon: {
        url: makePinSVG(color),
        width: 36,
        height: 48,
      },
    });
    markersRef.current[pin.id] = marker;
  }

  /* Search places using Mappls REST API */
  async function searchPlaces(q) {
    if (!q || q.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(q)}&region=IND&access_token=${MAPPLS_KEY}`
      );
      const data = await res.json();
      const results = data?.suggestedLocations || data?.copResults || [];
      setSuggestions(results.slice(0, 6));
      setShowSugg(true);
    } catch {
      setSuggestions([]);
    }
  }

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    searchPlaces(val);
  }

  function selectSuggestion(s) {
    const lat = parseFloat(s.latitude);
    const lng = parseFloat(s.longitude);
    const name = s.placeName || s.placeAddress || query;
    const address = s.placeAddress || '';

    if (!lat || !lng) return;

    if (mapInst.current) {
      mapInst.current.setCenter([lng, lat]);
      mapInst.current.setZoom(14);
    }

    setPending({ lat, lng, name, address });
    setQuery(name);
    setSuggestions([]);
    setShowSugg(false);
    setNote('');
  }

  /* Confirm pin */
  function confirmPin() {
    if (!pending || !mapInst.current) return;
    const updated = addPin(tripId, {
      lat: pending.lat, lng: pending.lng,
      name: pending.name, category: selCat, note,
    });
    const newPin = updated.pins[updated.pins.length - 1];
    addMarker(mapInst.current, newPin);
    loadPins();
    setPending(null);
    setNote('');
    setQuery('');
  }

  /* Delete pin */
  function removePinHandler(pinId) {
    if (markersRef.current[pinId]) {
      markersRef.current[pinId].remove();
      delete markersRef.current[pinId];
    }
    deletePin(tripId, pinId);
    loadPins();
  }

  /* Pan to pin */
  function panToPin(pin) {
    if (!mapInst.current) return;
    mapInst.current.setCenter([pin.lng, pin.lat]);
    mapInst.current.setZoom(15);
  }

  if (!ready) {
    return (
      <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94A3B8' }}>
        <div style={{ fontSize: 48 }}>🗺️</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Loading MapMyIndia map…</div>
      </div>
    );
  }

  return (
    <div className="map-outer">
      {/* Search */}
      <div className="map-search-bar">
        <div style={{ position: 'relative' }}>
          <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', zIndex: 1 }} />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => suggestions.length > 0 && setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 200)}
            placeholder="Search any place in India…"
            className="input"
            style={{ paddingLeft: 42 }}
          />
          {/* Autocomplete dropdown */}
          {showSugg && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              border: '1px solid #E2E8F0', zIndex: 9999, overflow: 'hidden', marginTop: 4,
            }}>
              {suggestions.map((s, i) => (
                <div key={i}
                  onMouseDown={() => selectSuggestion(s)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #F1F5F9' : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <MapPin size={14} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{s.placeName || s.placeAddress}</div>
                    {s.placeAddress && s.placeName !== s.placeAddress && (
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{s.placeAddress}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending place confirm card */}
        {pending && (
          <div className="pending-place-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{pending.name}</div>
                {pending.address && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{pending.address}</div>}
              </div>
              <button onClick={() => setPending(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={16} /></button>
            </div>

            {/* Category chips */}
            <div className="category-chips">
              {Object.entries(CAT).map(([key, { label, color, bg }]) => (
                <button
                  key={key}
                  className="cat-chip"
                  onClick={() => setSelCat(key)}
                  style={{
                    background:  selCat === key ? color : bg,
                    color:       selCat === key ? '#fff' : color,
                    borderColor: color,
                  }}
                >{label}</button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Add a note (optional)…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input input-sm"
              style={{ marginBottom: 10 }}
            />
            <button className="btn btn-md btn-primary btn-full" onClick={confirmPin}>
              <MapPin size={16} /> Drop Pin
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="map-el" />

      {/* Pins list */}
      {pins.length > 0 && (
        <div className="map-pins-list">
          <div style={{ padding: '10px 16px 6px', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {pins.length} pinned places
          </div>
          {pins.map(pin => {
            const { color, label, bg } = CAT[pin.category] || CAT.landmark;
            return (
              <div key={pin.id} className="pin-item" onClick={() => panToPin(pin)}>
                <div className="pin-dot" style={{ background: color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pin-name">{pin.name}</div>
                  {pin.note && <div className="pin-note">{pin.note}</div>}
                </div>
                <span className="pin-cat" style={{ background: bg, color }}>{label}</span>
                <button
                  onClick={e => { e.stopPropagation(); removePinHandler(pin.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', marginLeft: 6, flexShrink: 0 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Helper: make a colored pin SVG icon */
function makePinSVG(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
    <path d="M18 0C8.06 0 0 8.059 0 18c0 13.5 18 30 18 30S36 31.5 36 18C36 8.059 27.94 0 18 0z"
      fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="7" fill="white"/>
    <circle cx="18" cy="18" r="4" fill="${color}"/>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
