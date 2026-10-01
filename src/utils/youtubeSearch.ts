/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import { extractVideoId, decodeHtmlEntities } from './youtube';

export interface SearchResultItem {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
}

/**
 * Format total seconds into a clean MM:SS or HH:MM:SS string
 */
export function formatDurationSeconds(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) {
    return '03:45';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Perform a fast, client-side, 100% free YouTube video search without API keys.
 * Uses public Invidious API instances and CORS proxies with racing fallbacks.
 */
export async function searchYouTubeVideos(
  query: string,
  signal?: AbortSignal
): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // Check if user pasted a direct YouTube link or 11-char video ID
  const directVidId = extractVideoId(cleanQuery);
  if (directVidId) {
    return [
      {
        videoId: directVidId,
        title: cleanQuery.includes('/') ? 'Direct YouTube Track' : `YouTube Song (${directVidId})`,
        author: 'YouTube',
        thumbnail: `https://img.youtube.com/vi/${directVidId}/hqdefault.jpg`,
        duration: '03:45',
        durationSeconds: 225,
      },
    ];
  }

  const encoded = encodeURIComponent(cleanQuery);

  // List of high-reliability endpoints to race with CORS support
  const endpoints = [
    // 1. Direct Invidious instance with CORS: *
    `https://invidious.f5.si/api/v1/search?q=${encoded}&type=video`,
    // 2. CorsProxy wrapped instance
    `https://corsproxy.io/?url=${encodeURIComponent(`https://invidious.materialio.us/api/v1/search?q=${encoded}&type=video`)}`,
    // 3. AllOrigins raw proxy wrapped instance
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://invidious.f5.si/api/v1/search?q=${encoded}&type=video`)}`,
    // 4. Secondary backup
    `https://corsproxy.io/?url=${encodeURIComponent(`https://invidious.f5.si/api/v1/search?q=${encoded}&type=video`)}`,
  ];

  // Helper to fetch from one endpoint with a short timeout
  const fetchEndpoint = async (url: string): Promise<SearchResultItem[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const onParentAbort = () => controller.abort();
    if (signal) {
      signal.addEventListener('abort', onParentAbort);
    }

    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No items in response');
      }

      const results: SearchResultItem[] = [];

      for (const item of data) {
        if (!item || !item.videoId || item.type === 'channel' || item.type === 'playlist') {
          continue;
        }

        const vidId = String(item.videoId).trim();
        if (vidId.length !== 11) continue;

        const rawTitle = item.title || 'Untitled Song';
        const rawAuthor = item.author || item.channelTitle || 'YouTube Artist';
        const sec = Number(item.lengthSeconds) || 225;

        results.push({
          videoId: vidId,
          title: decodeHtmlEntities(rawTitle),
          author: decodeHtmlEntities(rawAuthor),
          thumbnail: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
          duration: formatDurationSeconds(sec),
          durationSeconds: sec,
        });

        if (results.length >= 25) break;
      }

      if (results.length === 0) {
        throw new Error('No valid video items parsed');
      }

      return results;
    } finally {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onParentAbort);
      }
    }
  };

  // Attempt the fast direct endpoint first
  try {
    const directResults = await fetchEndpoint(endpoints[0]);
    if (directResults.length > 0) {
      return directResults;
    }
  } catch {
    // Direct endpoint failed, fall through to racing backups
  }

  // Race remaining proxies in parallel
  const backupEndpoints = endpoints.slice(1);
  try {
    const backupResults = await Promise.any(backupEndpoints.map((ep) => fetchEndpoint(ep)));
    return backupResults;
  } catch (err: any) {
    console.warn('All search endpoints failed or timed out:', err);
    throw new Error('गाने खोजने में असमर्थ। कृपया इंटरनेट कनेक्शन जांचें या दूसरा कीवर्ड आज़माएं।');
  }
}
