import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getTransactions, deleteTransaction, getTrips } from '../utils/storage';

const CAT_ICONS = {
  activity: '🎯', food: '🍽️', stay: '🏨', transport: '🚗',
  flight: '✈️', train: '🚂', shopping: '🛍️', other: '💳',
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtMonth(d) {
  if (!d) return 'Unknown';
  return new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function Transactions() {
  const navigate  = useNavigate();
  const [txs,      setTxs]      = useState([]);
  const [trips,    setTrips]    = useState([]);
  const [tripFilter, setTripFilter] = useState('all');

  function reload() {
    setTxs(getTransactions());
    setTrips(getTrips());
  }

  useEffect(() => { reload(); }, []);

  // Also include trip-level expenses
  const tripExpenses = trips.flatMap(t =>
    (t.expenses || []).map(e => ({
      id: e.id,
      tripId: t.id,
      tripName: t.name || t.destination || 'Trip',
      label: e.label || e.category || 'Expense',
      amount: Number(e.amount || 0),
      category: e.category || 'other',
      date: e.date || t.startDate,
      source: 'trip',
      activityId: null,
    }))
  );

  // Merge itinerary transactions + trip expenses (deduplicated by id)
  const allTxIds = new Set(txs.map(t => t.id));
  const merged = [
    ...txs,
    ...tripExpenses.filter(e => !allTxIds.has(e.id)),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const filtered = tripFilter === 'all' ? merged : merged.filter(t => t.tripId === tripFilter);

  // Group by month
  const byMonth = {};
  filtered.forEach(tx => {
    const key = fmtMonth(tx.date);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(tx);
  });

  const totalSpent = filtered.reduce((s, t) => s + t.amount, 0);

  function handleDelete(tx) {
    if (!confirm('Remove this transaction?')) return;
    deleteTransaction(tx.id);
    reload();
  }

  return (
    <div className="page" style={{ background: '#F8FAFC' }}>
      {/* Top bar */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#0F172A' }}>
            <ArrowLeft size={22} />
          </button>
          <span className="top-bar-logo">Transactions</span>
        </div>
      </div>

      <div style={{ padding: '76px 16px 100px' }}>
        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg,#10B981,#0EA5E9)', borderRadius: 20, padding: '20px 24px', marginBottom: 20, color: '#fff' }}
        >
          <div style={{ fontSize: 13, opacity: .85, fontWeight: 600, marginBottom: 4 }}>Total Spent</div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em' }}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, opacity: .75, marginTop: 4 }}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</div>
        </motion.div>

        {/* Trip filter chips */}
        {trips.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
            <button
              onClick={() => setTripFilter('all')}
              style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 99, border: '1.5px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: tripFilter === 'all' ? 'var(--em)' : '#fff', color: tripFilter === 'all' ? '#fff' : 'var(--em)', borderColor: 'var(--em)' }}
            >All Trips</button>
            {trips.map(t => (
              <button key={t.id} onClick={() => setTripFilter(t.id)}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 99, border: '1.5px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: tripFilter === t.id ? 'var(--em)' : '#fff', color: tripFilter === t.id ? '#fff' : 'var(--em)', borderColor: 'var(--em)', whiteSpace: 'nowrap' }}
              >{t.emoji || '✈️'} {t.name}</button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No transactions yet</div>
            <div style={{ color: '#94A3B8', fontSize: 14 }}>Add activities with a cost in your trip itinerary to see them here.</div>
          </div>
        )}

        {/* Grouped by month */}
        {Object.entries(byMonth).map(([month, items]) => (
          <div key={month} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, paddingLeft: 4 }}>
              {month} · ₹{items.reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#ECFDF5,#E0F2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {CAT_ICONS[tx.category] || '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span>{tx.tripName}</span>
                      {tx.date && <span>· {fmtDate(tx.date)}</span>}
                      {tx.source === 'itinerary' && <span style={{ color: 'var(--em)', fontWeight: 700 }}>· From Itinerary</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>₹{tx.amount.toLocaleString('en-IN')}</div>
                    {tx.source !== 'itinerary' && (
                      <button onClick={() => handleDelete(tx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
