import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getTrips } from '../utils/storage';

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi',
];

const WORLD_COUNTRIES = [
  { name:'India',          emoji:'🇮🇳', region:'Asia' },
  { name:'United States',  emoji:'🇺🇸', region:'Americas' },
  { name:'United Kingdom', emoji:'🇬🇧', region:'Europe' },
  { name:'France',         emoji:'🇫🇷', region:'Europe' },
  { name:'Germany',        emoji:'🇩🇪', region:'Europe' },
  { name:'Italy',          emoji:'🇮🇹', region:'Europe' },
  { name:'Spain',          emoji:'🇪🇸', region:'Europe' },
  { name:'Japan',          emoji:'🇯🇵', region:'Asia' },
  { name:'China',          emoji:'🇨🇳', region:'Asia' },
  { name:'Australia',      emoji:'🇦🇺', region:'Oceania' },
  { name:'Brazil',         emoji:'🇧🇷', region:'Americas' },
  { name:'South Africa',   emoji:'🇿🇦', region:'Africa' },
  { name:'Egypt',          emoji:'🇪🇬', region:'Africa' },
  { name:'UAE',            emoji:'🇦🇪', region:'Middle East' },
  { name:'Singapore',      emoji:'🇸🇬', region:'Asia' },
  { name:'Thailand',       emoji:'🇹🇭', region:'Asia' },
  { name:'Nepal',          emoji:'🇳🇵', region:'Asia' },
  { name:'Sri Lanka',      emoji:'🇱🇰', region:'Asia' },
  { name:'Maldives',       emoji:'🇲🇻', region:'Asia' },
  { name:'Mexico',         emoji:'🇲🇽', region:'Americas' },
  { name:'Canada',         emoji:'🇨🇦', region:'Americas' },
  { name:'Russia',         emoji:'🇷🇺', region:'Europe/Asia' },
  { name:'Turkey',         emoji:'🇹🇷', region:'Europe/Asia' },
  { name:'Greece',         emoji:'🇬🇷', region:'Europe' },
  { name:'Portugal',       emoji:'🇵🇹', region:'Europe' },
  { name:'Switzerland',    emoji:'🇨🇭', region:'Europe' },
  { name:'Netherlands',    emoji:'🇳🇱', region:'Europe' },
  { name:'Indonesia',      emoji:'🇮🇩', region:'Asia' },
  { name:'Malaysia',       emoji:'🇲🇾', region:'Asia' },
  { name:'Vietnam',        emoji:'🇻🇳', region:'Asia' },
  { name:'South Korea',    emoji:'🇰🇷', region:'Asia' },
  { name:'Pakistan',       emoji:'🇵🇰', region:'Asia' },
  { name:'Bangladesh',     emoji:'🇧🇩', region:'Asia' },
  { name:'Bhutan',         emoji:'🇧🇹', region:'Asia' },
  { name:'Kenya',          emoji:'🇰🇪', region:'Africa' },
  { name:'Morocco',        emoji:'🇲🇦', region:'Africa' },
  { name:'New Zealand',    emoji:'🇳🇿', region:'Oceania' },
  { name:'Argentina',      emoji:'🇦🇷', region:'Americas' },
  { name:'Peru',           emoji:'🇵🇪', region:'Americas' },
  { name:'Colombia',       emoji:'🇨🇴', region:'Americas' },
];

