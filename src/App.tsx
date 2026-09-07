import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { VintageRadio } from './components/VintageRadio';
import { ChaiStallAtmosphere } from './components/ChaiStallAtmosphere';
import { AddPlaylistModal } from './components/AddPlaylistModal';
import { PlaylistSelector } from './components/PlaylistSelector';
import { ErrorToast, ToastMessage } from './components/ErrorToast';
import { Footer } from './components/Footer';
import { usePlaylists } from './hooks/usePlaylists';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { DEFAULT_YOUTUBE_PLAYLIST_ID } from './config';
import { KeyRound, Sparkles } from 'lucide-react';

export default function App() {
  // Playlists hook
  const {
    playlists,
    activePlaylist,
    currentSong,
    currentSongIndex,
    selectPlaylist,
    selectSong,
    nextSong,
    prevSong,
    addPlaylistFromYouTube,
    deletePlaylist,
  } = usePlaylists();

  // Toast state with debounce & rate-limiting to prevent screen clutter
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const lastToastTextRef = useRef<string>('');
  const lastToastTimeRef = useRef<number>(0);

  const addToast = useCallback((text: string, type: 'error' | 'success' | 'info' = 'info') => {
    const now = Date.now();
    if (lastToastTextRef.current === text && now - lastToastTimeRef.current < 2500) {
      return;
    }
    lastToastTextRef.current = text;
    lastToastTimeRef.current = now;

    const newToast: ToastMessage = {
      id: `toast-${now}-${Math.random().toString(36).substring(2, 6)}`,
      text,
      type,
    };
    setToasts([newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // YouTube Player hook
  const {
    containerId,
    isPlaying,
    currentTime,
    duration,
    volume,
    isBuffering,
    playVideo,
    pauseVideo,
    togglePlay,
    seekTo,
    skipSeconds,
    setVolume,
    loadVideo,
  } = useYouTubePlayer({
    initialVideoId: currentSong?.videoId,
    onSongEnded: () => {
      // Autoplay next song when current finishes
      nextSong();
    },
    onError: (errorMsg) => {
      addToast(errorMsg, 'error');
    },
  });

  // Keep track of previously loaded song to avoid re-triggering
  const loadedVideoIdRef = useRef<string | null>(null);

  // Sync current song with YouTube player
  useEffect(() => {
    if (currentSong && currentSong.videoId) {
      if (loadedVideoIdRef.current !== currentSong.videoId) {
        loadedVideoIdRef.current = currentSong.videoId;
        loadVideo(currentSong.videoId, true);
      }
    }
  }, [currentSong, loadVideo]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    const result = prevSong(currentTime);
    if (result && result.restarted) {
      seekTo(0);
      playVideo();
    }
  }, [prevSong, currentTime, seekTo, playVideo]);

  const handleNext = useCallback(() => {
    nextSong();
  }, [nextSong]);

  const handleSkipBack = useCallback(() => {
    skipSeconds(-10);
  }, [skipSeconds]);

  const handleForward = useCallback(() => {
    skipSeconds(10);
  }, [skipSeconds]);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkipBack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(volume + 5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(volume - 5);
          break;
        case 'KeyN':
          e.preventDefault();
          handleNext();
          break;
        case 'KeyP':
          e.preventDefault();
          handlePrev();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleSkipBack, handleForward, setVolume, volume, handleNext, handlePrev]);

  // Add Playlist submission with user feedback
  const handleAddPlaylist = async (urlOrId: string) => {
    const result = await addPlaylistFromYouTube(urlOrId);
    if (result.success) {
      addToast(result.message, 'success');
    } else {
      addToast(result.message, 'error');
    }
    return result;
  };

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-x-hidden overflow-y-auto text-[#f4ecd8]"
      style={{
        backgroundColor: '#1b0f09',
        backgroundImage: `
          radial-gradient(circle at 50% 15%, rgba(194, 98, 41, 0.22) 0%, rgba(20, 10, 5, 0.95) 75%),
          linear-gradient(180deg, rgba(35, 17, 9, 0.8) 0%, rgba(15, 8, 4, 0.98) 100%)
        `,
      }}
    >
      {/* Background Indian Chai Stall Aesthetic Textures */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#deb887_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Atmospheric hand-painted wall graffiti in background */}
      <div className="absolute top-16 left-4 pointer-events-none hidden lg:block opacity-15 rotate-[-6deg]">
        <div className="border-4 border-dashed border-[#d97706] p-2 text-center text-[#ffedd5] font-serif">
          <div className="text-lg font-bold">गरम चाय • समोसा</div>
          <div className="text-[10px]">₹ 10/- मात्र</div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col flex-1 min-h-0 md:gap-1.5">
        {/* Top Vintage Sign Header */}
        <Header
          onOpenAddPlaylist={() => setIsAddModalOpen(true)}
          onOpenSelectPlaylist={() => setIsSelectModalOpen(true)}
          activePlaylistName={activePlaylist?.title || 'The Ultimate Indian Bus Driver Playlist'}
          songCount={activePlaylist?.videos?.length || 0}
        />

        {/* Main Content Area: Centered Radio + Sidebar on large screens */}
        <main className="flex flex-col xl:flex-row items-center gap-1 sm:gap-1.5 md:gap-0 lg:gap-2 px-2 sm:px-4 py-0 sm:py-0.5 md:py-0 min-h-0">
          {/* Dominant Vintage Radio Centerpiece */}
          <div className="w-full max-w-4xl flex flex-col items-center justify-center">
            <VintageRadio
              currentSong={currentSong}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isBuffering={isBuffering}
              onPlayPause={togglePlay}
              onPrev={handlePrev}
              onNext={handleNext}
              onSkipBack={handleSkipBack}
              onForward={handleForward}
              onSeek={seekTo}
              onVolumeChange={setVolume}
              activePlaylistTitle={activePlaylist?.title || 'The Ultimate Indian Bus Driver Playlist'}
            />

            {/* Chai Stall Atmosphere Table with cutting chai and song information */}
            <ChaiStallAtmosphere
              currentSongTitle={currentSong?.title}
              artist={currentSong?.channelTitle}
              playlistName={activePlaylist?.title}
            />
          </div>

          {/* Desktop Right Sidebar: Your Playlists Catalog */}
          <div className="hidden xl:block w-72 shrink-0 h-full max-h-[calc(100vh-140px)] overflow-y-auto">
            <PlaylistSelector
              isOpen={true}
              onClose={() => {}}
              playlists={playlists}
              activePlaylistId={activePlaylist?.id || ''}
              currentSongIndex={currentSongIndex}
              onSelectPlaylist={selectPlaylist}
              onSelectSong={selectSong}
              onDeletePlaylist={deletePlaylist}
              isSidebar={true}
            />
          </div>
        </main>

        {/* Bottom Vintage Footer */}
        <div className="mt-1 sm:mt-1.5 md:mt-1 shrink-0">
          <Footer />
        </div>
      </div>

      {/* Hidden/Minimized YouTube IFrame API Embed (Offscreen to comply with YouTube embedding rules without breaking vintage illusion) */}
      <div
        className="fixed -bottom-96 -left-96 w-48 h-48 opacity-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div id={containerId} />
      </div>

      {/* Add Playlist Modal */}
      <AddPlaylistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPlaylist={handleAddPlaylist}
      />

      {/* Select Playlist Modal (for mobile or toggle button) */}
      <PlaylistSelector
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        playlists={playlists}
        activePlaylistId={activePlaylist?.id || ''}
        currentSongIndex={currentSongIndex}
        onSelectPlaylist={(id) => {
          selectPlaylist(id);
          setIsSelectModalOpen(false);
        }}
        onSelectSong={(idx) => {
          selectSong(idx);
          setIsSelectModalOpen(false);
        }}
        onDeletePlaylist={deletePlaylist}
        isSidebar={false}
      />

      {/* Setup Guide Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
          <div
            className="relative w-full max-w-lg rounded-xl p-6 border-4 border-[#6e4624] shadow-2xl"
            style={{
              backgroundColor: '#faeed4',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(160,120,70,0.1) 28px, rgba(160,120,70,0.1) 29px)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#825c34]/40 mb-4 text-[#381f10]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8c2d1b]" />
                <h3 className="text-xl font-bold font-serif" style={{ fontFamily: "'Yatra One', serif" }}>
                  Setup Required (कॉन्फ़िगरेशन गाइड)
                </h3>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#3d2414] text-[#faeed4] hover:bg-[#633a20] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#402312] font-sans">
              <div className="p-3 bg-[#f3e3c3] rounded-lg border border-[#825c34]/40">
                <h4 className="font-bold font-serif text-sm text-[#8c2d1b] mb-1">
                  1. YouTube Data API Key (YOUTUBE_API_KEY)
                </h4>
                <p className="leading-relaxed">
                  Go to <strong>Google AI Studio Settings &gt; Secrets</strong>, or add it to your environment as:
                </p>
                <code className="block mt-1 p-2 bg-[#2d1a0e] text-[#fcd34d] rounded font-mono text-[11px]">
                  YOUTUBE_API_KEY="AIzaSy..."
                </code>
                <p className="text-[11px] text-[#6b4728] mt-1.5">
                  This enables live fetching of any public YouTube playlist, pagination, titles, and high-res video thumbnails.
                </p>
              </div>

              <div className="p-3 bg-[#f3e3c3] rounded-lg border border-[#825c34]/40">
                <h4 className="font-bold font-serif text-sm text-[#8c2d1b] mb-1">
                  2. Default Playlist ID (DEFAULT_YOUTUBE_PLAYLIST_ID)
                </h4>
                <p className="leading-relaxed">
                  The default playlist ID is declared in:
                </p>
                <code className="block mt-1 p-2 bg-[#2d1a0e] text-[#fcd34d] rounded font-mono text-[11px]">
                  src/config.ts &rarr; DEFAULT_YOUTUBE_PLAYLIST_ID = "{DEFAULT_YOUTUBE_PLAYLIST_ID}"
                </code>
                <p className="text-[11px] text-[#6b4728] mt-1.5">
                  You can replace this variable anytime with your preferred public YouTube playlist ID.
                </p>
              </div>

              <div className="p-3 bg-[#e8f5e9] rounded-lg border border-[#81c784] text-[#1b5e20]">
                <strong>✓ Ready to Play Out of the Box:</strong> The radio already comes pre-loaded with timeless curated classic Bollywood playlists (Kishore Kumar, Lata Mangeshkar, Evergreen Hits) so you can listen right away!
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setIsSetupModalOpen(false)}
                className="px-5 py-2 rounded-md bg-[#8c2d1b] text-white font-serif font-bold text-xs uppercase tracking-wider hover:bg-[#a63722] cursor-pointer"
              >
                समझ गया (Got it)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notifications */}
      <ErrorToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
