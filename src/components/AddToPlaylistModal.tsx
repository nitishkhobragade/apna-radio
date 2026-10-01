/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import React, { useState } from 'react';
import { ListPlus, Plus, Check, X, Disc3, FolderPlus } from 'lucide-react';
import { Playlist, VideoItem } from '../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: VideoItem | null;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string, song: VideoItem) => void;
  onCreateAndAdd: (playlistTitle: string, song: VideoItem) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  song,
  playlists,
  onAddToPlaylist,
  onCreateAndAdd,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');

  if (!isOpen || !song) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateAndAdd(newTitle.trim(), song);
    setNewTitle('');
    setIsCreatingNew(false);
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
        className="relative w-full max-w-md rounded-xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.95)] border-4 border-[#6e4624] overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: '#faeed4',
          backgroundImage: `
            radial-gradient(circle at 10% 10%, rgba(200,160,110,0.2) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(160,120,70,0.12) 28px, rgba(160,120,70,0.12) 29px)
          `,
          boxShadow: 'inset 0 0 40px rgba(110,70,30,0.25), 0 20px 50px rgba(0,0,0,0.9)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="बंद करें (Close)"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#3d2414] text-[#faeed4] hover:bg-[#633a20] flex items-center justify-center cursor-pointer transition-colors shadow-md z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b-2 border-[#825c34]/40 pb-2.5 mb-3 pr-8 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#8c2d1b] uppercase tracking-wider">
            <ListPlus className="w-4 h-4 text-[#8c2d1b]" />
            <span>प्लेलिस्ट में जोड़ें (Save to Playlist)</span>
          </div>
          <h3
            className="text-lg sm:text-xl font-black text-[#381f10] mt-0.5 tracking-tight font-serif"
            style={{ fontFamily: "'Yatra One', 'Rozha One', serif" }}
          >
            अपनी पसंद की प्लेलिस्ट चुनें
          </h3>
        </div>

        {/* Target Song Banner */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#fff8eb] border border-[#a38c6c]/50 mb-3 shrink-0">
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-12 h-9 object-cover rounded bg-[#241306] border border-[#785324] shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80';
            }}
          />
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-bold text-[#381f10] font-serif truncate" title={song.title}>
              {song.title}
            </h4>
            <div className="text-[10px] text-[#7c532b] truncate font-sans">
              {song.channelTitle || song.artist || 'YouTube Music'}
            </div>
          </div>
        </div>

        {/* Action: Create New Playlist Toggle */}
        <div className="mb-2 shrink-0">
          {!isCreatingNew ? (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-1.5 px-3 rounded-lg border-2 border-dashed border-[#8c2d1b]/60 hover:border-[#8c2d1b] bg-[#f5e6cd] hover:bg-[#faebd4] text-[#8c2d1b] font-serif font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>➕ नई प्लेलिस्ट बनाएं (Create New Playlist)</span>
            </button>
          ) : (
            <form onSubmit={handleCreateSubmit} className="p-2 rounded-lg bg-[#fff8eb] border-2 border-[#8c2d1b]/50 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-serif font-bold text-[#8c2d1b]">
                <span>नई प्लेलिस्ट का नाम दें</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-[#825c34] hover:text-[#381f10]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="उदा. Kishore Evergreen, 90s Magic..."
                  className="flex-1 px-2.5 py-1 text-xs rounded border border-[#825c34]/50 bg-white text-[#2c180b] focus:outline-none focus:border-[#8c2d1b]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-3 py-1 bg-[#8c2d1b] hover:bg-[#a63722] text-white rounded font-serif font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                >
                  बनाएं & जोड़ें
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Playlists Selection List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 min-h-[140px]">
          <div className="text-[10px] font-mono text-[#78512b] px-0.5 pb-0.5">
            मौजूदा प्लेलिस्ट्स ({playlists.length}):
          </div>

          {playlists.map((playlist) => {
            const isAlreadyIn = playlist.videos.some((v) => v.videoId === song.videoId);

            return (
              <div
                key={playlist.id}
                onClick={() => {
                  if (!isAlreadyIn) {
                    onAddToPlaylist(playlist.id, song);
                  }
                }}
                className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-all ${
                  isAlreadyIn
                    ? 'bg-[#eaf4ea] border-[#a5d6a7] text-[#1b5e20]'
                    : 'bg-[#fff8eb] hover:bg-[#faecd6] border-[#a38c6c]/40 hover:border-[#8c2d1b] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded bg-[#382012] overflow-hidden shrink-0 border border-[#785324]">
                    <img
                      src={playlist.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'}
                      alt={playlist.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif font-bold text-xs text-[#381f10] truncate">
                      {playlist.title}
                    </div>
                    <div className="text-[10px] text-[#7c532b] font-mono">
                      {playlist.videos.length} गाने
                    </div>
                  </div>
                </div>

                {/* Status or Add Button */}
                {isAlreadyIn ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#2e7d32] bg-[#c8e6c9] px-2 py-0.5 rounded-full shrink-0">
                    <Check className="w-3 h-3" />
                    <span>जोड़ा गया</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToPlaylist(playlist.id, song);
                    }}
                    className="px-2.5 py-1 bg-[#8c2d1b] hover:bg-[#a63722] text-white rounded font-serif font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>जोड़ें</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="mt-3 pt-2 border-t border-[#825c34]/30 flex items-center justify-between text-[10px] font-mono text-[#78512b] shrink-0">
          <span className="flex items-center gap-1">
            <Disc3 className="w-3 h-3 text-[#8c2d1b]" />
            प्लेलिस्ट आपके ब्राउज़र में सुरक्षित रहती है
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded border border-[#825c34]/50 hover:bg-[#ebd7b5] text-[#4a2e16] font-serif cursor-pointer transition-colors"
          >
            पूर्ण (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
