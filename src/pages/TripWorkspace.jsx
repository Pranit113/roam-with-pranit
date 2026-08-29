import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Navigation, Plus, FileText, Download, Trash2, Camera, X
} from 'lucide-react';
import { getTrip, addHighlight, deleteHighlight, normalizeHighlight, uuid } from '../utils/storage';
import {
  getPolarSteps, addPolarStep, deletePolarStep,
} from '../utils/polarstepsStorage';
import PolarstepsRouteMap from '../components/PolarstepsRouteMap';
import PolarstepsItinerary from '../components/PolarstepsItinerary';
import PolarstepsStats     from '../components/PolarstepsStats';
import PolarstepsExpenses  from '../components/PolarstepsExpenses';
import PolarstepsBadges    from '../components/PolarstepsBadges';
import PolarstepsChecklist from '../components/PolarstepsChecklist';
import WeatherWidget       from '../components/WeatherWidget';
import AddStepModal        from '../components/AddStepModal';
import MustTryGuide        from '../components/MustTryGuide';
import HighlightGallery    from '../components/HighlightGallery';
import { exportPolarstepsPDF } from '../utils/polarstepsPdf';

const WORKSPACE_TABS = [
  { id: 'route',      label: '📍 Route & Journal',        icon: '📍' },
  { id: 'highlights', label: '📸 Highlights',              icon: '📸' },
  { id: 'itinerary',  label: '📅 Day Itinerary',           icon: '📅' },
  { id: 'musttry',    label: '🌟 Must-Try & Photo Spots',  icon: '🌟' },
  { id: 'stats',      label: '📊 Trip Stats',              icon: '📊' },
  { id: 'expenses',   label: '🧮 Expenses (Splitwise)',    icon: '🧮' },
  { id: 'badges',     label: '🏆 Stamps & Badges',         icon: '🏆' },
  { id: 'checklist',  label: '🎒 Packing List',            icon: '🎒' },
];

