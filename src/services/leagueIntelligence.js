// League Intelligence Service - Analyzes team strength and competitive windows

import { getPlayerValue, getPickValue } from './values';

// Age curve thresholds by position
const AGE_CURVES = {
  QB: { prime: [24, 35], declining: 36, old: 38 },
  RB: { prime: [22, 26], declining: 27, old: 29 },
  WR: { prime: [23, 28], declining: 29, old: 31 },
  TE: { prime: [24, 29], declining: 30, old: 32 }
};

// Positional scarcity multipliers (how rare good players are)
const SCARCITY = {
  QB: 1.0, // Most abundant in 1QB leagues
  RB: 1.5, // Very scarce
  WR: 1.0, // Abundant
  TE: 1.3  // Moderately scarce
};

/**
 * Calculate contender score (0-100) and competitive status
 * @param {Object} roster - Team roster with players, picks, record
 * @param {Object} leagueSettings - League configuration
 * @returns {Object} { status, score, confidence, reasoning }
 */
export function calculateContenderScore(roster, leagueSettings) {
  if (!roster || !roster.players) {
    return { status: 'UNKNOWN', score: 0, confidence: 0, reasoning: [] };
  }

  const scores = {
    record: 0,
    rosterAge: 0,
    starterValue: 0,
    depth: 0,
    pickCapital: 0
  };

  const reasoning = [];

  // 1. RECORD SCORE (0-20 points)
  const totalGames = roster.wins + roster.losses;
  if (totalGames > 0) {
    const winPct = roster.wins / totalGames;
    scores.record = winPct * 20;

    if (winPct >= 0.7) reasoning.push(`Strong ${roster.wins}-${roster.losses} record`);
    else if (winPct <= 0.3) reasoning.push(`Poor ${roster.wins}-${roster.losses} record`);
  }

  // 2. ROSTER AGE SCORE (0-20 points)
  const playersWithAge = roster.players.filter(p => p.age && ['QB', 'RB', 'WR', 'TE'].includes(p.position));
  if (playersWithAge.length > 0) {
    const avgAge = playersWithAge.reduce((sum, p) => sum + p.age, 0) / playersWithAge.length;
    const youngCount = playersWithAge.filter(p => {
      const curve = AGE_CURVES[p.position];
      return curve && p.age <= curve.prime[0] + 2;
    }).length;
    const oldCount = playersWithAge.filter(p => {
      const curve = AGE_CURVES[p.position];
      return curve && p.age >= curve.declining;
    }).length;

    // Ideal contender age: 25-28
    if (avgAge >= 25 && avgAge <= 28) {
      scores.rosterAge = 20;
      reasoning.push('Prime-aged roster');
    } else if (avgAge < 25) {
      scores.rosterAge = 15;
      reasoning.push('Young, developing roster');
    } else if (avgAge < 30) {
      scores.rosterAge = 12;
      reasoning.push('Aging roster in contention window');
    } else {
      scores.rosterAge = 5;
      reasoning.push('Aging roster past prime');
    }

    if (youngCount >= 5) reasoning.push(`${youngCount} young players for future`);
    if (oldCount >= 5) reasoning.push(`${oldCount} aging players - window closing`);
  }

  // 3. STARTER VALUE SCORE (0-30 points)
  const playersWithValue = roster.players.map(p => ({ ...p, value: getPlayerValue(p) }));
  const sortedByValue = [...playersWithValue].sort((a, b) => b.value - a.value);

  // Get top starters (QB, RB, RB, WR, WR, WR, TE, FLEX, FLEX)
  const starterCount = leagueSettings.isSuperFlex ? 11 : 10;
  const starters = sortedByValue.slice(0, starterCount);
  const starterValue = starters.reduce((sum, p) => sum + p.value, 0);

  // Average value per starter position
  const avgStarterValue = starterValue / starterCount;

  if (avgStarterValue >= 5000) {
    scores.starterValue = 30;
    reasoning.push('Elite starting lineup');
  } else if (avgStarterValue >= 4000) {
    scores.starterValue = 25;
    reasoning.push('Strong starting lineup');
  } else if (avgStarterValue >= 3000) {
    scores.starterValue = 18;
    reasoning.push('Average starting lineup');
  } else if (avgStarterValue >= 2000) {
    scores.starterValue = 10;
    reasoning.push('Below average starters');
  } else {
    scores.starterValue = 5;
    reasoning.push('Weak starting lineup');
  }

  // Count elite players (value > 7000)
  const elitePlayers = playersWithValue.filter(p => p.value >= 7000);
  if (elitePlayers.length >= 3) {
    reasoning.push(`${elitePlayers.length} elite players`);
  }

  // 4. DEPTH SCORE (0-15 points)
  const benchValue = sortedByValue.slice(starterCount).reduce((sum, p) => sum + p.value, 0);
  const depthPlayers = sortedByValue.slice(starterCount, starterCount + 8);
  const avgDepthValue = depthPlayers.length > 0
    ? depthPlayers.reduce((sum, p) => sum + p.value, 0) / depthPlayers.length
    : 0;

  if (avgDepthValue >= 2000) {
    scores.depth = 15;
    reasoning.push('Excellent depth');
  } else if (avgDepthValue >= 1200) {
    scores.depth = 10;
    reasoning.push('Solid depth');
  } else if (avgDepthValue >= 600) {
    scores.depth = 5;
    reasoning.push('Thin depth');
  } else {
    scores.depth = 2;
    reasoning.push('Poor depth');
  }

  // 5. PICK CAPITAL SCORE (0-15 points)
  if (roster.picks && roster.picks.length > 0) {
    const currentYear = new Date().getFullYear();
    const nearTermPicks = roster.picks.filter(p => p.year <= currentYear + 1);
    const firstRounders = nearTermPicks.filter(p => p.round === 1);
    const secondRounders = nearTermPicks.filter(p => p.round === 2);

    if (firstRounders.length >= 3) {
      scores.pickCapital = 15;
      reasoning.push(`${firstRounders.length} 1st round picks - rebuilding asset`);
    } else if (firstRounders.length >= 2) {
      scores.pickCapital = 12;
      reasoning.push(`${firstRounders.length} 1st round picks`);
    } else if (firstRounders.length >= 1 && secondRounders.length >= 2) {
      scores.pickCapital = 8;
      reasoning.push('Good draft capital');
    } else if (nearTermPicks.length >= 4) {
      scores.pickCapital = 5;
      reasoning.push('Average draft capital');
    } else {
      scores.pickCapital = 2;
      reasoning.push('Limited draft capital');
    }
  }

  // Calculate total score and confidence
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);

  // Confidence based on data completeness
  let confidence = 0.5;
  if (totalGames > 8) confidence += 0.15;
  if (playersWithAge.length >= 15) confidence += 0.15;
  if (roster.picks && roster.picks.length > 0) confidence += 0.1;
  confidence += Math.min(0.1, roster.players.length / 200);

  // Determine status
  let status = 'MIDDLE';
  if (totalScore >= 75) {
    status = 'CONTENDER';
  } else if (totalScore >= 60) {
    status = 'FRINGE_CONTENDER';
  } else if (totalScore <= 40) {
    status = 'REBUILDER';
  } else if (totalScore <= 50 && scores.pickCapital >= 10) {
    status = 'REBUILDER';
  }

  return {
    status,
    score: Math.round(totalScore),
    confidence: Math.min(1, confidence),
    reasoning,
    breakdown: scores
  };
}

