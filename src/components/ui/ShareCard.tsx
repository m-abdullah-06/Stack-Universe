"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUniverseStore } from "@/store";
import type { UniverseData } from "@/types";
import { formatLightYears } from "@/lib/universe-score";

interface ShareCardProps {
  data: UniverseData;
}

export function ShareCard({ data }: ShareCardProps) {
  const { showShareCard, setShowShareCard } = useUniverseStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://stack-universe.vercel.app";
  const shareUrl = `${appUrl}/universe/${data.username}`;
  const embedUrl = `${appUrl}/embed/${data.username}`;

  const copyToClipboard = (text: string, type: 'link' | 'embed' | 'markdown') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') setCopied(true);
    else if (type === 'embed') setEmbedCopied(true);
    else if (type === 'markdown') setMarkdownCopied(true);
    
    setTimeout(() => {
      if (type === 'link') setCopied(false);
      else if (type === 'embed') setEmbedCopied(false);
      else if (type === 'markdown') setMarkdownCopied(false);
    }, 2000);
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#000008",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `stack-universe-${data.username}.png`;
      a.click();
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  if (!showShareCard) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowShareCard(false)}
      >
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* The card */}
          <div
            ref={cardRef}
            className="w-96 p-6 rounded-lg relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #000008 0%, #00000f 50%, #050010 100%)",
              border: "1px solid rgba(0,229,255,0.3)",
              boxShadow:
                "0 0 40px rgba(0,229,255,0.1), inset 0 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-xs text-space-cyan/50 tracking-widest">
                  STACK UNIVERSE
                </p>
                <p className="font-orbitron font-black text-xl text-white">
                  THE {data.username.toUpperCase()} SYSTEM
                </p>
              </div>
              {data.user.avatar_url && (
                <img
                  src={data.user.avatar_url}
                  alt={data.username}
                  className="w-12 h-12 rounded-full border-2"
                  style={{ borderColor: data.languages[0]?.color || "#00e5ff" }}
                  crossOrigin="anonymous"
                />
              )}
            </div>

            {/* Stats grid */}
            <div className="relative z-10 grid grid-cols-2 gap-3 mb-4">
              {[
                {
                  label: "UNIVERSE SCORE",
                  value: data.universeScore.toLocaleString(),
                  color: "#00e5ff",
                },
                {
                  label: "TOTAL STARS",
                  value: `★ ${data.totalStars.toLocaleString()}`,
                  color: "#ffd700",
                },
                {
                  label: "PLANET COUNT",
                  value: data.languages.length,
                  color: data.languages[0]?.color || "#7b2fff",
                },
                {
                  label: "REPOSITORIES",
                  value: data.repos.length,
                  color: "#ff006e",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="p-3 rounded"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: `1px solid ${color}22`,
                  }}
                >
                  <p className="font-mono text-xs text-gray-600 mb-0.5 tracking-widest">
                    {label}
                  </p>
                  <p
                    className="font-orbitron font-bold text-lg leading-tight"
                    style={{ color }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Dominant language */}
            {data.dominantLanguage && (
              <div
                className="relative z-10 flex items-center gap-2 p-2 rounded mb-4"
                style={{
                  background: `${data.languages[0].color}11`,
                  border: `1px solid ${data.languages[0].color}33`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: data.languages[0].color,
                    boxShadow: `0 0 8px ${data.languages[0].color}`,
                  }}
                />
                <span className="font-mono text-xs text-gray-400">
                  Dominant planet:
                </span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: data.languages[0].color }}
                >
                  {data.dominantLanguage}
                </span>
                <span className="font-mono text-xs text-gray-600 ml-auto">
                  {data.languages[0].percentage.toFixed(1)}%
                </span>
              </div>
            )}

            {/* Distance */}
            <div className="relative z-10 text-center mb-3">
              <p className="font-mono text-xs text-gray-700 mb-0.5">
                DISTANCE FROM MULTIVERSE CORE
              </p>
              <p className="font-orbitron text-sm text-space-cyan">
                {formatLightYears(data.lightYears)}
              </p>
              <p className="font-mono text-xs text-space-magenta opacity-70">
                {data.distanceLabel}
              </p>
            </div>

            {/* Footer */}
            <div
              className="relative z-10 text-center pt-3"
              style={{ borderTop: "1px solid rgba(0,229,255,0.1)" }}
            >
              <p className="font-mono text-xs text-gray-700">
                Explore your universe at
              </p>
              <p className="font-mono text-xs text-space-cyan/60">{shareUrl}</p>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-space-cyan/50" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-space-cyan/50" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-space-cyan/50" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-space-cyan/50" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => copyToClipboard(shareUrl, 'link')}
                className="hud-panel rounded px-5 py-2.5 font-mono text-xs text-space-cyan hover:bg-space-cyan/10 transition-colors tracking-wider flex items-center justify-center gap-2"
              >
                {copied ? "✓ COPIED!" : "⧉ COPY LINK"}
              </button>
              <button
                onClick={downloadCard}
                disabled={downloading}
                className="hud-panel rounded px-5 py-2.5 font-mono text-xs text-space-magenta hover:bg-space-magenta/10 transition-colors tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {downloading ? "..." : "↓ DOWNLOAD CARD"}
              </button>
            </div>

            {/* Embed Section */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full">
              <div className="flex items-center justify-between mb-3">
                <p className="font-orbitron font-bold text-[10px] text-space-gold tracking-widest uppercase">
                  GitHub README (Animated)
                </p>
                <span className="font-mono text-[8px] text-gray-600">Markdown Link</span>
              </div>
              <div className="relative group mb-4">
                <pre className="bg-black/40 p-3 rounded font-mono text-[9px] text-gray-400 border border-white/5 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {`[![Stack Universe](${appUrl}/api/embed/${data.username.toLowerCase()})](${shareUrl})`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`[![Stack Universe](${appUrl}/api/embed/${data.username.toLowerCase()})](${shareUrl})`, 'markdown')}
                  className="absolute top-2 right-2 bg-space-gold/10 hover:bg-space-gold/20 text-space-gold border border-space-gold/30 rounded px-2 py-1 font-mono text-[8px] transition-all opacity-0 group-hover:opacity-100"
                >
                  {markdownCopied ? "✓" : "COPY"}
                </button>
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="font-orbitron font-bold text-[10px] text-gray-500 tracking-widest uppercase">
                  Website Overlay
                </p>
                <span className="font-mono text-[8px] text-gray-600">Iframe Code</span>
              </div>
              <div className="relative group">
                <pre className="bg-black/40 p-3 rounded font-mono text-[9px] text-gray-400 border border-white/5 overflow-x-auto whitespace-pre-wrap leading-relaxed opacity-60">
                  {`<iframe src="${embedUrl}" width="400" height="180" frameborder="0"></iframe>`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`<iframe src="${embedUrl}" width="400" height="180" frameborder="0"></iframe>`, 'embed')}
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded px-2 py-1 font-mono text-[8px] transition-all opacity-0 group-hover:opacity-100"
                >
                  {embedCopied ? "✓" : "COPY"}
                </button>
              </div>
              <p className="mt-3 font-mono text-[8px] text-gray-600 text-center uppercase tracking-tighter">
                Copy the Markdown link for your GitHub profile!
              </p>
            </div>

            <button
              onClick={() => setShowShareCard(false)}
              className="mt-2 font-mono text-[9px] text-gray-600 hover:text-white transition-colors tracking-widest uppercase py-2"
            >
              [ Close ]
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
