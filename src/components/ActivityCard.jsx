import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Hotel, Utensils, Waves, ShoppingBag, Music, Droplets, Car, Sunrise, Anchor, MapPin, ChevronDown, ChevronUp, DollarSign, Camera, StickyNote
} from 'lucide-react';

const ICONS = {
  plane: Plane, hotel: Hotel, utensils: Utensils, waves: Waves,
  'shopping-bag': ShoppingBag, music: Music, droplets: Droplets,
  car: Car, sunrise: Sunrise, anchor: Anchor,
};

const TYPE_COLORS = {
  travel: { bg: '#EEF2FF', color: '#4F46E5' },
  hotel: { bg: '#F3E8FF', color: '#7C3AED' },
  food: { bg: '#FEF9C3', color: '#B45309' },
  explore: { bg: '#D1FAE5', color: '#065F46' },
  shopping: { bg: '#FFF7ED', color: '#C2410C' },
  experience: { bg: '#FCE7F3', color: '#9D174D' },
};

export default function ActivityCard({ activity, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICONS[activity.icon] || MapPin;
  const colors = TYPE_COLORS[activity.type] || TYPE_COLORS.explore;

  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {/* Connector line */}
      {!isLast && (
        <div style={{
          position: 'absolute', left: 19, top: 44, width: 2, bottom: -16,
          background: 'linear-gradient(to bottom, #10B981, #0EA5E9)',
          borderRadius: 999, opacity: 0.3,
        }} />
      )}

      {/* Icon bubble */}
      <div style={{
        width: 40, height: 40, borderRadius: 14, flexShrink: 0,
        background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 2px 8px ${colors.color}30`,
      }}>
        <Icon size={18} color={colors.color} />
      </div>

      {/* Card */}
      <motion.div
        layout
        style={{
          flex: 1, background: 'white', borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 12,
        }}
      >
        {/* Header */}
        <div
          style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          onClick={() => setExpanded(e => !e)}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 2 }}>{activity.time}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1F2937' }}>{activity.title}</div>
            <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <MapPin size={11} /> {activity.place}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activity.cost > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                ₹{activity.cost.toLocaleString()}
              </span>
            )}
            {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
          </div>
        </div>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 16px 14px', borderTop: '1px solid #F3F4F6' }}>
                {activity.note && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
                    <StickyNote size={14} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{activity.note}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  {activity.photos > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9CA3AF' }}>
                      <Camera size={13} /> {activity.photos} photos
                    </div>
                  )}
                  {activity.cost > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669' }}>
                      <DollarSign size={13} /> ₹{activity.cost.toLocaleString()} spent
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
