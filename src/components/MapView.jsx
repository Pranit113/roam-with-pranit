import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, X, Trash2, Navigation } from 'lucide-react';
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

const DAY_COLORS = [
  '#10B981','#6366F1','#F59E0B','#EC4899','#0EA5E9',
  '#F97316','#8B5CF6','#84CC16','#EF4444','#14B8A6',
];

export default function MapView({ tripId, mapCenter }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const tileLayerRef    = useRef(null);
  const markersRef      = useRef({});
  const polylinesRef    = useRef([]);

  const [pins,       setPins]       = useState([]);
  const [pending,    setPending]    = useState(null);
  const [selCat,     setSelCat]     = useState('landmark');
  const [note,       setNote]       = useState('');
  const [query,      setQuery]      = useState('');
  const [locating,   setLocating]   = useState(false);
  const [mapStyle, setMapStyle] = useState('esri-topo'); // Default to Esri Topo Map

  const loadPins = useCallback(() => {
    const trip = getTrip(tripId);
    setPins(trip?.pins || []);
  }, [tripId]);

  useEffect(() => { loadPins(); }, [loadPins]);

  /* Helper to create colored custom SVG pin icon */
  function createCustomIcon(color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="34" height="44">
      <path d="M18 0C8.06 0 0 8.059 0 18c0 13.5 18 30 18 30S36 31.5 36 18C36 8.059 27.94 0 18 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="18" cy="18" r="7" fill="#ffffff"/>
      <circle cx="18" cy="18" r="4" fill="${color}"/>
    </svg>`;
    return L.divIcon({
      className: 'custom-leaflet-pin',
      html: svg,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
      popupAnchor: [0, -40],
    });
  }

  // Map Tile Layers Configuration
  function getTileUrl(style) {
    if (style === 'esri-topo') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'; // Esri Topo Map (Rich Detailed)
    }
    if (style === 'osm-standard') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // OpenStreetMap Standard
    }
    if (style === 'carto-positron') {
      return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'; // Clean Light Minimal
    }
    if (style === 'carto-dark') {
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // Dark Mode Glow
    }
    if (style === 'esri-sat') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'; // Esri High-Res Satellite
    }
    if (style === 'google-satellite') {
      return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Satellite Hybrid
    }
    if (style === 'voyager') {
      return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
    return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Roadmap
  }

  /* ── Initialize Leaflet Map ── */
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const center = mapCenter ? [mapCenter.lat, mapCenter.lng] : [20.5937, 78.9629];
    const zoom   = mapCenter ? 12 : 5;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; Google Maps & OpenStreetMap',
    }).addTo(map);

    tileLayerRef.current  = tileLayer;
    mapInstanceRef.current = map;

    // Click map anywhere to drop pin directly
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setPending({
        lat,
        lng,
        name: `Pinned Location`,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
      setNote('');
    });

    const trip = getTrip(tripId);
    renderPinsAndPaths(map, trip);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // Update map style when changed
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(getTileUrl(mapStyle));
    }
  }, [mapStyle]);

  /* Render all pins & day-wise travel polylines */
  function renderPinsAndPaths(map, trip) {
    if (!map) return;

    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];

    // 1. Pinned Places
    (trip?.pins || []).forEach(pin => {
      const color = CAT[pin.category]?.color || '#10B981';
      const marker = L.marker([pin.lat, pin.lng], { icon: createCustomIcon(color) }).addTo(map);
      marker.bindPopup(`<div style="font-family:'Outfit',sans-serif;padding:4px 6px;min-width:150px">
        <b style="color:#0F172A;font-size:14px;display:block">${pin.name}</b>
        <span style="color:#64748B;font-size:12px;margin-top:2px;display:block">${CAT[pin.category]?.label || pin.category}</span>
        ${pin.note ? `<div style="color:#334155;font-size:12px;margin-top:4px;font-style:italic">"${pin.note}"</div>` : ''}
      </div>`);
      markersRef.current[pin.id] = marker;
    });

    // 2. Day-Wise Travel Routes
    if (trip?.days?.length) {
      trip.days.forEach((day, dayIdx) => {
        const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
        const coords = (day.activities || [])
          .filter(a => a.lat && a.lng)
          .map(a => [a.lat, a.lng]);

        if (coords.length > 0) {
          (day.activities || []).forEach((act, actIdx) => {
            if (!act.lat || !act.lng) return;
            const actMarker = L.circleMarker([act.lat, act.lng], {
              radius: 9,
              fillColor: color,
              color: '#FFFFFF',
              weight: 2,
              fillOpacity: 0.9,
            }).addTo(map);

            actMarker.bindPopup(`<div style="font-family:'Outfit',sans-serif;padding:4px 6px;min-width:140px">
              <div style="font-size:11px;font-weight:700;color:${color}">Day ${day.day} • Activity ${actIdx + 1}</div>
              <b style="color:#0F172A;font-size:13px;display:block;margin-top:2px">${act.title}</b>
              ${act.place ? `<div style="color:#64748B;font-size:11px">📍 ${act.place}</div>` : ''}
              ${act.time ? `<div style="color:#94A3B8;font-size:11px">⏰ ${act.time}</div>` : ''}
            </div>`);
          });

          if (coords.length >= 2) {
            const polyline = L.polyline(coords, {
              color,
              weight: 4,
              opacity: 0.85,
              dashArray: '6, 6',
            }).addTo(map);
            polylinesRef.current.push(polyline);
          }
        }
      });
    }
  }

  useEffect(() => {
    if (mapInstanceRef.current) {
      const trip = getTrip(tripId);
      renderPinsAndPaths(mapInstanceRef.current, trip);
    }
  }, [pins, tripId]);

  /* Get Current GPS Location */
  function pinMyLocation() {
    if (!navigator.geolocation) return alert('Geolocation not supported on this browser');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true });
        }

        setPending({
          lat,
          lng,
          name: 'My Location',
          address: `Current position (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        });
        setSelCat('current');
        setQuery('My Location');
      },
      () => {
        setLocating(false);
        alert('Could not detect your location. Please check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function confirmPin() {
    if (!pending) return;
    addPin(tripId, {
      lat: pending.lat,
      lng: pending.lng,
      name: pending.name,
      category: selCat,
      note,
    });
    loadPins();
    setPending(null);
    setNote('');
    setQuery('');
  }

  function removePinHandler(pinId) {
    deletePin(tripId, pinId);
    loadPins();
  }

  function panToPin(pin) {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([pin.lat, pin.lng], 15, { animate: true });
    if (markersRef.current[pin.id]) {
      markersRef.current[pin.id].openPopup();
    }
  }

  return (
    <div className="map-outer">
      {/* Search & Location & Style Controls */}
      <div className="map-search-bar">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', zIndex: 1, pointerEvents: 'none' }} />
            <PlaceAutocompleteInput
              value={query}
              onChange={val => setQuery(val)}
              onSelectLocation={loc => {
                setQuery(loc.name);
                if (loc.lat && loc.lng) {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([loc.lat, loc.lng], 15, { animate: true });
                  }
                  setPending({ lat: loc.lat, lng: loc.lng, name: loc.name, address: loc.address });
                  setNote('');
                } else {
                  // If custom location without lat/lng, prompt user to click on map
                  const center = mapInstanceRef.current ? mapInstanceRef.current.getCenter() : { lat: 20.5937, lng: 78.9629 };
                  setPending({ lat: center.lat, lng: center.lng, name: loc.name, address: 'Custom place (click map to adjust location)' });
                }
              }}
              placeholder="Search any place in India or worldwide…"
              style={{ paddingLeft: 40 }}
            />
          </div>

          {/* Map Style Toggle */}
          <select
            value={mapStyle}
            onChange={e => setMapStyle(e.target.value)}
            style={{
              padding: '0 10px',
              borderRadius: 12,
              border: '1.5px solid #E2E8F0',
              background: 'white',
              fontSize: 12,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
            title="Switch map layer"
          >
            <option value="esri-topo">🏔️ Esri Topo Map (Default)</option>
            <option value="osm-standard">🍃 OpenStreetMap Detailed</option>
            <option value="carto-positron">🏙️ Clean Light Theme</option>
            <option value="carto-dark">🌌 Dark Mode Glow</option>
            <option value="google-roadmap">🗺️ Google Maps</option>
            <option value="esri-sat">🛰️ High-Res Satellite</option>
          </select>

          {/* GPS Location Button */}
          <button
            onClick={pinMyLocation}
            disabled={locating}
            title="Pin my current GPS location"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: '1.5px solid #E2E8F0',
              background: locating ? '#F1F5F9' : 'white',
              cursor: locating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: locating ? '#94A3B8' : '#10B981',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            {locating
              ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#10B981', borderColor: '#E2E8F0' }} />
              : <Navigation size={18} />
            }
          </button>
        </div>

        {/* Pending Pin Confirmation Card */}
        {pending && (
          <div className="pending-place-card" style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{pending.name}</div>
                {pending.address && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{pending.address}</div>}
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
              <MapPin size={16} /> Save Pin To Map
            </button>
          </div>
        )}
      </div>

      {/* Interactive Map element */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: 480,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)',
          zIndex: 1,
        }}
      />

      {/* Day-Wise Route Legend */}
      {(() => {
        const trip = getTrip(tripId);
        const daysWithLoc = (trip?.days || []).filter(d =>
          (d.activities || []).some(a => a.lat && a.lng)
        );
        if (!daysWithLoc.length) return null;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 6px 0', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Travel Routes:</span>
            {daysWithLoc.map((day, i) => {
              const color = DAY_COLORS[i % DAY_COLORS.length];
              return (
                <div key={day.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                  <span style={{ width: 18, height: 4, borderRadius: 4, background: color, display: 'inline-block' }} />
                  Day {day.day}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Pinned Places List */}
      {pins.length > 0 && (
        <div className="map-pins-list">
          <div style={{ padding: '10px 16px 6px', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {pins.length} Pinned Places
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
