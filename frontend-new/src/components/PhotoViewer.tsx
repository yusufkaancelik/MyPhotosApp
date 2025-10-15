import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { photoApi } from '../api';

interface Photo {
  id: string;
  filename: string;
  originalName: string;
  thumbnail: string;
  metadata?: {
    dateTaken: string | null;
    make: string | null;
    model: string | null;
    gps: {
      latitude: number;
      longitude: number;
    } | null;
  };
}

interface PhotoViewerProps {
  photo: Photo;
  onClose: () => void;
  photos?: Photo[];
}

export function PhotoViewer({ photo, onClose, photos }: PhotoViewerProps) {
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Navigation between photos
  const currentIndex = photos ? photos.findIndex(p => p.id === currentPhoto.id) : -1;
  const hasNext = photos && currentIndex < photos.length - 1;
  const hasPrev = photos && currentIndex > 0;

  const showNext = () => {
    if (hasNext) {
      setCurrentPhoto(photos[currentIndex + 1]);
    }
  };

  const showPrev = () => {
    if (hasPrev) {
      setCurrentPhoto(photos[currentIndex - 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          showPrev();
          break;
        case 'ArrowRight':
          showNext();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPhoto, photos]);

  // Handle fullscreen
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await document.querySelector('.photo-container')?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // Photo download
  const handleDownload = () => {
    window.location.href = photoApi.getDownloadUrl(currentPhoto.id);
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-7xl transform rounded-lg bg-black shadow-xl transition-all">
                {/* Controls */}
                <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
                  <button
                    onClick={onClose}
                    className="rounded-full bg-black/50 p-2 text-white hover:bg-black/75"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleFullscreen}
                      className="rounded-full bg-black/50 p-2 text-white hover:bg-black/75"
                    >
                      <span className="text-sm font-medium px-1">F</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="rounded-full bg-black/50 p-2 text-white hover:bg-black/75"
                    >
                      <ArrowDownTrayIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Photo container */}
                <div className="relative photo-container h-[80vh] w-full">
                  <img
                    src={photoApi.getPhotoUrl(currentPhoto.id)}
                    alt={currentPhoto.filename}
                    className="h-full w-full object-contain"
                    onClick={toggleFullscreen}
                  />

                  {/* Photo details */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 p-4 text-white">
                    <h3 className="text-lg font-semibold">{currentPhoto.originalName}</h3>
                    {currentPhoto.metadata && (
                      <div className="mt-1 text-sm">
                        {currentPhoto.metadata.dateTaken && (
                          <span className="mr-4">
                            Taken: {new Date(currentPhoto.metadata.dateTaken).toLocaleDateString()}
                          </span>
                        )}
                        {currentPhoto.metadata.make && currentPhoto.metadata.model && (
                          <span>
                            Camera: {currentPhoto.metadata.make} {currentPhoto.metadata.model}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation buttons */}
                {hasPrev && (
                  <button
                    onClick={showPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/75"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                )}
                {hasNext && (
                  <button
                    onClick={showNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/75"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                )}

                {/* Keyboard shortcuts info */}
                <div className="absolute bottom-4 right-4 text-white/50 text-sm">
                  <div>←/→: Navigate</div>
                  <div>F: Fullscreen</div>
                  <div>ESC: Exit</div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}