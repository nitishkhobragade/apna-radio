import React, { useRef, useCallback, useState } from 'react';
import { formatTime } from '../utils/youtube';

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  isBuffering?: boolean;
}

export const SeekBar: React.FC<SeekBarProps> = ({
  currentTime,
  duration,
  onSeek,
  isBuffering = false,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const bar = barRef.current;
      if (!bar || duration <= 0) return;

      const rect = bar.getBoundingClientRect();
      const calculateSeconds = (clientX: number) => {
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const pct = x / rect.width;
        return pct * duration;
      };

      const newSeconds = calculateSeconds(e.clientX);
      onSeek(newSeconds);

      const onPointerMove = (moveEv: PointerEvent) => {
        onSeek(calculateSeconds(moveEv.clientX));
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [duration, onSeek]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHoverTime((x / rect.width) * duration);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  return (
    <div className="w-full flex items-center gap-1.5 sm:gap-2 select-none font-mono">
      {/* Elapsed Time */}
      <span className="text-[10px] sm:text-[11px] font-bold text-[#f59e0b] tracking-wider min-w-[36px] text-right font-mono drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]">
        {formatTime(currentTime)}
      </span>

      {/* Interactive Progress Bar */}
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex-1 h-3 rounded-full bg-[#140d08] border border-[#4a3421] p-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.95)] cursor-pointer group flex items-center"
      >
        {/* Glow rail */}
        <div className="relative w-full h-1.5 rounded-full bg-[#20150d] overflow-hidden">
          {/* Active red/amber progress fill */}
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isBuffering
                ? 'bg-gradient-to-r from-[#b91c1c] via-[#e49b38] to-[#b91c1c] animate-pulse'
                : 'bg-gradient-to-r from-[#991b1b] via-[#ea580c] to-[#f59e0b]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Sliding Indicator Bead */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-tr from-[#dfa253] via-[#fff4dc] to-[#c98330] border border-[#523313] shadow-[0_0_6px_rgba(245,158,11,0.8),0_1px_3px_rgba(0,0,0,0.8)] -translate-x-1/2 transition-transform group-hover:scale-125"
          style={{ left: `${progressPercent}%` }}
        />

        {/* Hover Time Tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-6 -translate-x-1/2 bg-[#2c1c11] text-[#fcd34d] text-[9px] px-1.5 py-0.2 rounded border border-[#85552a] pointer-events-none shadow-md"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Total Duration */}
      <span className="text-[10px] sm:text-[11px] font-bold text-[#b48855] tracking-wider min-w-[36px] font-mono">
        {formatTime(duration)}
      </span>
    </div>
  );
};
