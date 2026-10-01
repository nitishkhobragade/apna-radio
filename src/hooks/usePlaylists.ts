/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import { useState, useEffect, useCallback } from 'react';
import { Playlist, VideoItem, HistoryItem } from '../types';
import { PRESET_PLAYLISTS } from '../config';
import {
  extractPlaylistId,
  extractVideoId,
  fetchYouTubeOEmbed,
  fetchFullPlaylistDataset,
  resolvePlaylistTrackTitles,
} from '../utils/youtube';

const STORAGE_PLAYLISTS_KEY = 'apna_radio_saved_playlists_v3';
const STORAGE_ACTIVE_PLAYLIST_KEY = 'apna_radio_active_playlist_id_v3';
const STORAGE_ACTIVE_INDEX_KEY = 'apna_radio_active_song_index_v3';
const STORAGE_HISTORY_KEY = 'apna_radio_play_history_v1';

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

  // Client-Side Listening History
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse history from localStorage', e);
    }
    return [];
  });

  // Save playlists to localStorage
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

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [history]);

  // Auto-enrich any existing saved tracks in playlists that show generic "Track #"
  useEffect(() => {
    playlists.forEach((p) => {
      const hasGeneric = p.videos.some(
        (v) => !v.title || v.title.startsWith('Track #') || v.title === 'Classic Track'
      );
      if (hasGeneric) {
        resolvePlaylistTrackTitles(p.videos, (resolved) => {
          setPlaylists((latest) =>
            latest.map((item) => (item.id === p.id ? { ...item, videos: resolved } : item))
          );
        });
      }
    });
  }, []);

  // History Helper: Add song to history
  const addToHistory = useCallback((track: {
    videoId: string;
    title: string;
    channelTitle?: string;
    artist?: string;
    thumbnail?: string;
    duration?: string;
    durationSeconds?: number;
  }) => {
    if (!track.videoId) return;
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.videoId !== track.videoId);
      const newEntry: HistoryItem = {
        videoId: track.videoId,
        title: track.title,
        channelTitle: track.channelTitle || track.artist || 'YouTube Music',
        artist: track.artist || track.channelTitle || 'YouTube Music',
        thumbnail: track.thumbnail || `https://img.youtube.com/vi/${track.videoId}/hqdefault.jpg`,
        duration: track.duration || '03:45',
        durationSeconds: track.durationSeconds || 225,
        position: 0,
        playedAt: Date.now(),
      };
      return [newEntry, ...filtered].slice(0, 100);
    });
  }, []);

  const removeFromHistory = useCallback((videoId: string) => {
    setHistory((prev) => prev.filter((h) => h.videoId !== videoId));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Current active playlist object
  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0] || PRESET_PLAYLISTS[0];

  // Current active song object
  const currentSong: VideoItem | null =
    activePlaylist && activePlaylist.videos && activePlaylist.videos.length > 0
      ? activePlaylist.videos[Math.min(currentSongIndex, activePlaylist.videos.length - 1)] || activePlaylist.videos[0]
      : null;

  // Whenever a song is active and playing, log it to history
  useEffect(() => {
    if (currentSong && currentSong.videoId && currentSong.title && !currentSong.title.startsWith('Track #')) {
      addToHistory({
        videoId: currentSong.videoId,
        title: currentSong.title,
        channelTitle: currentSong.channelTitle,
        artist: currentSong.artist,
        thumbnail: currentSong.thumbnail,
        duration: currentSong.duration,
        durationSeconds: currentSong.durationSeconds,
      });
    }
  }, [currentSong?.videoId, currentSong?.title, addToHistory]);

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

    if (playbackCurrentTime > 3) {
      return { restarted: true, index: currentSongIndex };
    }

    const newIndex = currentSongIndex === 0 ? activePlaylist.videos.length - 1 : currentSongIndex - 1;
    setCurrentSongIndex(newIndex);
    return { restarted: false, index: newIndex };
  }, [activePlaylist, currentSongIndex]);

  // Play a song from history -> Acts as a playlist and plays one-by-one!
  const playHistorySong = useCallback((videoId: string) => {
    if (history.length === 0) return;
    const HISTORY_PLAYLIST_ID = 'playlist-history';
    const index = history.findIndex(h => h.videoId === videoId);
    const targetIndex = index >= 0 ? index : 0;

    const historyPlaylist: Playlist = {
      id: HISTORY_PLAYLIST_ID,
      youtubePlaylistId: `custom-history-${Date.now()}`,
      title: 'इतिहास के गाने (Listening History)',
      description: 'Songs played from your personal listening history',
      thumbnail: history[0]?.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80',
      videos: history.map((h, i) => ({ ...h, position: i })),
      isCustom: true,
    };

    setPlaylists(prev => [historyPlaylist, ...prev.filter(p => p.id !== HISTORY_PLAYLIST_ID)]);
    setActivePlaylistId(HISTORY_PLAYLIST_ID);
    setCurrentSongIndex(targetIndex);
  }, [history]);

  // Play entire history sequentially
  const playAllHistory = useCallback(() => {
    if (history.length === 0) return;
    playHistorySong(history[0].videoId);
  }, [history, playHistorySong]);

  // Save history tracks as a custom new named playlist
  const createPlaylistFromHistory = useCallback((customTitle?: string): Playlist => {
    const newId = `custom-mix-${Date.now()}`;
    const newPlaylist: Playlist = {
      id: newId,
      youtubePlaylistId: `custom-mix-${Date.now()}`,
      title: customTitle || 'इतिहास की प्लेलिस्ट (History Mix)',
      description: `Created from listening history (${history.length} songs)`,
      thumbnail: history[0]?.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80',
      videos: history.map((h, i) => ({ ...h, position: i })),
      isCustom: true,
    };
    setPlaylists(prev => [newPlaylist, ...prev]);
    setActivePlaylistId(newId);
    setCurrentSongIndex(0);
    return newPlaylist;
  }, [history]);

  // Add new playlist from YouTube URL or ID
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
        const existingPreset = PRESET_PLAYLISTS.find(
          p => p.youtubePlaylistId === playlistId ||
               playlistId.startsWith(p.youtubePlaylistId.slice(0, 15)) ||
               p.youtubePlaylistId.startsWith(playlistId.slice(0, 15))
        );
        if (existingPreset) {
          setPlaylists(prev => [existingPreset, ...prev.filter(p => p.youtubePlaylistId !== existingPreset.youtubePlaylistId)]);
          setActivePlaylistId(existingPreset.id);
          setCurrentSongIndex(0);
          return {
            success: true,
            message: `सफलतापूर्वक लोड की गई: "${existingPreset.title}" (${existingPreset.videos.length} गाने)`,
            playlist: existingPreset
          };
        }

        const oembedPromise = fetchYouTubeOEmbed(playlistId, true);
        const datasetPromise = fetchFullPlaylistDataset(playlistId);

        const [oembed, dataset] = await Promise.all([oembedPromise, datasetPromise]);

        const title = dataset?.title || oembed?.title || 'YouTube Playlist';
        const author = dataset?.author || oembed?.author || 'YouTube Music';
        const firstVidId = dataset?.videos?.[0]?.videoId || oembed?.firstVideoId || 'vXq_gLw1-f0';
        const thumb = dataset?.videos?.[0]?.thumbnail || oembed?.thumbnail || `https://img.youtube.com/vi/${firstVidId}/hqdefault.jpg`;

        let videos: VideoItem[] = (dataset?.videos && dataset.videos.length > 0)
          ? dataset.videos
          : [
              {
                videoId: firstVidId,
                title: title,
                channelTitle: author,
                artist: author,
                duration: '03:45',
                durationSeconds: 225,
                thumbnail: thumb,
                position: 0,
              }
            ];

        if (videos.some(v => !v.title || v.title.startsWith('Track #') || v.title === 'Classic Track')) {
          resolvePlaylistTrackTitles(videos, (resolved) => {
            setPlaylists(latest => latest.map(item => item.id === `custom-${playlistId}` ? { ...item, videos: resolved } : item));
          });
        }

        newPlaylist = {
          id: `custom-${playlistId}`,
          youtubePlaylistId: playlistId,
          title: title,
          description: `Playlist by ${author}`,
          thumbnail: thumb,
          videos,
          isCustom: true
        };
      } else if (videoId) {
        const oembed = await fetchYouTubeOEmbed(videoId, false);
        const title = oembed?.title || 'YouTube Track';
        const author = oembed?.author || 'YouTube';
        const thumb = oembed?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        newPlaylist = {
          id: `custom-song-${videoId}`,
          youtubePlaylistId: videoId,
          title: title,
          description: `Single YouTube Track by ${author}`,
          thumbnail: thumb,
          videos: [
            {
              videoId,
              title,
              channelTitle: author,
              artist: author,
              duration: '03:45',
              durationSeconds: 225,
              thumbnail: thumb,
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
        message: `सफलतापूर्वक जोड़ी गई: "${newPlaylist.title}"`,
        playlist: newPlaylist
      };
    } catch (err: any) {
      console.error('Client-side playlist add error:', err);
      return {
        success: false,
        message: 'प्लेलिस्ट लोड करने में त्रुटि आई। कृपया सुनिश्चित करें कि यह YouTube playlist "Public" है।'
      };
    }
  }, []);

  // Play a song directly from search results
  const playSearchedSong = useCallback((track: {
    videoId: string;
    title: string;
    author: string;
    thumbnail: string;
    duration?: string;
    durationSeconds?: number;
  }) => {
    const videoItem: VideoItem = {
      videoId: track.videoId,
      title: track.title,
      channelTitle: track.author,
      artist: track.author,
      thumbnail: track.thumbnail || `https://img.youtube.com/vi/${track.videoId}/hqdefault.jpg`,
      duration: track.duration || '03:45',
      durationSeconds: track.durationSeconds || 225,
      position: 0,
    };

    // Immediately record in history
    addToHistory({
      videoId: track.videoId,
      title: track.title,
      channelTitle: track.author,
      artist: track.author,
      thumbnail: track.thumbnail,
      duration: track.duration,
      durationSeconds: track.durationSeconds,
    });

    setPlaylists(prev => {
      const SEARCH_PLAYLIST_ID = 'playlist-searched-songs';
      const existing = prev.find(p => p.id === SEARCH_PLAYLIST_ID);

      if (existing) {
        const withoutDuplicate = existing.videos.filter(v => v.videoId !== track.videoId);
        const updatedVideos = [videoItem, ...withoutDuplicate].map((v, i) => ({ ...v, position: i }));
        const updated: Playlist = {
          ...existing,
          title: 'खोजे गए गाने (Searched Tracks)',
          thumbnail: track.thumbnail || existing.thumbnail,
          videos: updatedVideos,
        };
        return [updated, ...prev.filter(p => p.id !== SEARCH_PLAYLIST_ID)];
      } else {
        const newSearchPlaylist: Playlist = {
          id: SEARCH_PLAYLIST_ID,
          youtubePlaylistId: `custom-search-${track.videoId}`,
          title: 'खोजे गए गाने (Searched Tracks)',
          description: 'Tracks searched and played directly from YouTube',
          thumbnail: track.thumbnail,
          videos: [videoItem],
          isCustom: true,
        };
        return [newSearchPlaylist, ...prev];
      }
    });

    setActivePlaylistId('playlist-searched-songs');
    setCurrentSongIndex(0);
  }, [addToHistory]);

  const syncTrackFromPlayer = useCallback((info: {
    videoId: string;
    title: string;
    author: string;
    index?: number;
    playlistIds?: string[];
  }) => {
    setPlaylists(prev => {
      return prev.map(p => {
        if (p.id !== activePlaylistId) return p;

        let updatedVideos = [...p.videos];
        let hasNewGenericTracks = false;

        if (info.playlistIds && info.playlistIds.length > 1 && (updatedVideos.length <= 1 || updatedVideos.length < info.playlistIds.length)) {
          updatedVideos = info.playlistIds.map((vId, idx) => {
            const existing = updatedVideos.find(v => v.videoId === vId);
            if (existing && existing.title && !existing.title.startsWith('Track #') && existing.title !== 'Classic Track') {
              return existing;
            }
            if (vId === info.videoId && info.title) {
              return {
                videoId: vId,
                title: info.title,
                channelTitle: info.author || p.description || 'YouTube Music',
                artist: info.author || p.description || 'YouTube Music',
                duration: existing?.duration || '03:30',
                durationSeconds: existing?.durationSeconds || 210,
                thumbnail: existing?.thumbnail || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
                position: idx,
              };
            }
            hasNewGenericTracks = true;
            return {
              videoId: vId,
              title: existing?.title || `Track #${idx + 1}`,
              channelTitle: existing?.channelTitle || p.description || 'YouTube Music',
              artist: existing?.artist || existing?.channelTitle || p.description || 'YouTube Music',
              duration: existing?.duration || '03:30',
              durationSeconds: existing?.durationSeconds || 210,
              thumbnail: existing?.thumbnail || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
              position: idx,
            };
          });
        }

        if (info.videoId) {
          updatedVideos = updatedVideos.map((v, idx) => {
            const isTarget = v.videoId === info.videoId || (info.index !== undefined && idx === info.index);
            if (isTarget) {
              return {
                ...v,
                videoId: info.videoId,
                title: info.title || v.title,
                channelTitle: info.author || v.channelTitle,
                artist: info.author || v.artist || v.channelTitle,
              };
            }
            return v;
          });
        }

        if (hasNewGenericTracks) {
          setTimeout(() => {
            resolvePlaylistTrackTitles(updatedVideos, (resolved) => {
              setPlaylists(latest => latest.map(item => item.id === p.id ? { ...item, videos: resolved } : item));
            });
          }, 100);
        }

        return {
          ...p,
          videos: updatedVideos,
        };
      });
    });

    if (info.index !== undefined && info.index >= 0) {
      setCurrentSongIndex(info.index);
    }
  }, [activePlaylistId]);

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
    history,
    historyCount: history.length,
    addToHistory,
    removeFromHistory,
    clearHistory,
    playHistorySong,
    playAllHistory,
    createPlaylistFromHistory,
    selectPlaylist,
    selectSong,
    nextSong,
    prevSong,
    addPlaylistFromYouTube,
    playSearchedSong,
    syncTrackFromPlayer,
    deletePlaylist,
  };
}
