import { useState, useCallback, useRef, useEffect } from 'react';
import { Photo } from '../types';

export interface TouchSelectionOptions {
  onSelectionStart?: (photoId: string) => void;
  onSelectionChange?: (startId: string, endId: string) => void;
  onSelectionEnd?: () => void;
  selectionDelay?: number;
}

// Helper to prevent default browser behaviors during selection
const preventDefaultTouchBehavior = (enabled: boolean) => {
  // This helps prevent browser zooming and scrolling while selecting photos
  document.body.style.touchAction = enabled ? 'none' : 'auto';
};

export function useTouchSelection({ 
  onSelectionStart, 
  onSelectionChange, 
  onSelectionEnd,
  selectionDelay = 500 
}: TouchSelectionOptions = {}) {
  const [touchStartId, setTouchStartId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchedId, setLastTouchedId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const selectionStartedRef = useRef(false);

  // Clear the timer if it exists
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((photo: Photo) => {
    let startX = 0;
    let startY = 0;
    let hasMoved = false;
    
    setTouchStartId(photo.id);
    
    // Start timer for long press
    clearLongPressTimer();
    
    // Track touch movement
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const moveX = Math.abs(touch.clientX - startX);
      const moveY = Math.abs(touch.clientY - startY);
      
      if (moveX > 10 || moveY > 10) {
        hasMoved = true;
        clearLongPressTimer();
      }
    };

    // Set initial touch position
    const handleFirstTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      document.addEventListener('touchmove', handleTouchMove);
    };
    
    document.addEventListener('touchstart', handleFirstTouch, { once: true });
    
    longPressTimerRef.current = window.setTimeout(() => {
      if (!hasMoved) {
        selectionStartedRef.current = true;
        preventDefaultTouchBehavior(true); // Disable browser zooming and scrolling
        if (onSelectionStart) {
          onSelectionStart(photo.id);
        }
      }
    }, selectionDelay);
    
    // Return cleanup function
    return clearLongPressTimer;
  }, [onSelectionStart, selectionDelay, clearLongPressTimer]);

  // Handle touch move
  const handleTouchMove = useCallback((photo: Photo) => {
    if (selectionStartedRef.current && touchStartId) {
      setIsDragging(true);
      
      if (photo.id !== lastTouchedId) {
        setLastTouchedId(photo.id);
        
        if (onSelectionChange && touchStartId) {
          onSelectionChange(touchStartId, photo.id);
        }
      }
    }
  }, [touchStartId, lastTouchedId, onSelectionChange]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!selectionStartedRef.current) {
      clearLongPressTimer();
    } else if (isDragging) {
      setIsDragging(false);
      preventDefaultTouchBehavior(false); // Re-enable browser zooming and scrolling
      if (onSelectionEnd) {
        onSelectionEnd();
      }
    }
    
    selectionStartedRef.current = false;
  }, [isDragging, onSelectionEnd, clearLongPressTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
      preventDefaultTouchBehavior(false);
    };
  }, [clearLongPressTimer]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging
  };
}