/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

export interface VideoItem {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  artist?: string;
  position: number;
  duration?: string;
  durationSeconds?: number;
}

export interface HistoryItem extends VideoItem {
  playedAt: number;
}

export interface Playlist {
  id: string;
  youtubePlaylistId: string;
  title: string;
  thumbnail: string;
  description: string;
  videos: VideoItem[];
  isCustom?: boolean;
}

export type PlayerStatus = 'UNSTARTED' | 'ENDED' | 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'CUED';
