/**
 * Extracts a YouTube playlist ID from various URL formats or raw ID string.
 */
export function extractPlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. If user pasted just the ID (e.g., PLFgquLnL59alGJcdc0BEZJb2p7IgkL0Ce or OLAK5uy_...)
  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    
    // Check search params for `list`
    const listParam = url.searchParams.get('list');
    if (listParam) {
      return listParam;
    }

    // Sometimes path is /playlist/PL...
    if (url.pathname.includes('/playlist/')) {
      const parts = url.pathname.split('/playlist/');
      if (parts[1]) {
        return parts[1].split('/')[0].split('?')[0];
      }
    }
  } catch {
    // Try regex fallback for dirty strings
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extracts a single YouTube video ID from various URL formats.
 */
export function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Raw 11-char ID (standard YouTube video ID)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. youtu.be shortlinks
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // 3. watch?v=...
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  // 4. embed or v URL
  const embedMatch = trimmed.match(/\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Formats seconds into MM:SS format (e.g. 02:34)
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export * from './youtubeRss';
