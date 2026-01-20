// Claude AI Service
import { getPlayerValue } from './values';

const API_URL = 'https://api.anthropic.com/v1/messages';
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 1; // January

function getSeasonContext() {
  // Determine if we're in offseason (Feb-Aug) or in-season (Sep-Jan)
  const isOffseason = CURRENT_MONTH >= 2 && CURRENT_MONTH <= 8;
  return isOffseason
    ? 'It is currently the OFFSEASON (dynasty trade season). Injuries from last season should be IGNORED - assume all players will be healthy for next season. Focus on long-term value and roster construction.'
    : 'It is currently the NFL season. Consider current injuries and immediate production needs.';
}

async function callClaude(apiKey, system, prompt, maxTokens = 2500) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'API request failed');
  }

  const data = await res.json();
  return data.content[0].text;
}

function analyzeMyNeeds(roster) {
  const byPos = { QB: [], RB: [], WR: [], TE: [] };

  roster.players.forEach(p => {
    if (byPos[p.position]) {
      byPos[p.position].push({
        name: p.name,
        age: p.age || 25,
        value: p.value || 0
      });
    }
  });

  const needs = [];
  const strengths = [];

  // Analyze QB
  const qbs = byPos.QB;
  const youngQBs = qbs.filter(p => p.age < 28);
  if (qbs.length < 2 || youngQBs.length === 0) {
    needs.push('QB - Need youth/depth');
  } else if (qbs.length >= 2 && youngQBs.length >= 1) {
    strengths.push('QB - Solid');
  }

  // Analyze RB
  const rbs = byPos.RB;
  const youngRBs = rbs.filter(p => p.age < 27);
  if (rbs.length < 4) {
    needs.push('RB - Need depth');
  } else if (youngRBs.length < 2) {
    needs.push('RB - Need youth (aging core)');
  } else {
    strengths.push('RB - Strong');
  }

  // Analyze WR
  const wrs = byPos.WR;
  const youngWRs = wrs.filter(p => p.age < 27);
  if (wrs.length < 5) {
    needs.push('WR - Need depth');
  } else if (youngWRs.length < 3) {
    needs.push('WR - Need youth');
  } else {
    strengths.push('WR - Strong');
  }

  // Analyze TE
  const tes = byPos.TE;
  const startableTEs = tes.filter(p => p.age < 30);
  if (tes.length < 2 || startableTEs.length < 1) {
    needs.push('TE - Major need');
  } else {
    strengths.push('TE - Adequate');
  }

  return { needs, strengths, byPos };
}

export async function analyzeTradeAI(apiKey, { myRoster, theirRoster, iGive, iGet }) {
  const system = `You are an expert dynasty fantasy football analyst. Be direct, confident, and use fantasy football language naturally. Give specific, actionable advice.

IMPORTANT CONTEXT:
- Current year is ${CURRENT_YEAR}
- ${getSeasonContext()}
- Only reference draft picks from ${CURRENT_YEAR} and later (${CURRENT_YEAR}, ${CURRENT_YEAR + 1}, ${CURRENT_YEAR + 2})
- 2025 picks do NOT exist anymore - that draft already happened`;

  const prompt = `TRADE ANALYSIS

I GIVE:
${formatAssets(iGive)}

I RECEIVE:
${formatAssets(iGet)}

MY ROSTER:
${formatRoster(myRoster)}

THEIR ROSTER (${theirRoster?.name || 'Opponent'}):
${formatRoster(theirRoster)}

Analyze this trade:
1. Who wins and by how much?
2. How does this affect my roster construction?
3. Final verdict: Accept, Counter, or Reject?
4. If I should counter, what should I ask for?`;

  return callClaude(apiKey, system, prompt);
}

