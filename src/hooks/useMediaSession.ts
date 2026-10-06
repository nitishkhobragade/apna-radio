/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import { useEffect, useRef } from 'react';
import { VideoItem } from '../types';
import { playBackgroundAudio, pauseBackgroundAudio, SILENT_AUDIO_URI } from '../utils/backgroundAudio';

interface UseMediaSessionProps {
  currentSong: VideoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activePlaylistTitle?: string;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeekTo: (seconds: number) => void;
  onSkipSeconds: (seconds: number) => void;
}

export function useMediaSession({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  activePlaylistTitle,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onSeekTo,
  onSkipSeconds,
}: UseMediaSessionProps) {
  const wakeLockRef = useRef<any>(null);

  // Keep latest callbacks in refs so event listeners never get stale
  const callbacksRef = useRef({
    onPlay,
    onPause,
    onNext,
    onPrev,
    onSeekTo,
    onSkipSeconds,
  });

  useEffect(() => {
    callbacksRef.current = {
      onPlay,
      onPause,
      onNext,
      onPrev,
      onSeekTo,
      onSkipSeconds,
    };
  });

  // 1. Synchronize HTML5 silent audio anchor with playback state
  useEffect(() => {
    if (isPlaying) {
      playBackgroundAudio();
    } else {
      pauseBackgroundAudio();
    }
  }, [isPlaying]);

  // 2. Screen Wake Lock management (if supported by modern mobile browser)
  useEffect(() => {
    let released = false;

    const requestLock = async () => {
      if ('wakeLock' in navigator && isPlaying && !wakeLockRef.current) {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (!released) {
            wakeLockRef.current = lock;
            lock.addEventListener('release', () => {
              wakeLockRef.current = null;
            });
          } else {
            lock.release();
          }
        } catch {
          // Wake lock rejected or unsupported; safe to ignore
        }
      }
    };

    if (isPlaying) {
      requestLock();
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }

    return () => {
      released = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isPlaying]);

  // 3. Update MediaSession metadata & action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentSong) {
      const defaultArtwork = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=512&auto=format&fit=crop&q=80';
      const coverArt = currentSong.thumbnail || defaultArtwork;

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.title || 'पुराना नगमा',
          artist: currentSong.channelTitle || currentSong.artist || 'अपना रेडियो',
          album: activePlaylistTitle || 'Retro Cassette Tape',
          artwork: [
            { src: coverArt, sizes: '96x96', type: 'image/jpeg' },
            { src: coverArt, sizes: '128x128', type: 'image/jpeg' },
            { src: coverArt, sizes: '192x192', type: 'image/jpeg' },
            { src: coverArt, sizes: '256x256', type: 'image/jpeg' },
            { src: coverArt, sizes: '384x384', type: 'image/jpeg' },
            { src: coverArt, sizes: '512x512', type: 'image/jpeg' },
          ],
        });
      } catch (e) {
        console.warn('Error setting MediaMetadata:', e);
      }
    }

    // Register Media Session Action Handlers
    const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
      [
        'play',
        () => {
          // Directly resume audio anchor and invoke player playVideo
          playBackgroundAudio();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
          callbacksRef.current.onPlay();
        },
      ],
      [
        'pause',
        () => {
          pauseBackgroundAudio();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
          callbacksRef.current.onPause();
        },
      ],
      [
        'previoustrack',
        () => {
          playBackgroundAudio();
          callbacksRef.current.onPrev();
        },
      ],
      [
        'nexttrack',
        () => {
          playBackgroundAudio();
          callbacksRef.current.onNext();
        },
      ],
      ['seekbackward', (details) => callbacksRef.current.onSkipSeconds(-(details.seekOffset || 10))],
      ['seekforward', (details) => callbacksRef.current.onSkipSeconds(details.seekOffset || 10)],
      [
        'seekto',
        (details) => {
          if (typeof details.seekTime === 'number') {
            callbacksRef.current.onSeekTo(details.seekTime);
          }
        },
      ],
      [
        'stop',
        () => {
          pauseBackgroundAudio();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
          }
          callbacksRef.current.onPause();
        },
      ],
    ];

    actions.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Browser does not support this specific action
      }
    });

    return () => {
      actions.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      });
    };
  }, [currentSong, activePlaylistTitle]);

  // 4. Keep playbackState updated
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // 5. Update position state for scrub bar on lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) {
      return;
    }

    if (duration > 0 && currentTime >= 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, 0.1),
          playbackRate: 1,
          position: Math.min(Math.max(currentTime, 0), duration),
        });
      } catch {
        // Ignore any scrub sync edge cases
      }
    }
  }, [currentTime, duration]);
}
