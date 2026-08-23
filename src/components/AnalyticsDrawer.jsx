import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, TrendingUp } from 'lucide-react';
import { getAnalytics } from '../utils/tlStorage';
import { signOut } from '../utils/auth';

const INR = n => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

const CATS = [
  { key: 'train',      label: 'Train',      icon: '🚂', color: '#6366F1' },
  { key: 'car',        label: 'Car / Cab',  icon: '🚗', color: '#F59E0B' },
  { key: 'flight',     label: 'Flight',     icon: '✈️',  color: '#0EA5E9' },
  { key: 'food',       label: 'Food',       icon: '🍽️',  color: '#EF4444' },
  { key: 'stay',       label: 'Stay',       icon: '🏨', color: '#10B981' },
  { key: 'activities', label: 'Activities', icon: '🎯', color: '#8B5CF6' },
];

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="tl-analytics-bar-track">
      <motion.div
        className="tl-analytics-bar-fill"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function AnalyticsDrawer({ open, onClose, onSignOut }) {
  const analytics = open ? getAnalytics() : null;
  const catMax    = analytics
    ? Math.max(...CATS.map(c => analytics.cats[c.key] || 0), 1)
    : 1;
  const stateMax   = analytics?.byState?.[0]?.total  || 1;
  const countryMax = analytics?.byCountry?.[0]?.total || 1;

  function handleSignOut() {
    signOut();
    onSignOut();
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="tl-analytics-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div
        className="tl-analytics-drawer"
        initial={{ x: '-100%' }}
        animate={{ x: open ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="tl-analytics-header">
          <div>
            <div className="tl-analytics-header-title">📊 Analytics</div>
            <div className="tl-analytics-header-sub">Your travel spending overview</div>
          </div>
          <button className="tl-analytics-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Grand Total */}
        {analytics && (
          <div className="tl-analytics-body">
            <div className="tl-analytics-grand">
              <TrendingUp size={20} color="#10B981" />
              <div>
                <div className="tl-analytics-grand-label">Grand Total Spent</div>
                <div className="tl-analytics-grand-val">{INR(analytics.grandTotal)}</div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="tl-analytics-section-title">By Category</div>
            {CATS.map(cat => {
              const val = analytics.cats[cat.key] || 0;
              if (val <= 0) return null;
              return (
                <div key={cat.key} className="tl-analytics-cat-row">
                  <span className="tl-analytics-cat-icon">{cat.icon}</span>
                  <div className="tl-analytics-cat-info">
                    <div className="tl-analytics-cat-label">{cat.label}</div>
                    <Bar value={val} max={catMax} color={cat.color} />
                  </div>
                  <span className="tl-analytics-cat-val">{INR(val)}</span>
                </div>
              );
            })}

            {/* By Indian State */}
            {analytics.byState.length > 0 && (
              <>
                <div className="tl-analytics-section-title" style={{ marginTop: 24 }}>🇮🇳 By State</div>
                {analytics.byState.map(s => (
                  <div key={s.state} className="tl-analytics-place-row">
                    <div>
                      <div className="tl-analytics-place-name">{s.state}</div>
                      <div className="tl-analytics-place-trips">{s.trips} trip{s.trips > 1 ? 's' : ''}</div>
                      <Bar value={s.total} max={stateMax} color="#10B981" />
                    </div>
                    <span className="tl-analytics-place-val">{INR(s.total)}</span>
                  </div>
                ))}
              </>
            )}

            {/* By Country */}
            {analytics.byCountry.length > 0 && (
              <>
                <div className="tl-analytics-section-title" style={{ marginTop: 24 }}>🌍 By Country</div>
                {analytics.byCountry.map(c => (
                  <div key={c.country} className="tl-analytics-place-row">
                    <div>
                      <div className="tl-analytics-place-name">{c.country}</div>
                      <div className="tl-analytics-place-trips">{c.trips} trip{c.trips > 1 ? 's' : ''}</div>
                      <Bar value={c.total} max={countryMax} color="#0EA5E9" />
                    </div>
                    <span className="tl-analytics-place-val">{INR(c.total)}</span>
                  </div>
                ))}
              </>
            )}

            {analytics.grandTotal === 0 && (
              <div className="tl-analytics-empty">
                No expenses logged yet.<br />Add trips and track your spend!
              </div>
            )}
          </div>
        )}

        {/* Sign Out */}
        <div className="tl-analytics-footer">
          <motion.button
            className="tl-analytics-signout"
            onClick={handleSignOut}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut size={16} />
            Sign Out
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
