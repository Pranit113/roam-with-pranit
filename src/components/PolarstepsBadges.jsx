import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { getPassportBadges } from '../utils/polarstepsStorage';

export default function PolarstepsBadges({ steps = [] }) {
  const badges = getPassportBadges(steps);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="ps-badges-root">
      <div className="ps-card ps-badges-header">
        <div className="ps-badges-title-wrap">
          <Award size={24} color="var(--em)" />
          <div>
            <div className="ps-card-title">Digital Passport & Travel Badges</div>
            <div className="ps-card-sub">{unlockedCount} of {badges.length} achievements unlocked</div>
          </div>
        </div>
        <div className="ps-badges-progress-bar">
          <div className="ps-badges-progress-fill" style={{ width: `${(unlockedCount / badges.length) * 100}%` }} />
        </div>
      </div>

      <div className="ps-badges-grid">
        {badges.map((b, i) => (
          <motion.div
            key={b.id}
            className={`ps-badge-card ${b.unlocked ? 'unlocked' : 'locked'}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="ps-badge-icon">
              <span className="ps-badge-emoji">{b.emoji}</span>
              {!b.unlocked && <Lock size={12} className="ps-badge-lock" />}
              {b.unlocked && <CheckCircle2 size={14} className="ps-badge-check" />}
            </div>
            <div className="ps-badge-name">{b.title}</div>
            <div className="ps-badge-desc">{b.desc}</div>
            <div className="ps-badge-pill">{b.progress}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
