
import React, { useState, useRef } from 'react';
import { Camera, Sparkles, Upload, ArrowRight, Loader2 } from 'lucide-react';

interface PetCreatorProps {
  onStartGeneration: (prompt: string, image?: string) => void;
  isGenerating: boolean;
}

const PetCreator: React.FC<PetCreatorProps> = ({ onStartGeneration, isGenerating }) => {
  const [prompt, setPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Strip metadata from base64 if it exists
    const base64Data = imagePreview?.split(',')[1];
    onStartGeneration(prompt, base64Data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Summon Your Companion</h2>
        <p className="text-slate-400">Describe your dream pet or upload an image as inspiration.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-32 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
            placeholder="A small neon blue phoenix with emerald eyes and golden tail feathers..."
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">Visual Reference (Optional)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors bg-slate-900/30 aspect-square flex items-center justify-center"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-8 h-8 text-slate-500 group-hover:text-blue-500 mx-auto mb-2" />
                  <span className="text-xs text-slate-500 group-hover:text-blue-400">Upload image</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div className="flex-[2] flex flex-col justify-end">
             <button
              type="submit"
              disabled={isGenerating || !prompt}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Manifesting...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Bring to Life
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PetCreator;
