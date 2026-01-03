/**
 * TimePicker Component
 * 
 * iOS-style time picker with scrollable wheels for hours and minutes
 * Creates infinite scroll effect by duplicating options 3 times above and below
 * Used for selecting time in clock reading mode
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface TimePickerProps {
  hours: number; // 1-12
  minutes: number; // 0-55 (in 5-minute steps)
  onTimeChange: (hours: number, minutes: number) => void;
  disabled?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  hours: initialHours,
  minutes: initialMinutes,
  onTimeChange,
  disabled = false,
}) => {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Generate base options
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

  // Create extended lists: 3 copies above + original + 3 copies below = 7 copies total
  const extendedHourOptions = [
    ...hourOptions,
    ...hourOptions,
    ...hourOptions,
    ...hourOptions,
    ...hourOptions,
    ...hourOptions,
    ...hourOptions,
  ];

  const extendedMinuteOptions = [
    ...minuteOptions,
    ...minuteOptions,
    ...minuteOptions,
    ...minuteOptions,
    ...minuteOptions,
    ...minuteOptions,
    ...minuteOptions,
  ];

  const itemHeight = 50;
  const singleListHeight = hourOptions.length * itemHeight;
  const startOffset = singleListHeight * 3; // Start in the 4th copy (middle)

  // Update state when initial values change
  useEffect(() => {
    setHours(initialHours);
    setMinutes(initialMinutes);
    // Reset initialization flag when values change
    isInitializedRef.current = false;
    
    // Re-initialize scroll positions
    setTimeout(() => {
      if (hoursRef.current && minutesRef.current) {
        const hoursIndex = hourOptions.indexOf(initialHours);
        const minutesIndex = minuteOptions.indexOf(initialMinutes);
        
        if (hoursIndex !== -1 && minutesIndex !== -1) {
          const hoursScroll = startOffset + (hoursIndex * itemHeight);
          const minutesScroll = startOffset + (minutesIndex * itemHeight);
          
          hoursRef.current.scrollTop = hoursScroll;
          minutesRef.current.scrollTop = minutesScroll;
          
          // Mark as initialized and notify parent
          setTimeout(() => {
            isInitializedRef.current = true;
            onTimeChange(initialHours, initialMinutes);
          }, 50);
        }
      }
    }, 10);
  }, [initialHours, initialMinutes]);

  // Initialize scroll position to middle copy
  useEffect(() => {
    if (hoursRef.current && !isScrollingRef.current) {
      const index = hourOptions.indexOf(hours);
      if (index !== -1) {
        const targetScroll = startOffset + (index * itemHeight);
        hoursRef.current.scrollTop = targetScroll;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  useEffect(() => {
    if (minutesRef.current && !isScrollingRef.current) {
      const index = minuteOptions.indexOf(minutes);
      if (index !== -1) {
        const targetScroll = startOffset + (index * itemHeight);
        minutesRef.current.scrollTop = targetScroll;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes]);

  // Initial mount: set scroll position and notify parent
  useEffect(() => {
    // Set initial scroll positions and values synchronously
    if (hoursRef.current && minutesRef.current) {
      const hoursIndex = hourOptions.indexOf(initialHours);
      const minutesIndex = minuteOptions.indexOf(initialMinutes);
      
      if (hoursIndex !== -1 && minutesIndex !== -1) {
        const hoursScroll = startOffset + (hoursIndex * itemHeight);
        const minutesScroll = startOffset + (minutesIndex * itemHeight);
        
        // Set scroll positions
        hoursRef.current.scrollTop = hoursScroll;
        minutesRef.current.scrollTop = minutesScroll;
        
        // Set state values immediately
        setHours(initialHours);
        setMinutes(initialMinutes);
        
        // Mark as initialized after a small delay to ensure scroll is set
        setTimeout(() => {
          isInitializedRef.current = true;
          // Notify parent with correct values after initialization
          onTimeChange(initialHours, initialMinutes);
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
    };
  }, []);

  // Handle infinite scroll - jump to middle copy when near edges
  const handleInfiniteScroll = useCallback((
    ref: React.RefObject<HTMLDivElement>,
    options: number[],
    extendedOptions: number[]
  ) => {
    if (!ref.current || isScrollingRef.current) return;

    const scrollTop = ref.current.scrollTop;
    const totalHeight = extendedOptions.length * itemHeight;
    const threshold = singleListHeight * 1.5; // Threshold for jumping
    
    // If scrolled too far up (into first 1.5 copies), jump to middle
    if (scrollTop < threshold) {
      isScrollingRef.current = true;
      const currentIndex = Math.round(scrollTop / itemHeight) % options.length;
      const newScroll = startOffset + (currentIndex * itemHeight);
      // Use scrollTo without animation for instant jump
      ref.current.scrollTop = newScroll;
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
    // If scrolled too far down (into last 1.5 copies), jump to middle
    else if (scrollTop > totalHeight - threshold) {
      isScrollingRef.current = true;
      const currentIndex = Math.round(scrollTop / itemHeight) % options.length;
      const newScroll = startOffset + (currentIndex * itemHeight);
      // Use scrollTo without animation for instant jump
      ref.current.scrollTop = newScroll;
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
  }, [singleListHeight, startOffset]);

  // Helper function to calculate value from scroll position
  const calculateValueFromScroll = useCallback((
    scrollTop: number,
    options: number[]
  ): number => {
    // Calculate which item is in the center (accounting for startOffset)
    // The scrollTop should be in the middle copy range (startOffset ± singleListHeight)
    const relativeScroll = scrollTop - startOffset;
    const index = Math.round(relativeScroll / itemHeight);
    // Normalize index to be within options range
    let normalizedIndex = index % options.length;
    if (normalizedIndex < 0) {
      normalizedIndex += options.length;
    }
    return options[normalizedIndex];
  }, [startOffset, itemHeight]);

  // Handle scroll and snap to nearest value
  const handleScroll = useCallback((
    ref: React.RefObject<HTMLDivElement>,
    options: number[],
    extendedOptions: number[],
    setter: (value: number) => void,
    type: 'hours' | 'minutes'
  ) => {
    if (!ref.current || disabled || isScrollingRef.current || !isInitializedRef.current) return;

    // Get current scroll position
    const scrollTop = ref.current.scrollTop;
    
    // Calculate value using helper function
    const value = calculateValueFromScroll(scrollTop, options);

    // Only update if value actually changed to avoid unnecessary re-renders
    setter((prevValue) => {
      if (prevValue !== value) {
        return value;
      }
      return prevValue;
    });
    
    // Update the other value using current state
    if (type === 'hours') {
      setMinutes((prevMinutes) => {
        onTimeChange(value, prevMinutes);
        return prevMinutes;
      });
    } else {
      setHours((prevHours) => {
        onTimeChange(prevHours, value);
        return prevHours;
      });
    }

    // Handle infinite scroll after value is set
    handleInfiniteScroll(ref, options, extendedOptions);

    // Debounce snap to avoid too frequent updates
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }
    
    snapTimeoutRef.current = setTimeout(() => {
      if (ref.current && !isScrollingRef.current) {
        const currentScroll = ref.current.scrollTop;
        const relativeScroll = currentScroll - startOffset;
        
        // Snap to nearest position in middle copy
        const targetIndex = Math.round(relativeScroll / itemHeight);
        let normalizedIndex = targetIndex % options.length;
        if (normalizedIndex < 0) {
          normalizedIndex += options.length;
        }
        const targetScroll = startOffset + (normalizedIndex * itemHeight);
        
        // Only snap if we're not in the middle copy
        const distanceFromMiddle = Math.abs(currentScroll - targetScroll);
        if (distanceFromMiddle > itemHeight / 2) {
          ref.current.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        }
      }
    }, 150);
  }, [disabled, onTimeChange, handleInfiniteScroll, calculateValueFromScroll]);

  return (
    <div className="flex items-center gap-2">
      {/* Hours wheel */}
      <div className="relative">
        <div
          ref={hoursRef}
          onScroll={() => handleScroll(hoursRef, hourOptions, extendedHourOptions, setHours, 'hours')}
          className={`
            w-20 h-48 overflow-y-scroll snap-y snap-mandatory
            scrollbar-hide
            ${disabled ? 'opacity-50' : ''}
          `}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Extended options (3 copies above + original + 3 copies below) */}
          {extendedHourOptions.map((hour, index) => (
            <div
              key={`hour-${index}`}
              className="h-12 flex items-center justify-center snap-center"
            >
              <span className="text-3xl font-bold text-primary-700">
                {hour}
              </span>
            </div>
          ))}
        </div>
        
        {/* Selection indicator */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none">
          <div className="h-12 border-t-2 border-b-2 border-primary-500 rounded" />
        </div>
      </div>

      {/* Separator */}
      <span className="text-3xl font-bold text-primary-500">:</span>

      {/* Minutes wheel */}
      <div className="relative">
        <div
          ref={minutesRef}
          onScroll={() => handleScroll(minutesRef, minuteOptions, extendedMinuteOptions, setMinutes, 'minutes')}
          className={`
            w-24 h-48 overflow-y-scroll snap-y snap-mandatory
            scrollbar-hide
            ${disabled ? 'opacity-50' : ''}
          `}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Extended options (3 copies above + original + 3 copies below) */}
          {extendedMinuteOptions.map((minute, index) => (
            <div
              key={`minute-${index}`}
              className="h-12 flex items-center justify-center snap-center"
            >
              <span className="text-3xl font-bold text-primary-700">
                {minute.toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
        
        {/* Selection indicator */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none">
          <div className="h-12 border-t-2 border-b-2 border-primary-500 rounded" />
        </div>
      </div>
    </div>
  );
};

export default TimePicker;
