
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analyzeHandwrittenNote } from './services/geminiService';
import NoteAnimator from './components/NoteAnimator';
import { AppState, NoteAnalysis, AnimationSettings } from './types';
import { 
  Loader2, Image as ImageIcon, Upload, 
  RotateCcw, Sparkles, Sliders, Eye, Zap, Trash2, AlertCircle
} from 'lucide-react';

const DEFAULT_IMAGE_URL = 'https://storage.googleapis.com/generativeai-downloads/images/handwritten_note.png';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isAnalyzing: false,
    isRevealing: false,
    isRecording: false,
    analysis: null,
    error: null,
    imageUrl: DEFAULT_IMAGE_URL,
    processedImageUrl: null,
    imageAspectRatio: 4/3,
    settings: {
      interval: 180,
      duration: 0.4,
      ghosting: 0.25,
      segmentDensity: 5,
      brightness: 100,
      contrast: 100,
    }
  });
  
  const [replayKey, setReplayKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setState(prev => ({ ...prev, imageAspectRatio: img.width / img.height }));
    };
    img.src = state.imageUrl;
  }, [state.imageUrl]);

  const bakeImageAdjustments = (): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.filter = `brightness(${state.settings.brightness}%) contrast(${state.settings.contrast}%)`;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(state.imageUrl);
          }
        } catch (e) {
          resolve(state.imageUrl);
        }
      };
      img.onerror = () => resolve(state.imageUrl);
      img.src = state.imageUrl;
    });
  };

  const handleAnalyze = async () => {
    if (!state.imageUrl) return;
    setState(prev => ({ ...prev, isAnalyzing: true, error: null, isRevealing: false }));
    
    try {
      const bakedImage = await bakeImageAdjustments();
      const result = await analyzeHandwrittenNote(bakedImage, state.settings.segmentDensity);
      
      if (!result.segments || result.segments.length === 0) {
        throw new Error("Could not find any clear handwriting. Try bumping up contrast.");
      }

      setState(prev => ({ 
        ...prev, 
        analysis: result, 
        isAnalyzing: false, 
        isRevealing: true,
        processedImageUrl: bakedImage
      }));
      setReplayKey(prev => prev + 1);
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err.message || "Something went wrong." 
      }));
    }
  };

  const updateSetting = (key: keyof AnimationSettings, value: number) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 flex flex-col items-center selection:bg-blue-100">
      <div className="max-w-6xl w-full flex flex-col gap-6">
        
        {/* Simple Header */}
        <div className="flex flex-col items-center text-center gap-1 mb-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-800">
            Handwritten <span className="text-blue-600">Animator</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ink Reveal Studio</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Settings Column */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Image Prep</span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <label>Contrast</label>
                      <span className="text-blue-600">{state.settings.contrast}%</span>
                    </div>
                    <input type="range" min="50" max="300" value={state.settings.contrast} onChange={(e) => updateSetting('contrast', Number(e.target.value))} className="w-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <label>Brightness</label>
                      <span className="text-blue-600">{state.settings.brightness}%</span>
                    </div>
                    <input type="range" min="50" max="200" value={state.settings.brightness} onChange={(e) => updateSetting('brightness', Number(e.target.value))} className="w-full" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Timing</span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <label>Interval</label>
                      <span className="text-slate-800 font-mono">{state.settings.interval}ms</span>
                    </div>
                    <input type="range" min="30" max="500" step="10" value={state.settings.interval} onChange={(e) => updateSetting('interval', Number(e.target.value))} className="w-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <label>Fade</label>
                      <span className="text-slate-800 font-mono">{state.settings.duration}s</span>
                    </div>
                    <input type="range" min="0.1" max="1.5" step="0.1" value={state.settings.duration} onChange={(e) => updateSetting('duration', Number(e.target.value))} className="w-full" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setState(s => ({...s, settings: {...s.settings, contrast: 100, brightness: 100, interval: 180, duration: 0.4}}))}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Reset Default
              </button>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 w-full space-y-4">
            {/* Input Bar */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-50">
                <ImageIcon className="w-4 h-4 text-slate-300 mr-2" />
                <input 
                  type="text" 
                  value={fileName ? `File: ${fileName}` : state.imageUrl}
                  onChange={(e) => {
                    setFileName(null);
                    setState(prev => ({ ...prev, imageUrl: e.target.value, analysis: null, isRevealing: false }));
                  }}
                  className="bg-transparent w-full outline-none text-[11px] font-medium text-slate-600"
                  placeholder="Paste Note URL..."
                />
              </div>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFileName(file.name);
                    const reader = new FileReader();
                    reader.onloadend = () => setState(prev => ({ ...prev, imageUrl: reader.result as string, analysis: null, isRevealing: false }));
                    reader.readAsDataURL(file);
                  }
                }} />
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-all">
                  <Upload className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleAnalyze} 
                  disabled={state.isAnalyzing || !state.imageUrl}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2"
                >
                  {state.isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {state.isAnalyzing ? "Reading..." : "Animate Note"}
                </button>
              </div>
            </div>

            {state.error && (
              <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3 rounded-xl flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" /> {state.error}
              </div>
            )}

            {/* Canvas Stage */}
            <div className="relative">
              {state.isRevealing && state.analysis && state.processedImageUrl ? (
                <div className="bg-white p-3 rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                  <NoteAnimator 
                    analysis={state.analysis} 
                    imageUrl={state.processedImageUrl} 
                    replayKey={replayKey}
                    settings={state.settings}
                    aspectRatio={state.imageAspectRatio}
                  />
                </div>
              ) : (
                <div 
                  className="bg-white rounded-[2rem] shadow-inner border border-slate-100 overflow-hidden flex items-center justify-center relative transition-all"
                  style={{ aspectRatio: `${state.imageAspectRatio}` }}
                >
                  {state.isAnalyzing ? (
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <div className="relative">
                        <Loader2 className="w-16 h-16 opacity-10 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Eye className="w-6 h-6" />
                        </div>
                      </div>
                      <p className="text-xs font-black uppercase tracking-tighter">AI Vision in progress</p>
                      <motion.div 
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-blue-500/20"
                      />
                    </div>
                  ) : state.imageUrl ? (
                    <div className="w-full h-full p-6 bg-slate-50 flex items-center justify-center">
                      <img 
                        src={state.imageUrl} 
                        alt="Preview" 
                        className="max-w-full max-h-full rounded-lg shadow-sm"
                        style={{ filter: `brightness(${state.settings.brightness}%) contrast(${state.settings.contrast}%)` }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-200">
                      <ImageIcon className="w-12 h-12" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em]">Drop a note to begin</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {state.isRevealing && (
              <div className="flex justify-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <button onClick={() => setReplayKey(k => k + 1)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" /> Replay
                </button>
                <button onClick={() => setState(s => ({ ...s, isRevealing: false, analysis: null }))} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-red-600 transition-all">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
