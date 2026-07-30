// Challenges Page v2
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame } from 'lucide-react';
import {
  getTrips, getStreak, calcXP, getLevel,
  getChallengeProgress, getJournalEntries
} from '../utils/storage';

function XPBar({ xp, level }) {
  const prev = level.level === 1 ? 0 :
    level.level === 2 ? 300 :
    level.level === 3 ? 800 :
    level.level === 4 ? 2000 : 5000;
  const next = level.next ?? xp;
  const pct  = level.next ? Math.min(100, ((xp - prev) / (next - prev)) * 100) : 100;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:6 }}>
        <span>{xp.toLocaleString()} XP</span>
        <span>{level.next ? `${level.next.toLocaleString()} XP to next level` : 'Max Level! 🏆'}</span>
      </div>
      <div style={{ height:8, borderRadius:999, background:'rgba(255,255,255,0.2)', overflow:'hidden' }}>
        <motion.div
          initial={{ width:0 }}
          animate={{ width:`${pct}%` }}
          transition={{ duration:1.2, ease:'easeOut' }}
          style={{ height:'100%', borderRadius:999, background:'white' }}
        />
      </div>
    </div>
  );
}

const ACHIEVEMENTS = [
  { emoji:'🏆', name:'First Trip',        desc:'Create your first trip',          cond:(t)=>t>=1 },
  { emoji:'✈️', name:'Frequent Flyer',    desc:'Complete 3 trips',                cond:(_,__,___,____,_____,______,_______,________,comp)=>comp>=3 },
  { emoji:'🌏', name:'Globe Trotter',     desc:'Visit 3+ countries',              cond:(t,c)=>c>=3 },
  { emoji:'📸', name:'Memory Maker',      desc:'Upload 5+ photos',                cond:(t,c,p)=>p>=5 },
  { emoji:'🗺️', name:'Map Master',       desc:'Pin 10+ places',                  cond:(t,c,p,pins)=>pins>=10 },
  { emoji:'📅', name:'Long Hauler',       desc:'30+ travel days',                 cond:(t,c,p,pins,d)=>d>=30 },
  { emoji:'🇮🇳', name:'Desi Explorer',    desc:'Visit 3+ Indian states',          cond:(t,c,p,pins,d,s)=>s>=3 },
  { emoji:'🚲', name:'Bharat Yatri',      desc:'Visit 7+ Indian states',          cond:(t,c,p,pins,d,s)=>s>=7 },
  { emoji:'💰', name:'Budget Master',     desc:'Log 10+ expenses',                cond:(t,c,p,pins,d,s,e)=>e>=10 },
  { emoji:'🔥', name:'Streak Warrior',    desc:'Maintain a 5-day streak',         cond:(t,c,p,pins,d,s,e,acts,j,str)=>str>=5 },
  { emoji:'🌍', name:'Continent Jumper',  desc:'Visit 5+ countries',              cond:(t,c)=>c>=5 },
  { emoji:'📖', name:'Storyteller',       desc:'Write 3+ journal entries',        cond:(t,c,p,pins,d,s,e,acts,j)=>j>=3 },
  { emoji:'🎯', name:'Activity Guru',     desc:'Log 20+ activities',              cond:(t,c,p,pins,d,s,e,acts)=>acts>=20 },
  { emoji:'⭐', name:'Five Star Traveller',desc:'Create 5+ trips',                cond:(t)=>t>=5 },
  { emoji:'🧭', name:'Explorer',          desc:'Pin 5+ places on map',            cond:(t,c,p,pins)=>pins>=5 },
  { emoji:'🏅', name:'Legend',            desc:'10 trips & 5 countries',          cond:(t,c)=>t>=10&&c>=5 },
];