export async function suggestBestTrades(apiKey, { myRoster, theirRoster }) {
  const myAnalysis = analyzeMyNeeds(myRoster);
  const theirAnalysis = analyzeMyNeeds(theirRoster);

  const isRebuilding = theirRoster.losses > theirRoster.wins + 2;
  const isContending = theirRoster.wins > theirRoster.losses + 2;
  const theirStatus = isRebuilding ? 'REBUILDING - wants young players and picks' : isContending ? 'CONTENDER - wants win-now pieces' : 'MID-TIER';

  const system = `You are a dynasty fantasy football trade expert.

CRITICAL RULES:
1. Current year is ${CURRENT_YEAR} - ONLY reference ${CURRENT_YEAR}, ${CURRENT_YEAR + 1}, or ${CURRENT_YEAR + 2} draft picks. NEVER mention 2025 picks.
2. ${getSeasonContext()}
3. IGNORE all injury tags - assume everyone will be healthy for next season.
4. Focus on improving MY team's weaknesses while trading from MY strengths.
5. Consider age - dynasty is about building for the future.

MY TEAM NEEDS: ${myAnalysis.needs.join(', ') || 'No major needs'}
MY TEAM STRENGTHS: ${myAnalysis.strengths.join(', ') || 'Balanced'}
THEIR TEAM NEEDS: ${theirAnalysis.needs.join(', ') || 'No major needs'}
THEIR TEAM STRENGTHS: ${theirAnalysis.strengths.join(', ') || 'Balanced'}`;

  const prompt = `FIND THE BEST TRADES WITH ${theirRoster.name}

OPPONENT STATUS: ${theirStatus} (${theirRoster.wins}-${theirRoster.losses} record)

MY ROSTER (with my needs/strengths above):
${formatRosterNoInjury(myRoster)}

THEIR ROSTER:
${formatRosterNoInjury(theirRoster)}

Find 4 REALISTIC trade proposals that:
1. **ADDRESS MY TEAM'S ACTUAL NEEDS** - I need: ${myAnalysis.needs.join(', ') || 'depth/youth'}
2. **USE MY EXCESS/STRENGTHS** to get what I need
3. The opponent would actually accept based on THEIR needs: ${theirAnalysis.needs.join(', ') || 'depth/youth'}
4. Make sense for BOTH teams' roster construction

For each trade, provide:

**TRADE #[number]** - [One-line description]
- I GIVE: [exact players/picks - ONLY ${CURRENT_YEAR}+ picks]
- I GET: [exact players/picks]
- WHY THIS HELPS ME: [How it addresses MY specific roster needs]
- WHY THEY ACCEPT: [How it addresses THEIR specific roster needs]
- ACCEPTANCE LIKELIHOOD: [High/Medium/Low]

REMEMBER:
- NO 2025 picks - only ${CURRENT_YEAR}, ${CURRENT_YEAR + 1}, ${CURRENT_YEAR + 2}
- IGNORE injuries - it's offseason
- Focus on roster construction, not desperation moves
- Think about age curves and long-term value`;

  return callClaude(apiKey, system, prompt, 3500);
}

export async function findFleeces(apiKey, { myRoster, theirRoster }) {
  const system = `You are a dynasty fantasy football trade shark. Your job is to find unfair trades that significantly benefit the user.

CRITICAL RULES:
1. Current year is ${CURRENT_YEAR} - ONLY reference ${CURRENT_YEAR}+ draft picks. NEVER mention 2025.
2. ${getSeasonContext()}
3. IGNORE injury tags - assume all players healthy for next season.`;

  const prompt = `Find trades to fleece ${theirRoster.name}

MY ROSTER:
${formatRosterNoInjury(myRoster)}

THEIR ROSTER:
${formatRosterNoInjury(theirRoster)}

Give me 3-4 trade proposals from realistic to aggressive:

For each trade:
- What I give (only ${CURRENT_YEAR}+ picks)
- What I get
- Why it's a fleece
- How to pitch it

Start realistic, end with a swing-for-the-fences fleece attempt.

REMEMBER: No 2025 picks exist. Ignore injuries - it's offseason.`;

  return callClaude(apiKey, system, prompt);
}

