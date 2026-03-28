// Below is shamelessly written by the clanker Gemini

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  Skull, 
  Zap, 
  Briefcase, 
  ShieldAlert, 
  Dices,
  AlertTriangle,
  Flame,
  Search,
  FastForward,
  Clock,
  PlayCircle,
  PlusCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

// --- Timer component to isolate clock updates ---
const TimerDisplay = memo(({ gameState, speed }) => {
  const [seconds, setSeconds] = useState(0);
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastUpdate.current) / 1000;
      lastUpdate.current = now;
      setSeconds(s => s + (delta * speed));
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, speed]);

  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  
  return (
    <span className="flex items-center gap-1.5 font-mono bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">
      <Clock size={12} className={speed > 1 ? "text-yellow-400 animate-pulse" : "text-indigo-400"} />
      {mins}:{secs < 10 ? `0${secs}` : secs}
    </span>
  );
});

// --- Player Card with Interaction Logic ---
const PlayerCard = memo(({ player, onKill, onConvert, onDraw, onPlayCard }) => (
  <div className={`bg-white border-2 p-4 rounded-2xl shadow-sm transition-all relative overflow-hidden ${!player.alive ? 'opacity-40 grayscale border-slate-200' : 'hover:border-indigo-400 border-white shadow-indigo-100/50'}`}>
    {!player.alive && (
      <div className="absolute inset-0 bg-slate-100/20 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
        <div className="rotate-12 border-4 border-red-600 text-red-600 font-black px-4 py-1 text-2xl uppercase tracking-widest opacity-80">DEAD</div>
      </div>
    )}

    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          {player.name} {player.fursona === 'Fox' && <span className="animate-bounce">🦊</span>}
        </h3>
        <p className="text-[10px] text-slate-400 font-mono">ID: {player.id.toString().padStart(3, '0')} • LVL {player.level}</p>
      </div>
      {player.alive && (
        <button onClick={() => onKill(player.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Eliminate">
          <Skull size={18} />
        </button>
      )}
    </div>

    {/* Hand UI */}
    <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-xl">
       <span className="text-[9px] font-bold text-slate-400 uppercase">Hand ({player.hand.length})</span>
       <div className="flex gap-1 overflow-x-hidden">
          {player.hand.slice(0, 3).map((c, i) => (
            <div key={i} className="w-4 h-6 bg-indigo-500 rounded-sm border border-indigo-600 shadow-sm" />
          ))}
          {player.hand.length > 3 && <span className="text-[10px] text-indigo-600 font-bold">+{player.hand.length - 3}</span>}
       </div>
       <button 
        onClick={() => onDraw(player.id)} 
        disabled={!player.alive}
        className="ml-auto p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg disabled:opacity-0"
       >
        <PlusCircle size={16} />
       </button>
    </div>

    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
        <span className="block text-[9px] text-slate-400 font-bold uppercase">Alpha</span>
        <span className="text-lg font-black text-indigo-600">{player.alpha}</span>
      </div>
      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
        <span className="block text-[9px] text-slate-400 font-bold uppercase">Beta</span>
        <span className="text-lg font-black text-purple-600">{player.beta}</span>
      </div>
      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
        <span className="block text-[9px] text-slate-400 font-bold uppercase">Gamma</span>
        <span className="text-lg font-black text-orange-600">{player.gamma}</span>
      </div>
    </div>

    {player.alive && (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button onClick={() => onConvert(player.id, 'beta')} disabled={player.alpha < 50} className="flex-1 text-[10px] font-bold bg-slate-100 text-slate-700 py-2 rounded-lg disabled:opacity-30 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">50α → 1β</button>
          <button onClick={() => onConvert(player.id, 'gamma')} disabled={player.beta < 50} className="flex-1 text-[10px] font-bold bg-slate-100 text-slate-700 py-2 rounded-lg disabled:opacity-30 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">50β → 1γ</button>
        </div>
        <button 
          onClick={() => onPlayCard(player.id)} 
          disabled={player.hand.length === 0}
          className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-indigo-600 disabled:opacity-20 transition-all active:scale-95"
        >
          <PlayCircle size={14} /> PLAY RANDOM CARD
        </button>
      </div>
    )}
  </div>
));

const App = () => {
  const [gameState, setGameState] = useState('menu'); 
  const [currentPhase, setCurrentPhase] = useState(1); // 1: Grinding, 2: Vote, 3: Work, 4: Endgame
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('points'); 
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [speed, setSpeed] = useState(1);

  const phases = [
    { id: 1, name: "Point Grinding", icon: <Trophy size={14} />, color: "bg-indigo-600" },
    { id: 2, name: "Secret Voting", icon: <Dices size={14} />, color: "bg-purple-600" },
    { id: 3, name: "The Wörk", icon: <Briefcase size={14} />, color: "bg-orange-600" },
    { id: 4, name: "Alligator Alcatraz", icon: <Skull size={14} />, color: "bg-red-600" }
  ];

  const cards = useMemo(() => [
    { id: '1c', name: 'Slightly Useless Character', type: 'Character', effect: (p) => ({ alpha: p.alpha + 10 }), msg: "gained 10 alpha!" },
    { id: '2c', name: '2', type: 'Character', effect: (p) => ({ alpha: p.alpha * 2 }), msg: "doubled their alpha!" },
    { id: '3c', name: "The Detective", type: 'Ability', effect: () => null, special: 'kill', msg: "executed a random rival!" },
    { id: '4c', name: "Broken Game", type: 'Ability', effect: (p) => ({ gamma: p.gamma + 5 }), msg: "hacked in 5 gamma points!" },
    { id: '5c', name: "Redistribution", type: 'Trap', effect: (p) => ({ alpha: Math.floor(p.alpha / 2) }), msg: "was taxed 50% of their alpha!" }
  ], []);

  const works = useMemo(() => [
    { name: 'Janitor', lv: 1, req: 'C:1', res: 'D:+1, C:-1' },
    { name: 'Gift', lv: 1, req: 'None', res: 'A:+6, B:+3, C:+1' },
    { name: 'Programmer', lv: 3, req: 'A:3, B:1, C:1', res: 'A:+2, D:+5, C:-1' },
    { name: 'Surgeon', lv: 4, req: 'A:6, B:3, D:3', res: 'D:+10, A:-3, C:-3' },
  ], []);

  const addLog = useCallback((msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10)), []);

  const initializeGame = useCallback((count) => {
    const newPlayers = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      alive: true,
      alpha: 0,
      beta: 0,
      gamma: 0,
      level: 1,
      hand: [],
      fursona: Math.random() > 0.85 ? 'Fox' : 'None'
    }));
    setPlayers(newPlayers);
    setGameState('playing');
    setCurrentPhase(1);
    addLog(`Game started with ${count} players.`);
  }, [addLog]);

  // --- Point Generation Loop ---
  useEffect(() => {
    if (gameState !== 'playing') return;
    const logicInterval = 100; 
    const interval = setInterval(() => {
      setPlayers(prev => {
        let changed = false;
        const next = prev.map(p => {
          if (!p.alive) return p;
          const adjustedProb = (0.15 * speed) / (1000 / logicInterval);
          const guaranteedPoints = Math.floor(adjustedProb);
          const remainderProb = adjustedProb - guaranteedPoints;
          let pointsToAdd = guaranteedPoints + (Math.random() < remainderProb ? 1 : 0);
          if (pointsToAdd > 0) {
            changed = true;
            return { ...p, alpha: p.alpha + pointsToAdd };
          }
          return p;
        });
        return changed ? next : prev;
      });
    }, logicInterval);
    return () => clearInterval(interval);
  }, [gameState, speed]);

  const convertPoints = useCallback((pId, type) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== pId) return p;
      if (type === 'beta' && p.alpha >= 50) return { ...p, alpha: p.alpha - 50, beta: p.beta + 1 };
      if (type === 'gamma' && p.beta >= 50) return { ...p, beta: p.beta - 50, gamma: p.gamma + 1 };
      return p;
    }));
  }, []);

  const killPlayer = useCallback((pId) => {
    setPlayers(prev => prev.map(p => p.id === pId ? { ...p, alive: false } : p));
    addLog(`Player ${pId} has been sent to Alligator Alcatraz.`);
  }, [addLog]);

  const drawCard = useCallback((pId) => {
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    setPlayers(prev => prev.map(p => p.id === pId ? { ...p, hand: [...p.hand, randomCard] } : p));
  }, [cards]);

  const playCard = useCallback((pId) => {
    setPlayers(prev => {
      const actor = prev.find(p => p.id === pId);
      if (!actor || actor.hand.length === 0) return prev;
      
      const cardToPlay = actor.hand[0];
      const newHand = actor.hand.slice(1);
      
      addLog(`${actor.name} played "${cardToPlay.name}" and ${cardToPlay.msg}`);

      // Handle special effects like killing someone else
      if (cardToPlay.special === 'kill') {
        const potentialVictims = prev.filter(p => p.alive && p.id !== pId);
        if (potentialVictims.length > 0) {
          const victim = potentialVictims[Math.floor(Math.random() * potentialVictims.length)];
          return prev.map(p => {
            if (p.id === pId) return { ...p, hand: newHand };
            if (p.id === victim.id) return { ...p, alive: false };
            return p;
          });
        }
      }

      // Handle simple stat updates
      return prev.map(p => {
        if (p.id === pId) {
          const updates = cardToPlay.effect(p);
          return { ...p, ...updates, hand: newHand };
        }
        return p;
      });
    });
  }, [addLog]);

  const nextPhase = () => {
    if (currentPhase < 4) {
      setCurrentPhase(prev => prev + 1);
      const phaseName = phases.find(ph => ph.id === currentPhase + 1).name;
      addLog(`ADMIN: Transitioning to Phase ${currentPhase + 1}: ${phaseName}`);
      
      // Auto-switch tabs to show relevant content
      if (currentPhase + 1 === 2) setActiveTab('theory');
      if (currentPhase + 1 === 3) setActiveTab('work');
    }
  };

  const speedOptions = [1, 2, 5, 10, 50];

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 text-center">
        <div className="bg-red-600 text-white px-4 py-1 rounded-full text-xs font-bold mb-4 animate-pulse uppercase tracking-widest">Administrative Measures v4.0</div>
        <h1 className="text-6xl font-black mb-2 italic tracking-tighter">patchworkBirb</h1>
        <p className="text-slate-400 mb-8 max-w-md italic opacity-60">Wait for the alligator to finish his coffee.</p>
        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
          <button onClick={() => initializeGame(12)} className="bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"><Users size={20} /> New Campaign (12)</button>
          <button onClick={() => initializeGame(24)} className="bg-slate-800 hover:bg-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"><Users size={20} /> Chaos Mode (24)</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      {/* Header with Phase Controller */}
      <header className="bg-white border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center shadow-sm shrink-0 gap-4 z-30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">PB</div>
          <div>
            <h2 className="font-black text-slate-800 leading-none mb-1">patchworkBirb</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Status: <span className="text-green-500 flex items-center gap-0.5"><ShieldCheck size={10}/> DRM Locked</span>
            </div>
          </div>
        </div>
        
        {/* Phase Navigator */}
        <div className="flex items-center bg-slate-100 rounded-2xl p-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {phases.map(ph => (
            <div 
              key={ph.id} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${currentPhase === ph.id ? `${ph.color} text-white shadow-md` : 'text-slate-400'}`}
            >
              {ph.icon}
              <span className="text-[10px] font-black uppercase tracking-tighter">{ph.name}</span>
            </div>
          ))}
          <button 
            onClick={nextPhase} 
            disabled={currentPhase === 4}
            className="ml-2 p-1.5 bg-white text-slate-800 rounded-lg hover:bg-indigo-500 hover:text-white transition-colors disabled:opacity-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border">
             <FastForward size={14} className={speed > 1 ? "text-orange-500" : "text-slate-300"} />
             <div className="flex gap-1">
                {speedOptions.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => setSpeed(opt)}
                    className={`px-2 py-0.5 rounded text-[9px] font-black transition-all ${speed === opt ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-100'}`}
                  >
                    {opt}x
                  </button>
                ))}
             </div>
          </div>
          <TimerDisplay gameState={gameState} speed={speed} />
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 flex overflow-x-auto shrink-0 no-scrollbar z-20">
        {[
          { id: 'points', label: 'Point Hierarchy', icon: <Trophy size={14} /> },
          { id: 'cards', label: 'Reference Deck', icon: <Zap size={14} /> },
          { id: 'theory', label: 'Secret Voting', icon: <Dices size={14} /> },
          { id: 'work', label: 'The Wörk', icon: <Briefcase size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-black transition-all uppercase tracking-wider whitespace-nowrap border-b-2 ${
              activeTab === tab.id ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 relative scroll-smooth bg-[#fdfdff]">
        {activeTab === 'points' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map(p => (
              <PlayerCard 
                key={p.id} 
                player={p} 
                onKill={killPlayer} 
                onConvert={convertPoints} 
                onDraw={drawCard}
                onPlayCard={playCard}
              />
            ))}
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="bg-white border rounded-2xl p-6 shadow-sm max-w-4xl mx-auto">
            <h3 className="font-black text-xl mb-4 flex items-center gap-2 uppercase tracking-tighter italic">DRM Card Registry</h3>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search card manual..." className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm" onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cards.filter(c => c.name.toLowerCase().includes(searchTerm)).map(card => (
                <div key={card.id} className="p-4 bg-slate-50 border rounded-2xl hover:border-indigo-200 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-slate-800 uppercase text-xs tracking-widest">{card.name}</span>
                    <span className="text-[9px] font-black uppercase tracking-tighter bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{card.type}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic opacity-80 group-hover:opacity-100">"{card.msg}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'theory' && (
          <div className="max-w-2xl mx-auto py-12 text-center">
            {currentPhase === 2 ? (
              <div className="space-y-6">
                <div className="bg-white border-4 border-dashed border-indigo-200 rounded-3xl p-12 shadow-2xl">
                  <Dices size={64} className="mx-auto text-indigo-500 mb-4 animate-spin-slow" />
                  <h3 className="text-3xl font-black mb-2 italic tracking-tighter">PART II: SECRET VOTING</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">If anyone outside your group sees this screen, the alligator wins immediately. Choose your binary outcome.</p>
                  <div className="grid grid-cols-2 gap-8">
                    {['Group Alpha', 'Group Beta'].map(group => (
                      <div key={group} className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-400">{group}</p>
                        <div className="flex gap-4 justify-center">
                          <button className="w-16 h-16 bg-slate-900 text-white rounded-2xl font-black text-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-90">0</button>
                          <button className="w-16 h-16 bg-slate-900 text-white rounded-2xl font-black text-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-90">1</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-3xl p-12 border border-slate-200">
                <ShieldAlert className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Phase Locked</h3>
                <p className="text-slate-400 text-sm mt-2">Finish Phase I (Point Grinding) to unlock the Secret Vote.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'work' && (
          <div className="max-w-4xl mx-auto space-y-4 py-6">
             <div className="bg-orange-600 text-white p-8 rounded-3xl shadow-xl shadow-orange-200 flex items-center justify-between mb-8 overflow-hidden relative">
               <div className="relative z-10">
                 <h3 className="text-4xl font-black italic tracking-tighter leading-none mb-2">PART III: WÖRK</h3>
                 <p className="text-orange-100 text-sm opacity-80">"Efficiency is the only currency left in the exclusion zone."</p>
               </div>
               <Briefcase className="absolute -right-4 -bottom-4 opacity-10" size={120} />
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {works.map((w, idx) => (
                 <div key={idx} className={`bg-white border rounded-3xl p-6 transition-all shadow-sm flex flex-col justify-between ${currentPhase >= 3 ? 'hover:shadow-lg border-white hover:border-orange-200 cursor-pointer' : 'opacity-40 grayscale pointer-events-none'}`}>
                   <div>
                     <div className="flex justify-between items-start mb-4">
                       <h4 className="font-black text-xl text-slate-800 italic uppercase">{w.name}</h4>
                       <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full border border-orange-200">LVL {w.lv}</span>
                     </div>
                     <div className="flex flex-col gap-1 mb-6">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requirement</p>
                       <p className="text-sm font-bold text-slate-600">{w.req}</p>
                     </div>
                   </div>
                   <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Output</p>
                        <p className="text-lg font-black font-mono text-green-600">{w.res}</p>
                      </div>
                      <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-orange-600 transition-all">EXECUTE</button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 p-4 fixed bottom-0 left-0 right-0 flex justify-between items-center text-[10px] z-50 border-t border-slate-800">
        <div className="flex gap-4 overflow-hidden mask-fade-right">
          {logs.map((log, i) => (
            <span key={i} className={`whitespace-nowrap font-mono ${i === 0 ? "text-indigo-400 font-bold" : "opacity-30"}`}>
              {log}
            </span>
          ))}
        </div>
        <div className="flex gap-4 shrink-0 font-black uppercase tracking-tighter">
          <span className="flex items-center gap-1.5 text-red-500 animate-pulse bg-red-500/10 px-3 py-1 rounded-lg">
            <AlertTriangle size={12} /> SYSTEM SECURED
          </span>
        </div>
      </footer>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .mask-fade-right { mask-image: linear-gradient(to right, black 80%, transparent 100%); }
      `}</style>
    </div>
  );
};

export default App;