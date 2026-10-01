/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import React, { useState } from 'react';
import { History, Play, Trash2, X, ListPlus, Music, Clock, Disc3 } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onPlaySong: (videoId: string) => void;
  onPlayAll: () => void;
  onRemoveItem: (videoId: string) => void;
  onClearHistory: () => void;
  onSaveAsPlaylist: (title: string) => void;
  onOpenAddToPlaylist?: (song: HistoryItem) => void;
}

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'अभी (Just now)';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} मिनट पहले`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} घंटे पहले`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} दिन पहले`;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onPlaySong,
  onPlayAll,
  onRemoveItem,
  onClearHistory,
  onSaveAsPlaylist,
  onOpenAddToPlaylist,
}) => {
  const [showSaveInput, setShowSaveInput] = useState<boolean>(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState<string>('मेरी पसंदीदा धुनें');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSavePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    onSaveAsPlaylist(newPlaylistTitle.trim());
    setShowSaveInput(false);
  };

  const handlePlayAndClose = (videoId: string) => {
    onPlaySong(videoId);
    onClose();
  };

  const handlePlayAllAndClose = () => {
    onPlayAll();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Vintage Cassette Vault Modal Card */}
      <div
        className="relative w-full max-w-xl rounded-xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.95)] border-4 border-[#6e4624] overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: '#faeed4',
          backgroundImage: `
            radial-gradient(circle at 10% 10%, rgba(200,160,110,0.2) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(160,120,70,0.12) 28px, rgba(160,120,70,0.12) 29px)
          `,
          boxShadow: 'inset 0 0 40px rgba(110,70,30,0.25), 0 20px 50px rgba(0,0,0,0.9)',
        }}
      >
        {/* Top-Right Decorative Stamp & Close Button */}
        <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex items-center gap-2 z-10">
          <div className="hidden sm:flex flex-col items-center justify-center w-12 h-14 border-2 border-dashed border-[#8c2d1b] p-0.5 text-center rotate-2 bg-[#faecd6]">
            <span className="text-[7px] font-mono text-[#8c2d1b] uppercase">RADIO</span>
            <span className="text-xs font-bold text-[#8c2d1b]">HISTORY</span>
            <span className="text-[6.5px] text-[#8c2d1b]">{history.length} SONGS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="बंद करें (Close)"
            className="w-8 h-8 rounded-full bg-[#3d2414] text-[#faeed4] hover:bg-[#633a20] flex items-center justify-center cursor-pointer transition-colors shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="border-b-2 border-[#825c34]/40 pb-2.5 mb-3 pr-14 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#8c2d1b] uppercase tracking-wider">
            <History className="w-4 h-4 text-[#8c2d1b]" />
            <span>इतिहास एवं सुने गए गीत (Listening History)</span>
          </div>
          <h2
            className="text-xl sm:text-2xl md:text-3xl font-black text-[#381f10] mt-0.5 tracking-tight font-serif"
            style={{ fontFamily: "'Yatra One', 'Rozha One', serif" }}
          >
            बजाए गए गानों का इतिहास
          </h2>
          <p className="text-[11px] text-[#6b4728] mt-0.5 font-sans">
            आपके द्वारा खोजे और सुने गए सभी गाने। इतिहास को एक साथ प्लेलिस्ट की तरह बजाएं।
          </p>
        </div>

        {/* Action Bar (Play All as Playlist, Create Playlist, Clear History) */}
        {history.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3 p-2 rounded-lg bg-[#f0dec0] border border-[#825c34]/30 shrink-0">
            <div className="flex items-center gap-1.5">
              {/* Play All Button */}
              <button
                type="button"
                onClick={handlePlayAllAndClose}
                title="इतिहास के सभी गाने एक-के-बाद-एक प्लेलिस्ट के रूप में चलाएं"
                className="px-2.5 sm:px-3 py-1 rounded bg-gradient-to-b from-[#8c2d1b] via-[#752516] to-[#581c10] hover:from-[#a63722] hover:to-[#6b2214] text-white font-serif font-bold text-xs uppercase tracking-wide shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>सभी चलाएं ({history.length})</span>
              </button>

              {/* Save as Playlist Button */}
              <button
                type="button"
                onClick={() => setShowSaveInput((prev) => !prev)}
                title="इतिहास के गानों से एक नई प्लेलिस्ट बनाएं"
                className="px-2 sm:px-2.5 py-1 rounded border border-[#825c34]/60 bg-[#fff8eb] hover:bg-[#faecd6] text-[#381f10] font-serif font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ListPlus className="w-3 h-3 text-[#8c2d1b]" />
                <span className="hidden xs:inline">प्लेलिस्ट बनाएं</span>
              </button>
            </div>

            {/* Clear History Button */}
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                title="पूरा इतिहास मिटाएं"
                className="px-2 py-1 text-[11px] text-[#8c2d1b] hover:text-[#581c10] font-serif flex items-center gap-1 cursor-pointer hover:bg-[#faeed4] rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>साफ करें</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-[#8c2d1b] font-bold">मिटाएं?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    setConfirmClear(false);
                  }}
                  className="px-1.5 py-0.5 bg-[#8c2d1b] text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  हाँ
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-1.5 py-0.5 bg-[#825c34]/30 text-[#381f10] rounded text-[10px] cursor-pointer"
                >
                  नहीं
                </button>
              </div>
            )}
          </div>
        )}

        {/* Save As Playlist Form Input */}
        {showSaveInput && history.length > 0 && (
          <form onSubmit={handleSavePlaylist} className="mb-3 p-2 rounded-lg bg-[#fff8eb] border-2 border-[#8c2d1b]/40 flex items-center gap-2 shrink-0 animate-in fade-in">
            <input
              type="text"
              value={newPlaylistTitle}
              onChange={(e) => setNewPlaylistTitle(e.target.value)}
              placeholder="नई प्लेलिस्ट का नाम दें..."
              className="flex-1 px-2.5 py-1 text-xs rounded border border-[#825c34]/50 bg-white text-[#2c180b] focus:outline-none focus:border-[#8c2d1b]"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1 bg-[#8c2d1b] text-white rounded font-serif font-bold text-xs uppercase cursor-pointer hover:bg-[#a63722]"
            >
              सहेजें (Save)
            </button>
            <button
              type="button"
              onClick={() => setShowSaveInput(false)}
              className="p-1 text-[#825c34] hover:text-[#2c180b] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* History Song List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[160px] space-y-1.5">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#7c532b] opacity-80">
              <Music className="w-10 h-10 text-[#a3794e] mb-2 stroke-[1.5]" />
              <div className="font-serif font-bold text-sm text-[#4a2e16]">
                अभी तक कोई इतिहास नहीं है
              </div>
              <div className="text-xs text-[#7c532b] mt-1 max-w-sm">
                ऊपर 'खोजें' बटन पर क्लिक करके किसी भी गाने को सर्च करें और बजाएं, वे यहाँ दर्ज हो जाएंगे और बाद में पूरी प्लेलिस्ट बनकर बजेंगे।
              </div>
            </div>
          ) : (
            history.map((song, index) => (
              <div
                key={`${song.videoId}-${song.playedAt || index}`}
                onClick={() => handlePlayAndClose(song.videoId)}
                className="group relative flex items-center gap-2.5 p-2 rounded-lg bg-[#fff8eb] hover:bg-[#f6ebd4] border border-[#a38c6c]/40 hover:border-[#8c2d1b] shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
              >
                {/* Index Number */}
                <div className="w-4 text-center font-mono text-[10px] text-[#825c34] font-bold shrink-0">
                  {index + 1}
                </div>

                {/* Thumbnail */}
                <div className="relative w-14 h-10 sm:w-16 sm:h-12 rounded overflow-hidden bg-[#241306] shrink-0 border border-[#785324]">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-[#8c2d1b] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                    </div>
                  </div>
                  {song.duration && (
                    <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/80 text-[7.5px] font-mono text-white rounded">
                      {song.duration}
                    </div>
                  )}
                </div>

                {/* Song Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4
                    className="text-xs sm:text-sm font-bold text-[#381f10] group-hover:text-[#8c2d1b] font-serif line-clamp-1 leading-snug transition-colors"
                    title={song.title}
                  >
                    {song.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-[#7c532b] truncate mt-0.5 font-sans">
                    <span className="truncate">{song.channelTitle || song.artist || 'YouTube'}</span>
                    {song.playedAt && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-[#9e744e] shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(song.playedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {onOpenAddToPlaylist && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddToPlaylist(song);
                      }}
                      title="प्लेलिस्ट में जोड़ें (Add to Playlist)"
                      className="p-1.5 rounded-full hover:bg-[#8c2d1b]/10 text-[#8c2d1b] transition-colors cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAndClose(song.videoId);
                    }}
                    title="यहाँ से बजाएं"
                    className="p-1.5 rounded-full bg-[#8c2d1b]/10 hover:bg-[#8c2d1b] text-[#8c2d1b] hover:text-white transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(song.videoId);
                    }}
                    title="इतिहास से हटाएं"
                    className="p-1.5 rounded-full hover:bg-[#8c2d1b]/10 text-[#a3794e] hover:text-[#8c2d1b] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-3 pt-2 border-t border-[#825c34]/30 flex items-center justify-between text-[10px] font-mono text-[#78512b] shrink-0">
          <span className="flex items-center gap-1">
            <Disc3 className="w-3 h-3 text-[#8c2d1b]" />
            इतिहास प्लेलिस्ट के रूप में क्रमिक रूप से बजेगा
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded border border-[#825c34]/50 hover:bg-[#ebd7b5] text-[#4a2e16] font-serif cursor-pointer transition-colors"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
