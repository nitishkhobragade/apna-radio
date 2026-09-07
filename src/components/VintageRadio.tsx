import React from 'react';
import { VideoItem } from '../types';
import { Cassette } from './Cassette';
import { TuningDisplay } from './TuningDisplay';
import { RadioSpeaker } from './RadioSpeakers';
import { RadioControls } from './RadioControls';
import { VolumeSlider } from './VolumeSlider';
import { SeekBar } from './SeekBar';
import { Radio, Sparkles } from 'lucide-react';

interface VintageRadioProps {
  currentSong: VideoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isBuffering: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSkipBack: () => void;
  onForward: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  activePlaylistTitle: string;
}

export const VintageRadio: React.FC<VintageRadioProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isBuffering,
  onPlayPause,
  onPrev,
  onNext,
  onSkipBack,
  onForward,
  onSeek,
  onVolumeChange,
  activePlaylistTitle,
}) => {
  // Calculate percentage of song played for tape reels & tuning needle
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 25;

  return (
    <div className="relative w-full max-w-[780px] mx-auto pt-0.5 sm:pt-1 pb-0 select-none">
      {/* Top Handle / Brackets */}
      <div className="relative mx-auto w-32 sm:w-40 h-2 -mb-0.5 z-10 flex items-center justify-between px-3">
        <div className="w-2 h-2 rounded-t-md bg-[#664b2c] border-t border-x border-[#9e794b] shadow-md" />
        <div className="flex-1 h-1.5 -mt-0.5 rounded-t-lg bg-gradient-to-b from-[#2b1b11] via-[#1a110b] to-[#140b07] border-t-2 border-[#825c34] shadow-md flex items-center justify-center">
          <div className="w-16 h-0.5 bg-[#47301c] rounded-full" />
        </div>
        <div className="w-2 h-2 rounded-t-md bg-[#664b2c] border-t border-x border-[#9e794b] shadow-md" />
      </div>

      {/* 2. MAIN RADIO CABINET (Heavy Aged Teak Wood Frame) */}
      <div
        className="relative rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 md:p-3 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.95)] border-3 sm:border-4 border-[#3e2717]"
        style={{
          backgroundColor: '#382215',
          backgroundImage: `
            linear-gradient(180deg, rgba(255,200,120,0.08) 0%, rgba(0,0,0,0.4) 100%),
            repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 3px, transparent 3px, transparent 8px),
            radial-gradient(circle at 50% 0%, #573722 0%, #29170e 100%)
          `,
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -4px 8px rgba(0,0,0,0.9), 0 16px 35px rgba(0,0,0,0.9)',
        }}
      >
        {/* Fixed Horizontally Tilted Antenna resting across top edge of transistor */}
        <div
          className="absolute -top-1.5 left-5 sm:left-9 z-30 flex items-center pointer-events-none select-none"
        >
          {/* Brass Swivel Mount Pivot */}
          <div className="w-3 h-2 rounded-t-md bg-gradient-to-b from-[#e5bf7d] via-[#b38b4d] to-[#6d4e22] border-t border-x border-[#fbe4bd] shadow-md flex items-center justify-center shrink-0">
            <div className="w-1 h-1 rounded-full bg-[#27150a] border border-[#785329]" />
          </div>

          {/* Horizontal Tilted Chrome Rod */}
          <div
            className="flex items-center origin-left -ml-0.5"
            style={{ transform: 'rotate(-3.5deg)' }}
          >
            {/* Telescopic Chrome Antenna Rod */}
            <div className="relative h-1 sm:h-1.5 w-20 sm:w-32 md:w-44 bg-gradient-to-b from-[#ffffff] via-[#d1d5db] to-[#6b7280] shadow-[0_1px_2px_rgba(0,0,0,0.6)] rounded-r-full flex items-center">
              {/* Segment rings */}
              <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-[#4b5563]" />
              <div className="absolute left-2/3 top-0 bottom-0 w-0.5 bg-[#4b5563]" />
            </div>
            {/* Red / Brass Tip Cap Ball */}
            <div className="w-1.5 h-1.5 -ml-0.5 rounded-full bg-gradient-to-tr from-[#991b1b] via-[#ef4444] to-[#fca5a5] border border-[#fecaca] shadow-[0_0_4px_rgba(239,68,68,0.7)] shrink-0" />
          </div>
        </div>

        {/* Brass Corner Reinforcement Brackets (4 corners) */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#d4a359] rounded-tl pointer-events-none" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#d4a359] rounded-tr pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#d4a359] rounded-bl pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#d4a359] rounded-br pointer-events-none" />

        {/* Top Control Strip: Brass Knobs & Toggle Switches */}
        <div className="flex items-center justify-between border-b border-[#26170d] pb-0.5 mb-1 px-1 sm:px-1.5">
          {/* Left: Radio Model Badge */}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] shadow-[0_0_4px_#ff3b30]" />
            <span className="font-serif tracking-widest text-[11px] sm:text-xs font-black text-[#deb06c] uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              APNA STEREO • MK-IV
            </span>
          </div>

          {/* Center: Decorative Top Knobs */}
          <div className="hidden sm:flex items-center gap-2.5 md:gap-3">
            {['BASS', 'TREBLE', 'BALANCE'].map((label, idx) => (
              <div key={label} className="flex flex-col items-center">
                <div
                  className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#99733d] via-[#f3cb85] to-[#593d19] border border-[#ffdca3] shadow-[0_1px_3px_rgba(0,0,0,0.8)] flex items-center justify-center cursor-pointer hover:rotate-45 transition-transform duration-300"
                  style={{ transform: `rotate(${(idx - 1) * 35}deg)` }}
                >
                  <div className="w-0.5 h-1.5 bg-[#2b1705] -mt-0.5 rounded" />
                </div>
                <span className="text-[7px] font-bold text-[#b88c4f] tracking-tighter mt-0.2 leading-none">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Right: FM/AM Band Indicator */}
          <div className="flex items-center gap-1 bg-[#1b1009] px-1.5 py-0.2 rounded border border-[#4a321f] text-[8.5px] sm:text-[9.5px] font-mono text-[#d6a563]">
            <Radio className="w-2.5 h-2.5 text-[#f59e0b]" />
            <span className="font-bold">BAND: FM 100.4</span>
          </div>
        </div>

        {/* 3. Vintage FM/AM Tuning Display Bar */}
        <div className="mb-1 sm:mb-1.5">
          <TuningDisplay progressPercent={progressPercent} isPlaying={isPlaying} />
        </div>

        {/* 4. Core Chassis Center: Left Speaker, Central Cassette, Right Speaker */}
        <div className="grid grid-cols-12 gap-1 sm:gap-2 items-center mb-1 sm:mb-1.5">
          {/* Left Speaker */}
          <div className="col-span-2 sm:col-span-3 flex justify-center">
            <RadioSpeaker isPlaying={isPlaying} side="left" />
          </div>

          {/* Center Cassette Compartment & Housing */}
          <div className="col-span-8 sm:col-span-6 w-full">
            {/* Recessed Cassette Chamber with Chrome/Brass Trim */}
            <div className="relative rounded-lg sm:rounded-xl p-1 sm:p-1.5 bg-gradient-to-b from-[#1c120a] via-[#120a06] to-[#0c0603] border-2 border-[#573b22] shadow-[inset_0_3px_12px_rgba(0,0,0,0.95),0_3px_8px_rgba(0,0,0,0.5)]">
              {/* Glass reflection gradient across cassette bay door */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none rounded-lg sm:rounded-xl" />

              {/* Top Door Inscription */}
              <div className="flex items-center justify-between px-1 mb-0.5 text-[7.5px] sm:text-[8px] font-mono tracking-widest text-[#a87f4c] uppercase">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2 h-2 text-[#e49b38]" />
                  CASSETTE COMPARTMENT
                </span>
                <span className="font-bold text-[#e49b38] hidden sm:inline">AUTO STOP SYSTEM</span>
              </div>

              {/* Visibly Inserted Cassette with Active Rotating Reels */}
              <Cassette
                currentSong={currentSong}
                isPlaying={isPlaying}
                playbackProgressPercent={progressPercent}
              />

              {/* Bottom Stereo Badge Plate */}
              <div className="mt-0.5 text-center">
                <div className="inline-block px-2 py-0.2 rounded bg-gradient-to-r from-[#21160d] via-[#3d2a1a] to-[#21160d] border border-[#6b4929] shadow-xs">
                  <span className="text-[7.5px] sm:text-[8.5px] font-serif font-black tracking-widest text-[#caa06a] uppercase">
                    ★ STEREO SOUND MK-IV ★
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Speaker */}
          <div className="col-span-2 sm:col-span-3 flex justify-center">
            <RadioSpeaker isPlaying={isPlaying} side="right" />
          </div>
        </div>

        {/* 5. Bottom Vintage Controls Console Panel */}
        <div className="rounded-lg sm:rounded-xl p-1 sm:p-1.5 sm:px-2 bg-gradient-to-b from-[#21140c] via-[#170e08] to-[#0f0905] border-2 border-[#47301c] shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)] flex flex-col gap-1">
          {/* Controls Upper Row: Volume Slider & Physical Push Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2">
            {/* Left: Volume Slider */}
            <div className="shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
              <VolumeSlider volume={volume} onChange={onVolumeChange} />
            </div>

            {/* Center: 5 Metallic Push Buttons (PREV, SKIP BACK, PLAY, FORWARD, NEXT) */}
            <div className="flex-1 flex justify-center">
              <RadioControls
                isPlaying={isPlaying}
                onPlayPause={onPlayPause}
                onPrev={onPrev}
                onNext={onNext}
                onSkipBack={onSkipBack}
                onForward={onForward}
              />
            </div>

            {/* Right: Decorative Tuning Indicator or Playlist Name Badge */}
            <div className="hidden sm:flex flex-col items-end shrink-0 max-w-[130px] text-right">
              <span className="text-[8px] font-mono text-[#a37946] uppercase tracking-wider leading-none">
                ACTIVE TAPE
              </span>
              <span
                className="text-[10px] font-serif font-bold text-[#f5d098] truncate max-w-[125px] mt-0.5 leading-tight"
                title={activePlaylistTitle}
              >
                {activePlaylistTitle}
              </span>
              <span className="text-[8px] text-[#48bb78] font-mono flex items-center gap-1 mt-0.5 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#48bb78] animate-ping" />
                TUNED & READY
              </span>
            </div>
          </div>

          {/* Controls Lower Row: Vintage Seekbar & Time Display */}
          <div className="pt-0.5 border-t border-[#362314]">
            <SeekBar
              currentTime={currentTime}
              duration={duration}
              onSeek={onSeek}
              isBuffering={isBuffering}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
