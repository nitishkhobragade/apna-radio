/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import { decodeHtmlEntities } from './youtube';
import { searchYouTubeVideos, formatDurationSeconds } from './youtubeSearch';

export interface RecommendedSong {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
}

/**
 * Fetch dynamic related songs based on an active YouTube video ID and track metadata.
 * Uses public Invidious related videos endpoints with CORS proxies, falling back
 * to intelligent search proxy queries based on artist and genre.
 */
export async function fetchRelatedSongs(
  videoId: string,
  title?: string,
  artist?: string,
  signal?: AbortSignal
): Promise<RecommendedSong[]> {
  if (!videoId) return [];

  const endpoints = [
    // 1. Direct Invidious endpoint
    `https://invidious.f5.si/api/v1/videos/${videoId}`,
    // 2. CorsProxy wrapped Invidious
    `https://corsproxy.io/?url=${encodeURIComponent(`https://invidious.f5.si/api/v1/videos/${videoId}`)}`,
    // 3. AllOrigins raw proxy wrapped
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://invidious.privacydev.net/api/v1/videos/${videoId}`)}`,
  ];

  // Helper to query one Invidious video endpoint
  const queryEndpoint = async (url: string): Promise<RecommendedSong[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
      const recList = data.recommendedVideos || data.relatedStreams || [];

      if (!Array.isArray(recList) || recList.length === 0) {
        throw new Error('No recommended videos in payload');
      }

      const results: RecommendedSong[] = [];
      const seen = new Set<string>();
      seen.add(videoId);

      for (const item of recList) {
        const vidId = String(item.videoId || item.id || '').trim();
        if (vidId.length !== 11 || seen.has(vidId)) continue;
        seen.add(vidId);

        const trackTitle = item.title || 'Classic Hindi Song';
        const trackAuthor = item.author || item.artist || item.channelTitle || 'Vintage Radio';
        const sec = Number(item.lengthSeconds) || 240;

        results.push({
          videoId: vidId,
          title: decodeHtmlEntities(trackTitle),
          author: decodeHtmlEntities(trackAuthor),
          thumbnail: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
          duration: formatDurationSeconds(sec),
          durationSeconds: sec,
        });

        if (results.length >= 10) break;
      }

      if (results.length === 0) {
        throw new Error('Parsed 0 recommended songs');
      }

      return results;
    } finally {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onParentAbort);
      }
    }
  };

  // Try direct Invidious first
  try {
    const directResults = await queryEndpoint(endpoints[0]);
    if (directResults.length > 0) return directResults;
  } catch {
    // continue to proxies
  }

  // Race remaining proxies
  try {
    const proxyResults = await Promise.any(
      endpoints.slice(1).map((ep) => queryEndpoint(ep))
    );
    if (proxyResults.length > 0) return proxyResults;
  } catch {
    // If endpoints fail, fall through to intelligent search fallback
  }

  // Fallback: search query based on artist or title keywords
  try {
    const cleanArtist = (artist || '').replace(/(vevo|music|official|records|channel)/gi, '').trim();
    const query = cleanArtist.length > 2 ? `${cleanArtist} classic songs` : `${title || 'Bollywood'} old songs`;

    const searchResults = await searchYouTubeVideos(query, signal);
    const filtered = searchResults
      .filter((s) => s.videoId !== videoId)
      .slice(0, 8)
      .map((s) => ({
        videoId: s.videoId,
        title: s.title,
        author: s.author,
        thumbnail: s.thumbnail,
        duration: s.duration,
        durationSeconds: s.durationSeconds,
      }));

    if (filtered.length > 0) {
      return filtered;
    }
  } catch (searchErr) {
    console.warn('Fallback search for related songs failed:', searchErr);
  }

  return [];
}
