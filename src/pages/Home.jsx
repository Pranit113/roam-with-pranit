import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, MapPin, ChevronRight, X } from "lucide-react";
import { getTrips, getProfile, normalizeHighlight } from "../utils/storage";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function fmtDate(d) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function statusColor(s) {
  if (s === "ongoing") return "#10B981";
  if (s === "upcoming") return "#F59E0B";
  if (s === "completed") return "#6B7280";
  return "#9CA3AF";
}

function StoryViewer({ trip, onClose }) {
  const photos = (trip.highlights || []).flatMap(h => {
    const norm = normalizeHighlight(h);
    return (norm.photos || []).map(p => ({ ...p, title: h.title }));
  });
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (idx < photos.length - 1) { setIdx(i => i + 1); return 0; }
          else { onClose(); return 100; }
        }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(timerRef.current);
  }, [idx, photos.length, onClose]);

  useEffect(() => { setProgress(0); }, [idx]);

  if (!photos.length) { onClose(); return null; }
  const photo = photos[idx];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#000" }}>
      <div style={{ position: "absolute", top: 48, left: 12, right: 12, display: "flex", gap: 3, zIndex: 10 }}>
        {photos.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, background: "rgba(255,255,255,.3)", borderRadius: 99 }}>
            <div style={{ height: "100%", borderRadius: 99, background: "white", width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%", transition: "width .08s linear" }} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 58, left: 16, right: 16, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>{trip.emoji} {trip.name}</div>
          {photo.title && <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>{photo.title}</div>}
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="white" />
        </button>
      </div>
      <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 5 }}>
        <div style={{ flex: 1 }} onClick={() => idx > 0 && setIdx(i => i - 1)} />
        <div style={{ flex: 1 }} onClick={() => idx < photos.length - 1 ? setIdx(i => i + 1) : onClose()} />
      </div>
    </motion.div>
  );
}

