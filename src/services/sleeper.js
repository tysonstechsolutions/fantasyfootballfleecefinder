// Sleeper API Service - V2 with full draft pick tracking and free agents

const BASE = 'https://api.sleeper.app/v1';

// Cache for players
let playersCache = null;

export async function getUser(username) {
  const res = await fetch(`${BASE}/user/${username}`);
  if (!res.ok) throw new Error('User not found');
  return res.json();
}

export async function getUserLeagues(userId, season = '2025') {
  const res = await fetch(`${BASE}/user/${userId}/leagues/nfl/${season}`);
  if (!res.ok) throw new Error('Failed to fetch leagues');
  return res.json();
}

export async function getLeague(leagueId) {
  const res = await fetch(`${BASE}/league/${leagueId}`);
  if (!res.ok) throw new Error('League not found');
  return res.json();
}

export async function getRosters(leagueId) {
  const res = await fetch(`${BASE}/league/${leagueId}/rosters`);
  if (!res.ok) throw new Error('Failed to fetch rosters');
  return res.json();
}

export async function getUsers(leagueId) {
  const res = await fetch(`${BASE}/league/${leagueId}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getTradedPicks(leagueId) {
  const res = await fetch(`${BASE}/league/${leagueId}/traded_picks`);
  if (!res.ok) throw new Error('Failed to fetch traded picks');
  return res.json();
}

export async function getDrafts(leagueId) {
  const res = await fetch(`${BASE}/league/${leagueId}/drafts`);
  if (!res.ok) throw new Error('Failed to fetch drafts');
  return res.json();
}

export async function getTransactions(leagueId, week) {
  const res = await fetch(`${BASE}/league/${leagueId}/transactions/${week}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function getAllTrades(leagueId) {
  const weeks = [];
  for (let w = 1; w <= 18; w++) weeks.push(w);

  const allTransactions = await Promise.all(
    weeks.map(w => getTransactions(leagueId, w).catch(() => []))
  );

  const trades = allTransactions
    .flat()
    .filter(t => t.type === 'trade')
    .sort((a, b) => b.created - a.created);

  return trades;
}

export async function getPlayers() {
  if (playersCache) return playersCache;

  const cached = localStorage.getItem('sleeper_players');
  const cachedTime = localStorage.getItem('sleeper_players_time');
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < ONE_DAY) {
    playersCache = JSON.parse(cached);
    return playersCache;
  }

  const res = await fetch(`${BASE}/players/nfl`);
  if (!res.ok) throw new Error('Failed to fetch players');

  playersCache = await res.json();

  try {
    localStorage.setItem('sleeper_players', JSON.stringify(playersCache));
    localStorage.setItem('sleeper_players_time', Date.now().toString());
  } catch (e) {
    console.warn('Cache storage failed:', e);
  }

  return playersCache;
}

export async function getFullLeagueData(leagueId) {
  const [league, rosters, users, players, tradedPicks] = await Promise.all([
    getLeague(leagueId),
    getRosters(leagueId),
    getUsers(leagueId),
    getPlayers(),
    getTradedPicks(leagueId)
  ]);

  const userMap = {};
  users.forEach(u => { userMap[u.user_id] = u; });

  const rosteredIds = new Set();
  rosters.forEach(r => {
    (r.players || []).forEach(id => rosteredIds.add(id));
  });

  const currentYear = new Date().getFullYear();
  const pickYears = [currentYear, currentYear + 1, currentYear + 2];
  const rounds = [1, 2, 3, 4];

  const pickOwnership = {};

  rosters.forEach(r => {
    pickYears.forEach(year => {
      rounds.forEach(round => {
        const key = `${r.roster_id}-${year}-${round}`;
        pickOwnership[key] = r.roster_id;
      });
    });
  });

  tradedPicks.forEach(pick => {
    const key = `${pick.roster_id}-${pick.season}-${pick.round}`;
    pickOwnership[key] = pick.owner_id;
  });

  const completeRosters = rosters.map(roster => {
    const owner = userMap[roster.owner_id];

    const rosterPlayers = (roster.players || []).map(pid => {
      const p = players[pid];
      if (!p) return null;
      return {
        id: pid,
        name: `${p.first_name} ${p.last_name}`,
        firstName: p.first_name,
        lastName: p.last_name,
        position: p.position || 'UNK',
        team: p.team || 'FA',
        age: p.age,
        yearsExp: p.years_exp,
        injuryStatus: p.injury_status,
        number: p.number,
        searchRank: p.search_rank
      };
    }).filter(Boolean);

    const ownedPicks = [];
    Object.entries(pickOwnership).forEach(([key, ownerId]) => {
      if (ownerId === roster.roster_id) {
        const [origRosterId, year, round] = key.split('-');
        const origOwner = rosters.find(r => r.roster_id === parseInt(origRosterId));
        const origOwnerUser = origOwner ? userMap[origOwner.owner_id] : null;

        ownedPicks.push({
          year: parseInt(year),
          round: parseInt(round),
          originalOwnerRosterId: parseInt(origRosterId),
          originalOwnerName: origOwnerUser?.display_name || origOwnerUser?.username || `Team ${origRosterId}`,
          isOwnPick: parseInt(origRosterId) === roster.roster_id
        });
      }
    });

    ownedPicks.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.round - b.round;
    });

    return {
      rosterId: roster.roster_id,
      ownerId: roster.owner_id,
      name: owner?.display_name || owner?.username || `Team ${roster.roster_id}`,
      avatar: owner?.avatar,
      players: rosterPlayers,
      starters: roster.starters || [],
      taxi: roster.taxi || [],
      reserve: roster.reserve || [],
      picks: ownedPicks,
      wins: roster.settings?.wins || 0,
      losses: roster.settings?.losses || 0,
      fpts: roster.settings?.fpts || 0
    };
  });

  const relevantPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  const freeAgents = [];

  Object.entries(players).forEach(([pid, p]) => {
    if (rosteredIds.has(pid)) return;
    if (!relevantPositions.includes(p.position)) return;
    if (!p.team) return;
    if (p.search_rank > 500) return;

    freeAgents.push({
      id: pid,
      name: `${p.first_name} ${p.last_name}`,
      firstName: p.first_name,
      lastName: p.last_name,
      position: p.position,
      team: p.team,
      age: p.age,
      yearsExp: p.years_exp,
      injuryStatus: p.injury_status,
      searchRank: p.search_rank
    });
  });

  freeAgents.sort((a, b) => (a.searchRank || 9999) - (b.searchRank || 9999));

  return {
    league: {
      id: league.league_id,
      name: league.name,
      season: league.season,
      totalRosters: league.total_rosters,
      rosterPositions: league.roster_positions,
      scoringSettings: league.scoring_settings,
      settings: league.settings
    },
    rosters: completeRosters,
    freeAgents: freeAgents.slice(0, 200),
    allPlayers: players
  };
}

