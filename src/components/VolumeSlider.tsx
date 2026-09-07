import React, { useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number; // 0 to 100
  onChange: (volume: number) => void;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({ volume, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingVolRef = useRef<number | null>(null);

  // Throttled volume update to avoid flooding the YouTube IFrame API during continuous touch drag
  const throttledOnChange = useCallback(
    (newVol: number, immediate: boolean = false) => {
      const now = performance.now();
      pendingVolRef.current = newVol;

      if (immediate || now - lastUpdateTimeRef.current > 40) {
        lastUpdateTimeRef.current = now;
        onChange(newVol);
        pendingVolRef.current = null;
      }
    },
    [onChange]
  );

  const calculateVolumeFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    return Math.round(pct);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Stop event from bubbling or causing parent gestures/scrolling/seek collisions
      e.stopPropagation();
      e.preventDefault();

      const target = e.currentTarget;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback if browser doesn't support pointer capture
      }

      isDraggingRef.current = true;
      const initialVol = calculateVolumeFromClientX(e.clientX);
      throttledOnChange(initialVol, true);

      const onPointerMove = (moveEv: PointerEvent) => {
        if (!isDraggingRef.current) return;
        moveEv.stopPropagation();
        if (moveEv.cancelable) {
          moveEv.preventDefault();
        }
        const updatedVol = calculateVolumeFromClientX(moveEv.clientX);
        throttledOnChange(updatedVol, false);
      };

      const onPointerUp = (upEv: PointerEvent) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        try {
          if (target.hasPointerCapture(upEv.pointerId)) {
            target.releasePointerCapture(upEv.pointerId);
          }
        } catch {
          // ignore
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        // Commit final touch position
        const finalVol = calculateVolumeFromClientX(upEv.clientX);
        onChange(finalVol);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [calculateVolumeFromClientX, onChange, throttledOnChange]
  );

  // Clean up any pending volume dispatch on unmount
  useEffect(() => {
    return () => {
      if (pendingVolRef.current !== null) {
        onChange(pendingVolRef.current);
      }
    };
  }, [onChange]);

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ touchAction: 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Label and indicators */}
      <div className="flex items-center justify-between w-full px-1 text-[9px] sm:text-[10px] font-serif font-bold text-[#caa06a] tracking-widest uppercase mb-0.5 leading-none pointer-events-none">
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

      {/* Recessed slider groove with touch-action: none to isolate touch drags */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative w-28 sm:w-36 h-6 rounded bg-gradient-to-b from-[#110b07] via-[#1a120c] to-[#0c0704] border border-[#523b26] shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)] cursor-pointer flex items-center px-1.5 touch-none"
        style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Metal slot track */}
        <div className="w-full h-1 rounded-full bg-[#080402] border border-[#302115] relative pointer-events-none">
          {/* Active fill strip */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#995c25] to-[#e49b38] pointer-events-none"
            style={{ width: `${volume}%` }}
          />
        </div>

        {/* Vintage Brass Sliding Knob */}
        <div
          className="absolute top-1 bottom-1 w-4 rounded bg-gradient-to-b from-[#dfb470] via-[#ae7e3b] to-[#784e1b] border border-[#f3d395] shadow-[0_1px_4px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center -translate-x-1/2 pointer-events-none transition-transform active:scale-95"
          style={{
            left: `calc(6px + ${(volume / 100) * (trackRef.current ? Math.max(0, trackRef.current.clientWidth - 12) : 100)}px)`,
          }}
        >
          {/* Knurled vertical grip grooves on slider knob */}
          <div className="w-0.5 h-2.5 bg-[#42270b] shadow-inner" />
        </div>
      </div>
    </div>
  );
};
