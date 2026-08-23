import { userKey } from './auth';
import { uuid } from './storage';

function readKey(key, fallback) {
  const k = userKey(key);
  if (!k) return fallback;
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
}

function writeKey(key, val) {
  const k = userKey(key);
  if (k) localStorage.setItem(k, JSON.stringify(val));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Haversine Distance Math (Kilometers)
   ───────────────────────────────────────────────────────────────────────────── */
export function calcHaversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Currency Exchange Rates (Base: INR = 1)
   ───────────────────────────────────────────────────────────────────────────── */
export const CURRENCIES = {
  INR: { symbol: '₹', rate: 1,      name: 'Indian Rupee' },
  USD: { symbol: '$', rate: 0.012,  name: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.011,  name: 'Euro' },
  GBP: { symbol: '£', rate: 0.0095, name: 'British Pound' },
  JPY: { symbol: '¥', rate: 1.85,   name: 'Japanese Yen' },
  THB: { symbol: '฿', rate: 0.42,   name: 'Thai Baht' },
};

export function convertCurrency(amount, fromCurr = 'INR', toCurr = 'INR') {
  const val = Number(amount) || 0;
  if (fromCurr === toCurr) return val;
  const inINR = val / (CURRENCIES[fromCurr]?.rate || 1);
  return inINR * (CURRENCIES[toCurr]?.rate || 1);
}

export function formatCurrency(amount, curr = 'INR') {
  const symbol = CURRENCIES[curr]?.symbol || '₹';
  const val = Number(amount) || 0;
  return `${symbol}${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Polarsteps Step CRUD
   Each step: { id, tripId, stepNo, name, lat, lng, date, time, notes, photos: [], transportMode, cost, weather }
   ───────────────────────────────────────────────────────────────────────────── */
export function getPolarSteps(tripId) {
  return readKey(`ps_steps_${tripId}`, []);
}

export function savePolarSteps(tripId, steps) {
  writeKey(`ps_steps_${tripId}`, steps);
}

export function addPolarStep(tripId, stepData) {
  const all = getPolarSteps(tripId);
  const prevStep = all[all.length - 1];

  let stepKm = 0;
  if (prevStep && prevStep.lat != null && stepData.lat != null) {
    stepKm = calcHaversineKm(prevStep.lat, prevStep.lng, stepData.lat, stepData.lng);
  }

  const newStep = {
    id: uuid(),
    tripId,
    stepNo: all.length + 1,
    name: stepData.name || 'Travel Stop',
    lat: Number(stepData.lat) || 20.5937,
    lng: Number(stepData.lng) || 78.9629,
    date: stepData.date || new Date().toISOString().split('T')[0],
    time: stepData.time || '12:00',
    notes: stepData.notes || '',
    photos: stepData.photos || [],
    transportMode: stepData.transportMode || 'flight', // 'flight' | 'train' | 'car' | 'boat' | 'hike' | 'bus'
    cost: Number(stepData.cost) || 0,
    distKm: stepKm,
    weather: stepData.weather || null,
    createdAt: new Date().toISOString(),
  };

  all.push(newStep);
  // Re-index step numbers
  all.forEach((s, idx) => { s.stepNo = idx + 1; });
  savePolarSteps(tripId, all);
  return newStep;
}

export function updatePolarStep(tripId, stepId, updates) {
  const all = getPolarSteps(tripId);
  const idx = all.findIndex(s => s.id === stepId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates };

  // Recalculate distances for all steps in order
  for (let i = 0; i < all.length; i++) {
    if (i === 0) {
      all[i].distKm = 0;
    } else {
      all[i].distKm = calcHaversineKm(all[i - 1].lat, all[i - 1].lng, all[i].lat, all[i].lng);
    }
  }
  savePolarSteps(tripId, all);
  return all[idx];
}

export function deletePolarStep(tripId, stepId) {
  const all = getPolarSteps(tripId).filter(s => s.id !== stepId);
  all.forEach((s, idx) => { s.stepNo = idx + 1; });
  for (let i = 0; i < all.length; i++) {
    if (i === 0) all[i].distKm = 0;
    else all[i].distKm = calcHaversineKm(all[i - 1].lat, all[i - 1].lng, all[i].lat, all[i].lng);
  }
  savePolarSteps(tripId, all);
  return all;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Polarsteps Itinerary CRUD (Day-by-Day)
   Each day: { id, dayNum, date, title, timeSlots: { morning: [], afternoon: [], evening: [], night: [] } }
   ───────────────────────────────────────────────────────────────────────────── */
export function getPolarItinerary(tripId) {
  const fallback = [
    {
      id: uuid(), dayNum: 1, date: new Date().toISOString().split('T')[0], title: 'Day 1 — Arrival & Exploration',
      timeSlots: {
        morning: [{ id: uuid(), name: 'Check-in to Hotel & Breakfast', cost: 1200, time: '09:00', loc: '' }],
        afternoon: [{ id: uuid(), name: 'Sightseeing & Local Food Tour', cost: 800, time: '13:30', loc: '' }],
        evening: [{ id: uuid(), name: 'Sunset Viewpoint & Dinner', cost: 1500, time: '18:00', loc: '' }],
        night: [],
      },
    },
  ];
  return readKey(`ps_itin_${tripId}`, fallback);
}

export function savePolarItinerary(tripId, itin) {
  writeKey(`ps_itin_${tripId}`, itin);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Group Expense Splitter ("Splitwise" style)
   ───────────────────────────────────────────────────────────────────────────── */
export function getPolarExpenses(tripId) {
  const fallback = {
    currency: 'INR',
    members: ['Me', 'Alex', 'Sam'],
    expenses: [
      { id: uuid(), description: 'Hotel Booking', amount: 6000, paidBy: 'Me', splitAmong: ['Me', 'Alex', 'Sam'], date: new Date().toISOString().split('T')[0] },
      { id: uuid(), description: 'Rental Car Fuel', amount: 1500, paidBy: 'Alex', splitAmong: ['Me', 'Alex', 'Sam'], date: new Date().toISOString().split('T')[0] },
    ],
  };
  return readKey(`ps_expenses_${tripId}`, fallback);
}

export function savePolarExpenses(tripId, expData) {
  writeKey(`ps_expenses_${tripId}`, expData);
}

export function calcBalances(expData) {
  const members = expData.members || ['Me'];
  const balances = {};
  members.forEach(m => { balances[m] = 0; });

  (expData.expenses || []).forEach(e => {
    const amt = Number(e.amount) || 0;
    const payer = e.paidBy;
    const splitters = e.splitAmong || members;
    if (!splitters.length) return;

    const perPerson = amt / splitters.length;
    if (balances[payer] !== undefined) {
      balances[payer] += amt;
    }
    splitters.forEach(s => {
      if (balances[s] !== undefined) {
        balances[s] -= perPerson;
      }
    });
  });

  return balances; // positive = should receive, negative = owes
}

/* ─────────────────────────────────────────────────────────────────────────────
   Packing Checklist Storage
   ───────────────────────────────────────────────────────────────────────────── */
export function getPolarChecklist(tripId) {
  const fallback = [
    { id: uuid(), category: '📄 Documents', items: [{ id: uuid(), text: 'Passport & Visa', checked: true }, { id: uuid(), text: 'Tickets & Hotel Vouchers', checked: false }] },
    { id: uuid(), category: '🔌 Electronics', items: [{ id: uuid(), text: 'Phone Charger & Power Bank', checked: true }, { id: uuid(), text: 'Camera & SD Card', checked: false }] },
    { id: uuid(), category: '👔 Clothing', items: [{ id: uuid(), text: 'Comfortable Walking Shoes', checked: true }, { id: uuid(), text: 'Weather Apparel', checked: false }] },
    { id: uuid(), category: '🧴 Toiletries & Meds', items: [{ id: uuid(), text: 'First Aid Kit & Sunscreen', checked: false }] },
  ];
  return readKey(`ps_checklist_${tripId}`, fallback);
}

export function savePolarChecklist(tripId, checklist) {
  writeKey(`ps_checklist_${tripId}`, checklist);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Passport Stamps & Achievements Engine
   ───────────────────────────────────────────────────────────────────────────── */
export function getPassportBadges(steps = []) {
  const totalKm = steps.reduce((sum, s) => sum + (s.distKm || 0), 0);
  const photoCount = steps.reduce((sum, s) => sum + (s.photos?.length || 0), 0);

  return [
    {
      id: 'first_step', title: 'First Step Pin', emoji: '📍', desc: 'Logged your first travel step',
      unlocked: steps.length > 0, progress: `${Math.min(steps.length, 1)}/1`,
    },
    {
      id: 'globetrotter', title: 'Road Voyager', emoji: '🚗', desc: 'Logged 3+ travel steps',
      unlocked: steps.length >= 3, progress: `${Math.min(steps.length, 3)}/3`,
    },
    {
      id: 'distance_1000', title: '1,000 KM Pioneer', emoji: '✈️', desc: 'Traveled over 1,000 km in total distance',
      unlocked: totalKm >= 1000, progress: `${Math.min(totalKm, 1000)}/1000 km`,
    },
    {
      id: 'shutterbug', title: 'Travel Photographer', emoji: '📸', desc: 'Attached 5+ memory photos to steps',
      unlocked: photoCount >= 5, progress: `${Math.min(photoCount, 5)}/5 photos`,
    },
    {
      id: 'hiker', title: 'Peak Explorer', emoji: '🏔️', desc: 'Used Hike/Nature mode for a step',
      unlocked: steps.some(s => s.transportMode === 'hike'), progress: steps.some(s => s.transportMode === 'hike') ? 'Unlocked' : '0/1',
    },
    {
      id: 'mariner', title: 'Seafarer', emoji: '⛵', desc: 'Used Boat/Ferry transport mode',
      unlocked: steps.some(s => s.transportMode === 'boat'), progress: steps.some(s => s.transportMode === 'boat') ? 'Unlocked' : '0/1',
    },
  ];
}
