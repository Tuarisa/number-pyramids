/**
 * ClockGame Component
 *
 * Two game modes:
 * - 'read': User sees clock hands, selects time using picker wheels
 * - 'set': User sees digital time, selects correct clock from multiple options
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ClockPuzzle, ClockMode } from '../logic/types';
import AnalogClock from './AnalogClock';
import TimePicker from './TimePicker';

interface ClockGameProps {
  puzzle: ClockPuzzle;
  onCorrect: () => void;
  onWrong: () => void;
  onHint: () => void;
  hintsUsed: number;
}

// Generate a random clock puzzle
export function generateClockPuzzle(): ClockPuzzle {
  const hours = Math.floor(Math.random() * 12) + 1; // 1-12
  const minutes = Math.floor(Math.random() * 12) * 5; // 0, 5, 10, ..., 55
  const mode: ClockMode = Math.random() > 0.5 ? 'read' : 'set';

  return { hours, minutes, mode };
}

const ClockGame: React.FC<ClockGameProps> = ({
  puzzle,
  onCorrect,
  onWrong,
  onHint,
  hintsUsed,
}) => {
  // For 'read' mode: user selected time
  const [selectedHours, setSelectedHours] = useState(1);
  const [selectedMinutes, setSelectedMinutes] = useState(0);

  // For 'set' mode: generate multiple clock options
  const [clockOptions, setClockOptions] = useState<Array<{ hours: number; minutes: number; isCorrect: boolean }>>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Animation state
  const [showCorrect, setShowCorrect] = useState(false);
  const [showWrong, setShowWrong] = useState(false);

  // Generate clock options for 'set' mode
  useEffect(() => {
    if (puzzle.mode === 'set') {
      const options: Array<{ hours: number; minutes: number; isCorrect: boolean }> = [];
      
      // Add correct answer
      options.push({
        hours: puzzle.hours,
        minutes: puzzle.minutes,
        isCorrect: true,
      });

      // Generate 3 wrong options (total 4 with correct one)
      const wrongOptions = 3;
      const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      
      for (let i = 0; i < wrongOptions; i++) {
        let wrongHours = puzzle.hours;
        let wrongMinutes = puzzle.minutes;
        
        // Try to generate a different time
        let attempts = 0;
        while (
          (wrongHours === puzzle.hours && wrongMinutes === puzzle.minutes) ||
          options.some(opt => opt.hours === wrongHours && opt.minutes === wrongMinutes)
        ) {
          wrongHours = Math.floor(Math.random() * 12) + 1;
          wrongMinutes = minuteOptions[Math.floor(Math.random() * minuteOptions.length)];
          attempts++;
          if (attempts > 20) break; // Prevent infinite loop
        }
        
        options.push({
          hours: wrongHours,
          minutes: wrongMinutes,
          isCorrect: false,
        });
      }

      // Shuffle options
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      setClockOptions(options);
      setSelectedOption(null);
    }
  }, [puzzle]);

  // Reset state when puzzle changes
  useEffect(() => {
    setSelectedHours(1);
    setSelectedMinutes(0);
    setSelectedOption(null);
    setShowCorrect(false);
    setShowWrong(false);
  }, [puzzle]);

  // Handle time change from picker for 'read' mode
  const handleTimeChange = useCallback((hours: number, minutes: number) => {
    setSelectedHours(hours);
    setSelectedMinutes(minutes);
  }, []);

  // Handle clock option selection for 'set' mode
  const handleOptionSelect = useCallback((index: number) => {
    if (showCorrect || showWrong) return;
    setSelectedOption(index);
  }, [showCorrect, showWrong]);

  // Check answer
  const checkAnswer = useCallback(() => {
    let isCorrect = false;

    if (puzzle.mode === 'read') {
      // User selected time, check against puzzle
      isCorrect =
        selectedHours === puzzle.hours &&
        selectedMinutes === puzzle.minutes;
    } else {
      // User selected clock option
      if (selectedOption === null) return;
      isCorrect = clockOptions[selectedOption]?.isCorrect || false;
    }

    if (isCorrect) {
      setShowCorrect(true);
      setTimeout(() => {
        onCorrect();
      }, 800);
    } else {
      setShowWrong(true);
      setTimeout(() => {
        setShowWrong(false);
      }, 500);
      onWrong();
    }
  }, [puzzle, selectedHours, selectedMinutes, selectedOption, clockOptions, onCorrect, onWrong]);

  // Handle hint
  const handleHint = useCallback(() => {
    if (puzzle.mode === 'read') {
      // Set hours correctly
      setSelectedHours(puzzle.hours);
    } else {
      // Highlight correct option (find its index)
      const correctIndex = clockOptions.findIndex(opt => opt.isCorrect);
      if (correctIndex !== -1) {
        setSelectedOption(correctIndex);
      }
    }
    onHint();
  }, [puzzle, clockOptions, onHint]);

  // Format time for display
  const formatTime = (h: number, m: number) => {
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mode instruction */}
      <div className="text-primary-600 text-lg sm:text-xl font-bold text-center">
        {puzzle.mode === 'read'
          ? 'Который час?'
          : `Покажи ${formatTime(puzzle.hours, puzzle.minutes)}`}
      </div>

      {/* Clock display */}
      <div className={`transition-transform duration-200 ${showWrong ? 'animate-shake' : ''}`}>
        {puzzle.mode === 'read' ? (
          // Show puzzle clock, user reads it
          <AnalogClock
            hours={puzzle.hours}
            minutes={puzzle.minutes}
            size={260}
            showAnswer={showCorrect}
          />
        ) : (
          // Show digital time, user selects from options
          <>
            <div className="text-5xl sm:text-6xl font-bold text-primary-700 mb-6 text-center">
              {formatTime(puzzle.hours, puzzle.minutes)}
            </div>
            <div className="text-lg text-primary-600 mb-4 text-center">
              Выбери правильные часы:
            </div>
            {/* Clock options grid */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              {clockOptions.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrectOption = option.isCorrect;
                const showAsCorrect = showCorrect && isCorrectOption;
                const showAsWrong = showWrong && isSelected && !isCorrectOption;

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={showCorrect || showWrong}
                    className={`
                      relative p-2 rounded-xl transition-all duration-200
                      ${isSelected
                        ? showAsCorrect
                          ? 'ring-4 ring-green-500 bg-green-50'
                          : showAsWrong
                          ? 'ring-4 ring-red-500 bg-red-50'
                          : 'ring-4 ring-primary-500 bg-primary-50'
                        : 'ring-2 ring-primary-200 bg-white hover:ring-primary-300'
                      }
                      ${showCorrect || showWrong ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                    `}
                  >
                    <AnalogClock
                      hours={option.hours}
                      minutes={option.minutes}
                      size={120}
                      showAnswer={showAsCorrect}
                    />
                    {isSelected && !showCorrect && !showWrong && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Time picker for 'read' mode */}
      {puzzle.mode === 'read' && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg text-primary-600 mb-2">
            Выбери время:
          </div>
          <TimePicker
            hours={selectedHours}
            minutes={selectedMinutes}
            onTimeChange={handleTimeChange}
            disabled={showCorrect || showWrong}
          />
          <div className="text-xl font-bold text-primary-700 mt-2">
            {formatTime(selectedHours, selectedMinutes)}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleHint}
          disabled={hintsUsed >= 2}
          className={`
            px-6 py-3 rounded-xl font-bold text-lg
            transition-all duration-200
            ${hintsUsed >= 2
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95'}
          `}
        >
          Подсказка {hintsUsed > 0 ? `(${hintsUsed}/2)` : ''}
        </button>

        <button
          onClick={checkAnswer}
          disabled={showCorrect || (puzzle.mode === 'set' && selectedOption === null)}
          className={`
            px-8 py-3 rounded-xl font-bold text-lg text-white
            transition-all duration-200
            ${showCorrect
              ? 'bg-green-500'
              : 'bg-primary-500 hover:bg-primary-600 active:scale-95'}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {showCorrect ? 'Верно!' : 'Проверить'}
        </button>
      </div>
    </div>
  );
};

export default ClockGame;