/**
 * Enhanced team needs analysis with age curves, bye weeks, and handcuffs
 * @param {Object} roster - Team roster
 * @param {Object} leagueSettings - League configuration
 * @returns {Object} Detailed needs analysis
 */
export function calculateTeamNeeds(roster, leagueSettings) {
  if (!roster || !roster.players) {
    return { critical: [], high: [], medium: [], low: [], strengths: [] };
  }

  const needs = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    strengths: []
  };

  const byPosition = { QB: [], RB: [], WR: [], TE: [] };
  roster.players.forEach(p => {
    if (byPosition[p.position]) {
      byPosition[p.position].push({
        ...p,
        value: getPlayerValue(p)
      });
    }
  });

  // Sort each position by value
  Object.keys(byPosition).forEach(pos => {
    byPosition[pos].sort((a, b) => b.value - a.value);
  });

  // QB Analysis
  analyzeQBNeeds(byPosition.QB, needs, leagueSettings);

  // RB Analysis
  analyzeRBNeeds(byPosition.RB, needs, leagueSettings);

  // WR Analysis
  analyzeWRNeeds(byPosition.WR, needs, leagueSettings);

  // TE Analysis
  analyzeTENeeds(byPosition.TE, needs, leagueSettings);

  return needs;
}

function analyzeQBNeeds(qbs, needs, leagueSettings) {
  const starterQBs = qbs.filter(qb => qb.value >= 2000);
  const youngQBs = qbs.filter(qb => qb.age && qb.age < AGE_CURVES.QB.prime[1]);
  const agingQBs = qbs.filter(qb => qb.age && qb.age >= AGE_CURVES.QB.declining);

  const minQBs = leagueSettings.isSuperFlex ? 3 : 2;

  if (starterQBs.length === 0) {
    needs.critical.push({
      position: 'QB',
      priority: 'CRITICAL',
      reason: 'No startable QB on roster',
      recommendation: 'Acquire QB1 immediately'
    });
  } else if (starterQBs.length < minQBs) {
    needs.high.push({
      position: 'QB',
      priority: 'HIGH',
      reason: `Need ${minQBs - starterQBs.length} more QB${leagueSettings.isSuperFlex ? ' (SuperFlex)' : ''}`,
      recommendation: `Target ${leagueSettings.isSuperFlex ? 'QB1/QB2' : 'QB2'}`
    });
  } else if (youngQBs.length === 0 && qbs.length > 0) {
    needs.medium.push({
      position: 'QB',
      priority: 'MEDIUM',
      reason: 'All QBs are aging - need young QB for future',
      recommendation: 'Target young QB for succession plan'
    });
  } else if (starterQBs.length >= minQBs && youngQBs.length >= 1) {
    needs.strengths.push({
      position: 'QB',
      reason: 'QB room is solid',
      detail: `${starterQBs.length} startable QBs with youth`
    });
  }

  if (agingQBs.length >= 2) {
    needs.medium.push({
      position: 'QB',
      priority: 'MEDIUM',
      reason: `${agingQBs.length} aging QBs - succession risk`,
      recommendation: 'Add young QB depth'
    });
  }
}