export default function TripWorkspace() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [trip,     setTrip]     = useState(null);
  const [steps,    setSteps]    = useState([]);
  const [activeTab, setActiveTab] = useState('route');
  const [activeStepId, setActiveStepId] = useState(null);
  const [addStepOpen, setAddStepOpen]   = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);

  // Highlights state
  const [galleryOpen,    setGalleryOpen]    = useState(false);
  const [galleryIdx,     setGalleryIdx]     = useState(0);
  const [hlTitle,        setHlTitle]        = useState('');
  const [hlCaption,      setHlCaption]      = useState('');
  const [hlPreviews,     setHlPreviews]     = useState([]); // [{id,url}]
  const [hlUploading,    setHlUploading]    = useState(false);
  const hlFileRef = useRef();

  function reload() {
    const t = getTrip(id) || { id, title: 'My Polarsteps Journey', destination: 'Exploration' };
    setTrip(t);
    const s = getPolarSteps(id);
    setSteps(s);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [id]);

  function handleSaveStep(stepData) {
    addPolarStep(id, stepData);
    reload();
  }

  function handleDeleteStep(stepId) {
    if (!confirm('Delete this travel step?')) return;
    deletePolarStep(id, stepId);
    reload();
  }

  function handleMapClick(coords) {
    setPickedCoords(coords);
    setAddStepOpen(true);
  }

  function handleConvertItinToStep(itinData) {
    addPolarStep(id, itinData);
    reload();
    setActiveTab('route');
  }

  // ── Highlights handlers ────────────────────────────────────────
  function handleHlFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setHlUploading(true);
    let done = 0;
    const loaded = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        loaded.push({ id: uuid(), url: ev.target.result });
        done++;
        if (done === files.length) {
          setHlPreviews(p => [...p, ...loaded]);
          setHlUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removeHlPreview(pid) { setHlPreviews(p => p.filter(x => x.id !== pid)); }

  function saveHighlight() {
    if (!hlPreviews.length) return;
    addHighlight(id, { title: hlTitle, caption: hlCaption, photos: hlPreviews });
    setHlPreviews([]); setHlTitle(''); setHlCaption('');
    reload();
  }

  function handleDeleteHighlight(hId) {
    deleteHighlight(id, hId);
    setGalleryOpen(false);
    reload();
  }

  if (!trip) return null;

  const totalKm = steps.reduce((sum, s) => sum + (s.distKm || 0), 0);
  const currentLoc = steps[steps.length - 1] || steps[0];
  const highlights = (trip.highlights || []).map(normalizeHighlight);

  return (
    <div className="ps-workspace-root">
      {/* Add Step Modal */}
      <AddStepModal
        open={addStepOpen}
        onClose={() => setAddStepOpen(false)}
        onSave={handleSaveStep}
        initialCoords={pickedCoords}
      />

      {/* Top Header Bar */}
      <header className="ps-header">
        <div className="ps-header-left">
          <button className="ps-icon-btn" onClick={() => navigate('/trips')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="ps-trip-title">{trip.title || trip.destination || 'My Journey'}</div>
            <div className="ps-trip-sub">
              <span>{trip.destination || 'Polarsteps Traveler'}</span>
              <span>·</span>
              <span className="ps-badge-km">+{totalKm.toLocaleString()} km</span>
            </div>
          </div>
        </div>

        <div className="ps-header-right">
          <motion.button
            className="ps-btn-pdf"
            onClick={() => exportPolarstepsPDF(trip, steps)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <FileText size={15} /> Export Book <Download size={13} />
          </motion.button>
          <motion.button
            className="ps-btn-primary"
            onClick={() => { setPickedCoords(null); setAddStepOpen(true); }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <Plus size={16} /> Record Step
          </motion.button>
        </div>
      </header>

      {/* Main Tab Navigation Bar */}
      <nav className="ps-workspace-tabs">
        {WORKSPACE_TABS.map(t => (
          <button
            key={t.id}
            className={`ps-workspace-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="ps-workspace-main">
        {/* Tab 1: Route & Journal */}
        {activeTab === 'route' && (
          <div className="ps-route-layout">
            <div className="ps-route-map-wrapper">
              <PolarstepsRouteMap
                steps={steps}
                activeStepId={activeStepId}
                onSelectStep={setActiveStepId}
                onMapClick={handleMapClick}
              />
            </div>

            {/* Sidebar Timeline & Story Log */}
            <aside className="ps-route-sidebar">
              {/* Weather Widget for latest stop */}
              {currentLoc && (
                <WeatherWidget
                  lat={currentLoc.lat}
                  lng={currentLoc.lng}
                  locationName={currentLoc.name}
                />
              )}

              <div className="ps-timeline-header">
                <span className="ps-section-title">Step Journal ({steps.length})</span>
                <button className="ps-btn-ghost-sm" onClick={() => setAddStepOpen(true)}>
                  + Add Stop
                </button>
              </div>

              {steps.length === 0 ? (
                <div className="ps-empty-timeline">
                  <Navigation size={32} color="var(--em)" />
                  <div className="ps-empty-title">No travel steps logged</div>
                  <div className="ps-empty-sub">Click anywhere on the map or press Record Step to start your journey!</div>
                </div>
              ) : (
                <div className="ps-timeline-list">
                  {steps.map(step => (
                    <motion.div
                      key={step.id}
                      className={`ps-step-card ${step.id === activeStepId ? 'active' : ''}`}
                      onClick={() => setActiveStepId(step.id)}
                      whileHover={{ x: 3 }}
                    >
                      <div className="ps-step-card-num">{step.stepNo}</div>
                      <div className="ps-step-card-content">
                        <div className="ps-step-card-title">{step.name}</div>
                        <div className="ps-step-card-meta">
                          <span>{step.date} · {step.time}</span>
                          {step.distKm > 0 && <span className="ps-step-dist">+${step.distKm} km</span>}
                        </div>
                        {step.notes && <p className="ps-step-notes">{step.notes}</p>}

                        {/* Photo thumbnails */}
                        {step.photos?.length > 0 && (
                          <div className="ps-step-photos">
                            {step.photos.map(p => (
                              <img key={p.id} src={p.url} alt="" className="ps-step-photo-thumb" />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        className="ps-icon-del"
                        onClick={e => { e.stopPropagation(); handleDeleteStep(step.id); }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Tab 2: Highlights */}
        {activeTab === 'highlights' && (
          <div className="ps-hl-tab">
            {/* Gallery overlay */}
            {galleryOpen && highlights.length > 0 && (
              <HighlightGallery
                highlights={highlights}
                startIndex={galleryIdx}
                onClose={() => setGalleryOpen(false)}
                onDelete={handleDeleteHighlight}
              />
            )}

            {/* Upload new highlight */}
            <div className="ps-card" style={{ marginBottom: 20 }}>
              <div className="ps-section-title"><Camera size={15} /> Add New Highlight Album</div>
              <input
                className="ps-input"
                placeholder="Album title (e.g. Sunset at Baga Beach)"
                value={hlTitle}
                onChange={e => setHlTitle(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <input
                className="ps-input"
                placeholder="Caption / memory note…"
                value={hlCaption}
                onChange={e => setHlCaption(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <input
                ref={hlFileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleHlFiles}
              />
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <motion.button
                  className="ps-btn-ghost-sm"
                  onClick={() => hlFileRef.current?.click()}
                  whileTap={{ scale: 0.96 }}
                  disabled={hlUploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Camera size={15} /> {hlUploading ? 'Loading…' : 'Select Photos'}
                </motion.button>
                {hlPreviews.length > 0 && (
                  <motion.button
                    className="ps-btn-primary"
                    onClick={saveHighlight}
                    whileTap={{ scale: 0.96 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    Save {hlPreviews.length} Photo{hlPreviews.length > 1 ? 's' : ''}
                  </motion.button>
                )}
              </div>
              {/* Preview grid */}
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

            {/* Saved highlights grid */}
            {highlights.length === 0 ? (
              <div className="ps-empty-timeline" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Camera size={40} color="var(--em)" style={{ margin: '0 auto 12px' }} />
                <div className="ps-empty-title">No highlights yet</div>
                <div className="ps-empty-sub">Upload photos above to create your first highlight album!</div>
              </div>
            ) : (
              <div className="ps-hl-saved-grid">
                {highlights.map((hl, idx) => {
                  const firstPhoto = hl.photos?.[0]?.url;
                  return (
                    <motion.div
                      key={hl.id}
                      className="ps-hl-card"
                      onClick={() => { setGalleryIdx(idx); setGalleryOpen(true); }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="ps-hl-card-img">
                        {firstPhoto
                          ? <img src={firstPhoto} alt={hl.title} />
                          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 36 }}>📸</div>
                        }
                        <div className="ps-hl-card-count">{hl.photos?.length || 0} 📷</div>
                      </div>
                      <div className="ps-hl-card-body">
                        <div className="ps-hl-card-title">{hl.title || 'Untitled Album'}</div>
                        {hl.caption && <div className="ps-hl-card-cap">{hl.caption}</div>}
                        <div className="ps-hl-card-date">{hl.createdAt ? new Date(hl.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Day-by-Day Itinerary */}
        {activeTab === 'itinerary' && (
          <PolarstepsItinerary
            tripId={id}
            onConvertToStep={handleConvertItinToStep}
          />
        )}

        {/* Tab 4: Must-Try Locations & Photo Spots */}
        {activeTab === 'musttry' && (
          <MustTryGuide
            destination={trip.destination}
            onAddToItinerary={handleSaveStep}
          />
        )}

        {/* Tab 5: Trip Stats */}
        {activeTab === 'stats' && (
          <PolarstepsStats steps={steps} />
        )}

        {/* Tab 6: Expenses & Splitwise */}
        {activeTab === 'expenses' && (
          <PolarstepsExpenses tripId={id} />
        )}

        {/* Tab 7: Passport Stamps & Badges */}
        {activeTab === 'badges' && (
          <PolarstepsBadges steps={steps} />
        )}

        {/* Tab 8: Packing List */}
        {activeTab === 'checklist' && (
          <PolarstepsChecklist tripId={id} />
        )}
      </main>
    </div>
  );
}

