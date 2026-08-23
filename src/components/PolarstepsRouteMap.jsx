import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Navigation } from 'lucide-react';

const TRANSPORT_EMOJIS = {
  flight: '✈️',
  train:  '🚆',
  car:    '🚗',
  boat:   '⛵',
  hike:   '🥾',
  bus:    '🚌',
};

const MAP_STYLES = {
  voyager:     { label: 'Voyager',   url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  'esri-topo': { label: 'Esri Topo', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
  sat:         { label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  dark:        { label: 'Dark Mode', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  osm:         { label: 'OSM',       url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
};

export default function PolarstepsRouteMap({ steps = [], activeStepId, onSelectStep, onMapClick }) {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const tileLayerRef    = useRef(null);
  const markersRef      = useRef({});
  const polylineRef     = useRef(null);

  const [styleKey, setStyleKey] = useState('voyager');

  /* Create custom numbered pin icon with transport emoji */
  function createStepIcon(stepNo, transportMode, isActive) {
    const emoji = TRANSPORT_EMOJIS[transportMode] || '📍';
    const bg    = isActive ? '#10B981' : '#0F172A';
    const html  = `
      <div class="ps-map-pin ${isActive ? 'active' : ''}" style="background:${bg};">
        <span class="ps-map-pin-num">${stepNo}</span>
        <span class="ps-map-pin-emoji">${emoji}</span>
      </div>
    `;
    return L.divIcon({
      className: 'ps-leaflet-div-icon',
      html,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -40],
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = steps[0] ? [steps[0].lat, steps[0].lng] : [20.5937, 78.9629];
    const initialZoom   = steps[0] ? 8 : 5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
    });

    // Add zoom control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    tileLayerRef.current = L.tileLayer(MAP_STYLES[styleKey].url, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors, CartoDB, Esri',
    }).addTo(map);

    map.on('click', e => {
      if (onMapClick) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Update tile layer on style change */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(MAP_STYLES[styleKey].url);
  }, [styleKey]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers & polyline
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (!steps.length) return;

    const coords = [];

    steps.forEach(s => {
      if (s.lat != null && s.lng != null) {
        const point = [s.lat, s.lng];
        coords.push(point);

        const isActive = s.id === activeStepId;
        const icon = createStepIcon(s.stepNo, s.transportMode, isActive);
        const marker = L.marker(point, { icon }).addTo(map);

        marker.on('click', () => {
          if (onSelectStep) onSelectStep(s.id);
        });

        const popupContent = `
          <div style="font-family:sans-serif; text-align:center; padding:4px;">
            <div style="font-weight:800; font-size:14px; color:#0F172A;">Step ${s.stepNo}: ${s.name}</div>
            <div style="font-size:12px; color:#64748B; margin-top:2px;">${s.date || ''} · ${s.transportMode || 'travel'}</div>
            ${s.distKm ? `<div style="font-weight:700; color:#10B981; font-size:11px; margin-top:3px;">+${s.distKm} km</div>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);

        markersRef.current[s.id] = marker;
      }
    });

    // Draw connected route polyline
    if (coords.length > 1) {
      polylineRef.current = L.polyline(coords, {
        color: '#10B981',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
    }

    // Fit map bounds to encompass all step markers
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, activeStepId]);

  /* Focus map on active step */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeStepId) return;

    const step = steps.find(s => s.id === activeStepId);
    if (step && step.lat != null) {
      map.flyTo([step.lat, step.lng], 11, { duration: 1.2 });
      if (markersRef.current[step.id]) {
        markersRef.current[step.id].openPopup();
      }
    }
  }, [activeStepId, steps]);

  return (
    <div className="ps-map-container">
      <div ref={mapContainerRef} className="ps-leaflet-map" />

      {/* Map Tile Switcher overlay */}
      <div className="ps-map-style-bar">
        <Layers size={14} color="var(--t3)" />
        {Object.keys(MAP_STYLES).map(k => (
          <button
            key={k}
            className={`ps-map-style-btn ${styleKey === k ? 'active' : ''}`}
            onClick={() => setStyleKey(k)}
          >
            {MAP_STYLES[k].label}
          </button>
        ))}
      </div>

      <div className="ps-map-hint">
        <Navigation size={12} color="var(--em)" />
        <span>Click anywhere on map to pin new step</span>
      </div>
    </div>
  );
}
