import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Plus, X, Trash2 } from "lucide-react";
import { getPlaces, addPlace, deletePlace, getTrips } from "../utils/storage";

const CATEGORIES = [
  { id: "hotel",      label: "Hotels",      emoji: "🏨", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&fit=crop" },
  { id: "restaurant", label: "Restaurants", emoji: "🍽️", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&fit=crop" },
  { id: "cafe",       label: "Cafes",       emoji: "☕", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&fit=crop" },
  { id: "activity",   label: "Activities",  emoji: "🎯", img: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&fit=crop" },
  { id: "beach",      label: "Beaches",     emoji: "🏖️", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&fit=crop" },
  { id: "mountain",   label: "Mountains",   emoji: "🏔️", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&fit=crop" },
  { id: "temple",     label: "Temples",     emoji: "🛕", img: "https://images.unsplash.com/photo-1609948543911-c7e3e1fa4a72?w=200&fit=crop" },
  { id: "fort",       label: "Forts",       emoji: "🏰", img: "https://images.unsplash.com/photo-1548013146-72479768bada?w=200&fit=crop" },
  { id: "shopping",   label: "Shopping",    emoji: "🛍️", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&fit=crop" },
  { id: "waterfall",  label: "Waterfalls",  emoji: "🌊", img: "https://images.unsplash.com/photo-1432889490240-84df33d47091?w=200&fit=crop" },
  { id: "viewpoint",  label: "Viewpoints",  emoji: "🚡", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&fit=crop" },
  { id: "streetfood", label: "Street Food", emoji: "🍦", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&fit=crop" },
  { id: "camping",    label: "Camping",     emoji: "🏕️", img: "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=200&fit=crop" },
  { id: "culture",    label: "Culture",     emoji: "🎭", img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=200&fit=crop" },
  { id: "transport",  label: "Transport",   emoji: "🚗", img: "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=200&fit=crop" },
  { id: "other",      label: "Other",       emoji: "📍", img: null },
];

function openMaps(address) {
  window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address), "_blank");
}

function AddSheet({ onClose, onSave, trips, defaultCat }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCat || "hotel");
  const [address, setAddress] = useState("");
  const [tripId, setTripId] = useState(trips[0]?.id || "");
  const [note, setNote] = useState("");

  function save() {
    if (!name.trim()) return;
    const trip = trips.find(t => t.id === tripId);
    onSave({ name: name.trim(), category, address: address.trim(), tripId, tripName: trip?.name || "", note: note.trim() });
    onClose();
  }

  const inp = { width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 40px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Add a Place</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#9CA3AF" /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Place Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Himalayan Hotel" style={inp} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, background: "#fff" }}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Address / Location</label>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Mall Road, Manali, HP" style={inp} />
          <div style={{ fontSize: 11, color: "#10B981", marginTop: 4, fontWeight: 600 }}>💡 Type any address → tap Open in Maps to navigate</div>
        </div>

        {trips.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Trip (optional)</label>
            <select value={tripId} onChange={e => setTripId(e.target.value)} style={{ ...inp, background: "#fff" }}>
              <option value="">-- No trip --</option>
              {trips.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes..." rows={2}
            style={{ ...inp, resize: "none" }} />
        </div>

        <button onClick={save} disabled={!name.trim()}
          style={{ width: "100%", padding: "14px", background: name.trim() ? "#10B981" : "#E5E7EB", color: name.trim() ? "#fff" : "#9CA3AF", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: name.trim() ? "pointer" : "not-allowed" }}>
          Save Place
        </button>
      </div>
    </div>
  );
}

function CategoryDetail({ category, places, trips, onBack, onAdd, onDelete }) {
  const cat = CATEGORIES.find(c => c.id === category);
  const catPlaces = places.filter(p => p.category === category);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 120 }}>
      <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ArrowLeft size={22} color="#111827" /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{cat?.emoji} {cat?.label}</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>{catPlaces.length} place{catPlaces.length !== 1 ? "s" : ""} saved</div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {catPlaces.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{cat?.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>No {cat?.label} yet</div>
            <div style={{ fontSize: 14, color: "#9CA3AF" }}>Tap the button below to add your first place.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {catPlaces.map(place => (
              <div key={place.id} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {cat?.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>{place.name}</div>
                    {place.tripName && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>📋 {place.tripName}</div>}
                    {place.address && (
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} color="#10B981" strokeWidth={2.5} />
                        <span>{place.address}</span>
                      </div>
                    )}
                    {place.note && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4, fontStyle: "italic" }}>{place.note}</div>}
                    {place.address && (
                      <button onClick={() => openMaps(place.address)}
                        style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: "#10B981", fontWeight: 700, fontSize: 13, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={13} /> Open in Maps →
                      </button>
                    )}
                  </div>
                  <button onClick={() => onDelete(place.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D1D5DB", padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 24, left: 16, right: 16, zIndex: 20 }}>
        <button onClick={onAdd}
          style={{ width: "100%", padding: "14px", background: "#10B981", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}>
          <Plus size={18} /> Add {cat?.label ? cat.label.replace(/s$/, "") : "Place"}
        </button>
      </div>
    </div>
  );
}

export default function Places() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [trips, setTrips] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  function reload() { setPlaces(getPlaces()); setTrips(getTrips()); }
  useEffect(() => { reload(); }, []);

  function handleSave(data) { addPlace(data); reload(); }
  function handleDelete(id) { if (!window.confirm("Remove this place?")) return; deletePlace(id); reload(); }

  if (activeCategory) {
    return (
      <>
        <CategoryDetail category={activeCategory} places={places} trips={trips}
          onBack={() => setActiveCategory(null)} onAdd={() => setAddOpen(true)} onDelete={handleDelete} />
        {addOpen && <AddSheet trips={trips} defaultCat={activeCategory} onClose={() => setAddOpen(false)} onSave={handleSave} />}
      </>
    );
  }

  const filteredCats = search
    ? CATEGORIES.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : CATEGORIES;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 100 }}>
      <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><ArrowLeft size={22} color="#111827" /></button>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", flex: 1 }}>Places</div>
        <button onClick={() => setAddOpen(true)} style={{ background: "#10B981", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Plus size={18} color="#fff" />
        </button>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F9FAFB", borderRadius: 99, padding: "10px 16px", border: "1px solid #F3F4F6" }}>
          <Search size={16} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..."
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#111827" }} />
        </div>
      </div>

      <div style={{ padding: "0 16px 10px", fontSize: 13, color: "#9CA3AF", fontWeight: 600 }}>
        {places.length} place{places.length !== 1 ? "s" : ""} saved
      </div>

      {/* Zomato-style 4-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: "4px 16px" }}>
        {filteredCats.map(cat => {
          const count = places.filter(p => p.category === cat.id).length;
          return (
            <div key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 2px" }}>
              <div style={{ width: "100%", aspectRatio: "1", borderRadius: 14, overflow: "hidden", marginBottom: 6, position: "relative", background: "#F3F4F6" }}>
                {cat.img
                  ? <img src={cat.img} alt={cat.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{cat.emoji}</div>
                }
                {count > 0 && (
                  <div style={{ position: "absolute", top: 4, right: 4, background: "#10B981", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "1px 5px", minWidth: 18, textAlign: "center" }}>{count}</div>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#111827", textAlign: "center", lineHeight: 1.3 }}>{cat.label}</div>
            </div>
          );
        })}
      </div>

      {addOpen && <AddSheet trips={trips} onClose={() => setAddOpen(false)} onSave={handleSave} />}
    </div>
  );
}