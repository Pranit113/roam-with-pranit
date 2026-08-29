import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from './utils/auth';
import Auth            from './pages/Auth';
import TravelListHome  from './pages/TravelListHome';
import PlaceDetail     from './pages/PlaceDetail';
import TripDetail      from './pages/TripDetail';
import Navbar          from './components/Navbar';
import Home            from './pages/Home';
import Trips           from './pages/Trips';
import TripWorkspace   from './pages/TripWorkspace';
import Profile         from './pages/Profile';
import Challenges      from './pages/Challenges';
import ScratchMap      from './pages/ScratchMap';
import Transactions    from './pages/Transactions';
import './index.css';

/* ── Auth-guarded wrapper ────────────────────────────────────────────────── */
function RequireAuth({ children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => getCurrentUser());

  // Listen for auth changes (sign in / sign out)
  useEffect(() => {
    function check() { setUser(getCurrentUser()); }
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* ── Auth ──────────────────────────────────────────────────────── */}
        <Route
          path="/auth"
          element={
            user
              ? <Navigate to="/home" replace />
              : <Auth onAuth={u => setUser(u)} />
          }
        />

        {/* ── TravelList (bucket-list system) ───────────────────────────── */}
        <Route
          path="/travellist"
          element={
            <RequireAuth>
              <TravelListHome key={user?.email} />
            </RequireAuth>
          }
        />
        <Route
          path="/place/:id"
          element={
            <RequireAuth>
              <PlaceDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/tl-trip/:id"
          element={
            <RequireAuth>
              <TripDetail />
            </RequireAuth>
          }
        />

        {/* ── Main trip planner (with 5-tab Navbar) ─────────────────────── */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <div className="app-root">
                <Navbar />
                <div className="app-shell">
                  <Routes>
                    <Route path="/"              element={<Navigate to="/home" replace />} />
                    <Route path="/home"          element={<Home />} />
                    <Route path="/trips"         element={<Trips />} />
                    <Route path="/trip/:id"      element={<TripWorkspace />} />
                    <Route path="/profile"       element={<Profile />} />
                    <Route path="/challenges"    element={<Challenges />} />
                    <Route path="/scratchmap"    element={<ScratchMap />} />
                    <Route path="/transactions"  element={<Transactions />} />
                  </Routes>
                </div>
              </div>
            </RequireAuth>
          }
        />
      </Routes>
    </HashRouter>
  );
}
