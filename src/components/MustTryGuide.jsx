import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Sparkles, Plus, Camera, Utensils, Hotel, Compass, Check } from 'lucide-react';
import { MUST_TRY_SPOTS } from '../utils/mustTryData';

const CATEGORY_TABS = [
  { id: 'all',   label: '🔥 All Must-Try', icon: Sparkles },
  { id: 'photo', label: '📸 Best Photo Spots', icon: Camera },
  { id: 'food',  label: '🍽️ Famous Food', icon: Utensils },
  { id: 'hotel', label: '🏨 Top Hotels', icon: Hotel },
  { id: 'sight', label: '📍 Must Visit Sights', icon: Compass },
];

export default function MustTryGuide({ destination, onAddToItinerary }) {
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds]       = useState([]);

  const filteredSpots = MUST_TRY_SPOTS.filter(spot => {
    const matchesCat = selectedCat === 'all' || spot.category === selectedCat;
    const matchesSearch = !searchQuery.trim() ||
      spot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDest = !destination || spot.destination.toLowerCase().includes(destination.toLowerCase());
    return matchesCat && matchesSearch && matchesDest;
  });

  function handleAdd(spot) {
    if (addedIds.includes(spot.id)) return;
    setAddedIds(prev => [...prev, spot.id]);
    if (onAddToItinerary) {
      onAddToItinerary({
        name: spot.title,
        lat: spot.lat,
        lng: spot.lng,
        notes: `${spot.subtitle}. Tip: ${spot.tips}`,
        cost: spot.cost,
        category: spot.category === 'photo' ? 'viewpoint' : spot.category === 'food' ? 'food' : spot.category === 'hotel' ? 'hotel' : 'activity',
      });
    }
  }

  return (
    <div className="mt-guide-root">
      {/* Header Banner */}
      <div className="mt-guide-banner">
        <div className="mt-banner-content">
          <div className="mt-banner-badge"><Sparkles size={14} /> Curated Travel Guide</div>
          <div className="mt-banner-title">Must-Try Locations & Best Photo Spots</div>
          <div className="mt-banner-sub">Handpicked viewpoints, famous eateries, top stays & Instagram photo angles</div>
        </div>
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="mt-filter-bar">
        <div className="mt-search-wrap">
          <Search size={15} color="var(--t3)" />
          <input
            className="mt-search-input"
            placeholder="Search photo spots, restaurants, hotels…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-cat-tabs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              className={`mt-cat-tab ${selectedCat === tab.id ? 'active' : ''}`}
              onClick={() => setSelectedCat(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spot Grid */}
      {filteredSpots.length === 0 ? (
        <div className="mt-empty-card">
          <Camera size={36} color="var(--t3)" />
          <div className="mt-empty-title">No spots match your search</div>
          <div className="mt-empty-sub">Try switching category tabs or clearing your search term.</div>
        </div>
      ) : (
        <div className="mt-spot-grid">
          {filteredSpots.map((spot, i) => {
            const isAdded = addedIds.includes(spot.id);

            return (
              <motion.div
                key={spot.id}
                className="mt-spot-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.14)' }}
              >
                {/* Cover Image & Badges */}
                <div className="mt-card-media">
                  <img src={spot.photoUrl} alt={spot.title} className="mt-card-img" />
                  <div className="mt-card-overlay" />
                  <div className="mt-card-badge-top">{spot.typeBadge}</div>
                  <div className="mt-card-rating">
                    <Star size={12} fill="#F59E0B" color="#F59E0B" />
                    <span>{spot.rating}</span>
                    <small>({spot.reviewsCount})</small>
                  </div>
                </div>

                {/* Body Content */}
                <div className="mt-card-body">
                  <div className="mt-card-dest"><MapPin size={12} color="var(--em)" /> {spot.destination} · {spot.tag}</div>
                  <div className="mt-card-title">{spot.title}</div>
                  <div className="mt-card-sub">{spot.subtitle}</div>

                  {/* Camera / Insider Tips */}
                  <div className="mt-card-tip">
                    <span className="mt-tip-icon">💡</span>
                    <span>{spot.tips}</span>
                  </div>

                  {/* Footer Action & Cost */}
                  <div className="mt-card-footer">
                    <div className="mt-card-cost">{spot.cost}</div>
                    <motion.button
                      className={`mt-btn-add ${isAdded ? 'added' : ''}`}
                      onClick={() => handleAdd(spot)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    >
                      {isAdded ? <><Check size={14} /> Added to Trip</> : <><Plus size={14} /> Add to Itinerary</>}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