export async function findLeagueFleeces(apiKey, { myRoster, allRosters }) {
  const myAnalysis = analyzeMyNeeds(myRoster);

  const system = `You are a dynasty fantasy football trade shark. Scan the entire league to find the BEST fleece opportunities.

CRITICAL RULES:
1. Current year is ${CURRENT_YEAR} - ONLY reference ${CURRENT_YEAR}+ draft picks
2. ${getSeasonContext()}
3. IGNORE all injury tags - assume everyone healthy
4. Focus on MY NEEDS: ${myAnalysis.needs.join(', ') || 'depth/youth'}`;

  const opponents = allRosters.filter(r => r.rosterId !== myRoster.rosterId);

  const leagueSummary = opponents.map(r => {
    const record = `${r.wins}-${r.losses}`;
    const isRebuilding = r.losses > r.wins + 2;
    const isContending = r.wins > r.losses + 2;
    const status = isRebuilding ? '[REBUILDING]' : isContending ? '[CONTENDER]' : '';
    return `${r.name} (${record}) ${status}\n${formatRosterBriefNoInjury(r)}`;
  }).join('\n\n');

  const prompt = `LEAGUE-WIDE FLEECE SCAN

MY ROSTER (${myRoster.name}):
${formatRosterNoInjury(myRoster)}

MY TEAM NEEDS: ${myAnalysis.needs.join(', ') || 'General depth'}

ALL OPPONENTS:
${leagueSummary}

Find the TOP 5 BEST fleece opportunities across the ENTIRE league that ADDRESS MY NEEDS.

For each fleece:
1. TARGET TEAM and why they're vulnerable
2. TRADE: What I give -> What I get (ONLY ${CURRENT_YEAR}+ picks)
3. HOW THIS HELPS MY ROSTER: Address my specific needs
4. WHY IT WORKS: Their motivation to accept
5. FLEECE RATING: 1-10 (10 = highway robbery)

REMEMBER: No 2025 picks. Ignore injuries. Focus on my roster needs.`;

  return callClaude(apiKey, system, prompt, 4000);
}

export async function suggestImprovements(apiKey, { myRoster, allRosters }) {
  const myAnalysis = analyzeMyNeeds(myRoster);

  const system = `You are an expert dynasty fantasy football analyst and trade strategist.

CRITICAL RULES:
1. Current year is ${CURRENT_YEAR} - ONLY reference ${CURRENT_YEAR}+ draft picks
2. ${getSeasonContext()}
3. IGNORE all injury tags
4. Focus on the user's ACTUAL roster needs: ${myAnalysis.needs.join(', ') || 'General improvement'}`;

  const opponents = allRosters.filter(r => r.rosterId !== myRoster.rosterId);

  const leagueSummary = opponents.map(r => {
    return `${r.name} (${r.wins}-${r.losses}):\n${formatRosterBriefNoInjury(r)}`;
  }).join('\n\n');

  const prompt = `TEAM IMPROVEMENT ANALYSIS

MY ROSTER (${myRoster.name}, ${myRoster.wins}-${myRoster.losses}):
${formatRosterNoInjury(myRoster)}

IDENTIFIED NEEDS: ${myAnalysis.needs.join(', ') || 'General depth'}
IDENTIFIED STRENGTHS: ${myAnalysis.strengths.join(', ') || 'Balanced'}

LEAGUE ROSTERS:
${leagueSummary}

Analyze my team and find realistic trades to IMPROVE MY ROSTER:

1. ROSTER ASSESSMENT
   - Am I a contender or rebuilder?
   - Position group grades (A-F)
   - Biggest weaknesses to address (consider my identified needs above)

2. TOP 3 REALISTIC TRADES TO MAKE
   For each trade:
   - Target player and which team owns them
   - What I should offer (ONLY ${CURRENT_YEAR}+ picks)
   - How this specifically addresses my roster weakness
   - Why they might accept

3. PLAYERS TO SELL
   - Who on my roster should I move and why
   - What return to expect

4. PRIORITY TARGETS
   - 3-5 players in this league I should be pursuing
   - Estimated cost for each

REMEMBER: No 2025 picks exist. Ignore injuries - offseason. Focus on my specific needs.`;

  return callClaude(apiKey, system, prompt, 4000);
}

