import React from 'react';

interface RadioSpeakerProps {
  isPlaying: boolean;
  side: 'left' | 'right';
}

export const RadioSpeaker: React.FC<RadioSpeakerProps> = ({ isPlaying, side }) => {
  const channelLabel = side === 'left' ? 'CH-L' : 'CH-R';

  return (
    <div className="flex flex-col items-center gap-0.5 select-none shrink">
      <div
        className="relative flex items-center justify-center w-10 h-10 sm:w-13 sm:h-13 md:w-16 md:h-16 lg:w-18 lg:h-18 aspect-square rounded-full shrink transition-all duration-200"
        title={`${side === 'left' ? 'Left Channel (CH-L)' : 'Right Channel (CH-R)'} Hi-Fi Speaker`}
      >
        {/* Outer Polished Brass Beveled Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#c99a53] via-[#855e2d] to-[#473014] p-0.5 sm:p-1 shadow-[0_3px_8px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.3)]">
          {/* Decorative Brass Screws at 4 points */}
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#b88c44] border border-[#3e2c14] shadow-inner"
              style={{
                top: deg === 0 ? '2px' : deg === 180 ? 'calc(100% - 6px)' : 'calc(50% - 2px)',
                left: deg === 270 ? '2px' : deg === 90 ? 'calc(100% - 6px)' : 'calc(50% - 2px)',
              }}
            >
              <div className="w-0.5 h-[1px] bg-[#2e1f0e] mx-auto mt-[1px]" />
            </div>
          ))}

          {/* Recessed Dark Bevel */}
          <div className="w-full h-full rounded-full bg-[#170e08] p-0.5 sm:p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] flex items-center justify-center">
            {/* Acoustic Speaker Cloth / Mesh Grille */}
            <div
              className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 ${
                isPlaying ? 'scale-[1.02]' : 'scale-100'
              }`}
              style={{
                backgroundColor: '#1f140c',
                backgroundImage: `
                  radial-gradient(circle at center, #2e1d11 20%, #150d08 100%),
                  repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.4) 3px, rgba(0,0,0,0.4) 6px),
                  repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(200,150,80,0.12) 3px, rgba(200,150,80,0.12) 6px)
                `,
              }}
            >
              {/* Center Dust Cap Dome */}
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-tr from-[#120b06] via-[#2a1b10] to-[#120b06] border border-[#4a3421] shadow-[0_1px_4px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center transition-transform duration-150 ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0d0704] shadow-inner" />
              </div>

              {/* Concentric sound-wave acoustic rings */}
              <div className="absolute inset-1 rounded-full border border-[#422c19]/30 pointer-events-none" />
              <div className="absolute inset-2 sm:inset-2.5 rounded-full border border-[#422c19]/40 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Retro Channel Badge (CH-L / CH-R) */}
      <div className="px-1.5 py-0.2 rounded-xs bg-[#1f130b] border border-[#5c3e23] shadow-xs">
        <span className="text-[7px] sm:text-[8px] font-mono font-bold tracking-wider text-[#d4a565] uppercase">
          {channelLabel}
        </span>
      </div>
    </div>
  );
};