function analyzeRBNeeds(rbs, needs, leagueSettings) {
  const rb1s = rbs.filter(rb => rb.value >= 5000); // Elite RBs
  const rb2s = rbs.filter(rb => rb.value >= 3000 && rb.value < 5000); // Solid RB2s
  const flexRBs = rbs.filter(rb => rb.value >= 1500 && rb.value < 3000);
  const youngRBs = rbs.filter(rb => rb.age && rb.age <= AGE_CURVES.RB.prime[1]);
  const agingRBs = rbs.filter(rb => rb.age && rb.age >= AGE_CURVES.RB.declining);

  // Age curve critical for RBs
  if (rb1s.length === 0) {
    needs.critical.push({
      position: 'RB',
      priority: 'CRITICAL',
      reason: 'No elite RB on roster',
      recommendation: 'Acquire RB1 - essential for contending'
    });
  } else if (rb1s.length + rb2s.length < 2) {
    needs.high.push({
      position: 'RB',
      priority: 'HIGH',
      reason: 'Weak RB depth - need 2+ quality starters',
      recommendation: 'Target RB2 or multiple flex RBs'
    });
  } else if (youngRBs.length < 2 && rbs.length >= 3) {
    needs.high.push({
      position: 'RB',
      priority: 'HIGH',
      reason: 'RB room is aging - RBs decline fast after 27',
      recommendation: 'Invest in young RBs (age 22-26)'
    });
  } else if (rb1s.length >= 1 && (rb2s.length + flexRBs.length) >= 3) {
    needs.strengths.push({
      position: 'RB',
      reason: 'Strong RB room',
      detail: `${rb1s.length} elite + ${rb2s.length} solid RBs`
    });
  }

  if (agingRBs.length >= 3) {
    needs.medium.push({
      position: 'RB',
      priority: 'MEDIUM',
      reason: `${agingRBs.length} RBs age 27+ - sell high window closing`,
      recommendation: 'Consider selling aging RBs for picks/youth'
    });
  }

  if (rbs.length < 5) {
    needs.medium.push({
      position: 'RB',
      priority: 'MEDIUM',
      reason: 'Thin RB depth - vulnerable to injuries',
      recommendation: 'Add RB depth pieces'
    });
  }
}

