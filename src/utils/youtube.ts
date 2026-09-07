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
 * Formats seconds into MM:SS format (e.g. 02:34)
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
