import React, { useRef, useState } from "react";
import { Upload, HelpCircle, Image as ImageIcon, Sparkles, TrendingUp, RefreshCw, Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AnalysisResult } from "../types";

interface ChartCanvasProps {
  imageUrl: string | null;
  analysis: AnalysisResult | null;
  isLoading: boolean;
  onImageSelected: (base64Url: string) => void;
  onReset: () => void;
}

export default function ChartCanvas({
  imageUrl,
  analysis,
  isLoading,
  onImageSelected,
  onReset,
}: ChartCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Lütfen sadece resim (PNG, JPG, WEBP) dosyası yükleyiniz.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        onImageSelected(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    cameraInputRef.current?.click();
  };

  return (
    <div className="relative w-full rounded-3xl hud-panel hud-corners overflow-hidden shadow-[0_0_40px_rgba(0,242,254,0.12)] transition-all">
      {/* HUD status badge inside the board */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/60 text-[10px] font-mono tracking-wider flex items-center gap-1.5 shadow-md">
        <div className={`h-2 w-2 rounded-full ${isLoading ? "bg-cyan-400 animate-ping" : imageUrl ? "bg-emerald-400 animate-pulse" : "bg-amber-500 animate-pulse"}`} style={{ boxShadow: isLoading ? "0 0 8px #00f2fe" : imageUrl ? "0 0 8px #10b981" : "0 0 8px #f59e0b" }} />
        <span className={isLoading ? "text-cyan-400 font-bold" : imageUrl ? "text-emerald-400 font-bold" : "text-amber-500 font-bold font-mono"}>
          {isLoading ? "ANALİZ EDİLİYOR..." : imageUrl ? "GRAFİK AKTİF" : "● BAĞLANTI BEKLENİYOR"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!imageUrl ? (
          /* 1. Drag & Drop Upload State with cyber-grid design */
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`w-full aspect-[4/3] flex flex-col items-center justify-center p-8 text-center cursor-pointer select-none transition-all duration-300 relative cyber-grid group ${
              isDragActive ? "bg-cyan-950/20 border-2 border-dashed border-cyan-400" : "hover:bg-cyan-950/5"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            
            {/* Glowing metallic custom SVG upload tray icon */}
            <div className="mb-6 transform transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_15px_rgba(0,242,254,0.45)]">
              <svg className="w-16 h-16 text-cyan-400" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Arrow up */}
                <path d="M32 12V38" stroke="#00f2fe" strokeWidth="3" strokeLinecap="round" />
                <path d="M22 22L32 12L42 22" stroke="#00f2fe" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {/* Tray design */}
                <path d="M16 40H12C10.8954 40 10 39.1046 10 38V30C10 28.8954 10.8954 28 12 28" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M48 40H52C53.1046 40 54 39.1046 54 38V30C54 28.8954 53.1046 28 52 28" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 46H42" stroke="#00f2fe" strokeWidth="2" strokeDasharray="4 2" />
              </svg>
            </div>
            
            <h3 className="text-base font-bold text-white tracking-normal font-sans">
              Borsa Grafik Görseli Çekin veya Yükleyin
            </h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-normal">
              Kaydedilmiş ekran görüntünüzü buraya sürükleyin veya <span className="text-cyan-400 font-bold underline group-hover:text-cyan-300">dosya seçin</span>
            </p>

            <button
              type="button"
              onClick={triggerCameraInput}
              className="mt-4 px-5 py-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-xl text-cyan-300 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,242,254,0.15)] z-10"
            >
              <Camera className="w-5 h-5" />
              Kamerayla Çek
            </button>
            
            <div className="mt-6 px-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1.5 min-w-[280px]">
              <span>PNG, JPG, WEBP</span>
              <span className="text-cyan-500/50">•</span>
              <span>Örn: Candlestick, Line, Bar Grafikleri</span>
            </div>
          </motion.div>
        ) : (
          /* 2. Image Rendered with Optional SVG Indicators Overlay */
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full flex items-center justify-center overflow-hidden"
          >
            <div className="relative inline-block rounded-xl border border-cyan-900/40 bg-black font-sans overflow-hidden">
              <img
                src={imageUrl}
                alt="Trading Chart"
                className="max-w-full w-auto h-auto max-h-[60vh] object-contain select-none block"
                referrerPolicy="no-referrer"
              />

              {/* Glowing Loading Wave */}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none z-20">
                  <div className="relative mb-4 flex items-center justify-center">
                    {/* Rotating Double Circle */}
                    <div className="absolute h-16 w-16 rounded-full border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute h-20 w-20 rounded-full border border-t-transparent border-r-amber-400 border-b-transparent border-l-transparent animate-spin [animation-duration:1.5s]" />
                    <div className="h-12 w-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
                    </div>
                  </div>
                  <motion.h4
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-sm font-medium text-slate-100 tracking-wide"
                  >
                    Yapay Zeka Grafik Yapısı İnceleniyor...
                  </motion.h4>
                  <p className="text-[11px] text-slate-400 mt-2 max-w-xs font-mono">
                    Destek-Direnç çizgileri taranıyor, formasyonlar aranıyor ve sinyaller hesaplanıyor.
                  </p>
                </div>
              )}

              {/* SVG OVERLAY RENDERER FOR DETECTED CHANNELS & INDICATORS */}
              {!isLoading && analysis && (
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
                  preserveAspectRatio="none"
                >
                {/* 1. Support & Resistance Lines */}
                {analysis.annotations
                  .filter((a) => a.type === "line" && a.x2 !== undefined && a.y2 !== undefined)
                  .map((ann, idx) => {
                    const strokeColor = ann.color || (ann.label.toLowerCase().includes("destek") ? "#22c55e" : "#ef4444");
                    return (
                      <g key={`line-${idx}`}>
                        <line
                          x1={ann.x1}
                          y1={ann.y1}
                          x2={ann.x2}
                          y2={ann.y2}
                          stroke={strokeColor}
                          strokeWidth="1.2"
                          strokeDasharray="3,2"
                          className="animate-[dash_20s_linear_infinite]"
                        />
                        {/* Soft visual glow under the lines */}
                        <line
                          x1={ann.x1}
                          y1={ann.y1}
                          x2={ann.x2}
                          y2={ann.y2}
                          stroke={strokeColor}
                          strokeWidth="4"
                          strokeOpacity="0.15"
                        />
                        {/* Text label next to line beginning */}
                        <text
                          x={Math.min(ann.x1 + 3, 85)}
                          y={Math.max(ann.y1 - 2, 4)}
                          fill={strokeColor}
                          fontSize="3"
                          fontFamily="monospace"
                          fontWeight="bold"
                          className="shadow-sm filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                        >
                          {ann.label}
                        </text>
                      </g>
                    );
                  })}

                {/* 2. Arrows (Buy / Sell entry points) */}
                {analysis.annotations
                  .filter((a) => a.type === "arrow")
                  .map((ann, idx) => {
                    const arrowColor = ann.color || (analysis.direction === "YUKARI" ? "#22c55e" : "#ef4444");
                    const isLong = analysis.direction === "YUKARI";
                    // arrow paths pointing up or down
                    const arrowPath = isLong
                      ? `M ${ann.x1},${ann.y1 + 5} L ${ann.x1},${ann.y1 - 5} M ${ann.x1 - 3},${ann.y1 - 1} L ${ann.x1},${ann.y1 - 5} L ${ann.x1 + 3},${ann.y1 - 1}`
                      : `M ${ann.x1},${ann.y1 - 5} L ${ann.x1},${ann.y1 + 5} M ${ann.x1 - 3},${ann.y1 + 1} L ${ann.x1},${ann.y1 + 5} L ${ann.x1 + 3},${ann.y1 + 1}`;

                    return (
                      <g key={`arrow-${idx}`} className="animate-bounce">
                        {/* Bouncing radar ring */}
                        <circle
                          cx={ann.x1}
                          cy={ann.y1}
                          r="4"
                          fill="none"
                          stroke={arrowColor}
                          strokeWidth="0.5"
                          strokeOpacity="0.6"
                          className="animate-ping"
                        />
                        <path
                          d={arrowPath}
                          fill="none"
                          stroke={arrowColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Small target center */}
                        <circle cx={ann.x1} cy={ann.y1} r="1.5" fill={arrowColor} />
                        
                        <text
                          x={Math.max(3, Math.min(ann.x1 - 10, 80))}
                          y={isLong ? ann.y1 + 10 : ann.y1 - 7}
                          fill={arrowColor}
                          fontSize="3.2"
                          fontFamily="sans-serif"
                          fontWeight="black"
                          className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        >
                          {ann.label}
                        </text>
                      </g>
                    );
                  })}

                {/* 3. Pure Text Annotations */}
                {analysis.annotations
                  .filter((a) => a.type === "text")
                  .map((ann, idx) => (
                    <g key={`text-${ann.x1}-${idx}`}>
                      <rect
                        x={ann.x1 - 1}
                        y={ann.y1 - 2.5}
                        width={ann.label.length * 1.5 + 2}
                        height="4"
                        fill="#020617"
                        fillOpacity="0.8"
                        rx="0.5"
                        stroke={ann.color || "#eab308"}
                        strokeWidth="0.2"
                      />
                      <circle cx={ann.x1} cy={ann.y1} r="0.8" fill={ann.color || "#eab308"} />
                      <text
                        x={ann.x1 + 1.2}
                        y={ann.y1 + 0.3}
                        fill={ann.color || "#eab308"}
                        fontSize="2.4"
                        fontFamily="sans-serif"
                        fontWeight="semibold"
                      >
                        {ann.label}
                      </text>
                    </g>
                  ))}
              </svg>
            )}

            {/* Quick Refresh Reset overlay button on hover */}
            {!isLoading && (
              <div className="absolute bottom-3 right-3 flex gap-2 z-30">
                <button
                  type="button"
                  id="reset-chart-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReset();
                  }}
                  className="p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 pointer-events-auto transition-colors flex items-center shadow-lg cursor-pointer"
                  title="Resmi Kaldır"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
