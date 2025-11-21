
export enum TimelinePhase {
  INPUT = 'INPUT',
  PAST = 'PAST',
  PRESENT = 'PRESENT',
  FUTURE = 'FUTURE',
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  date?: string;
  imageUrl?: string; // Calculated based on title hash or provided
  originalLanguage: string;
}

export interface PresentAnalysis {
  summaryTitle: string;
  overview: string; // Summary of the month
  detailedAnalysis: string; // Deeper insights
  keyThemes: { title: string; description: string; icon: string }[];
  sentimentScore: number; // 0 to 100
}

export interface FuturePrediction {
  scenarioTitle: string;
  probability: string;
  description: string;
  nearTermEvents: { timeframe: string; event: string }[]; // Next 12 months
  distantVision: { title: string; description: string }; // Distant future
  visualPrompt: string;
}

export interface LoadingState {
  isSearching: boolean;
  isAnalyzing: boolean;
  isPredicting: boolean;
  isTranslating: boolean;
}
