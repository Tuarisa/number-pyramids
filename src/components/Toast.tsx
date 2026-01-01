/**
 * Toast Component
 *
 * Displays transient messages like:
 * - Success/completion messages
 * - Error notifications
 * - Achievement unlocks
 */

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'achievement' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Style variants
  const variants: Record<ToastType, { bg: string; icon: string }> = {
    success: {
      bg: 'from-green-400 to-green-600',
      icon: '🎉',
    },
    error: {
      bg: 'from-red-400 to-red-600',
      icon: '😅',
    },
    achievement: {
      bg: 'from-purple-400 to-indigo-600',
      icon: '🏆',
    },
    info: {
      bg: 'from-blue-400 to-blue-600',
      icon: 'ℹ️',
    },
  };

  const variant = variants[type];

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        px-6 py-4 rounded-2xl
        bg-gradient-to-r ${variant.bg}
        text-white font-bold text-lg
        shadow-2xl
        flex items-center gap-3
        transition-all duration-300
        ${isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
        }
      `}
    >
      <span className="text-2xl">{variant.icon}</span>
      <span>{message}</span>
    </div>
  );
};

export default Toast;