export async function analyzeRoster(apiKey, roster, leagueSettings) {
  const system = `You are an expert dynasty fantasy football analyst.

CRITICAL: Current year is ${CURRENT_YEAR}. ${getSeasonContext()} Ignore injury tags.`;

  const prompt = `ROSTER ANALYSIS for ${roster.name}

${formatRosterNoInjury(roster)}

Record: ${roster.wins}-${roster.losses}

Provide:
1. Position group grades (A-F)
2. Top 3 strengths
3. Top 3 weaknesses
4. Contender or rebuilder?
5. Players to target in trades (to address weaknesses)
6. Players to sell (from positions of strength)
7. 2-3 specific moves to make this offseason`;

  return callClaude(apiKey, system, prompt);
}

function formatAssets(assets) {
  if (!assets?.length) return 'None';
  return assets.map(a => {
    if (a.type === 'pick') {
      return `${a.year} Round ${a.round} (${a.originalOwnerName || 'Own'}) - ${a.value} value`;
    }
    return `${a.name} (${a.position}, ${a.team}) - ${a.value} value`;
  }).join('\n');
}

function formatRoster(roster) {
  if (!roster?.players) return 'No roster data';

  const byPos = { QB: [], RB: [], WR: [], TE: [] };

  roster.players.forEach(p => {
    if (byPos[p.position]) {
      const inj = p.injuryStatus ? ` [${p.injuryStatus}]` : '';
      const age = p.age ? `, ${p.age}yo` : '';
      byPos[p.position].push(`${p.name}${age}${inj}`);
    }
  });

  let out = '';
  Object.entries(byPos).forEach(([pos, players]) => {
    if (players.length) out += `${pos}: ${players.join(', ')}\n`;
  });

  if (roster.picks?.length) {
    const picks = roster.picks.filter(p => p.year >= CURRENT_YEAR).slice(0, 8).map(p =>
      `${p.year} ${p.round}${p.round === 1 ? 'st' : p.round === 2 ? 'nd' : p.round === 3 ? 'rd' : 'th'}${p.isOwnPick ? '' : ` (${p.originalOwnerName})`}`
    );
    if (picks.length) out += `Picks: ${picks.join(', ')}`;
  }

  return out;
}

function formatRosterNoInjury(roster) {
  if (!roster?.players) return 'No roster data';

  const byPos = { QB: [], RB: [], WR: [], TE: [] };

  roster.players.forEach(p => {
    if (byPos[p.position]) {
      const age = p.age ? `, ${p.age}yo` : '';
      byPos[p.position].push(`${p.name}${age}`);
    }
  });

  let out = '';
  Object.entries(byPos).forEach(([pos, players]) => {
    if (players.length) out += `${pos}: ${players.join(', ')}\n`;
  });

  if (roster.picks?.length) {
    const picks = roster.picks.filter(p => p.year >= CURRENT_YEAR).slice(0, 8).map(p =>
      `${p.year} ${p.round}${p.round === 1 ? 'st' : p.round === 2 ? 'nd' : p.round === 3 ? 'rd' : 'th'}${p.isOwnPick ? '' : ` (${p.originalOwnerName})`}`
    );
    if (picks.length) out += `Picks: ${picks.join(', ')}`;
  }

  return out;
}

