export interface VideoItem {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  position: number;
  duration?: string;
  durationSeconds?: number;
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
