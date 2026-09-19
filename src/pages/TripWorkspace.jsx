import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, FileText, Download, Trash2, Camera, X, MapPin, Navigation } from "lucide-react";
import { getTrip, addHighlight, deleteHighlight, normalizeHighlight, uuid } from "../utils/storage";
import { getPolarSteps, addPolarStep, deletePolarStep } from "../utils/polarstepsStorage";
import PolarstepsItinerary from "../components/PolarstepsItinerary";
import PolarstepsStats     from "../components/PolarstepsStats";
import PolarstepsExpenses  from "../components/PolarstepsExpenses";
import PolarstepsBadges    from "../components/PolarstepsBadges";
import PolarstepsChecklist from "../components/PolarstepsChecklist";
import HighlightGallery    from "../components/HighlightGallery";
import { exportPolarstepsPDF } from "../utils/polarstepsPdf";

const TABS = [
  { id: "journal",   label: "📍 Journal"    },
  { id: "highlights",label: "📸 Highlights" },
  { id: "itinerary", label: "📅 Itinerary"  },
  { id: "expenses",  label: "💰 Expenses"   },
  { id: "stats",     label: "📊 Stats"      },
  { id: "badges",    label: "🏆 Badges"     },
  { id: "checklist", label: "🎒 Packing"    },
];

