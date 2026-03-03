
export interface TextSegment {
  text: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
}

export interface NoteAnalysis {
  segments: TextSegment[];
}

export interface AnimationSettings {
  interval: number; // ms between segments
  duration: number; // seconds for fade
  ghosting: number; // 0 to 1
  segmentDensity: number; // 1 to 10 segments per line
  brightness: number; // 0 to 200%
  contrast: number; // 0 to 300%
}

export interface AppState {
  isAnalyzing: boolean;
  isRevealing: boolean;
  isRecording: boolean;
  analysis: NoteAnalysis | null;
  error: string | null;
  imageUrl: string;
  processedImageUrl: string | null; // The "baked" image sent to AI
  imageAspectRatio: number; // width / height
  settings: AnimationSettings;
}