export default function ScratchMap() {
  const navigate = useNavigate();
  const [trips,      setTrips]      = useState([]);
  const [activeView, setActiveView] = useState('world');
  const [search,     setSearch]     = useState('');

  useEffect(() => { setTrips(getTrips()); }, []);

  const visitedCountries = new Set(
    trips.filter(t=>t.status==='completed').map(t=>t.country).filter(Boolean)
  );
  const plannedCountries = new Set(
    trips.filter(t=>t.status!=='completed').map(t=>t.country).filter(Boolean)
  );
  const visitedStates = new Set(
    trips.filter(t=>t.status==='completed').map(t=>t.stateOfIndia).filter(Boolean)
  );
  const plannedStates = new Set(
    trips.filter(t=>t.status!=='completed').map(t=>t.stateOfIndia).filter(Boolean)
  );

  const filteredCountries = WORLD_COUNTRIES.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStates = INDIA_STATES.filter(s=>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const pctWorld = Math.round((visitedCountries.size / WORLD_COUNTRIES.length)*100);
  const pctIndia = Math.round((visitedStates.size / 29)*100);

  return (
    <div style={{ minHeight:'100vh', background:'#0F172A', paddingBottom:80 }}>

      {/* Header */}
      <div style={{ padding:'52px 20px 20px' }}>
        <button onClick={()=>navigate(-1)}
          style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:12, padding:'8px 14px', color:'white', fontFamily:'Outfit', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:20 }}>
          <ArrowLeft size={15}/> Back
        </button>
        <div style={{ fontSize:24, fontWeight:900, color:'white', marginBottom:4 }}>🗺️ Scratch Map</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>
          Scratch off places you've explored
        </div>
      </div>

      {/* Progress bars */}
      <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:10 }}>
        {[
          { label:`🌍 World — ${visitedCountries.size}/${WORLD_COUNTRIES.length} countries`, pct:pctWorld, color:'#10B981' },
          { label:`🇮🇳 India — ${visitedStates.size}/29 states`, pct:pctIndia, color:'#F59E0B' },
        ].map(b=>(
          <div key={b.label}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>
              <span>{b.label}</span><span>{b.pct}%</span>
            </div>
            <div style={{ height:8, borderRadius:999, background:'rgba(255,255,255,0.1)' }}>
              <div style={{ height:'100%', width:`${b.pct}%`, borderRadius:999, background:b.color, transition:'width 1s ease' }}/>
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display:'flex', gap:8, padding:'0 20px 16px' }}>
        {[['world','🌍 World'],['india','🇮🇳 India']].map(([id,label])=>(
          <button key={id} onClick={()=>{ setActiveView(id); setSearch(''); }}
            style={{ flex:1, padding:'10px', borderRadius:12, border:`2px solid ${activeView===id?'#10B981':'rgba(255,255,255,0.15)'}`, background:activeView===id?'#10B981':'rgba(255,255,255,0.08)', color:'white', fontFamily:'Outfit', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 180ms' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding:'0 20px 16px' }}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder={activeView==='world'?'Search countries…':'Search states…'}
          style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.08)', color:'white', fontFamily:'Outfit', fontSize:14, outline:'none' }}/>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, padding:'0 20px 16px', flexWrap:'wrap' }}>
        {[['#10B981','Visited'],['#0EA5E9','Planned'],['rgba(255,255,255,0.08)','Not Yet']].map(([color,label])=>(
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:color, border:'1px solid rgba(255,255,255,0.2)' }}/>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* World View */}
      {activeView==='world'&&(
        <div style={{ padding:'0 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {filteredCountries.map(c=>{
              const isVisited = visitedCountries.has(c.name);
              const isPlanned = plannedCountries.has(c.name)&&!isVisited;
              return (
                <div key={c.name}
                  style={{ background:isVisited?'rgba(16,185,129,0.2)':isPlanned?'rgba(14,165,233,0.2)':'rgba(255,255,255,0.05)', borderRadius:14, padding:'14px 10px', textAlign:'center', border:`1.5px solid ${isVisited?'rgba(16,185,129,0.5)':isPlanned?'rgba(14,165,233,0.4)':'rgba(255,255,255,0.08)'}` }}>
                  <div style={{ fontSize:26 }}>{c.emoji}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:isVisited?'#6EE7B7':isPlanned?'#7DD3FC':'rgba(255,255,255,0.4)', marginTop:4, lineHeight:1.3 }}>{c.name}</div>
                  <div style={{ fontSize:8, fontWeight:700, marginTop:4, textTransform:'uppercase', letterSpacing:'0.05em', color:isVisited?'#10B981':isPlanned?'#0EA5E9':'rgba(255,255,255,0.2)' }}>
                    {isVisited?'✓ Visited':isPlanned?'Planned':'—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* India States View */}
      {activeView==='india'&&(
        <div style={{ padding:'0 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {filteredStates.map(s=>{
              const isVisited = visitedStates.has(s);
              const isPlanned = plannedStates.has(s)&&!isVisited;
              return (
                <div key={s}
                  style={{ background:isVisited?'rgba(16,185,129,0.2)':isPlanned?'rgba(14,165,233,0.2)':'rgba(255,255,255,0.05)', borderRadius:14, padding:'14px 10px', textAlign:'center', border:`1.5px solid ${isVisited?'rgba(16,185,129,0.5)':isPlanned?'rgba(14,165,233,0.4)':'rgba(255,255,255,0.08)'}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:isVisited?'#6EE7B7':isPlanned?'#7DD3FC':'rgba(255,255,255,0.5)', lineHeight:1.4 }}>{s}</div>
                  <div style={{ fontSize:8, fontWeight:700, marginTop:6, textTransform:'uppercase', letterSpacing:'0.05em', color:isVisited?'#10B981':isPlanned?'#0EA5E9':'rgba(255,255,255,0.2)' }}>
                    {isVisited?'✓ Visited':isPlanned?'Planned':'—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div style={{ margin:'20px 16px 0', background:'rgba(255,255,255,0.06)', borderRadius:18, padding:'20px', border:'1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Global Stats</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
          {[
            { val:visitedCountries.size, label:'Countries Visited', color:'#10B981' },
            { val:plannedCountries.size, label:'Countries Planned', color:'#0EA5E9' },
            { val:visitedStates.size,    label:'Indian States Visited', color:'#F59E0B' },
            { val:plannedStates.size,    label:'Indian States Planned', color:'#8B5CF6' },
          ].map(s=>(
            <div key={s.label} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'14px', textAlign:'center' }}>
              <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, marginTop:4, lineHeight:1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
