import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trophy, Edit3, Check, Flame, Zap } from 'lucide-react';
import { getTrips, getProfile, saveProfile, getStreak, calcXP, getLevel } from '../utils/storage';
import BottomSheet from '../components/BottomSheet';

/* ── Animated counter ────────────────────────────────────────── */
function AnimCount({ to, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (to === 0) return;
    let cur = 0; const step = to / 28;
    const t = setInterval(() => { cur = Math.min(to, cur + step); setVal(Math.floor(cur)); if (cur >= to) clearInterval(t); }, 36);
    return () => clearInterval(t);
  }, [to]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

/* ── Achievements ────────────────────────────────────────────── */
const ACHIEVEMENTS = [
  { emoji:'🏆', name:'First Trip',      cond: t => t >= 1 },
  { emoji:'✈️', name:'Frequent Flyer',  cond: t => t >= 3 },
  { emoji:'🌏', name:'Globe Trotter',   cond: (_, c) => c >= 3 },
  { emoji:'📸', name:'Memory Maker',    cond: (_, __, p) => p >= 5 },
  { emoji:'🗺️', name:'Map Master',     cond: (_, __, ___, pins) => pins >= 10 },
  { emoji:'📅', name:'Long Hauler',     cond: (_, __, ___, ____, d) => d >= 30 },
  { emoji:'🇮🇳', name:'Desi Explorer',   cond: (_, __, ___, ____, _____, s) => s >= 3 },
  { emoji:'🚲', name:'Bharat Yatri',    cond: (_, __, ___, ____, _____, s) => s >= 7 },
];

export default function Profile() {
  const navigate = useNavigate();
  const [profile,     setProfile]     = useState(() => getProfile());
  const [editing,     setEditing]     = useState(false);
  const [dName,       setDName]       = useState(profile.name        || '');
  const [dBio,        setDBio]        = useState(profile.bio         || '');
  const [dCountry,    setDCountry]    = useState(profile.homeCountry || '');
  const [dCity,       setDCity]       = useState(profile.homeCity    || '');
  const [statSheet,   setStatSheet]   = useState(null);
  const [selectedLoc, setSelectedLoc] = useState(null);

  const trips  = getTrips();
  const streak = getStreak();

  function save() {
    // saveProfile now returns the merged saved object (bug was it returned void)
    const updated = saveProfile({
      name: dName.trim(),
      bio: dBio.trim(),
      homeCountry: dCountry.trim(),
      homeCity: dCity.trim(),
    });
    setProfile(updated);
    setEditing(false);
  }


  function handleStatClick(label) {
    const m = {
      'Trips':      'trips',
      'Countries':  'countries',
      'States (IN)':'states',
      'Completed':  'completed',
      'Days Away':  'trips',
      'Photos':     'photos',
      'Places':     'places',
      'Activities': 'trips'
    };
    if (m[label]) setStatSheet(m[label]);
  }

  /* ── Fix: defer selectedLoc open after statSheet closes ── */
  function openLocation(type, name) {
    if (statSheet) {
      setStatSheet(null);
      setTimeout(() => setSelectedLoc({ type, name }), 250);
    } else {
      setSelectedLoc({ type, name });
    }
  }

  /* Stats */
  const totalTrips = trips.length;
  const done       = trips.filter(t => t.status === 'completed').length;
  const countries  = [...new Set(trips.map(t => t.country).filter(Boolean))].length;
  const states     = [...new Set(trips.map(t => t.stateOfIndia).filter(Boolean))].length;
  const photos     = trips.reduce((s, t) => s + (t.highlights||[]).length, 0);
  const pins       = trips.reduce((s, t) => s + (t.pins||[]).length, 0);
  const days       = trips.reduce((s, t) => {
    if (!t.startDate || !t.endDate) return s;
    return s + Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / (864e5));
  }, 0);
  const acts   = trips.reduce((s, t) => s + (t.days||[]).reduce((a, d) => a + (d.activities||[]).length, 0), 0);
  const spent  = trips.reduce((s, t) => s + (t.expenses||[]).reduce((a, e) => a + Number(e.amount||0), 0), 0);
  const completedCountries = [...new Set(trips.filter(t => t.status === 'completed').map(t => t.country).filter(Boolean))];
  const ongoingCountries   = [...new Set(trips.filter(t => t.status === 'ongoing').map(t => t.country).filter(Boolean))];
  const plannedCountries   = [...new Set(trips.filter(t => t.status === 'planning' || t.status === 'upcoming').map(t => t.country).filter(Boolean))];

  const completedStates = [...new Set(trips.filter(t => t.status === 'completed').map(t => t.stateOfIndia).filter(Boolean))];
  const ongoingStates   = [...new Set(trips.filter(t => t.status === 'ongoing').map(t => t.stateOfIndia).filter(Boolean))];
  const plannedStates   = [...new Set(trips.filter(t => t.status === 'planning' || t.status === 'upcoming').map(t => t.stateOfIndia).filter(Boolean))];

  const STATS = [
    { icon:'✈️', label:'Trips',      val:totalTrips, color:'var(--em)',     bg:'var(--em-50)' },
    { icon:'🌍', label:'Countries',  val:countries,  color:'var(--sky)',    bg:'var(--sky-50)' },
    { icon:'🇮🇳', label:'States (IN)',val:states,     color:'var(--orange)', bg:'#FFF7ED' },
    { icon:'📅', label:'Days Away',  val:days,       color:'var(--purple)', bg:'var(--purple-50)' },
    { icon:'📍', label:'Places',     val:pins,       color:'var(--rose)',   bg:'var(--rose-50)' },
    { icon:'🎭', label:'Activities', val:acts,       color:'#6366F1',       bg:'#EEF2FF' },
    { icon:'📸', label:'Photos',     val:photos,     color:'var(--amber)',  bg:'var(--amber-50)' },
  ];

  const xp    = calcXP(trips);
  const level = getLevel(xp);

  return (
    <div className="page" style={{ background:'#F8FAFC', paddingTop:0 }}>

      {/* ── Hero gradient ── */}
      <div style={{ background:'linear-gradient(135deg,var(--em),var(--sky))', padding:'52px 20px 90px', textAlign:'center' }}>
        {/* Avatar */}
        <div style={{ width:86, height:86, borderRadius:'50%', background:'rgba(255,255,255,.2)', backdropFilter:'blur(10px)', border:'3px solid rgba(255,255,255,.6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:36, fontWeight:900, color:'white' }}>
          {(profile.name || 'P')[0].toUpperCase()}
        </div>

        {editing ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
            <input value={dName} onChange={e => setDName(e.target.value)}
              style={{ background:'rgba(255,255,255,.2)', border:'1.5px solid rgba(255,255,255,.5)', borderRadius:10, padding:'8px 14px', color:'white', fontFamily:'Outfit', fontWeight:700, fontSize:16, textAlign:'center', width:220, outline:'none' }}
              placeholder="Your name" />
            <input value={dBio} onChange={e => setDBio(e.target.value)}
              style={{ background:'rgba(255,255,255,.2)', border:'1.5px solid rgba(255,255,255,.5)', borderRadius:10, padding:'7px 14px', color:'white', fontFamily:'Outfit', fontSize:13, textAlign:'center', width:260, outline:'none' }}
              placeholder="Short bio…" />
            <input value={dCity} onChange={e => setDCity(e.target.value)}
              style={{ background:'rgba(255,255,255,.2)', border:'1.5px solid rgba(255,255,255,.5)', borderRadius:10, padding:'7px 14px', color:'white', fontFamily:'Outfit', fontSize:13, textAlign:'center', width:260, outline:'none' }}
              placeholder="Home city (e.g. Mumbai)" />
            <input value={dCountry} onChange={e => setDCountry(e.target.value)}
              style={{ background:'rgba(255,255,255,.2)', border:'1.5px solid rgba(255,255,255,.5)', borderRadius:10, padding:'7px 14px', color:'white', fontFamily:'Outfit', fontSize:13, textAlign:'center', width:260, outline:'none' }}
              placeholder="Home country (e.g. India)" />
            <button onClick={save} style={{ background:'white', color:'var(--em)', border:'none', borderRadius:10, padding:'8px 20px', fontFamily:'Outfit', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
              <Check size={14} /> Save Profile
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize:22, fontWeight:900, color:'white' }}>{profile.name || 'Pranit'}</div>
            {profile.bio && <div style={{ fontSize:13, color:'rgba(255,255,255,.85)', marginTop:4 }}>{profile.bio}</div>}
            {(profile.homeCity || profile.homeCountry) && (
              <div style={{ fontSize:12, color:'rgba(255,255,255,.8)', marginTop:3 }}>
                🏠 {[profile.homeCity, profile.homeCountry].filter(Boolean).join(', ')}
              </div>
            )}
            <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:6 }}>{done} completed · {totalTrips} total trips</div>
            <button onClick={() => setEditing(true)} style={{ marginTop:12, background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.4)', borderRadius:10, padding:'8px 18px', color:'white', fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              <Edit3 size={13} /> Edit Profile
            </button>
          </>
        )}
      </div>


      {/* ── Stats card (overlapping hero) ── */}
      <div style={{ margin:'-48px 20px 24px', background:'white', borderRadius:22, padding:'20px 16px', boxShadow:'var(--sh-lg)', position:'relative', zIndex:5 }}>
        <div style={{ fontWeight:800, fontSize:15, color:'var(--t1)', marginBottom:14, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          📊 Travel Stats
        </div>
        <div className="stats-grid-premium">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="stat-card-premium"
              initial={{ opacity:0, scale:.9 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleStatClick(s.label)}
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.96 }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-icon-wrapper" style={{ background: s.bg }}>{s.icon}</span>
                <span className="stat-value-premium" style={{ color: 'var(--t1)' }}><AnimCount to={s.val} /></span>
              </div>
              <div className="stat-label-premium">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {spent > 0 && (
          <div style={{ marginTop:14, background:'var(--g50)', borderRadius:14, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontWeight:900, fontSize:22, color:'var(--em)' }}>₹<AnimCount to={Math.round(spent)} /></div>
            <div style={{ fontSize:11, color:'var(--t3)', fontWeight:700, marginTop:2, textTransform:'uppercase', letterSpacing:'.05em' }}>Total Spent Across All Trips</div>
          </div>
        )}
      </div>

      {/* ── Quick Nav Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, margin:'0 20px 20px' }}>
        <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={()=>navigate('/challenges')}
          style={{ background:`linear-gradient(135deg,${level.color},#1E293B)`, borderRadius:18, padding:'16px', cursor:'pointer', position:'relative', overflow:'hidden' }}>
          <div style={{ fontSize:24, marginBottom:6 }}>{level.emoji}</div>
          <div style={{ fontSize:13, fontWeight:900, color:'white' }}>Level {level.level}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>{level.name}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
            <Flame size={12} color="#FCD34D" fill="#FCD34D"/>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.85)', fontWeight:700 }}>{streak.count}d streak</span>
          </div>
          <div style={{ position:'absolute', bottom:10, right:14, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>Tap →</div>
        </motion.div>
        <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={()=>navigate('/scratchmap')}
          style={{ background:'linear-gradient(135deg,#0F172A,#1E3A5F)', borderRadius:18, padding:'16px', cursor:'pointer', position:'relative', overflow:'hidden' }}>
          <div style={{ fontSize:24, marginBottom:6 }}>🗺️</div>
          <div style={{ fontSize:13, fontWeight:900, color:'white' }}>Scratch Map</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>{countries} countries visited</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
            <Zap size={12} color="#FCD34D" fill="#FCD34D"/>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.85)', fontWeight:700 }}>{xp.toLocaleString()} XP</span>
          </div>
          <div style={{ position:'absolute', bottom:10, right:14, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>Tap →</div>
        </motion.div>
      </div>

      {/* ── Geographic Breakdown ── */}
      <div style={{ margin:'0 20px 24px', background:'white', borderRadius:22, padding:'20px 18px', border:'1.5px solid var(--border)', boxShadow:'var(--sh-xs)' }}>
        <div style={{ fontWeight:800, fontSize:15, color:'var(--t1)', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
          🗺️ Travel Map Registry
        </div>
        <div style={{ fontSize:12, color:'var(--t3)', marginBottom:16 }}>Tap any location tag to view your trips there 👆</div>
        
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          
          {/* Visited (completed) */}
          <div style={{ display:'flex', gap:10, alignItems:'flex-start', paddingBottom:12, borderBottom:'1px solid var(--g100)' }}>
            <span className="badge badge-em" style={{ flexShrink:0, width:90, justifyContent:'center' }}>Visited</span>
            <div style={{ flex:1 }}>
              {completedCountries.length > 0 ? (
                <div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                    <strong style={{ fontSize:12, color:'var(--t2)' }}>Countries:</strong>
                    {completedCountries.map(c => (
                      <span key={c} onClick={() => openLocation('country', c)} className="badge badge-gray" style={{ cursor:'pointer', fontWeight:700 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                  {completedStates.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', marginTop:8 }}>
                      <strong style={{ fontSize:12, color:'var(--t2)' }}>States (IN):</strong>
                      {completedStates.map(s => (
                        <span key={s} onClick={() => openLocation('state', s)} className="badge badge-em" style={{ cursor:'pointer', fontWeight:700 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color:'var(--t3)', fontStyle:'italic', fontSize:13 }}>No visited places yet</span>
              )}
            </div>
          </div>

          {/* Ongoing (Current) */}
          <div style={{ display:'flex', gap:10, alignItems:'flex-start', paddingBottom:12, borderBottom:'1px solid var(--g100)' }}>
            <span className="badge badge-amb" style={{ flexShrink:0, width:90, justifyContent:'center' }}>Ongoing</span>
            <div style={{ flex:1 }}>
              {ongoingCountries.length > 0 ? (
                <div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                    <strong style={{ fontSize:12, color:'var(--t2)' }}>Countries:</strong>
                    {ongoingCountries.map(c => (
                      <span key={c} onClick={() => openLocation('country', c)} className="badge badge-gray" style={{ cursor:'pointer', fontWeight:700 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                  {ongoingStates.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', marginTop:8 }}>
                      <strong style={{ fontSize:12, color:'var(--t2)' }}>States (IN):</strong>
                      {ongoingStates.map(s => (
                        <span key={s} onClick={() => openLocation('state', s)} className="badge badge-em" style={{ cursor:'pointer', fontWeight:700 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color:'var(--t3)', fontStyle:'italic', fontSize:13 }}>No ongoing trips right now</span>
              )}
            </div>
          </div>

          {/* Planned (Upcoming) */}
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <span className="badge badge-sky" style={{ flexShrink:0, width:90, justifyContent:'center' }}>Planned</span>
            <div style={{ flex:1 }}>
              {plannedCountries.length > 0 ? (
                <div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                    <strong style={{ fontSize:12, color:'var(--t2)' }}>Countries:</strong>
                    {plannedCountries.map(c => (
                      <span key={c} onClick={() => openLocation('country', c)} className="badge badge-gray" style={{ cursor:'pointer', fontWeight:700 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                  {plannedStates.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', marginTop:8 }}>
                      <strong style={{ fontSize:12, color:'var(--t2)' }}>States (IN):</strong>
                      {plannedStates.map(s => (
                        <span key={s} onClick={() => openLocation('state', s)} className="badge badge-em" style={{ cursor:'pointer', fontWeight:700 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color:'var(--t3)', fontStyle:'italic', fontSize:13 }}>No upcoming plans logged</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Trips by Location Sheet ── */}
      <BottomSheet open={!!selectedLoc} onClose={() => setSelectedLoc(null)} title={selectedLoc ? `Trips in ${selectedLoc.name}` : ''}>
        {selectedLoc && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {trips.filter(t => {
              const target = selectedLoc.name.trim().toLowerCase();
              if (selectedLoc.type === 'country') {
                return t.country?.trim().toLowerCase() === target;
              } else {
                return t.stateOfIndia?.trim().toLowerCase() === target;
              }
            }).map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', border:'1.5px solid var(--border)', borderRadius:16, background:'white', boxShadow:'var(--sh-xs)' }}>
                <span style={{ fontSize:28 }}>{t.emoji || '✈️'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
                  <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>
                    📍 {t.destination || 'No destination'} · {t.startDate ? fmtDate(t.startDate) : 'No date'}
                  </div>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedLoc(null); navigate(`/trip/${t.id}`); }} style={{ padding:'7px 12px', fontSize:12 }}>
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* ── Global Stats List Sheet ── */}
      <BottomSheet
        open={!!statSheet}
        onClose={() => setStatSheet(null)}
        title={
          statSheet === 'trips' ? 'All Trips' :
          statSheet === 'completed' ? 'Completed Trips' :
          statSheet === 'countries' ? 'Countries Visited' :
          statSheet === 'states' ? 'States Visited' :
          statSheet === 'places' ? 'Visited Places (Map Pins)' :
          statSheet === 'photos' ? 'All Trip Photos' : ''
        }
      >
        {statSheet && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:'60vh', overflowY:'auto', paddingBottom:16 }}>
            
            {/* Trips List (Trips / Completed / Days / Activities) */}
            {(statSheet === 'trips' || statSheet === 'completed') && (
              (() => {
                const list = statSheet === 'completed' ? trips.filter(t => t.status === 'completed') : trips;
                if (!list.length) return <div style={{ color:'var(--t3)', textAlign:'center', padding:20 }}>No trips in this list</div>;
                return list.map(t => (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', border:'1.5px solid var(--border)', borderRadius:16, background:'white', boxShadow:'var(--sh-xs)' }}>
                    <span style={{ fontSize:28 }}>{t.emoji || '✈️'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
                      <div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>
                        📍 {t.destination || 'No destination'} · {t.startDate ? fmtDate(t.startDate) : 'No date'}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => { setStatSheet(null); navigate(`/trip/${t.id}`); }} style={{ padding:'7px 12px', fontSize:12 }}>
                      Open
                    </button>
                  </div>
                ));
              })()
            )}

            {/* Countries Breakdown */}
            {statSheet === 'countries' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { title: 'Visited', list: completedCountries, badge: 'badge-em' },
                  { title: 'Ongoing', list: ongoingCountries, badge: 'badge-amb' },
                  { title: 'Planned', list: plannedCountries, badge: 'badge-sky' }
                ].map(grp => (
                  <div key={grp.title}>
                    <div style={{ fontWeight:700, fontSize:12, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:6 }}>{grp.title}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {grp.list.length > 0 ? grp.list.map(c => (
                        <span key={c} onClick={() => openLocation('country', c)} className={`badge ${grp.badge}`} style={{ cursor:'pointer', fontWeight:700 }}>
                          {c}
                        </span>
                      )) : <span style={{ color:'var(--t3)', fontSize:12, fontStyle:'italic' }}>None</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* States Breakdown */}
            {statSheet === 'states' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { title: 'Visited', list: completedStates, badge: 'badge-em' },
                  { title: 'Ongoing', list: ongoingStates, badge: 'badge-amb' },
                  { title: 'Planned', list: plannedStates, badge: 'badge-sky' }
                ].map(grp => (
                  <div key={grp.title}>
                    <div style={{ fontWeight:700, fontSize:12, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:6 }}>{grp.title}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {grp.list.length > 0 ? grp.list.map(s => (
                        <span key={s} onClick={() => openLocation('state', s)} className={`badge ${grp.badge}`} style={{ cursor:'pointer', fontWeight:700 }}>
                          {s}
                        </span>
                      )) : <span style={{ color:'var(--t3)', fontSize:12, fontStyle:'italic' }}>None</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Places List (Map Pins) */}
            {statSheet === 'places' && (
              (() => {
                if (!allPins.length) return <div style={{ color:'var(--t3)', textAlign:'center', padding:20 }}>No map places pinned yet</div>;
                return allPins.map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', border:'1.5px solid var(--border)', borderRadius:16, background:'white', boxShadow:'var(--sh-xs)' }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:'var(--em-50)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📍</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>
                        Trip: <strong>{p.tripName}</strong> {p.note && `· "${p.note}"`}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => { setStatSheet(null); navigate(`/trip/${p.tripId}`); }} style={{ padding:'7px 12px', fontSize:12 }}>
                      View
                    </button>
                  </div>
                ));
              })()
            )}

            {/* Photos Grid */}
            {statSheet === 'photos' && (
              (() => {
                if (!allPhotos.length) return <div style={{ color:'var(--t3)', textAlign:'center', padding:20 }}>No photos uploaded yet</div>;
                return (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
                    {allPhotos.map((ph, idx) => (
                      <div key={ph.id || idx} onClick={() => { setStatSheet(null); navigate(`/trip/${ph.tripId}`); }} style={{ aspectRatio:'1', borderRadius:10, overflow:'hidden', cursor:'pointer', background:'var(--g50)', border:'1px solid var(--border)', position:'relative' }}>
                        <img src={ph.url} alt="stat" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      </div>
                    ))}
                  </div>
                );
              })()
            )}

          </div>
        )}
      </BottomSheet>

      {/* ── Achievements ── */}
      <div style={{ padding:'0 20px 24px' }}>
        <div style={{ fontWeight:800, fontSize:16, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <Star size={18} color="var(--amber)" fill="var(--amber)" /> Achievements
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = a.cond(totalTrips, countries, photos, pins, days, states);
            return (
              <div key={a.name} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background: unlocked ? 'var(--em-50)' : 'var(--g50)', border:`1.5px solid ${unlocked ? 'var(--em-100)' : 'var(--border)'}`, borderRadius:999, opacity: unlocked ? 1 : 0.42, transition:'all 300ms' }}>
                <span style={{ fontSize:18 }}>{a.emoji}</span>
                <span style={{ fontSize:12, fontWeight:700, color: unlocked ? '#065F46' : 'var(--t3)' }}>{a.name}</span>
                {unlocked && <span style={{ fontSize:10, color:'var(--em)' }}>✓</span>}
              </div>
            );
          })}
        </div>
        {totalTrips === 0 && (
          <div style={{ marginTop:12, fontSize:12, color:'var(--t3)', textAlign:'center' }}>Create your first trip to unlock achievements 🏆</div>
        )}
      </div>

      {/* ── Trips list ── */}
      {trips.length > 0 && (
        <div style={{ padding:'0 20px 48px' }}>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <Trophy size={18} color="var(--amber)" /> My Trips ({totalTrips})
          </div>
          {trips.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.06 }}
              style={{ display:'flex', alignItems:'center', gap:12, background:'white', border:'1.5px solid var(--border)', borderRadius:16, padding:'12px 14px', marginBottom:10, boxShadow:'var(--sh-xs)' }}>
              <div style={{ fontSize:26, flexShrink:0 }}>{t.emoji || '✈️'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
                <div style={{ fontSize:12, color:'var(--t3)' }}>{t.destination || 'No destination'} · {(t.days||[]).length} days · {(t.highlights||[]).length} photos</div>
              </div>
              <span className={`badge ${t.status === 'completed' ? 's-completed' : t.status === 'upcoming' ? 's-upcoming' : t.status === 'ongoing' ? 's-ongoing' : 's-planning'}`} style={{ flexShrink:0 }}>
                {((t.status||'planning').charAt(0).toUpperCase() + (t.status||'planning').slice(1))}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
