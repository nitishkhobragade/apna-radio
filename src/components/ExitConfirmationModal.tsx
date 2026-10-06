/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import React, { useEffect } from 'react';
import { Radio, Music, LogOut, Disc3, ShieldAlert, X } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onConfirmExit: () => void;
  onCancelStay: () => void;
  currentSongTitle?: string;
  artist?: string;
  isPlaying?: boolean;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onConfirmExit,
  onCancelStay,
  currentSongTitle,
  artist,
  isPlaying,
}) => {
  // Listen for Escape key to dismiss and stay
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelStay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancelStay]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancelStay();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
    >
      {/* Vintage Carved Teak Wooden Card */}
      <div
        className="relative w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 border-[#6e4624] overflow-hidden flex flex-col"
        style={{
          backgroundColor: '#faeed4',
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(200,160,110,0.25) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 26px, rgba(160,120,70,0.12) 26px, rgba(160,120,70,0.12) 27px)
          `,
          boxShadow: 'inset 0 0 40px rgba(110,70,30,0.28), 0 25px 60px rgba(0,0,0,0.95)',
        }}
      >
        {/* Brass Screws in Corners */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#3d2414] border border-[#a87d46] shadow-inner" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#3d2414] border border-[#a87d46] shadow-inner" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#3d2414] border border-[#a87d46] shadow-inner" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#3d2414] border border-[#a87d46] shadow-inner" />

        {/* Close / Stay Button in top right */}
        <button
          type="button"
          onClick={onCancelStay}
          title="वापस रेडियो पर जाएं (Stay on Radio)"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#3d2414] text-[#faeed4] hover:bg-[#633a20] flex items-center justify-center cursor-pointer transition-colors shadow-md z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#8c2d1b] border border-[#ffcf96] flex items-center justify-center text-[#ffedd5] shadow-xs">
            <Radio className="w-4 h-4 text-[#ffedd5] animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c2d1b] font-bold">
              अपना रेडियो • ट्रांजिस्टर प्रसारण
            </span>
            <div className="flex items-center gap-1 text-[9px] font-mono text-[#784f29]">
              <ShieldAlert className="w-3 h-3 text-[#b45309]" />
              <span>नेविगेशन सुरक्षा (Navigation Shield)</span>
            </div>
          </div>
        </div>

        {/* Modal Header */}
        <div className="border-b-2 border-[#825c34]/30 pb-3 mb-3">
          <h2
            id="exit-modal-title"
            className="text-xl sm:text-2xl font-black text-[#2e190e] tracking-tight font-serif"
            style={{ fontFamily: "'Yatra One', 'Rozha One', serif" }}
          >
            क्या आप बाहर जाना चाहते हैं?
          </h2>
          <p className="text-xs text-[#664326] mt-0.5 font-medium">
            Do you really want to leave? Your music will stop.
          </p>
        </div>

        {/* Active Playback Alert Box */}
        {isPlaying && currentSongTitle ? (
          <div className="mb-4 rounded-xl p-3 bg-gradient-to-r from-[#2f1b0f] via-[#24130a] to-[#1a0e07] border border-[#966b3c] shadow-md text-[#fdecd2]">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#4a2e19] border border-[#dfb470] flex items-center justify-center shrink-0 mt-0.5">
                <Disc3 className="w-5 h-5 text-[#f59e0b] animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-[#f59e0b] uppercase font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  वर्तमान में बज रहा गीत
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#fff7ed] truncate font-serif">
                  {currentSongTitle}
                </div>
                {artist && (
                  <div className="text-[10px] text-[#caa06a] truncate font-mono">
                    {artist}
                  </div>
                )}
                <div className="text-[10px] text-[#fca5a5] mt-1 font-sans">
                  ⚠️ बाहर जाने पर गाना और रेडियो प्रसारण तुरंत बंद हो जाएगा।
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-lg bg-[#ebd5b3]/70 border border-[#b89569] text-xs text-[#523318]">
            बाहर जाने पर आपका रेडियो सत्र समाप्त हो जाएगा। क्या आप वाकई पेज छोड़ना चाहते हैं?
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-1">
          {/* Primary Action: STAY & KEEP PLAYING */}
          <button
            type="button"
            onClick={onCancelStay}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-b from-[#4f321d] via-[#3a2212] to-[#241309] hover:from-[#613f26] hover:to-[#2e190e] border-2 border-[#caa06a] text-[#fff7ed] shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] font-serif font-bold text-sm tracking-wide cursor-pointer transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Music className="w-4 h-4 text-[#fbbf24]" />
            <span>नहीं, सुनते रहें (Stay & Play)</span>
          </button>

          {/* Secondary Action: CONFIRM LEAVE */}
          <button
            type="button"
            onClick={onConfirmExit}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-[#e6d3b3] hover:bg-[#d8bf9c] border border-[#a3794d] text-[#633a20] hover:text-[#381f10] font-sans font-semibold text-xs tracking-wide cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-[#8c2d1b]" />
            <span>हाँ, बाहर जाएं (Leave)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