/* Inline Add-Step form */
function AddStepInline({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0,5));
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [transport, setTransport] = useState("car");
  const fileRef = useRef();

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => setPhotos(p => [...p, { id: uuid(), url: ev.target.result }]);
      r.readAsDataURL(f);
    });
    e.target.value = "";
  }

  function save() {
    if (!name.trim()) return;
    onSave({ id: uuid(), stepNo: Date.now(), name: name.trim(), date, time, notes, transport, photos, distKm: 0 });
  }

  const inp = { width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff" };

  return (
    <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "14px", border: "1.5px solid #E5E7EB", marginBottom: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: "#111827", marginBottom: 10 }}>📍 Add Travel Stop</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Place name (e.g. Old Manali)" style={inp} />
        <div style={{ display: "flex", gap: 8 }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, flex: 1 }} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inp, flex: 1 }} />
        </div>
        <select value={transport} onChange={e => setTransport(e.target.value)} style={{ ...inp }}>
          <option value="car">🚗 Car</option>
          <option value="flight">✈️ Flight</option>
          <option value="train">🚆 Train</option>
          <option value="bus">🚌 Bus</option>
          <option value="hike">🥾 Hike</option>
          <option value="boat">⛵ Boat</option>
        </select>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes / memories..." rows={2}
          style={{ ...inp, resize: "none" }} />

        {/* Photo upload */}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
        <button onClick={() => fileRef.current?.click()}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1.5px dashed #D1D5DB", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#6B7280", cursor: "pointer", fontWeight: 600 }}>
          <Camera size={15} /> Add Photos
        </button>
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {photos.map(p => (
              <div key={p.id} style={{ position: "relative" }}>
                <img src={p.url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                <button onClick={() => setPhotos(arr => arr.filter(x => x.id !== p.id))}
                  style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={10} color="white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px", background: "#F3F4F6", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#6B7280" }}>
            Cancel
          </button>
          <button onClick={save} disabled={!name.trim()}
            style={{ flex: 2, padding: "10px", background: name.trim() ? "#10B981" : "#E5E7EB", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: name.trim() ? "pointer" : "not-allowed", color: name.trim() ? "#fff" : "#9CA3AF" }}>
            Save Stop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripWorkspace() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [trip, setTrip]       = useState(null);
  const [steps, setSteps]     = useState([]);
  const [activeTab, setActiveTab] = useState("journal");
  const [addStepOpen, setAddStepOpen] = useState(false);

  // Highlights
  const [galleryOpen, setGalleryOpen]   = useState(false);
  const [galleryIdx,  setGalleryIdx]    = useState(0);
  const [hlTitle,     setHlTitle]       = useState("");
  const [hlCaption,   setHlCaption]     = useState("");
  const [hlPreviews,  setHlPreviews]    = useState([]);
  const [hlUploading, setHlUploading]   = useState(false);
  const hlFileRef = useRef();

  function reload() {
    const t = getTrip(id) || { id, name: "My Journey", destination: "" };
    setTrip(t);
    setSteps(getPolarSteps(id));
  }
  useEffect(() => { reload(); }, [id]);

  function handleSaveStep(s) { addPolarStep(id, s); reload(); setAddStepOpen(false); }
  function handleDeleteStep(sid) { if (!confirm("Delete this stop?")) return; deletePolarStep(id, sid); reload(); }

  // Highlights handlers
  function handleHlFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setHlUploading(true);
    let done = 0;
    const loaded = [];
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => {
        loaded.push({ id: uuid(), url: ev.target.result });
        done++;
        if (done === files.length) { setHlPreviews(p => [...p, ...loaded]); setHlUploading(false); }
      };
      r.readAsDataURL(f);
    });
    e.target.value = "";
  }
  function removeHlPreview(pid) { setHlPreviews(p => p.filter(x => x.id !== pid)); }
  function saveHighlight() {
    if (!hlPreviews.length) return;
    addHighlight(id, { title: hlTitle, caption: hlCaption, photos: hlPreviews });
    setHlPreviews([]); setHlTitle(""); setHlCaption("");
    reload();
  }
  function handleDeleteHighlight(hId) { deleteHighlight(id, hId); setGalleryOpen(false); reload(); }

  if (!trip) return null;

  const highlights = (trip.highlights || []).map(normalizeHighlight);
  const inp = { width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 };

  return (
    <div className="ps-workspace-root">
      {/* Header */}
      <header className="ps-header">
        <div className="ps-header-left">
          <button className="ps-icon-btn" onClick={() => navigate("/trips")}><ArrowLeft size={18} /></button>
          <div>
            <div className="ps-trip-title">{trip.name || trip.destination || "My Journey"}</div>
            <div className="ps-trip-sub">
              <span>{trip.destination || "Traveler"}</span>
              <span>·</span>
              <span className="ps-badge-km">{steps.length} stop{steps.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
        <div className="ps-header-right">
          <motion.button className="ps-btn-pdf" onClick={() => exportPolarstepsPDF(trip, steps)} whileTap={{ scale: 0.97 }}>
            <FileText size={15} /> Export <Download size={13} />
          </motion.button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="ps-workspace-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`ps-workspace-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="ps-workspace-main">

        {/* ── Tab: Journal (no map) ── */}
        {activeTab === "journal" && (
          <div style={{ padding: "16px" }}>
            {/* Inline add step form or button */}
            {addStepOpen
              ? <AddStepInline onSave={handleSaveStep} onCancel={() => setAddStepOpen(false)} />
              : (
                <button onClick={() => setAddStepOpen(true)}
                  style={{ width: "100%", padding: "12px", background: "#10B981", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                  <Plus size={17} /> Add Travel Stop
                </button>
              )
            }

            {steps.length === 0 && !addStepOpen ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📍</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 6 }}>No stops yet</div>
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>Tap "+ Add Travel Stop" to log where you went.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {steps.map(step => (
                  <div key={step.id} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 14, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                        {step.stepNo || "·"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{step.name}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{step.date} · {step.time}</div>
                        {step.notes && <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{step.notes}</div>}
                        {step.photos?.length > 0 && (
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                            {step.photos.map(p => (
                              <img key={p.id} src={p.url} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8 }} />
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeleteStep(step.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D1D5DB", padding: 4, flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Highlights ── */}
        {activeTab === "highlights" && (
          <div className="ps-hl-tab">
            {galleryOpen && highlights.length > 0 && (
              <HighlightGallery highlights={highlights} startIndex={galleryIdx} onClose={() => setGalleryOpen(false)} onDelete={handleDeleteHighlight} />
            )}

            <div className="ps-card" style={{ marginBottom: 16 }}>
              <div className="ps-section-title"><Camera size={15} /> Add Photos</div>
              <input className="ps-input" placeholder="Album title (e.g. Sunset at Baga)" value={hlTitle} onChange={e => setHlTitle(e.target.value)} style={{ marginBottom: 8 }} />
              <input className="ps-input" placeholder="Caption / memory..." value={hlCaption} onChange={e => setHlCaption(e.target.value)} style={{ marginBottom: 12 }} />
              <input ref={hlFileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleHlFiles} />
              <div style={{ display: "flex", gap: 8, marginBottom: hlPreviews.length ? 10 : 0 }}>
                <button className="ps-btn-ghost-sm" onClick={() => hlFileRef.current?.click()} disabled={hlUploading}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Camera size={14} /> {hlUploading ? "Loading…" : "Select Photos"}
                </button>
                {hlPreviews.length > 0 && (
                  <button className="ps-btn-primary" onClick={saveHighlight} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    Save {hlPreviews.length} Photo{hlPreviews.length > 1 ? "s" : ""}
                  </button>
                )}
              </div>
              {hlPreviews.length > 0 && (
                <div className="ps-hl-preview-grid">
                  {hlPreviews.map(p => (
                    <div key={p.id} className="ps-hl-preview-thumb">
                      <img src={p.url} alt="" />
                      <button onClick={() => removeHlPreview(p.id)} className="ps-hl-preview-del"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {highlights.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Camera size={40} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
                <div className="ps-empty-title">No highlights yet</div>
                <div className="ps-empty-sub">Select photos above to create your first album!</div>
              </div>
            ) : (
              <div className="ps-hl-saved-grid">
                {highlights.map((hl, idx) => (
                  <motion.div key={hl.id} className="ps-hl-card"
                    onClick={() => { setGalleryIdx(idx); setGalleryOpen(true); }}
                    whileTap={{ scale: 0.97 }}>
                    <div className="ps-hl-card-img">
                      {hl.photos?.[0]?.url
                        ? <img src={hl.photos[0].url} alt={hl.title} />
                        : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 32 }}>📸</div>
                      }
                      <div className="ps-hl-card-count">{hl.photos?.length || 0} 📷</div>
                    </div>
                    <div className="ps-hl-card-body">
                      <div className="ps-hl-card-title">{hl.title || "Album"}</div>
                      {hl.caption && <div className="ps-hl-card-cap">{hl.caption}</div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Itinerary (inline, no tab switch) ── */}
        {activeTab === "itinerary" && (
          <PolarstepsItinerary tripId={id} onConvertToStep={s => { addPolarStep(id, s); reload(); }} />
        )}

        {/* ── Tab: Expenses (no splitwise) ── */}
        {activeTab === "expenses" && <PolarstepsExpenses tripId={id} />}

        {/* ── Tab: Stats ── */}
        {activeTab === "stats" && <PolarstepsStats steps={steps} />}

        {/* ── Tab: Badges ── */}
        {activeTab === "badges" && <PolarstepsBadges steps={steps} />}

        {/* ── Tab: Packing ── */}
        {activeTab === "checklist" && <PolarstepsChecklist tripId={id} />}

      </main>
    </div>
  );
}