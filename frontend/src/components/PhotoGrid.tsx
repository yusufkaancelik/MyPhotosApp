import React, { useState } from 'react';
import styles from './PhotoGrid.module.css';

interface Photo {
  id: string;
  thumbnail: string;
  filename: string;
  metadata: {
    type: 'image' | 'video';
    width?: number;
    height?: number;
    duration?: number;
    fps?: number;
    hasAudio?: boolean;
  };
  isVideo: boolean;
}

interface PhotoGridProps {
  photos: Photo[];
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos }) => {
  return (
    <div className={styles.grid}>
      {photos.map((photo) => (
        <PhotoItem key={photo.id} photo={photo} />
      ))}
    </div>
  );
};

interface PhotoItemProps {
  photo: Photo;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ photo }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (photo.isVideo && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (photo.isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleVideoClick = () => {
    if (photo.isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const thumbnailUrl = `/api/photos/${photo.id}/thumbnail`;
  const mediaUrl = `/api/photos/${photo.id}`;

  return (
    <div
      className={`${styles.item} ${isHovered ? styles.hovered : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {photo.isVideo ? (
        <>
          <div className={styles.videoContainer} onClick={handleVideoClick}>
            <video
              ref={videoRef}
              className={styles.video}
              src={mediaUrl}
              poster={thumbnailUrl}
              preload="metadata"
              muted
              playsInline
              loop
            />
            <div className={`${styles.videoOverlay} ${isPlaying ? styles.playing : ''}`}>
              {!isPlaying && <div className={styles.playIcon} />}
              {photo.metadata.duration && (
                <div className={styles.duration}>
                  {formatDuration(photo.metadata.duration)}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <img
          src={thumbnailUrl}
          alt=""
          className={styles.image}
          loading="lazy"
        />
      )}
    </div>
  );
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default PhotoGrid;