# Fantasy Fleece Finder - Master Implementation Plan

## Overview
Transform Fantasy Fleece Finder into the ultimate dynasty fantasy football tool by implementing features from competitors while solving their pain points.

---

## PHASE 1: Core Infrastructure Fixes
**Priority: CRITICAL | Timeline: Foundation**

### 1.1 Add vite.config.js
- Create proper Vite configuration with optimizations
- Add build aliases for cleaner imports
- Configure chunk splitting for faster loads

### 1.2 Error Boundaries & Handling
- Add React Error Boundary component
- Wrap all API calls with proper try/catch
- Add retry logic with exponential backoff
- User-friendly error messages (not technical jargon)
- Toast notifications for errors

### 1.3 Debounce AI Calls
- Prevent API spam when switching opponents
- Add 1-second debounce to trade suggestions
- Show "waiting..." indicator during debounce
- Cancel pending requests when user changes selection

### 1.4 Loading States
- Add skeleton loaders for all data fetches
- Shimmer effects while loading
- Progressive content reveal

---

## PHASE 2: Live Values Integration (KTC API)
**Priority: HIGH | Solves: "Stale values" complaint**

### 2.1 KTC API Service
```javascript
// New file: src/services/ktc.js
- fetchPlayerValues() - Get all current values
- fetchPlayerValue(playerId) - Single player
- fetchValueHistory(playerId) - 30/60/90 day trends
- getTradeDatabase(playerName) - Real trades
```

### 2.2 Value Source Toggle
- Settings option: KTC / FantasyCalc / Custom
- Store preference in localStorage
- Fallback to static values if API fails

### 2.3 Auto-Refresh Values
- Background refresh every 4 hours
- "Last updated" timestamp display
- Manual refresh button

### 2.4 League-Specific Adjustments
- Superflex: QB values × 1.8
- TE Premium: TE values × 1.3
- PPR vs Half-PPR vs Standard multipliers
- League size adjustments (10/12/14 team)

---

## PHASE 3: League Intelligence
**Priority: HIGH | Solves: "Generic values" complaint**

### 3.1 Superflex Detection
```javascript
// In sleeper.js
const isSuperFlex = league.roster_positions?.filter(p =>
  p === 'SUPER_FLEX' || p === 'QB'
).length >= 2;
```

### 3.2 Contender/Rebuilder Scoring
```javascript
// New algorithm
function getTeamStatus(roster, leagueSize) {
  const factors = {
    record: (wins - losses) / gamesPlayed,
    rosterAge: avgAge < 26 ? 'young' : avgAge > 28 ? 'old' : 'prime',
    starterValue: sum of top 9 players,
    depthValue: sum of bench players,
    pickCapital: value of future picks
  };

  return {
    status: 'CONTENDER' | 'REBUILDER' | 'MIDDLE',
    score: 0-100,
    confidence: 'HIGH' | 'MEDIUM' | 'LOW',
    reasoning: string
  };
}
```

### 3.3 Team Needs Analysis (Enhanced)
- Current analyzeMyNeeds() is basic
- Add: Age curve analysis
- Add: Bye week conflicts
- Add: Handcuff coverage
- Add: Positional scarcity

### 3.4 League Power Rankings
- Rank all teams by projected points
- Show each team's competitive window
- Identify trade partners by situation

---

## PHASE 4: Trade Database
**Priority: HIGH | Killer feature from KTC**

### 4.1 Trade Lookup Component
```jsx
// New component: TradeDatabase.jsx
<TradeDatabase>
  <SearchBar placeholder="Search player..." />
  <PlayerResults>
    <PlayerCard>
      <RecentTrades>
        - Trade 1: CeeDee for 2026 1st + DK Metcalf
        - Trade 2: CeeDee + 2027 2nd for Ja'Marr Chase
      </RecentTrades>
      <AverageReturn>~8500 value</AverageReturn>
      <PriceRange>Low: 7200 | High: 9800</PriceRange>
    </PlayerCard>
  </PlayerResults>
</TradeDatabase>
```

