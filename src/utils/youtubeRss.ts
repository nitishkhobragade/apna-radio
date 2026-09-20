import { VideoItem } from '../types';

export interface ParsedPlaylist {
  title: string;
  author: string;
  videos: VideoItem[];
}

/**
 * Decodes XML / HTML entities like &amp;, &#39;, &quot;, &lt;, &gt;
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .trim();
}

/**
 * Formats seconds into MM:SS
 */
function formatSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '03:30';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.private.coffee',
  'https://yt.drgnz.club',
  'https://invidious.jing.rocks',
  'https://invidious.flokinet.to',
  'https://invidious.perennialte.ch',
];

/**
 * Fetches YouTube playlist RSS XML or Invidious JSON feed across multiple redundant mirrors.
 */
export async function fetchYouTubePlaylistRss(playlistId: string): Promise<string> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;

  const fetchers: Array<() => Promise<string>> = [
    // 1. Invidious instances direct RSS feed (frequently CORS-friendly and fast)
    ...INVIDIOUS_INSTANCES.map((base) => async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(`${base}/feed/playlist/${encodeURIComponent(playlistId)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (text && (text.includes('<entry') || text.includes('<feed'))) {
          return text;
        }
        throw new Error('No entries in feed');
      } finally {
        clearTimeout(timeout);
      }
    }),

    // 2. CodeTabs CORS Proxy for official YouTube RSS
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      try {
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (text && (text.includes('<entry') || text.includes('<feed'))) {
          return text;
        }
        throw new Error('Empty codetabs text');
      } finally {
        clearTimeout(timeout);
      }
    },

    // 3. AllOrigins JSON Proxy
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json?.contents && (json.contents.includes('<entry') || json.contents.includes('<feed'))) {
          return json.contents;
        }
        throw new Error('Empty allorigins contents');
      } finally {
        clearTimeout(timeout);
      }
    },

    // 4. Corsproxy.io
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (text && (text.includes('<entry') || text.includes('<feed'))) {
          return text;
        }
        throw new Error('Empty corsproxy text');
      } finally {
        clearTimeout(timeout);
      }
    },
  ];

  // Try them in batches with fast race
  const batchSize = 3;
  for (let i = 0; i < fetchers.length; i += batchSize) {
    const currentBatch = fetchers.slice(i, i + batchSize);
    try {
      const result = await Promise.any(currentBatch.map(fn => fn()));
      if (result) return result;
    } catch {
      // Continue to next batch
    }
  }

  throw new Error('Could not fetch YouTube playlist RSS feed from available mirrors');
}

/**
 * Parses YouTube or Invidious Atom XML into ParsedPlaylist with true song titles and artist names.
 */
export function parseYouTubeRssXml(xmlText: string, playlistId: string): ParsedPlaylist {
  if (!xmlText || typeof xmlText !== 'string') {
    throw new Error('Empty XML received');
  }

  if (xmlText.includes('<title>Error 404 (Not Found)') || xmlText.includes('404. That’s an error')) {
    throw new Error('PLAYLIST_NOT_FOUND');
  }

  let playlistTitle = '';
  let channelName = '';
  const videos: VideoItem[] = [];

  // 1. Primary method: Native DOMParser
  try {
    if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const parserError = xmlDoc.getElementsByTagName('parsererror');

      if (!parserError || parserError.length === 0) {
        // Feed title
        const feedTitleEl = xmlDoc.querySelector('feed > title') || xmlDoc.getElementsByTagName('title')[0];
        if (feedTitleEl && feedTitleEl.textContent) {
          playlistTitle = decodeHtmlEntities(feedTitleEl.textContent.trim());
        }

        // Feed author / channel name
        const feedAuthorEl = xmlDoc.querySelector('feed > author > name') || xmlDoc.getElementsByTagName('name')[0];
        if (feedAuthorEl && feedAuthorEl.textContent) {
          channelName = decodeHtmlEntities(feedAuthorEl.textContent.trim());
        }

        // Entries
        const entries = xmlDoc.getElementsByTagName('entry');
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];

          // Video ID
          let videoId = '';
          const ytVideoIdEl =
            entry.getElementsByTagName('yt:videoId')[0] ||
            entry.getElementsByTagName('videoId')[0] ||
            entry.getElementsByTagNameNS('http://www.youtube.com/xml/schemas/2015', 'videoId')[0];

          if (ytVideoIdEl && ytVideoIdEl.textContent) {
            videoId = ytVideoIdEl.textContent.trim();
          }

          if (!videoId) {
            const idEl = entry.getElementsByTagName('id')[0];
            const idText = idEl?.textContent || '';
            const match = idText.match(/yt:video:([a-zA-Z0-9_-]+)/);
            if (match) videoId = match[1];
          }

          // Actual Song Title from <title> or <media:title>
          const titleEl =
            entry.getElementsByTagName('title')[0] ||
            entry.getElementsByTagName('media:title')[0] ||
            entry.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'title')[0];
          const rawTitle = titleEl?.textContent || '';
          const title = decodeHtmlEntities(rawTitle) || `Track #${i + 1}`;

          // Actual Author / Artist Name from <author><name>
          const authorEl =
            entry.getElementsByTagName('author')[0]?.getElementsByTagName('name')[0] ||
            entry.getElementsByTagName('name')[0] ||
            entry.getElementsByTagName('media:credit')[0];
          const rawAuthor = authorEl?.textContent || channelName || 'YouTube Artist';
          const author = decodeHtmlEntities(rawAuthor);

          // Duration from <media:content duration="...">
          let durationSeconds = 210;
          let duration = '03:30';
          const mediaContent =
            entry.getElementsByTagName('media:content')[0] ||
            entry.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content')[0];
          if (mediaContent && mediaContent.getAttribute('duration')) {
            const parsedSec = parseInt(mediaContent.getAttribute('duration') || '0', 10);
            if (parsedSec > 0) {
              durationSeconds = parsedSec;
              duration = formatSeconds(parsedSec);
            }
          }

          // Thumbnail
          let thumbnail = '';
          const mediaThumb =
            entry.getElementsByTagName('media:thumbnail')[0] ||
            entry.getElementsByTagName('thumbnail')[0] ||
            entry.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
          if (mediaThumb) {
            thumbnail = mediaThumb.getAttribute('url') || '';
          }
          if (!thumbnail && videoId) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }

          if (videoId) {
            videos.push({
              videoId,
              title,
              channelTitle: author,
              artist: author,
              duration,
              durationSeconds,
              thumbnail,
              position: videos.length,
            });
          }
        }
      }
    }
  } catch (domErr) {
    console.warn('DOMParser encountered an error, falling back to regex extraction:', domErr);
  }

  // 2. Secondary fallback: Regex parsing
  if (videos.length === 0) {
    if (!playlistTitle) {
      const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) playlistTitle = decodeHtmlEntities(titleMatch[1]);
    }

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match: RegExpExecArray | null;
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entryStr = match[1];
      const idMatch =
        entryStr.match(/<(?:yt:)?videoId>([^<]+)<\/(?:yt:)?videoId>/) ||
        entryStr.match(/<id>[^:]+:video:([^<]+)<\/id>/);
      const titleMatch =
        entryStr.match(/<title>([\s\S]*?)<\/title>/) ||
        entryStr.match(/<media:title>([\s\S]*?)<\/media:title>/);
      const authorMatch =
        entryStr.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/) ||
        entryStr.match(/<name>([\s\S]*?)<\/name>/);
      const thumbMatch = entryStr.match(/<media:thumbnail[^>]+url="([^"]+)"/);
      const durMatch = entryStr.match(/duration="(\d+)"/);

      const videoId = idMatch ? idMatch[1].trim() : '';
      if (videoId) {
        const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
        const rawAuthor = authorMatch ? authorMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : (channelName || 'YouTube Artist');
        const thumbnail = thumbMatch ? thumbMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        const durSec = durMatch ? parseInt(durMatch[1], 10) : 210;

        const title = decodeHtmlEntities(rawTitle) || `Track #${videos.length + 1}`;
        const author = decodeHtmlEntities(rawAuthor);

        videos.push({
          videoId,
          title,
          channelTitle: author,
          artist: author,
          duration: formatSeconds(durSec),
          durationSeconds: durSec,
          thumbnail,
          position: videos.length,
        });
      }
    }
  }

  return {
    title: playlistTitle || 'Classic Playlist',
    author: channelName || 'Curated Radio',
    videos,
  };
}

