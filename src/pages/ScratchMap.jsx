import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTrips, getGeoCache, setGeoCache } from "../utils/storage";
import { getPolarSteps } from "../utils/polarstepsStorage";

// Fix default icon paths for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const WORLD_COUNTRIES = [
  { name:"India",emoji:"🇮🇳" },{ name:"United States",emoji:"🇺🇸" },{ name:"United Kingdom",emoji:"🇬🇧" },
  { name:"France",emoji:"🇫🇷" },{ name:"Germany",emoji:"🇩🇪" },{ name:"Italy",emoji:"🇮🇹" },
  { name:"Spain",emoji:"🇪🇸" },{ name:"Japan",emoji:"🇯🇵" },{ name:"Australia",emoji:"🇦🇺" },
  { name:"Brazil",emoji:"🇧🇷" },{ name:"UAE",emoji:"🇦🇪" },{ name:"Singapore",emoji:"🇸🇬" },
  { name:"Thailand",emoji:"🇹🇭" },{ name:"Nepal",emoji:"🇳🇵" },{ name:"Sri Lanka",emoji:"🇱🇰" },
  { name:"Maldives",emoji:"🇲🇻" },{ name:"Canada",emoji:"🇨🇦" },{ name:"Turkey",emoji:"🇹🇷" },
  { name:"Greece",emoji:"🇬🇷" },{ name:"Portugal",emoji:"🇵🇹" },{ name:"Switzerland",emoji:"🇨🇭" },
  { name:"Indonesia",emoji:"🇮🇩" },{ name:"Malaysia",emoji:"🇲🇾" },{ name:"Vietnam",emoji:"🇻🇳" },
  { name:"South Korea",emoji:"🇰🇷" },{ name:"Kenya",emoji:"🇰🇪" },{ name:"Morocco",emoji:"🇲🇦" },
  { name:"New Zealand",emoji:"🇳🇿" },{ name:"Mexico",emoji:"🇲🇽" },{ name:"Argentina",emoji:"🇦🇷" },
];

async function geocode(query) {
  const cache = getGeoCache();
  const key = query.toLowerCase().trim();
  if (cache[key]) return cache[key];
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    if (data?.[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      setGeoCache(key, coords);
      return coords;
    }
  } catch {}
  return null;
}

export default function ScratchMap() {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [trips, setTrips] = useState([]);
  const [pins, setPins] = useState([]);
  const [activeView, setActiveView] = useState("map");
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTrips(getTrips()); }, []);

  // Collect all coordinates: from polarsteps route steps + geocode destinations
  useEffect(() => {
    if (!trips.length) { setLoading(false); return; }
    const collected = [];

    // 1. Pull route steps (have exact coords)
    trips.forEach(trip => {
      const steps = getPolarSteps(trip.id);
      steps.forEach(s => {
        if (s.lat && s.lng) {
          collected.push({ lat: s.lat, lng: s.lng, tripId: trip.id, tripName: trip.name || trip.destination, status: trip.status, emoji: trip.emoji || "✈️", label: s.name || trip.destination, destination: trip.destination, type: "step" });
        }
      });
    });

    // 2. Geocode trip destinations that have no steps
    const tripsWithoutSteps = trips.filter(t => !getPolarSteps(t.id).length && t.destination);
    let pending = tripsWithoutSteps.length;
    if (!pending) { setPins(collected); setLoading(false); return; }

    tripsWithoutSteps.forEach(trip => {
      geocode(trip.destination).then(coords => {
        if (coords) {
          collected.push({ lat: coords.lat, lng: coords.lng, tripId: trip.id, tripName: trip.name || trip.destination, status: trip.status, emoji: trip.emoji || "✈️", label: trip.destination, destination: trip.destination, type: "destination" });
        }
        pending--;
        if (pending === 0) { setPins([...collected]); setLoading(false); }
      });
    });
  }, [trips]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([20, 78], 4);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © Carto",
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when pins or map ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    pins.forEach(pin => {
      const icon = L.divIcon({
        html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">${pin.emoji}</div>`,
        className: "", iconSize: [30, 30], iconAnchor: [15, 15],
      });
      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:160px">
          <div style="font-size:16px;font-weight:800;margin-bottom:4px">${pin.emoji} ${pin.tripName}</div>
          <div style="font-size:12px;color:#666;margin-bottom:6px">📍 ${pin.label}</div>
          <div style="display:inline-block;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700;background:${pin.status === "completed" ? "#D1FAE5" : pin.status === "ongoing" ? "#DBEAFE" : "#FEF3C7"};color:#0F172A">${pin.status || "planning"}</div>
        </div>
      `);
      markersRef.current.push(marker);
    });

    if (pins.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(pins.map(p => [p.lat, p.lng])).pad(0.2));
      } catch {}
    }
  }, [pins]);

  const visitedCountries = [...new Set(trips.map(t => t.country).filter(Boolean))];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0F172A" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#0F172A", flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>🌍 Travel Map</div>
          <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11 }}>{trips.length} trip{trips.length !== 1 ? "s" : ""} · {visitedCountries.length} countr{visitedCountries.length !== 1 ? "ies" : "y"}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setActiveView("map")} style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeView === "map" ? "var(--em,#10B981)" : "rgba(255,255,255,.1)", color: "#fff" }}>Map</button>
          <button onClick={() => setActiveView("list")} style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeView === "list" ? "var(--em,#10B981)" : "rgba(255,255,255,.1)", color: "#fff" }}>Countries</button>
        </div>
      </div>

      {/* Leaflet map */}
      {activeView === "map" && (
        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,.7)", color: "#fff", fontSize: 14, fontWeight: 700, zIndex: 1000 }}>
              📍 Loading your travel pins…
            </div>
          )}
          {!loading && pins.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,.7)", color: "#fff", textAlign: "center", padding: 24, zIndex: 1000 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>No map pins yet</div>
              <div style={{ fontSize: 13, opacity: .7 }}>Add destinations to your trips and they will appear here automatically.</div>
            </div>
          )}
        </div>
      )}

      {/* Countries list view */}
      {activeView === "list" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, marginBottom: 14, opacity: .7 }}>Countries You&apos;ve Visited or Plan to Visit</div>
          {trips.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,.5)", padding: "40px 0", fontSize: 14 }}>No trips yet. Start planning!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...new Map(trips.filter(t => t.country || t.destination).map(t => [t.country || t.destination, t])).values()].map(t => {
                const cEntry = WORLD_COUNTRIES.find(c => c.name.toLowerCase() === (t.country || "").toLowerCase());
                const emoji = cEntry?.emoji || t.emoji || "🌍";
                const tripCount = trips.filter(x => x.country === t.country && t.country).length;
                const colors = { completed: "#D1FAE5", ongoing: "#DBEAFE", planning: "#FEF9C3", upcoming: "#FEF3C7" };
                return (
                  <div key={t.id} style={{ background: "rgba(255,255,255,.07)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 28, flexShrink: 0 }}>{emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{t.country || t.destination}</div>
                      <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginTop: 2 }}>{tripCount > 1 ? `${tripCount} trips` : t.destination}</div>
                    </div>
                    <div style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: colors[t.status] || "#FEF9C3", color: "#0F172A" }}>{t.status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
