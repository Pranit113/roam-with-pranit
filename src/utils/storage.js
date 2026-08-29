// ─── ID Generator ───────────────────────────────────────────────────────────
export function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ─── Storage Keys ────────────────────────────────────────────────────────────
const KEYS = {
  TRIPS: 'rwp_trips',
  PROFILE: 'rwp_profile',
  JOURNAL: 'rwp_journal',
  STREAK: 'rwp_streak',
  CHALLENGES: 'rwp_challenges',
  TRANSACTIONS: 'rwp_transactions',
  GEO_CACHE: 'rwp_geo_cache',
};

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

const INITIAL_TRIPS = [
  {
    id: 'demo-goa',
    name: 'Goa Coastal Adventure',
    emoji: '🏖️',
    cover: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&fit=crop',
    subtitle: 'Sun, sand, and coastal vibes',
    destination: 'Goa, India',
    country: 'India',
    stateOfIndia: 'Goa',
    startDate: '2026-09-10',
    endDate: '2026-09-16',
    status: 'upcoming',
    currency: '₹',
    budget: 35000,
    tags: ['Beach', 'Seafood', 'Sunset'],
    highlights: [
      {
        id: 'hl-goa-1',
        title: 'Baga & Anjuna Sunsets',
        caption: 'Golden hour at the beach',
        createdAt: new Date().toISOString(),
        photos: [
          { id: 'p1', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&fit=crop' },
          { id: 'p2', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop' },
          { id: 'p3', url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&fit=crop' },
        ]
      }
    ],
    expenses: [
      { id: 'exp-1', label: 'Beachside Villa Stay', amount: 14000, category: 'stay', date: '2026-09-10' },
      { id: 'exp-2', label: 'Scuba Diving & Watersports', amount: 5500, category: 'activity', date: '2026-09-12' },
      { id: 'exp-3', label: 'Goan Fish Curry & Dinners', amount: 3800, category: 'food', date: '2026-09-13' },
    ],
  },
  {
    id: 'demo-paris',
    name: 'Paris Romance & Art',
    emoji: '🗼',
    cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&fit=crop',
    subtitle: 'Louvre, Eiffel Tower, and Croissants',
    destination: 'Paris, France',
    country: 'France',
    startDate: '2026-10-05',
    endDate: '2026-10-12',
    status: 'planning',
    currency: '€',
    budget: 120000,
    tags: ['Art', 'Culture', 'Pastry'],
    highlights: [
      {
        id: 'hl-paris-1',
        title: 'Eiffel Tower at Night',
        caption: 'Sparkling lights across the Seine',
        createdAt: new Date().toISOString(),
        photos: [
          { id: 'pp1', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&fit=crop' },
          { id: 'pp2', url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&fit=crop' },
        ]
      }
    ],
    expenses: [
      { id: 'exp-p1', label: 'Flight to Paris CDG', amount: 48000, category: 'flight', date: '2026-10-05' },
      { id: 'exp-p2', label: 'Louvre Museum Tour', amount: 3200, category: 'activity', date: '2026-10-07' },
    ],
  }
];

// ─── Trips ───────────────────────────────────────────────────────────────────
export function getTrips() {
  const existing = read(KEYS.TRIPS, null);
  if (!existing || existing.length === 0) {
    write(KEYS.TRIPS, INITIAL_TRIPS);
    return INITIAL_TRIPS;
  }
  return existing;
}
export function saveTrips(trips) { write(KEYS.TRIPS, trips); }

export function getTrip(id) {
  return getTrips().find(t => t.id === id) ?? null;
}

export function createTrip(data) {
  const trip = {
    id: uuid(),
    name: '',
    emoji: '✈️',
    cover: '',
    subtitle: '',
    destination: '',
    country: '',
    stateOfIndia: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    currency: '₹',
    budget: 0,
    tags: [],
    days: [],
    pins: [],
    highlights: [],
    expenses: [],
    notes: [],
    friends: [],       // for expense splitting
    createdAt: new Date().toISOString(),
    ...data,
  };
  const trips = getTrips();
  trips.push(trip);
  saveTrips(trips);
  // update streak on new trip
  touchStreak();
  return trip;
}

export function updateTrip(id, updates) {
  const trips = getTrips();
  const idx = trips.findIndex(t => t.id === id);
  if (idx === -1) return null;
  trips[idx] = { ...trips[idx], ...updates };
  saveTrips(trips);
  touchStreak();
  return trips[idx];
}

export function deleteTrip(id) {
  saveTrips(getTrips().filter(t => t.id !== id));
}

// ─── Days ────────────────────────────────────────────────────────────────────
export function addDay(tripId, dayData) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const day = { id: uuid(), activities: [], ...dayData };
  const days = [...trip.days, day].sort((a, b) => a.day - b.day);
  return updateTrip(tripId, { days });
}

export function updateDay(tripId, dayId, updates) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const days = trip.days.map(d => d.id === dayId ? { ...d, ...updates } : d);
  return updateTrip(tripId, { days });
}

export function deleteDay(tripId, dayId) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  return updateTrip(tripId, { days: trip.days.filter(d => d.id !== dayId) });
}

// ─── Activities ───────────────────────────────────────────────────────────────
export function addActivity(tripId, dayId, actData) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const activity = { id: uuid(), ...actData };
  const days = trip.days.map(d =>
    d.id === dayId ? { ...d, activities: [...d.activities, activity] } : d
  );
  return updateTrip(tripId, { days });
}

export function deleteActivity(tripId, dayId, actId) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const days = trip.days.map(d =>
    d.id === dayId ? { ...d, activities: d.activities.filter(a => a.id !== actId) } : d
  );
  return updateTrip(tripId, { days });
}

