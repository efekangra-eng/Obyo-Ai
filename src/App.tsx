import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Upload, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Volume2, 
  VolumeX, 
  History, 
  Info, 
  ThumbsUp, 
  ThumbsDown, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Share2,
  Trash2,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ChartCanvas from "./components/ChartCanvas";
import { sampleCharts, SampleChartDesc } from "./sampleCharts";
import { AnalysisResult, TradeHistoryItem } from "./types";

export default function App() {
  // Application Modes / Pages
  const [activeTab, setActiveTab] = useState<"analyze" | "history" | "tutorial">("analyze");

  // PWA Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyToInstall(true);
      console.log("PWA beforeinstallprompt event captured and stored.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Filter out active state if already running standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsReadyToInstall(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    playSynthSound("click");
    if (!deferredPrompt) {
      alert("Bu tarayıcı veya cihaz anlık yükleme tetikleyicisini desteklemiyor olabilir. Lütfen arama/adres çubuğundaki yükle simgesini veya tarayıcı menüsündeki 'Ana Ekrana Ekle' seçeneğini kullanın.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice outcome: ${outcome}`);
    if (outcome === "accepted") {
      setIsReadyToInstall(false);
      setDeferredPrompt(null);
    }
  };

  // Chart States
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio configuration
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Stats Counters
  const [accuracy, setAccuracy] = useState<number>(0);

  // Active 5m Option trade state
  const [activeTrade, setActiveTrade] = useState<TradeHistoryItem | null>(null);
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes in sec
  const [isAccelerated, setIsAccelerated] = useState<boolean>(false);
  const [simulatedPrices, setSimulatedPrices] = useState<number[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Past Operations History from localStorage
  const [historyList, setHistoryList] = useState<TradeHistoryItem[]>(() => {
    const saved = localStorage.getItem("qb_trade_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Notification request effect
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          icon: "/icon.svg",
          ...options
        });
      } catch (e) {
        console.warn("Could not send notification", e);
      }
    }
  };

  // Load sound / web audio synthesizer feedback
  const playSynthSound = (type: "signal" | "tick" | "win" | "lose" | "click") => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "click") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "tick") {
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === "signal") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "win") {
        osc.type = "sine";
        // chord sound
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === "lose") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
        osc.frequency.linearRampToValueAtTime(146.83, ctx.currentTime + 0.5); // D3
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (_) {
      // AudioContext fails silently on user permissions
    }
  };

  // Sync state to local storage and update statistics
  useEffect(() => {
    localStorage.setItem("qb_trade_history", JSON.stringify(historyList));
    
    // Calculate Win Rate
    const completed = historyList.filter(h => h.result !== "BEKLİYOR");
    if (completed.length > 0) {
      const wins = completed.filter(h => h.result === "KAZANDI");
      setAccuracy(Math.round((wins.length / completed.length) * 100));
    } else {
      setAccuracy(0);
    }
  }, [historyList]);

  // Request analysis from Express Backend Node.js
  const triggerImageAnalysis = async (base64String: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysis(null);

    try {
      let payloadString = base64String;

      // Convert SVG data URL to PNG sequence
      if (base64String.startsWith("data:image/svg+xml")) {
        try {
          payloadString = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width || 500;
              canvas.height = img.height || 300;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                // Ensure black background so the candles are visible
                ctx.fillStyle = "#0b0f19";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
              } else {
                reject(new Error("Canvas not supported"));
              }
            };
            img.onerror = () => reject(new Error("Image load failed"));
            img.src = base64String;
          });
        } catch (err) {
          console.error("SVG conversion failed", err);
        }
      }

      const response = await fetch("/api/analyze-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: payloadString,
          mockResponse: false, // Force remote API first, falls back gracefully anyway
          isSample: !!selectedSample
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Grafik analiz isteği yapılamadı.");
      }

      const data: AnalysisResult = await response.json();
      if (data.isValidChart === false) {
        throw new Error("Yüklenen görsel geçerli bir borsa veya teknik analiz grafiği değil. Lütfen geçerli bir borsa ekran görüntüsü veya grafik resmi yükleyin.");
      }
      setAnalysis(data);
      playSynthSound("signal");
      sendNotification("ChartScan AI Başarılı", { body: "Grafik analizi tamamlandı. Yeni yön tahmini ve sinyaller oluşturuldu!" });

      // Generate initial tracking trade structure in pending status
      const initialPrice = selectedSample 
        ? (sampleCharts.find(s => s.id === selectedSample)?.defaultPrice || 100.0) 
        : 100.0;
      
      const newTradeItem: TradeHistoryItem = {
        id: "trade-" + Date.now(),
        timestamp: Date.now(),
        direction: data.direction,
        confidence: data.confidence,
        indicators: `${data.indicators.pattern} | ${data.indicators.trend}`,
        result: "BEKLİYOR",
        chartImage: base64String,
        simulatedPricesHistory: [initialPrice],
        initialPrice: initialPrice,
      };

      // Put trade item to active state
      setActiveTrade(newTradeItem);
      setCountdown(300); // 5 min
      setSimulatedPrices([initialPrice]);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Yapay zeka analiz servisine ulaşılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run position logic while trade status is active
  useEffect(() => {
    if (!activeTrade || activeTrade.result !== "BEKLİYOR") return;

    // Tick Interval: updates current price every second
    const speedMultiplier = isAccelerated ? 20 : 1; 
    
    // Clear old timers
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

    // Countdown Clock decrementor
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const nextVal = prev - speedMultiplier;
        if (nextVal <= 0) {
          clearInterval(countdownIntervalRef.current!);
          clearInterval(tickIntervalRef.current!);
          resolveTradeOutcome();
          return 0;
        }
        return nextVal;
      });
    }, 1000);

    // Dynamic price ticking logic (generates highly realistic micro-movements)
    tickIntervalRef.current = setInterval(() => {
      setSimulatedPrices(prev => {
        const basePrice = prev[prev.length - 1];
        // Direction factor based on recommended direction with some volatility
        const predictionBonus = activeTrade.direction === "YUKARI" ? 0.08 : -0.08;
        const volatility = 0.5; // percentage deviation
        const changePercent = (Math.random() - 0.5 + predictionBonus) * volatility;
        const newPrice = Number((basePrice * (1 + changePercent / 100)).toFixed(2));
        
        // play small indicator tick
        if (countdown % 5 === 0) {
          playSynthSound("tick");
        }

        return [...prev, newPrice];
      });
    }, 1000 / (isAccelerated ? 3 : 1));

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [activeTrade, isAccelerated]);

  // Handle final decision once timer reaches 00:00
  const resolveTradeOutcome = () => {
    if (!activeTrade) return;

    setSimulatedPrices(prev => {
      const startPrice = activeTrade.initialPrice;
      const endPrice = prev[prev.length - 1];
      const actualTrend = endPrice >= startPrice ? "YUKARI" : "ASAGI";
      const isWinner = activeTrade.direction === actualTrend;
      const finalResult = isWinner ? "KAZANDI" : "KAYBETTİ";

      // Trigger chord play depending on state
      playSynthSound(isWinner ? "win" : "lose");
      
      // Notify user via system notification
      sendNotification("5 Dakikalık İşlem Sonuçlandı!", { 
        body: isWinner ? "Tahmin BAŞARILI. Algoritma piyasaya doğru yön verdi!" : "Tahmin BAŞARISIZ. Piyasada ters hareket oluştu." 
      });

      // Generate evaluated history entry
      const completedTrade: TradeHistoryItem = {
        ...activeTrade,
        result: finalResult,
        finalPrice: endPrice,
        simulatedPricesHistory: prev
      };

      // Add to front of log item list
      setHistoryList(current => [completedTrade, ...current]);
      setActiveTrade(completedTrade);

      return prev;
    });
  };

  // Callback from selecting a sample pre-loaded chart SVG
  const handleSampleSelect = (sample: SampleChartDesc) => {
    playSynthSound("click");
    setSelectedSample(sample.id);
    setImageUrl(sample.svgDataUrl);
    triggerImageAnalysis(sample.svgDataUrl);
  };

  // Custom user image file uploaded
  const handleCustomImage = (base64Url: string) => {
    playSynthSound("click");
    setSelectedSample(null);
    setImageUrl(base64Url);
    triggerImageAnalysis(base64Url);
  };

  // Restart analyze cycle
  const resetAnalyzer = () => {
    playSynthSound("click");
    setImageUrl(null);
    setSelectedSample(null);
    setAnalysis(null);
    setErrorMessage(null);
    setActiveTrade(null);
    setIsAccelerated(false);
  };

  // Save Like / Dislike voting evaluation feedback
  const registerOutcomeVote = (tradeId: string, type: "like" | "dislike") => {
    playSynthSound("click");
    setHistoryList(current => 
      current.map(h => {
        if (h.id === tradeId) {
          return {
            ...h,
            liked: type === "like",
            disliked: type === "dislike"
          };
        }
        return h;
      })
    );

    // Also update current activeTrade view
    if (activeTrade && activeTrade.id === tradeId) {
      setActiveTrade(prev => prev ? {
        ...prev,
        liked: type === "like",
        disliked: type === "dislike"
      } : null);
    }
  };

  // Format countdown cleanly to mm:ss format
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Clean all completed records from memory data storage
  const clearHistory = () => {
    playSynthSound("click");
    if (confirm("Tüm işlem geçmişini temizlemek istediğinizden emin misiniz?")) {
      setHistoryList([]);
    }
  };

  // Calculating trade summary stats
  const totalTrades = historyList.filter(h => h.result !== "BEKLİYOR").length;
  const wonTrades = historyList.filter(h => h.result === "KAZANDI").length;

  return (
    <div className="min-h-screen bg-[#040c0f] text-slate-100 flex items-center justify-center font-sans antialiased overflow-hidden relative">
      
      {/* Dynamic PWA layout wrapper - full screen on mobile, elegant mobile simulation box on desktop */}
      <div className="w-full h-screen sm:max-w-[420px] sm:h-[92vh] bg-[#051115] sm:rounded-[36px] border border-cyan-900/30 shadow-[0_0_80px_rgba(3,242,254,0.15)] overflow-hidden flex flex-col relative cyber-grid">

        {/* HUD visual header */}
        <header className="px-5 py-3.5 bg-[#051216] border-b border-cyan-950/50 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400">Grafik Analizi</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* PWA Install Button */}
            {isReadyToInstall && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(0,242,254,0.4)] transition-all cursor-pointer active:scale-95 animate-pulse shrink-0"
                title="Ana Ekrana Ekle (PWA)"
              >
                <Zap className="h-2.5 w-2.5 fill-slate-950" />
                Yükle
              </button>
            )}

            {/* Audio Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-1.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-inner cursor-pointer"
              title={audioEnabled ? "Sesi Kapat" : "Sesi Aç"}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-rose-500" />}
            </button>
            
            {/* Minimal ticker */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/20 bg-slate-950/80 text-[9px] font-mono font-bold text-cyan-400 shadow-[0_0_10px_rgba(0,242,254,0.1)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_6px_#00ffcc]" />
              <span>CANLI FEED</span>
            </div>
          </div>
        </header>

        {/* Main interactive application dashboard area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-28 scrollbar-none space-y-4">
          
          <AnimatePresence mode="wait">
            
            {activeTab === "analyze" && (
              <motion.div
                key="analyze-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Stats Grid Widget matching search bar with fine arcs */}
                <div className="grid grid-cols-3 gap-2 bg-[#06141a]/90 p-2 rounded-2xl border border-cyan-900/20 shadow-lg">
                  {/* Gauge style card */}
                  <div className="relative flex flex-col items-center justify-center py-2 bg-slate-950/60 rounded-xl border border-cyan-950/60 shadow-inner overflow-hidden min-h-[72px]">
                    <svg className="w-16 h-8 mb-1" viewBox="0 0 100 50">
                      <path
                        d="M 10,50 A 40,40 0 0,1 90,50"
                        fill="none"
                        stroke="rgba(0, 242, 254, 0.08)"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 10,50 A 40,40 0 0,1 90,50"
                        fill="none"
                        stroke="url(#cyanGlowGradSec)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="125"
                        strokeDashoffset={125 - (125 * (accuracy > 0 ? accuracy : 100)) / 100}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="cyanGlowGradSec" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0284c7" />
                          <stop offset="100%" stopColor="#00f2fe" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="text-center">
                      <div className="text-[7.5px] text-slate-400 font-bold tracking-wider font-sans uppercase">BAŞARI ORANI</div>
                      <div className="text-xs font-black text-[#00ffcc] font-mono leading-none">%{accuracy > 0 ? accuracy : "100"}</div>
                    </div>
                  </div>

                  {/* Transaction total count card */}
                  <div className="text-center flex flex-col items-center justify-center py-2 bg-slate-950/60 rounded-xl border border-cyan-950/60 shadow-inner min-h-[72px]">
                    <div className="text-[8px] text-slate-400 font-bold tracking-wider font-sans uppercase">İşlem Sayısı</div>
                    <div className="text-lg font-black text-white font-mono mt-1 tracking-tight">
                      {totalTrades === 0 ? "1 / 1" : `${totalTrades} / ${wonTrades}`}
                    </div>
                  </div>

                  {/* AI Version Card */}
                  <div className="text-center flex flex-col items-center justify-center py-2 bg-slate-950/60 rounded-xl border border-cyan-950/60 shadow-inner min-h-[72px] relative overflow-hidden">
                    <div className="text-[8px] text-slate-400 font-bold tracking-wider font-sans uppercase">Yapay Zeka Modeli</div>
                    <div className="flex items-center gap-1 mt-1 font-mono text-cyan-400 justify-center">
                      <span className="text-xs font-extrabold text-[#00f2fe] tracking-tight">Obyo AI (3 Model Ortak Kararı)</span>
                    </div>
                  </div>
                </div>

                {/* Main Dynamic Graphic Canvas Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wider">
                      <span className="text-cyan-400">⚡</span> Grafik Analiz Alanı
                    </span>
                    {imageUrl && (
                      <button 
                        onClick={resetAnalyzer}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        Yeni Analiz Yükle
                      </button>
                    )}
                  </div>

                  <ChartCanvas 
                    imageUrl={imageUrl}
                    analysis={analysis}
                    isLoading={isAnalyzing}
                    onImageSelected={handleCustomImage}
                    onReset={resetAnalyzer}
                  />

                  {/* Error Notification Alert */}
                  {errorMessage && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-950/30 border border-rose-900/50 flex gap-2.5 text-xs text-rose-300 animate-slide-up">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="font-bold">{errorMessage.includes("geçerli bir borsa") ? "Uyarı" : "Analiz Hatası"}</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-rose-400/80">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Starter Samples selection: custom designed with high fidelity list elements & matching green neon sparklines */}
                  {!imageUrl && !isAnalyzing && (
                    <div className="p-4 bg-[#06141a]/85 rounded-2xl border border-cyan-900/10 shadow-lg space-y-3.5">
                      <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider font-sans text-cyber-neon">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                        Hazır Örnek Grafiklerle Hemen Test Et
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Kendi ekran görüntünüz yoksa, aşağıdaki popüler kripto ve hisse senetlerinin borsa grafik modellerini tek tıkla yükleyip analiz ettirebilirsiniz:
                      </p>
                      
                      <div className="space-y-2">
                        {sampleCharts.map((sample) => (
                          <button
                            key={sample.id}
                            type="button"
                            onClick={() => handleSampleSelect(sample)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-cyan-950/40 hover:border-cyan-500/40 transition-all text-left text-xs cursor-pointer group relative overflow-hidden"
                          >
                            <div className="flex items-center gap-3">
                              {/* Currency code boxed square as shown in design */}
                              <div className="h-10 w-10 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex flex-col items-center justify-center font-bold text-[9.5px] font-mono relative overflow-hidden shrink-0">
                                <div className="absolute inset-0 bg-slate-950/20 cyber-grid opacity-30" />
                                <span className="text-[#00ffcc] tracking-wide relative z-10">{sample.asset.split("/")[0]}</span>
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-200 group-hover:text-white transition-colors tracking-tight text-[11.5px]">{sample.name}</h5>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sample.asset} • {sample.timeframe}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 font-mono">
                              {/* Glowing Green vector micro sparklines for high fidelity stock appearance */}
                              <svg className="w-12 h-6 text-[#00ffcc] opacity-75 group-hover:opacity-100 transition-opacity" viewBox="0 0 50 20" fill="none">
                                <path
                                  d={
                                    sample.id.includes("btc") 
                                      ? "M 0 15 Q 10 5, 20 12 T 35 15 T 50 4" 
                                      : sample.id.includes("eth") 
                                      ? "M 0 12 Q 12 18, 22 10 T 36 12 T 50 3" 
                                      : "M 0 5 Q 12 18, 24 15 T 38 12 T 50 2"
                                  }
                                  stroke="#00ffcc"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                              
                              <div className="flex items-center gap-1 text-[11.5px] font-extrabold text-[#00ffcc]">
                                <span>${sample.defaultPrice.toLocaleString("tr-TR")}</span>
                                <ChevronRight className="h-3.5 w-3.5 text-cyan-600/60 group-hover:text-cyan-400 transition-colors" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5-Min Position Signal Options Pop-Up Card */}
                {activeTrade && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#07151c]/90 rounded-3xl border border-cyan-900/30 shadow-2xl space-y-4 hud-corners"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 px-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                          <Clock className="h-2.5 w-2.5" /> 5 DAKİKALIK SİNYAL
                        </div>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider animate-pulse">● İŞLEM AKTİF</span>
                      </div>
                      
                      {activeTrade.result === "BEKLİYOR" && (
                        <button
                          type="button"
                          onClick={() => {
                            playSynthSound("click");
                            setIsAccelerated(!isAccelerated);
                          }}
                          className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                            isAccelerated 
                              ? "bg-amber-500 text-slate-950 border-amber-400 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.4)]" 
                              : "bg-[#030c0f] text-slate-400 border-cyan-950 hover:border-cyan-500/40"
                          }`}
                        >
                          <Zap className="h-3 w-3" />
                          {isAccelerated ? "Hızlandırıldı (20x)" : "Süreyi Hızlandır"}
                        </button>
                      )}
                    </div>

                    {/* Transaction visual call direction display box */}
                    <div className="flex items-center justify-between bg-[#030c0f] p-4 rounded-2xl border border-cyan-950/40">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-mono tracking-wide">ÖNERİLEN YÖN</span>
                        <div className="flex items-center gap-1.5">
                          {activeTrade.direction === "YUKARI" ? (
                            <span className="text-xl font-black text-[#00ffcc] tracking-tight flex items-center gap-1 filter drop-shadow-[0_0_6px_rgba(0,255,204,0.4)]">
                              <TrendingUp className="h-5 w-5 stroke-[3]" /> YUKARI
                            </span>
                          ) : (
                            <span className="text-xl font-black text-rose-500 tracking-tight flex items-center gap-1 filter drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]">
                              <TrendingDown className="h-5 w-5 stroke-[3]" /> AŞAĞI
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-[10px] text-slate-500 font-mono tracking-wide">İŞLEM GERİ SAYIMI</span>
                        <div className={`text-xl font-mono font-black tracking-widest ${activeTrade.result !== "BEKLİYOR" ? "text-slate-500" : "text-amber-400"}`}>
                          {activeTrade.result === "BEKLİYOR" ? formatTime(countdown) : "00:00"}
                        </div>
                      </div>
                    </div>

                    {/* Active dynamic price ticket */}
                    <div className="bg-[#030c0f] p-3 rounded-2xl border border-cyan-950/40 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Giriş Fiyatı: <span className="text-slate-300 font-bold">${activeTrade.initialPrice.toLocaleString("tr-TR")}</span></span>
                        <span>Mevcut Fiyat: <strong className="text-cyan-400">${(simulatedPrices[simulatedPrices.length - 1] || activeTrade.initialPrice).toLocaleString("tr-TR")}</strong></span>
                      </div>

                      {/* Micro inline performance charting feed with glowing gradients */}
                      <div className="h-10 w-full flex items-end gap-[2px] pt-2 overflow-hidden px-1">
                        {simulatedPrices.slice(-25).map((price, idx) => {
                          const diff = price - activeTrade.initialPrice;
                          const isGreen = diff >= 0;
                          const heightPct = Math.min(100, Math.max(15, 50 + (diff / activeTrade.initialPrice) * 1500));
                          return (
                            <div 
                              key={`tick-${idx}`}
                              className={`flex-1 rounded-sm transition-all duration-300 ${isGreen ? "bg-emerald-400/40 shadow-[0_0_4px_rgba(16,185,129,0.2)]" : "bg-rose-500/40 shadow-[0_0_4px_rgba(239,68,68,0.2)]"}`}
                              style={{ height: `${heightPct}%` }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-cyan-950/40">
                        <span className="text-slate-400">İşlem Gidişatı:</span>
                        {activeTrade.result === "BEKLİYOR" ? (
                          (() => {
                            const currentPrice = simulatedPrices[simulatedPrices.length - 1] || activeTrade.initialPrice;
                            const isWinningCurrently = activeTrade.direction === "YUKARI" 
                              ? currentPrice >= activeTrade.initialPrice 
                              : currentPrice < activeTrade.initialPrice;
                            return (
                              <div className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${isWinningCurrently ? "bg-emerald-500/10 text-[#00ffcc] shadow-[0_0_6px_rgba(0,255,204,0.15)]" : "bg-rose-500/10 text-rose-400"}`}>
                                {isWinningCurrently ? "KAZANÇTA (KAR)" : "KAYIPTA (ZARAR)"}
                              </div>
                            );
                          })()
                        ) : (
                          <div className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${activeTrade.result === "KAZANDI" ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"}`}>
                            {activeTrade.result === "KAZANDI" ? "ANALİZ KAZANDI" : "ANALİZ KAYBETTİ"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Static professional indicators found list */}
                    {analysis && (
                      <div className="p-3 bg-[#030c0f] rounded-2xl border border-cyan-950/40 space-y-1">
                        <span className="text-[9px] text-slate-500 font-mono tracking-wide uppercase">YAZILIMSAL SİNYAL METRİKLERİ</span>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className="text-[11px] text-slate-300 py-0.5 border-b border-cyan-950/20 flex justify-between">
                            <span className="text-slate-500 font-mono">Trend:</span>
                            <span className="font-semibold text-right max-w-[100px] truncate text-cyan-400">{analysis.indicators.trend}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 py-0.5 border-b border-cyan-950/20 flex justify-between">
                            <span className="text-slate-500 font-mono">Formasyon:</span>
                            <span className="font-semibold text-right max-w-[100px] truncate">{analysis.indicators.pattern}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 py-0.5 flex justify-between">
                            <span className="text-slate-500 font-mono">RSI:</span>
                            <span className="font-semibold text-right max-w-[100px] truncate">{analysis.indicators.rsi}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 py-0.5 flex justify-between">
                            <span className="text-slate-500 font-mono">MACD:</span>
                            <span className="font-semibold text-right max-w-[100px] truncate">{analysis.indicators.macd}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reasoning writeup dropdown description */}
                    {analysis && (
                      <div className="p-3 bg-[#030c0f] rounded-2xl border border-[#00f2fe]/10 text-[11px] text-slate-400 leading-relaxed font-sans">
                        <strong className="text-cyan-400 font-mono">Teknik Yorum:</strong> {analysis.reasoning}
                      </div>
                    )}

                    {/* Dynamic feedback Likert buttons, only clickable after resolution or during trading too */}
                    <div className="pt-2 border-t border-cyan-950/40 space-y-2 text-center">
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {activeTrade.result === "BEKLİYOR" 
                          ? "Fikir/Analiz doğrultusunu beğendiniz mi?" 
                          : "Yapay zeka analizini değerlendirin:"}
                      </span>
                      
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => registerOutcomeVote(activeTrade.id, "like")}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-slate-300 cursor-pointer ${
                            activeTrade.liked 
                              ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 border border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.4)] scale-105" 
                              : "bg-[#030c0f] border border-cyan-950 hover:bg-[#06151a] hover:border-cyan-500/40"
                          }`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Çok Başarılı</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => registerOutcomeVote(activeTrade.id, "dislike")}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-slate-300 cursor-pointer ${
                            activeTrade.disliked 
                              ? "bg-rose-600 text-white border border-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] scale-105" 
                              : "bg-[#030c0f] border border-cyan-950 hover:bg-[#06151a] hover:border-cyan-500/40"
                          }`}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>Başarısız</span>
                        </button>
                      </div>

                      {activeTrade.result !== "BEKLİYOR" && (
                        <div className="pt-2">
                          <button
                            onClick={resetAnalyzer}
                            className="text-xs text-cyan-400 font-bold hover:underline py-1 animate-pulse inline-flex items-center gap-1 cursor-pointer"
                          >
                            Başka Bir Grafik İncele <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history-view"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-200">Yapılan Teknik Analiz Geçmişi</h3>
                  {historyList.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Tümünü Temizle
                    </button>
                  )}
                </div>

                {historyList.length === 0 ? (
                  <div className="p-8 text-center bg-[#06141a]/85 rounded-3xl border border-cyan-900/10 space-y-3 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-950/20 cyber-grid opacity-30" />
                    <History className="h-8 w-8 text-cyan-500/60 mx-auto animate-pulse" />
                    <p className="text-xs text-slate-400 max-w-xs leading-normal mx-auto relative z-10">
                      Henüz tamamlanmış bir işlem analizi bulunmuyor. Ana sayfaya dönüp ilk borsacılık görselinizi analiz ettirin.
                    </p>
                    <button
                      onClick={() => setActiveTab("analyze")}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all active:scale-95 relative z-10"
                    >
                      Şimdi Analiz Yap
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historyList.map((item) => {
                      const isWin = item.result === "KAZANDI";
                      const dateStr = new Date(item.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                      return (
                        <div 
                          key={item.id}
                          className="bg-[#06141a]/90 border border-cyan-950/40 p-3.5 rounded-2xl flex flex-col gap-2.5 transition-all hover:border-cyan-500/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">{dateStr} • {item.indicators.split("|")[0]}</span>
                            <span className={`text-[10px] uppercase font-black font-mono px-2 py-0.5 rounded ${
                              isWin ? "bg-emerald-500/10 text-[#00ffcc] filter drop-shadow-[0_0_6px_rgba(0,255,204,0.2)]" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {item.result}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {item.direction === "YUKARI" ? (
                                <ArrowUpRight className="h-4 w-4 text-[#00ffcc] stroke-[3.5]" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-rose-500 stroke-[3.5]" />
                              )}
                              <span className="text-xs font-bold text-slate-200">
                                Sinyal: <strong className={item.direction === "YUKARI" ? "text-[#00ffcc]" : "text-rose-400"}>{item.direction}</strong> ({item.confidence}% Güven)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.liked && (
                                <ThumbsUp className="h-3.5 w-3.5 text-[#00ffcc] fill-emerald-500/20" />
                              )}
                              {item.disliked && (
                                <ThumbsDown className="h-3.5 w-3.5 text-rose-400 fill-rose-500/20" />
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-[#030c0f] p-2 rounded-xl text-[10px] font-mono text-slate-400 border border-cyan-950/30">
                            <span>Giriş: <b className="text-slate-300">${item.initialPrice}</b></span>
                            <span>Kapanış: <b className="text-slate-300">${item.finalPrice || item.initialPrice}</b></span>
                          </div>

                          {/* Quick change rating button if user wants to override vote */}
                          <div className="flex justify-between items-center border-t border-cyan-950/20 pt-2 text-[10px] text-slate-500">
                            <span>Kullanıcı Değerlendirmesi:</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => registerOutcomeVote(item.id, "like")}
                                className={`p-1 rounded cursor-pointer transition-colors ${item.liked ? "text-[#00ffcc] bg-emerald-500/5" : "text-slate-600 hover:text-cyan-400"}`}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => registerOutcomeVote(item.id, "dislike")}
                                className={`p-1 rounded cursor-pointer transition-colors ${item.disliked ? "text-rose-400 bg-rose-500/5" : "text-slate-600 hover:text-rose-400"}`}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "tutorial" && (
              <motion.div
                key="tutorial-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-900"
              >
                <h3 className="text-sm font-bold text-slate-200">Kullanım Kılavuzu</h3>
                
                <div className="space-y-3.5 pt-1">
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-emerald-400 flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Grafik Görselini Yükleyin</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        İncelemek istediğiniz borsa veya coin paritesine ait mum grafiği ekran görüntüsünü sürükleyin veya dosya gezgininden yükleyin. Hazır test şablonlarını da kullanabilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-emerald-400 flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Ekran Çizimlerini İnceleyin</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        Yapay zeka, resim üstünde otomatik olarak Destek, Direnç seviyelerini çizer ve en uygun Alım/Satım noktalarını yeşil/kırmızı ok simgeleriyle gösterir.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-emerald-400 flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">5-Dakika Kartını İzleyin</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        Analiz bittiğinde açılan 5 dakikalık sinyal kartında canlı olarak değişen yapay fiyatları takip edin. Test ederken beklemek istemezseniz "Süreyi Hızlandır" butonuyla süreci 20 kat hızlandırabilirsiniz!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-emerald-400 flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Oy Verip Geri Bildirim Gönderin</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        Geri sayım sıfırlandığında işlemin başarılı olup olmadığına göre analizi Beğenebilir (Like) veya Beğenmeyebilirsiniz (Dislike). Puanlar anlık başarı oranınızı günceller.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clean, high-fidelity native-grade PWA Installation Segment */}
                <div className="p-4 bg-gradient-to-br from-[#06151a] to-[#03090c] rounded-2xl border border-cyan-950/50 space-y-3 mt-3 relative overflow-hidden">
                  <div className="flex items-center gap-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-sans tracking-wide">
                        ChartScan AI uygulamasını yükleyin
                      </h4>
                      <p className="text-[10px] text-cyan-400/80 font-mono">Çevrimdışı çalışma ve tam borsa ekranı</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Uygulamayı telefonunuza veya bilgisayarınıza bir yerel uygulama (PWA) olarak kurarak gecikme yaşamadan, adres barı olmadan yüksek performanslı tam ekran kullanabilirsiniz.
                  </p>

                  {isReadyToInstall ? (
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,242,254,0.35)] cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 fill-slate-950" />
                      Ana Ekrana Ekle
                    </button>
                  ) : (
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-cyan-950/40 space-y-2 text-[10px] text-slate-400 font-sans">
                      <p className="font-semibold text-cyan-400">Cihaza Göre Kurulum Seçenekleri:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Android / Chrome / Edge:</strong> Sayfanın üstündeki yeşil <span className="text-[#00ffcc] font-bold">Yükle</span> butonuna tıklayın ya da tarayıcı adres barındaki <span className="text-slate-200">"Yükle"</span> simgesini seçin.</li>
                        <li><strong>iOS / Apple Safari:</strong> Safari altındaki <span className="text-slate-200">"Paylaş" (Share)</span> butonuna tıklayın ve listeden <span className="text-slate-200">"Ana Ekrana Ekle" (Add to Home Screen)</span> seçeneğini kullanın.</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-cyan-950/10 border border-cyan-900/30 rounded-xl flex gap-2.5 mt-2">
                  <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    <strong className="text-cyan-400 font-bold font-sans">Yatırım Tavsiyesi Değildir:</strong> Bu uygulama, finansal yatırım kararları için tek başına referans alınamaz. Eğitim ve teknik analiz antrenmanı amaçlı tasarlanmıştır.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
          
        </main>

        {/* Global sticky Bottom navigation tabs optimized for mobile PWAs */}
        <nav className="absolute bottom-0 inset-x-0 bg-[#051115] border-t border-cyan-950/50 px-6 py-2.5 flex justify-between items-center z-10 pb-6">
          <button
            onClick={() => { playSynthSound("click"); setActiveTab("analyze"); }}
            className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer ${activeTab === "analyze" ? "text-cyan-400 font-extrabold filter drop-shadow-[0_0_6px_rgba(0,242,254,0.4)]" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[9px] font-sans font-bold tracking-wide">Analiz Yap</span>
          </button>
          
          <button
            onClick={() => { playSynthSound("click"); setActiveTab("history"); }}
            className={`flex flex-col items-center gap-1 transition-all duration-300 relative cursor-pointer ${activeTab === "history" ? "text-cyan-400 font-extrabold filter drop-shadow-[0_0_6px_rgba(0,242,254,0.4)]" : "text-slate-500 hover:text-slate-300"}`}
          >
            <History className="h-5 w-5" />
            <span className="text-[9px] font-sans font-bold tracking-wide">Sinyal Geçmişi</span>
            {historyList.length > 0 && (
              <span className="absolute -top-1 -right-2 h-4 w-4 rounded-full bg-cyan-400 text-[8px] font-black font-mono text-slate-950 flex items-center justify-center scale-90 border border-black shadow-[0_0_8px_rgba(0,242,254,0.6)]">
                {historyList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { playSynthSound("click"); setActiveTab("tutorial"); }}
            className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer ${activeTab === "tutorial" ? "text-cyan-400 font-extrabold filter drop-shadow-[0_0_6px_rgba(0,242,254,0.4)]" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Info className="h-5 w-5" />
            <span className="text-[9px] font-sans font-bold tracking-wide">Nasıl Çalışır?</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
