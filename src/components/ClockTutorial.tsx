/**
 * ClockTutorial Component
 * 
 * Interactive tutorial presentation for teaching children how to read analog clocks
 * Uses existing AnalogClock component and browser speech synthesis
 */

import React, { useState, useEffect, useRef } from 'react';
import AnalogClock from './AnalogClock';

interface TutorialSlide {
  id: number;
  title: string;
  text: string;
  clockTime?: { hours: number; minutes: number };
  highlight?: 'hour' | 'minute' | 'both' | null;
  animation?: 'hour-move' | 'minute-move' | 'both-move' | 'count-divisions' | 'highlight-intermediate' | 'minute-progression' | null;
  showIntermediateNumbers?: boolean;
  highlightDivision?: number; // Which division to highlight (0-11, where 0 is 12)
  showSector?: 'quarter' | 'half' | 'three-quarters' | 'quarter-past' | 'half-past' | 'without-ten' | 'without-quarter' | 'five-past' | 'twenty-past' | 'twenty-five-past' | 'thirty-five-past' | 'without-five' | 'without-twenty' | null;
  showSectorFrom?: number; // Hour to start sector from (for expressions like "quarter past 4")
  sectorColor?: string; // Color for the sector
  highlightedSectors?: number[]; // Array of sector indices (0-11) to highlight, where 0=12, 1=1, etc.
}

interface ClockTutorialProps {
  onComplete: () => void;
  onBack: () => void;
}