// ─── Pins ────────────────────────────────────────────────────────────────────
export function addPin(tripId, pin) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const pins = [...(trip.pins || []), { id: uuid(), ...pin }];
  return updateTrip(tripId, { pins });
}

export function deletePin(tripId, pinId) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  return updateTrip(tripId, { pins: trip.pins.filter(p => p.id !== pinId) });
}

// ─── Expenses ────────────────────────────────────────────────────────────────
export function addExpense(tripId, expense) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const expenses = [...(trip.expenses || []), { id: uuid(), date: new Date().toISOString(), splitWith: [], ...expense }];
  return updateTrip(tripId, { expenses });
}

export function deleteExpense(tripId, expId) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  return updateTrip(tripId, { expenses: trip.expenses.filter(e => e.id !== expId) });
}

// ─── Highlights ───────────────────────────────────────────────────────────────
// Highlight schema: { id, title, caption, photos: [{id, url}], createdAt }
// Backwards compat: old highlights had { id, url } — normalizeHighlight handles both
export function normalizeHighlight(h) {
  if (h.photos && Array.isArray(h.photos)) return h;
  // old format: { id, url }
  return { ...h, photos: h.url ? [{ id: h.id + '_p0', url: h.url }] : [] };
}

export function addHighlight(tripId, highlightData) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const highlight = {
    id: uuid(),
    title: '',
    caption: '',
    photos: [],
    createdAt: new Date().toISOString(),
    // allow legacy single-url usage
    ...(typeof highlightData === 'string' ? { photos: [{ id: uuid(), url: highlightData }] } : highlightData),
  };
  return updateTrip(tripId, { highlights: [...(trip.highlights || []), highlight] });
}

export function updateHighlight(tripId, hId, updates) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const highlights = (trip.highlights || []).map(h => h.id === hId ? { ...normalizeHighlight(h), ...updates } : h);
  return updateTrip(tripId, { highlights });
}

export function deleteHighlight(tripId, hId) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  return updateTrip(tripId, { highlights: (trip.highlights || []).filter(h => h.id !== hId) });
}

// ─── Notes ───────────────────────────────────────────────────────────────────
export function addNote(tripId, note) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  const notes = [...(trip.notes || []), { id: uuid(), createdAt: new Date().toISOString(), ...note }];
  return updateTrip(tripId, { notes });
}

