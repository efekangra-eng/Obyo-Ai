/**
 * High-quality sample candlestick charts represented as beautiful embedded SVG data URLs
 * to allow instant testing without having to look for an image.
 */

export interface SampleChartDesc {
  id: string;
  name: string;
  asset: string;
  timeframe: string;
  trendType: string;
  svgDataUrl: string;
  defaultPrice: number;
}

// Helper to create beautiful modular vector candletick chart images
function generateCandleChartSVG(trend: 'bullish' | 'bearish' | 'consolidation', pairs: string): string {
  const width = 500;
  const height = 300;
  const gridLines = Array.from({ length: 6 }, (_, i) => 50 + i * 40);
  
  // Custom deterministic candles based on trend style
  let candles = [];
  let y = trend === 'bullish' ? 220 : trend === 'bearish' ? 80 : 150;
  
  for (let i = 0; i < 20; i++) {
    const x = 30 + i * 23;
    let open = y;
    let change = 0;
    
    if (trend === 'bullish') {
      // General upward with some pullbacks
      change = i === 12 || i === 13 || i === 7 ? (Math.random() * 15 + 5) : -(Math.random() * 25 + 10);
    } else if (trend === 'bearish') {
      // General downward with small relief bounces
      change = i === 4 || i === 8 || i === 15 ? -(Math.random() * 15 + 5) : (Math.random() * 25 + 10);
    } else {
      // Horizontal ping pong, channel
      change = (i % 2 === 0 ? 1 : -1) * (Math.random() * 18 + 5);
    }
    
    let close = open + change;
    // ensure within boundaries
    if (close < 40) close = 45;
    if (close > 260) close = 255;
    
    const high = Math.min(open, close) - (Math.random() * 15 + 2);
    const low = Math.max(open, close) + (Math.random() * 15 + 2);
    const isGreen = close < open; // in SVG Y coordinate, lower value is higher price!
    
    candles.push({
      x,
      open,
      close,
      high,
      low,
      isGreen
    });
    y = close;
  }

  // Draw background details, grids, and MACD/RSI secondary pane curves
  const candlesText = candles.map(c => `
    <line x1="${c.x + 8}" y1="${c.high}" x2="${c.x + 8}" y2="${c.low}" stroke="${c.isGreen ? '#22c55e' : '#ef4444'}" stroke-width="2" />
    <rect x="${c.x}" y="${Math.min(c.open, c.close)}" width="16" height="${Math.max(1, Math.abs(c.open - c.close))}" fill="${c.isGreen ? '#22c55e' : '#ef4444'}" rx="1.5" />
  `).join('');

  const gridText = gridLines.map(g => `
    <line x1="10" y1="${g}" x2="${width - 10}" y2="${g}" stroke="#1e293b" stroke-dasharray="3,3" stroke-width="0.7" />
  `).join('');

  // Support/Resistance line guides
  const supportY = trend === 'bullish' ? 240 : trend === 'bearish' ? 260 : 180;
  const resistanceY = trend === 'bullish' ? 80 : trend === 'bearish' ? 100 : 70;

  const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background-color: #0b0f19;">
      <!-- Grid Background -->
      <rect width="${width}" height="${height}" fill="#0b0f19" />
      
      <!-- Chart borders & axes -->
      <line x1="20" y1="20" x2="20" y2="${height - 20}" stroke="#334155" stroke-width="1" />
      <line x1="20" y1="${height - 20}" x2="${width - 20}" y2="${height - 20}" stroke="#334155" stroke-width="1" />
      
      <!-- Horizontal Grid Lines -->
      ${gridText}

      <!-- Candlesticks rendering -->
      ${candlesText}

      <!-- Support & Resistance Reference Lines for extra clean look -->
      <line x1="20" y1="${supportY}" x2="${width - 20}" y2="${supportY}" stroke="#22c55e" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="4,4" />
      <line x1="20" y1="${resistanceY}" x2="${width - 20}" y2="${resistanceY}" stroke="#ef4444" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="4,4" />

      <!-- RSI / MACD sub-box indicators simulated at bottom -->
      <rect x="25" y="250" width="${width - 50}" height="40" fill="#0f172a" fill-opacity="0.8" stroke="#1e293b" stroke-width="1" rx="4" />
      <path d="M 30,270 Q 130,260 230,275 T 430,265" fill="none" stroke="#eab308" stroke-width="1.5" stroke-opacity="0.7" />
      <path d="M 30,280 Q 130,275 230,282 T 430,278" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-opacity="0.6" />

      <!-- Text markings -->
      <text x="30" y="240" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold">${pairs}</text>
      <text x="30" y="285" fill="#475569" font-family="'JetBrains Mono', monospace" font-size="8">RSI &amp; MACD Pane</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}

export const sampleCharts: SampleChartDesc[] = [
  {
    id: "btc-bull-flag",
    name: "BTC/USDT Boğa Bayrağı",
    asset: "BTC/USDT",
    timeframe: "5m",
    trendType: "Yukarı Yönlü Kırılım",
    svgDataUrl: generateCandleChartSVG('bullish', 'BTC/USDT (5 Dakika) - Trend Güçlü'),
    defaultPrice: 68450.00
  },
  {
    id: "eth-double-bottom",
    name: "ETH/USDT Çift Dip Testi",
    asset: "ETH/USDT",
    timeframe: "5m",
    trendType: "Destek Bölgesi Dönüşü",
    svgDataUrl: generateCandleChartSVG('consolidation', 'ETH/USDT (5 Dakika) - Akümülasyon'),
    defaultPrice: 3512.50
  },
  {
    id: "tsla-falling-wedge",
    name: "TSLA Düşen Takoz Kırılımı",
    asset: "TSLA",
    timeframe: "5m",
    trendType: "Geri Çekilme Sonrası Tepki",
    svgDataUrl: generateCandleChartSVG('bearish', 'TSLA (5 Dakika) - Düşen Kama Kırılım Sınırı'),
    defaultPrice: 178.20
  }
];
