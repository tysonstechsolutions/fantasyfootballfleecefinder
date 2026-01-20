// Trade Finder Service - Auto-discover fair trade opportunities across league

import { getPlayerValue, getPickValue, estimatePickTier } from './values';

/**
 * Analyze a roster's needs based on position depth, age, and quality
 */
export function analyzeNeeds(roster) {
  const byPosition = { QB: [], RB: [], WR: [], TE: [] };

  roster.players.forEach(p => {
    if (byPosition[p.position]) {
      byPosition[p.position].push({
        ...p,
        value: getPlayerValue(p)
      });
    }
  });

  // Sort by value within each position
  Object.keys(byPosition).forEach(pos => {
    byPosition[pos].sort((a, b) => b.value - a.value);
  });

  const needs = {
    critical: [],  // Must address
    moderate: [],  // Should address
    minor: []      // Nice to have
  };

  const surplus = {
    sellable: [],  // Can afford to trade
    expendable: []  // Should sell
  };

  // Analyze QB
  const qbs = byPosition.QB;
  const startableQBs = qbs.filter(p => p.value >= 3000);
  const youngQBs = qbs.filter(p => (p.age || 25) < 28);

  if (startableQBs.length < 2) {
    needs.critical.push({ position: 'QB', reason: 'Need starting QB', minValue: 4000 });
  } else if (startableQBs.length === 2 && youngQBs.length === 0) {
    needs.moderate.push({ position: 'QB', reason: 'Need young QB for future', minValue: 4000 });
  } else if (startableQBs.length >= 3) {
    surplus.sellable.push({ position: 'QB', players: startableQBs.slice(2) });
  }

  // Analyze RB
  const rbs = byPosition.RB;
  const startableRBs = rbs.filter(p => p.value >= 4000);
  const youngRBs = rbs.filter(p => (p.age || 25) < 27);
  const oldRBs = rbs.filter(p => (p.age || 25) >= 28);

  if (startableRBs.length < 3) {
    needs.critical.push({ position: 'RB', reason: 'Need RB depth', minValue: 4000 });
  } else if (youngRBs.length < 2) {
    needs.moderate.push({ position: 'RB', reason: 'Aging RB corps, need youth', minValue: 4500 });
  }

  if (startableRBs.length >= 4) {
    surplus.sellable.push({ position: 'RB', players: startableRBs.slice(3) });
  }
  if (oldRBs.length > 0 && oldRBs.some(p => p.value >= 3000)) {
    surplus.expendable.push({ position: 'RB', players: oldRBs.filter(p => p.value >= 3000), reason: 'Aging, sell high' });
  }

  // Analyze WR
  const wrs = byPosition.WR;
  const startableWRs = wrs.filter(p => p.value >= 4000);
  const youngWRs = wrs.filter(p => (p.age || 25) < 27);

  if (startableWRs.length < 4) {
    needs.critical.push({ position: 'WR', reason: 'Need WR depth', minValue: 4000 });
  } else if (youngWRs.length < 3) {
    needs.moderate.push({ position: 'WR', reason: 'Need young WRs', minValue: 4500 });
  }

  if (startableWRs.length >= 6) {
    surplus.sellable.push({ position: 'WR', players: startableWRs.slice(5) });
  }

  // Analyze TE
  const tes = byPosition.TE;
  const startableTEs = tes.filter(p => p.value >= 3000);

  if (startableTEs.length < 2) {
    needs.critical.push({ position: 'TE', reason: 'Need TE', minValue: 3500 });
  } else if (startableTEs.length >= 3) {
    surplus.sellable.push({ position: 'TE', players: startableTEs.slice(2) });
  }

  return { needs, surplus, byPosition };
}

/**
 * Generate potential trade packages between two rosters
 */
