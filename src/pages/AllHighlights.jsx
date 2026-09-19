import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { getTrips, normalizeHighlight } from "../utils/storage";

function StoryViewer({ photos, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { if (idx < photos.length - 1) { setIdx(i => i + 1); return 0; } else { onClose(); return 100; } }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(timerRef.current);
  }, [idx, photos.length, onClose]);

  useEffect(() => { setProgress(0); }, [idx]);
  const photo = photos[idx];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#000" }}>
      <div style={{ position: "absolute", top: 48, left: 12, right: 12, display: "flex", gap: 3, zIndex: 10 }}>
        {photos.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, background: "rgba(255,255,255,.3)", borderRadius: 99 }}>
            <div style={{ height: "100%", borderRadius: 99, background: "white", width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%", transition: "width .08s linear" }} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 58, left: 16, right: 16, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>{photo?.tripName}</div>
          {photo?.albumTitle && <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>{photo.albumTitle}</div>}
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={18} color="white" />
        </button>
      </div>
      <img src={photo?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", bottom: 32, width: "100%", textAlign: "center", color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>
        {idx + 1} / {photos.length}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 5 }}>
        <div style={{ flex: 1 }} onClick={() => idx > 0 && setIdx(i => i - 1)} />
        <div style={{ flex: 1 }} onClick={() => idx < photos.length - 1 ? setIdx(i => i + 1) : onClose()} />
      </div>
    </div>
  );
}

export default function AllHighlights() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState("all");
  const [viewer, setViewer] = useState(null);

  useEffect(() => { setTrips(getTrips()); }, []);

  const allPhotos = trips.flatMap(trip =>
    (trip.highlights || []).flatMap(h => {
      const norm = normalizeHighlight(h);
      return (norm.photos || []).map(p => ({ ...p, tripId: trip.id, tripName: trip.name || "Trip", albumTitle: h.title || "" }));
    })
  );
  const filteredPhotos = filter === "all" ? allPhotos : allPhotos.filter(p => p.tripId === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 90 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
          <ArrowLeft size={22} color="#111827" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>All Highlights</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>{filteredPhotos.length} photo{filteredPhotos.length !== 1 ? "s" : ""}{filter === "all" && trips.length > 0 ? ` across ${trips.length} trip${trips.length !== 1 ? "s" : ""}` : ""}</div>
        </div>
      </div>

      {trips.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 16px", scrollbarWidth: "none" }}>
          <button onClick={() => setFilter("all")} style={{ flexShrink: 0, padding: "6px 16px", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: filter === "all" ? "#111827" : "#F3F4F6", color: filter === "all" ? "#fff" : "#374151" }}>All</button>
          {trips.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{ flexShrink: 0, padding: "6px 16px", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", background: filter === t.id ? "#111827" : "#F3F4F6", color: filter === t.id ? "#fff" : "#374151" }}>
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      )}

      {filteredPhotos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📸</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>No highlights yet</div>
          <div style={{ fontSize: 14, color: "#9CA3AF" }}>Add photos in your trip workspace to see them here.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {filteredPhotos.map((photo, i) => (
            <div key={photo.id + i} onClick={() => setViewer({ photos: filteredPhotos, startIdx: i })}
              style={{ overflow: "hidden", cursor: "pointer", aspectRatio: "1", ...(i % 7 === 0 ? { gridColumn: "span 2", aspectRatio: "2/1" } : {}) }}>
              <img src={photo.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      )}

      {viewer && <StoryViewer photos={viewer.photos} startIdx={viewer.startIdx} onClose={() => setViewer(null)} />}
    </div>
  );
}