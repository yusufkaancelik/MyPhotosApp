import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { photoApi } from '../api';
import { Photo } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTouchSelection } from '../hooks/useTouchSelection';
import LivePhoto from './LivePhoto';
import '../styles/photoGrid.css';

export interface PhotoGridProps {
  photos: Photo[];
  onPhotoSelect?: (photo: Photo) => void;
  onAction?: (action: string, count: number) => void;
}

export default function PhotoGrid({ photos, onPhotoSelect, onAction }: PhotoGridProps) {
  const queryClient = useQueryClient();
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Delete photos mutation
  const deletePhotosMutation = useMutation({
    mutationFn: (photoIds: string[]) => photoApi.deleteMultiplePhotos(photoIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      if (onAction) {
        onAction('delete', variables.length);
      }
      clearSelection();
    },
  });

  // Find photo index in the array
  const findPhotoIndex = (id: string): number => {
    return photos.findIndex(photo => photo.id === id);
  };
  
  // Select a range of photos between two indices
  const selectPhotoRange = (startId: string, endId: string) => {
    const startIndex = findPhotoIndex(startId);
    const endIndex = findPhotoIndex(endId);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    const photosInRange = photos.slice(minIndex, maxIndex + 1).map(p => p.id);
    
    setSelectedPhotos(prev => {
      const updated = new Set(prev);
      photosInRange.forEach(id => updated.add(id));
      return updated;
    });
  };
  
  // Touch selection hook integration
  const [isDragging, setIsDragging] = useState(false);
  const [recentlySelected, setRecentlySelected] = useState<Set<string>>(new Set());
  
  const { 
    handleTouchStart: onTouchStart, 
    handleTouchMove: onTouchMove, 
    handleTouchEnd: onTouchEnd,
    isDragging: isDraggingState
  } = useTouchSelection({
    onSelectionStart: (photoId) => {
      setSelectionMode(true);
      setSelectedPhotos(new Set([photoId]));
      
      // Provide haptic feedback on mobile devices if supported
      if (navigator.vibrate) {
        navigator.vibrate(50); // Short vibration
      }
    },
    onSelectionChange: (startId, endId) => {
      setIsDragging(true);
      
      // Get current selection before changes
      const previousSelection = new Set(selectedPhotos);
      
      // Update selection
      selectPhotoRange(startId, endId);
      
      // Wait for state update, then determine newly selected photos
      setTimeout(() => {
        const newlySelected = Array.from(selectedPhotos).filter(id => !previousSelection.has(id));
        setRecentlySelected(new Set(newlySelected));
        
        // Clear the recently selected status after animation
        setTimeout(() => {
          setRecentlySelected(new Set());
        }, 500);
      }, 0);
    },
    onSelectionEnd: () => {
      setIsDragging(false);
    }
  });
  
  // Update dragging state based on the hook
  useEffect(() => {
    setIsDragging(isDraggingState);
  }, [isDraggingState]);
  
  // Handle photo click
  const handlePhotoClick = (photo: Photo, event: React.MouseEvent) => {
    if (selectionMode) {
      event.preventDefault();
      event.stopPropagation();
      
      // Toggle selection
      const newSelection = new Set(selectedPhotos);
      if (selectedPhotos.has(photo.id)) {
        newSelection.delete(photo.id);
      } else {
        newSelection.add(photo.id);
      }
      
      setSelectedPhotos(newSelection);
      
      // If nothing is selected anymore, exit selection mode
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
    } else {
      // Normal mode - show photo details
      if (onPhotoSelect) {
        onPhotoSelect(photo);
      }
    }
  };
  
  // Handle long press to enter selection mode (for desktop/mouse)
  const handleLongPress = (photo: Photo, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Enter selection mode and select the photo
    setSelectionMode(true);
    setSelectedPhotos(new Set([photo.id]));
  };
  
  // Handle download of selected photos
  const handleDownloadSelected = () => {
    selectedPhotos.forEach(photoId => {
      const downloadUrl = photoApi.getDownloadUrl(photoId);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };
  
  // Handle delete of selected photos
  const handleDeleteSelected = () => {
    if (selectedPhotos.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedPhotos.size} photo(s)? This action cannot be undone.`)) {
      deletePhotosMutation.mutate(Array.from(selectedPhotos));
    }
  };
  
  // Clear selection
  const clearSelection = () => {
    setSelectedPhotos(new Set());
    setSelectionMode(false);
  };
  
  // Select all photos
  const selectAll = () => {
    const allPhotoIds = photos.map(photo => photo.id);
    setSelectedPhotos(new Set(allPhotoIds));
  };
  
  return (
    <div className="space-y-4">
      {/* Selection tools */}
      {selectionMode && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg bg-white p-2 shadow-md">
          <div className="flex items-center space-x-2">
            <button 
              onClick={clearSelection}
              className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={selectAll}
              className="rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Select All
            </button>
            <span className="text-sm font-medium text-gray-700 flex items-center">
              {selectedPhotos.size} selected
              {isDragging && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Dragging
                </span>
              )}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedPhotos.size === 0 || deletePhotosMutation.isPending}
              className="flex items-center rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              <TrashIcon className="mr-1 h-4 w-4" />
              {deletePhotosMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
            
            <button
              onClick={handleDownloadSelected}
              disabled={selectedPhotos.size === 0}
              className="flex items-center rounded-md bg-primary-600 px-3 py-1 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      )}
      
      {/* Photo grid */}
      {deletePhotosMutation.isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 mr-3"></div>
          <p>Deleting selected photos...</p>
        </div>
      )}
      
      {photos.length === 0 && !deletePhotosMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 mb-2">No photos available</p>
          <p className="text-sm text-gray-400">Upload photos to get started</p>
        </div>
      )}
      
      {photos.length > 0 && !selectionMode && !deletePhotosMutation.isPending && (
        <div className="bg-blue-50 rounded-md p-2 mb-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Tip:</span> Right-click on a photo to enter selection mode or long-press on mobile.
          </p>
        </div>
      )}
      
      {photos.length > 0 && selectionMode && !deletePhotosMutation.isPending && (
        <div className="bg-yellow-50 rounded-md p-2 mb-4">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Selection tip:</span> Long-press and drag to select multiple photos at once.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo) => {
          const isSelected = selectedPhotos.has(photo.id);
          
          return (
            <div 
              key={photo.id} 
              className={`group relative aspect-square overflow-hidden rounded-lg bg-gray-100 
                ${selectionMode ? 'cursor-pointer selectable' : ''} 
                photo-item
                ${isSelected ? 'selected' : ''}
                ${recentlySelected.has(photo.id) ? 'just-selected' : ''}
                ${isDragging ? 'dragging' : ''}
                touch-manipulation select-none`} /* Disable browser's default touch behavior and text selection */
              onClick={(e) => handlePhotoClick(photo, e)}
              onContextMenu={(e) => handleLongPress(photo, e)}
              onTouchStart={(e) => {
                // Always start touch tracking, but only prevent default in selection mode
                if (selectionMode) {
                  e.preventDefault();
                }
                const cleanup = onTouchStart(photo);
                return () => cleanup && cleanup();
              }}
              onTouchMove={(e) => {
                if (selectionMode || isDragging) {
                  e.preventDefault();
                  onTouchMove(photo);
                }
              }}
              onTouchEnd={() => {
                onTouchEnd();
              }}
              onTouchCancel={() => {
                onTouchEnd();
              }}
              data-photo-id={photo.id} /* Add data attribute for easier identification */
            >
              {photo.isVideo ? (
                <div className="relative h-full w-full">
                  <video
                    src={`/api/photos/${photo.id}/file`}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    onMouseOver={e => e.currentTarget.play()}
                    onMouseOut={e => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/50 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      <path d="M14 4a2 2 0 012 2v8a2 2 0 01-2 2h-2V4h2z" />
                    </svg>
                  </div>
                </div>
              ) : photo.metadata?.isLivePhoto ? (
                <LivePhoto 
                  photo={photo}
                  className="h-full w-full transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <img
                  src={`/api/photos/${photo.id}/file`}
                  alt={photo.filename}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              )}
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute right-2 top-2 rounded-full bg-primary-600 p-1 shadow-md">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
              )}
              
              <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent 
                ${selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
                transition-opacity duration-200`}
              >
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="truncate text-sm text-white">{photo.originalName}</p>
                  {photo.metadata.dateTaken && (
                    <p className="text-xs text-gray-300">
                      {new Date(photo.metadata.dateTaken).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}