export function generateTradePackages(myRoster, theirRoster, myNeeds, theirNeeds, leagueSettings) {
  const packages = [];
  const totalRosters = leagueSettings?.totalRosters || 12;

  // Add values to all players
  const myPlayersWithValue = myRoster.players.map(p => ({ ...p, value: getPlayerValue(p), type: 'player' }));
  const theirPlayersWithValue = theirRoster.players.map(p => ({ ...p, value: getPlayerValue(p), type: 'player' }));

  // Add values to picks
  const myPicksWithValue = myRoster.picks.map(p => ({
    ...p,
    value: getPickValue(p.year, p.round, estimatePickTier(myRoster, totalRosters)),
    type: 'pick'
  }));
  const theirPicksWithValue = theirRoster.picks.map(p => ({
    ...p,
    value: getPickValue(p.year, p.round, estimatePickTier(theirRoster, totalRosters)),
    type: 'pick'
  }));

  // 1-for-1 Player Trades
  myPlayersWithValue.forEach(myPlayer => {
    // Skip if this is a player from my critical need position
    const isCriticalNeed = myNeeds.needs.critical.some(n => n.position === myPlayer.position);
    if (isCriticalNeed && myPlayer.value >= 4000) return; // Don't trade away starters from critical need positions

    theirPlayersWithValue.forEach(theirPlayer => {
      // Check if this addresses my needs
      const addressesMyNeed = myNeeds.needs.critical.some(n =>
        n.position === theirPlayer.position && theirPlayer.value >= n.minValue
      ) || myNeeds.needs.moderate.some(n =>
        n.position === theirPlayer.position && theirPlayer.value >= n.minValue
      );

      // Check if this addresses their needs
      const addressesTheirNeed = theirNeeds.needs.critical.some(n =>
        n.position === myPlayer.position && myPlayer.value >= n.minValue
      ) || theirNeeds.needs.moderate.some(n =>
        n.position === myPlayer.position && myPlayer.value >= n.minValue
      );

      // Only consider if values are within 20% of each other
      const valueDiff = Math.abs(myPlayer.value - theirPlayer.value);
      const avgValue = (myPlayer.value + theirPlayer.value) / 2;
      const pctDiff = (valueDiff / avgValue) * 100;

      if (pctDiff <= 20 && (addressesMyNeed || addressesTheirNeed)) {
        packages.push({
          iGive: [myPlayer],
          iGet: [theirPlayer],
          addressesMyNeed,
          addressesTheirNeed,
          valueDiff: theirPlayer.value - myPlayer.value,
          pctDiff: ((theirPlayer.value / myPlayer.value) - 1) * 100
        });
      }
    });
  });

  // 2-for-1 Trades (combining two lesser assets for one better asset)
  // I give 2, I get 1 (consolidating)
  for (let i = 0; i < myPlayersWithValue.length; i++) {
    for (let j = i + 1; j < myPlayersWithValue.length; j++) {
      const asset1 = myPlayersWithValue[i];
      const asset2 = myPlayersWithValue[j];
      const combinedValue = asset1.value + asset2.value;

      // Skip if combined value is too low
      if (combinedValue < 4000) continue;

      theirPlayersWithValue.forEach(theirPlayer => {
        const addressesMyNeed = myNeeds.needs.critical.some(n =>
          n.position === theirPlayer.position && theirPlayer.value >= n.minValue
        ) || myNeeds.needs.moderate.some(n =>
          n.position === theirPlayer.position && theirPlayer.value >= n.minValue
        );

        const valueDiff = Math.abs(combinedValue - theirPlayer.value);
        const avgValue = (combinedValue + theirPlayer.value) / 2;
        const pctDiff = (valueDiff / avgValue) * 100;

        if (pctDiff <= 15 && addressesMyNeed) {
          packages.push({
            iGive: [asset1, asset2],
            iGet: [theirPlayer],
            addressesMyNeed,
            addressesTheirNeed: false,
            valueDiff: theirPlayer.value - combinedValue,
            pctDiff: ((theirPlayer.value / combinedValue) - 1) * 100,
            type: '2-for-1-consolidate'
          });
        }
      });
    }
  }

  // They give 2, I get 2 (even swap)
  for (let i = 0; i < myPlayersWithValue.length; i++) {
    for (let j = 0; j < theirPlayersWithValue.length; j++) {
      const myPlayer = myPlayersWithValue[i];
      const theirPlayer = theirPlayersWithValue[j];

      // Look for picks to add
      myPicksWithValue.forEach(myPick => {
        theirPicksWithValue.forEach(theirPick => {
          const myCombined = myPlayer.value + myPick.value;
          const theirCombined = theirPlayer.value + theirPick.value;

          const valueDiff = Math.abs(myCombined - theirCombined);
          const avgValue = (myCombined + theirCombined) / 2;
          const pctDiff = (valueDiff / avgValue) * 100;

          if (pctDiff <= 15 && myCombined >= 5000) {
            const addressesMyNeed = myNeeds.needs.critical.some(n =>
              n.position === theirPlayer.position && theirPlayer.value >= n.minValue
            );

            packages.push({
              iGive: [myPlayer, myPick],
              iGet: [theirPlayer, theirPick],
              addressesMyNeed,
              addressesTheirNeed: false,
              valueDiff: theirCombined - myCombined,
              pctDiff: ((theirCombined / myCombined) - 1) * 100,
              type: '2-for-2'
            });
          }
        });
      });
    }
  }

  return packages;
}

/**
 * Score a trade based on value fairness, need fit, and acceptance likelihood
 */
