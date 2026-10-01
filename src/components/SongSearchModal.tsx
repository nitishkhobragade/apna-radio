/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2, Play, Music, Sparkles, AlertCircle, Disc3, ListPlus } from 'lucide-react';
import { searchYouTubeVideos, SearchResultItem } from '../utils/youtubeSearch';

interface SongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaySong: (track: SearchResultItem) => void;
  onOpenAddToPlaylist?: (track: SearchResultItem) => void;
}

const SUGGESTED_QUERIES = [
  'Kishore Kumar Hits',
  'Lata Mangeshkar Romantic',
  'Mohammed Rafi Evergreen',
  'Mukesh Dard Bhare Geet',
  'R.D. Burman Classics',
  '90s Bollywood Golden Melodies',
  'Arijit Singh Acoustic',
  'Jagjit Singh Ghazals',
];

export const SongSearchModal: React.FC<SongSearchModalProps> = ({
  isOpen,
  onClose,
  onPlaySong,
  onOpenAddToPlaylist,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Cleanup on modal close
      abortControllerRef.current?.abort();
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const executeSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    // Abort any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const items = await searchYouTubeVideos(trimmed, controller.signal);
      setResults(items);
      if (items.length === 0) {
        setError('कोई गाना नहीं मिला। कृपया दूसरा नाम या स्पेलिंग आज़माएं।');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'गाने खोजने में समस्या आई। कृपया पुनः प्रयास करें।');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setError(null);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    executeSearch(term);
  };

  const handleTrackClick = (track: SearchResultItem) => {
    onPlaySong(track);
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
        className="relative w-full max-w-xl rounded-xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.95)] border-4 border-[#6e4624] overflow-hidden flex flex-col max-h-[90vh]"
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
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <div className="hidden sm:flex flex-col items-center justify-center w-12 h-14 border-2 border-dashed border-[#8c2d1b] p-0.5 text-center rotate-3 bg-[#faecd6]">
            <span className="text-[7.5px] font-mono text-[#8c2d1b] uppercase">RADIO</span>
            <span className="text-xs font-bold text-[#8c2d1b]">SEARCH</span>
            <span className="text-[6.5px] text-[#8c2d1b]">100% FREE</span>
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
        <div className="border-b-2 border-[#825c34]/40 pb-3 mb-4 pr-16 shrink-0">
          <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#8c2d1b] uppercase tracking-wider">
            <Search className="w-4 h-4 text-[#8c2d1b]" />
            <span>संगीत खोज एवं त्वरित वादन (YouTube Song Search)</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black text-[#381f10] mt-0.5 tracking-tight font-serif"
            style={{ fontFamily: "'Yatra One', 'Rozha One', serif" }}
          >
            गाने खोजें और तुरंत बजाएं
          </h2>
          <p className="text-[11px] text-[#6b4728] mt-0.5 font-sans">
            अपनी पसंद का कोई भी गाना खोजें और एक क्लिक में कैसेट पर प्ले करें।
          </p>
        </div>

        {/* Search Bar Input Form */}
        <form onSubmit={handleSubmit} className="mb-3 shrink-0">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 pointer-events-none text-[#825c34]">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="गाने का नाम या गायक लिखें (उदा. Lag Ja Gale, Kishore Kumar)..."
              disabled={loading}
              className="w-full pl-10 pr-24 py-2.5 sm:py-3 rounded-lg border-2 border-[#825c34]/60 bg-[#fff8ec] text-[#2c180b] placeholder-[#9a7653] font-serif text-xs sm:text-sm shadow-inner focus:outline-none focus:border-[#a8321d] focus:ring-2 focus:ring-[#a8321d]/30 transition-all"
            />

            {/* Clear Input Button ('✕') */}
            {query.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                title="हटाएं (Clear)"
                className="absolute right-20 sm:right-24 p-1 text-[#825c34] hover:text-[#8c2d1b] transition-colors cursor-pointer rounded-full hover:bg-[#faecd6]"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search Submit Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-1.5 px-3 sm:px-4 py-1.5 rounded-md bg-gradient-to-b from-[#8c2d1b] via-[#752516] to-[#581c10] text-white font-serif font-bold text-xs uppercase tracking-wider shadow-md hover:from-[#a63722] hover:to-[#6b2214] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden xs:inline">खोज...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>खोजें</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 custom-scrollbar shrink-0">
          <span className="text-[10px] text-[#78512b] font-mono shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#d97706]" /> सुझाव:
          </span>
          {SUGGESTED_QUERIES.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleSuggestionClick(pill)}
              className="px-2 py-0.5 rounded-full border border-[#825c34]/40 bg-[#f4e2c0]/60 hover:bg-[#e8d2ab] text-[#4a2e16] text-[10px] font-serif whitespace-nowrap transition-colors cursor-pointer hover:border-[#8c2d1b]/60 active:scale-95"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Results Container / Dynamic States */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[160px] space-y-2">
          {/* 1. Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-3 border-[#c29668] border-t-[#8c2d1b] animate-spin flex items-center justify-center">
                  <Disc3 className="w-6 h-6 text-[#8c2d1b] animate-pulse" />
                </div>
              </div>
              <div className="font-serif font-bold text-sm text-[#4a2e16]">
                यूट्यूब पर धुनें खोजी जा रही हैं...
              </div>
              <div className="text-[11px] text-[#7c532b] font-sans">
                Searching tracks across golden era archives
              </div>
            </div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="p-4 rounded-lg bg-[#fce8e6] border border-[#e0a89f] text-[#8c2d1b] text-xs flex items-start gap-2.5 my-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold font-serif">{error}</div>
                <button
                  type="button"
                  onClick={() => executeSearch(query)}
                  className="mt-2 text-[11px] font-mono underline hover:text-[#581c10] cursor-pointer"
                >
                  पुनः प्रयास करें (Try Again)
                </button>
              </div>
            </div>
          )}

          {/* 3. Empty State before initial search */}
          {!loading && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-[#7c532b] opacity-80">
              <Music className="w-10 h-10 text-[#a3794e] mb-2 stroke-[1.5]" />
              <div className="font-serif font-bold text-sm text-[#4a2e16]">
                ऊपर सर्च बॉक्स में कोई भी गाना या कलाकार टाइप करें
              </div>
              <div className="text-xs text-[#7c532b] mt-1 max-w-sm">
                गीत का नाम लिखकर खोजें और किसी भी ट्रैक पर क्लिक करके सीधे अपने विंटेज कैसेट पर सुनें।
              </div>
            </div>
          )}

          {/* 4. Results List */}
          {!loading && results.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#78512b] px-1 pb-1 border-b border-[#825c34]/20">
                <span>परिणाम ({results.length} गाने मिले)</span>
                <span className="text-[10px] text-[#a3794e]">क्लिक करके बजाएं</span>
              </div>

              {results.map((track) => (
                <div
                  key={track.videoId}
                  onClick={() => handleTrackClick(track)}
                  className="group relative flex items-center gap-3 p-2 rounded-lg bg-[#fff8eb] hover:bg-[#f6ebd4] border border-[#a38c6c]/40 hover:border-[#8c2d1b] shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  {/* Thumbnail with hover play overlay */}
                  <div className="relative w-16 h-12 sm:w-20 sm:h-14 rounded overflow-hidden bg-[#241306] shrink-0 border border-[#785324]">
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-[#8c2d1b] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/80 text-[8.5px] font-mono text-white rounded">
                      {track.duration}
                    </div>
                  </div>

                  {/* Song Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4
                      className="text-xs sm:text-sm font-bold text-[#381f10] group-hover:text-[#8c2d1b] font-serif line-clamp-2 leading-snug transition-colors"
                      title={track.title}
                    >
                      {track.title}
                    </h4>
                    <div className="text-[10.5px] text-[#7c532b] truncate mt-0.5 font-sans">
                      {track.author}
                    </div>
                  </div>

                  {/* Play & Add to Playlist Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onOpenAddToPlaylist && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddToPlaylist(track);
                        }}
                        title="प्लेलिस्ट में जोड़ें (Add to Playlist)"
                        className="px-2 py-1 rounded border border-[#825c34]/50 bg-[#faecd6] hover:bg-[#ebd7b5] text-[#381f10] text-[10px] sm:text-xs font-serif font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ListPlus className="w-3.5 h-3.5 text-[#8c2d1b]" />
                        <span className="hidden sm:inline">जोड़ें</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackClick(track);
                      }}
                      className="px-2.5 py-1 rounded bg-[#8c2d1b] group-hover:bg-[#a63722] text-white font-serif font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span className="hidden xs:inline">बजाएं</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="mt-3 pt-2.5 border-t border-[#825c34]/30 flex items-center justify-between text-[10px] font-mono text-[#78512b] shrink-0">
          <span>YouTube Direct Player Integration</span>
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
