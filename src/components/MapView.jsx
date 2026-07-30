import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, MapPin, X, Trash2, Navigation } from 'lucide-react';
import { mapplsObj, mapplsPlugin, initMappls, searchPlaces } from '../utils/mappls';
import { addPin, deletePin, getTrip } from '../utils/storage';
import PlaceAutocompleteInput from './PlaceAutocompleteInput';

const CAT = {
  landmark: { label: 'Landmark', color: '#10B981', bg: '#ECFDF5' },
  food:     { label: 'Food',     color: '#F59E0B', bg: '#FFFBEB' },
  hotel:    { label: 'Hotel',    color: '#8B5CF6', bg: '#F5F3FF' },
  beach:    { label: 'Beach',    color: '#0EA5E9', bg: '#F0F9FF' },
  temple:   { label: 'Temple',   color: '#EC4899', bg: '#FDF2F8' },
  shopping: { label: 'Shopping', color: '#F97316', bg: '#FFF7ED' },
  nature:   { label: 'Nature',   color: '#84CC16', bg: '#F7FEE7' },
  travel:   { label: 'Travel',   color: '#6366F1', bg: '#EEF2FF' },
  current:  { label: 'You',      color: '#EF4444', bg: '#FEF2F2' },
};

// Distinct colours for day polylines
const DAY_COLORS = [
  '#10B981','#6366F1','#F59E0B','#EC4899','#0EA5E9',
  '#F97316','#8B5CF6','#84CC16','#EF4444','#14B8A6',
];