export function scoreTrade(trade, myNeeds, theirNeeds) {
  let score = 0;

  // 1. Value fairness (0-30 points) - closer to even is better
  const absPctDiff = Math.abs(trade.pctDiff);
  if (absPctDiff <= 5) score += 30;
  else if (absPctDiff <= 10) score += 25;
  else if (absPctDiff <= 15) score += 20;
  else if (absPctDiff <= 20) score += 15;
  else score += 10;

  // 2. Addresses my needs (0-40 points)
  if (trade.addressesMyNeed) {
    const isCritical = trade.iGet.some(asset =>
      myNeeds.needs.critical.some(n => n.position === asset.position)
    );
    if (isCritical) {
      score += 40;
    } else {
      score += 25;
    }
  }

  // 3. Acceptance likelihood (0-30 points) - based on addressing their needs
  if (trade.addressesTheirNeed) {
    score += 30;
  } else {
    // Check if value is in their favor
    if (trade.pctDiff < -5) {
      score += 20; // They get more value, likely to accept
    } else if (trade.pctDiff < 0) {
      score += 15;
    } else {
      score += 5; // Equal or I get more, less likely without need fit
    }
  }

  // Bonus points for multi-asset trades that consolidate rosters
  if (trade.type === '2-for-1-consolidate') {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Find all viable trade opportunities with all opponents
 */
export function findAllTrades(myRoster, allRosters, leagueSettings) {
  const opportunities = [];
  const myNeeds = analyzeNeeds(myRoster);

  allRosters.forEach(opponent => {
    if (opponent.rosterId === myRoster.rosterId) return;

    const theirNeeds = analyzeNeeds(opponent);

    // Generate trade packages
    const packages = generateTradePackages(myRoster, opponent, myNeeds, theirNeeds, leagueSettings);

    // Score each package
    packages.forEach(pkg => {
      const score = scoreTrade(pkg, myNeeds, theirNeeds);

      opportunities.push({
        opponent,
        trade: pkg,
        score,
        myNeeds,
        theirNeeds
      });
    });
  });

  // Sort by score (highest first) and return top 20
  return opportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

/**
 * Filter trades based on user criteria
 */
export function filterTrades(trades, filters) {
  let filtered = [...trades];

  // Filter by position targets
  if (filters.positions && filters.positions.length > 0) {
    filtered = filtered.filter(t =>
      t.trade.iGet.some(asset => filters.positions.includes(asset.position))
    );
  }

  // Exclude specific players
  if (filters.excludePlayers && filters.excludePlayers.length > 0) {
    filtered = filtered.filter(t =>
      !t.trade.iGive.some(asset =>
        filters.excludePlayers.includes(asset.id || asset.name)
      )
    );
  }

  // Min/max value
  if (filters.minValue) {
    filtered = filtered.filter(t => {
      const totalReceived = t.trade.iGet.reduce((sum, a) => sum + a.value, 0);
      return totalReceived >= filters.minValue;
    });
  }

  if (filters.maxValue) {
    filtered = filtered.filter(t => {
      const totalGiven = t.trade.iGive.reduce((sum, a) => sum + a.value, 0);
      return totalGiven <= filters.maxValue;
    });
  }

  // Filter by acceptance likelihood
  if (filters.minAcceptance) {
    const threshold = filters.minAcceptance === 'high' ? 70 : filters.minAcceptance === 'medium' ? 50 : 0;
    filtered = filtered.filter(t => t.score >= threshold);
  }

  return filtered;
}

/**
 * Get acceptance likelihood label based on score
 */
export function getAcceptanceLikelihood(score) {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

/**
 * Get explanation for why a trade is good for the user
 */
export function getTradeReason(trade, myNeeds) {
  const reasons = [];

  // Check if it addresses critical needs
  const criticalNeed = trade.iGet.find(asset =>
    myNeeds.needs.critical.some(n => n.position === asset.position)
  );
  if (criticalNeed) {
    const need = myNeeds.needs.critical.find(n => n.position === criticalNeed.position);
    reasons.push(`Addresses critical need: ${need.reason}`);
  }

  // Check if it addresses moderate needs
  const moderateNeed = trade.iGet.find(asset =>
    myNeeds.needs.moderate.some(n => n.position === asset.position)
  );
  if (moderateNeed && !criticalNeed) {
    const need = myNeeds.needs.moderate.find(n => n.position === moderateNeed.position);
    reasons.push(`Improves roster: ${need.reason}`);
  }

  // Check value gain
  if (trade.valueDiff > 0) {
    reasons.push(`You gain ${trade.valueDiff.toLocaleString()} in value (+${trade.pctDiff.toFixed(1)}%)`);
  }

  // Check if consolidating roster
  if (trade.iGive.length > trade.iGet.length) {
    reasons.push('Consolidates depth into a star player');
  }

  if (reasons.length === 0) {
    reasons.push('Fair value swap to balance roster');
  }

  return reasons.join(' • ');
}

export default {
  findAllTrades,
  analyzeNeeds,
  generateTradePackages,
  scoreTrade,
  filterTrades,
  getAcceptanceLikelihood,
  getTradeReason
};
