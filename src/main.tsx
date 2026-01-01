/**
 * Application Entry Point
 *
 * - Mounts the React app
 * - Registers the service worker for PWA functionality
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register PWA service worker (handled by vite-plugin-pwa)
// The plugin auto-generates and registers the SW

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
