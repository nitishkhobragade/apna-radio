import { useState, useEffect, useCallback } from 'react';
import { Playlist, VideoItem } from '../types';
import { PRESET_PLAYLISTS } from '../config';
import {
  extractPlaylistId,
  extractVideoId,
  fetchYouTubeOEmbed,
  fetchYouTubePlaylistRss,
  parseYouTubeRssXml,
  fetchFullPlaylistDataset,
  resolvePlaylistTrackTitles,
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
        // Supports exact match or partial/prefix match (e.g. if URL has truncated ID or extra params)
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

        // 1. Fetch metadata directly via official YouTube oEmbed API
        const oembedPromise = fetchYouTubeOEmbed(playlistId, true);

        // 2. Fetch full playlist dataset (Invidious API JSON or RSS XML)
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

        // If any songs still have generic titles, enrich them
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
        // Single video URL support
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

        // If player discovered the full playlist video IDs from YouTube
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

        // Update the active video title and artist
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
    selectPlaylist,
    selectSong,
    nextSong,
    prevSong,
    addPlaylistFromYouTube,
    syncTrackFromPlayer,
    deletePlaylist,
  };
}
