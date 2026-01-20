// Monte Carlo Season Simulation
import { getPlayerValue } from './values.js';

/**
 * Generate a random number from a normal distribution
 * Uses Box-Muller transform
 */
function normalRandom(mean = 0, stdDev = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Calculate expected points for a roster based on player values
 * Higher value players = higher expected points
 */
export function calculateExpectedPoints(roster) {
  if (!roster || !roster.players) return 0;

  // Use player values as a proxy for expected points
  // Scale down to realistic point totals (divide by 100)
  const totalValue = roster.players.reduce((sum, player) => {
    return sum + getPlayerValue(player);
  }, 0);

  // Convert value to expected weekly points (roughly)
  // Average fantasy team scores around 100-120 points per week
  // Adjust based on total roster value
  const basePoints = 80; // minimum baseline
  const valuePoints = totalValue / 500; // scale factor

  return basePoints + valuePoints;
}

/**
 * Simulate a single week matchup between two teams
 */
export function simulateWeek(team1, team2, variance = 0.15) {
  const expected1 = calculateExpectedPoints(team1);
  const expected2 = calculateExpectedPoints(team2);

  // Add random variance using normal distribution
  // Variance parameter controls how much randomness (0.15 = 15% standard deviation)
  const actual1 = expected1 * (1 + normalRandom(0, variance));
  const actual2 = expected2 * (1 + normalRandom(0, variance));

  return {
    team1Score: Math.max(0, actual1),
    team2Score: Math.max(0, actual2),
    winner: actual1 > actual2 ? team1.rosterId : team2.rosterId,
    loser: actual1 > actual2 ? team2.rosterId : team1.rosterId
  };
}

/**
 * Generate a simple round-robin schedule for the league
 * Returns array of matchups for each week
 */
function generateSchedule(rosters, weeksInSeason = 14) {
  const schedule = [];
  const numTeams = rosters.length;

  // Simple round-robin scheduling
  for (let week = 0; week < weeksInSeason; week++) {
    const weekMatchups = [];
    const teamsUsed = new Set();

    for (let i = 0; i < numTeams; i++) {
      if (teamsUsed.has(i)) continue;

      // Find next available opponent
      for (let j = i + 1; j < numTeams; j++) {
        if (teamsUsed.has(j)) continue;

        weekMatchups.push({
          team1: rosters[i],
          team2: rosters[j]
        });

        teamsUsed.add(i);
        teamsUsed.add(j);
        break;
      }
    }

    schedule.push(weekMatchups);
  }

  return schedule;
}

/**
 * Simulate playoffs (top 4 teams, 2-week championship)
 * Returns the champion roster ID
 */
function simulatePlayoffs(rosters, variance = 0.15) {
  if (rosters.length < 4) return rosters[0]?.rosterId;

  // Semifinals (1v4, 2v3)
  const semi1 = simulateWeek(rosters[0], rosters[3], variance);
  const semi2 = simulateWeek(rosters[1], rosters[2], variance);

  // Championship
  const finalist1 = rosters.find(r => r.rosterId === semi1.winner);
  const finalist2 = rosters.find(r => r.rosterId === semi2.winner);

  const championship = simulateWeek(finalist1, finalist2, variance);

  return championship.winner;
}

/**
 * Simulate a complete season
 * Returns final standings with wins/losses
 */
function simulateSingleSeason(rosters, schedule, variance = 0.15) {
  // Initialize records
  const records = {};
  rosters.forEach(r => {
    records[r.rosterId] = {
      rosterId: r.rosterId,
      wins: 0,
      losses: 0,
      pointsFor: 0
    };
  });

  // Simulate each week
  schedule.forEach(weekMatchups => {
    weekMatchups.forEach(matchup => {
      const result = simulateWeek(matchup.team1, matchup.team2, variance);

      records[result.winner].wins++;
      records[result.loser].losses++;
      records[result.winner].pointsFor += result.team1Score;
      records[result.loser].pointsFor += result.team2Score;
    });
  });

  // Sort by wins, then points for
  const standings = Object.values(records).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pointsFor - a.pointsFor;
  });

  // Simulate playoffs with top 4 teams
  const playoffTeams = standings.slice(0, 4);
  const playoffRosters = playoffTeams.map(standing =>
    rosters.find(r => r.rosterId === standing.rosterId)
  );

  const champion = simulatePlayoffs(playoffRosters, variance);

  return {
    standings,
    champion,
    playoffTeams: playoffTeams.map(t => t.rosterId)
  };
}

