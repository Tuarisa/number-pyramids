# Number Pyramids Trainer (Числовые пирамиды)

A PWA math trainer game for children ages 6-7, built with React + TypeScript + Vite + TailwindCSS.

## Features

- **Three difficulty levels:**
  - Level 1: Line pyramids (numbers 0-10)
  - Level 2: Small pyramids (3 rows, numbers 0-20)
  - Level 3: Large pyramids (4 rows, numbers 0-20)

- **Interactive gameplay:**
  - Drag-and-drop number tokens
  - Tap-to-select for easier mobile use
  - Visual feedback (animations for correct/wrong answers)

- **Progress tracking:**
  - Stars earned for solving puzzles
  - Per-level statistics
  - Achievement system

- **PWA support:**
  - Offline-ready after first load
  - Installable on home screen
  - Works on mobile and desktop

## How to Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── PyramidView.tsx  # Renders pyramids
│   ├── TokenBank.tsx    # Draggable number tokens
│   ├── LevelSelector.tsx
│   ├── ProgressPanel.tsx
│   ├── AchievementsModal.tsx
│   ├── Controls.tsx
│   ├── Header.tsx
│   ├── ResultModal.tsx
│   ├── Toast.tsx
│   └── InstallPrompt.tsx
├── logic/               # Game logic
│   ├── types.ts         # TypeScript interfaces
│   ├── pyramids.ts      # Puzzle generation
│   ├── validation.ts    # Answer validation
│   ├── progress.ts      # Rewards & achievements
│   └── storage.ts       # localStorage wrapper
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Tailwind CSS
```

## Customization

### Number ranges
Edit `src/logic/types.ts` → `LEVEL_CONFIGS`:
```typescript
1: {
  minNumber: 0,
  maxNumber: 10,  // Change max number for Level 1
  // ...
}
```

### Empty circles count
Edit `src/logic/types.ts` → `LEVEL_CONFIGS`:
```typescript
minEmpty: 1,   // Minimum empty circles
maxEmpty: 2,   // Maximum empty circles
```

### Distractor tokens
Edit `src/logic/types.ts` → `LEVEL_CONFIGS`:
```typescript
minDistractors: 1,  // Min extra wrong numbers
maxDistractors: 3,  // Max extra wrong numbers
```

### Reward stars
Edit `src/logic/progress.ts`:
```typescript
const PERFECT_REWARD = 3;     // Stars for perfect solve
const IMPERFECT_REWARD = 1;   // Stars with hints/mistakes
```

### Colors and fonts
Edit `tailwind.config.js` → `theme.extend.colors.game`:
```javascript
game: {
  bg: '#fef3c7',       // Background color
  circle: '#ffffff',   // Circle background
  border: '#6366f1',   // Circle border
  // ...
}
```

## PWA Icons

Replace placeholder icons in `public/`:
- `pwa-192x192.png` - 192x192 app icon
- `pwa-512x512.png` - 512x512 app icon
- `apple-touch-icon.png` - 180x180 iOS icon
- `favicon.ico` - Browser favicon

## Deployment

Build output is in `dist/` folder, ready for static hosting:
- Vercel: Just connect your repository
- Netlify: Build command `npm run build`, publish `dist`
- Any static host: Upload contents of `dist/`

## Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- vite-plugin-pwa (Workbox)

## License

MIT
