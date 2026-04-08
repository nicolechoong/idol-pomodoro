# Idol Pomodoro 🎤

A Pomodoro timer PWA with an idol-trainee pet that practices while you work!

## Features

- 🎵 Cute idol trainee pet that practices alongside you
- ⏱️ Configurable Pomodoro cycles (25 min work / 5 min break)
- 📊 Visual progress tracking with timer ring and progress bar
- 💬 Encouraging dialogue from your pet after each session
- 😢 Pet reacts when you leave during breaks
- 🔔 Break-ending notifications to bring you back
- 📱 Full PWA: installable, works offline
- 💾 Local-first persistence with IndexedDB

## Tech Stack

- **Frontend**: React + Vite
- **PWA**: Workbox (via vite-plugin-pwa)
- **Storage**: IndexedDB (Dexie.js)
- **Hosting**: GitHub Pages

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

Push to `main` branch triggers automatic deployment via GitHub Actions.

Manual deploy:
```bash
npm run deploy
```
