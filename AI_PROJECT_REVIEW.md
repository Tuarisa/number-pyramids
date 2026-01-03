# Number Pyramids Trainer - AI Agent Project Review

## Project Overview

**Number Pyramids Trainer** is a Progressive Web App (PWA) designed as an educational math trainer for children. The application teaches mathematical concepts through interactive puzzle games with a gamification system (stars, streaks, achievements).

**Live URL**: Deployed as a PWA, installable on mobile devices

**Primary Language**: Russian (UI and all text content)

---

## Tech Stack

### Core Technologies
- **React 18.3** - UI framework with functional components and hooks
- **TypeScript** - Full type safety throughout the codebase
- **Vite 5.4** - Build tool and dev server
- **TailwindCSS 3.4** - Utility-first CSS framework

### PWA Features
- **vite-plugin-pwa** - Service worker generation and PWA manifest
- **Workbox** - Caching strategies for offline functionality
- Installable on iOS/Android home screens
- Offline-capable after initial load

### Project Structure
```
src/
├── components/          # React components
│   ├── AnalogClock.tsx     # SVG analog clock (Level 4)
│   ├── ClockGame.tsx       # Clock time trainer game (Level 4)
│   ├── TimePicker.tsx      # iOS-style time picker wheels (Level 4)
│   ├── PyramidView.tsx     # Pyramid grid renderer (Levels 1-3)
│   ├── TokenBank.tsx       # Draggable number tokens
│   ├── DragOverlay.tsx     # Touch/mouse drag handling
│   ├── Controls.tsx        # Hint and new puzzle buttons
│   ├── Header.tsx          # Game screen header
│   ├── LevelSelector.tsx   # Level selection cards
│   ├── ProgressPanel.tsx   # Stars and statistics display
│   ├── ResultModal.tsx     # Puzzle completion modal
│   ├── AchievementsModal.tsx # Achievements gallery
│   ├── Toast.tsx           # Notification toasts
│   └── InstallPrompt.tsx   # PWA install banner
├── logic/               # Business logic
│   ├── types.ts            # TypeScript types and constants
│   ├── pyramids.ts         # Puzzle generation algorithms
│   ├── validation.ts       # Answer validation logic
│   ├── progress.ts         # Star calculation and progress updates
│   └── storage.ts          # LocalStorage persistence
├── App.tsx              # Main application component
├── main.tsx             # React entry point
└── index.css            # Tailwind imports and custom styles
```

---

## Game Levels

### Level 1: Line Equations
- **Concept**: Simple addition equations (A + B = C)
- **Layout**: Single row of 3 circles
- **Mechanics**:
  - 1-2 numbers are hidden
  - Player places tokens to complete the equation
  - Any valid solution is accepted (not just the original)
- **Validation**: Deferred until all cells filled, then checks if equation holds

### Level 2: 3-Row Pyramids
- **Concept**: Each cell equals the sum of two cells below it
- **Layout**: Triangle with 3 rows (3-2-1 circles)
- **Mechanics**: Fill in hidden cells using pyramid rules
- **Validation**: Immediate per-cell validation

### Level 3: 4-Row Pyramids
- **Concept**: Same as Level 2, but larger
- **Layout**: Triangle with 4 rows (4-3-2-1 circles)
- **Mechanics**: More complex puzzles with more hidden cells

### Level 4: Analog Clock Time Reading
- **Concept**: Learn to read analog clocks
- **Two Modes**:
  1. **Read Mode**: See clock hands → select time using iOS-style picker wheels
  2. **Set Mode**: See digital time → select correct clock from multiple options (2x2 grid)
- **Features**:
  - Clock face shows only 12, 3, 6, 9 (main numbers)
  - Tick marks for all hour and 5-minute positions
  - Distinct hour hand (short, thick, dark) and minute hand (long, thin, lighter)
  - Times use 5-minute intervals (0, 5, 10, ..., 55)
  - **Read Mode**: TimePicker component with scrollable wheels for hours (1-12) and minutes (0-55)
  - **Set Mode**: 4-5 clock options displayed in grid, user taps to select correct one
  - Mobile-optimized interface (no text input, no drag interactions)

---

## Gamification System

### Stars
- **Base**: 3 stars for solving a puzzle
- **Penalties**:
  - -1 star per hint used
  - -1 star per wrong attempt
- **Minimum**: 1 star (never zero)
- **Streak Bonus**: +1 star for every 5 consecutive perfect solves (3 stars with no penalties)

### Streaks
- **Current Streak**: Consecutive puzzles solved with 3 stars
- **Best Streak**: Highest streak achieved per level
- Displayed in header during gameplay

### Achievements
Unlocked based on milestones:
- `first_solve` - First puzzle solved
- `ten_stars` - Collect 10 stars
- `fifty_stars` - Collect 50 stars
- `hundred_stars` - Collect 100 stars
- `level1_master` - Solve 20 Level 1 puzzles
- `level2_master` - Solve 20 Level 2 puzzles
- `level3_master` - Solve 20 Level 3 puzzles
- `streak_5` - Get a streak of 5
- `streak_10` - Get a streak of 10
- `clock_beginner` - Solve 10 clock puzzles
- `clock_master` - Solve 30 clock puzzles

