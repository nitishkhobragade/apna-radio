/**
 * Dynamic YouTube Public Playlist Scraper
 * Extracts complete playlist metadata and all video items (title, duration, thumbnail, channel, videoId)
 * without requiring any YouTube API key.
 */

export interface ScrapedVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
  position: number;
}

export interface ScrapedPlaylist {
  id: string;
  youtubePlaylistId: string;
  title: string;
  description: string;
  thumbnail: string;
  videos: ScrapedVideoItem[];
  isCustom: boolean;
}

/**
 * Parses duration strings like "4:33", "1:15:20", or verbal strings like "4 minutes, 33 seconds"
 */
export function parseDurationText(text: string): { formatted: string; seconds: number } {
  if (!text || typeof text !== 'string') return { formatted: '', seconds: 0 };
  const trimmed = text.trim();

  // 1. Check for standard MM:SS or HH:MM:SS format
  const timeMatch = trimmed.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
  if (timeMatch) {
    const parts = timeMatch[1].split(':').map(Number);
    let sec = 0;
    if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) sec = parts[0] * 60 + parts[1];
    return { formatted: timeMatch[1], seconds: sec };
  }

  // 2. Check for verbal format: "X hours, Y minutes, Z seconds" (common in accessibility labels)
  const hoursMatch = trimmed.match(/(\d+)\s*(?:hours?|hrs?)/i);
  const minsMatch = trimmed.match(/(\d+)\s*(?:minutes?|mins?)/i);
  const secsMatch = trimmed.match(/(\d+)\s*(?:seconds?|secs?)/i);

  const h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
  const s = secsMatch ? parseInt(secsMatch[1], 10) : 0;
  const totalSec = h * 3600 + m * 60 + s;

  if (totalSec > 0) {
    const formatted =
      h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
    return { formatted, seconds: totalSec };
  }

  return { formatted: trimmed, seconds: 0 };
}

/**
 * Extracts YouTube Playlist ID from a URL or raw ID string.
 */
export function extractYoutubePlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already a clean ID
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam;

    if (url.pathname.includes('/playlist/')) {
      const parts = url.pathname.split('/playlist/');
      if (parts[1]) {
        return parts[1].split('/')[0].split('?')[0];
      }
    }
  } catch {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }

  return null;
}

/**
 * Scrapes any public YouTube playlist dynamically.
 */
