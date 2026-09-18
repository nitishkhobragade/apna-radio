import { VideoItem } from '../types';

export interface ParsedPlaylist {
  title: string;
  author: string;
  videos: VideoItem[];
}

/**
 * Extracts YouTube playlist RSS feed XML from public proxies in sequence.
 * Tries allorigins.win JSON proxy first, then corsproxy.io, codetabs, raw allorigins, and direct fetch.
 */
export async function fetchYouTubePlaylistRss(playlistId: string): Promise<string> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;

  const proxies = [
    // 1. AllOrigins JSON API wrapper (robust and widely used)
    {
      name: 'allorigins-json',
      fetch: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        try {
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!json || typeof json.contents !== 'string' || !json.contents.trim()) {
            throw new Error('Empty proxy contents');
          }
          return json.contents;
        } finally {
          clearTimeout(timeout);
        }
      },
    },

    // 2. Corsproxy.io direct query parameter
    {
      name: 'corsproxy-io',
      fetch: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        try {
          const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          if (!text || !text.trim()) throw new Error('Empty text from corsproxy');
          return text;
        } finally {
          clearTimeout(timeout);
        }
      },
    },

    // 3. Corsproxy.io alternative URL format
    {
      name: 'corsproxy-io-alt',
      fetch: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        try {
          const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(rssUrl)}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          if (!text || !text.trim()) throw new Error('Empty text from corsproxy alt');
          return text;
        } finally {
          clearTimeout(timeout);
        }
      },
    },

    // 4. CodeTabs CORS Proxy
    {
      name: 'codetabs',
      fetch: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        try {
          const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          if (!text || !text.trim()) throw new Error('Empty text from codetabs');
          return text;
        } finally {
          clearTimeout(timeout);
        }
      },
    },

    // 5. AllOrigins Raw proxy
    {
      name: 'allorigins-raw',
      fetch: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        try {
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          if (!text || !text.trim()) throw new Error('Empty text from allorigins raw');
          return text;
        } finally {
          clearTimeout(timeout);
        }
      },
    },

    // 6. Direct fetch fallback
    {
      name: 'direct',
      fetch: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(rssUrl, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.text();
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  ];

  let lastError: Error | null = null;

  for (const proxy of proxies) {
    try {
      const xml = await proxy.fetch();
      if (xml && (xml.includes('<feed') || xml.includes('<entry') || xml.includes('<?xml'))) {
        return xml;
      }
      if (xml && (xml.includes('404. That’s an error') || xml.includes('Error 404 (Not Found)'))) {
        throw new Error('PLAYLIST_NOT_FOUND');
      }
    } catch (err: any) {
      if (err?.message === 'PLAYLIST_NOT_FOUND') {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('All CORS proxies failed to fetch YouTube playlist RSS feed');
}

/**
 * Parses YouTube Atom RSS XML using browser's native DOMParser() with regex fallback.
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
        // Extract feed title
        const feedTitleEl = xmlDoc.querySelector('feed > title') || xmlDoc.getElementsByTagName('title')[0];
        if (feedTitleEl && feedTitleEl.textContent) {
          playlistTitle = feedTitleEl.textContent.trim();
        }

        // Extract feed author/channel
        const feedAuthorEl = xmlDoc.querySelector('feed > author > name') || xmlDoc.getElementsByTagName('name')[0];
        if (feedAuthorEl && feedAuthorEl.textContent) {
          channelName = feedAuthorEl.textContent.trim();
        }

        // Extract entries
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

          // Track Title
          const titleEl = entry.getElementsByTagName('title')[0];
          const title = (titleEl?.textContent || 'Classic Track').trim();

          // Channel/Artist Name
          const authorEl = entry.getElementsByTagName('author')[0]?.getElementsByTagName('name')[0];
          const author = (authorEl?.textContent || channelName || 'Vintage Artist').trim();

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
              duration: '03:45',
              durationSeconds: 225,
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

  // 2. Secondary fallback: Regex parsing if DOMParser found 0 videos or failed
  if (videos.length === 0) {
    if (!playlistTitle) {
      const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) playlistTitle = titleMatch[1].trim();
    }

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match: RegExpExecArray | null;
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entryStr = match[1];
      const idMatch =
        entryStr.match(/<(?:yt:)?videoId>([^<]+)<\/(?:yt:)?videoId>/) ||
        entryStr.match(/<id>[^:]+:video:([^<]+)<\/id>/);
      const titleMatch = entryStr.match(/<title>([\s\S]*?)<\/title>/);
      const authorMatch = entryStr.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
      const thumbMatch = entryStr.match(/<media:thumbnail[^>]+url="([^"]+)"/);

      const videoId = idMatch ? idMatch[1].trim() : '';
      if (videoId) {
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Classic Track';
        const author = authorMatch ? authorMatch[1].trim() : (channelName || 'Vintage Artist');
        const thumbnail = thumbMatch ? thumbMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        videos.push({
          videoId,
          title,
          channelTitle: author,
          duration: '03:45',
          durationSeconds: 225,
          thumbnail,
          position: videos.length,
        });
      }
    }
  }

  return {
    title: playlistTitle || 'Classic Hindi Playlist',
    author: channelName || 'Curated Radio',
    videos,
  };
}
