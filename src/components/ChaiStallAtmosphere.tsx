import React, { useState } from 'react';
import { Keyboard, Info } from 'lucide-react';

interface ChaiStallAtmosphereProps {
  currentSongTitle?: string;
  artist?: string;
  playlistName?: string;
}

export const ChaiStallAtmosphere: React.FC<ChaiStallAtmosphereProps> = ({
  currentSongTitle,
  artist,
  playlistName,
}) => {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);

  return (
    <div className="relative w-full max-w-4xl mx-auto px-1 sm:px-2 mt-0.5 select-none shrink-0">
      {/* Wooden chai table surface on which radio rests */}
      <div className="relative rounded-lg py-1 px-2.5 sm:px-3 bg-gradient-to-b from-[#2d1b10] via-[#21120a] to-[#160a05] border-t-2 border-[#6e4624] shadow-[0_6px_12px_rgba(0,0,0,0.85)] flex flex-row items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Realistic Tapri Cutting Chai Glass with continuous tea smoke rising */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-end pt-3 pb-0.5">
            {/* Continuous Realistic Tea Smoke Plumes Rising from rim */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-8 pointer-events-none overflow-visible flex justify-center z-30">
              {/* Plume 1 */}
              <div
                className="absolute bottom-0 w-2 h-4.5 rounded-full bg-gradient-to-t from-white/40 via-white/20 to-transparent blur-[1.5px] animate-tea-smoke-1"
                style={{ left: '25%' }}
              />
              {/* Plume 2 */}
              <div
                className="absolute bottom-0 w-2.5 h-5.5 rounded-full bg-gradient-to-t from-white/45 via-white/25 to-transparent blur-[2px] animate-tea-smoke-2"
                style={{ left: '45%' }}
              />
              {/* Plume 3 */}
              <div
                className="absolute bottom-0 w-1.5 h-4 rounded-full bg-gradient-to-t from-white/35 via-white/15 to-transparent blur-[1px] animate-tea-smoke-3"
                style={{ left: '60%' }}
              />
            </div>

            {/* Brass Saucer / Coaster */}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 sm:w-9 h-1 rounded-full bg-gradient-to-r from-[#946d33] via-[#e5c07b] to-[#785324] border-t border-[#fbe4bd] shadow-xs" />

            {/* Realistic Traditional Indian 6-Ribbed Tapri Cutting Chai Glass */}
            <div
              className="relative w-5 sm:w-6 h-6.5 sm:h-7.5 rounded-b-sm border-t border-x border-white/40 shadow-[0_3px_6px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col justify-end p-[1px]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.06) 40%, rgba(0,0,0,0.4) 100%)',
                boxShadow:
                  'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.7), 0 3px 6px rgba(0,0,0,0.9)',
              }}
              title="गरम मसाला कटिंग चाय (Fresh Steaming Cutting Chai)"
            >
              {/* Glass Vertical Facet Rib Reflections */}
              <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5 opacity-40">
                <div className="w-[1px] h-full bg-white/70" />
                <div className="w-[1px] h-full bg-black/40" />
                <div className="w-[1px] h-full bg-white/60" />
                <div className="w-[1px] h-full bg-black/40" />
                <div className="w-[1px] h-full bg-white/70" />
              </div>

              {/* Rich Masala Chai Tea Liquid */}
              <div className="w-full h-4 sm:h-5 rounded-b-xs bg-gradient-to-t from-[#8d4715] via-[#cf7729] to-[#ea9c4b] relative shadow-inner">
                {/* Chai Creamy Surface / Malai Foam Ring */}
                <div className="w-full h-0.5 bg-gradient-to-r from-[#fff3df]/70 via-[#ffe4ba]/90 to-[#fff3df]/70 shadow-xs" />

                {/* Subtle bubble in chai */}
                <div className="absolute top-0.5 left-1 w-0.5 h-0.5 rounded-full bg-white/40 blur-[0.2px]" />
                <div className="absolute bottom-0.5 right-1 w-0.5 h-0.5 rounded-full bg-[#522709]" />
              </div>

              {/* Glass Reflection Highlight Sheen */}
              <div className="absolute top-0 left-0.5 w-0.5 h-full bg-gradient-to-b from-white/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Nostalgic Chai Stall Hand-lettered Chalk Script */}
          <div className="hidden sm:flex flex-col">
            <span
              className="text-[11px] text-[#f7d6a5] font-serif italic leading-none"
              style={{ fontFamily: "'Kalam', cursive, serif" }}
            >
              Gaane Wahi... Ehsaas Naye...
            </span>
            <span className="text-[8.5px] text-[#caa06a] flex items-center gap-1 font-mono leading-tight mt-0.5">
              ☕ ताज़ा कटिंग चाय • यादें
            </span>
          </div>
        </div>

        {/* Center: Live Song Info Display */}
        {currentSongTitle && (
          <div className="flex-1 text-center px-2 max-w-sm truncate">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#f5ecd8] font-serif truncate">
              {currentSongTitle}
            </div>
            {artist && (
              <div className="text-[8px] sm:text-[9px] text-[#caa06a] truncate italic font-sans">
                {artist}
              </div>
            )}
          </div>
        )}

        {/* Right: Keyboard shortcuts and online indicator (Mute/Unmute static button removed) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Keyboard shortcuts toggle */}
          <button
            type="button"
            onClick={() => setShowKeyboardHelp(prev => !prev)}
            title="Keyboard Controls"
            className="p-1 rounded border border-[#4a331f] bg-[#1e130b] text-[#baa080] hover:text-[#fcd34d] hover:border-[#8c6239] transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono px-1.5"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keys</span>
          </button>

          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-1 bg-[#140b06] px-2 py-0.5 rounded-full border border-[#3e2817] text-[9px] font-mono text-[#48bb78]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#48bb78] animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Dialog Popup */}
      {showKeyboardHelp && (
        <div className="mt-2 p-2.5 rounded-lg bg-[#21140c] border border-[#5c3e24] shadow-lg text-[10px] font-mono text-[#dec4a1] max-w-md mx-auto animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between pb-1 border-b border-[#3d2919] mb-1.5 font-bold text-[#f59e0b]">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Keyboard Controls</span>
            </div>
            <button
              onClick={() => setShowKeyboardHelp(false)}
              className="text-[#99734d] hover:text-[#fcd34d]"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            <div><kbd className="px-1 py-0.2 bg-[#120a05] rounded border border-[#47301c]">Space</kbd> : Play / Pause</div>
            <div><kbd className="px-1 py-0.2 bg-[#120a05] rounded border border-[#47301c]">← / →</kbd> : Seek 10s</div>
            <div><kbd className="px-1 py-0.2 bg-[#120a05] rounded border border-[#47301c]">N / P</kbd> : Next / Prev</div>
            <div><kbd className="px-1 py-0.2 bg-[#120a05] rounded border border-[#47301c]">↑ / ↓</kbd> : Volume</div>
          </div>
        </div>
      )}
    </div>
  );
};
