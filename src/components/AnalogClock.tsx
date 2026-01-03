/**
 * AnalogClock Component
 *
 * Renders an SVG analog clock with:
 * - Main numbers: 12, 3, 6, 9
 * - Tick marks for all hours and 5-minute intervals
 * - Distinct hour (short, thick) and minute (long, thin) hands
 * - Optional interactive mode for setting time by dragging hands
 */

import React, { useCallback, useRef, useState } from 'react';

interface AnalogClockProps {
  hours: number;        // 1-12
  minutes: number;      // 0-59
  interactive?: boolean; // Allow user to set time by dragging
  onTimeChange?: (hours: number, minutes: number) => void;
  size?: number;        // Clock size in pixels
  showAnswer?: boolean; // Show correct answer highlight
}

const AnalogClock: React.FC<AnalogClockProps> = ({
  hours,
  minutes,
  interactive = false,
  onTimeChange,
  size = 280,
  showAnswer = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<'hour' | 'minute' | null>(null);

  const center = size / 2;
  const clockRadius = size * 0.42;
  const hourHandLength = clockRadius * 0.5;
  const minuteHandLength = clockRadius * 0.75;

  // Calculate hand angles
  // Hour hand: 360/12 = 30 degrees per hour, plus minute contribution
  const hourAngle = ((hours % 12) + minutes / 60) * 30 - 90;
  // Minute hand: 360/60 = 6 degrees per minute
  const minuteAngle = minutes * 6 - 90;

  // Convert angle to coordinates
  const getHandEnd = (angle: number, length: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + Math.cos(rad) * length,
      y: center + Math.sin(rad) * length,
    };
  };

  const hourEnd = getHandEnd(hourAngle, hourHandLength);
  const minuteEnd = getHandEnd(minuteAngle, minuteHandLength);

  // Handle drag interaction
  const getAngleFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return 0;

    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left - center;
    const y = clientY - rect.top - center;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    return angle;
  }, [center]);

  const handlePointerDown = useCallback((hand: 'hour' | 'minute') => (e: React.MouseEvent | React.TouchEvent) => {
    if (!interactive) return;
    e.preventDefault();
    setDragging(hand);
  }, [interactive]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging || !onTimeChange) return;

    const angle = getAngleFromEvent(e);

    if (dragging === 'minute') {
      // Snap to 5-minute intervals
      const newMinutes = Math.round(angle / 6) % 60;
      onTimeChange(hours, newMinutes);
    } else {
      // Hour hand
      let newHours = Math.round(angle / 30);
      if (newHours === 0) newHours = 12;
      onTimeChange(newHours, minutes);
    }
  }, [dragging, getAngleFromEvent, hours, minutes, onTimeChange]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const angle = i * 6 - 90;
    const rad = (angle * Math.PI) / 180;
    const isHourMark = i % 5 === 0;
    const innerRadius = isHourMark ? clockRadius * 0.85 : clockRadius * 0.92;
    const outerRadius = clockRadius * 0.98;

    ticks.push(
      <line
        key={i}
        x1={center + Math.cos(rad) * innerRadius}
        y1={center + Math.sin(rad) * innerRadius}
        x2={center + Math.cos(rad) * outerRadius}
        y2={center + Math.sin(rad) * outerRadius}
        stroke={isHourMark ? '#6366f1' : '#a5b4fc'}
        strokeWidth={isHourMark ? 3 : 1.5}
        strokeLinecap="round"
      />
    );
  }

  // Main numbers (12, 3, 6, 9)
  const mainNumbers = [
    { num: 12, angle: -90 },
    { num: 3, angle: 0 },
    { num: 6, angle: 90 },
    { num: 9, angle: 180 },
  ];

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`select-none ${interactive ? 'cursor-pointer' : ''}`}
      onMouseMove={interactive ? handlePointerMove : undefined}
      onMouseUp={interactive ? handlePointerUp : undefined}
      onMouseLeave={interactive ? handlePointerUp : undefined}
      onTouchMove={interactive ? handlePointerMove : undefined}
      onTouchEnd={interactive ? handlePointerUp : undefined}
    >
      {/* Clock face background */}
      <circle
        cx={center}
        cy={center}
        r={clockRadius}
        fill="white"
        stroke={showAnswer ? '#22c55e' : '#6366f1'}
        strokeWidth={showAnswer ? 6 : 4}
        className={showAnswer ? 'animate-pulse' : ''}
      />

      {/* Tick marks */}
      {ticks}

      {/* Main numbers */}
      {mainNumbers.map(({ num, angle }) => {
        const rad = (angle * Math.PI) / 180;
        const textRadius = clockRadius * 0.7;
        return (
          <text
            key={num}
            x={center + Math.cos(rad) * textRadius}
            y={center + Math.sin(rad) * textRadius}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-bold fill-primary-700"
            fontSize={size * 0.09}
          >
            {num}
          </text>
        );
      })}

      {/* Hour hand (short, thick, darker) */}
      <line
        x1={center}
        y1={center}
        x2={hourEnd.x}
        y2={hourEnd.y}
        stroke="#4338ca"
        strokeWidth={size * 0.035}
        strokeLinecap="round"
        className={`${interactive ? 'cursor-grab' : ''} ${dragging === 'hour' ? 'opacity-70' : ''}`}
        onMouseDown={handlePointerDown('hour')}
        onTouchStart={handlePointerDown('hour')}
      />

      {/* Minute hand (long, thinner, lighter) */}
      <line
        x1={center}
        y1={center}
        x2={minuteEnd.x}
        y2={minuteEnd.y}
        stroke="#818cf8"
        strokeWidth={size * 0.02}
        strokeLinecap="round"
        className={`${interactive ? 'cursor-grab' : ''} ${dragging === 'minute' ? 'opacity-70' : ''}`}
        onMouseDown={handlePointerDown('minute')}
        onTouchStart={handlePointerDown('minute')}
      />

      {/* Center dot */}
      <circle
        cx={center}
        cy={center}
        r={size * 0.03}
        fill="#4338ca"
      />

      {/* Interactive hint */}
      {interactive && (
        <text
          x={center}
          y={size * 0.95}
          textAnchor="middle"
          className="fill-primary-400"
          fontSize={size * 0.045}
        >
          Потяни стрелки
        </text>
      )}
    </svg>
  );
};

export default AnalogClock;
