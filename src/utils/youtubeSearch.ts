/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import { extractVideoId, fetchYouTubeOEmbed } from './youtube';
import { decodeHtmlEntities } from './youtubeRss';

export interface SearchResultItem {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
}

// Fast in-memory session cache for instant repeated queries
const searchCache = new Map<string, SearchResultItem[]>();

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
 * Normalize raw items from either Piped API ({ items: [...] }) or Invidious API ([...])
 */
export function parseSearchItemsPayload(data: any, allowShorts = false): SearchResultItem[] {
  const rawList: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  if (rawList.length === 0) return [];

  const results: SearchResultItem[] = [];
  const seenIds = new Set<string>();

  for (const item of rawList) {
    if (!item) continue;

    // Skip channels or playlists
    if (item.type === 'channel' || item.type === 'playlist') continue;
    if (!allowShorts && item.isShort === true) continue;

    // Extract 11-char videoId from videoId, id, or Piped url ("/watch?v=...")
    let vidId = '';
    if (typeof item.videoId === 'string' && item.videoId.trim().length === 11) {
      vidId = item.videoId.trim();
    } else if (typeof item.url === 'string') {
      vidId = extractVideoId(item.url) || '';
    } else if (typeof item.id === 'string' && item.id.trim().length === 11) {
      vidId = item.id.trim();
    }

    if (vidId.length !== 11 || seenIds.has(vidId)) continue;

    const rawDuration =
      typeof item.duration === 'number'
        ? item.duration
        : typeof item.lengthSeconds === 'number'
        ? item.lengthSeconds
        : Number(item.durationSeconds || 0);

    // Filter out very short clips (< 45s) unless allowShorts is true
    if (!allowShorts && rawDuration > 0 && rawDuration < 45) continue;

    const sec = rawDuration > 0 ? rawDuration : 225;
    const rawTitle = item.title || 'Untitled Song';
    const rawAuthor =
      item.uploaderName || item.author || item.channelTitle || item.artist || 'YouTube Music';

    seenIds.add(vidId);
    results.push({
      videoId: vidId,
      title: decodeHtmlEntities(String(rawTitle)),
      author: decodeHtmlEntities(String(rawAuthor).replace(/\s*-\s*Topic$/i, '').trim()),
      // Always use official YouTube global CDN thumbnail for maximum speed and reliability
      thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
      duration: formatDurationSeconds(sec),
      durationSeconds: sec,
    });

    if (results.length >= 25) break;
  }

  return results;
}

/**
 * Fetch and parse from a single CORS-compatible search endpoint with a strict timeout
 */
async function fetchSearchEndpoint(
  url: string,
  signal?: AbortSignal,
  timeoutMs = 4500
): Promise<SearchResultItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onParentAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    signal.addEventListener('abort', onParentAbort, { once: true });
  }

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Received HTML instead of JSON');
    }

    const data = await resp.json();
    let parsed = parseSearchItemsPayload(data, false);
    if (parsed.length === 0) {
      parsed = parseSearchItemsPayload(data, true);
    }

    if (parsed.length === 0) {
      throw new Error('No valid video items parsed');
    }

    return parsed;
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onParentAbort);
    }
  }
}

/**
 * Official YouTube IFrame API + oEmbed fallback search (100% Google-hosted, zero third-party dependency)
 */
