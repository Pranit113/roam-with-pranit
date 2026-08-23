import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { getPolarItinerary, savePolarItinerary, formatCurrency } from '../utils/polarstepsStorage';
import PlaceAutocompleteInput from './PlaceAutocompleteInput';
import { uuid } from '../utils/storage';

const TIME_SLOTS = [
  { key: 'morning',   label: 'Morning 🌅',   icon: '🌅', time: '09:00' },
  { key: 'afternoon', label: 'Afternoon ☀️', icon: '☀️', time: '13:00' },
  { key: 'evening',   label: 'Evening 🌆',   icon: '🌆', time: '17:30' },
  { key: 'night',     label: 'Night 🌙',     icon: '🌙', time: '21:00' },
];

export default function PolarstepsItinerary({ tripId, onConvertToStep }) {
  const [days, setDays]       = useState(() => getPolarItinerary(tripId));
  const [activeDayId, setActiveDayId] = useState(days[0]?.id || null);

  // Form state for adding activity
  const [actName, setActName] = useState('');
  const [actSlot, setActSlot] = useState('morning');
  const [actTime, setActTime] = useState('09:00');
  const [actCost, setActCost] = useState('');
  const [actLoc, setActLoc]   = useState('');
  const [actCoords, setActCoords] = useState(null);

  function updateDays(newDays) {
    setDays(newDays);
    savePolarItinerary(tripId, newDays);
  }

  function addDay() {
    const nextNum = days.length + 1;
    const newDay = {
      id: uuid(),
      dayNum: nextNum,
      date: new Date().toISOString().split('T')[0],
      title: `Day ${nextNum} — Exploration`,
      timeSlots: { morning: [], afternoon: [], evening: [], night: [] },
    };
    const updated = [...days, newDay];
    updateDays(updated);
    setActiveDayId(newDay.id);
  }

  function deleteDay(dayId) {
    if (days.length <= 1) return;
    const updated = days.filter(d => d.id !== dayId).map((d, idx) => ({ ...d, dayNum: idx + 1 }));
    updateDays(updated);
    if (activeDayId === dayId) setActiveDayId(updated[0].id);
  }

  function addActivity(e) {
    e.preventDefault();
    if (!actName.trim()) return;

    const activity = {
      id: uuid(),
      name: actName.trim(),
      time: actTime,
      cost: Number(actCost) || 0,
      loc: actLoc,
      lat: actCoords?.lat || null,
      lng: actCoords?.lng || null,
    };

    const updated = days.map(d => {
      if (d.id !== activeDayId) return d;
      return {
        ...d,
        timeSlots: {
          ...d.timeSlots,
          [actSlot]: [...(d.timeSlots[actSlot] || []), activity],
        },
      };
    });

    updateDays(updated);
    setActName('');
    setActCost('');
    setActLoc('');
    setActCoords(null);
  }

  function deleteActivity(slotKey, actId) {
    const updated = days.map(d => {
      if (d.id !== activeDayId) return d;
      return {
        ...d,
        timeSlots: {
          ...d.timeSlots,
          [slotKey]: d.timeSlots[slotKey].filter(a => a.id !== actId),
        },
      };
    });
    updateDays(updated);
  }

  const activeDay = days.find(d => d.id === activeDayId) || days[0];

  return (
    <div className="ps-itin-root">
      {/* Day Tabs */}
      <div className="ps-itin-days-bar">
        <div className="ps-itin-days-scroll">
          {days.map(d => (
            <button
              key={d.id}
              className={`ps-itin-day-tab ${activeDayId === d.id ? 'active' : ''}`}
              onClick={() => setActiveDayId(d.id)}
            >
              Day {d.dayNum}
            </button>
          ))}
          <button className="ps-itin-add-day-btn" onClick={addDay}>
            <Plus size={14} /> Add Day
          </button>
        </div>
      </div>

      {activeDay && (
        <div className="ps-itin-body">
          {/* Day Header */}
          <div className="ps-card ps-itin-header-card">
            <div>
              <div className="ps-itin-day-title">{activeDay.title}</div>
              <div className="ps-itin-day-date">{activeDay.date}</div>
            </div>
            {days.length > 1 && (
              <button className="ps-icon-del" onClick={() => deleteDay(activeDay.id)}>
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Add Activity Form */}
          <form className="ps-card ps-itin-add-form" onSubmit={addActivity}>
            <div className="ps-section-title"><Plus size={15} /> Add Activity to Day {activeDay.dayNum}</div>
            <div className="ps-form-grid">
              <input
                className="ps-input"
                placeholder="Activity name (e.g. Scuba diving, Museum visit)"
                value={actName}
                onChange={e => setActName(e.target.value)}
              />
              <div className="ps-form-row" style={{ margin: 0 }}>
                <select className="ps-input" value={actSlot} onChange={e => {
                  setActSlot(e.target.value);
                  setActTime(TIME_SLOTS.find(s => s.key === e.target.value)?.time || '09:00');
                }}>
                  {TIME_SLOTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <input className="ps-input" type="time" value={actTime} onChange={e => setActTime(e.target.value)} />
              </div>
              <PlaceAutocompleteInput
                value={actLoc}
                onChange={setActLoc}
                onSelectPlace={p => { if (p) setActCoords({ lat: p.lat, lng: p.lng }); }}
                placeholder="Location / Spot name…"
              />
              <div className="ps-form-row" style={{ margin: 0 }}>
                <input
                  className="ps-input"
                  type="number"
                  placeholder="Est. Cost (₹)"
                  value={actCost}
                  onChange={e => setActCost(e.target.value)}
                />
                <motion.button className="ps-btn-primary" type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  Add Activity
                </motion.button>
              </div>
            </div>
          </form>

          {/* Time Slot Cards */}
          <div className="ps-itin-slots-grid">
            {TIME_SLOTS.map(slot => {
              const items = activeDay.timeSlots[slot.key] || [];
              return (
                <div key={slot.key} className="ps-card ps-itin-slot-card">
                  <div className="ps-itin-slot-title">{slot.label}</div>
                  {items.length === 0 ? (
                    <div className="ps-empty-hint">No activities planned</div>
                  ) : (
                    items.map(item => (
                      <div key={item.id} className="ps-itin-item-row">
                        <div className="ps-itin-item-info">
                          <div className="ps-itin-item-name">{item.name}</div>
                          <div className="ps-itin-item-sub">
                            <span>{item.time}</span>
                            {item.loc && <span> · 📍 {item.loc}</span>}
                            {item.cost > 0 && <span className="ps-itin-item-cost"> · {formatCurrency(item.cost)}</span>}
                          </div>
                        </div>

                        <div className="ps-itin-item-actions">
                          {/* 1-click convert to Polarsteps Travel Step */}
                          <button
                            className="ps-btn-convert"
                            title="Convert activity to active travel step pin"
                            onClick={() => onConvertToStep?.({
                              name: item.loc || item.name,
                              lat: item.lat || 20.5937,
                              lng: item.lng || 78.9629,
                              date: activeDay.date,
                              time: item.time,
                              notes: `Planned activity: ${item.name}`,
                              cost: item.cost,
                            })}
                          >
                            <ArrowUpRight size={13} /> Step
                          </button>

                          <button className="ps-icon-del" onClick={() => deleteActivity(slot.key, item.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