const ClockTutorial: React.FC<ClockTutorialProps> = ({ onComplete, onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animatedTime, setAnimatedTime] = useState({ hours: 12, minutes: 0 });
  const [highlightedDivision, setHighlightedDivision] = useState<number | null>(null);
  const [showIntermediateNumbers, setShowIntermediateNumbers] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const divisionAnimationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Define tutorial slides
  const slides: TutorialSlide[] = [
    {
      id: 0,
      title: 'Что такое аналоговые часы?',
      text: 'Это аналоговые часы. На них есть две стрелки: короткая толстая стрелка - это часовая стрелка, она показывает часы. Длинная тонкая стрелка - это минутная стрелка, она показывает минуты. Циферблат разделен на 12 больших делений для часов и 60 маленьких делений для минут.',
      clockTime: { hours: 12, minutes: 0 },
      highlight: 'both',
    },
    {
      id: 1,
      title: 'Промежуточные значения на часах',
      text: 'На часах написаны только большие числа: 12, 3, 6, 9. Но между ними есть еще деления! Между 12 и 3 есть деления для 1 и 2. Между 3 и 6 есть деления для 4 и 5. Между 6 и 9 есть деления для 7 и 8. Между 9 и 12 есть деления для 10 и 11. Всего на часах 12 больших делений.',
      clockTime: { hours: 12, minutes: 0 },
      highlight: 'both',
      animation: 'highlight-intermediate',
      showIntermediateNumbers: true,
    },
    {
      id: 2,
      title: 'Часовая стрелка',
      text: 'Короткая толстая стрелка - это часовая стрелка. Она показывает, который час. Когда она указывает на число 3, это значит 3 часа. Когда на 6 - это 6 часов. Когда на 9 - это 9 часов. Когда на 12 - это 12 часов или полдень. Часовая стрелка может быть и между числами, например между 3 и 4.',
      clockTime: { hours: 3, minutes: 0 },
      highlight: 'hour',
    },
    {
      id: 3,
      title: 'Минутная стрелка и деления',
      text: 'Длинная тонкая стрелка - это минутная стрелка. Она показывает минуты. На часах 60 минут и 12 больших делений. Если разделить 60 на 12, получится 5. Это значит, что каждое большое деление равно 5 минутам для минутной стрелки. Когда минутная стрелка на 12, это 0 минут. Когда на 1 - это 5 минут. Когда на 2 - это 10 минут. Когда на 3 - это 15 минут.',
      clockTime: { hours: 12, minutes: 0 },
      highlight: 'minute',
      animation: 'count-divisions',
    },
    {
      id: 4,
      title: 'Примеры минут',
      text: 'Давай посмотрим на примеры минут. Когда минутная стрелка на 1, это 5 минут. Когда на 2 - это 10 минут. Когда на 3 - это 15 минут. Когда на 6 - это 30 минут или половина часа. Когда на 9 - это 45 минут. Каждое большое деление - это 5 минут.',
      clockTime: { hours: 12, minutes: 0 },
      highlight: 'minute',
      animation: 'minute-progression',
    },
    {
      id: 5,
      title: 'Как работают стрелки вместе',
      text: 'Когда минутная стрелка делает полный круг от 12 до 12, часовая стрелка двигается на один час вперед. Например, когда минутная стрелка проходит от 12 до 12, часовая стрелка двигается от 3 до 4. Это значит, что прошел один час. Минутная стрелка движется быстрее, чем часовая.',
      clockTime: { hours: 3, minutes: 0 },
      highlight: 'both',
      animation: 'both-move',
    },
    {
      id: 6,
      title: 'Часовая стрелка между числами',
      text: 'Часовая стрелка тоже может быть между числами. Например, если она между 3 и 4, это значит, что прошло больше 3 часов, но еще не 4 часа. Сколько именно часов прошло - показывает минутная стрелка. Если минутная стрелка на 6, это значит, что прошло 3 часа и 30 минут, то есть половина пути от 3 до 4.',
      clockTime: { hours: 3, minutes: 30 },
      highlight: 'both',
    },
    {
      id: 7,
      title: 'Примеры времени',
      text: 'Давай посмотрим на примеры. Когда часовая стрелка на 3, а минутная на 12, это 3 часа ровно. Когда часовая на 6, а минутная на 6, это 6 часов 30 минут. Когда часовая на 9, а минутная на 3, это 9 часов 15 минут. Когда часовая на 12, а минутная на 12, это 12 часов ровно.',
      clockTime: { hours: 3, minutes: 0 },
      highlight: 'both',
    },
    {
      id: 8,
      title: 'Четверть часа',
      text: '15 минут - это четверть часа. Посмотри на сектор от 12 до 3 - это четверть круга часов. Когда минутная стрелка проходит от 12 до 3, она проходит четверть всего круга.',
      clockTime: { hours: 12, minutes: 15 },
      highlight: 'minute',
      showSector: 'quarter',
    },
    {
      id: 9,
      title: 'Половина часа',
      text: '30 минут - это половина часа. Посмотри на сектор от 12 до 6 - это половина круга часов. Когда минутная стрелка проходит от 12 до 6, она проходит половину всего круга.',
      clockTime: { hours: 12, minutes: 30 },
      highlight: 'minute',
      showSector: 'half',
    },
    {
      id: 10,
      title: 'Три четверти часа',
      text: '45 минут - это три четверти часа. Посмотри на сектор от 12 до 9 - это три четверти круга часов. Когда минутная стрелка проходит от 12 до 9, она проходит три четверти всего круга.',
      clockTime: { hours: 12, minutes: 45 },
      highlight: 'minute',
      showSector: 'three-quarters',
    },
    {
      id: 11,
      title: 'Четверть пятого',
      text: 'Четверть пятого - это значит 4 часа и 15 минут. Часовая стрелка прошла четверть пути от 4 до 5, минутная стрелка на 3. Это выражение означает, что прошло четверть часа после 4 часов.',
      clockTime: { hours: 4, minutes: 15 },
      highlight: 'both',
      showSector: 'quarter-past',
      showSectorFrom: 4,
    },
    {
      id: 12,
      title: 'Половина пятого',
      text: 'Половина пятого - это значит 4 часа и 30 минут. Часовая стрелка прошла половину пути от 4 до 5, минутная стрелка на 6. Это выражение означает, что прошла половина часа после 4 часов.',
      clockTime: { hours: 4, minutes: 30 },
      highlight: 'both',
      showSector: 'half-past',
      showSectorFrom: 4,
    },
    {
      id: 13,
      title: 'Без десяти восемь',
      text: 'Без десяти восемь - это значит без 10 минут до 8 часов, то есть 7 часов и 50 минут. Часовая стрелка почти у 8, минутная стрелка на 10. Это выражение означает, что до 8 часов осталось 10 минут.',
      clockTime: { hours: 7, minutes: 50 },
      highlight: 'both',
      showSector: 'without-ten',
      showSectorFrom: 8,
    },
    {
      id: 14,
      title: 'Без четверти восемь',
      text: 'Без четверти восемь - это значит без 15 минут до 8 часов, то есть 7 часов и 45 минут. Часовая стрелка почти у 8, минутная стрелка на 9. Это выражение означает, что до 8 часов осталось четверть часа.',
      clockTime: { hours: 7, minutes: 45 },
      highlight: 'both',
      showSector: 'without-quarter',
      showSectorFrom: 8,
    },
    {
      id: 15,
      title: 'Пять минут пятого',
      text: 'Пять минут пятого - это значит 4 часа и 5 минут. Часовая стрелка немного прошла от 4, минутная стрелка на 1. Это выражение означает, что прошло 5 минут после 4 часов.',
      clockTime: { hours: 4, minutes: 5 },
      highlight: 'both',
      showSector: 'five-past',
      showSectorFrom: 4,
    },
    {
      id: 16,
      title: 'Двадцать минут пятого',
      text: 'Двадцать минут пятого - это значит 4 часа и 20 минут. Часовая стрелка прошла треть пути от 4 до 5, минутная стрелка на 4. Это выражение означает, что прошло 20 минут после 4 часов.',
      clockTime: { hours: 4, minutes: 20 },
      highlight: 'both',
      showSector: 'twenty-past',
      showSectorFrom: 4,
    },
    {
      id: 17,
      title: 'Двадцать пять минут пятого',
      text: 'Двадцать пять минут пятого - это значит 4 часа и 25 минут. Часовая стрелка прошла больше четверти пути от 4 до 5, минутная стрелка на 5. Это выражение означает, что прошло 25 минут после 4 часов.',
      clockTime: { hours: 4, minutes: 25 },
      highlight: 'both',
      showSector: 'twenty-five-past',
      showSectorFrom: 4,
    },
    {
      id: 18,
      title: 'Тридцать пять минут пятого',
      text: 'Тридцать пять минут пятого - это значит 4 часа и 35 минут. Часовая стрелка прошла больше половины пути от 4 до 5, минутная стрелка на 7. Это выражение означает, что прошло 35 минут после 4 часов.',
      clockTime: { hours: 4, minutes: 35 },
      highlight: 'both',
      showSector: 'thirty-five-past',
      showSectorFrom: 4,
    },
    {
      id: 19,
      title: 'Без двадцати восемь',
      text: 'Без двадцати восемь - это значит без 20 минут до 8 часов, то есть 7 часов и 40 минут. Часовая стрелка почти у 8, минутная стрелка на 8. Это выражение означает, что до 8 часов осталось 20 минут.',
      clockTime: { hours: 7, minutes: 40 },
      highlight: 'both',
      showSector: 'without-twenty',
      showSectorFrom: 8,
    },
    {
      id: 20,
      title: 'Без пяти восемь',
      text: 'Без пяти восемь - это значит без 5 минут до 8 часов, то есть 7 часов и 55 минут. Часовая стрелка почти у 8, минутная стрелка на 11. Это выражение означает, что до 8 часов осталось 5 минут.',
      clockTime: { hours: 7, minutes: 55 },
      highlight: 'both',
      showSector: 'without-five',
      showSectorFrom: 8,
    },
  ];

  // Speech synthesis function
  const speak = (text: string) => {
    if (!soundEnabled) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9; // Slightly slower for children
    utterance.pitch = 1.1; // Slightly higher pitch for friendliness
    
    // Speech synthesis callbacks (no state needed for now)
    utterance.onstart = () => {};
    utterance.onend = () => {};
    utterance.onerror = () => {};
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };

  // Handle slide animations
  useEffect(() => {
    // Clear any existing animations
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    if (divisionAnimationRef.current) {
      clearInterval(divisionAnimationRef.current);
      divisionAnimationRef.current = null;
    }

    const slide = slides[currentSlide];
    if (!slide) return;

    // Reset states
    setHighlightedDivision(null);
    setShowIntermediateNumbers(slide.showIntermediateNumbers || false);

    // Set initial time
    if (slide.clockTime) {
      setAnimatedTime(slide.clockTime);
    }

    // Handle highlight-intermediate animation (slide 1)
    if (slide.animation === 'highlight-intermediate') {
      let currentDivision = 0;
      divisionAnimationRef.current = setInterval(() => {
        setHighlightedDivision(currentDivision);
        currentDivision++;
        if (currentDivision >= 12) {
          if (divisionAnimationRef.current) {
            clearInterval(divisionAnimationRef.current);
            divisionAnimationRef.current = null;
          }
          // Keep showing all divisions
          setTimeout(() => {
            setHighlightedDivision(null);
          }, 2000);
        }
      }, 400);
    }

    // Handle count-divisions animation (slide 3)
    if (slide.animation === 'count-divisions') {
      let currentDivision = 0;
      divisionAnimationRef.current = setInterval(() => {
        setHighlightedDivision(currentDivision);
        const minutes = currentDivision * 5;
        setAnimatedTime({ hours: 12, minutes });
        currentDivision++;
        if (currentDivision > 3) {
          if (divisionAnimationRef.current) {
            clearInterval(divisionAnimationRef.current);
            divisionAnimationRef.current = null;
          }
          // Reset to start after showing all
          setTimeout(() => {
            setHighlightedDivision(null);
            setAnimatedTime(slide.clockTime || { hours: 12, minutes: 0 });
          }, 1500);
        }
      }, 1000);
    }

    // Handle minute-progression animation (slide 4)
    if (slide.animation === 'minute-progression') {
      const minuteValues = [0, 5, 10, 15, 30, 45];
      let currentIndex = 0;
      animationIntervalRef.current = setInterval(() => {
        setAnimatedTime({ hours: 12, minutes: minuteValues[currentIndex] });
        currentIndex++;
        if (currentIndex >= minuteValues.length) {
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
            animationIntervalRef.current = null;
          }
          // Reset to start
          setTimeout(() => {
            setAnimatedTime(slide.clockTime || { hours: 12, minutes: 0 });
          }, 1000);
        }
      }, 1500);
    }

    // Handle animation for both-move (slide 5)
    if (slide.animation === 'both-move' && slide.clockTime) {
      let currentMinutes = slide.clockTime.minutes;
      let currentHours = slide.clockTime.hours;
      const startHours = slide.clockTime.hours;

      animationIntervalRef.current = setInterval(() => {
        currentMinutes += 5;
        if (currentMinutes >= 60) {
          currentMinutes = 0;
          currentHours = (currentHours % 12) + 1;
          if (currentHours === 0) currentHours = 12;
        }
        setAnimatedTime({ hours: currentHours, minutes: currentMinutes });

        // Stop after one full hour cycle
        const nextHour = (startHours % 12) + 1;
        if (currentHours === nextHour && currentMinutes === 0) {
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
            animationIntervalRef.current = null;
          }
          // Reset to start after a short delay
          setTimeout(() => {
            setAnimatedTime(slide.clockTime!);
          }, 500);
        }
      }, 300); // Update every 300ms for smooth animation
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      if (divisionAnimationRef.current) {
        clearInterval(divisionAnimationRef.current);
        divisionAnimationRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide]);

  // Speak current slide text when slide changes
  useEffect(() => {
    const slide = slides[currentSlide];
    if (slide && soundEnabled) {
      speak(slide.text);
    }
    
    // Cleanup on unmount
    return () => {
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, soundEnabled]);

  // Handle next slide
  const handleNext = () => {
    stopSpeech();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  // Handle previous slide
  const handlePrevious = () => {
    stopSpeech();
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled) {
      stopSpeech();
    }
  };


  // Convert polar coordinates to cartesian
  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angleDeg: number
  ): { x: number; y: number } => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Describe a single sector path
  const describeSector = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ): string => {
    // Normalize angles to [0, 360)
    const normalizeAngle = (angle: number) => {
      while (angle < 0) angle += 360;
      while (angle >= 360) angle -= 360;
      return angle;
    };
    
    let normalizedStart = normalizeAngle(startAngle);
    let normalizedEnd = normalizeAngle(endAngle);
    
    // Calculate angle difference for large arc flag
    let angleDiff = normalizedEnd - normalizedStart;
    if (angleDiff < 0) angleDiff += 360;
    
    const largeArcFlag = angleDiff > 180 ? 1 : 0;
    const sweepFlag = 1; // Always clockwise
    
    const start = polarToCartesian(cx, cy, r, normalizedStart);
    const end = polarToCartesian(cx, cy, r, normalizedEnd);
    
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y} Z`;
  };


  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg to-orange-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary-700 hover:text-primary-900 transition-colors font-semibold"
          aria-label="Назад"
        >
          <span className="text-2xl">←</span>
          <span className="hidden sm:inline">Назад</span>
        </button>
        
        <div className="text-primary-700 font-semibold text-sm sm:text-base">
          Слайд {currentSlide + 1} из {slides.length}
        </div>
        
        <button
          onClick={toggleSound}
          className="flex items-center gap-2 text-primary-700 hover:text-primary-900 transition-colors p-2 rounded-lg hover:bg-primary-100"
          aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
        >
          <span className="text-2xl">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 max-w-4xl mx-auto w-full">
        {/* Title with fade animation */}
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-800 text-center transition-opacity duration-500 animate-fade-in">
          {currentSlideData.title}
        </h1>

        {/* Clock display */}
        <div className="relative transition-all duration-500 transform hover:scale-105">
          <div className="relative">
            <AnalogClock
              hours={
                currentSlideData.animation === 'both-move' || 
                currentSlideData.animation === 'count-divisions' || 
                currentSlideData.animation === 'minute-progression'
                  ? animatedTime.hours 
                  : (currentSlideData.clockTime?.hours ?? 12)
              }
              minutes={
                currentSlideData.animation === 'both-move' || 
                currentSlideData.animation === 'count-divisions' || 
                currentSlideData.animation === 'minute-progression'
                  ? animatedTime.minutes 
                  : (currentSlideData.clockTime?.minutes ?? 0)
              }
              size={280}
            />
            
            {/* Intermediate numbers overlay */}
            {showIntermediateNumbers && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={280}
                height={280}
                viewBox="0 0 280 280"
              >
                {[1, 2, 4, 5, 7, 8, 10, 11].map((num) => {
                  const angle = (num * 30 - 90) * (Math.PI / 180);
                  const center = 140;
                  const clockRadius = 280 * 0.42;
                  const textRadius = clockRadius * 0.7;
                  const x = center + Math.cos(angle) * textRadius;
                  const y = center + Math.sin(angle) * textRadius;
                  // highlightedDivision: 0=12, 1=1, 2=2, 3=3, etc.
                  const isHighlighted = highlightedDivision !== null && 
                    ((highlightedDivision === 0 && num === 12) || 
                     (highlightedDivision === num));
                  
                  return (
                    <text
                      key={num}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`font-bold transition-all duration-300 ${
                        isHighlighted ? 'fill-amber-500' : 'fill-primary-400 opacity-60'
                      }`}
                      fontSize={isHighlighted ? 20 : 16}
                    >
                      {num}
                    </text>
                  );
                })}
              </svg>
            )}

            {/* Sector overlay - single path approach */}
            {currentSlideData.showSector && (() => {
              const center = 140;
              const clockRadius = 280 * 0.42;
              const outerRadius = clockRadius * 0.98;
              const sectorColor = currentSlideData.sectorColor || '#fbbf24';
              
              // Calculate start and end angles based on sector type
              let startAngle: number;
              let endAngle: number;
              
              switch (currentSlideData.showSector) {
                case 'quarter':
                  // From 12 (0°) to 3 (90°)
                  startAngle = 0;
                  endAngle = 90;
                  break;
                case 'half':
                  // From 12 (0°) to 6 (180°)
                  startAngle = 0;
                  endAngle = 180;
                  break;
                case 'three-quarters':
                  // From 12 (0°) to 9 (270°)
                  startAngle = 0;
                  endAngle = 270;
                  break;
                case 'quarter-past':
                  // "Четверть пятого" = 4:15, сектор от 12 (0°) до позиции 3 (90°), где минутная стрелка
                  // Сектор показывает путь от начала часа (12) до позиции минутной стрелки
                  if (currentSlideData.showSectorFrom !== undefined) {
                    // Always start from 12 o'clock (0°)
                    startAngle = 0;
                    // Minute hand at 3 for 15 minutes = 3 * 30 = 90°
                    endAngle = 3 * 30; // 90°
                  } else {
                    startAngle = 0;
                    endAngle = 90;
                  }
                  break;
                case 'half-past':
                  // "Половина пятого" = 4:30, сектор от 12 (0°) до позиции 6 (180°), где минутная стрелка
                  // Сектор показывает путь от начала часа (12) до позиции минутной стрелки
                  if (currentSlideData.showSectorFrom !== undefined) {
                    // Always start from 12 o'clock (0°)
                    startAngle = 0;
                    // Minute hand at 6 for 30 minutes = 6 * 30 = 180°
                    endAngle = 6 * 30; // 180°
                  } else {
                    startAngle = 0;
                    endAngle = 180;
                  }
                  break;
                case 'without-ten':
                  // "Без десяти восемь" = 7:50, сектор от 12 (0°) до позиции 10 (300°), где минутная стрелка
                  // Сектор показывает путь от начала часа (12) до позиции минутной стрелки
                  if (currentSlideData.showSectorFrom !== undefined) {
                    // Always start from 12 o'clock (0°)
                    startAngle = 0;
                    // Minute hand at 10 for 50 minutes = 10 * 30 = 300°
                    endAngle = 10 * 30; // 300°
                  } else {
                    startAngle = 0;
                    endAngle = 300;
                  }
                  break;
                case 'without-quarter':
                  // "Без четверти восемь" = 7:45, сектор от 12 (0°) до позиции 9 (270°), где минутная стрелка
                  // Сектор показывает путь от начала часа (12) до позиции минутной стрелки
                  if (currentSlideData.showSectorFrom !== undefined) {
                    // Always start from 12 o'clock (0°)
                    startAngle = 0;
                    // Minute hand at 9 for 45 minutes = 9 * 30 = 270°
                    endAngle = 9 * 30; // 270°
                  } else {
                    startAngle = 0;
                    endAngle = 270;
                  }
                  break;
                case 'five-past':
                  // "Пять минут пятого" = 4:05, сектор от 12 (0°) до позиции 1 (30°), где минутная стрелка
                  if (currentSlideData.showSectorFrom !== undefined) {
                    startAngle = 0;
                    // Minute hand at 1 for 5 minutes = 1 * 30 = 30°
                    endAngle = 1 * 30; // 30°
                  } else {
                    startAngle = 0;
                    endAngle = 30;
                  }
                  break;
                case 'twenty-past':
                  // "Двадцать минут пятого" = 4:20, сектор от 12 (0°) до позиции 4 (120°), где минутная стрелка
                  if (currentSlideData.showSectorFrom !== undefined) {
                    startAngle = 0;
                    // Minute hand at 4 for 20 minutes = 4 * 30 = 120°
                    endAngle = 4 * 30; // 120°
                  } else {
                    startAngle = 0;
                    endAngle = 120;
                  }
                  break;
                case 'twenty-five-past':
                  // "Двадцать пять минут пятого" = 4:25, сектор от 12 (0°) до позиции 5 (150°), где минутная стрелка
                  if (currentSlideData.showSectorFrom !== undefined) {
                    startAngle = 0;
                    // Minute hand at 5 for 25 minutes = 5 * 30 = 150°
                    endAngle = 5 * 30; // 150°
                  } else {
                    startAngle = 0;
                    endAngle = 150;
                  }
                  break;
                case 'thirty-five-past':
                  // "Тридцать пять минут пятого" = 4:35, сектор от 12 (0°) до позиции 7 (210°), где минутная стрелка
                  if (currentSlideData.showSectorFrom !== undefined) {
                    startAngle = 0;
                    // Minute hand at 7 for 35 minutes = 7 * 30 = 210°
                    endAngle = 7 * 30; // 210°
                  } else {
                    startAngle = 0;
                    endAngle = 210;
                  }
                  break;
                case 'without-five':
                  // "Без пяти восемь" = 7:55, сектор от 12 (0°) до позиции 11 (330°), где минутная стрелка
                  if (currentSlideData.showSectorFrom !== undefined) {
                    startAngle = 0;
                    // Minute hand at 11 for 55 minutes = 11 * 30 = 330°
                    endAngle = 11 * 30; // 330°
                  } else {
                    startAngle = 0;
                    endAngle = 330;
                  }
                  break;
                case 'without-twenty':
                  // "Без двадцати восемь" = 7:40, сектор от 12 (0°) до позиции 8 (240°), где минутная стрелка
                  if (currentSlideData.showSectorFrom !== undefined) {
                    startAngle = 0;
                    // Minute hand at 8 for 40 minutes = 8 * 30 = 240°
                    endAngle = 8 * 30; // 240°
                  } else {
                    startAngle = 0;
                    endAngle = 240;
                  }
                  break;
                default:
                  startAngle = 0;
                  endAngle = 90;
              }
              
              const path = describeSector(center, center, outerRadius, startAngle, endAngle);
              
              return (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={280}
                  height={280}
                  viewBox="0 0 280 280"
                >
                  <path
                    d={path}
                    fill={sectorColor}
                    fillOpacity={0.3}
                    stroke={sectorColor}
                    strokeWidth={2}
                    strokeOpacity={0.6}
                    className="animate-fade-in"
                  />
                </svg>
              );
            })()}

            {/* Division highlight overlay */}
            {highlightedDivision !== null && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={280}
                height={280}
                viewBox="0 0 280 280"
              >
                {(() => {
                  const center = 140;
                  const clockRadius = 280 * 0.42;
                  // highlightedDivision: 0=12, 1=1, 2=2, etc. (each is 30 degrees)
                  const angle = (highlightedDivision * 30 - 90) * (Math.PI / 180);
                  const innerRadius = clockRadius * 0.65;
                  const outerRadius = clockRadius * 0.98;
                  
                  return (
                    <g>
                      <line
                        x1={center + Math.cos(angle) * innerRadius}
                        y1={center + Math.sin(angle) * innerRadius}
                        x2={center + Math.cos(angle) * outerRadius}
                        y2={center + Math.sin(angle) * outerRadius}
                        stroke="#f59e0b"
                        strokeWidth={8}
                        strokeLinecap="round"
                        className="animate-pulse"
                        opacity={0.8}
                      />
                      {currentSlideData.animation === 'count-divisions' && (
                        <text
                          x={center + Math.cos(angle) * (outerRadius + 25)}
                          y={center + Math.sin(angle) * (outerRadius + 25)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="font-bold fill-amber-600"
                          fontSize={20}
                        >
                          {highlightedDivision * 5} мин
                        </text>
                      )}
                    </g>
                  );
                })()}
              </svg>
            )}
            
            {/* Highlight overlay for hour hand */}
            {(currentSlideData.highlight === 'hour' || currentSlideData.highlight === 'both') && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute w-8 h-8 border-4 border-amber-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute w-6 h-6 bg-amber-400 rounded-full opacity-50"></div>
              </div>
            )}
            
            {/* Highlight overlay for minute hand */}
            {(currentSlideData.highlight === 'minute' || currentSlideData.highlight === 'both') && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute w-10 h-10 border-4 border-cyan-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute w-6 h-6 bg-cyan-400 rounded-full opacity-50"></div>
              </div>
            )}
          </div>
        </div>

        {/* Text content with fade animation */}
        <div className="max-w-2xl text-center transition-opacity duration-500">
          <p className="text-lg sm:text-xl text-primary-700 leading-relaxed">
            {currentSlideData.text}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4 w-full max-w-md">
          {currentSlide > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Назад
            </button>
          )}
          
          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isLastSlide ? (
              <>
                <span>Начать игру</span>
                <span>→</span>
              </>
            ) : (
              <>
                <span>Далее</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClockTutorial;

