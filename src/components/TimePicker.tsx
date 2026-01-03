/**
 * TimePicker Component
 * 
 * iOS-style time picker with scrollable wheels
 * Simple and reliable implementation
 */

import React, { useRef, useEffect, useCallback } from 'react';

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
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  
  // Base options
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55
  
  // Constants
  const ITEM_HEIGHT = 48; // h-12 in Tailwind = 48px
  const CENTER_OFFSET = ITEM_HEIGHT * 2; // Offset to center item (2 items above center)
  const VISIBLE_ITEMS = 5; // Show 5 items (2 above, 1 center, 2 below)
  const CUT_OFFSET = ITEM_HEIGHT / 2; // Half item height for top/bottom cut
  
  // Create extended lists for infinite scroll (5 copies)
  const extendedHourOptions = [
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
  ];
  
  // Calculate initial scroll position
  // scrollTop positions the top item, but we want the center item to be at the value
  const getInitialScrollTop = (value: number, options: number[]): number => {
    const index = options.indexOf(value);
    if (index === -1) {
      const listLength = options.length;
      const copyIndex = 2; // Middle copy
      return (copyIndex * listLength) * ITEM_HEIGHT - CENTER_OFFSET;
    }
    const listLength = options.length;
    const copyIndex = 2; // Middle copy
    const scrollTop = (copyIndex * listLength + index) * ITEM_HEIGHT - CENTER_OFFSET;
    return scrollTop;
  };
  
  // Calculate value from scroll position
  // scrollTop is the position of the top item, but we need the center item
  const getValueFromScroll = (scrollTop: number, options: number[]): number => {
    const listLength = options.length;
    const centerPosition = scrollTop + CENTER_OFFSET;
    const index = Math.round(centerPosition / ITEM_HEIGHT);
    const normalizedIndex = index % listLength;
    return options[normalizedIndex];
  };
  
  // Refs to track initialization and prevent unnecessary updates
  const isInitializedRef = useRef(false);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPropsRef = useRef({ hours: initialHours, minutes: initialMinutes });
  const isUpdatingRef = useRef(false); // Flag to prevent onTimeChange during programmatic updates
  
  // Initialize scroll positions on mount
  useEffect(() => {
    if (hoursRef.current && minutesRef.current && !isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Set flag to prevent onTimeChange during initialization
      isUpdatingRef.current = true;
      
      const hoursScroll = getInitialScrollTop(initialHours, hourOptions);
      const minutesScroll = getInitialScrollTop(initialMinutes, minuteOptions);
      
      // Temporarily disable snap to set position accurately
      hoursRef.current.classList.remove('snap-y', 'snap-mandatory');
      minutesRef.current.classList.remove('snap-y', 'snap-mandatory');
      
      // Set scroll position
      hoursRef.current.scrollTop = hoursScroll;
      minutesRef.current.scrollTop = minutesScroll;
      
      // Force reflow
      void hoursRef.current.offsetHeight;
      void minutesRef.current.offsetHeight;
      
      // Set again to ensure it sticks
      hoursRef.current.scrollTop = hoursScroll;
      minutesRef.current.scrollTop = minutesScroll;
      
      // Re-enable snap after a delay
      setTimeout(() => {
        if (hoursRef.current && minutesRef.current) {
          // Verify position is still correct before enabling snap
          const currentHours = getValueFromScroll(hoursRef.current.scrollTop, hourOptions);
          const currentMinutes = getValueFromScroll(minutesRef.current.scrollTop, minuteOptions);
          
          // If position changed, fix it
          if (currentHours !== initialHours || currentMinutes !== initialMinutes) {
            hoursRef.current.scrollTop = hoursScroll;
            minutesRef.current.scrollTop = minutesScroll;
            void hoursRef.current.offsetHeight;
            void minutesRef.current.offsetHeight;
            hoursRef.current.scrollTop = hoursScroll;
            minutesRef.current.scrollTop = minutesScroll;
          }
          
          // Re-enable snap
          hoursRef.current.classList.add('snap-y', 'snap-mandatory');
          minutesRef.current.classList.add('snap-y', 'snap-mandatory');
          
          // Check after enabling snap and disable if it causes drift
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (hoursRef.current && minutesRef.current) {
                const immediateHours = getValueFromScroll(hoursRef.current.scrollTop, hourOptions);
                const immediateMinutes = getValueFromScroll(minutesRef.current.scrollTop, minuteOptions);
                
                // If snap changed position, disable snap permanently
                if (immediateHours !== initialHours || immediateMinutes !== initialMinutes) {
                  hoursRef.current.classList.remove('snap-y', 'snap-mandatory');
                  minutesRef.current.classList.remove('snap-y', 'snap-mandatory');
                  hoursRef.current.scrollTop = hoursScroll;
                  minutesRef.current.scrollTop = minutesScroll;
                }
                
                // Clear update flag after initialization is complete
                setTimeout(() => {
                  isUpdatingRef.current = false;
                }, 200);
              }
            });
          });
        }
      }, 150);
      
      lastPropsRef.current = { hours: initialHours, minutes: initialMinutes };
    }
  }, []); // Only run once on mount
  
  // Update scroll when props change (new puzzle)
  useEffect(() => {
    if (isInitializedRef.current && hoursRef.current && minutesRef.current) {
      // Only update if values actually changed (new puzzle)
      if (initialHours !== lastPropsRef.current.hours || initialMinutes !== lastPropsRef.current.minutes) {
        
        // Set flag to prevent onTimeChange during programmatic update
        isUpdatingRef.current = true;
        
        // Clear any pending scroll timeouts
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
        
        // Temporarily disable snap to set position accurately
        hoursRef.current.classList.remove('snap-y', 'snap-mandatory');
        minutesRef.current.classList.remove('snap-y', 'snap-mandatory');
        
        const hoursScroll = getInitialScrollTop(initialHours, hourOptions);
        const minutesScroll = getInitialScrollTop(initialMinutes, minuteOptions);
        
        hoursRef.current.scrollTop = hoursScroll;
        minutesRef.current.scrollTop = minutesScroll;
        
        // Force reflow
        void hoursRef.current.offsetHeight;
        void minutesRef.current.offsetHeight;
        
        // Set again to ensure it sticks
        hoursRef.current.scrollTop = hoursScroll;
        minutesRef.current.scrollTop = minutesScroll;
        
        // Re-enable snap after a delay
        setTimeout(() => {
          if (hoursRef.current && minutesRef.current) {
            // Verify position is still correct before enabling snap
            const currentHours = getValueFromScroll(hoursRef.current.scrollTop, hourOptions);
            const currentMinutes = getValueFromScroll(minutesRef.current.scrollTop, minuteOptions);
            
            // If position changed, fix it
            if (currentHours !== initialHours || currentMinutes !== initialMinutes) {
              hoursRef.current.scrollTop = hoursScroll;
              minutesRef.current.scrollTop = minutesScroll;
              void hoursRef.current.offsetHeight;
              void minutesRef.current.offsetHeight;
              hoursRef.current.scrollTop = hoursScroll;
              minutesRef.current.scrollTop = minutesScroll;
            }
            
            // Re-enable snap
            hoursRef.current.classList.add('snap-y', 'snap-mandatory');
            minutesRef.current.classList.add('snap-y', 'snap-mandatory');
            
            // Clear update flag after a delay to allow scroll events to be processed
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 200);
          }
        }, 150);
        
        lastPropsRef.current = { hours: initialHours, minutes: initialMinutes };
      }
    }
  }, [initialHours, initialMinutes]);
  
  // Handle infinite scroll - jump to middle when near edges
  const handleInfiniteScroll = (ref: React.RefObject<HTMLDivElement>, options: number[]) => {
    if (!ref.current || !isInitializedRef.current) return;
    
    const scrollTop = ref.current.scrollTop;
    const listLength = options.length;
    const middleStart = listLength * ITEM_HEIGHT * 2; // Start of 3rd copy
    
    // If scrolled too far up, jump to middle
    if (scrollTop < listLength * ITEM_HEIGHT) {
      const currentIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const normalizedIndex = currentIndex % listLength;
      const newScrollTop = middleStart + normalizedIndex * ITEM_HEIGHT - CENTER_OFFSET;
      ref.current.scrollTop = newScrollTop;
    }
    // If scrolled too far down, jump to middle
    else if (scrollTop > listLength * ITEM_HEIGHT * 4) {
      const currentIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const normalizedIndex = currentIndex % listLength;
      const newScrollTop = middleStart + normalizedIndex * ITEM_HEIGHT - CENTER_OFFSET;
      ref.current.scrollTop = newScrollTop;
    }
  };
  
  // Handle scroll event
  const handleScroll = useCallback((type: 'hours' | 'minutes') => {
    if (!isInitializedRef.current || disabled || isUpdatingRef.current) return;
    
    const ref = type === 'hours' ? hoursRef : minutesRef;
    const options = type === 'hours' ? hourOptions : minuteOptions;
    
    if (!ref.current) return;
    
    // Handle infinite scroll
    handleInfiniteScroll(ref, options);
    
    // Mark as scrolling
    isScrollingRef.current = true;
    
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Notify parent after scroll ends (debounce)
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      
      // Don't notify if we're in the middle of a programmatic update
      if (isUpdatingRef.current) return;
      
      // Get final values from both pickers
      const finalHoursScroll = hoursRef.current?.scrollTop ?? 0;
      const finalMinutesScroll = minutesRef.current?.scrollTop ?? 0;
      const finalHours = getValueFromScroll(finalHoursScroll, hourOptions);
      const finalMinutes = getValueFromScroll(finalMinutesScroll, minuteOptions);
      
      // Notify parent asynchronously to avoid setState during render
      setTimeout(() => {
        if (!isUpdatingRef.current) {
          onTimeChange(finalHours, finalMinutes);
        }
      }, 0);
    }, 150);
  }, [disabled, onTimeChange]);
  
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Hours picker */}
      <div className="relative overflow-hidden" style={{ height: `${VISIBLE_ITEMS * ITEM_HEIGHT - CUT_OFFSET * 2}px` }}>
        <div className="absolute inset-0 flex items-center pointer-events-none z-10">
          <div className="w-full h-12 border-t-2 border-b-2 border-primary-500 rounded"></div>
        </div>
        <div
          ref={hoursRef}
          className="w-20 overflow-y-scroll hide-scrollbar snap-y snap-mandatory"
          style={{ 
            height: `${VISIBLE_ITEMS * ITEM_HEIGHT}px`,
            marginTop: `-${CUT_OFFSET}px`,
            marginBottom: `-${CUT_OFFSET}px`,
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none' 
          }}
          onScroll={() => handleScroll('hours')}
        >
          <div className="flex flex-col">
            {extendedHourOptions.map((hour, index) => (
              <div
                key={`hour-${index}`}
                className="h-12 flex items-center justify-center snap-start"
              >
                <span className="text-3xl font-bold text-primary-700">
                  {hour}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Separator */}
      <span className="text-3xl font-bold text-primary-500">:</span>
      
      {/* Minutes picker */}
      <div className="relative overflow-hidden" style={{ height: `${VISIBLE_ITEMS * ITEM_HEIGHT - CUT_OFFSET * 2}px` }}>
        <div className="absolute inset-0 flex items-center pointer-events-none z-10">
          <div className="w-full h-12 border-t-2 border-b-2 border-primary-500 rounded"></div>
        </div>
        <div
          ref={minutesRef}
          className="w-20 overflow-y-scroll hide-scrollbar snap-y snap-mandatory"
          style={{ 
            height: `${VISIBLE_ITEMS * ITEM_HEIGHT}px`,
            marginTop: `-${CUT_OFFSET}px`,
            marginBottom: `-${CUT_OFFSET}px`,
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none' 
          }}
          onScroll={() => handleScroll('minutes')}
        >
          <div className="flex flex-col">
            {extendedMinuteOptions.map((minute, index) => (
              <div
                key={`minute-${index}`}
                className="h-12 flex items-center justify-center snap-start"
              >
                <span className="text-3xl font-bold text-primary-700">
                  {String(minute).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimePicker;