function HighlightRing({ trip, onOpen }) {
  const firstPhoto = (() => {
    for (const h of trip.highlights || []) {
      const n = normalizeHighlight(h);
      if (n.photos?.[0]?.url) return n.photos[0].url;
    }
    return null;
  })();
  const hasPhotos = (trip.highlights || []).some(h => (normalizeHighlight(h).photos || []).length > 0);
  if (!hasPhotos) return null;

  return (
    <div onClick={() => onOpen(trip)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", padding: 2.5, background: "linear-gradient(135deg,#10B981,#06B6D4)", marginBottom: 6 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2.5px solid white", overflow: "hidden", background: "#F3F4F6" }}>
          {firstPhoto
            ? <img src={firstPhoto} alt={trip.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{trip.emoji || "✈️"}</div>
          }
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", textAlign: "center", maxWidth: 68, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {trip.name}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [profile, setProfile] = useState({ name: "Pranit" });
  const [story, setStory] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTrips(getTrips());
    setProfile(getProfile());
  }, []);

  const filteredTrips = !search.trim()
    ? trips
    : trips.filter(t =>
        (t.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.destination || "").toLowerCase().includes(search.toLowerCase())
      );

  const tripsWithHighlights = trips.filter(t =>
    (t.highlights || []).some(h => (normalizeHighlight(h).photos || []).length > 0)
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 100 }}>
      <AnimatePresence>{story && <StoryViewer trip={story} onClose={() => setStory(null)} />}</AnimatePresence>

      {/* Header */}
      <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>
          RoamWith<span style={{ color: "#10B981" }}>Pranit</span>
        </div>
        <button onClick={() => navigate("/profile")} style={{ width: 40, height: 40, borderRadius: "50%", background: "#10B981", color: "#fff", border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {(profile.name || "P")[0].toUpperCase()}
        </button>
      </div>

      {/* Greeting */}
      <div style={{ padding: "6px 20px 0", fontSize: 14, color: "#9CA3AF", fontWeight: 500 }}>
        {greeting()}, {profile.name || "Pranit"} ✈️
      </div>

      {/* Search bar */}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F9FAFB", borderRadius: 99, padding: "12px 18px", border: "1.5px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <Search size={17} color="#9CA3AF" />
          <input type="text" placeholder="Search your trips..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#111827", fontWeight: 500 }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={15} color="#9CA3AF" /></button>}
        </div>
      </div>

      {/* Highlights */}
      {!search && tripsWithHighlights.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Highlights</div>
            <button onClick={() => navigate("/highlights")} style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View all</button>
          </div>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "4px 20px 8px", scrollbarWidth: "none" }}>
            {tripsWithHighlights.map(t => <HighlightRing key={t.id} trip={t} onOpen={setStory} />)}
          </div>
        </div>
      )}

      {/* Trips */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
            {search ? `Results for "${search}"` : "My Trips"}
          </div>
          {!search && trips.length > 0 && (
            <button onClick={() => navigate("/trips")} style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>See all</button>
          )}
        </div>

        {filteredTrips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✈️</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>
              {search ? "No trips found" : "No journeys yet"}
            </div>
            <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>
              {search ? "Try a different search term" : "Start planning your first adventure"}
            </div>
            {!search && (
              <motion.button onClick={() => navigate("/trips")} whileTap={{ scale: 0.97 }}
                style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 99, padding: "14px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} /> Plan a Trip
              </motion.button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredTrips.map((trip, i) => {
              const isHero = i === 0 && trip.cover;
              if (isHero) {
                return (
                  <motion.div key={trip.id} onClick={() => navigate(`/trip/${trip.id}`)} whileTap={{ scale: 0.98 }}
                    style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", cursor: "pointer" }}>
                    <div style={{ height: 220, overflow: "hidden", position: "relative" }}>
                      <img src={trip.cover} alt={trip.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderRadius: 99, padding: "4px 12px", fontSize: 11, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(trip.status), display: "inline-block" }} />
                        {trip.status ? trip.status[0].toUpperCase() + trip.status.slice(1) : "Planning"}
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px 16px", background: "#fff" }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{trip.emoji} {trip.name}</div>
                      {trip.destination && <div style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}><MapPin size={12} color="#10B981" strokeWidth={2.5} /> {trip.destination}</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>{fmtDate(trip.startDate)}{trip.endDate ? ` – ${fmtDate(trip.endDate)}` : ""}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>Open →</div>
                      </div>
                    </div>
                  </motion.div>
                );
              }
              return (
                <motion.div key={trip.id} onClick={() => navigate(`/trip/${trip.id}`)} whileTap={{ scale: 0.98 }}
                  style={{ display: "flex", gap: 12, padding: "12px", background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
                    {trip.cover ? <img src={trip.cover} alt={trip.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (trip.emoji || "✈️")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{trip.emoji} {trip.name}</div>
                    {trip.destination && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>📍 {trip.destination}</div>}
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor(trip.status), display: "inline-block" }} />
                      <span style={{ textTransform: "capitalize" }}>{trip.status || "Planning"}</span>
                      {trip.startDate && <span> · {fmtDate(trip.startDate)}</span>}
                    </div>
                  </div>
                  <ChevronRight size={18} color="#D1D5DB" style={{ alignSelf: "center", flexShrink: 0 }} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Places shortcut */}
      {!search && (
        <div style={{ padding: "24px 20px 0" }}>
          <motion.div onClick={() => navigate("/places")} whileTap={{ scale: 0.98 }}
            style={{ background: "#F0FDF4", borderRadius: 16, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, border: "1px solid #D1FAE5" }}>
            <div style={{ fontSize: 28 }}>🗺️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>My Places</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Hotels, restaurants, activities & more</div>
            </div>
            <ChevronRight size={18} color="#10B981" />
          </motion.div>
        </div>
      )}
    </div>
  );
}