import React from 'react';
import { PlusCircle, Library, Radio } from 'lucide-react';

interface HeaderProps {
  onOpenAddPlaylist: () => void;
  onOpenSelectPlaylist: () => void;
  activePlaylistName: string;
  songCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddPlaylist,
  onOpenSelectPlaylist,
  activePlaylistName,
  songCount,
}) => {
  return (
    <header className="relative w-full flex flex-row items-center justify-between gap-1.5 sm:gap-3 py-1 sm:py-1.5 px-1 sm:px-3 select-none z-20 shrink-0">
      {/* Vintage Carved Wooden Signboard (अपना रेडियो - पुरानी धुनें) - wider and less horizontal padding */}
      <div className="relative group flex-1 sm:flex-initial max-w-[210px] xs:max-w-[240px] sm:max-w-none">
        {/* Carved Teak Wooden Plank */}
        <div
          className="relative px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 border-[#4a2e19] shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(255,255,255,0.15)] flex items-center gap-1.5 sm:gap-2.5 overflow-hidden"
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
            <div className="flex items-center gap-1.5">
              <h1
                className="text-base sm:text-xl md:text-2xl font-black tracking-normal text-[#faeed4] leading-none drop-shadow-[0_2px_0px_#211006] whitespace-nowrap"
                style={{
                  fontFamily: "'Yatra One', 'Rozha One', serif",
                  textShadow: '0 2px 0 #54341b, 0 3px 6px rgba(0,0,0,0.9)',
                }}
              >
                अपना रेडियो
              </h1>
              <span className="text-[10px] text-[#caa06a] font-serif italic hidden md:inline">
                • गाने वही... एहसास नये
              </span>
            </div>
            <div className="text-[7.5px] sm:text-[9px] font-mono text-[#d4a359] uppercase tracking-wider whitespace-nowrap">
              विंटेज ट्रांजिस्टर प्लेयर
            </div>
          </div>
        </div>
      </div>

      {/* Top-Right Action Buttons: Stack vertically (ADD PLAYLIST above PLAYLISTS) on mobile screens */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 shrink-0">
        {/* ADD PLAYLIST Button */}
        <button
          type="button"
          onClick={onOpenAddPlaylist}
          title="Add a YouTube playlist URL or ID"
          className="group relative w-full sm:w-auto px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-gradient-to-b from-[#3a2517] via-[#2a190e] to-[#1a0f08] border border-[#825c34] hover:border-[#dfb270] shadow-[0_2px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5"
        >
          <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-[#996d36] via-[#dfb470] to-[#6d4a1d] border border-[#fbe4bd] shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#241306]" />
          </div>
          <div className="text-left flex items-center gap-1">
            <span className="font-serif font-bold text-[10px] sm:text-xs text-[#fce5c0] tracking-wide whitespace-nowrap">
              ADD PLAYLIST
            </span>
            <span className="text-[9px] text-[#b8956e] font-sans hidden md:inline">• YT</span>
          </div>
        </button>

        {/* SELECT PLAYLIST Button */}
        <button
          type="button"
          onClick={onOpenSelectPlaylist}
          title="Browse and select playlists"
          className="group relative w-full sm:w-auto px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-gradient-to-b from-[#3a2517] via-[#2a190e] to-[#1a0f08] border border-[#825c34] hover:border-[#dfb270] shadow-[0_2px_6px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5"
        >
          <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-[#996d36] via-[#dfb470] to-[#6d4a1d] border border-[#fbe4bd] shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Library className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#241306]" />
          </div>
          <div className="text-left flex items-center gap-1 sm:gap-1.5">
            <span className="font-serif font-bold text-[10px] sm:text-xs text-[#fce5c0] tracking-wide whitespace-nowrap">
              PLAYLISTS
            </span>
            <span className="px-1 py-0.2 bg-[#784f29] rounded text-[7.5px] sm:text-[9px] font-mono text-[#fff3db] font-bold">
              {songCount}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
