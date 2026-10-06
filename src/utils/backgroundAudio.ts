/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

export const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

let backgroundAudioElement: HTMLAudioElement | null = null;

/**
 * Returns or creates the native hidden HTML5 <audio> element.
 * Playing this element within user gestures unlocks mobile Chrome's audio engine
 * and maintains the Android Media Session in the notification tray even when
 * document.visibilityState is 'hidden'.
 */
export function getBackgroundAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!backgroundAudioElement) {
    backgroundAudioElement = document.getElementById('apna-radio-bg-audio-anchor') as HTMLAudioElement;
    if (!backgroundAudioElement) {
      backgroundAudioElement = new Audio(SILENT_AUDIO_URI);
      backgroundAudioElement.id = 'apna-radio-bg-audio-anchor';
      backgroundAudioElement.loop = true;
      backgroundAudioElement.volume = 0.001;
      backgroundAudioElement.preload = 'auto';
      backgroundAudioElement.setAttribute('playsinline', 'true');
      backgroundAudioElement.setAttribute('webkit-playsinline', 'true');
      document.body.appendChild(backgroundAudioElement);
    }
  }

  return backgroundAudioElement;
}

/**
 * Triggered synchronously inside user gesture actions (play, toggle, next, prev, selectSong)
 * to unlock background audio permissions in mobile Chrome.
 */
export function playBackgroundAudio(): Promise<void> {
  const audio = getBackgroundAudioElement();
  if (audio) {
    if (!audio.src || !audio.src.startsWith('data:audio/wav')) {
      audio.src = SILENT_AUDIO_URI;
    }
    audio.loop = true;
    return audio.play().catch((err) => {
      // Autoplay or background restriction catch
      console.warn('Background audio anchor play error (waiting for user gesture):', err);
    });
  }
  return Promise.resolve();
}

/**
 * Pauses the background audio anchor when user explicitly pauses music.
 */
export function pauseBackgroundAudio(): void {
  const audio = getBackgroundAudioElement();
  if (audio) {
    audio.pause();
  }
}