export default function MapView({ tripId, mapCenter }) {
  const mapRef     = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef([]);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [pins,        setPins]        = useState([]);
  const [pending,     setPending]     = useState(null);
  const [selCat,      setSelCat]      = useState('landmark');
  const [note,        setNote]        = useState('');
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg,    setShowSugg]    = useState(false);
  const [loadError,   setLoadError]   = useState(null);
  const [locating,    setLocating]    = useState(false);
  const debounceRef = useRef(null);

  const loadPins = useCallback(() => {
    const trip = getTrip(tripId);
    setPins(trip?.pins || []);
  }, [tripId]);

  useEffect(() => { loadPins(); }, [loadPins]);

  /* ── Init map ── */
  useEffect(() => {
    initMappls(() => {
      try {
        const center = mapCenter
          ? [mapCenter.lat, mapCenter.lng]
          : [20.5937, 78.9629];

        const newMap = mapplsObj.Map({
          id: 'mappls-map-el',
          properties: {
            center,
            zoom: mapCenter ? 11 : 5,
            zoomControl: true,
          },
        });

        newMap.on('load', () => {
          mapRef.current = newMap;
          setIsMapLoaded(true);

          const trip = getTrip(tripId);
          // Draw pinned markers
          (trip?.pins || []).forEach(p => addMarkerToMap(newMap, p));
          // Draw day-wise travel path
          drawDayPaths(newMap, trip);
        });
      } catch (err) {
        setLoadError('Map failed to load: ' + err.message);
      }
    });

    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  /* ── Draw day-wise travel polylines ── */
  function drawDayPaths(map, trip) {
    if (!trip?.days?.length) return;

    // Remove old polylines
    polylinesRef.current.forEach(pl => { try { pl.remove(); } catch {} });
    polylinesRef.current = [];

    trip.days.forEach((day, dayIdx) => {
      const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
      const coords = (day.activities || [])
        .filter(a => a.lat && a.lng)
        .map(a => ({ lat: a.lat, lng: a.lng }));

      if (coords.length < 2) return;

      try {
        const polyline = mapplsObj.Polyline({
          map,
          path: coords,
          strokeColor: color,
          strokeOpacity: 0.85,
          strokeWeight: 4,
        });
        polylinesRef.current.push(polyline);

        // Label marker for each activity
        coords.forEach((coord, i) => {
          const act = (day.activities || []).filter(a => a.lat && a.lng)[i];
          if (!act) return;
          mapplsObj.Marker({
            map,
            position: { lat: coord.lat, lng: coord.lng },
            popupHtml: `<div style="font-family:'Outfit',sans-serif;padding:6px 10px;min-width:140px">
              <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:2px">Day ${day.day}</div>
              <b style="color:#0F172A;font-size:13px">${act.title}</b>
              ${act.place ? `<div style="color:#64748B;font-size:11px;margin-top:2px">📍 ${act.place}</div>` : ''}
              ${act.time  ? `<div style="color:#94A3B8;font-size:11px">⏰ ${act.time}</div>` : ''}
            </div>`,
            popupOptions: { openPopup: false },
          });
        });
      } catch {}
    });
  }

  /* ── Add a marker ── */
  function addMarkerToMap(map, pin) {
    try {
      const marker = mapplsObj.Marker({
        map,
        position: { lat: pin.lat, lng: pin.lng },
        draggable: false,
        popupHtml: `<div style="font-family:'Outfit',sans-serif;padding:6px 8px;min-width:150px">
          <b style="color:#0F172A;font-size:14px">${pin.name}</b>
          <div style="color:#64748B;font-size:12px;margin-top:2px">${CAT[pin.category]?.label || pin.category}</div>
          ${pin.note ? `<div style="color:#334155;font-size:12px;margin-top:4px;font-style:italic">"${pin.note}"</div>` : ''}
        </div>`,
        popupOptions: { openPopup: false },
      });
      markersRef.current[pin.id] = marker;
    } catch {}
  }

  /* ── Search places ── */
  async function doSearch(q) {
    if (!q || q.length < 2) { setSuggestions([]); return; }
    const results = await searchPlaces(q);
    setSuggestions(results.slice(0, 6));
    if (results.length) setShowSugg(true);
  }

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  }

  function selectSuggestion(s) {
    const lat = parseFloat(s.latitude);
    const lng = parseFloat(s.longitude);
    const name = s.placeName || s.placeAddress || query;
    const address = s.placeAddress || '';
    if (!lat || !lng) return;

    if (mapRef.current) {
      try { mapRef.current.setCenter([lat, lng]); mapRef.current.setZoom(15); } catch {}
    }

    setPending({ lat, lng, name, address });
    setQuery(name);
    setSuggestions([]);
    setShowSugg(false);
    setNote('');
  }

  /* ── Current location ── */
  function pinMyLocation() {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const name = 'My Location';

        if (mapRef.current) {
          try { mapRef.current.setCenter([lat, lng]); mapRef.current.setZoom(16); } catch {}
        }
        setPending({ lat, lng, name, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        setSelCat('current');
        setQuery(name);
        setSuggestions([]);
        setNote('');
      },
      () => { setLocating(false); alert('Could not get your location. Please allow location access.'); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  /* ── Confirm pin ── */
  function confirmPin() {
    if (!pending || !mapRef.current) return;
    const updated = addPin(tripId, {
      lat: pending.lat, lng: pending.lng,
      name: pending.name, category: selCat, note,
    });
    const newPin = updated.pins[updated.pins.length - 1];
    addMarkerToMap(mapRef.current, newPin);
    loadPins();
    setPending(null);
    setNote('');
    setQuery('');
  }

  /* ── Delete pin ── */
  function removePinHandler(pinId) {
    if (markersRef.current[pinId]) {
      try { markersRef.current[pinId].remove(); } catch {}
      delete markersRef.current[pinId];
    }
    deletePin(tripId, pinId);
    loadPins();
  }

  /* ── Pan to pin ── */
  function panToPin(pin) {
    if (!mapRef.current) return;
    try {
      mapRef.current.setCenter([pin.lat, pin.lng]);
      mapRef.current.setZoom(15);
    } catch {}
  }

  return (
    <div className="map-outer">
      {/* Search + Locate */}
      <div className="map-search-bar">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', zIndex: 1, pointerEvents: 'none' }} />
            <PlaceAutocompleteInput
              value={query}
              onChange={val => setQuery(val)}
              onSelectLocation={loc => {
                setQuery(loc.name);
                if (loc.lat && loc.lng) {
                  if (mapRef.current) {
                    try { mapRef.current.setCenter([loc.lat, loc.lng]); mapRef.current.setZoom(15); } catch {}
                  }
                  setPending({ lat: loc.lat, lng: loc.lng, name: loc.name, address: loc.address });
                  setNote('');
                }
              }}
              placeholder="Search places in India…"
              style={{ paddingLeft: 40 }}
            />
          </div>

          {/* Current location button */}
          <button
            onClick={pinMyLocation}
            disabled={locating}
            title="Pin my current location"
            style={{
              width: 44, height: 44, borderRadius: 12, border: '1.5px solid #E2E8F0',
              background: locating ? '#F1F5F9' : 'white', cursor: locating ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              color: locating ? '#94A3B8' : '#10B981', transition: 'all 200ms',
            }}
          >
            {locating
              ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#10B981', borderColor: '#E2E8F0' }} />
              : <Navigation size={18} />
            }
          </button>
        </div>

        {/* Confirm card */}
        {pending && (
          <div className="pending-place-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{pending.name}</div>
                {pending.address && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{pending.address}</div>}
              </div>
              <button onClick={() => setPending(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={16} /></button>
            </div>
            <div className="category-chips">
              {Object.entries(CAT).map(([key, { label, color, bg }]) => (
                <button key={key} className="cat-chip" onClick={() => setSelCat(key)}
                  style={{ background: selCat === key ? color : bg, color: selCat === key ? '#fff' : color, borderColor: color }}>
                  {label}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Add a note (optional)…" value={note} onChange={e => setNote(e.target.value)} className="input input-sm" style={{ marginBottom: 10 }} />
            <button className="btn btn-md btn-primary btn-full" onClick={confirmPin}>
              <MapPin size={16} /> Drop Pin
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {!isMapLoaded && !loadError && (
        <div style={{ height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94A3B8', background: '#F8FAFC', borderRadius: 16 }}>
          <div style={{ fontSize: 48 }}>🗺️</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Loading MapMyIndia…</div>
        </div>
      )}

      {/* Map container */}
      <div
        id="mappls-map-el"
        style={{ width: '100%', height: 460, display: isMapLoaded ? 'block' : 'none', borderRadius: 16, overflow: 'hidden' }}
      />

      {/* Day path legend */}
      {isMapLoaded && (() => {
        const trip = getTrip(tripId);
        const daysWithLoc = (trip?.days || []).filter(d =>
          (d.activities || []).some(a => a.lat && a.lng)
        );
        if (!daysWithLoc.length) return null;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 4px 0' }}>
            {daysWithLoc.map((day, i) => {
              const color = DAY_COLORS[i % DAY_COLORS.length];
              return (
                <div key={day.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                  <span style={{ width: 20, height: 4, borderRadius: 4, background: color, display: 'inline-block' }} />
                  Day {day.day}
                </div>
              );
            })}
          </div>
        );
      })()}

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
                <button onClick={e => { e.stopPropagation(); removePinHandler(pin.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', marginLeft: 6, flexShrink: 0 }}>
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