function formatRosterBrief(roster) {
  if (!roster?.players) return 'No roster data';

  const byPos = { QB: [], RB: [], WR: [], TE: [] };

  roster.players.forEach(p => {
    if (byPos[p.position]) {
      byPos[p.position].push(p.name);
    }
  });

  let out = '';
  Object.entries(byPos).forEach(([pos, players]) => {
    if (players.length) out += `${pos}: ${players.slice(0, 4).join(', ')}${players.length > 4 ? '...' : ''}\n`;
  });

  return out.trim();
}

function formatRosterBriefNoInjury(roster) {
  return formatRosterBrief(roster); // Same since brief doesn't include injuries anyway
}

export async function generateNegotiationPitch(apiKey, { trade, opponentProfile }) {
  const { iGive, iGet, opponentRoster, myRoster } = trade;

  const isContender = opponentProfile?.isContender || false;
  const isRebuilding = opponentProfile?.isRebuilding || false;
  const teamStatus = isContender ? 'CONTENDER - looking to win now' : isRebuilding ? 'REBUILDER - focused on future assets' : 'MIDDLE TEAM';

  const system = `You are a dynasty fantasy football negotiation expert. Your job is to write persuasive trade messages that focus on how the trade benefits the OPPONENT.

CRITICAL RULES:
1. Current year is ${CURRENT_YEAR} - ONLY reference ${CURRENT_YEAR}+ draft picks
2. ${getSeasonContext()}
3. Focus on THEIR needs, not yours
4. Be persuasive but not pushy
5. Create urgency without being desperate`;

  const prompt = `Write a persuasive trade message for this offer:

TRADE PROPOSAL:
They GIVE:
${formatAssets(iGet)}

They RECEIVE:
${formatAssets(iGive)}

OPPONENT'S ROSTER (${opponentRoster?.name || 'Opponent'}):
${formatRosterNoInjury(opponentRoster)}

OPPONENT'S STATUS: ${teamStatus}
${opponentProfile?.record ? `Record: ${opponentProfile.record}` : ''}

MY ROSTER (for context only):
${formatRosterNoInjury(myRoster)}

Write a compelling message (3-4 sentences) that:
1. Explains why THIS TRADE HELPS THEM specifically
2. Addresses their roster construction needs
3. Creates mild urgency (league dynamics, upcoming draft, etc.)
4. Sounds friendly and collaborative, not salesy

TONE: Professional but friendly. Avoid exclamation points and emojis.

Return ONLY the message text, no preamble.`;

  return callClaude(apiKey, system, prompt, 1000);
}

export async function generateCounterOffer(apiKey, { originalTrade, rejectionReason, myRoster, theirRoster }) {
  const { iGive, iGet } = originalTrade;

  const system = `You are a dynasty fantasy football trade negotiation expert. When a trade gets rejected, you find creative alternatives.

CRITICAL RULES:
1. Current year is ${CURRENT_YEAR} - ONLY reference ${CURRENT_YEAR}+ draft picks
2. ${getSeasonContext()}
3. Keep the core concept similar but adjust values
4. Consider the rejection reason carefully`;

  const prompt = `REJECTED TRADE:
I GAVE:
${formatAssets(iGive)}

I ASKED FOR:
${formatAssets(iGet)}

REJECTION REASON: ${rejectionReason || 'Not specified'}

MY ROSTER:
${formatRosterNoInjury(myRoster)}

THEIR ROSTER (${theirRoster?.name || 'Opponent'}):
${formatRosterNoInjury(theirRoster)}

Suggest 3 COUNTER OFFERS that might get accepted:

For each counter offer, provide:
**COUNTER OFFER #[number]** - [Brief description]
- I GIVE: [exact players/picks]
- I GET: [exact players/picks]
- CHANGES FROM ORIGINAL: [What's different]
- WHY THIS WORKS: [Why they might accept now]
- LIKELIHOOD: [Low/Medium/High]

Options should range from:
1. Small adjustment (add a pick or change a player)
2. Medium shift (swap a player or add more value)
3. Different angle (target different position or use different assets)

REMEMBER: No 2025 picks. Only ${CURRENT_YEAR}+ picks.`;

  return callClaude(apiKey, system, prompt, 2500);
}