function analyzeWRNeeds(wrs, needs, leagueSettings) {
  const wr1s = wrs.filter(wr => wr.value >= 6500); // Elite WRs
  const wr2s = wrs.filter(wr => wr.value >= 4000 && wr.value < 6500);
  const wr3s = wrs.filter(wr => wr.value >= 2000 && wr.value < 4000);
  const youngWRs = wrs.filter(wr => wr.age && wr.age <= AGE_CURVES.WR.prime[1]);
  const agingWRs = wrs.filter(wr => wr.age && wr.age >= AGE_CURVES.WR.declining);

  if (wr1s.length === 0) {
    needs.critical.push({
      position: 'WR',
      priority: 'CRITICAL',
      reason: 'No elite WR - need WR1',
      recommendation: 'Acquire top-24 WR'
    });
  } else if (wr1s.length + wr2s.length < 3) {
    needs.high.push({
      position: 'WR',
      priority: 'HIGH',
      reason: 'Need more starting-caliber WRs',
      recommendation: 'Target WR2s - need 3+ quality WRs'
    });
  } else if (youngWRs.length < 3 && wrs.length >= 5) {
    needs.medium.push({
      position: 'WR',
      priority: 'MEDIUM',
      reason: 'WR room lacks youth',
      recommendation: 'Add young WRs (age 23-27)'
    });
  } else if (wr1s.length >= 2 && wr2s.length >= 2) {
    needs.strengths.push({
      position: 'WR',
      reason: 'Excellent WR depth',
      detail: `${wr1s.length} elite + ${wr2s.length} solid WRs`
    });
  }

  if (wrs.length < 8) {
    needs.medium.push({
      position: 'WR',
      priority: 'MEDIUM',
      reason: 'WR depth is thin',
      recommendation: 'Add WR depth - target 10+ WRs in dynasty'
    });
  }
}

function analyzeTENeeds(tes, needs, leagueSettings) {
  const eliteTEs = tes.filter(te => te.value >= 5500); // Top-5 TEs
  const te1s = tes.filter(te => te.value >= 3500 && te.value < 5500); // TE1s
  const youngTEs = tes.filter(te => te.age && te.age <= AGE_CURVES.TE.prime[1]);

  const multiplier = leagueSettings.isTEPremium ? 1.5 : 1.0;

  if (eliteTEs.length === 0 && te1s.length === 0) {
    const priority = leagueSettings.isTEPremium ? 'CRITICAL' : 'HIGH';
    needs[leagueSettings.isTEPremium ? 'critical' : 'high'].push({
      position: 'TE',
      priority,
      reason: `No startable TE${leagueSettings.isTEPremium ? ' in TE Premium league' : ''}`,
      recommendation: 'Acquire TE1'
    });
  } else if (eliteTEs.length === 0 && leagueSettings.isTEPremium) {
    needs.high.push({
      position: 'TE',
      priority: 'HIGH',
      reason: 'TE Premium league - elite TE is major advantage',
      recommendation: 'Target top-5 TE (Bowers, LaPorta, McBride)'
    });
  } else if (eliteTEs.length >= 1) {
    needs.strengths.push({
      position: 'TE',
      reason: `Elite TE${leagueSettings.isTEPremium ? ' in TE Premium' : ''} - major advantage`,
      detail: `${eliteTEs[0].name} is league-winner`
    });
  } else if (te1s.length >= 1) {
    needs.low.push({
      position: 'TE',
      priority: 'LOW',
      reason: 'TE is adequate',
      recommendation: 'Upgrade when opportunity arises'
    });
  }

  if (tes.length < 2) {
    needs.medium.push({
      position: 'TE',
      priority: 'MEDIUM',
      reason: 'No TE depth - risky if starter injured',
      recommendation: 'Add TE2 for safety'
    });
  }
}

/**
 * Calculate power rankings for entire league
 * @param {Array} allRosters - All team rosters
 * @param {Object} leagueSettings - League configuration
 * @returns {Array} Ranked teams with analysis
 */
