import { useState, useEffect, useCallback } from 'react';
import { Playlist, VideoItem } from '../types';
import { PRESET_PLAYLISTS } from '../config';
import { extractPlaylistId } from '../utils/youtube';

const STORAGE_PLAYLISTS_KEY = 'apna_radio_saved_playlists_v3';
const STORAGE_ACTIVE_PLAYLIST_KEY = 'apna_radio_active_playlist_id_v3';
const STORAGE_ACTIVE_INDEX_KEY = 'apna_radio_active_song_index_v3';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLAYLISTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any stale presets from previous versions
          const filtered = parsed.filter((p: Playlist) => 
            p.youtubePlaylistId === PRESET_PLAYLISTS[0].youtubePlaylistId ||
            p.youtubePlaylistId === PRESET_PLAYLISTS[1].youtubePlaylistId ||
            p.isCustom
          );
          // Ensure both preset playlists are present
          const hasPreset0 = filtered.some(p => p.youtubePlaylistId === PRESET_PLAYLISTS[0].youtubePlaylistId);
          const hasPreset1 = filtered.some(p => p.youtubePlaylistId === PRESET_PLAYLISTS[1].youtubePlaylistId);
          let result = [...filtered];
          if (!hasPreset1) result.unshift(PRESET_PLAYLISTS[1]);
          if (!hasPreset0) result.unshift(PRESET_PLAYLISTS[0]);
          return result;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved playlists from localStorage', e);
    }
    return PRESET_PLAYLISTS;
  });

  const [activePlaylistId, setActivePlaylistId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_PLAYLIST_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return PRESET_PLAYLISTS[0].id;
  });

  const [currentSongIndex, setCurrentSongIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_INDEX_KEY);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0) return idx;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  // Save to localStorage whenever playlists change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Could not save playlists to localStorage', e);
    }
  }, [playlists]);

  // Save active playlist ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_PLAYLIST_KEY, activePlaylistId);
    } catch (e) {
      console.warn('Could not save active playlist ID', e);
    }
  }, [activePlaylistId]);

  // Save active song index
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_INDEX_KEY, currentSongIndex.toString());
    } catch (e) {
      console.warn('Could not save song index', e);
    }
  }, [currentSongIndex]);

  // Current active playlist object
  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0] || PRESET_PLAYLISTS[0];

  // Current active song object
  const currentSong: VideoItem | null =
    activePlaylist && activePlaylist.videos && activePlaylist.videos.length > 0
      ? activePlaylist.videos[Math.min(currentSongIndex, activePlaylist.videos.length - 1)] || activePlaylist.videos[0]
      : null;

  const selectPlaylist = useCallback((playlistId: string) => {
    const target = playlists.find(p => p.id === playlistId);
    if (target) {
      setActivePlaylistId(target.id);
      setCurrentSongIndex(0);
    }
  }, [playlists]);

  const selectSong = useCallback((index: number) => {
    if (!activePlaylist || !activePlaylist.videos) return;
    const clamped = Math.max(0, Math.min(activePlaylist.videos.length - 1, index));
    setCurrentSongIndex(clamped);
  }, [activePlaylist]);

  const nextSong = useCallback(() => {
    if (!activePlaylist || !activePlaylist.videos || activePlaylist.videos.length === 0) return;
    setCurrentSongIndex(prev => (prev + 1) % activePlaylist.videos.length);
  }, [activePlaylist]);

  const prevSong = useCallback((playbackCurrentTime: number = 0) => {
    if (!activePlaylist || !activePlaylist.videos || activePlaylist.videos.length === 0) return;

    // Requirement: if current song has played more than a few seconds (> 3s), restart current song
    if (playbackCurrentTime > 3) {
      // Return false/stay at same index, calling component can seekTo(0)
      return { restarted: true, index: currentSongIndex };
    }

    const newIndex = currentSongIndex === 0 ? activePlaylist.videos.length - 1 : currentSongIndex - 1;
    setCurrentSongIndex(newIndex);
    return { restarted: false, index: newIndex };
  }, [activePlaylist, currentSongIndex]);

  // Add new playlist from YouTube URL or ID
  const addPlaylistFromYouTube = useCallback(async (urlOrId: string): Promise<{ success: boolean; message: string; playlist?: Playlist }> => {
    const playlistId = extractPlaylistId(urlOrId);

    if (!playlistId) {
      return {
        success: false,
        message: 'अरे! यह वैध YouTube playlist URL नहीं है (Invalid YouTube Playlist URL or ID).'
      };
    }

    try {
      const response = await fetch(`/api/playlist?playlistId=${encodeURIComponent(playlistId)}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'NO_API_KEY') {
          return {
            success: false,
            message: 'YouTube API Key (YOUTUBE_API_KEY) सर्वर सेटिंग्स में उपलब्ध नहीं है। कृपया AI Studio Secrets में कुंजी जोड़ें।'
          };
        }
        return {
          success: false,
          message: data.message || 'Playlist unavailable. Please check the YouTube playlist link.'
        };
      }

      const newPlaylist: Playlist = {
        id: data.id || `custom-${playlistId}-${Date.now()}`,
        youtubePlaylistId: data.youtubePlaylistId || playlistId,
        title: data.title || 'Classic Hindi Playlist',
        description: data.description || '',
        thumbnail: data.thumbnail || (data.videos[0]?.thumbnail) || '',
        videos: data.videos || [],
        isCustom: true
      };

      setPlaylists(prev => [newPlaylist, ...prev.filter(p => p.youtubePlaylistId !== playlistId)]);
      setActivePlaylistId(newPlaylist.id);
      setCurrentSongIndex(0);

      return {
        success: true,
        message: `सफलतापूर्वक जोड़ी गई: "${newPlaylist.title}" (${newPlaylist.videos.length} गाने)`,
        playlist: newPlaylist
      };
    } catch (err) {
      console.error('Network failure adding playlist:', err);
      return {
        success: false,
        message: 'नेटवर्क संपर्क में त्रुटि आई (Network failure connecting to radio server).'
      };
    }
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists(prev => {
      const updated = prev.filter(p => p.id !== playlistId);
      return updated.length > 0 ? updated : PRESET_PLAYLISTS;
    });

    if (activePlaylistId === playlistId) {
      setActivePlaylistId(PRESET_PLAYLISTS[0].id);
      setCurrentSongIndex(0);
    }
  }, [activePlaylistId]);

  return {
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
  };
}
