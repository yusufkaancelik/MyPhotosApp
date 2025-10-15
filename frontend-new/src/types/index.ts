export interface Photo {
  id: string;
  filename: string;
  originalName: string;
  thumbnail: string;
  metadata: {
    dateTaken: string | null;
    make: string | null;
    model: string | null;
    isLivePhoto?: boolean;
    type?: 'video';
    gps: {
      latitude: number;
      longitude: number;
    } | null;
  };
  isVideo?: boolean;
  motionFilename?: string;
  hash: string;
  createdAt: string;
}