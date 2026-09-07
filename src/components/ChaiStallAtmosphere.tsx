import React, { useState } from 'react';
import { radioAmbiance } from '../utils/radioAmbiance';
import { Volume2, VolumeX, Keyboard, Info } from 'lucide-react';

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
  const [isStaticPlaying, setIsStaticPlaying] = useState<boolean>(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);

  const toggleStaticAmbiance = () => {
    const active = radioAmbiance.toggle();
    setIsStaticPlaying(active);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-2 mt-1 sm:mt-2 select-none shrink-0">
      {/* Wooden chai table surface on which radio rests */}
      <div className="relative rounded-lg py-1.5 px-3 bg-gradient-to-b from-[#2d1b10] via-[#21120a] to-[#160a05] border-t-2 border-[#6e4624] shadow-[0_8px_16px_rgba(0,0,0,0.85)] flex flex-row items-center justify-between gap-2 sm:gap-4">
        {/* Left: Cutting Chai Glass with Steam Effect */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-end gap-1.5">
            {/* Glass 1 of Cutting Chai */}
            <div
              className="relative w-6 h-8 sm:w-7 sm:h-9 rounded-b-sm border border-white/20 shadow-[0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-end p-0.5"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.4) 100%)',
              }}
              title="गरम कटिंग चाय (Cutting Chai)"
            >
              <div className="w-full h-5 sm:h-6 rounded-b bg-gradient-to-t from-[#c9742c] via-[#df8f3e] to-[#f4be77] relative shadow-inner">
                <div className="w-full h-0.5 bg-[#fff2db]/60" />
              </div>
              <div className="absolute -top-2 left-1.5 w-1 h-2 rounded-full bg-white/30 blur-[0.5px] animate-pulse" />
              <div className="absolute -top-2.5 left-3 w-1 h-2.5 rounded-full bg-white/25 blur-[0.5px] animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>

          {/* Nostalgic Chai Stall Hand-lettered Chalk Script */}
          <div className="hidden sm:flex flex-col">
            <span
              className="text-xs text-[#f7d6a5] font-serif italic leading-none"
              style={{ fontFamily: "'Kalam', cursive, serif" }}
            >
              Gaane Wahi... Ehsaas Naye...
            </span>
            <span className="text-[9px] text-[#caa06a] flex items-center gap-1 font-mono">
              ☕ चाय की चुस्की • यादें
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

        {/* Right: Ambient static audio toggle and online indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Vintage Radio Static Hum Ambiance Button */}
          <button
            type="button"
            onClick={toggleStaticAmbiance}
            title={isStaticPlaying ? 'Turn off retro radio static' : 'Turn on vintage radio AM static crackle'}
            className={`px-2 py-1 rounded border text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
              isStaticPlaying
                ? 'bg-[#522b10] border-[#e49b38] text-[#fcd34d] shadow-[0_0_6px_rgba(228,155,56,0.5)]'
                : 'bg-[#1e130b] border-[#4a331f] text-[#baa080] hover:border-[#8c6239]'
            }`}
          >
            {isStaticPlaying ? <Volume2 className="w-3 h-3 text-[#f59e0b]" /> : <VolumeX className="w-3 h-3" />}
            <span className="hidden sm:inline">{isStaticPlaying ? 'AM Static ON' : 'AM Static'}</span>
          </button>

          {/* Keyboard shortcuts toggle */}
          <button
            type="button"
            onClick={() => setShowKeyboardHelp(prev => !prev)}
            title="Keyboard Controls"
            className="p-1 rounded border border-[#4a331f] bg-[#1e130b] text-[#baa080] hover:text-[#fcd34d] hover:border-[#8c6239] transition-colors cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
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
