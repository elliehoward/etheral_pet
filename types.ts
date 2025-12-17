
export interface PetStats {
  hunger: number;
  happiness: number;
  energy: number;
}

export type EvolutionStage = 'Baby' | 'Teen' | 'Adult' | 'Ancient';

export interface CareItem {
  name: string;
  icon: string;
  category: 'food' | 'play' | 'rest';
  isMinigame?: boolean;
}

export interface PetProfile {
  id: string;
  name: string;
  species: string;
  personality: string;
  imageUrl: string;
  stats: PetStats;
  stage: EvolutionStage;
  xp: number;
  selectedAccessories: string[];
  environment: string;
  discoveredFoods: CareItem[];
  discoveredPlay: CareItem[];
  discoveredRest: CareItem[];
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppState {
  WELCOME = 'WELCOME',
  CREATION = 'CREATION',
  GENERATING = 'GENERATING',
  ACTIVE_PET = 'ACTIVE_PET',
  EVOLVING = 'EVOLVING'
}

export const ACCESSORIES = [
  "Wizard Hat", "Cyberpunk Visor", "Royal Crown", "Silk Bow Tie", 
  "Explorer's Vest", "Neon Collar", "Steampunk Goggles", 
  "Flower Crown", "Heroic Cape", "Pirate Eye Patch"
];

export const ENVIRONMENTS = [
  { id: "garden", name: "Celestial Garden", desc: "Floating islands with glowing flora" },
  { id: "city", name: "Cyberpunk City", desc: "Neon-soaked skyscrapers and rain" },
  { id: "temple", name: "Ancient Temple", desc: "Mossy stone ruins with warm sunbeams" },
  { id: "cave", name: "Crystal Cave", desc: "Vibrant glowing minerals and stalactites" },
  { id: "ocean", name: "Oceanic Abyss", desc: "Corals, bubbles, and deep bioluminescence" }
];

export const INITIAL_FOODS: CareItem[] = [
  { name: "Crisp Apple", icon: "🍎", category: 'food' },
  { name: "Fresh Water", icon: "💧", category: 'food' },
  { name: "Honey Tea", icon: "🍵", category: 'food' }
];

export const INITIAL_PLAY: CareItem[] = [
  { name: "Celestial Tapper", icon: "🎯", category: 'play', isMinigame: true },
  { name: "Daily Stretch", icon: "🧘", category: 'play' },
  { name: "Quick Drawing", icon: "🎨", category: 'play' }
];

export const INITIAL_REST: CareItem[] = [
  { name: "Guided Breath", icon: "🌬️", category: 'rest', isMinigame: true },
  { name: "Reading Break", icon: "📖", category: 'rest' },
  { name: "Power Nap", icon: "😴", category: 'rest' }
];