/**
 * Run Monte Carlo simulation of the season
 * @param {Array} rosters - Array of roster objects
 * @param {Array} schedule - Optional custom schedule (will generate if not provided)
 * @param {number} iterations - Number of simulations to run
 * @param {number} variance - Amount of random variance (0.15 = 15%)
 * @returns {Object} Aggregated results with probabilities
 */
export function simulateSeason(rosters, schedule = null, iterations = 10000, variance = 0.15) {
  if (!rosters || rosters.length === 0) {
    return { error: 'No rosters provided' };
  }

  // Generate schedule if not provided
  const seasonSchedule = schedule || generateSchedule(rosters);

  // Initialize result tracking
  const results = {};
  rosters.forEach(r => {
    results[r.rosterId] = {
      rosterId: r.rosterId,
      name: r.name,
      playoffAppearances: 0,
      championships: 0,
      finishes: {}, // Track finish position counts
      totalWins: 0,
      totalLosses: 0
    };
  });

  // Run simulations
  for (let i = 0; i < iterations; i++) {
    const seasonResult = simulateSingleSeason(rosters, seasonSchedule, variance);

    // Record results
    seasonResult.standings.forEach((standing, index) => {
      const rosterId = standing.rosterId;
      const finish = index + 1;

      results[rosterId].totalWins += standing.wins;
      results[rosterId].totalLosses += standing.losses;

      if (!results[rosterId].finishes[finish]) {
        results[rosterId].finishes[finish] = 0;
      }
      results[rosterId].finishes[finish]++;

      // Track playoff appearances (top 4)
      if (finish <= 4) {
        results[rosterId].playoffAppearances++;
      }

      // Track championships
      if (rosterId === seasonResult.champion) {
        results[rosterId].championships++;
      }
    });
  }

  // Calculate probabilities and averages
  const finalResults = Object.values(results).map(r => {
    const avgWins = r.totalWins / iterations;
    const avgLosses = r.totalLosses / iterations;
    const playoffOdds = (r.playoffAppearances / iterations) * 100;
    const championshipOdds = (r.championships / iterations) * 100;

    // Find most likely finish
    let mostLikelyFinish = 1;
    let maxCount = 0;
    Object.entries(r.finishes).forEach(([finish, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostLikelyFinish = parseInt(finish);
      }
    });

    // Calculate finish range (where 80% of finishes fall)
    const sortedFinishes = Object.entries(r.finishes)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

    let cumulative = 0;
    let bestCase = 1;
    let worstCase = rosters.length;

    for (const [finish, count] of sortedFinishes) {
      cumulative += count;
      const pct = cumulative / iterations;

      if (pct >= 0.1 && bestCase === 1) {
        bestCase = parseInt(finish);
      }
      if (pct >= 0.9) {
        worstCase = parseInt(finish);
        break;
      }
    }

    return {
      rosterId: r.rosterId,
      name: r.name,
      playoffOdds: parseFloat(playoffOdds.toFixed(1)),
      championshipOdds: parseFloat(championshipOdds.toFixed(1)),
      avgWins: parseFloat(avgWins.toFixed(1)),
      avgLosses: parseFloat(avgLosses.toFixed(1)),
      mostLikelyFinish,
      bestCase,
      worstCase,
      finishDistribution: r.finishes
    };
  });

  // Sort by playoff odds
  finalResults.sort((a, b) => b.playoffOdds - a.playoffOdds);

  return {
    iterations,
    variance,
    results: finalResults,
    totalTeams: rosters.length
  };
}

export default {
  simulateSeason,
  simulateWeek,
  calculateExpectedPoints
};
