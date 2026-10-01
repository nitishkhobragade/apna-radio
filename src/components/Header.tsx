/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import React from 'react';
import { PlusCircle, Library, Radio, Search, History } from 'lucide-react';

interface HeaderProps {
  onOpenAddPlaylist: () => void;
  onOpenSelectPlaylist: () => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  songCount: number;
  activePlaylistName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddPlaylist,
  onOpenSelectPlaylist,
  onOpenSearch,
  onOpenHistory,
  historyCount,
  songCount,
}) => {
  return (
    <header className="relative w-full flex flex-row items-center justify-between gap-1 xs:gap-2 py-1.5 xs:py-2 sm:py-1.5 md:py-1 px-1.5 xs:px-2.5 sm:px-4 select-none z-20 shrink-0">
      {/* Vintage Carved Wooden Signboard (अपना रेडियो - पुरानी धुनें) */}
      <div className="relative group flex-1 sm:flex-initial max-w-[180px] xs:max-w-[215px] sm:max-w-none">
        {/* Carved Teak Wooden Plank */}
        <div
          className="relative px-1.5 xs:px-2.5 sm:px-3 py-1.5 xs:py-2 sm:py-1.5 md:py-1 rounded-lg border-2 border-[#4a2e19] shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(255,255,255,0.15)] flex items-center gap-1.5 sm:gap-2.5 overflow-hidden"
          style={{
            backgroundColor: '#382012',
            backgroundImage: `
              linear-gradient(180deg, rgba(255,220,160,0.1) 0%, rgba(0,0,0,0.45) 100%),
              repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 4px, transparent 4px, transparent 10px),
              radial-gradient(circle at 30% 20%, #4f2d18 0%, #29150b 100%)
            `,
          }}
        >
          {/* Iron Corner Rivets */}
          <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-1.5 h-1.5 rounded-full bg-[#1b1008] border border-[#785331] shadow-inner" />
          <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 rounded-full bg-[#1b1008] border border-[#785331] shadow-inner" />
          <div className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 w-1.5 h-1.5 rounded-full bg-[#1b1008] border border-[#785331] shadow-inner" />
          <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-1.5 h-1.5 rounded-full bg-[#1b1008] border border-[#785331] shadow-inner" />

          {/* Left Radio Icon */}
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#27150a] border border-[#825c34] flex items-center justify-center shrink-0 shadow-inner">
            <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#e49b38]" />
          </div>

          <div className="min-w-0 pr-0.5">
            <div className="flex items-center gap-1">
              <h1
                className="text-xs xs:text-sm sm:text-lg md:text-xl font-black tracking-normal text-[#faeed4] leading-none drop-shadow-[0_2px_0px_#211006] whitespace-nowrap"
                style={{
                  fontFamily: "'Yatra One', 'Rozha One', serif",
                  textShadow: '0 2px 0 #54341b, 0 3px 6px rgba(0,0,0,0.9)',
                }}
              >
                अपना रेडियो
              </h1>
              <span className="text-[9.5px] text-[#caa06a] font-serif italic hidden md:inline">
                • पुरानी धुनें
              </span>
            </div>
            <div className="text-[6.5px] xs:text-[7.5px] sm:text-[9px] font-mono text-[#d4a359] uppercase tracking-wider whitespace-nowrap mt-0.5">
              विंटेज ट्रांजिस्टर प्लेयर
            </div>
          </div>
        </div>
      </div>

      {/* Top-Right Control Buttons:
          - Mobile (< sm): Quad 2x2 Button Setup (Row 1: SEARCH & HISTORY, Row 2: ADD & PLAYLISTS)
          - Tablet/Desktop (>= sm): Single Line Side-by-Side to preserve vertical space and prevent footer cut-off!
      */}
      <div className="grid grid-cols-[auto_auto] sm:flex sm:flex-row sm:items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0 pr-1 xs:pr-1.5 sm:pr-2">
        {/* BUTTON: SEARCH SONG */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="गाने खोजें (Search YouTube songs & play instantly)"
          className="order-1 sm:order-1 group relative px-1.5 xs:px-2 sm:px-2.5 py-1.5 xs:py-2 sm:py-1.5 min-h-[30px] xs:min-h-[33px] sm:min-h-[32px] md:min-h-[34px] rounded-lg bg-gradient-to-b from-[#3a2517] via-[#2a190e] to-[#1a0f08] border border-[#825c34] hover:border-[#dfb270] shadow-[0_2px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
        >
          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full bg-gradient-to-tr from-[#996d36] via-[#dfb470] to-[#6d4a1d] border border-[#fbe4bd] shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Search className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-[#241306]" />
          </div>
          <span className="font-serif font-bold text-[9.5px] xs:text-[10.5px] sm:text-xs text-[#fce5c0] tracking-wide whitespace-nowrap">
            खोजें
          </span>
        </button>

        {/* BUTTON: ADD (Create Playlist / Add) - Placed 2nd on Desktop row, but Row 2 Col 1 on Mobile */}
        <button
          type="button"
          onClick={onOpenAddPlaylist}
          title="नई प्लेलिस्ट बनाएं या YouTube लिंक जोड़ें (Create Playlist / Add)"
          className="order-3 sm:order-2 group relative px-1.5 xs:px-2 sm:px-2.5 py-1.5 xs:py-2 sm:py-1.5 min-h-[30px] xs:min-h-[33px] sm:min-h-[32px] md:min-h-[34px] rounded-lg bg-gradient-to-b from-[#3a2517] via-[#2a190e] to-[#1a0f08] border border-[#825c34] hover:border-[#dfb270] shadow-[0_2px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
        >
          <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full bg-gradient-to-tr from-[#996d36] via-[#dfb470] to-[#6d4a1d] border border-[#fbe4bd] shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-[#241306]" />
          </div>
          <span className="font-serif font-bold text-[9.5px] xs:text-[10.5px] sm:text-xs text-[#fce5c0] tracking-wide whitespace-nowrap">
            ADD
          </span>
        </button>

        {/* BUTTON: HISTORY - Row 1 Col 2 on Mobile, 3rd in line on Desktop */}
        <button
          type="button"
          onClick={onOpenHistory}
          title="सुने गए गानों का इतिहास (Listening History)"
          className="order-2 sm:order-3 group relative px-1.5 xs:px-2 sm:px-2.5 py-1.5 xs:py-2 sm:py-1.5 min-h-[30px] xs:min-h-[33px] sm:min-h-[32px] md:min-h-[34px] rounded-lg bg-gradient-to-b from-[#3a2517] via-[#2a190e] to-[#1a0f08] border border-[#825c34] hover:border-[#dfb270] shadow-[0_2px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2 shrink-0"
        >
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full bg-gradient-to-tr from-[#996d36] via-[#dfb470] to-[#6d4a1d] border border-[#fbe4bd] shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <History className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-[#241306]" />
            </div>
            <span className="font-serif font-bold text-[9.5px] xs:text-[10.5px] sm:text-xs text-[#fce5c0] tracking-wide whitespace-nowrap">
              HISTORY
            </span>
          </div>
          <span className="px-1 py-0.2 xs:px-1.5 xs:py-0.5 bg-[#8c2d1b] rounded text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-mono text-[#fff3db] font-bold shadow-xs">
            {historyCount}
          </span>
        </button>

        {/* BUTTON: PLAYLISTS - Row 2 Col 2 on Mobile, 4th in line on Desktop */}
        <button
          type="button"
          onClick={onOpenSelectPlaylist}
          title="Browse and select playlists"
          className="order-4 sm:order-4 group relative px-1.5 xs:px-2 sm:px-2.5 py-1.5 xs:py-2 sm:py-1.5 min-h-[30px] xs:min-h-[33px] sm:min-h-[32px] md:min-h-[34px] rounded-lg bg-gradient-to-b from-[#3a2517] via-[#2a190e] to-[#1a0f08] border border-[#825c34] hover:border-[#dfb270] shadow-[0_2px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2 shrink-0"
        >
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full bg-gradient-to-tr from-[#996d36] via-[#dfb470] to-[#6d4a1d] border border-[#fbe4bd] shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Library className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-[#241306]" />
            </div>
            <span className="font-serif font-bold text-[9.5px] xs:text-[10.5px] sm:text-xs text-[#fce5c0] tracking-wide whitespace-nowrap">
              PLAYLISTS
            </span>
          </div>
          <span className="px-1 py-0.2 xs:px-1.5 xs:py-0.5 bg-[#784f29] rounded text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-mono text-[#fff3db] font-bold shadow-xs">
            {songCount}
          </span>
        </button>
      </div>
    </header>
  );
};