export function detectLeagueSettings(league) {
  const rosterPositions = league.rosterPositions || league.roster_positions || [];
  const scoringSettings = league.scoringSettings || league.scoring_settings || {};
  const settings = league.settings || {};

  // Detect SuperFlex
  const hasSuperFlex = rosterPositions.includes('SUPER_FLEX');
  const qbCount = rosterPositions.filter(pos => pos === 'QB').length;
  const isSuperFlex = hasSuperFlex || qbCount >= 2;

  // Detect TE Premium
  const tePremiumBonus = scoringSettings.rec_te_bonus || scoringSettings.bonus_rec_te || 0;
  const isTEPremium = tePremiumBonus > 0;

  // Detect scoring type
  const recPoints = scoringSettings.rec || 0;
  let scoringType = 'standard';
  if (recPoints >= 0.9) scoringType = 'ppr';
  else if (recPoints >= 0.4) scoringType = 'half';

  // League size and roster size
  const leagueSize = league.totalRosters || league.total_rosters || 12;
  const rosterSize = rosterPositions.length || 0;

  return {
    isSuperFlex,
    isTEPremium,
    scoringType,
    leagueSize,
    rosterSize,
    rosterPositions,
    scoringSettings
  };
}

export default {
  getUser,
  getUserLeagues,
  getFullLeagueData,
  getPlayers,
  getAllTrades,
  detectLeagueSettings
};
