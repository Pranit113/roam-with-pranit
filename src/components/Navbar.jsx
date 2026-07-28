import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, User, Trophy, Map } from 'lucide-react';
import { getProfile } from '../utils/storage';

const NAV_ITEMS = [
  { path:'/',           icon: Home,     label:'Home'       },
  { path:'/trips',      icon: Briefcase,label:'Trips'      },
  { path:'/challenges', icon: Trophy,   label:'Challenges' },
  { path:'/profile',    icon: User,     label:'Profile'    },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const profile  = getProfile();

  /* hide on trip workspace and scratch map (they have back buttons) */
  if (location.pathname.startsWith('/trip/')) return null;
  if (location.pathname === '/scratchmap') return null;

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* ── Desktop Sidebar (≥ 1024px) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          🌿 RoamWith<span>Pranit</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                className={`sidebar-item${active ? ' active' : ''}`}
                onClick={() => navigate(path)}
              >
                <div className="sidebar-ic"><Icon size={20} /></div>
                <span className="sidebar-lbl">{label}</span>
              </button>
            );
          })}
          <button
            className={`sidebar-item${isActive('/scratchmap') ? ' active' : ''}`}
            onClick={() => navigate('/scratchmap')}
          >
            <div className="sidebar-ic"><Map size={20} /></div>
            <span className="sidebar-lbl">Scratch Map</span>
          </button>
        </nav>

        <div className="sidebar-user" onClick={() => navigate('/profile')}>
          <div className="sidebar-avatar">
            {(profile.name || 'P')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.name || 'Traveller'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>View Profile</div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav (< 1024px) ── */}
      <nav className="bot-nav">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <button key={path} className={`nav-item${active ? ' active' : ''}`} onClick={() => navigate(path)}>
              <div className="nav-ic"><Icon size={22} /></div>
              <span className="nav-lbl">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
