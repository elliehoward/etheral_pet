import React, { useState, useEffect } from 'react';
import { AppState, PetProfile, PetStats, EvolutionStage } from './types';
import { generatePetImage, getPetSummary, getEvolutionSummary } from './geminiService';
import PetCreator from './components/PetCreator';
import PetView from './components/PetView';
import EvolutionCinematic from './components/EvolutionCinematic';
import { Sparkles, Heart, Ghost, Loader2, TrendingUp } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [activePet, setActivePet] = useState<PetProfile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  
  // Evolution Temp State
  const [evolutionData, setEvolutionData] = useState<{
    oldImg: string;
    newImg?: string;
    nextStage: string;
    targetPet?: PetProfile;
  } | null>(null);

  useEffect(() => {
    const savedPet = localStorage.getItem('aether_pet');
    const savedPrompt = localStorage.getItem('aether_prompt');
    if (savedPet) {
      setActivePet(JSON.parse(savedPet));
      setAppState(AppState.ACTIVE_PET);
    }
    if (savedPrompt) setInitialPrompt(savedPrompt);
  }, []);

  // Passive Stat Decay
  useEffect(() => {
    if (appState !== AppState.ACTIVE_PET || !activePet) return;

    const decayInterval = setInterval(() => {
      setActivePet(prev => {
        if (!prev) return null;
        
        // Slightly adjusted decay values for better gameplay feel
        const newStats = {
          hunger: Math.max(0, prev.stats.hunger - 1.2),
          happiness: Math.max(0, prev.stats.happiness - 0.7),
          energy: Math.max(0, prev.stats.energy - 1.0)
        };

        const updated = { ...prev, stats: newStats };
        localStorage.setItem('aether_pet', JSON.stringify(updated));
        return updated;
      });
    }, 12000); // Decay every 12 seconds

    return () => clearInterval(decayInterval);
  }, [appState, !!activePet]);

  const handleCreatePet = async (prompt: string, referenceImage?: string) => {
    setIsGenerating(true);
    setAppState(AppState.GENERATING);
    setInitialPrompt(prompt);
    localStorage.setItem('aether_prompt', prompt);
    setLoadingStep('Consulting the stars...');

    try {
      const summary = await getPetSummary(prompt);
      setLoadingStep('Sketching the ethereal form...');
      const imageUrl = await generatePetImage({ 
        prompt, 
        species: summary.species, 
        personality: summary.personality, 
        stage: 'Baby',
        selectedAccessories: [],
        environment: 'Celestial Garden'
      }, referenceImage);

      const newPet: PetProfile = {
        id: crypto.randomUUID(),
        name: summary.name,
        species: summary.species,
        personality: summary.personality,
        imageUrl,
        stats: { hunger: 80, happiness: 80, energy: 100 },
        stage: 'Baby',
        xp: 0,
        selectedAccessories: [],
        environment: 'Celestial Garden',
        discoveredFoods: [],
        discoveredPlay: [],
        discoveredRest: [],
        createdAt: Date.now()
      };

      setActivePet(newPet);
      localStorage.setItem('aether_pet', JSON.stringify(newPet));
      setAppState(AppState.ACTIVE_PET);
    } catch (error) {
      console.error("Generation failed:", error);
      alert("The cosmos are turbulent. Please try again later.");
      setAppState(AppState.CREATION);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateFullPet = async (updates: Partial<PetProfile>) => {
    if (!activePet) return;
    const updatedPet = { ...activePet, ...updates };
    
    const needsRegen = 
      (updates.selectedAccessories && JSON.stringify(updates.selectedAccessories) !== JSON.stringify(activePet.selectedAccessories)) ||
      (updates.environment && updates.environment !== activePet.environment);

    if (needsRegen) {
      setIsGenerating(true);
      setLoadingStep('Updating pet appearance...');
      try {
        const newImg = await generatePetImage({ ...updatedPet, prompt: initialPrompt });
        updatedPet.imageUrl = newImg;
      } catch (e) {
        console.error("Regen error", e);
      } finally {
        setIsGenerating(false);
      }
    }

    setActivePet(updatedPet);
    localStorage.setItem('aether_pet', JSON.stringify(updatedPet));
  };

  const handleEvolve = async () => {
    if (!activePet) return;
    
    let nextStage: EvolutionStage = 'Teen';
    if (activePet.stage === 'Teen') nextStage = 'Adult';
    if (activePet.stage === 'Adult') nextStage = 'Ancient';

    // Start Cinematic
    setAppState(AppState.EVOLVING);
    setEvolutionData({
      oldImg: activePet.imageUrl,
      nextStage,
    });

    try {
      const evolvedInfo = await getEvolutionSummary(activePet, nextStage);
      const newImageUrl = await generatePetImage({
        ...activePet,
        prompt: initialPrompt,
        stage: nextStage,
        species: evolvedInfo.species,
        personality: evolvedInfo.personality
      });

      const evolvedPet: PetProfile = {
        ...activePet,
        stage: nextStage,
        species: evolvedInfo.species,
        personality: evolvedInfo.personality,
        imageUrl: newImageUrl,
        stats: { hunger: 100, happiness: 100, energy: 100 },
        xp: 0 
      };

      setEvolutionData(prev => prev ? { ...prev, newImg: newImageUrl, targetPet: evolvedPet } : null);
    } catch (error) {
      console.error("Evolution failed:", error);
      alert("Evolution was interrupted by cosmic interference.");
      setAppState(AppState.ACTIVE_PET);
      setEvolutionData(null);
    }
  };

  const completeEvolution = () => {
    if (evolutionData?.targetPet) {
      setActivePet(evolutionData.targetPet);
      localStorage.setItem('aether_pet', JSON.stringify(evolutionData.targetPet));
    }
    setAppState(AppState.ACTIVE_PET);
    setEvolutionData(null);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to release this pet?")) {
      localStorage.removeItem('aether_pet');
      localStorage.removeItem('aether_prompt');
      setActivePet(null);
      setAppState(AppState.CREATION);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 relative overflow-hidden flex flex-col font-sans">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="relative z-10 w-full p-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">AetherPet AI</h1>
            <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mt-1">Advanced Companion OS</p>
          </div>
        </div>
        
        {appState === AppState.ACTIVE_PET && activePet && (
          <div className="flex items-center gap-4 px-4 py-1.5 bg-slate-900/60 rounded-full border border-white/5 shadow-2xl">
             <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black uppercase text-slate-400">{activePet.stage}</span>
             </div>
             <div className="w-px h-3 bg-slate-800"></div>
             <div className="text-xs font-black text-white">{activePet.name}</div>
          </div>
        )}
      </header>

      <main className="flex-1 relative z-10 flex flex-col justify-center py-4">
        {appState === AppState.WELCOME && (
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8 py-12">
            <h2 className="text-5xl sm:text-7xl font-black text-white leading-tight">
              Learn, Grow, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Discover Together.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Hatch an AI companion that learns your favorite foods, games, and ways to relax through real conversation.
            </p>
            <button onClick={() => setAppState(AppState.CREATION)} className="px-10 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl">
              Begin Manifestation
            </button>
          </div>
        )}

        {appState === AppState.CREATION && <PetCreator onStartGeneration={handleCreatePet} isGenerating={isGenerating} />}

        {appState === AppState.GENERATING && (
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2">{loadingStep}</h3>
              <p className="text-slate-500 text-sm animate-pulse">Consulting the digital aether...</p>
            </div>
          </div>
        )}

        {appState === AppState.ACTIVE_PET && activePet && (
          <PetView 
            pet={activePet} 
            onUpdateStats={(stats) => handleUpdateFullPet({ stats: { ...activePet.stats, ...stats } })}
            onUpdateFullPet={handleUpdateFullPet}
            onReset={handleReset}
            onEvolve={handleEvolve}
          />
        )}

        {appState === AppState.EVOLVING && evolutionData && (
          <EvolutionCinematic 
            petName={activePet?.name || 'Your Pet'} 
            oldImageUrl={evolutionData.oldImg}
            newImageUrl={evolutionData.newImg}
            targetStage={evolutionData.nextStage}
            onComplete={completeEvolution}
          />
        )}
      </main>

      <footer className="relative z-10 w-full p-4 text-center border-t border-white/5 backdrop-blur-sm">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
          Dynamic Memory • Conversational Learning • Living Appearance
        </p>
      </footer>

      {isGenerating && appState === AppState.ACTIVE_PET && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-white font-bold animate-pulse">{loadingStep}</p>
        </div>
      )}
    </div>
  );
};

export default App;