/**
 * Attempts to fetch playlist data using either Invidious JSON API or RSS XML feeds.
 */
export async function fetchFullPlaylistDataset(playlistId: string): Promise<ParsedPlaylist | null> {
  // Strategy 1: Try Invidious JSON API endpoints (fastest & most complete when active)
  for (const base of INVIDIOUS_INSTANCES.slice(0, 3)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${base}/api/v1/playlists/${encodeURIComponent(playlistId)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (json?.videos && Array.isArray(json.videos) && json.videos.length > 0) {
          const videos: VideoItem[] = json.videos.map((v: any, idx: number) => {
            const vId = v.videoId;
            const title = decodeHtmlEntities(v.title || `Track #${idx + 1}`);
            const author = decodeHtmlEntities(v.author || json.author || 'YouTube Artist');
            const durSec = typeof v.lengthSeconds === 'number' ? v.lengthSeconds : 210;
            const thumb = v.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

            return {
              videoId: vId,
              title,
              channelTitle: author,
              artist: author,
              duration: formatSeconds(durSec),
              durationSeconds: durSec,
              thumbnail: thumb,
              position: idx,
            };
          });

          return {
            title: decodeHtmlEntities(json.title || 'Classic Playlist'),
            author: decodeHtmlEntities(json.author || 'YouTube'),
            videos,
          };
        }
      }
    } catch {
      // Continue to next mirror or XML
    }
  }

  // Strategy 2: Fetch via RSS XML feeds and parse entries
  try {
    const xml = await fetchYouTubePlaylistRss(playlistId);
    if (xml) {
      const parsed = parseYouTubeRssXml(xml, playlistId);
      if (parsed.videos && parsed.videos.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('fetchFullPlaylistDataset RSS attempt failed:', err);
  }

  return null;
}

/**
 * Fetches real title and author for a single YouTube video using official oEmbed (CORS-friendly).
 */
export async function fetchSingleVideoMetadata(videoId: string): Promise<{ title: string; author: string } | null> {
  if (!videoId) return null;

  // 1. YouTube official oEmbed
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        return {
          title: decodeHtmlEntities(data.title),
          author: decodeHtmlEntities(data.author_name || 'YouTube Music'),
        };
      }
    }
  } catch {}

  // 2. noembed.com fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        return {
          title: decodeHtmlEntities(data.title),
          author: decodeHtmlEntities(data.author_name || 'YouTube Music'),
        };
      }
    }
  } catch {}

  return null;
}

