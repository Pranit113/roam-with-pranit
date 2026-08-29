import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, User, Map, CreditCard } from 'lucide-react';
import { getProfile } from '../utils/storage';

const NAV_ITEMS = [
  { path: '/home',         icon: Home,       label: 'Home'         },
  { path: '/trips',        icon: Briefcase,  label: 'Trips'        },
  { path: '/scratchmap',   icon: Map,        label: 'Map'          },
  { path: '/transactions', icon: CreditCard, label: 'Wallet'       },
  { path: '/profile',      icon: User,       label: 'Profile'      },
];

export default function Navbar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const profile   = getProfile();

  if (location.pathname.startsWith('/trip/')) return null;
  if (location.pathname === '/scratchmap')    return null;

  const isActive = (path) =>
    path === '/home'
      ? location.pathname === '/home' || location.pathname === '/'
      : location.pathname.startsWith(path);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          🌿 RoamWith<span>Pranit</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              className={`sidebar-item${isActive(path) ? ' active' : ''}`}
              onClick={() => navigate(path)}
            >
              <div className="sidebar-ic"><Icon size={20} /></div>
              <span className="sidebar-lbl">{label}</span>
            </button>
          ))}
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
      <nav className="bot-nav">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <button key={path} className={`nav-item${isActive(path) ? ' active' : ''}`} onClick={() => navigate(path)}>
            <div className="nav-ic"><Icon size={21} /></div>
            <span className="nav-lbl">{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
