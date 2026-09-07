import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerStatus } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerProps {
  initialVideoId?: string;
  onSongEnded?: () => void;
  onError?: (errorMessage: string) => void;
}

export function useYouTubePlayer({ initialVideoId, onSongEnded, onError }: UseYouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`).current;

  const [isReady, setIsReady] = useState<boolean>(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('UNSTARTED');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(85);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  // Stable callback refs
  const onSongEndedRef = useRef(onSongEnded);
  onSongEndedRef.current = onSongEnded;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Initialize player once YT is ready
  useEffect(() => {
    let checkInterval: any = null;

    const initPlayer = () => {
      const containerElem = document.getElementById(containerId);
      if (!containerElem || playerRef.current || !window.YT || !window.YT.Player) {
        return;
      }

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: '200',
          width: '200',
          videoId: initialVideoId || 'vXq_gLw1-f0',
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            origin: window.location.origin,
            modestbranding: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event: any) => {
              setIsReady(true);
              event.target.setVolume(85);
              setVolumeState(85);
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(dur);
              // Automatic start player playing current song on website open
              try {
                event.target.playVideo();
              } catch (playErr) {
                console.warn('Autoplay initial attempt:', playErr);
              }
            },
            onStateChange: (event: any) => {
              const state = event.data;
              if (window.YT) {
                switch (state) {
                  case window.YT.PlayerState.PLAYING:
                    setPlayerStatus('PLAYING');
                    setIsPlaying(true);
                    setIsBuffering(false);
                    const dur = event.target.getDuration();
                    if (dur) setDuration(dur);
                    break;
                  case window.YT.PlayerState.PAUSED:
                    setPlayerStatus('PAUSED');
                    setIsPlaying(false);
                    setIsBuffering(false);
                    break;
                  case window.YT.PlayerState.BUFFERING:
                    setPlayerStatus('BUFFERING');
                    setIsBuffering(true);
                    break;
                  case window.YT.PlayerState.ENDED:
                    setPlayerStatus('ENDED');
                    setIsPlaying(false);
                    setIsBuffering(false);
                    if (onSongEndedRef.current) {
                      onSongEndedRef.current();
                    }
                    break;
                  case window.YT.PlayerState.CUED:
                    setPlayerStatus('CUED');
                    setIsPlaying(false);
                    setIsBuffering(false);
                    break;
                  default:
                    setPlayerStatus('UNSTARTED');
                    setIsPlaying(false);
                    setIsBuffering(false);
                    break;
                }
              }
            },
            onError: (event: any) => {
              console.warn('YouTube Player Event Error:', event.data);
              let msg = 'गाने की धुन लोड करने में समस्या आई (Failed to play track).';
              if (event.data === 101 || event.data === 150) {
                msg = 'इस गाने का प्रसारण YouTube द्वारा प्रतिबंधित है, अगला गाना बजा रहे हैं...';
              } else if (event.data === 100) {
                msg = 'यह गाना उपलब्ध नहीं है (Video not found or removed).';
              }
              if (onErrorRef.current) onErrorRef.current(msg);
              // If restricted, automatically try the next song
              if (event.data === 101 || event.data === 150) {
                setTimeout(() => {
                  if (onSongEndedRef.current) onSongEndedRef.current();
                }, 1200);
              }
            }
          }
        });
      } catch (err) {
        console.error('Error creating YouTube Player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 150);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [containerId, initialVideoId]);

  // Polling playback time every 250ms when playing
  useEffect(() => {
    let timer: any = null;

    if (isPlaying && playerRef.current) {
      timer = setInterval(() => {
        try {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const time = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            setCurrentTime(time);
            if (dur > 0) setDuration(dur);
          }
        } catch {
          // ignore
        }
      }, 250);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  const playVideo = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        console.warn('playVideo error', e);
      }
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {
        console.warn('pauseVideo error', e);
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  }, [isPlaying, pauseVideo, playVideo]);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(seconds, true);
        setCurrentTime(seconds);
      } catch (e) {
        console.warn('seekTo error', e);
      }
    }
  }, []);

  const skipSeconds = useCallback((offset: number) => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        const cur = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        const target = Math.max(0, Math.min(dur || 9999, cur + offset));
        seekTo(target);
      } catch (e) {
        console.warn('skipSeconds error', e);
      }
    }
  }, [seekTo]);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(100, newVol));
    setVolumeState(clamped);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(clamped);
      } catch (e) {
        console.warn('setVolume error', e);
      }
    }
  }, []);

  const loadVideo = useCallback((videoId: string, autoPlay: boolean = true) => {
    if (!videoId) return;
    setCurrentTime(0);
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      try {
        if (autoPlay) {
          playerRef.current.loadVideoById(videoId);
          setIsPlaying(true);
        } else {
          playerRef.current.cueVideoById(videoId);
          setIsPlaying(false);
        }
      } catch (e) {
        console.warn('loadVideo error', e);
      }
    }
  }, []);

  return {
    containerId,
    isReady,
    isPlaying,
    playerStatus,
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
  };
}
