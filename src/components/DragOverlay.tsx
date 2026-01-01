/**
 * DragOverlay Component
 *
 * Shows a floating token that follows the finger/mouse during drag.
 * Handles touch and mouse move events globally.
 */

import React, { useEffect, useState, useCallback } from 'react';

interface DragOverlayProps {
  value: number | null;
  onDrop: (x: number, y: number) => void;
  onCancel: () => void;
}

const DragOverlay: React.FC<DragOverlayProps> = ({
  value,
  onDrop,
  onCancel,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    setPosition({ x: clientX, y: clientY });
  }, []);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    onDrop(clientX, clientY);
    setPosition(null);
  }, [onDrop]);

  const handleCancel = useCallback(() => {
    onCancel();
    setPosition(null);
  }, [onCancel]);

  useEffect(() => {
    if (value === null) {
      setPosition(null);
      return;
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        handleEnd(touch.clientX, touch.clientY);
      } else {
        handleCancel();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      handleEnd(e.clientX, e.clientY);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    // Add global listeners
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleCancel);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleCancel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [value, handleMove, handleEnd, handleCancel]);

  if (value === null || position === null) {
    return null;
  }

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="
          w-20 h-20
          rounded-2xl
          flex items-center justify-center
          text-4xl font-extrabold
          bg-gradient-to-br from-yellow-300 to-amber-400
          text-amber-900
          border-4 border-amber-600
          shadow-2xl
          scale-110
          animate-pulse
        "
      >
        {value}
      </div>
    </div>
  );
};

export default DragOverlay;