export function calculatePowerRankings(allRosters, leagueSettings) {
  const rankings = allRosters.map(roster => {
    const contenderAnalysis = calculateContenderScore(roster, leagueSettings);
    const teamNeeds = calculateTeamNeeds(roster, leagueSettings);

    // Calculate projected points based on starter value
    const playersWithValue = roster.players.map(p => ({ ...p, value: getPlayerValue(p) }));
    const sortedByValue = [...playersWithValue].sort((a, b) => b.value - a.value);
    const starterCount = leagueSettings.isSuperFlex ? 11 : 10;
    const starters = sortedByValue.slice(0, starterCount);
    const projectedPoints = starters.reduce((sum, p) => sum + (p.value / 50), 0);

    // Determine competitive window
    let competitiveWindow = 'rebuilding';
    const avgAge = roster.players
      .filter(p => p.age && ['QB', 'RB', 'WR', 'TE'].includes(p.position))
      .reduce((sum, p, _, arr) => sum + p.age / arr.length, 0);

    if (contenderAnalysis.status === 'CONTENDER' || contenderAnalysis.status === 'FRINGE_CONTENDER') {
      if (avgAge >= 28) {
        competitiveWindow = '1-year'; // Win-now
      } else {
        competitiveWindow = '2-3 year'; // Multi-year window
      }
    } else if (contenderAnalysis.status === 'MIDDLE') {
      if (avgAge <= 25) {
        competitiveWindow = '2-3 year'; // Young team on the rise
      } else {
        competitiveWindow = 'retool'; // Need changes
      }
    }

    return {
      rosterId: roster.rosterId,
      name: roster.name,
      wins: roster.wins,
      losses: roster.losses,
      ...contenderAnalysis,
      teamNeeds,
      projectedPoints: Math.round(projectedPoints),
      competitiveWindow,
      totalValue: playersWithValue.reduce((sum, p) => sum + p.value, 0),
      starterValue: starters.reduce((sum, p) => sum + p.value, 0)
    };
  });

  // Sort by contender score
  rankings.sort((a, b) => b.score - a.score);

  // Add rank
  rankings.forEach((team, index) => {
    team.rank = index + 1;
  });

  // Identify trade partners for each team
  rankings.forEach(team => {
    team.bestTradePartners = findBestTradePartners(team, rankings);
  });

  return rankings;
}

/**
 * Find best trade partners based on complementary needs
 */
function findBestTradePartners(myTeam, allTeams) {
  const partners = [];

  allTeams.forEach(team => {
    if (team.rosterId === myTeam.rosterId) return;

    let synergy = 0;
    const reasons = [];

    // Contender/Rebuilder synergy
    if (myTeam.status === 'CONTENDER' && team.status === 'REBUILDER') {
      synergy += 30;
      reasons.push('You contend, they rebuild - perfect fit');
    } else if (myTeam.status === 'REBUILDER' && team.status === 'CONTENDER') {
      synergy += 30;
      reasons.push('They contend, you rebuild - swap picks for players');
    }

    // Competitive window synergy
    if (myTeam.competitiveWindow === '1-year' && team.competitiveWindow === 'rebuilding') {
      synergy += 20;
      reasons.push('Win-now vs rebuilding');
    } else if (myTeam.competitiveWindow === 'rebuilding' && team.competitiveWindow === '1-year') {
      synergy += 20;
      reasons.push('Their window closing - sell vets for picks');
    }

    // Complementary positional needs
    const myNeeds = [...myTeam.teamNeeds.critical, ...myTeam.teamNeeds.high];
    const theirNeeds = [...team.teamNeeds.critical, ...team.teamNeeds.high];
    const myStrengths = myTeam.teamNeeds.strengths;
    const theirStrengths = team.teamNeeds.strengths;

    myNeeds.forEach(need => {
      const hasStrength = theirStrengths.find(s => s.position === need.position);
      if (hasStrength) {
        synergy += 15;
        reasons.push(`They have ${need.position} strength, you need ${need.position}`);
      }
    });

    theirNeeds.forEach(need => {
      const hasStrength = myStrengths.find(s => s.position === need.position);
      if (hasStrength) {
        synergy += 15;
        reasons.push(`You have ${need.position} strength, they need ${need.position}`);
      }
    });

    if (synergy > 0) {
      partners.push({
        rosterId: team.rosterId,
        name: team.name,
        synergy,
        reasons: reasons.slice(0, 3) // Top 3 reasons
      });
    }
  });

  // Sort by synergy and return top 3
  partners.sort((a, b) => b.synergy - a.synergy);
  return partners.slice(0, 3);
}

export default {
  calculateContenderScore,
  calculateTeamNeeds,
  calculatePowerRankings
};
