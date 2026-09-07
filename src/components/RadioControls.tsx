import React from 'react';
import {
  SkipBack,
  RotateCcw,
  Play,
  Pause,
  RotateCw,
  SkipForward,
} from 'lucide-react';

interface RadioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSkipBack: () => void;
  onForward: () => void;
}

export const RadioControls: React.FC<RadioControlsProps> = ({
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onSkipBack,
  onForward,
}) => {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 select-none">
      {/* 1. PREV Button */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onPrev}
          title="Previous Track (P)"
          className="group relative w-8 h-8 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full bg-gradient-to-b from-[#e3caa1] via-[#aa8657] to-[#594021] p-0.5 shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all active:translate-y-0.5 active:shadow-[0_1px_2px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#352516] via-[#20150d] to-[#120b06] border border-[#523d2a] flex items-center justify-center group-hover:border-[#deb274] transition-colors">
            <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f5d5a4] group-hover:text-[#fff0d6] transition-colors" />
          </div>
        </button>
        <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-[#caa06a] uppercase mt-0.5 font-mono">
          PREV
        </span>
      </div>

      {/* 2. SKIP BACK Button (-10s) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onSkipBack}
          title="Rewind 10 seconds (←)"
          className="group relative w-8 h-8 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full bg-gradient-to-b from-[#e3caa1] via-[#aa8657] to-[#594021] p-0.5 shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all active:translate-y-0.5 active:shadow-[0_1px_2px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#352516] via-[#20150d] to-[#120b06] border border-[#523d2a] flex items-center justify-center group-hover:border-[#deb274] transition-colors">
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f5d5a4] group-hover:text-[#fff0d6] transition-colors" />
          </div>
        </button>
        <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-[#caa06a] uppercase mt-0.5 font-mono">
          -10S
        </span>
      </div>

      {/* 3. PLAY / PAUSE Button (Dominant, Center Piece) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onPlayPause}
          title="Play / Pause (Space)"
          className="group relative w-10 h-10 sm:w-10.5 sm:h-10.5 md:w-11 md:h-11 rounded-full bg-gradient-to-b from-[#fcd34d] via-[#b45309] to-[#451a03] p-0.5 shadow-[0_4px_10px_rgba(0,0,0,0.9),0_0_10px_rgba(245,158,11,0.3),inset_0_1px_2px_rgba(255,255,255,0.6)] transition-all active:translate-y-0.5 active:shadow-[0_1px_3px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(0,0,0,0.9)] cursor-pointer"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#402a18] via-[#281a0e] to-[#140b05] border-2 border-[#d97706] flex items-center justify-center group-hover:border-[#fbbf24] transition-colors shadow-inner">
            {isPlaying ? (
              <Pause className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#fbbf24] fill-[#fbbf24] group-hover:scale-110 transition-transform" />
            ) : (
              <Play className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#fbbf24] fill-[#fbbf24] ml-0.5 group-hover:scale-110 transition-transform" />
            )}
          </div>
        </button>
        <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-[#f59e0b] uppercase mt-0.5 font-mono">
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </span>
      </div>

      {/* 4. FORWARD Button (+10s) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onForward}
          title="Forward 10 seconds (→)"
          className="group relative w-8 h-8 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full bg-gradient-to-b from-[#e3caa1] via-[#aa8657] to-[#594021] p-0.5 shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all active:translate-y-0.5 active:shadow-[0_1px_2px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#352516] via-[#20150d] to-[#120b06] border border-[#523d2a] flex items-center justify-center group-hover:border-[#deb274] transition-colors">
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f5d5a4] group-hover:text-[#fff0d6] transition-colors" />
          </div>
        </button>
        <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-[#caa06a] uppercase mt-0.5 font-mono">
          +10S
        </span>
      </div>

      {/* 5. NEXT Button */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onNext}
          title="Next Track (N)"
          className="group relative w-8 h-8 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full bg-gradient-to-b from-[#e3caa1] via-[#aa8657] to-[#594021] p-0.5 shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all active:translate-y-0.5 active:shadow-[0_1px_2px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#352516] via-[#20150d] to-[#120b06] border border-[#523d2a] flex items-center justify-center group-hover:border-[#deb274] transition-colors">
            <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f5d5a4] group-hover:text-[#fff0d6] transition-colors" />
          </div>
        </button>
        <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-[#caa06a] uppercase mt-0.5 font-mono">
          NEXT
        </span>
      </div>
    </div>
  );
};