async function searchViaYouTubeIframeApi(
  query: string,
  signal?: AbortSignal
): Promise<SearchResultItem[]> {
  if (typeof window === 'undefined' || !window.YT || !window.YT.Player) {
    throw new Error('YT IFrame API not ready');
  }

  return new Promise<SearchResultItem[]>((resolve, reject) => {
    const tempDiv = document.createElement('div');
    const tempId = `yt-search-probe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    tempDiv.id = tempId;
    tempDiv.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(tempDiv);

    let tempPlayer: any = null;
    let settled = false;

    const cleanup = () => {
      try {
        if (tempPlayer && typeof tempPlayer.destroy === 'function') {
          tempPlayer.destroy();
        }
      } catch {}
      try {
        tempDiv.remove();
      } catch {}
    };

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('YT IFrame search timeout'));
      }
    }, 5500);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
          }
        },
        { once: true }
      );
    }

    try {
      tempPlayer = new window.YT.Player(tempId, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          mute: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            try {
              e.target.mute();
              e.target.cuePlaylist({
                listType: 'search',
                list: query,
              });
            } catch (err) {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                cleanup();
                reject(err);
              }
            }
          },
          onStateChange: async (e: any) => {
            try {
              const pList =
                typeof e.target.getPlaylist === 'function' ? e.target.getPlaylist() : null;
              if (Array.isArray(pList) && pList.length > 0 && !settled) {
                settled = true;
                clearTimeout(timer);
                const ids = pList.slice(0, 12).filter((id: string) => typeof id === 'string' && id.length === 11);
                cleanup();

                const metaResults = await Promise.all(
                  ids.map(async (vidId: string) => {
                    const oembed = await fetchYouTubeOEmbed(vidId, false);
                    return {
                      videoId: vidId,
                      title: oembed?.title || `YouTube Song (${vidId})`,
                      author: oembed?.author || 'YouTube Music',
                      thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
                      duration: '03:45',
                      durationSeconds: 225,
                    };
                  })
                );

                resolve(metaResults);
              }
            } catch (err) {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                cleanup();
                reject(err);
              }
            }
          },
          onError: (err: any) => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              cleanup();
              reject(new Error(`YT error ${err?.data}`));
            }
          },
        },
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        cleanup();
        reject(err);
      }
    }
  });
}

/**
 * Perform a fast, client-side, 100% free YouTube video search without API keys.
 * Compatible with Firebase Static Hosting (apna-radiotube.web.app) and Express/Cloud Run.
 */
export async function searchYouTubeVideos(
  query: string,
  signal?: AbortSignal,
  preferMusicSongs = false
): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `${preferMusicSongs ? 'music:' : 'vid:'}${cleanQuery.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  // 1. Check if user pasted a direct YouTube link or 11-char video ID
  const directVidId = extractVideoId(cleanQuery);
  if (directVidId) {
    const oembed = await fetchYouTubeOEmbed(directVidId, false);
    const singleResult: SearchResultItem[] = [
      {
        videoId: directVidId,
        title: oembed?.title || (cleanQuery.includes('/') ? 'Direct YouTube Track' : `YouTube Song (${directVidId})`),
        author: oembed?.author || 'YouTube Music',
        thumbnail: `https://i.ytimg.com/vi/${directVidId}/hqdefault.jpg`,
        duration: '03:45',
        durationSeconds: 225,
      },
    ];
    searchCache.set(cacheKey, singleResult);
    return singleResult;
  }

  const encoded = encodeURIComponent(cleanQuery);

  // Detect if running on Firebase static hosting (.web.app / .firebaseapp.com)
  const isFirebaseStaticHost =
    typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('.web.app') ||
      window.location.hostname.endsWith('.firebaseapp.com'));

  // Build parallel CORS-enabled endpoints to race simultaneously (0ms sequential delay)
  const primaryFilter = preferMusicSongs ? 'music_songs' : 'videos';
  const secondaryFilter = preferMusicSongs ? 'videos' : 'music_songs';

  const endpoints: string[] = [
    // Verified fast CORS (*) Piped & Invidious APIs
    `https://api.piped.private.coffee/search?q=${encoded}&filter=${primaryFilter}`,
    `https://pipedapi.ducks.party/search?q=${encoded}&filter=${primaryFilter}`,
    `https://invidious.ducks.party/api/v1/search?q=${encoded}&type=video`,
    `https://api.piped.private.coffee/search?q=${encoded}&filter=${secondaryFilter}`,
    `https://pipedapi.ducks.party/search?q=${encoded}&filter=${secondaryFilter}`,
  ];

  // Include local backend scraper when running on Express / Cloud Run server
  if (!isFirebaseStaticHost) {
    endpoints.unshift(`/api/search?q=${encoded}`);
  }

  // Race all verified endpoints in parallel so the fastest server wins immediately (~0.6s - 1.5s)
  try {
    const fastResults = await Promise.any(
      endpoints.map((ep) => fetchSearchEndpoint(ep, signal, 4500))
    );
    if (fastResults && fastResults.length > 0) {
      searchCache.set(cacheKey, fastResults);
      return fastResults;
    }
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw new DOMException('Aborted', 'AbortError');
    }
  }

  // Fallback: Official YouTube IFrame Player API search + oEmbed (100% Google infrastructure)
  try {
    const iframeResults = await searchViaYouTubeIframeApi(cleanQuery, signal);
    if (iframeResults && iframeResults.length > 0) {
      searchCache.set(cacheKey, iframeResults);
      return iframeResults;
    }
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw new DOMException('Aborted', 'AbortError');
    }
    console.warn('All search engines failed or timed out:', err);
  }

  throw new Error('गाने खोजने में असमर्थ। कृपया इंटरनेट कनेक्शन जांचें या दूसरा कीवर्ड आज़माएं।');
}
