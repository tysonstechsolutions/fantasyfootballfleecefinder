// Claude AI Service

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

export default { analyzeTradeAI, suggestBestTrades, findFleeces, findLeagueFleeces, suggestImprovements, analyzeRoster };
