import { useState, useRef, useEffect } from 'react';
import { Photo } from '../types';
import { photoApi } from '../api';

interface LivePhotoProps {
  photo: Photo;
  className?: string;
}

export default function LivePhoto({ photo, className = '' }: LivePhotoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasMotion = photo.metadata?.isLivePhoto && photo.motionFilename;
  
  // Load the motion part on mount
  useEffect(() => {
    if (hasMotion && videoRef.current) {
      videoRef.current.src = photoApi.getMotionUrl(photo.id);
      videoRef.current.load();
      videoRef.current.onloadeddata = () => {
        setIsLoaded(true);
      };
    }
  }, [photo.id, hasMotion]);
  
  // Handle press-to-play behavior
  const handleTouchStart = () => {
    if (hasMotion && isLoaded && videoRef.current) {
      setIsTouchActive(true);
      setIsPlaying(true);
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };
  
  const handleTouchEnd = () => {
    if (hasMotion && videoRef.current) {
      setIsTouchActive(false);
      setIsPlaying(false);
      videoRef.current.pause();
    }
  };

  // Handle 3D Touch/Force Touch if available
  useEffect(() => {
    const img = imageRef.current;
    if (img && 'webkitForce' in TouchEvent.prototype) {
      const handleForceChanged = (e: any) => {
        if (e.webkitForce > 2) { // Force threshold
          handleTouchStart();
        } else {
          handleTouchEnd();
        }
      };
      
      img.addEventListener('webkitforcechanged', handleForceChanged);
      return () => {
        img.removeEventListener('webkitforcechanged', handleForceChanged);
      };
    }
  }, []);
  
  // LivePhoto badge shown when hovering
  const LivePhotoBadge = () => (
    <div className={`absolute bottom-2 left-2 rounded-full bg-white/70 px-2 py-0.5 text-xs text-gray-800 flex items-center shadow
      ${isTouchActive ? 'bg-blue-500/70 text-white' : ''}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
        <circle cx="12" cy="12" r="10" className="animate-ping" style={{animationDuration: '1.5s'}} />
        <circle cx="12" cy="12" r="8" />
      </svg>
      Live
    </div>
  );
  
  return (
    <div className={`relative ${className}`} 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Static image */}
      <img 
        ref={imageRef}
        src={photoApi.getPhotoUrl(photo.id)}
        alt={photo.originalName}
        className={`w-full h-full object-cover transition-opacity duration-200 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {/* Motion part (video) */}
      {hasMotion && (
        <video 
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          preload="auto"
        />
      )}
      
      {/* Live Photo indicator */}
      {hasMotion && <LivePhotoBadge />}
    </div>
  );
}