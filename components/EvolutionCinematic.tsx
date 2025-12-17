
import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, Stars, Orbit, Globe } from 'lucide-react';

interface EvolutionCinematicProps {
  petName: string;
  oldImageUrl: string;
  newImageUrl?: string;
  targetStage: string;
  onComplete: () => void;
}

const EvolutionCinematic: React.FC<EvolutionCinematicProps> = ({ 
  petName, 
  oldImageUrl, 
  newImageUrl, 
  targetStage, 
  onComplete 
}) => {
  const [phase, setPhase] = useState<'build-up' | 'transformation' | 'reveal'>('build-up');
  
  useEffect(() => {
    // Stage 1: Build-up (shaking and glowing)
    const t1 = setTimeout(() => setPhase('transformation'), 3500);
    
    // Stage 2: Transformation (white out)
    const t2 = setTimeout(() => {
      if (newImageUrl) setPhase('reveal');
    }, 8500); // Increased time for more "celestial manifestation" feel

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [newImageUrl]);

  const handleFinish = () => {
    if (phase === 'reveal') onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] evolution-void flex flex-col items-center justify-center overflow-hidden">
      {/* Cosmic Background FX - Persistent through all phases */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 blur-[100px] animate-nebula rounded-full" />
        
        {/* Twinkling Stars Background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle" 
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                '--twinkle-duration': `${Math.random() * 3 + 2}s`
              } as any} 
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 text-center space-y-8 w-full max-w-2xl px-6">
        {phase === 'build-up' && (
          <div className="space-y-6 animate-in fade-in duration-1000">
             <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter drop-shadow-lg uppercase">
                Synchronizing Essence...
             </h2>
             <div className="relative group flex items-center justify-center h-80 w-80 mx-auto">
                <div className="absolute inset-0 bg-blue-500/30 blur-[80px] rounded-full animate-pulse" />
                <div className="relative z-20 w-full h-full pet-mask">
                  <img 
                    src={oldImageUrl} 
                    alt="Evolving" 
                    className="w-full h-full object-contain brightness-110 animate-shake transition-all duration-3000" 
                  />
                </div>
             </div>
             <p className="text-blue-400 font-bold tracking-[0.4em] uppercase animate-pulse text-[10px]">
                Harnessing Cosmic Resonance
             </p>
          </div>
        )}

        {phase === 'transformation' && (
          <div className="flex flex-col items-center space-y-12 animate-in fade-in zoom-in duration-1000">
             {/* Galaxy Core */}
             <div className="relative w-96 h-96 flex items-center justify-center">
                <div className="absolute inset-0 bg-white/20 blur-[120px] rounded-full animate-pulse-ring scale-150" />
                <div className="absolute inset-0 bg-blue-400/20 blur-[100px] rounded-full animate-swirl" />
                
                {/* Orbiting Elements */}
                <div className="absolute inset-0 animate-swirl [animation-duration:8s]">
                   <Orbit className="absolute -top-4 left-1/2 w-10 h-10 text-blue-300 opacity-60" />
                   <Sparkles className="absolute -bottom-4 left-1/2 w-8 h-8 text-indigo-300 opacity-60" />
                </div>
                <div className="absolute inset-0 animate-swirl [animation-duration:12s] [animation-direction:reverse]">
                   <Stars className="absolute top-1/2 -right-4 w-8 h-8 text-purple-300 opacity-60" />
                   <Globe className="absolute top-1/2 -left-4 w-6 h-6 text-cyan-300 opacity-60" />
                </div>

                {/* Central Supernova */}
                <div className="relative z-30">
                  <div className="w-48 h-48 bg-white rounded-full blur-3xl animate-ping opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Zap className="w-32 h-32 text-white animate-flash drop-shadow-[0_0_30px_rgba(255,255,255,1)]" fill="currentColor" />
                  </div>
                </div>

                {/* Sparkling Particles */}
                {[...Array(12)].map((_, i) => (
                   <div 
                    key={i} 
                    className="absolute text-white animate-in zoom-in fade-in" 
                    style={{
                      top: `${50 + Math.sin(i * 30) * 45}%`,
                      left: `${50 + Math.cos(i * 30) * 45}%`,
                      transitionDelay: `${i * 100}ms`
                    }}
                   >
                     <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
                   </div>
                ))}
             </div>

             <div className="space-y-4">
                <h2 className="text-6xl font-black text-white tracking-[0.6em] drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-pulse">
                   MANIFESTING
                </h2>
                <div className="flex gap-4 justify-center">
                   {[...Array(8)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] animate-bounce" 
                        style={{ animationDelay: `${i * 0.15}s` }} 
                      />
                   ))}
                </div>
                <p className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-[9px] mt-4">
                  Merging cellular data with celestial aether
                </p>
             </div>
          </div>
        )}

        {phase === 'reveal' && (
          <div className="space-y-10 animate-scale-in">
             <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  <Stars className="w-6 h-6 text-yellow-300 animate-pulse" />
                  <Stars className="w-8 h-8 text-yellow-400 animate-bounce" />
                  <Stars className="w-6 h-6 text-yellow-300 animate-pulse" />
                </div>
                <h2 className="text-6xl sm:text-8xl font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] tracking-tight">
                   ASCENDED
                </h2>
                <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 rounded-full border border-blue-400/30 backdrop-blur-md">
                   <p className="text-lg text-white font-black tracking-wider uppercase">
                      {petName} <span className="text-blue-300">is now</span> {targetStage}
                   </p>
                </div>
             </div>

             <div className="relative py-8 flex items-center justify-center h-96 w-96 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-indigo-600/50 to-purple-600/30 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full animate-swirl" />
                <div className="relative z-20 w-full h-full pet-mask">
                  <img 
                    src={newImageUrl} 
                    alt="Evolved" 
                    className="w-full h-full object-contain drop-shadow-[0_0_60px_rgba(255,255,255,0.6)] animate-float" 
                  />
                </div>
             </div>

             <button 
               onClick={handleFinish}
               className="px-16 py-6 bg-white text-slate-950 font-black rounded-[2rem] hover:bg-blue-50 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] transform hover:scale-110 active:scale-95 group flex items-center gap-4 mx-auto border-t border-white/50"
             >
                <Sparkles className="w-6 h-6 text-blue-600 group-hover:rotate-12 transition-transform" />
                REJOIN THE AETHER
                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
             </button>
          </div>
        )}
      </div>

      {/* Screen Flash Overlay */}
      <div className={`fixed inset-0 bg-white pointer-events-none transition-opacity duration-[2000ms] ${phase === 'transformation' ? 'opacity-10' : 'opacity-0'}`} />
    </div>
  );
};

// Simple ChevronRight icon for the final button
const ChevronRight = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
);

export default EvolutionCinematic;
