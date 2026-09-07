import React from 'react';
import { CassetteReels } from './CassetteReels';
import { VideoItem } from '../types';

interface CassetteProps {
  currentSong: VideoItem | null;
  isPlaying: boolean;
  playbackProgressPercent?: number; // 0 to 100
}

export const Cassette: React.FC<CassetteProps> = ({
  currentSong,
  isPlaying,
  playbackProgressPercent = 25,
}) => {
  const title = currentSong?.title || 'चिंगारी कोई भड़के (Chingari Koi Bhadke)';
  const artist = currentSong?.channelTitle || 'Kishore Kumar • Amar Prem';
  const thumbnail =
    currentSong?.thumbnail ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="relative w-full max-w-[400px] mx-auto select-none">
      {/* Outer Cassette Body (Smoky amber/brown acrylic shell with bevels) */}
      <div className="relative rounded-lg bg-gradient-to-b from-[#2c2018] via-[#1a120c] to-[#120b07] border border-[#543d2c] shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15)] p-1.5 sm:p-2 overflow-hidden">
        {/* Screw heads in 4 corners */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#7a6a58] border border-[#2b2219] flex items-center justify-center shadow-inner">
          <div className="w-0.5 h-[1px] bg-[#33261a]" />
        </div>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#7a6a58] border border-[#2b2219] flex items-center justify-center shadow-inner">
          <div className="w-0.5 h-[1px] bg-[#33261a]" />
        </div>
        <div className="absolute bottom-4 left-1 w-1.5 h-1.5 rounded-full bg-[#7a6a58] border border-[#2b2219] flex items-center justify-center shadow-inner">
          <div className="w-0.5 h-[1px] bg-[#33261a]" />
        </div>
        <div className="absolute bottom-4 right-1 w-1.5 h-1.5 rounded-full bg-[#7a6a58] border border-[#2b2219] flex items-center justify-center shadow-inner">
          <div className="w-0.5 h-[1px] bg-[#33261a]" />
        </div>

        {/* Cassette Paper Label (Vintage warm cream / aged paper) */}
        <div className="relative rounded bg-gradient-to-b from-[#f2e6cb] via-[#ebe0c5] to-[#decdae] p-1 sm:p-1.5 shadow-[inset_0_0_6px_rgba(0,0,0,0.3)] border border-[#a38c6c]">
          {/* Top Vintage Cassette Header Strip */}
          <div className="flex items-center justify-between border-b border-[#a89070]/60 pb-0.5 mb-0.5 text-[8.5px] font-bold text-[#45311e] tracking-wider uppercase">
            <div className="flex items-center space-x-1">
              <span className="inline-block px-1 py-0.2 rounded bg-[#963728] text-white text-[7.5px] font-mono font-bold">
                SIDE A
              </span>
              <span className="text-[#8c2d1b] font-black font-serif text-[8.5px]">GOLDEN HITS</span>
            </div>
            <div className="flex items-center space-x-1 text-[7.5px] font-mono text-[#5f442b]">
              {currentSong?.duration ? (
                <span className="px-1 bg-[#d8c3a1] rounded border border-[#b29875] text-[#2d1f14] font-bold">
                  {currentSong.duration}
                </span>
              ) : (
                <span>C-90</span>
              )}
              <span className="px-1 bg-[#d8c3a1] rounded border border-[#b29875] text-[#2d1f14] font-bold">
                HQ STEREO
              </span>
            </div>
          </div>

          {/* Central Window Area (Cutout for reels & thumbnail) */}
          <div className="relative rounded-md bg-[#160f0a] border border-[#543e2b] p-0.5 sm:p-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between gap-1 sm:gap-1.5">
              {/* Left Reel */}
              <div className="shrink-0">
                <CassetteReels
                  isPlaying={isPlaying}
                  side="left"
                  tapeAmountPercent={playbackProgressPercent}
                />
              </div>

              {/* Central Rectangular Artwork Area (YouTube Thumbnail) */}
              <div className="relative flex-1 h-7 sm:h-8.5 md:h-9.5 rounded overflow-hidden border border-[#523d29] shadow-[0_1px_4px_rgba(0,0,0,0.7)] bg-[#1e150f] group">
                <img
                  src={thumbnail}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover filter contrast-[1.05] brightness-[0.95] group-hover:scale-105 transition-transform duration-700"
                />
                {/* Vintage overlay glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                
                {/* Playing animated equalizer bars overlay */}
                {isPlaying && (
                  <div className="absolute bottom-0.5 right-1 flex items-end gap-0.5 bg-black/70 px-1 py-0.2 rounded backdrop-blur-xs">
                    <div className="w-0.5 bg-[#e49b38] rounded-t animate-pulse h-1.5" />
                    <div className="w-0.5 bg-[#d4432d] rounded-t animate-pulse h-2.5" style={{ animationDelay: '150ms' }} />
                    <div className="w-0.5 bg-[#e49b38] rounded-t animate-pulse h-1" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>

              {/* Right Reel */}
              <div className="shrink-0">
                <CassetteReels
                  isPlaying={isPlaying}
                  side="right"
                  tapeAmountPercent={playbackProgressPercent}
                />
              </div>
            </div>

            {/* Connecting tape bridge beneath reels */}
            <div className="w-full h-0.5 mt-0.5 rounded bg-[#2b1810] border-t border-[#120a06] shadow-inner" />
          </div>

          {/* Song Title and Artist printed on the cassette label */}
          <div className="mt-0.5 pt-0.5 border-t border-[#b89f81]/50 text-center">
            <h4
              className="text-[10px] sm:text-[11px] font-bold text-[#2b1b11] truncate px-1 font-serif tracking-tight leading-tight"
              title={title}
            >
              {title}
            </h4>
            <p
              className="text-[8px] sm:text-[9px] text-[#714f33] truncate px-1 font-sans italic leading-tight"
              title={artist}
            >
              {artist}
            </p>
          </div>
        </div>

        {/* Bottom trapezoid magnetic head opening */}
        <div className="relative mt-0.5 mx-auto w-[65%] h-2.5 sm:h-3 bg-[#170e09] border-t border-x border-[#412e21] rounded-t-xs flex items-center justify-around px-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)]">
          {/* Pressure pad & guide roller holes */}
          <div className="w-1.5 h-1.5 rounded-full bg-[#0a0604] border border-[#3b2b1d]" />
          <div className="w-6 h-1.5 rounded bg-[#73512f] border border-[#48331d]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#0a0604] border border-[#3b2b1d]" />
        </div>
      </div>
    </div>
  );
};
