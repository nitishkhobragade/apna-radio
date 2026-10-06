/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import { useEffect, useRef } from 'react';
import { VideoItem } from '../types';

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

/**
 * Creates a valid, standard 1-second 8kHz 8-bit mono silent WAV Blob URL.
 * Used as a zero-overhead audio anchor for mobile Chrome to maintain
 * background media playback & notification lock when minimized or screen locked.
 */
function createSilentWavBlobUrl(): string {
  try {
    const sampleRate = 8000;
    const numSamples = 8000;
    const headerByteLength = 44;
    const totalLength = headerByteLength + numSamples;
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // 'RIFF'
    view.setUint32(4, 36 + numSamples, true); // size - 8
    view.setUint32(8, 0x57415645, false); // 'WAVE'

    // 'fmt ' sub-chunk
    view.setUint32(12, 0x666d7420, false); // 'fmt '
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true); // SampleRate (8000)
    view.setUint32(28, sampleRate, true); // ByteRate (sampleRate * 1 * 1)
    view.setUint16(32, 1, true); // BlockAlign (1)
    view.setUint16(34, 8, true); // BitsPerSample (8)

    // 'data' sub-chunk
    view.setUint32(36, 0x64617461, false); // 'data'
    view.setUint32(40, numSamples, true); // Subchunk2Size

    // Fill data with 128 (8-bit unsigned PCM center silence)
    const bytes = new Uint8Array(buffer, headerByteLength);
    bytes.fill(128);

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Silent audio blob generation fallback', e);
    // Minimal 44-byte silent WAV data URI fallback
    return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  }
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
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
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

  // 1. Initialize silent audio anchor for background playback retention
  useEffect(() => {
    let silentUrl = '';
    try {
      silentUrl = createSilentWavBlobUrl();
      const audio = new Audio(silentUrl);
      audio.loop = true;
      audio.volume = 0.001; // extremely low volume to register active audio output in OS
      audio.preload = 'auto';
      silentAudioRef.current = audio;
    } catch (e) {
      console.warn('Could not initialize silent audio anchor:', e);
    }

    return () => {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
        silentAudioRef.current.src = '';
        silentAudioRef.current = null;
      }
      if (silentUrl && silentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(silentUrl);
      }
    };
  }, []);

  // 2. Play or pause silent audio anchor with playback state
  useEffect(() => {
    const audio = silentAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {
        // May wait for initial user interaction on mobile
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // 3. Screen Wake Lock management (if supported by modern mobile browser)
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

  // 4. Update MediaSession metadata & action handlers
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
      ['play', () => callbacksRef.current.onPlay()],
      ['pause', () => callbacksRef.current.onPause()],
      ['previoustrack', () => callbacksRef.current.onPrev()],
      ['nexttrack', () => callbacksRef.current.onNext()],
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
      ['stop', () => callbacksRef.current.onPause()],
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

  // 5. Update playback state (playing / paused)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // 6. Update position state for lockscreen scrub bar
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
        // Ignore any fast scrubbing/out of sync edge cases
      }
    }
  }, [currentTime, duration]);
}
