import React from 'react';

interface TuningDisplayProps {
  progressPercent: number; // 0 to 100
  isPlaying: boolean;
  band?: 'FM' | 'AM';
  onTuningChange?: (percent: number) => void;
}

export const TuningDisplay: React.FC<TuningDisplayProps> = ({
  progressPercent,
  isPlaying,
  band = 'FM',
}) => {
  // Needle position between 5% and 95%
  const needlePos = Math.min(95, Math.max(5, progressPercent));

  return (
    <div className="relative w-full rounded-md bg-[#120d09] border border-[#3d2c1f] p-1 sm:p-1.5 shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)] overflow-hidden select-none">
      {/* Warm amber backlight effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffaa33]/15 via-[#ff8800]/10 to-transparent pointer-events-none" />

      {/* Glass reflections */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* Scales container */}
      <div className="relative z-10 flex flex-col gap-0.5 sm:gap-1 px-1.5 sm:px-2 font-mono text-[9px] sm:text-[10px]">
        {/* FM Frequency Row */}
        <div className="flex items-center justify-between text-[#e4b270] tracking-wider font-semibold border-b border-[#3b2b1e]/80 pb-0.5 leading-none">
          <span className="font-bold text-[#f59e0b] w-7">FM</span>
          <div className="flex-1 flex justify-between px-2 text-[#f2ce9d]">
            <span>88</span>
            <span>92</span>
            <span>96</span>
            <span className="text-[#ffdf9e] font-bold scale-105">100</span>
            <span>104</span>
            <span>108</span>
          </div>
          <span className="text-[#a88252] w-7 text-right font-normal text-[8px] sm:text-[9px]">MHz</span>
        </div>

        {/* AM Frequency Row */}
        <div className="flex items-center justify-between text-[#c4975f] tracking-wider leading-none">
          <span className="font-bold text-[#d97706] w-7">AM</span>
          <div className="flex-1 flex justify-between px-2 text-[#d1b084]">
            <span>530</span>
            <span>700</span>
            <span>900</span>
            <span>1200</span>
            <span>1400</span>
            <span>1600</span>
          </div>
          <span className="text-[#a88252] w-7 text-right font-normal text-[8px] sm:text-[9px]">kHz</span>
        </div>

        {/* Tick marks ruler line */}
        <div className="relative h-1.5 w-full flex justify-between items-end px-2 mt-0.5">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className={`w-[1px] bg-[#664b32] ${i % 4 === 0 ? 'h-1.5 bg-[#d1a062]' : 'h-0.5'}`}
            />
          ))}
        </div>
      </div>

      {/* Moving Illuminated Orange Tuning Needle */}
      <div
        className="absolute top-0.5 bottom-0.5 w-[1.5px] bg-[#ff3300] shadow-[0_0_6px_#ff3b00,0_0_10px_#ff7700] transition-all duration-300 ease-out z-20 pointer-events-none"
        style={{ left: `${needlePos}%` }}
      >
        <div className="absolute -top-0.5 -left-[2px] w-1.5 h-1.5 rounded-full bg-[#ff3300] shadow-[0_0_4px_#ff5500]" />
        <div className="absolute -bottom-0.5 -left-[2px] w-1.5 h-1.5 rounded-full bg-[#ff3300] shadow-[0_0_4px_#ff5500]" />
      </div>

      {/* Stereo Indicator Lamp */}
      <div className="absolute top-1 right-1.5 z-20 flex items-center gap-1">
        <div
          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            isPlaying
              ? 'bg-[#ff2200] shadow-[0_0_5px_#ff0000,0_0_8px_#ff4400]'
              : 'bg-[#40120a] border border-[#2b0c07]'
          }`}
        />
        <span className="text-[7px] sm:text-[8px] font-bold tracking-tighter text-[#ab7d4c]">STEREO</span>
      </div>
    </div>
  );
};
