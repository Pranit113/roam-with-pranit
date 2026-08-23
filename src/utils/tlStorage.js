import { userKey } from './auth';
import { uuid } from './storage';

function tlRead(suffix, fallback) {
  const k = userKey(suffix);
  if (!k) return fallback;
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
}
function tlWrite(suffix, val) {
  const k = userKey(suffix);
  if (k) localStorage.setItem(k, JSON.stringify(val));
}

// ─── PLACES ──────────────────────────────────────────────────────────────────
export function getPlaces()           { return tlRead('places', []); }
export function savePlaces(places)    { tlWrite('places', places); }

export function getPlace(id) {
  return getPlaces().find(p => p.id === id) ?? null;
}

export function createPlace(data) {
  const place = {
    id: uuid(),
    name: '',
    country: 'India',
    stateOfIndia: '',
    continent: '',
    folder: 'domestic',   // 'domestic' | 'international'
    emoji: '📍',
    coverPhoto: '',
    createdAt: new Date().toISOString(),
    ...data,
  };
  const all = getPlaces();
  all.push(place);
  savePlaces(all);
  return place;
}

export function updatePlace(id, updates) {
  const all = getPlaces();
  const i   = all.findIndex(p => p.id === id);
  if (i === -1) return null;
  all[i] = { ...all[i], ...updates };
  savePlaces(all);
  return all[i];
}

export function deletePlace(id) {
  savePlaces(getPlaces().filter(p => p.id !== id));
  saveTLTrips(getTLTrips().filter(t => t.placeId !== id));
}

// ─── TL TRIPS ────────────────────────────────────────────────────────────────
export function getTLTrips()           { return tlRead('tl_trips', []); }
export function saveTLTrips(trips)     { tlWrite('tl_trips', trips); }

export function getTLTrip(id) {
  return getTLTrips().find(t => t.id === id) ?? null;
}

export function getTLTripsByPlace(placeId) {
  return getTLTrips().filter(t => t.placeId === placeId);
}

export function createTLTrip(data) {
  const trip = {
    id: uuid(),
    placeId: '',
    name: '',
    year: new Date().getFullYear(),
    tripNotes: '',
    emoji: '✈️',
    status: 'planned',     // 'planned' | 'ongoing' | 'completed'
    photos: [],            // [{ id, url }]
    spots:  [],            // [{ id, name }]
    expenses: {
      train: 0, car: 0, flight: 0, food: 0, stay: 0,
      activities: [],      // [{ id, name, amount }]
    },
    createdAt: new Date().toISOString(),
    ...data,
  };
  const all = getTLTrips();
  all.push(trip);
  saveTLTrips(all);
  return trip;
}

export function updateTLTrip(id, updates) {
  const all = getTLTrips();
  const i   = all.findIndex(t => t.id === id);
  if (i === -1) return null;
  all[i] = { ...all[i], ...updates };
  saveTLTrips(all);
  return all[i];
}

export function deleteTLTrip(id) {
  saveTLTrips(getTLTrips().filter(t => t.id !== id));
}

// ─── Expense helpers ─────────────────────────────────────────────────────────
export function calcTripTotal(trip) {
  const exp  = trip.expenses || {};
  const base = (Number(exp.train)||0) + (Number(exp.car)||0) +
               (Number(exp.flight)||0) + (Number(exp.food)||0) +
               (Number(exp.stay)||0);
  const acts = (exp.activities || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
  return base + acts;
}

export function calcPlaceTotal(placeId) {
  return getTLTripsByPlace(placeId).reduce((s, t) => s + calcTripTotal(t), 0);
}

// ─── Analytics helpers ───────────────────────────────────────────────────────
export function getAnalytics() {
  const trips = getTLTrips();
  const grandTotal = trips.reduce((s, t) => s + calcTripTotal(t), 0);

  const cats = { train: 0, car: 0, flight: 0, food: 0, stay: 0, activities: 0 };
  trips.forEach(t => {
    const e = t.expenses || {};
    cats.train      += Number(e.train)  || 0;
    cats.car        += Number(e.car)    || 0;
    cats.flight     += Number(e.flight) || 0;
    cats.food       += Number(e.food)   || 0;
    cats.stay       += Number(e.stay)   || 0;
    cats.activities += (e.activities || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
  });

  // By state (domestic trips)
  const stateMap = {};
  trips.forEach(t => {
    const p = getPlace(t.placeId);
    const state = p?.stateOfIndia;
    if (!state) return;
    if (!stateMap[state]) stateMap[state] = { state, trips: 0, total: 0 };
    stateMap[state].trips++;
    stateMap[state].total += calcTripTotal(t);
  });

  // By country (international trips)
  const countryMap = {};
  trips.forEach(t => {
    const p = getPlace(t.placeId);
    const country = p?.country;
    if (!country || country === 'India') return;
    if (!countryMap[country]) countryMap[country] = { country, trips: 0, total: 0 };
    countryMap[country].trips++;
    countryMap[country].total += calcTripTotal(t);
  });

  return {
    grandTotal,
    cats,
    byState:   Object.values(stateMap).sort((a, b) => b.total - a.total),
    byCountry: Object.values(countryMap).sort((a, b) => b.total - a.total),
  };
}

// ─── Re-export for convenience ────────────────────────────────────────────────
export { getCurrentUser } from './auth';
