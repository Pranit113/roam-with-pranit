import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from './utils/auth';
import Auth           from './pages/Auth';
import TravelListHome from './pages/TravelListHome';
import PlaceDetail    from './pages/PlaceDetail';
import TripDetail     from './pages/TripDetail';
import Navbar         from './components/Navbar';
import Home           from './pages/Home';
import Trips          from './pages/Trips';
import TripWorkspace  from './pages/TripWorkspace';
import Profile        from './pages/Profile';
import Challenges     from './pages/Challenges';
import Transactions   from './pages/Transactions';
import AllHighlights  from './pages/AllHighlights';
import Places         from './pages/Places';
import './index.css';

function RequireAuth({ children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    function check() { setUser(getCurrentUser()); }
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to="/home" replace /> : <Auth onAuth={u => setUser(u)} />}
        />
        <Route path="/travellist" element={<RequireAuth><TravelListHome key={user?.email} /></RequireAuth>} />
        <Route path="/place/:id"  element={<RequireAuth><PlaceDetail /></RequireAuth>} />
        <Route path="/tl-trip/:id" element={<RequireAuth><TripDetail /></RequireAuth>} />

        <Route
          path="/*"
          element={
            <RequireAuth>
              <div className="app-root">
                <Navbar />
                <div className="app-shell">
                  <Routes>
                    <Route path="/"             element={<Navigate to="/home" replace />} />
                    <Route path="/home"         element={<Home />} />
                    <Route path="/trips"        element={<Trips />} />
                    <Route path="/trip/:id"     element={<TripWorkspace />} />
                    <Route path="/profile"      element={<Profile />} />
                    <Route path="/challenges"   element={<Challenges />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/highlights"   element={<AllHighlights />} />
                    <Route path="/places"       element={<Places />} />
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