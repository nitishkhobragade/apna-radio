import { useState, useEffect, useCallback } from 'react';
import { Playlist, VideoItem } from '../types';
import { PRESET_PLAYLISTS } from '../config';
import {
  extractPlaylistId,
  extractVideoId,
  fetchYouTubePlaylistRss,
  parseYouTubeRssXml,
} from '../utils/youtube';

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

  // Add new playlist from YouTube URL or ID (100% Client-Side via RSS + CORS Proxies)
  const addPlaylistFromYouTube = useCallback(async (urlOrId: string): Promise<{ success: boolean; message: string; playlist?: Playlist }> => {
    const playlistId = extractPlaylistId(urlOrId);
    const videoId = !playlistId ? extractVideoId(urlOrId) : null;

    if (!playlistId && !videoId) {
      return {
        success: false,
        message: 'अरे! यह वैध YouTube playlist या वीडियो URL नहीं है (Invalid YouTube URL).'
      };
    }

    try {
      let newPlaylist: Playlist;

      if (playlistId) {
        // Fast path: Check if this playlist is already one of the preset playlists
        const existingPreset = PRESET_PLAYLISTS.find(p => p.youtubePlaylistId === playlistId);
        if (existingPreset) {
          setPlaylists(prev => [existingPreset, ...prev.filter(p => p.youtubePlaylistId !== playlistId)]);
          setActivePlaylistId(existingPreset.id);
          setCurrentSongIndex(0);
          return {
            success: true,
            message: `सफलतापूर्वक लोड की गई: "${existingPreset.title}" (${existingPreset.videos.length} गाने)`,
            playlist: existingPreset
          };
        }

        // Fetch client-side via YouTube public RSS feed with CORS proxy fallbacks
        const rssXml = await fetchYouTubePlaylistRss(playlistId);
        const parsed = parseYouTubeRssXml(rssXml, playlistId);

        if (!parsed.videos || parsed.videos.length === 0) {
          return {
            success: false,
            message: 'इस प्लेलिस्ट में कोई सार्वजनिक गाने नहीं मिले। कृपया सुनिश्चित करें कि प्लेलिस्ट "Public" या "Unlisted" है।'
          };
        }

        newPlaylist = {
          id: `custom-${playlistId}-${Date.now()}`,
          youtubePlaylistId: playlistId,
          title: parsed.title,
          description: `${parsed.videos.length} evergreen songs • ${parsed.author}`,
          thumbnail: parsed.videos[0]?.thumbnail || `https://img.youtube.com/vi/${parsed.videos[0]?.videoId}/hqdefault.jpg`,
          videos: parsed.videos,
          isCustom: true
        };
      } else if (videoId) {
        // Single video URL support
        newPlaylist = {
          id: `custom-song-${videoId}-${Date.now()}`,
          youtubePlaylistId: videoId,
          title: 'YouTube Track',
          description: 'Single YouTube Song',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          videos: [
            {
              videoId,
              title: 'YouTube Song',
              channelTitle: 'YouTube',
              duration: '03:45',
              durationSeconds: 225,
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              position: 0
            }
          ],
          isCustom: true
        };
      } else {
        return {
          success: false,
          message: 'कृपया वैध YouTube लिंक दर्ज करें।'
        };
      }

      setPlaylists(prev => [newPlaylist, ...prev.filter(p => p.youtubePlaylistId !== newPlaylist.youtubePlaylistId)]);
      setActivePlaylistId(newPlaylist.id);
      setCurrentSongIndex(0);

      return {
        success: true,
        message: `सफलतापूर्वक जोड़ी गई: "${newPlaylist.title}" (${newPlaylist.videos.length} गाने)`,
        playlist: newPlaylist
      };
    } catch (err: any) {
      console.error('Client-side playlist fetch failed:', err);
      if (err?.message === 'PLAYLIST_NOT_FOUND') {
        return {
          success: false,
          message: 'प्लेलिस्ट नहीं मिली (404 Not Found)। कृपया सुनिश्चित करें कि YouTube playlist लिंक सही और Public है।'
        };
      }
      return {
        success: false,
        message: 'प्लेलिस्ट लोड करने में त्रुटि आई। कृपया सुनिश्चित करें कि यह YouTube playlist "Public" है।'
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
