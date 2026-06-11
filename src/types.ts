/**
 * Type declarations for the Borsa Grafik Analiz application
 */

export interface IndicatorDetails {
  trend: string;
  pattern: string;
  rsi: string;
  macd: string;
  movingAverages: string;
}

export interface Annotation {
  type: "line" | "arrow" | "text" | string;
  color: string;
  label: string;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
}

export interface AnalysisResult {
  isValidChart?: boolean;
  direction: "YUKARI" | "ASAGI";
  confidence: number;
  reasoning: string;
  targetPrice: string;
  stopLoss: string;
  timeframe: string;
  indicators: IndicatorDetails;
  annotations: Annotation[];
  isSimulated?: boolean;
}

export interface TradeHistoryItem {
  id: string;
  timestamp: number;
  direction: "YUKARI" | "ASAGI";
  confidence: number;
  indicators: string;
  result: "KAZANDI" | "KAYBETTİ" | "BEKLİYOR";
  liked?: boolean;
  disliked?: boolean;
  chartImage: string; // Base64 or Sample Reference ID
  simulatedPricesHistory: number[];
  initialPrice: number;
  finalPrice?: number;
}