/**
 * Batch resolves any tracks that currently have placeholder titles like "Track #1", "Track #2".
 */
export async function resolvePlaylistTrackTitles(
  tracks: VideoItem[],
  onBatchResolved?: (updatedTracks: VideoItem[]) => void
): Promise<VideoItem[]> {
  const needsResolution = tracks.some(
    (t) => !t.title || t.title.startsWith('Track #') || t.title === 'Classic Track'
  );
  if (!needsResolution) return tracks;

  const currentList = [...tracks];
  const missingIndices = tracks
    .map((t, idx) => (!t.title || t.title.startsWith('Track #') || t.title === 'Classic Track' ? idx : -1))
    .filter((idx) => idx !== -1);

  // Process in small parallel chunks of 4
  const chunkSize = 4;
  for (let i = 0; i < missingIndices.length; i += chunkSize) {
    const chunk = missingIndices.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (idx) => {
        const tr = currentList[idx];
        if (!tr) return;
        const meta = await fetchSingleVideoMetadata(tr.videoId);
        if (meta && meta.title) {
          currentList[idx] = {
            ...tr,
            title: meta.title,
            channelTitle: meta.author || tr.channelTitle,
            artist: meta.author || tr.artist,
          };
        }
      })
    );

    if (onBatchResolved) {
      onBatchResolved([...currentList]);
    }
  }

  return currentList;
}
