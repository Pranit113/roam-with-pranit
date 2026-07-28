import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';

export default function TripCard({ trip, index = 0 }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const daysLeft = Math.ceil((new Date(trip.startDate) - new Date()) / (1000*60*60*24));
  const isUpcoming = daysLeft > 0;
  const isPast = !isUpcoming;

  return (
    <motion.div
      className="card-hover shine"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      onClick={() => navigate(`/trip/${trip.id}`)}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        position: 'relative',
      }}
    >
      {/* Cover image */}
      <div style={{ position: 'relative', height: 180 }}>
        <img
          src={imgError ? `https://picsum.photos/seed/${trip.id}/800/400` : trip.cover}
          alt={trip.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
        }} />

        {/* Status badge */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span style={{
            padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: isUpcoming ? '#10B981' : '#6B7280',
            color: 'white', letterSpacing: '0.04em',
          }}>
            {isUpcoming ? `${daysLeft}d away` : 'Completed'}
          </span>
        </div>

        {/* Trip name on image */}
        <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{trip.emoji} {trip.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{trip.subtitle}</div>
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280' }}>
            <Calendar size={14} color="#10B981" />
            {new Date(trip.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} –{' '}
            {new Date(trip.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280' }}>
            <MapPin size={14} color="#0EA5E9" />
            {trip.flag} {trip.country}
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {trip.tags.map(tag => (
            <span key={tag} className="tag tag-emerald">{tag}</span>
          ))}
        </div>

        {/* Budget bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: '#9CA3AF', fontWeight: 500 }}>Budget</span>
            <span style={{ fontWeight: 700, color: '#1F2937' }}>
              {trip.budget.currency}{trip.budget.spent.toLocaleString()} / {trip.budget.currency}{trip.budget.total.toLocaleString()}
            </span>
          </div>
          <div className="budget-bar-track">
            <div className="budget-bar-fill" style={{ width: `${Math.min(100, (trip.budget.spent / trip.budget.total) * 100)}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
