# 🎯 Fantasy Fleece Finder v2

AI-powered dynasty fantasy football trade analyzer. Click-to-add trades, see opponent draft picks, browse free agents.

## What's New in V2

- **Click-to-Add Trades** - Click players directly from rosters instead of searching
- **Draft Pick Tracking** - See exactly who owns what picks (including traded picks)
- **Free Agent Browser** - See all available waiver players with values
- **Cleaner UI** - Mobile-friendly, simpler navigation

## Quick Start

```bash
cd fantasy-fleece-finder

# Install
npm install

# Run web version
npm run dev
# Opens at http://localhost:5173

# OR run desktop version
npm run electron:dev
```

## Setup

1. **Add API Key** (Settings) - Get from console.anthropic.com
2. **Enter Sleeper Username** - Import your dynasty league
3. **Select Your Team** - Pick which roster is yours
4. **Start Trading** - Click players to build trades

## Features

| Feature | Description |
|---------|-------------|
| **Trade Builder** | Click any player from either roster to add to trade. Switch between players and picks with tabs. |
| **Fleece Finder** | Select opponent → see their full roster + picks → AI finds unfair trades |
| **Free Agents** | Browse all available waiver players by position with search |
| **Draft Picks** | Full tracking of who owns each pick, including trades |

## How Values Work

- Player values based on dynasty consensus rankings (Jan 2026)
- Draft picks valued by year, round, and estimated team strength
- Trade analyzer shows value difference and win/loss verdict

## Tech Stack

- React 18 + Vite
- Sleeper API
- Claude AI (Anthropic)
- Electron (desktop)

## File Structure

```
src/
├── components/
│   ├── Dashboard.jsx      # Home screen with roster overview
│   ├── ImportLeague.jsx   # Sleeper connection flow
│   ├── TradeBuilder.jsx   # Click-to-add trade interface
│   ├── FleeceFinder.jsx   # Opponent analysis + AI
│   ├── FreeAgents.jsx     # Waiver wire browser
│   └── Settings.jsx       # API key + data management
├── services/
│   ├── sleeper.js         # Sleeper API + draft pick tracking
│   ├── values.js          # Dynasty trade values
│   └── claude.js          # AI integration
└── styles/
    └── global.css         # Clean dark theme
```

---

Built for dynasty degenerates 🏈