---

## Key Implementation Details

### Drag and Drop System
- Custom implementation (no external library)
- Works with both touch and mouse events
- `DragOverlay` component tracks pointer position
- `getDropTargetAtPosition()` finds drop targets via DOM queries
- Tokens can be tapped to select, then tap cell to place

### Puzzle Generation (Levels 1-3)
- **Algorithm**: Generate valid pyramid from bottom up
- **Constraints**: All values within `[minNumber, maxNumber]` range
- **Hiding Strategy**: Randomly hide cells while ensuring solvability
- **Solvability Check**: Uses propagation algorithm to verify unique solution

### Clock Puzzle Generation (Level 4)
- Random hour (1-12) and minute (0-55 in 5-min steps)
- Random mode ('read' or 'set')
- Hour hand position accounts for minute progression (e.g., 3:30 has hour hand between 3 and 4)
- **Set Mode**: Generates 4-5 clock options (1 correct + 3-4 wrong), shuffled randomly

### Validation Logic
- **Level 1**: Validates entire equation after all cells filled
  - Accepts ANY valid solution, not just the original
  - Uses `isLineEquationValid()` function
- **Levels 2-3**: Immediate per-cell validation
  - Each cell must equal sum of two cells below
  - Uses `isValueCorrect()` function
- **Level 4**: Exact match for time (hours and minutes)
  - **Read Mode**: Compares selected hours/minutes from TimePicker with puzzle time
  - **Set Mode**: Checks if selected clock option has `isCorrect: true` flag

### State Persistence
- Uses `localStorage` for all progress data
- Automatically saves after each puzzle
- Survives app restarts and reinstalls
- Key: `numberPyramidsProgress`

### Undo Feature (Level 1 Only)
- User-placed cells highlighted with amber background
- Clicking a user-placed cell removes the value
- Token is returned to the bank
- Tracked via `placedValues` Map in state

---

## Configuration Constants

### Level Configs (in `types.ts`)
```typescript
LEVEL_CONFIGS = {
  1: { numRows: 1, minNumber: 1, maxNumber: 10, ... },
  2: { numRows: 3, minNumber: 0, maxNumber: 15, ... },
  3: { numRows: 4, minNumber: 0, maxNumber: 20, ... },
}
LEVEL4_INFO = { id: 4, name: 'Уровень 4: Часы', ... }
```

### Default Progress Structure
```typescript
DEFAULT_PROGRESS = {
  totalStars: 0,
  totalPuzzlesSolved: 0,
  unlockedAchievements: [],
  levelStats: {
    1: { solved: 0, stars: 0, currentStreak: 0, bestStreak: 0 },
    2: { ... },
    3: { ... },
    4: { ... },
  }
}
```

---

## Known Design Decisions

1. **Zeros are valid** in Levels 2-3 (user confirmed this is intentional)
2. **Token marking bug fix**: When placing a token with duplicate values (e.g., two "5"s), only ONE token is marked as used, not all matching tokens
3. **Hint delay**: 1.5 seconds after hint is applied before showing result modal, so user can see what was placed
4. **Level 1 equation flexibility**: Any valid solution is accepted, not just the generated one (e.g., if equation was 2+3=5, user can place 1+4=5)

---

## Version History

- **1.0.0** - Initial release with Levels 1-3
- **1.1.0** - Bug fixes (token marking, hint delay, undo for Level 1)
- **1.2.0** - Added Level 4 (Analog Clock Time Reading)
- **1.3.0** - Improved Level 4 UX:
  - **Read Mode**: Replaced text inputs with iOS-style picker wheels (TimePicker component)
  - **Set Mode**: Replaced drag-to-set hands with multiple choice selection (2x2 grid of clock options)
  - Better mobile experience, no text input or drag interactions required

---

## Future Enhancement Ideas

1. **Level 5**: Subtraction pyramids (top - bottom = middle)
2. **Level 6**: Multiplication tables trainer
3. **Difficulty progression**: Harder puzzles after solving many
4. **Sound effects**: Audio feedback for correct/wrong answers
5. **Parent dashboard**: Track child's progress over time
6. **Multiple profiles**: Support multiple children on one device

---

## Development Commands

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Important Files for AI Agents

When making changes, these are the key files to understand:

| File | Purpose |
|------|---------|
| `src/logic/types.ts` | All TypeScript types, level configs, achievements |
| `src/logic/pyramids.ts` | Puzzle generation for Levels 1-3 |
| `src/components/ClockGame.tsx` | Level 4 game logic and generation |
| `src/components/TimePicker.tsx` | iOS-style time picker wheels for Level 4 read mode |
| `src/App.tsx` | Main state management and game flow |
| `src/logic/progress.ts` | Star calculation and progress updates |
| `src/logic/validation.ts` | Answer checking logic |

---

*Last updated: January 2026 (v1.3.0 - Level 4 UX improvements)*
*Reviewed by: Claude AI Agent*