export function deleteNote(tripId, noteId) {
  const trip = getTrip(tripId);
  if (!trip) return null;
  return updateTrip(tripId, { notes: trip.notes.filter(n => n.id !== noteId) });
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export function getProfile() {
  return read(KEYS.PROFILE, { name: 'Pranit', avatar: '', bio: '', homeCountry: '', homeCity: '' });
}
export function saveProfile(profile) {
  const merged = { ...getProfile(), ...profile };
  write(KEYS.PROFILE, merged);
  return merged;
}

// ─── Global Transactions ──────────────────────────────────────────────────────
// Transaction: { id, tripId, tripName, activityId, label, amount, category, date, source }
export function getTransactions() { return read(KEYS.TRANSACTIONS, []); }

export function upsertTransaction(tx) {
  const all = getTransactions();
  const idx = all.findIndex(t =>
    t.activityId ? t.activityId === tx.activityId : t.id === tx.id
  );
  let updated;
  if (idx >= 0) {
    updated = all.map((t, i) => i === idx ? { ...t, ...tx } : t);
  } else {
    updated = [...all, { id: uuid(), createdAt: new Date().toISOString(), ...tx }];
  }
  write(KEYS.TRANSACTIONS, updated);
  return updated;
}

export function deleteTransaction(txId) {
  write(KEYS.TRANSACTIONS, getTransactions().filter(t => t.id !== txId));
}

export function deleteTransactionByActivityId(activityId) {
  write(KEYS.TRANSACTIONS, getTransactions().filter(t => t.activityId !== activityId));
}

export function getTransactionsByTrip(tripId) {
  return getTransactions().filter(t => t.tripId === tripId);
}

// ─── Geocoding Cache ──────────────────────────────────────────────────────────
export function getGeoCache() { return read(KEYS.GEO_CACHE, {}); }
export function setGeoCache(key, coords) {
  const cache = getGeoCache();
  cache[key] = coords;
  write(KEYS.GEO_CACHE, cache);
}


// ─── Journal ─────────────────────────────────────────────────────────────────
// Journal entries stored as { [tripId_dayId]: { text, prompt, updatedAt } }
export function getJournalEntries() {
  return read(KEYS.JOURNAL, {});
}
export function saveJournalEntry(tripId, dayId, data) {
  const all = getJournalEntries();
  all[`${tripId}_${dayId}`] = { ...data, updatedAt: new Date().toISOString() };
  write(KEYS.JOURNAL, all);
}
export function getJournalEntry(tripId, dayId) {
  return getJournalEntries()[`${tripId}_${dayId}`] || null;
}

// ─── Streak ──────────────────────────────────────────────────────────────────
export function getStreak() {
  return read(KEYS.STREAK, { count: 0, lastActive: null });
}

export function touchStreak() {
  const today = new Date().toDateString();
  const s = getStreak();
  if (s.lastActive === today) return s; // already touched today
  const yesterday = new Date(Date.now() - 864e5).toDateString();
  const newCount = s.lastActive === yesterday ? s.count + 1 : 1;
  const updated = { count: newCount, lastActive: today };
  write(KEYS.STREAK, updated);
  return updated;
}

// ─── XP Calculation ──────────────────────────────────────────────────────────
export function calcXP(trips) {
  let xp = 0;
  const countries = new Set();
  const states = new Set();
  trips.forEach(t => {
    xp += 100; // per trip
    xp += (t.highlights || []).length * 5;   // per photo
    xp += (t.pins || []).length * 15;        // per pin
    xp += (t.expenses || []).length * 3;     // per expense logged
    (t.days || []).forEach(d => {
      xp += (d.activities || []).length * 10; // per activity
    });
    if (t.country && !countries.has(t.country)) { countries.add(t.country); xp += 200; }
    if (t.stateOfIndia && !states.has(t.stateOfIndia)) { states.add(t.stateOfIndia); xp += 75; }
    if (t.status === 'completed') xp += 150;
  });
  return xp;
}

export function getLevel(xp) {
  if (xp < 300)   return { level: 1, name: 'Rookie',       emoji: '🌱', next: 300,  color: '#64748B' };
  if (xp < 800)   return { level: 2, name: 'Explorer',     emoji: '🧭', next: 800,  color: '#0EA5E9' };
  if (xp < 2000)  return { level: 3, name: 'Adventurer',   emoji: '⛺', next: 2000, color: '#10B981' };
  if (xp < 5000)  return { level: 4, name: 'Globetrotter', emoji: '🌍', next: 5000, color: '#F59E0B' };
  return              { level: 5, name: 'Legend',       emoji: '🏆', next: null, color: '#8B5CF6' };
}

// ─── Challenges ──────────────────────────────────────────────────────────────
export const ALL_CHALLENGES = [
  { id:'c1',  emoji:'✈️', name:'First Flight',        desc:'Create your first trip',            target:1,  type:'trips' },
  { id:'c2',  emoji:'🧳', name:'Triple Threat',       desc:'Complete 3 trips',                  target:3,  type:'completed' },
  { id:'c3',  emoji:'🌍', name:'World Citizen',       desc:'Visit 5 different countries',       target:5,  type:'countries' },
  { id:'c4',  emoji:'🇮🇳', name:'Bharat Explorer',    desc:'Visit 5 states of India',           target:5,  type:'states' },
  { id:'c5',  emoji:'📸', name:'Memory Maker',        desc:'Upload 20 photos',                  target:20, type:'photos' },
  { id:'c6',  emoji:'📍', name:'Pin Collector',       desc:'Pin 10 places on maps',             target:10, type:'pins' },
  { id:'c7',  emoji:'🗓', name:'Activity Log',        desc:'Log 25 activities',                 target:25, type:'activities' },
  { id:'c8',  emoji:'💰', name:'Budget Tracker',      desc:'Log 15 expenses',                   target:15, type:'expenses' },
  { id:'c9',  emoji:'📖', name:'Storyteller',         desc:'Write 5 journal entries',           target:5,  type:'journal' },
  { id:'c10', emoji:'🔥', name:'Streak Master',       desc:'Maintain a 7-day streak',           target:7,  type:'streak' },
  { id:'c11', emoji:'🏆', name:'Long Hauler',         desc:'Travel for 30 total days',          target:30, type:'days' },
  { id:'c12', emoji:'🌐', name:'Continent Hopper',    desc:'Visit 3 different countries',       target:3,  type:'countries' },
];

export function getChallengeProgress(trips, streak, journalEntries) {
  const countries = new Set(trips.map(t => t.country).filter(Boolean));
  const states    = new Set(trips.map(t => t.stateOfIndia).filter(Boolean));
  const photos    = trips.reduce((s, t) => s + (t.highlights || []).length, 0);
  const pins      = trips.reduce((s, t) => s + (t.pins || []).length, 0);
  const acts      = trips.reduce((s, t) => s + (t.days || []).reduce((a, d) => a + (d.activities || []).length, 0), 0);
  const exps      = trips.reduce((s, t) => s + (t.expenses || []).length, 0);
  const days      = trips.reduce((s, t) => {
    if (!t.startDate || !t.endDate) return s;
    return s + Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / 864e5);
  }, 0);
  const completed = trips.filter(t => t.status === 'completed').length;
  const journalCount = Object.keys(journalEntries || {}).length;

  const vals = {
    trips: trips.length,
    completed,
    countries: countries.size,
    states: states.size,
    photos,
    pins,
    activities: acts,
    expenses: exps,
    journal: journalCount,
    streak: streak?.count || 0,
    days,
  };

  return ALL_CHALLENGES.map(c => ({
    ...c,
    current: Math.min(vals[c.type] || 0, c.target),
    done: (vals[c.type] || 0) >= c.target,
  }));
}