export async function scrapePublicYouTubePlaylist(playlistIdOrUrl: string): Promise<ScrapedPlaylist | null> {
  const playlistId = extractYoutubePlaylistId(playlistIdOrUrl);
  if (!playlistId) return null;

  const url = playlistId.startsWith('RD')
    ? `https://www.youtube.com/watch?v=${playlistId.slice(2)}&list=${encodeURIComponent(playlistId)}`
    : `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube returned status ${response.status}`);
  }

  const html = await response.text();

  // Find ytInitialData script tag
  const match =
    html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
    html.match(/window\["ytInitialData"\] = ({.*?});<\/script>/s) ||
    html.match(/ytInitialData\s*=\s*({.*?});/s);

  if (!match || !match[1]) {
    throw new Error('Could not find YouTube playlist dataset in page response.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(match[1]);
  } catch (err) {
    throw new Error('Failed to parse YouTube playlist dataset JSON.');
  }

  // Extract playlist title
  const title =
    parsed.metadata?.playlistMetadataRenderer?.title ||
    parsed.header?.playlistHeaderRenderer?.title?.simpleText ||
    parsed.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text ||
    'YouTube Playlist';

  // Extract description
  const description =
    parsed.metadata?.playlistMetadataRenderer?.description ||
    parsed.header?.playlistHeaderRenderer?.descriptionText?.simpleText ||
    parsed.header?.playlistHeaderRenderer?.descriptionText?.runs?.[0]?.text ||
    '';

  const videos: ScrapedVideoItem[] = [];
  const seenIds = new Set<string>();

  // Recursive scanner to catch lockupViewModel, playlistVideoRenderer, and any nested video items
  function scan(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) scan(item);
      return;
    }

    // Modern YouTube UI (lockupViewModel)
    if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
      const vm = obj.lockupViewModel;
      const videoId = vm.contentId;

      if (!seenIds.has(videoId)) {
        seenIds.add(videoId);
        const vTitle =
          vm.metadata?.lockupMetadataViewModel?.title?.content ||
          vm.metadata?.lockupMetadataViewModel?.title?.runs?.[0]?.text ||
          'Untitled Track';

        // Filter out deleted/private markers
        if (
          !vTitle.toLowerCase().includes('[deleted video]') &&
          !vTitle.toLowerCase().includes('[private video]')
        ) {
          const channel =
            vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]
              ?.metadataParts?.[0]?.text?.content || 'Artist';

          // Extract duration
          let durRaw = '';
          const overlays = vm.contentImage?.thumbnailViewModel?.overlays || [];
          for (const ov of overlays) {
            const badges = ov.thumbnailOverlayBadgeViewModel?.thumbnailBadges || [];
            for (const b of Array.isArray(badges) ? badges : [badges]) {
              if (b?.thumbnailBadgeViewModel?.text) {
                durRaw = b.thumbnailBadgeViewModel.text;
                break;
              }
            }
            if (!durRaw && ov.thumbnailOverlayTimeStatusRenderer?.text?.simpleText) {
              durRaw = ov.thumbnailOverlayTimeStatusRenderer.text.simpleText;
            }
          }

          // Fallback to accessibilityContext label
          if (!durRaw && vm.rendererContext?.accessibilityContext?.label) {
            durRaw = vm.rendererContext.accessibilityContext.label;
          }

          const { formatted, seconds } = parseDurationText(durRaw);

          // Extract thumbnail
          const sources = vm.contentImage?.thumbnailViewModel?.image?.sources || [];
          const thumb =
            sources.length > 0
              ? sources[sources.length - 1].url
              : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

          videos.push({
            videoId,
            title: vTitle,
            channelTitle: channel,
            duration: formatted,
            durationSeconds: seconds,
            thumbnail: thumb,
            position: videos.length,
          });
        }
      }
    }

    // Classic YouTube UI (playlistVideoRenderer)
    if (obj.playlistVideoRenderer && obj.playlistVideoRenderer.videoId) {
      const vr = obj.playlistVideoRenderer;
      const videoId = vr.videoId;

      if (!seenIds.has(videoId)) {
        seenIds.add(videoId);
        const vTitle = vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Untitled Track';

        if (
          !vTitle.toLowerCase().includes('[deleted video]') &&
          !vTitle.toLowerCase().includes('[private video]')
        ) {
          const channel = vr.shortBylineText?.runs?.[0]?.text || 'Artist';
          const durRaw = vr.lengthText?.simpleText || '';
          const { formatted, seconds } = parseDurationText(durRaw);
          const thumbs = vr.thumbnail?.thumbnails || [];
          const thumb =
            thumbs.length > 0
              ? thumbs[thumbs.length - 1].url
              : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

          videos.push({
            videoId,
            title: vTitle,
            channelTitle: channel,
            duration: formatted,
            durationSeconds: seconds || (vr.lengthSeconds ? parseInt(vr.lengthSeconds, 10) : 0),
            thumbnail: thumb,
            position: videos.length,
          });
        }
      }
    }

    // YouTube Mix/Radio UI (playlistPanelVideoRenderer)
    if (obj.playlistPanelVideoRenderer && obj.playlistPanelVideoRenderer.videoId) {
      const pvr = obj.playlistPanelVideoRenderer;
      const videoId = pvr.videoId;

      if (!seenIds.has(videoId)) {
        seenIds.add(videoId);
        const vTitle = pvr.title?.simpleText || pvr.title?.runs?.[0]?.text || 'Untitled Track';

        if (
          !vTitle.toLowerCase().includes('[deleted video]') &&
          !vTitle.toLowerCase().includes('[private video]')
        ) {
          const channel = pvr.shortBylineText?.simpleText || pvr.shortBylineText?.runs?.[0]?.text || 'Artist';
          const durRaw = pvr.lengthText?.simpleText || '';
          const { formatted, seconds } = parseDurationText(durRaw);
          const thumbs = pvr.thumbnail?.thumbnails || [];
          const thumb =
            thumbs.length > 0
              ? thumbs[thumbs.length - 1].url
              : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

          videos.push({
            videoId,
            title: vTitle,
            channelTitle: channel,
            duration: formatted,
            durationSeconds: seconds,
            thumbnail: thumb,
            position: videos.length,
          });
        }
      }
    }

    for (const val of Object.values(obj)) {
      scan(val);
    }
  }

  scan(parsed);

  if (videos.length === 0) {
    return null;
  }

  const playlistThumbnail =
    videos[0]?.thumbnail ||
    `https://img.youtube.com/vi/${videos[0]?.videoId}/hqdefault.jpg`;

  return {
    id: `yt-${playlistId}-${Date.now()}`,
    youtubePlaylistId: playlistId,
    title,
    description,
    thumbnail: playlistThumbnail,
    videos,
    isCustom: true,
  };
}
