import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  scrapePublicYouTubePlaylist,
  extractYoutubePlaylistId,
} from './server/youtubeScraper.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasYouTubeApiKey: Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim() !== ''),
      time: new Date().toISOString()
    });
  });

  // Fetch YouTube Playlist endpoint - dynamically scrapes public playlists without requiring API key,
  // with fallback to Data API v3 if key is configured.
  app.get('/api/playlist', async (req: Request, res: Response): Promise<void> => {
    const rawInput = (req.query.playlistId as string) || (req.query.url as string);

    if (!rawInput || typeof rawInput !== 'string') {
      res.status(400).json({ error: 'Missing playlistId or url query parameter' });
      return;
    }

    const playlistId = extractYoutubePlaylistId(rawInput) || rawInput.trim();

    if (!playlistId) {
      res.status(400).json({ error: 'Invalid YouTube playlist URL or ID' });
      return;
    }

    // 1. PRIMARY ENGINE: Dynamically scrape public YouTube playlist (100% free, no API key required)
    try {
      console.log(`[YouTube Dynamic Engine] Fetching public playlist: ${playlistId}`);
      const scraped = await scrapePublicYouTubePlaylist(playlistId);
      if (scraped && scraped.videos && scraped.videos.length > 0) {
        console.log(
          `[YouTube Dynamic Engine] Successfully extracted ${scraped.videos.length} tracks for: "${scraped.title}"`
        );
        res.json(scraped);
        return;
      }
    } catch (scrapeErr: any) {
      console.warn(`[YouTube Dynamic Engine] Public scraping attempt failed:`, scrapeErr.message);
    }

    // 2. SECONDARY ENGINE: YouTube Data API v3 if API key is provided
    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (apiKey) {
      try {
        console.log(`[YouTube API Engine] Attempting Data API v3 for: ${playlistId}`);
        const playlistMetaUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${apiKey}`;
        const metaResponse = await fetch(playlistMetaUrl);
        const metaData = await metaResponse.json();

        if (metaResponse.ok && metaData.items && metaData.items.length > 0) {
          const playlistItem = metaData.items[0];
          const snippet = playlistItem.snippet;
          const title = snippet?.title || 'Retro Hindi Melodies';
          const description = snippet?.description || '';
          const thumbnail =
            snippet?.thumbnails?.high?.url ||
            snippet?.thumbnails?.medium?.url ||
            snippet?.thumbnails?.default?.url ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';

          const videos: Array<{
            videoId: string;
            title: string;
            thumbnail: string;
            channelTitle: string;
            position: number;
            duration?: string;
          }> = [];

          let nextPageToken: string | undefined = undefined;
          let pageCount = 0;
          const MAX_PAGES = 3; // 3 x 50 = 150 tracks

          do {
            let itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=50&key=${apiKey}`;
            if (nextPageToken) {
              itemsUrl += `&pageToken=${encodeURIComponent(nextPageToken)}`;
            }

            const itemsResponse = await fetch(itemsUrl);
            const itemsData = await itemsResponse.json();

            if (!itemsResponse.ok) {
              break;
            }

            const items = itemsData.items || [];
            for (const it of items) {
              const vSnippet = it.snippet;
              const videoId = vSnippet?.resourceId?.videoId || it.contentDetails?.videoId;
              const vTitle = vSnippet?.title || 'Unknown Title';

              if (
                !videoId ||
                vTitle.toLowerCase().includes('private video') ||
                vTitle.toLowerCase().includes('deleted video')
              ) {
                continue;
              }

              const vThumb =
                vSnippet?.thumbnails?.high?.url ||
                vSnippet?.thumbnails?.medium?.url ||
                vSnippet?.thumbnails?.default?.url ||
                `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

              videos.push({
                videoId,
                title: vTitle,
                thumbnail: vThumb,
                channelTitle: vSnippet?.videoOwnerChannelTitle || vSnippet?.channelTitle || 'Vintage Artist',
                position: videos.length,
              });
            }

            nextPageToken = itemsData.nextPageToken;
            pageCount++;
          } while (nextPageToken && pageCount < MAX_PAGES);

          if (videos.length > 0) {
            res.json({
              id: `yt-${playlistId}-${Date.now()}`,
              youtubePlaylistId: playlistId,
              title,
              description,
              thumbnail,
              videos,
              isCustom: true,
            });
            return;
          }
        }
      } catch (apiErr) {
        console.error('Data API v3 attempt failed:', apiErr);
      }
    }

    // 3. FALLBACK: If it's a known or default playlist, return curated golden nostalgia
    if (playlistId.includes('RDHfyx0xybClo') || playlistId.startsWith('DEFAULT')) {
      res.json({
        id: `yt-${playlistId}`,
        youtubePlaylistId: 'RDHfyx0xybClo',
        title: 'The Ultimate Indian Bus Driver Playlist',
        description: 'Nostalgic road trip melodies, bus driver classics & evergreen Hindi songs',
        thumbnail: 'https://i.ytimg.com/vi/Hfyx0xybClo/hqdefault.jpg',
        videos: [
          {
            videoId: 'Hfyx0xybClo',
            title: 'The Ultimate Indian Bus Driver Playlist (+ Timestamps) 🚌',
            channelTitle: 'Tuxlips 🌷',
            duration: '23:02',
            thumbnail: 'https://i.ytimg.com/vi/Hfyx0xybClo/hqdefault.jpg',
            position: 0,
          },
          {
            videoId: '47DstHmE-bE',
            title: 'Tu Pyar Hai Kisi Aur Ka - Video Song | Kumar Sanu, Anuradha Paudwal',
            channelTitle: 'T-Series Bollywood Classics',
            duration: '6:30',
            thumbnail: 'https://i.ytimg.com/vi/47DstHmE-bE/hqdefault.jpg',
            position: 1,
          },
          {
            videoId: 'M8Nj85GgK9A',
            title: 'Dil Laga Liya Maine Tumse Pyaar Karke | Alka Yagnik | Udit Narayan',
            channelTitle: 'Romantic Songs',
            duration: '4:15',
            thumbnail: 'https://i.ytimg.com/vi/M8Nj85GgK9A/hqdefault.jpg',
            position: 2,
          },
          {
            videoId: 'H8g7_YNPQ_g',
            title: 'Aksar Is Duniya Mein - HD | Akshay Kumar, Sunil Shetty | Dhadkan',
            channelTitle: 'MusicBird Studio',
            duration: '6:00',
            thumbnail: 'https://i.ytimg.com/vi/H8g7_YNPQ_g/hqdefault.jpg',
            position: 3,
          },
          {
            videoId: '_4Ft9UIKzwk',
            title: 'Yeh Dil Deewana | Shah Rukh Khan | Sonu Nigam | Pardes',
            channelTitle: 'Golden Hits',
            duration: '6:25',
            thumbnail: 'https://i.ytimg.com/vi/_4Ft9UIKzwk/hqdefault.jpg',
            position: 4,
          },
        ],
        isCustom: true,
      });
      return;
    }

    if (playlistId.includes('PLv_CqV-_-qijqIst653OSSKo-8UG4-OWd')) {
      res.json({
        id: `yt-${playlistId}`,
        youtubePlaylistId: 'PLv_CqV-_-qijqIst653OSSKo-8UG4-OWd',
        title: 'OLD IS GOLD (90s & Classic Hits)',
        description: '90s Bollywood evergreen melodies, soulful tracks, and timeless golden hits',
        thumbnail: 'https://img.youtube.com/vi/YXWKPB1oAJU/hqdefault.jpg',
        videos: [
          {
            videoId: 'YXWKPB1oAJU',
            title: 'Achacho Punnagi | Tamil Video Song | Shajahan | Vijay',
            channelTitle: 'Tamil Music Video',
            duration: '4:33',
            thumbnail: 'https://img.youtube.com/vi/YXWKPB1oAJU/hqdefault.jpg',
            position: 0,
          },
          {
            videoId: '7uhXyVJQz_g',
            title: 'Deewana Main Tera - Video Song | Kumar Sanu, Sadhana Sargam',
            channelTitle: 'T-Series Bollywood Classics',
            duration: '4:44',
            thumbnail: 'https://img.youtube.com/vi/7uhXyVJQz_g/hqdefault.jpg',
            position: 1,
          },
          {
            videoId: 'sMuL2MsOyGE',
            title: 'ये दिलवालों की बस्ती है ❤️ | Romantic Hindi Song | Old Is Gold',
            channelTitle: 'Ma Andri Official',
            duration: '5:11',
            thumbnail: 'https://img.youtube.com/vi/sMuL2MsOyGE/hqdefault.jpg',
            position: 2,
          },
        ],
        isCustom: true,
      });
      return;
    }

    res.status(404).json({
      error: 'PLAYLIST_NOT_FOUND',
      message:
        'अरे! यह playlist प्राप्त नहीं हो सकी (Unable to fetch playlist. It may be private or unlisted).',
      playlistId,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
