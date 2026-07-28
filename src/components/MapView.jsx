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

function makePinSVG(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
    <path d="M18 0C8.06 0 0 8.059 0 18c0 13.5 18 30 18 30S36 31.5 36 18C36 8.059 27.94 0 18 0z"
      fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="7" fill="white"/>
    <circle cx="18" cy="18" r="4" fill="${color}"/>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export default function MapView({ tripId, mapCenter }) {
  const mapRef      = useRef(null);
  const mapInst     = useRef(null);
  const acRef       = useRef(null);
  const searchRef   = useRef(null);
  const markersRef  = useRef({});

  const [ready,   setReady]   = useState(!!window._mapsReady);
  const [pins,    setPins]    = useState([]);
  const [pending, setPending] = useState(null);   // { lat,lng,name,address }
  const [selCat,  setSelCat]  = useState('landmark');
  const [note,    setNote]    = useState('');

  /* Reload pins from storage */
  const loadPins = useCallback(() => {
    const trip = getTrip(tripId);
    setPins(trip?.pins || []);
  }, [tripId]);

  useEffect(() => { loadPins(); }, [loadPins]);

  /* Wait for Google Maps */
  useEffect(() => {
    if (window._mapsReady) { setReady(true); return; }
    const handler = () => setReady(true);
    window.addEventListener('gmaps:ready', handler);
    return () => window.removeEventListener('gmaps:ready', handler);
  }, []);

  /* Init map once ready */
  useEffect(() => {
    if (!ready || !mapRef.current || mapInst.current) return;

    const center = mapCenter || { lat: 20.5937, lng: 78.9629 };
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: mapCenter ? 11 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
      styles: [
        { featureType: 'water',     elementType: 'geometry',      stylers: [{ color: '#b3d9ea' }] },
        { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f5f0e8' }] },
        { featureType: 'road',      elementType: 'geometry.fill', stylers: [{ color: '#e8e0d5' }] },
        { featureType: 'road',      elementType: 'geometry.stroke',stylers:[{ color: '#ffffff' }]},
        { featureType: 'poi.park',  elementType: 'geometry.fill', stylers: [{ color: '#c8e6c0' }] },
        { featureType: 'transit',   elementType: 'all',           stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#10B981' }, { weight: 1 }] },
      ],
    });
    mapInst.current = map;

    /* Autocomplete */
    if (searchRef.current) {
      const ac = new window.google.maps.places.Autocomplete(searchRef.current, {
        fields: ['geometry', 'name', 'formatted_address'],
      });
      acRef.current = ac;
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place?.geometry) return;
        const loc = place.geometry.location;
        map.panTo(loc);
        map.setZoom(14);
        setPending({ lat: loc.lat(), lng: loc.lng(), name: place.name, address: place.formatted_address });
        setNote('');
      });
    }

    /* Draw existing pins */
    const trip = getTrip(tripId);
    (trip?.pins || []).forEach(p => addMarker(map, p));
  }, [ready, tripId]);

  /* Add a Google Maps marker */
  function addMarker(map, pin) {
    const color = CAT[pin.category]?.color || '#10B981';
    const marker = new window.google.maps.Marker({
      position: { lat: pin.lat, lng: pin.lng },
      map,
      title: pin.name,
      icon: {
        url: makePinSVG(color),
        scaledSize: new window.google.maps.Size(36, 48),
        anchor: new window.google.maps.Point(18, 48),
      },
      animation: window.google.maps.Animation.DROP,
    });
    const iw = new window.google.maps.InfoWindow({
      content: `<div style="font-family:'Outfit',sans-serif;padding:2px 4px;min-width:140px">
        <b style="color:#0F172A;font-size:14px">${pin.name}</b>
        <div style="color:#64748B;font-size:12px;margin-top:2px">${CAT[pin.category]?.label || pin.category}</div>
        ${pin.note ? `<div style="color:#334155;font-size:12px;margin-top:4px;font-style:italic">"${pin.note}"</div>` : ''}
      </div>`,
    });
    marker.addListener('click', () => iw.open(map, marker));
    markersRef.current[pin.id] = marker;
  }

  /* Confirm pin drop */
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
    if (searchRef.current) searchRef.current.value = '';
  }

  /* Delete pin */
  function removePinHandler(pinId) {
    if (markersRef.current[pinId]) {
      markersRef.current[pinId].setMap(null);
      delete markersRef.current[pinId];
    }
    deletePin(tripId, pinId);
    loadPins();
  }

  /* Pan to pin */
  function panToPin(pin) {
    if (!mapInst.current) return;
    mapInst.current.panTo({ lat: pin.lat, lng: pin.lng });
    mapInst.current.setZoom(15);
    if (markersRef.current[pin.id]) {
      markersRef.current[pin.id].setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => markersRef.current[pin.id]?.setAnimation(null), 1400);
    }
  }

  if (!ready) {
    return (
      <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94A3B8' }}>
        <div style={{ fontSize: 48 }}>🗺️</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Loading map…</div>
      </div>
    );
  }

  return (
    <div className="map-outer">
      {/* Search */}
      <div className="map-search-bar">
        <div style={{ position: 'relative' }}>
          <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search any place to pin it…"
            className="input"
            style={{ paddingLeft: 42 }}
          />
        </div>

        {/* Pending place confirm card */}
        {pending && (
          <div className="pending-place-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{pending.name}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{pending.address}</div>
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
                    background:   selCat === key ? color : bg,
                    color:        selCat === key ? '#fff' : color,
                    borderColor:  color,
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