export async function whatWouldItTake(apiKey, { targetPlayer, myRoster, theirRoster }) {
  const playerValue = getPlayerValue(targetPlayer);

  const system = `You are a dynasty fantasy football trade expert. Analyze rosters to find fair packages for a target player.

CRITICAL RULES:
1. Current year is ${CURRENT_YEAR} - ONLY reference ${CURRENT_YEAR}+ draft picks
2. ${getSeasonContext()}
3. Provide multiple realistic package options
4. Consider roster construction for both teams`;

  const prompt = `TARGET PLAYER: ${targetPlayer.name} (${targetPlayer.position}, estimated value: ${playerValue})

CURRENT OWNER'S ROSTER (${theirRoster?.name || 'Owner'}):
${formatRosterNoInjury(theirRoster)}

MY ROSTER:
${formatRosterNoInjury(myRoster)}

What would it take to acquire ${targetPlayer.name}?

Provide 3 PACKAGE OPTIONS:

**OPTION 1: THE LOWBALL** (80-90% of value)
- What I'd offer: [exact players/picks]
- Total value: [estimate]
- Why it might work: [situation where they accept]
- Acceptance chance: [Low/Medium]

**OPTION 2: FAIR VALUE** (95-105% of value)
- What I'd offer: [exact players/picks]
- Total value: [estimate]
- Why it should work: [fair deal reasoning]
- Acceptance chance: [Medium/High]

**OPTION 3: THE OVERPAY** (110-120% of value)
- What I'd offer: [exact players/picks]
- Total value: [estimate]
- Why they can't refuse: [why this closes the deal]
- Acceptance chance: [High]

For each option, ensure:
- Packages use MY available assets
- Values are close to ${playerValue} for target
- Consider both teams' roster needs
- Only ${CURRENT_YEAR}+ picks

REMEMBER: No 2025 picks exist. Ignore injuries - offseason.`;

  return callClaude(apiKey, system, prompt, 2500);
}

export async function calculateTradeRegret(apiKey, { historicalTrade, currentValues }) {
  const { date, side1, side2, side1Owner, side2Owner } = historicalTrade;
  const { side1Current, side2Current } = currentValues;

  const originalVal1 = side1.reduce((s, x) => s + x.originalValue, 0);
  const originalVal2 = side2.reduce((s, x) => s + x.originalValue, 0);
  const currentVal1 = side1Current.reduce((s, x) => s + x.currentValue, 0);
  const currentVal2 = side2Current.reduce((s, x) => s + x.currentValue, 0);

  const system = `You are a dynasty fantasy football analyst specializing in trade analysis and retrospectives.

CRITICAL RULES:
1. Current year is ${CURRENT_YEAR}
2. Be honest about who won/lost
3. Explain WHY values changed (performance, age, injuries)
4. Consider timing and context`;

  const prompt = `TRADE REGRET ANALYSIS

TRADE DATE: ${date}

ORIGINAL TRADE:
${side1Owner} GAVE (${originalVal1} value then):
${side1.map(x => `- ${x.name}: ${x.originalValue} value`).join('\n')}

${side1Owner} RECEIVED (${originalVal2} value then):
${side2.map(x => `- ${x.name}: ${x.originalValue} value`).join('\n')}

CURRENT VALUES:
What ${side1Owner} gave is now worth: ${currentVal1}
${side1Current.map(x => `- ${x.name}: ${x.currentValue} value (was ${x.originalValue})`).join('\n')}

What ${side1Owner} received is now worth: ${currentVal2}
${side2Current.map(x => `- ${x.name}: ${x.currentValue} value (was ${x.originalValue})`).join('\n')}

VALUE CHANGE:
- Original difference: ${originalVal2 - originalVal1} (${((originalVal2 / originalVal1 - 1) * 100).toFixed(1)}%)
- Current difference: ${currentVal2 - currentVal1} (${((currentVal2 / currentVal1 - 1) * 100).toFixed(1)}%)
- Net change: ${(currentVal2 - currentVal1) - (originalVal2 - originalVal1)}

Analyze this trade:
1. **VERDICT**: Who won the trade overall? By how much?
2. **BIGGEST WINNER**: Which asset gained the most value?
3. **BIGGEST LOSER**: Which asset lost the most value?
4. **WHY**: Explain the key factors (age, performance, injuries, etc.)
5. **HINDSIGHT**: What should have been done differently?
6. **GRADE**: Rate the trade A-F for ${side1Owner}

Be specific and analytical. This is about learning from past decisions.`;

  return callClaude(apiKey, system, prompt, 2000);
}

