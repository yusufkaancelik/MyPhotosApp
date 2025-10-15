import { useState } from 'react';
import { Photo } from '../types';
import { XMarkIcon, InformationCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import LivePhoto from './LivePhoto';
import { photoApi } from '../api';

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoDetail({ photo, onClose }: PhotoDetailProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  
  const handleDownload = () => {
    const downloadUrl = photoApi.getDownloadUrl(photo.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = ''; // Use server suggested filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Render coordinates in a human-readable format
  const formatCoordinates = (lat: number | null | undefined, long: number | null | undefined) => {
    if (lat === null || long === null || lat === undefined || long === undefined) {
      return 'No location data';
    }
    
    // Convert decimal degrees to degrees, minutes, seconds
    const formatCoordinate = (coordinate: number, isLatitude: boolean) => {
      const absolute = Math.abs(coordinate);
      const degrees = Math.floor(absolute);
      const minutes = Math.floor((absolute - degrees) * 60);
      const seconds = Math.floor(((absolute - degrees) * 60 - minutes) * 60);
      
      const direction = isLatitude 
        ? coordinate >= 0 ? 'N' : 'S'
        : coordinate >= 0 ? 'E' : 'W';
      
      return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
    };
    
    return (
      <div>
        <div>{formatCoordinate(lat, true)}</div>
        <div>{formatCoordinate(long, false)}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white">
        <h2 className="text-lg font-medium truncate">{photo.originalName}</h2>
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowMetadata(!showMetadata)}
            className="flex items-center"
            title="Toggle photo information"
          >
            <InformationCircleIcon className="h-6 w-6" />
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center"
            title="Download original photo"
          >
            <ArrowDownTrayIcon className="h-6 w-6" />
          </button>
          <button onClick={onClose} className="flex items-center" title="Close">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Photo view */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-full max-h-full">
            {photo.metadata?.isLivePhoto ? (
              <LivePhoto 
                photo={photo}
                className="max-h-[calc(100vh-8rem)] object-contain mx-auto"
              />
            ) : (
              <img 
                src={photoApi.getPhotoUrl(photo.id)}
                alt={photo.originalName}
                className="max-h-[calc(100vh-8rem)] object-contain mx-auto"
              />
            )}
          </div>
        </div>
        
        {/* Metadata panel - slides in from right */}
        {showMetadata && (
          <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-4">Photo Information</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400">File Details</h4>
                <p className="text-white">{photo.originalName}</p>
                <p className="text-gray-300 text-sm">{formatDate(photo.metadata.dateTaken || photo.createdAt)}</p>
                {photo.metadata?.isLivePhoto && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    Live Photo
                  </span>
                )}
              </div>
              
              {(photo.metadata.make || photo.metadata.model) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Camera</h4>
                  <p className="text-white">
                    {photo.metadata.make && photo.metadata.model 
                      ? `${photo.metadata.make} ${photo.metadata.model}`
                      : photo.metadata.make || photo.metadata.model}
                  </p>
                </div>
              )}
              
              {photo.metadata.gps && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Location</h4>
                  <div className="text-white">
                    {formatCoordinates(
                      photo.metadata.gps?.latitude, 
                      photo.metadata.gps?.longitude
                    )}
                  </div>
                </div>
              )}
              
              {/* Show raw metadata if available */}
              {photo.metadata.originalMetadata && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-400">All Metadata</h4>
                  <pre className="mt-2 text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(photo.metadata.originalMetadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}