import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar        from './components/Navbar';
import Home          from './pages/Home';
import Trips         from './pages/Trips';
import TripWorkspace from './pages/TripWorkspace';
import Profile       from './pages/Profile';
import Challenges    from './pages/Challenges';
import ScratchMap    from './pages/ScratchMap';
import './index.css';

export default function App() {
  return (
    <HashRouter>
      <div className="app-root">
        <Navbar />
        <div className="app-shell">
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/trips"       element={<Trips />} />
            <Route path="/trip/:id"    element={<TripWorkspace />} />
            <Route path="/profile"     element={<Profile />} />
            <Route path="/challenges"  element={<Challenges />} />
            <Route path="/scratchmap"  element={<ScratchMap />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}