export function analyzeOwnerTendencies(trades, ownerId) {
  if (!trades || trades.length === 0) {
    return {
      tradesPerYear: 0,
      preferredPositions: [],
      avgValueDiff: 0,
      patterns: []
    };
  }

  const ownerTrades = trades.filter(t =>
    t.side1OwnerId === ownerId || t.side2OwnerId === ownerId
  );

  if (ownerTrades.length === 0) {
    return {
      tradesPerYear: 0,
      preferredPositions: [],
      avgValueDiff: 0,
      patterns: []
    };
  }

  // Calculate trades per year
  const years = new Set(ownerTrades.map(t => new Date(t.date).getFullYear()));
  const tradesPerYear = ownerTrades.length / Math.max(years.size, 1);

  // Find preferred positions
  const positionCounts = {};
  ownerTrades.forEach(trade => {
    const side = trade.side1OwnerId === ownerId ? trade.side1 : trade.side2;
    side.forEach(asset => {
      if (asset.position) {
        positionCounts[asset.position] = (positionCounts[asset.position] || 0) + 1;
      }
    });
  });

  const preferredPositions = Object.entries(positionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pos]) => pos);

  // Calculate average value differential
  let totalDiff = 0;
  ownerTrades.forEach(trade => {
    const isGiver = trade.side1OwnerId === ownerId;
    const gave = isGiver ? trade.side1Value || 0 : trade.side2Value || 0;
    const got = isGiver ? trade.side2Value || 0 : trade.side1Value || 0;
    totalDiff += (got - gave);
  });
  const avgValueDiff = totalDiff / ownerTrades.length;

  // Identify patterns
  const patterns = [];

  if (tradesPerYear >= 10) {
    patterns.push('Very active trader');
  } else if (tradesPerYear >= 5) {
    patterns.push('Active trader');
  } else if (tradesPerYear < 2) {
    patterns.push('Rarely trades');
  }

  if (avgValueDiff > 500) {
    patterns.push('Usually wins trades');
  } else if (avgValueDiff < -500) {
    patterns.push('Often loses trades');
  } else {
    patterns.push('Makes fair trades');
  }

  const pickTrades = ownerTrades.filter(t =>
    [...(t.side1 || []), ...(t.side2 || [])].some(a => a.type === 'pick')
  );
  const pickRate = pickTrades.length / ownerTrades.length;

  if (pickRate > 0.6) {
    patterns.push('Loves draft picks');
  } else if (pickRate < 0.3) {
    patterns.push('Prefers players over picks');
  }

  return {
    tradesPerYear: Math.round(tradesPerYear * 10) / 10,
    preferredPositions,
    avgValueDiff: Math.round(avgValueDiff),
    patterns,
    totalTrades: ownerTrades.length
  };
}

export default {
  analyzeTradeAI,
  suggestBestTrades,
  findFleeces,
  findLeagueFleeces,
  suggestImprovements,
  analyzeRoster,
  generateNegotiationPitch,
  generateCounterOffer,
  whatWouldItTake,
  calculateTradeRegret,
  analyzeOwnerTendencies
};