export default function Challenges() {
  const navigate = useNavigate();
  const [trips,      setTrips]      = useState([]);
  const [streak,     setStreak]     = useState({ count:0 });
  const [challenges, setChallenges] = useState([]);
  const [tab,        setTab]        = useState('challenges');
  const [journal,    setJournal]    = useState({});

  useEffect(() => {
    const t = getTrips();
    const s = getStreak();
    const j = getJournalEntries();
    setTrips(t);
    setStreak(s);
    setJournal(j);
    setChallenges(getChallengeProgress(t, s, j));
  }, []);

  const xp    = calcXP(trips);
  const level = getLevel(xp);

  const totalTrips = trips.length;
  const countries  = [...new Set(trips.map(t => t.country).filter(Boolean))].length;
  const photos     = trips.reduce((s,t)=>s+(t.highlights||[]).length,0);
  const pins       = trips.reduce((s,t)=>s+(t.pins||[]).length,0);
  const days       = trips.reduce((s,t)=>{
    if(!t.startDate||!t.endDate) return s;
    return s+Math.ceil((new Date(t.endDate)-new Date(t.startDate))/864e5);
  },0);
  const states     = [...new Set(trips.map(t=>t.stateOfIndia).filter(Boolean))].length;
  const expenses   = trips.reduce((s,t)=>s+(t.expenses||[]).length,0);
  const activities = trips.reduce((s,t)=>s+(t.days||[]).reduce((a,d)=>a+(d.activities||[]).length,0),0);
  const completed  = trips.filter(t=>t.status==='completed').length;
  const journalCount = Object.keys(journal).length;

  const doneChallenges = challenges.filter(c=>c.done).length;

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', paddingBottom:80 }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${level.color}, #1E293B)`, padding:'52px 20px 28px', color:'white' }}>
        <button onClick={()=>navigate(-1)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:12, padding:'8px 14px', color:'white', fontFamily:'Outfit', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:20 }}>
          <ArrowLeft size={15}/> Back
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, flexShrink:0 }}>
            {level.emoji}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, opacity:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Level {level.level}</div>
            <div style={{ fontSize:26, fontWeight:900 }}>{level.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
              <Flame size={14} color="#FCD34D" fill="#FCD34D"/>
              <span style={{ fontSize:13, fontWeight:700 }}>{streak.count} day streak</span>
              <span style={{ fontSize:12, opacity:0.7, marginLeft:8 }}>⚡ {xp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
        <XPBar xp={xp} level={level}/>
      </div>

      {/* Stats Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, padding:'16px 16px 0' }}>
        {[
          { icon:'✈️', val:totalTrips,   label:'Trips' },
          { icon:'🌍', val:countries,    label:'Countries' },
          { icon:'🔥', val:streak.count, label:'Streak' },
          { icon:'⚡', val:xp,           label:'XP' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white', borderRadius:16, padding:'14px 8px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', border:'1.5px solid #E2E8F0' }}>
            <div style={{ fontSize:20 }}>{s.icon}</div>
            <div style={{ fontSize:17, fontWeight:900, color:'#0F172A', marginTop:3 }}>{typeof s.val==='number'?s.val.toLocaleString():s.val}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.04em', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, padding:'14px 16px 0' }}>
        {[['challenges','🎯 Challenges'],['achievements','🏅 Badges']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ flex:1, padding:'10px 14px', borderRadius:12, border:`2px solid ${tab===id?level.color:'#E2E8F0'}`, background:tab===id?level.color:'white', color:tab===id?'white':'#64748B', fontFamily:'Outfit', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 180ms' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Challenges */}
      {tab==='challenges'&&(
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
            {doneChallenges}/{challenges.length} Completed
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {challenges.map((c,i)=>(
              <motion.div key={c.id}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                style={{ background:'white', borderRadius:18, padding:'16px 18px', border:`1.5px solid ${c.done?'#D1FAE5':'#E2E8F0'}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:c.done?'#ECFDF5':'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {c.done?'✅':c.emoji}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ fontWeight:800, fontSize:14, color:'#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:c.done?'#10B981':'#94A3B8' }}>{c.current}/{c.target}</div>
                    </div>
                    <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{c.desc}</div>
                    <div style={{ marginTop:8, height:6, borderRadius:999, background:'#F1F5F9', overflow:'hidden' }}>
                      <motion.div
                        initial={{ width:0 }} animate={{ width:`${(c.current/c.target)*100}%` }} transition={{ duration:0.8, delay:i*0.04 }}
                        style={{ height:'100%', borderRadius:999, background:c.done?'#10B981':level.color }}/>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {tab==='achievements'&&(
        <div style={{ padding:'14px 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
            {ACHIEVEMENTS.map((a,i)=>{
              const unlocked = a.cond(totalTrips, countries, photos, pins, days, states, expenses, activities, journalCount, streak.count, completed);
              return (
                <motion.div key={a.name}
                  initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.04 }}
                  style={{ background:unlocked?'white':'#F8FAFC', borderRadius:18, padding:'18px 14px', textAlign:'center', border:`1.5px solid ${unlocked?'#D1FAE5':'#E2E8F0'}`, opacity:unlocked?1:0.5, boxShadow:unlocked?'0 2px 12px rgba(16,185,129,0.12)':'none' }}>
                  <div style={{ fontSize:32, marginBottom:6 }}>{unlocked?a.emoji:'🔒'}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:unlocked?'#0F172A':'#94A3B8' }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>{a.desc}</div>
                  {unlocked&&<div style={{ marginTop:8, fontSize:10, fontWeight:700, color:'#10B981', textTransform:'uppercase', letterSpacing:'0.05em' }}>✓ Unlocked</div>}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
