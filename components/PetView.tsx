
import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, Utensils, Zap, MessageCircle, X, Shirt, Map, Sparkles, TrendingUp, Cookie, ChevronRight, CheckCircle2, Gamepad2, BedDouble, Wind, Target } from 'lucide-react';
import { PetProfile, ChatMessage, ACCESSORIES, ENVIRONMENTS, INITIAL_FOODS, INITIAL_PLAY, INITIAL_REST, CareItem } from '../types';
import { chatWithPet, extractCareItems } from '../geminiService';

interface PetViewProps {
  pet: PetProfile;
  onUpdateStats: (newStats: Partial<PetProfile['stats']>) => void;
  onUpdateFullPet: (newPet: Partial<PetProfile>) => void;
  onReset: () => void;
  onEvolve: () => void;
}

interface JoyIcon {
  id: string;
  type: string;
  x: number;
  y: number;
  expiresAt: number;
}

const PetView: React.FC<PetViewProps> = ({ pet, onUpdateStats, onUpdateFullPet, onReset, onEvolve }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'wardrobe' | 'travel' | 'care'>('chat');
  const [careSubTab, setCareSubTab] = useState<'food' | 'play' | 'rest'>('food');
  const [activeAnimation, setActiveAnimation] = useState<{ icon: string, type: string } | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<string | null>(null);
  const [newDiscovery, setNewDiscovery] = useState<CareItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Minigame States
  const [gameScore, setGameScore] = useState(0);
  const [joyIcons, setJoyIcons] = useState<JoyIcon[]>([]);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeTab]);

  // Breathing Minigame Logic (5-5-5)
  useEffect(() => {
    if (activeMinigame !== 'Guided Breath') return;

    const interval = setInterval(() => {
      setBreathPhase(prev => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeMinigame]);

  // Joy Collection Spawning & Expiry Logic
  useEffect(() => {
    if (activeMinigame !== 'Celestial Tapper') {
      setJoyIcons([]);
      return;
    }

    const spawnInterval = setInterval(() => {
      const types = ['⭐', '❤️', '😊', '✨'];
      const newIcon: JoyIcon = {
        id: Math.random().toString(36).substr(2, 9),
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * 70 + 15, // Keep slightly centered
        y: Math.random() * 70 + 15,
        expiresAt: Date.now() + 5000
      };
      setJoyIcons(prev => [...prev, newIcon]);
    }, 700);

    const expiryInterval = setInterval(() => {
      const now = Date.now();
      setJoyIcons(prev => prev.filter(icon => icon.expiresAt > now));
    }, 100);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(expiryInterval);
    };
  }, [activeMinigame]);

  const handleCollectJoy = (id: string) => {
    setJoyIcons(prev => prev.filter(icon => icon.id !== id));
    setGameScore(s => s + 1);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText;
    const userMsg: ChatMessage = { role: 'user', text: userText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Collect all current activity names for deduplication
      const allExistingNames = [
        ...INITIAL_FOODS, ...INITIAL_PLAY, ...INITIAL_REST,
        ...(pet.discoveredFoods || []), ...(pet.discoveredPlay || []), ...(pet.discoveredRest || [])
      ].map(i => i.name.toLowerCase());

      const [responseText, careItems] = await Promise.all([
        chatWithPet(pet, messages, userText),
        extractCareItems(userText, allExistingNames)
      ]);

      const petMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, petMsg]);
      
      const newFoods = [...(pet.discoveredFoods || [])];
      const newPlay = [...(pet.discoveredPlay || [])];
      const newRest = [...(pet.discoveredRest || [])];
      let lastFound: CareItem | null = null;

      careItems.forEach(item => {
        const lowerName = item.name.toLowerCase();
        // Frontend safeguard: check if the exact word exists within any current activity names
        const exists = allExistingNames.some(existing => 
          existing === lowerName || 
          existing.includes(lowerName) || 
          lowerName.includes(existing)
        );
        
        if (!exists) {
          if (item.category === 'food') newFoods.push(item);
          else if (item.category === 'play') newPlay.push(item);
          else if (item.category === 'rest') newRest.push(item);
          lastFound = item;
          // Add to tracked list so subsequent items in the same message are also deduplicated
          allExistingNames.push(lowerName);
        }
      });

      if (lastFound) {
        setNewDiscovery(lastFound);
        setTimeout(() => setNewDiscovery(null), 4000);
      }

      onUpdateFullPet({ 
        xp: pet.xp + 5,
        discoveredFoods: newFoods,
        discoveredPlay: newPlay,
        discoveredRest: newRest
      });
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCareAction = (item: CareItem) => {
    if (item.isMinigame) {
      setActiveMinigame(item.name);
      setGameScore(0);
      return;
    }

    setActiveAnimation({ icon: item.icon, type: item.category });
    setTimeout(() => setActiveAnimation(null), 2500);

    const statsUpdate: Partial<PetProfile['stats']> = {};
    if (item.category === 'food') {
      statsUpdate.hunger = Math.min(100, pet.stats.hunger + 20);
      statsUpdate.happiness = Math.min(100, pet.stats.happiness + 5);
    } else if (item.category === 'play') {
      statsUpdate.happiness = Math.min(100, pet.stats.happiness + 25);
      statsUpdate.energy = Math.max(0, pet.stats.energy - 15);
    } else if (item.category === 'rest') {
      statsUpdate.energy = Math.min(100, pet.stats.energy + 35);
      statsUpdate.hunger = Math.max(0, pet.stats.hunger - 10);
    }

    onUpdateFullPet({ 
      stats: { ...pet.stats, ...statsUpdate },
      xp: pet.xp + 10
    });
  };

  const finishMinigame = () => {
    const isTapper = activeMinigame === 'Celestial Tapper';
    const scoreBonus = isTapper ? Math.floor(gameScore * 1.5) : 15;
    
    onUpdateFullPet({ 
      stats: { 
        ...pet.stats, 
        happiness: Math.min(100, pet.stats.happiness + 20 + scoreBonus),
        energy: activeMinigame === 'Guided Breath' ? Math.min(100, pet.stats.energy + 40) : Math.max(0, pet.stats.energy - 10)
      },
      xp: pet.xp + 50 + scoreBonus
    });
    
    setActiveMinigame(null);
    setGameScore(0);
    setJoyIcons([]);
    setBreathPhase('Inhale');
  };

  const renderMinigame = () => {
    if (activeMinigame === 'Guided Breath') {
      return (
        <div className="absolute inset-0 z-[60] bg-[#050810]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000 overflow-hidden">
           {/* Celestial Background Twinkle */}
           <div className="absolute inset-0 pointer-events-none opacity-60">
             {[...Array(40)].map((_, i) => (
               <div key={i} className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle" style={{
                 top: `${Math.random() * 100}%`,
                 left: `${Math.random() * 100}%`,
                 '--twinkle-duration': `${Math.random() * 4 + 2}s`
               } as any} />
             ))}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-900/20 via-transparent to-cyan-900/20 blur-[100px] animate-swirl" />
           </div>

           <div className="relative z-10 mb-2">
             <Wind className="w-10 h-10 text-cyan-300 mb-4 mx-auto animate-pulse opacity-80" />
             <h3 className="text-2xl font-black text-white tracking-tight mb-1">Celestial Harmony</h3>
             <p className="text-cyan-400/50 uppercase tracking-[0.3em] font-bold text-[9px]">Triangle Rhythm: 5-5-5</p>
           </div>
           
           <div className="relative w-80 h-80 flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-cyan-500/5 rounded-full animate-pulse-ring" />
              <div className="w-32 h-32 bg-gradient-to-tr from-indigo-700 via-blue-600 to-cyan-400 rounded-full border-[4px] border-white/10 animate-triangle-breathing flex items-center justify-center shadow-[0_0_100px_rgba(34,211,238,0.25)]">
                 <div className="w-16 h-16 bg-white/5 rounded-full blur-2xl animate-pulse" />
                 <Sparkles className="absolute w-6 h-6 text-white/30" />
              </div>
           </div>

           <div className="relative z-10 space-y-1 pb-16">
             <div className="text-5xl font-black text-white tracking-[0.15em] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-500 uppercase">
                {breathPhase}
             </div>
             <p className="text-slate-500 text-xs font-medium tracking-wide">Sync your soul with {pet.name}</p>
           </div>
        </div>
      );
    }
    if (activeMinigame === 'Celestial Tapper') {
       return (
        <div className="absolute inset-0 z-[60] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-between p-8 text-center animate-in fade-in duration-500">
           {/* Header Stats */}
           <div className="w-full flex justify-between items-start">
              <div className="text-left">
                 <h3 className="text-2xl font-black text-white">Joy Collection</h3>
                 <p className="text-xs text-blue-400 uppercase tracking-widest font-bold">Session Active</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-5xl font-black text-white tabular-nums drop-shadow-lg">{gameScore}</div>
                <div className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">Joy Captured</div>
              </div>
           </div>
           
           {/* Large Game Area - Matches Pet Display Size */}
           <div className="relative w-full aspect-square max-w-[400px] flex items-center justify-center">
              {/* Pet Background (Faded) */}
              <div className="absolute inset-0 bg-blue-500/5 blur-[80px] rounded-full animate-pulse" />
              <img src={pet.imageUrl} className="w-full h-full object-contain p-4 opacity-30 grayscale blur-[1px]" alt="Pet background" />
              
              {/* Interactive Layer */}
              <div className="absolute inset-0 z-10">
                {joyIcons.map(icon => (
                  <button
                    key={icon.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCollectJoy(icon.id);
                    }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-5xl hover:scale-150 active:scale-90 transition-all cursor-pointer animate-in zoom-in spin-in-12 duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                    style={{ left: `${icon.x}%`, top: `${icon.y}%` }}
                  >
                    <div className="relative group">
                      <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150 group-hover:bg-white/40 transition-colors" />
                      <span className="relative z-20 block hover:rotate-12 transition-transform">{icon.type}</span>
                    </div>
                  </button>
                ))}
              </div>
           </div>

           <div className="pb-12">
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Capture icons before they vanish in 5 seconds</p>
           </div>
        </div>
       );
    }
    return null;
  };

  const toggleAccessory = (acc: string) => {
    const current = [...pet.selectedAccessories];
    const index = current.indexOf(acc);
    if (index > -1) current.splice(index, 1);
    else {
      if (current.length >= 2) current.shift();
      current.push(acc);
    }
    onUpdateFullPet({ selectedAccessories: current });
  };

  const StatBar = ({ label, value, icon: Icon, color }: any) => {
    const roundedValue = Math.round(value);
    return (
      <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
        <Icon className={`w-5 h-5 ${color} ${roundedValue < 20 ? 'animate-pulse' : ''}`} />
        <div className="flex-1">
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-bold">
            <span>{label}</span>
            <span className={roundedValue < 20 ? 'text-red-400 font-black' : ''}>{roundedValue}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-700 ${roundedValue < 20 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : color.replace('text-', 'bg-')}`} 
              style={{ width: `${roundedValue}%` }} 
            />
          </div>
        </div>
      </div>
    );
  };

  const getNextStageXp = () => {
    if (pet.stage === 'Baby') return 100;
    if (pet.stage === 'Teen') return 300;
    if (pet.stage === 'Adult') return 600;
    return 1000;
  };

  const canEvolve = pet.xp >= getNextStageXp() && pet.stats.happiness >= 80 && pet.stage !== 'Ancient';

  return (
    <div className="max-w-7xl mx-auto h-[85vh] grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
      {/* Left: Pet Visual & Stats */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
        <div className="relative flex-1 bg-gradient-to-b from-blue-900/20 to-indigo-900/20 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8">
          
          {renderMinigame()}

          {activeAnimation && (
            <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center">
               <div className="text-8xl animate-bounce mb-4">{activeAnimation.icon}</div>
               <div className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest animate-pulse">
                 {activeAnimation.type === 'food' ? 'Nourishing!' : activeAnimation.type === 'play' ? 'Active!' : 'Peaceful...'}
               </div>
               <div className="absolute inset-0">
                 {[...Array(6)].map((_, i) => (
                   <Heart key={i} className={`absolute w-6 h-6 text-pink-500 animate-ping`} style={{
                     top: `${Math.random() * 80 + 10}%`,
                     left: `${Math.random() * 80 + 10}%`,
                     animationDelay: `${i * 0.3}s`
                   }} />
                 ))}
               </div>
            </div>
          )}

          <button onClick={onReset} className="absolute top-4 right-4 p-2 bg-slate-900/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-all border border-white/5 z-20">
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-4 left-4 right-16 z-20">
             <div className="flex justify-between text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-1">
                <span>{pet.stage} {pet.species}</span>
                <span>{Math.round(pet.xp)} / {getNextStageXp()} XP</span>
             </div>
             <div className="h-1.5 w-full bg-blue-900/30 rounded-full overflow-hidden border border-blue-500/10">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-1000" style={{ width: `${Math.min(100, (pet.xp / getNextStageXp()) * 100)}%` }} />
             </div>
          </div>
          
          <div className={`relative z-10 w-full aspect-square max-w-[360px] transition-transform duration-500 ${activeAnimation || activeMinigame ? 'scale-110' : ''}`}>
             <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full animate-pulse"></div>
             <img src={pet.imageUrl} alt={pet.name} className={`w-full h-full object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] ${activeAnimation ? 'animate-bounce' : 'animate-float'}`} />
          </div>

          <div className="absolute bottom-6 w-full flex justify-center px-8 z-[70]">
            {activeMinigame ? (
              <button 
                onClick={finishMinigame} 
                className="w-full max-w-sm py-4 bg-gradient-to-r from-cyan-400 to-indigo-500 text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 animate-in slide-in-from-bottom-4 border border-white/20"
              >
                <Sparkles className="w-5 h-5 text-white/80" />
                {activeMinigame === 'Guided Breath' ? 'I feel calmer' : 'Claim Captured Joy'}
              </button>
            ) : (
              <div className="flex gap-4">
                <button onClick={() => { setActiveTab('care'); setCareSubTab('food'); }} className={`p-4 backdrop-blur-md border border-white/10 rounded-2xl transition-all hover:scale-110 ${activeTab === 'care' && careSubTab === 'food' ? 'bg-orange-500/30 border-orange-500 text-orange-400' : 'bg-white/5 text-white'}`}>
                  <Utensils className="w-6 h-6" />
                </button>
                <button onClick={() => { setActiveTab('care'); setCareSubTab('play'); }} className={`p-4 backdrop-blur-md border border-white/10 rounded-2xl transition-all hover:scale-110 ${activeTab === 'care' && careSubTab === 'play' ? 'bg-blue-500/30 border-blue-500 text-blue-400' : 'bg-white/5 text-white'}`}>
                  <Gamepad2 className="w-6 h-6" />
                </button>
                <button onClick={() => { setActiveTab('care'); setCareSubTab('rest'); }} className={`p-4 backdrop-blur-md border border-white/10 rounded-2xl transition-all hover:scale-110 ${activeTab === 'care' && careSubTab === 'rest' ? 'bg-indigo-500/30 border-indigo-500 text-indigo-400' : 'bg-white/5 text-white'}`}>
                  <BedDouble className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {canEvolve && (
            <button onClick={onEvolve} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-black rounded-full shadow-2xl animate-bounce flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> EVOLVE!
            </button>
          )}

          {newDiscovery && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Learned: {newDiscovery.icon} {newDiscovery.name}!
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <StatBar label="Happiness" value={pet.stats.happiness} icon={Heart} color="text-pink-500" />
          <StatBar label="Fullness" value={pet.stats.hunger} icon={Utensils} color="text-orange-500" />
          <StatBar label="Energy" value={pet.stats.energy} icon={Zap} color="text-yellow-500" />
        </div>
      </div>

      {/* Right: Interaction Tabs */}
      <div className="lg:col-span-7 flex flex-col h-full bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{pet.name}</h3>
              <p className="text-xs text-slate-400 italic">{pet.personality}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {[
              { id: 'chat', icon: MessageCircle, label: 'Chat' },
              { id: 'care', icon: Heart, label: 'Care' },
              { id: 'wardrobe', icon: Shirt, label: 'Style' },
              { id: 'travel', icon: Map, label: 'Worlds' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border ${activeTab === tab.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-50">
                    <MessageCircle className="w-12 h-12 text-blue-500" />
                    <p className="text-sm max-w-xs">Chat with {pet.name} about your day. They might suggest some healthy ways to play or rest!</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'}`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && <div className="flex gap-1 p-2 animate-pulse"><div className="w-2 h-2 bg-slate-500 rounded-full"></div><div className="w-2 h-2 bg-slate-500 rounded-full"></div><div className="w-2 h-2 bg-slate-500 rounded-full"></div></div>}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/80 border-t border-white/5 flex gap-2">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={`Tell ${pet.name} how you're feeling...`} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={!inputText.trim() || isTyping} className="p-2.5 bg-blue-600 text-white rounded-xl"><Send className="w-5 h-5" /></button>
              </form>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="h-full flex flex-col">
              <div className="flex border-b border-white/5 bg-slate-900/40">
                {(['food', 'play', 'rest'] as const).map(t => (
                  <button key={t} onClick={() => setCareSubTab(t)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${careSubTab === t ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
                {(careSubTab === 'food' ? [...INITIAL_FOODS, ...pet.discoveredFoods] : careSubTab === 'play' ? [...INITIAL_PLAY, ...pet.discoveredPlay] : [...INITIAL_REST, ...pet.discoveredRest]).map(item => (
                  <button key={item.name} onClick={() => handleCareAction(item)} className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left flex items-center gap-4 group">
                    <span className="text-3xl group-hover:scale-125 transition-transform">{item.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-200">{item.name}</div>
                      <div className="text-[9px] text-slate-500 uppercase font-black">{item.isMinigame ? '⚡ Minigame' : 'Wellness Choice'}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Share real-world wellness habits in chat to unlock items!</p>
              </div>
            </div>
          )}

          {activeTab === 'wardrobe' && (
            <div className="h-full p-6 overflow-y-auto grid grid-cols-2 gap-3">
              {ACCESSORIES.map(acc => {
                const isSelected = pet.selectedAccessories.includes(acc);
                return (
                  <button key={acc} onClick={() => toggleAccessory(acc)} className={`p-4 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${isSelected ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800/40 border-white/5 text-slate-400'}`}>
                    {acc} {isSelected && <Sparkles className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'travel' && (
            <div className="h-full p-6 overflow-y-auto space-y-3">
              {ENVIRONMENTS.map(env => (
                <button key={env.id} onClick={() => onUpdateFullPet({ environment: env.name })} className={`w-full p-4 rounded-2xl border text-left transition-all ${pet.environment === env.name ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800/40 border-white/5 text-slate-400'}`}>
                  <div className="font-bold text-sm">{env.name}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{env.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetView;
