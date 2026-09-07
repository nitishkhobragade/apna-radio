import React, { useRef, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number; // 0 to 100
  onChange: (volume: number) => void;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({ volume, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const updateVolume = (clientX: number) => {
        const x = clientX - rect.left;
        const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
        onChange(Math.round(pct));
      };

      updateVolume(e.clientX);

      const onPointerMove = (moveEv: PointerEvent) => {
        updateVolume(moveEv.clientX);
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col items-center select-none">
      {/* Label and indicators */}
      <div className="flex items-center justify-between w-full px-1 text-[9px] sm:text-[10px] font-serif font-bold text-[#caa06a] tracking-widest uppercase mb-0.5 leading-none">
        <span className="text-[#a87f4c] font-mono text-xs leading-none">−</span>
        <div className="flex items-center gap-1">
          {volume === 0 ? (
            <VolumeX className="w-2.5 h-2.5 text-[#94693b]" />
          ) : (
            <Volume2 className="w-2.5 h-2.5 text-[#d19c5c]" />
          )}
          <span className="tracking-wider">VOL</span>
        </div>
        <span className="text-[#a87f4c] font-mono text-xs leading-none">+</span>
      </div>

      {/* Recessed slider groove */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative w-28 sm:w-36 h-5 rounded bg-gradient-to-b from-[#110b07] via-[#1a120c] to-[#0c0704] border border-[#523b26] shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)] cursor-pointer flex items-center px-1.5"
      >
        {/* Metal slot track */}
        <div className="w-full h-1 rounded-full bg-[#080402] border border-[#302115] relative">
          {/* Active fill strip */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#995c25] to-[#e49b38]"
            style={{ width: `${volume}%` }}
          />
        </div>

        {/* Vintage Brass Sliding Knob */}
        <div
          className="absolute top-0.5 bottom-0.5 w-4 rounded bg-gradient-to-b from-[#dfb470] via-[#ae7e3b] to-[#784e1b] border border-[#f3d395] shadow-[0_1px_4px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center -translate-x-1/2 transition-transform hover:scale-105 active:scale-95"
          style={{ left: `calc(6px + ${(volume / 100) * (trackRef.current ? trackRef.current.clientWidth - 16 : 100)}px)` }}
        >
          {/* Knurled vertical grip grooves on slider knob */}
          <div className="w-0.5 h-2 bg-[#42270b] shadow-inner" />
        </div>
      </div>
    </div>
  );
};
