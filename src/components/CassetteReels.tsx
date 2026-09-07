import React from 'react';

interface CassetteReelsProps {
  isPlaying: boolean;
  side?: 'left' | 'right';
  tapeAmountPercent?: number; // 0 to 100
}

export const CassetteReels: React.FC<CassetteReelsProps> = ({
  isPlaying,
  side = 'left',
  tapeAmountPercent = 50,
}) => {
  // Tape roll radius expands as tape winds: left shrinks, right grows or vice versa
  const spoolRadius = side === 'left' ? 18 + (100 - tapeAmountPercent) * 0.12 : 18 + tapeAmountPercent * 0.12;

  return (
    <div className="relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#15110d] border border-[#3d2f22] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
      {/* Tape roll pack around spool */}
      <div
        className="absolute rounded-full bg-[#2c1c14] border border-[#1b110b] transition-all duration-500 pointer-events-none"
        style={{
          width: `${spoolRadius * 2}px`,
          height: `${spoolRadius * 2}px`,
          maxWidth: '46px',
          maxHeight: '46px',
          boxShadow: 'inset 0 0 5px rgba(0,0,0,0.9)',
        }}
      />

      {/* Rotating Spool Hub with 6 teeth */}
      <div
        className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#ded3be] via-[#fdfbf6] to-[#d3c6ab] border border-[#8a7b63] shadow-[0_1px_2px_rgba(0,0,0,0.7)] flex items-center justify-center ${
          isPlaying ? 'animate-spin' : ''
        }`}
        style={{
          animationDuration: '3.2s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }}
      >
        {/* Center hole through which player spindle enters */}
        <div className="w-3 h-3 rounded-full bg-[#110e0c] border border-[#3e3427] shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)] flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-[#524536]" />
        </div>

        {/* 6 Gear Teeth (Spokes) */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute w-0.5 sm:w-1 h-1.5 bg-[#8c7e68] rounded-t-xs"
            style={{
              transform: `rotate(${deg}deg) translateY(-11px)`,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
            }}
          />
        ))}

        {/* Spoke lines */}
        {[30, 90, 150].map((deg) => (
          <div
            key={deg}
            className="absolute w-5 h-[1px] bg-[#a3947c]/60 pointer-events-none"
            style={{ transform: `rotate(${deg}deg)` }}
          />
        ))}
      </div>
    </div>
  );
};
