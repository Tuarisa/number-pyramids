/**
 * TimePicker Component
 * 
 * iOS-style time picker with scrollable wheels for hours and minutes
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
  const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate options
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

  // Update state when initial values change
  useEffect(() => {
    setHours(initialHours);
    setMinutes(initialMinutes);
  }, [initialHours, initialMinutes]);

  // Scroll to selected value on mount and when values change
  useEffect(() => {
    if (hoursRef.current) {
      const index = hourOptions.indexOf(hours);
      const itemHeight = 50;
      hoursRef.current.scrollTop = index * itemHeight;
    }
  }, [hours]);

  useEffect(() => {
    if (minutesRef.current) {
      const index = minuteOptions.indexOf(minutes);
      const itemHeight = 50;
      minutesRef.current.scrollTop = index * itemHeight;
    }
  }, [minutes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
    };
  }, []);

  // Handle scroll and snap to nearest value
  const handleScroll = useCallback((
    ref: React.RefObject<HTMLDivElement>,
    options: number[],
    setter: (value: number) => void,
    type: 'hours' | 'minutes'
  ) => {
    if (!ref.current || disabled) return;

    const scrollTop = ref.current.scrollTop;
    const itemHeight = 50;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
    const value = options[clampedIndex];

    setter(value);
    
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

    // Debounce snap to avoid too frequent updates
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }
    
    snapTimeoutRef.current = setTimeout(() => {
      if (ref.current) {
        ref.current.scrollTo({
          top: clampedIndex * itemHeight,
          behavior: 'smooth',
        });
      }
    }, 150);
  }, [disabled, onTimeChange]);

  return (
    <div className="flex items-center gap-2">
      {/* Hours wheel */}
      <div className="relative">
        <div
          ref={hoursRef}
          onScroll={() => handleScroll(hoursRef, hourOptions, setHours, 'hours')}
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
          {/* Spacer */}
          <div className="h-24" />
          
          {/* Options */}
          {hourOptions.map((hour) => (
            <div
              key={hour}
              className="h-12 flex items-center justify-center snap-center"
            >
              <span className="text-3xl font-bold text-primary-700">
                {hour}
              </span>
            </div>
          ))}
          
          {/* Spacer */}
          <div className="h-24" />
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
          onScroll={() => handleScroll(minutesRef, minuteOptions, setMinutes, 'minutes')}
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
          {/* Spacer */}
          <div className="h-24" />
          
          {/* Options */}
          {minuteOptions.map((minute) => (
            <div
              key={minute}
              className="h-12 flex items-center justify-center snap-center"
            >
              <span className="text-3xl font-bold text-primary-700">
                {minute.toString().padStart(2, '0')}
              </span>
            </div>
          ))}
          
          {/* Spacer */}
          <div className="h-24" />
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

