/**
 * ClockGame Component
 *
 * Two game modes:
 * - 'read': User sees clock hands, enters time digitally
 * - 'set': User sees digital time, sets clock hands
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ClockPuzzle, ClockMode } from '../logic/types';
import AnalogClock from './AnalogClock';

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
  // For 'read' mode: user input state
  const [inputHours, setInputHours] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');

  // For 'set' mode: user-set clock hands
  const [setHours, setSetHours] = useState(12);
  const [setMinutes, setSetMinutes] = useState(0);

  // Animation state
  const [showCorrect, setShowCorrect] = useState(false);
  const [showWrong, setShowWrong] = useState(false);

  // Reset state when puzzle changes
  useEffect(() => {
    setInputHours('');
    setInputMinutes('');
    setSetHours(12);
    setSetMinutes(0);
    setShowCorrect(false);
    setShowWrong(false);
  }, [puzzle]);

  // Handle time input change for 'read' mode
  const handleHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setInputHours(val);
  }, []);

  const handleMinutesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setInputMinutes(val);
  }, []);

  // Handle clock hand change for 'set' mode
  const handleTimeChange = useCallback((hours: number, minutes: number) => {
    setSetHours(hours);
    setSetMinutes(minutes);
  }, []);

  // Check answer
  const checkAnswer = useCallback(() => {
    let isCorrect = false;

    if (puzzle.mode === 'read') {
      // User entered time, check against puzzle
      const enteredHours = parseInt(inputHours, 10);
      const enteredMinutes = parseInt(inputMinutes, 10) || 0;

      isCorrect =
        enteredHours === puzzle.hours &&
        enteredMinutes === puzzle.minutes;
    } else {
      // User set clock hands, check against puzzle
      isCorrect =
        setHours === puzzle.hours &&
        setMinutes === puzzle.minutes;
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
  }, [puzzle, inputHours, inputMinutes, setHours, setMinutes, onCorrect, onWrong]);

  // Handle hint
  const handleHint = useCallback(() => {
    if (puzzle.mode === 'read') {
      // Show the hours
      setInputHours(puzzle.hours.toString());
    } else {
      // Set hours correctly
      setSetHours(puzzle.hours);
    }
    onHint();
  }, [puzzle, onHint]);

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
          // Show digital time, user sets clock
          <>
            <div className="text-5xl sm:text-6xl font-bold text-primary-700 mb-4 text-center">
              {formatTime(puzzle.hours, puzzle.minutes)}
            </div>
            <AnalogClock
              hours={setHours}
              minutes={setMinutes}
              interactive={true}
              onTimeChange={handleTimeChange}
              size={260}
              showAnswer={showCorrect}
            />
          </>
        )}
      </div>

      {/* Input area for 'read' mode */}
      {puzzle.mode === 'read' && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={inputHours}
            onChange={handleHoursChange}
            placeholder="Ч"
            className={`
              w-16 h-16 text-center text-2xl font-bold
              rounded-xl border-4
              ${showWrong ? 'border-red-400 bg-red-50' : 'border-primary-300 bg-white'}
              focus:outline-none focus:border-primary-500
              transition-colors
            `}
            maxLength={2}
          />
          <span className="text-3xl font-bold text-primary-500">:</span>
          <input
            type="text"
            inputMode="numeric"
            value={inputMinutes}
            onChange={handleMinutesChange}
            placeholder="ММ"
            className={`
              w-20 h-16 text-center text-2xl font-bold
              rounded-xl border-4
              ${showWrong ? 'border-red-400 bg-red-50' : 'border-primary-300 bg-white'}
              focus:outline-none focus:border-primary-500
              transition-colors
            `}
            maxLength={2}
          />
        </div>
      )}

      {/* Current setting display for 'set' mode */}
      {puzzle.mode === 'set' && (
        <div className="text-2xl font-bold text-primary-600">
          Твой ответ: {formatTime(setHours, setMinutes)}
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
          disabled={showCorrect || (puzzle.mode === 'read' && !inputHours)}
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
