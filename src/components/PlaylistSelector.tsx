import React, { useState } from 'react';
import { Playlist, VideoItem } from '../types';
import { Music, Play, Check, Trash2, Search, X, Disc } from 'lucide-react';

interface PlaylistSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  activePlaylistId: string;
  currentSongIndex: number;
  onSelectPlaylist: (id: string) => void;
  onSelectSong: (index: number) => void;
  onDeletePlaylist?: (id: string) => void;
  isSidebar?: boolean;
}

export const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({
  isOpen,
  onClose,
  playlists,
  activePlaylistId,
  currentSongIndex,
  onSelectPlaylist,
  onSelectSong,
  onDeletePlaylist,
  isSidebar = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingSongsPlaylistId, setViewingSongsPlaylistId] = useState<string | null>(null);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];
  const viewingPlaylist = playlists.find(p => p.id === viewingSongsPlaylistId) || activePlaylist;

  const filteredPlaylists = playlists.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If this is a modal and not open, don't render
  if (!isSidebar && !isOpen) return null;

  const content = (
    <div
      className={`rounded-2xl border-4 border-[#6e4624] shadow-[0_15px_35px_rgba(0,0,0,0.85)] flex flex-col h-full overflow-hidden select-none ${
        isSidebar ? 'w-full max-w-[360px]' : 'w-full max-w-lg max-h-[85vh]'
      }`}
      style={{
        backgroundColor: '#faeed4',
        backgroundImage: `
          radial-gradient(circle at 90% 10%, rgba(200,160,110,0.18) 0%, transparent 50%),
          repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(160,120,70,0.08) 28px, rgba(160,120,70,0.08) 29px)
        `,
        boxShadow: 'inset 0 0 30px rgba(110,70,30,0.2), 0 15px 35px rgba(0,0,0,0.85)',
      }}
    >
      {/* Header Panel (Vintage Tape Catalog Card) */}
      <div className="p-4 border-b-2 border-[#825c34]/40 bg-[#f3e3c3] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-[#8c2d1b]" />
          <div>
            <h3
              className="text-lg font-black text-[#381f10] font-serif tracking-tight leading-tight"
              style={{ fontFamily: "'Yatra One', 'Rozha One', serif" }}
            >
              Your Playlists
            </h3>
            <span className="text-[10px] text-[#735133] font-mono">
              {playlists.length} संग्रह • {playlists.reduce((acc, p) => acc + (p.videos?.length || 0), 0)} धुनें
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSidebar && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#3d2414] text-[#faeed4] hover:bg-[#633a20] flex items-center justify-center cursor-pointer transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher: All Playlists vs Songs in Current Playlist */}
      <div className="px-3 pt-2.5 pb-1 flex gap-2 border-b border-[#825c34]/25">
        <button
          type="button"
          onClick={() => setViewingSongsPlaylistId(null)}
          className={`flex-1 py-1.5 px-2 rounded-md font-serif font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center ${
            viewingSongsPlaylistId === null
              ? 'bg-[#8c2d1b] text-[#faeed4] shadow-sm'
              : 'bg-[#ead6b6] text-[#54331a] hover:bg-[#e0c8a3]'
          }`}
        >
          संग्रह (Playlists)
        </button>
        <button
          type="button"
          onClick={() => setViewingSongsPlaylistId(activePlaylistId)}
          className={`flex-1 py-1.5 px-2 rounded-md font-serif font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center ${
            viewingSongsPlaylistId !== null
              ? 'bg-[#8c2d1b] text-[#faeed4] shadow-sm'
              : 'bg-[#ead6b6] text-[#54331a] hover:bg-[#e0c8a3]'
          }`}
        >
          गीत सूची (Songs)
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#825c34]/25">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#855e37] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewingSongsPlaylistId ? "Search songs in playlist..." : "Search playlists..."}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-[#fffbf2] border border-[#9e744b] text-[#291407] placeholder-[#a68668] focus:outline-none focus:border-[#8c2d1b] shadow-inner font-mono"
          />
        </div>
      </div>

      {/* Playlist Cards List or Song List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {viewingSongsPlaylistId === null ? (
          // PLAYLISTS VIEW
          filteredPlaylists.map((pl) => {
            const isSelected = pl.id === activePlaylistId;
            return (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className={`group relative rounded-xl p-2.5 border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[#8c2d1b] text-[#faeed4] border-[#d97706] shadow-md scale-[1.01]'
                    : 'bg-[#f7ebcf] text-[#331c0e] border-[#bda07b] hover:border-[#8c2d1b] hover:bg-[#faeed4]'
                }`}
              >
                {/* Playlist Thumbnail with Cassette Spool Decor */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[#825c34] shadow-inner bg-[#1f130b]">
                  <img
                    src={pl.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'}
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Disc className="w-6 h-6 text-[#fcd34d] animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs sm:text-sm font-bold truncate font-serif ${
                        isSelected ? 'text-[#fff3db]' : 'text-[#331c0e]'
                      }`}
                      title={pl.title}
                    >
                      {pl.title}
                    </h4>
                    {isSelected && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#f59e0b] text-[#2d1704] font-black uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isSelected ? 'text-[#fce0b6]' : 'text-[#735133]'
                    }`}
                  >
                    {pl.description || `${pl.videos.length} evergreen songs`}
                  </p>

                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                    <span className={isSelected ? 'text-[#ffddaa]' : 'text-[#8a6845]'}>
                      🎵 {pl.videos.length} Songs
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlaylist(pl.id);
                        if (!isSidebar) onClose();
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold uppercase transition-colors ${
                        isSelected
                          ? 'bg-[#fcd34d] text-[#421d03]'
                          : 'bg-[#8c2d1b] text-white hover:bg-[#a63722]'
                      }`}
                    >
                      {isSelected ? 'Playing' : 'Select'}
                    </button>
                  </div>
                </div>

                {/* Delete button for custom playlists */}
                {pl.isCustom && onDeletePlaylist && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete playlist "${pl.title}"?`)) {
                        onDeletePlaylist(pl.id);
                      }
                    }}
                    title="Remove playlist"
                    className="p-1 rounded text-[#996e47] hover:text-[#d9534f] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          // SONGS VIEW IN CURRENT PLAYLIST
          <div>
            <div className="mb-2 px-1 text-[11px] font-mono text-[#694321] flex justify-between items-center">
              <span>{viewingPlaylist.title}</span>
              <span>{viewingPlaylist.videos.length} Tracks</span>
            </div>

            <div className="space-y-1.5">
              {viewingPlaylist.videos
                .filter(v =>
                  v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  v.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((video, idx) => {
                  const isPlayingSong = viewingPlaylist.id === activePlaylistId && idx === currentSongIndex;
                  return (
                    <div
                      key={`${video.videoId}-${idx}`}
                      onClick={() => {
                        if (viewingPlaylist.id !== activePlaylistId) {
                          onSelectPlaylist(viewingPlaylist.id);
                        }
                        onSelectSong(idx);
                        if (!isSidebar) onClose();
                      }}
                      className={`p-2 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
                        isPlayingSong
                          ? 'bg-[#8c2d1b] text-[#fff2da] border-[#d97706] shadow-sm'
                          : 'bg-[#f5e7cb] text-[#29160a] border-[#c4a987] hover:bg-[#faeed4]'
                      }`}
                    >
                      <span className="font-mono text-xs w-5 text-center font-bold text-[#b48c5b]">
                        {idx + 1}
                      </span>

                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded object-cover border border-[#825c34]"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate font-serif leading-tight">
                          {video.title}
                        </div>
                        <div className="text-[10px] opacity-80 truncate font-sans flex items-center gap-2">
                          <span>{video.channelTitle}</span>
                          {video.duration && (
                            <span className="font-mono text-[9px] px-1 rounded bg-black/15 font-semibold">
                              {video.duration}
                            </span>
                          )}
                        </div>
                      </div>

                      {isPlayingSong ? (
                        <div className="w-5 h-5 rounded-full bg-[#fcd34d] text-[#3b1c03] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <Play className="w-3.5 h-3.5 opacity-60 hover:opacity-100 shrink-0" />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Footer info strip */}
      <div className="p-2.5 border-t border-[#825c34]/30 bg-[#f0debe] flex items-center justify-between text-[10px] font-mono text-[#735133]">
        <span>📻 Classic Indian Nostalgia</span>
        <span>Made for Chai Lovers</span>
      </div>
    </div>
  );

  // If sidebar, render directly
  if (isSidebar) {
    return <aside className="w-full">{content}</aside>;
  }

  // Modal Backdrop
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      {content}
    </div>
  );
};