### 4.2 Data Sources
- Primary: KTC trade database API
- Secondary: Sleeper transaction history across leagues
- Tertiary: User-submitted trades

### 4.3 Trade Context
- Show league settings for each trade
- Show team records (contender trading to rebuilder?)
- Show date of trade (recent = more relevant)

---

## PHASE 5: Value Trend Graphs
**Priority: MEDIUM | Visual feedback users love**

### 5.1 Player Value Chart Component
```jsx
// Using recharts or chart.js
<ValueTrendChart playerId={id}>
  <Line data={last90Days} />
  <Annotations>
    - Injury markers
    - Trade markers
    - News events
  </Annotations>
</ValueTrendChart>
```

### 5.2 Trend Indicators
- Rising/Falling/Stable badges
- % change over 7/30/90 days
- Volatility score (how stable is value?)

### 5.3 Compare Mode
- Side-by-side two players
- Overlay value trends
- "Would you rather" quick comparison

---

## PHASE 6: Season Simulator
**Priority: HIGH | Dynasty Daddy's best feature**

### 6.1 Monte Carlo Engine
```javascript
// New file: src/services/simulator.js
function simulateSeason(league, iterations = 10000) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    // Simulate each week
    // Random variance based on player projections
    // Track wins/losses
    // Determine playoff seeding
    // Simulate playoffs
  }

  return {
    playoffOdds: percentage,
    championshipOdds: percentage,
    expectedWins: number,
    bestCase: number,
    worstCase: number
  };
}
```

### 6.2 Projection Sources
- Use FantasyPros or similar for base projections
- Adjust for injuries
- Factor in strength of schedule

### 6.3 Visualization
- Playoff odds by team (bar chart)
- Your team's distribution (bell curve)
- Week-by-week win probability

---

## PHASE 7: Trade Finder
**Priority: HIGH | Auto-discover opportunities**

### 7.1 Algorithm
```javascript
function findAllTrades(myRoster, allRosters, settings) {
  const opportunities = [];

  allRosters.forEach(opponent => {
    // Find complementary needs
    const myNeeds = analyzeNeeds(myRoster);
    const theirNeeds = analyzeNeeds(opponent);

    // Match my surplus to their needs
    // Match their surplus to my needs
    // Calculate fair value exchanges
    // Score by likelihood of acceptance
  });

  return opportunities.sort((a, b) => b.score - a.score);
}
```

### 7.2 Filters
- Position targets
- Value range
- Exclude certain players
- Only show "slam dunk" trades

### 7.3 One-Click Proposal
- Generate trade directly
- Copy to clipboard
- Track sent proposals

---

## PHASE 8: Mock Draft Simulator
**Priority: MEDIUM | Practice makes perfect**

### 8.1 Draft Engine
```javascript
// New file: src/services/mockDraft.js
class MockDraft {
  constructor(settings) {
    this.picks = generatePickOrder(settings);
    this.available = getAllRookies();
    this.aiPersonalities = generateAI();
  }

  userPick(player) { /* ... */ }
  simulateAIPick(team) { /* ... */ }
  getRecommendations() { /* ... */ }
}
```

### 8.2 AI Opponents
- Different draft strategies (BPA, positional need, etc.)
- Realistic reach/value picks
- Trade up/down simulation

### 8.3 Draft Grades
- Grade each pick in real-time
- Compare to ADP
- Post-draft analysis

---

## PHASE 9: AI Enhancements
**Priority: HIGH | Your differentiator**

### 9.1 Negotiation Coach
```javascript
// New Claude prompt
"You are a trade negotiation expert. Given this trade and the opponent's
team situation, write a persuasive message to send them. Focus on:
- Why this helps THEM
- Urgency factors
- Appeal to their team identity (contender/rebuilder)"
```

### 9.2 Counter-Offer Generator
- They rejected? AI suggests alternatives
- "What if we added X?"
- "What if we removed Y?"

### 9.3 "What Would It Take"
- Enter player you want
- AI figures out minimum viable offer
- Multiple package options

### 9.4 Trade Regret Calculator
- Input a trade from last year
- Show what would have happened
- "You won/lost this trade by X value"

