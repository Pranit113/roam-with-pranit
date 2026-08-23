import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, Calendar, Camera, Award, Compass } from 'lucide-react';

export default function PolarstepsStats({ steps = [] }) {
  const totalKm = steps.reduce((sum, s) => sum + (s.distKm || 0), 0);
  const totalPhotos = steps.reduce((sum, s) => sum + (s.photos?.length || 0), 0);

  // Calculate days active
  let daysActive = 1;
  if (steps.length > 1) {
    const dates = steps.map(s => new Date(s.date).getTime()).filter(t => !isNaN(t));
    if (dates.length > 1) {
      const diff = Math.max(...dates) - Math.min(...dates);
      daysActive = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    }
  }

  // Transport distribution
  const modeCounts = { flight: 0, train: 0, car: 0, boat: 0, hike: 0, bus: 0 };
  steps.forEach(s => {
    if (s.transportMode && modeCounts[s.transportMode] !== undefined) {
      modeCounts[s.transportMode]++;
    }
  });

  const MODE_EMOJIS = { flight: '✈️', train: '🚆', car: '🚗', boat: '⛵', hike: '🥾', bus: '🚌' };

  return (
    <div className="ps-stats-root">
      {/* 4 Primary Stats Cards */}
      <div className="ps-stats-grid">
        <motion.div className="ps-card ps-stat-card" whileHover={{ y: -2 }}>
          <div className="ps-stat-icon-wrap"><Navigation size={22} color="#10B981" /></div>
          <div className="ps-stat-value">{totalKm.toLocaleString()} <small>km</small></div>
          <div className="ps-stat-label">Total Distance Traveled</div>
        </motion.div>

        <motion.div className="ps-card ps-stat-card" whileHover={{ y: -2 }}>
          <div className="ps-stat-icon-wrap"><Compass size={22} color="#0EA5E9" /></div>
          <div className="ps-stat-value">{steps.length} <small>steps</small></div>
          <div className="ps-stat-label">Logged Travel Stops</div>
        </motion.div>

        <motion.div className="ps-card ps-stat-card" whileHover={{ y: -2 }}>
          <div className="ps-stat-icon-wrap"><Calendar size={22} color="#8B5CF6" /></div>
          <div className="ps-stat-value">{daysActive} <small>days</small></div>
          <div className="ps-stat-label">Travel Duration</div>
        </motion.div>

        <motion.div className="ps-card ps-stat-card" whileHover={{ y: -2 }}>
          <div className="ps-stat-icon-wrap"><Camera size={22} color="#F59E0B" /></div>
          <div className="ps-stat-value">{totalPhotos} <small>photos</small></div>
          <div className="ps-stat-label">Captured Memories</div>
        </motion.div>
      </div>

      {/* Transport Mode Distribution */}
      <div className="ps-card ps-mode-card">
        <div className="ps-section-title"><Award size={16} /> Transport Mode Breakdown</div>
        <div className="ps-mode-bars">
          {Object.entries(modeCounts).map(([mode, count]) => {
            const pct = steps.length ? Math.round((count / steps.length) * 100) : 0;
            return (
              <div key={mode} className="ps-mode-row">
                <div className="ps-mode-label">
                  <span>{MODE_EMOJIS[mode]}</span>
                  <span className="ps-mode-name">{mode}</span>
                </div>
                <div className="ps-mode-track">
                  <div className="ps-mode-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="ps-mode-pct">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