### 9.5 League Personality Profiles
```javascript
// Track owner tendencies
const ownerProfile = {
  tradesPerYear: 12,
  preferredPositions: ['RB', 'WR'],
  avgValueDiff: -200, // slightly overpays
  respondsTo: ['rebuilding appeals', 'injury concerns'],
  avoids: ['aging players', 'handcuffs']
};
```

---

## PHASE 10: UX Polish
**Priority: MEDIUM | Differentiate from ugly competitors**

### 10.1 Export to Clipboard
- One-click copy trade proposal
- Formatted for Sleeper chat
- Include value breakdown

### 10.2 Progressive Disclosure
- Simple mode by default
- "Advanced" toggle for power users
- Remember preference

### 10.3 Keyboard Shortcuts
- `/` to search
- `t` for new trade
- `esc` to close modals
- Arrow keys to navigate

### 10.4 Toast Notifications
- Success/error feedback
- Non-blocking alerts
- Auto-dismiss

### 10.5 Dark Mode Toggle
- Respect system preference
- Manual override
- Smooth transitions

### 10.6 Offline Mode
- Cache league data
- Queue trades for when online
- Clear "offline" indicator

---

## File Structure After Implementation

```
src/
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   ├── Toast.jsx
│   │   └── ProgressiveDisclosure.jsx
│   ├── trade/
│   │   ├── TradeBuilder.jsx (refactored)
│   │   ├── TradeCard.jsx
│   │   ├── TradeAssetPicker.jsx
│   │   └── TradeValueBar.jsx
│   ├── analysis/
│   │   ├── FleeceFinder.jsx (refactored)
│   │   ├── TradeFinder.jsx (NEW)
│   │   ├── TradeDatabase.jsx (NEW)
│   │   └── SeasonSimulator.jsx (NEW)
│   ├── draft/
│   │   ├── MockDraft.jsx (NEW)
│   │   ├── DraftBoard.jsx (NEW)
│   │   └── DraftGrades.jsx (NEW)
│   ├── charts/
│   │   ├── ValueTrendChart.jsx (NEW)
│   │   ├── PlayoffOddsChart.jsx (NEW)
│   │   └── CompareChart.jsx (NEW)
│   └── settings/
│       ├── Settings.jsx (enhanced)
│       └── LeagueSettings.jsx (NEW)
├── services/
│   ├── sleeper.js (enhanced)
│   ├── claude.js (enhanced)
│   ├── ktc.js (NEW)
│   ├── simulator.js (NEW)
│   ├── tradeFinder.js (NEW)
│   └── mockDraft.js (NEW)
├── hooks/
│   ├── useDebounce.js (NEW)
│   ├── useLocalStorage.js (NEW)
│   └── useOffline.js (NEW)
├── context/
│   ├── LeagueContext.jsx (enhanced)
│   ├── ThemeContext.jsx (NEW)
│   └── ToastContext.jsx (NEW)
└── utils/
    ├── values.js (enhanced)
    ├── calculations.js (NEW)
    └── formatters.js (NEW)
```

---

## Implementation Order

### Sprint 1: Foundation
1. vite.config.js
2. Error boundaries
3. Debouncing
4. Loading skeletons

### Sprint 2: Live Data
5. KTC API integration
6. Superflex detection
7. League settings detection
8. Value source toggle

### Sprint 3: Intelligence
9. Contender/Rebuilder scoring
10. Enhanced team needs
11. Trade database lookup
12. Value trend graphs

### Sprint 4: Advanced Features
13. Trade Finder
14. Season Simulator
15. AI negotiation coach
16. Counter-offer generator

### Sprint 5: Polish
17. Mock Draft Simulator
18. Export to clipboard
19. Dark mode
20. Keyboard shortcuts
21. Final testing & build

---

## Success Metrics
- [ ] Zero API errors crash the app
- [ ] Values update automatically
- [ ] Can identify contender vs rebuilder instantly
- [ ] Trade suggestions actually make sense
- [ ] Users can find trades in < 30 seconds
- [ ] Works offline with cached data
- [ ] Mobile experience is smooth
- [ ] Build size < 5MB
