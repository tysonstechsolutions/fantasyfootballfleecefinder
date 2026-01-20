// Dynasty Trade Values - January 2026

// Known player values (top assets)
const PLAYER_VALUES = {
  // Elite QBs
  'Josh Allen': 8500, 'Lamar Jackson': 8200, 'Joe Burrow': 8000,
  'Patrick Mahomes': 7800, 'Jalen Hurts': 7500, 'C.J. Stroud': 7200,
  'Jayden Daniels': 7000, 'Anthony Richardson': 6500, 'Caleb Williams': 6000,
  'Drake Maye': 5500, 'Bo Nix': 4500, 'Trevor Lawrence': 5000,
  'Kyler Murray': 4000, 'Jared Goff': 4000, 'Dak Prescott': 4500,
  'Justin Herbert': 6000, 'Brock Purdy': 5500, 'Tua Tagovailoa': 4000,
  
  // Elite RBs
  'Bijan Robinson': 9500, 'Jahmyr Gibbs': 9200, 'Breece Hall': 7500,
  'Jonathan Taylor': 6500, 'Saquon Barkley': 6000, 'De\'Von Achane': 7000,
  'Travis Etienne': 5000, 'Isiah Pacheco': 5500, 'Derrick Henry': 4000,
  'Ashton Jeanty': 8500, 'Omarion Hampton': 7000, 'Quinshon Judkins': 5500,
  'James Conner': 3000, 'Cam Skattebo': 4500, 'Josh Jacobs': 4500,
  'Aaron Jones': 3500, 'Kyren Williams': 5500, 'James Cook': 5500,
  'Kenneth Walker III': 5000, 'Najee Harris': 4500, 'Javonte Williams': 4000,
  'Rachaad White': 4500, 'Rhamondre Stevenson': 4000, 'David Montgomery': 3500,
  
  // Elite WRs
  'Ja\'Marr Chase': 9500, 'CeeDee Lamb': 9000, 'Justin Jefferson': 9200,
  'Amon-Ra St. Brown': 8500, 'Malik Nabers': 8000, 'A.J. Brown': 7500,
  'Garrett Wilson': 7000, 'Drake London': 7200, 'Puka Nacua': 8000,
  'Chris Olave': 6500, 'Brian Thomas Jr.': 6000, 'Travis Hunter': 7500,
  'Marvin Harrison Jr.': 5500, 'Ladd McConkey': 6500, 'Rome Odunze': 5500,
  'Tank Dell': 5000, 'George Pickens': 6000, 'DeVonta Smith': 6500,
  'Tee Higgins': 6000, 'Jaxon Smith-Njigba': 6000, 'Keenan Allen': 3000,
  'Josh Downs': 4500, 'Nico Collins': 7000, 'DK Metcalf': 6000,
  'Tyreek Hill': 5500, 'Davante Adams': 4500, 'Stefon Diggs': 4000,
  'Brandon Aiyuk': 6000, 'Jaylen Waddle': 6500, 'Michael Pittman Jr.': 5000,
  'DJ Moore': 5500, 'Amari Cooper': 3500, 'Terry McLaurin': 5500,
  'Cooper Kupp': 4000, 'Jakobi Meyers': 3500, 'Rashee Rice': 6500,
  
  // TEs
  'Brock Bowers': 8000, 'Sam LaPorta': 6500, 'Trey McBride': 6000,
  'George Kittle': 4500, 'Travis Kelce': 3500, 'Kyle Pitts': 4500,
  'Dalton Kincaid': 5500, 'Jake Ferguson': 4000, 'Evan Engram': 3500,
  'David Njoku': 3000, 'Mark Andrews': 4000, 'Dallas Goedert': 3500,
  'Pat Freiermuth': 3500, 'Cole Kmet': 3000
};

// Draft pick values
const PICK_VALUES = {
  2026: { 1: { early: 7000, mid: 5000, late: 3000 }, 2: { early: 2200, mid: 1600, late: 1200 }, 3: { early: 800, mid: 500, late: 300 }, 4: { early: 200, mid: 150, late: 100 } },
  2027: { 1: { early: 5500, mid: 4000, late: 2400 }, 2: { early: 1800, mid: 1300, late: 1000 }, 3: { early: 600, mid: 400, late: 250 }, 4: { early: 150, mid: 100, late: 75 } },
  2028: { 1: { early: 4500, mid: 3200, late: 2000 }, 2: { early: 1400, mid: 1000, late: 750 }, 3: { early: 450, mid: 300, late: 200 }, 4: { early: 100, mid: 75, late: 50 } }
};

// Position tiers for unknown players
const TIERS = {
  QB: { elite: 7000, t1: 5500, t2: 4000, t3: 2500, t4: 1500 },
  RB: { elite: 9000, t1: 7000, t2: 5000, t3: 3000, t4: 1500 },
  WR: { elite: 8500, t1: 6500, t2: 4500, t3: 2500, t4: 1000 },
  TE: { elite: 7000, t1: 5000, t2: 3000, t3: 1500, t4: 500 },
  K: { t1: 50, t2: 25, t3: 10, t4: 5 },
  DEF: { t1: 100, t2: 50, t3: 25, t4: 10 }
};

export function getPlayerValue(player) {
  if (!player) return 0;
  
  const name = player.name || `${player.firstName} ${player.lastName}`;
  
  // Check known values
  if (PLAYER_VALUES[name]) {
    let val = PLAYER_VALUES[name];
    
    // Age discount for non-QBs
    if (player.position !== 'QB' && player.age) {
      if (player.age >= 30) val *= 0.7;
      else if (player.age >= 28) val *= 0.85;
      else if (player.age >= 26) val *= 0.95;
    }
    
    // Injury discount
    if (player.injuryStatus === 'IR' || player.injuryStatus === 'Out') {
      val *= 0.9;
    }
    
    return Math.round(val);
  }
  
  // Estimate for unknown players
  return estimateValue(player);
}

function estimateValue(player) {
  const pos = player.position || 'UNK';
  const tier = TIERS[pos];
  if (!tier) return 50;
  
  const rank = player.searchRank || 9999;
  const age = player.age || 25;
  
  let base = 0;
  if (rank < 50) base = tier.elite || tier.t1;
  else if (rank < 150) base = tier.t1;
  else if (rank < 300) base = tier.t2;
  else if (rank < 500) base = tier.t3;
  else base = tier.t4;
  
  // Age adjustments
  if (pos === 'RB') {
    if (age >= 30) base *= 0.5;
    else if (age >= 28) base *= 0.7;
    else if (age <= 23) base *= 1.1;
  } else if (pos === 'WR') {
    if (age >= 32) base *= 0.5;
    else if (age >= 30) base *= 0.7;
    else if (age <= 24) base *= 1.1;
  }
  
  return Math.round(base);
}

export function getPickValue(year, round, tier = 'mid') {
  const yearVals = PICK_VALUES[year] || PICK_VALUES[2028];
  const roundVals = yearVals[round] || { early: 100, mid: 75, late: 50 };
  return roundVals[tier] || roundVals.mid;
}

export function estimatePickTier(roster, totalRosters) {
  // Estimate based on wins or roster strength
  const wins = roster.wins || 0;
  const losses = roster.losses || 0;
  const pct = (wins + losses) > 0 ? wins / (wins + losses) : 0.5;
  
  if (pct >= 0.6) return 'late';
  if (pct <= 0.4) return 'early';
  return 'mid';
}

export function analyzeTrade(side1, side2) {
  const val1 = side1.reduce((sum, item) => sum + (item.value || 0), 0);
  const val2 = side2.reduce((sum, item) => sum + (item.value || 0), 0);
  
  const diff = val2 - val1;
  const pct = val1 > 0 ? ((val2 / val1) - 1) * 100 : 0;
  
  let verdict, level;
  
  if (pct > 40) { verdict = 'HIGHWAY ROBBERY 🚨'; level = 'win'; }
  else if (pct > 25) { verdict = 'MASSIVE FLEECE 💰'; level = 'win'; }
  else if (pct > 15) { verdict = 'SOLID WIN ✓'; level = 'win'; }
  else if (pct > 5) { verdict = 'SLIGHT WIN'; level = 'win'; }
  else if (pct >= -5) { verdict = 'FAIR TRADE'; level = 'fair'; }
  else if (pct >= -15) { verdict = 'SLIGHT LOSS'; level = 'lose'; }
  else if (pct >= -25) { verdict = 'BAD TRADE ✗'; level = 'lose'; }
  else { verdict = 'YOU GOT FLEECED 💀'; level = 'lose'; }
  
  return { val1, val2, diff, pct, verdict, level };
}

/**
 * Merge KTC values with static values
 * KTC values take precedence when available
 * @param {Object} ktcValues - Values from KTC API
 * @returns {Object} Merged player values
 */
export function mergePlayerValues(ktcValues = {}) {
  const merged = { ...PLAYER_VALUES };

  // Override with KTC values where available
  Object.keys(ktcValues).forEach(playerName => {
    if (ktcValues[playerName] > 0) {
      merged[playerName] = ktcValues[playerName];
    }
  });

  return merged;
}

/**
 * Adjust player values based on league settings
 * @param {Object} playerValues - Base player values
 * @param {Object} leagueSettings - League configuration
 * @param {boolean} leagueSettings.superflex - Is superflex league
 * @param {boolean} leagueSettings.tePremium - Is TE premium league
 * @param {number} leagueSettings.ppr - PPR scoring (1.0 = full, 0.5 = half, 0 = standard)
 * @param {number} leagueSettings.leagueSize - Number of teams (10, 12, 14, etc.)
 * @returns {Object} Adjusted player values
 */
export function adjustValuesForLeague(playerValues, leagueSettings = {}) {
  const {
    superflex = false,
    tePremium = false,
    ppr = 1.0,
    leagueSize = 12
  } = leagueSettings;

  const adjusted = {};

  Object.keys(playerValues).forEach(playerName => {
    let value = playerValues[playerName];
    const position = getPlayerPosition(playerName);

    // Superflex: QB values × 1.8
    if (superflex && position === 'QB') {
      value *= 1.8;
    }

    // TE Premium: TE values × 1.3
    if (tePremium && position === 'TE') {
      value *= 1.3;
    }

    // PPR multiplier (affects WR and RB differently)
    if (position === 'WR') {
      // WRs benefit most from PPR
      if (ppr === 1.0) value *= 1.0; // Full PPR - no change
      else if (ppr >= 0.5) value *= 0.95; // Half PPR - slight decrease
      else value *= 0.85; // Standard - decrease WR value
    } else if (position === 'RB') {
      // RBs are more valuable in standard
      if (ppr === 1.0) value *= 1.0; // Full PPR - no change
      else if (ppr >= 0.5) value *= 1.05; // Half PPR - slight increase
      else value *= 1.15; // Standard - increase RB value
    }

    // League size adjustment
    if (leagueSize === 10) {
      value *= 0.9; // Smaller league - elite players more valuable, depth less valuable
    } else if (leagueSize === 14) {
      value *= 1.1; // Larger league - depth more valuable
    } else if (leagueSize === 16) {
      value *= 1.2; // Very large league - all startable players valuable
    }
    // 12-team is baseline (1.0x)

    adjusted[playerName] = Math.round(value);
  });

  return adjusted;
}

/**
 * Helper function to determine player position from name
 * Uses PLAYER_VALUES list to identify position
 * @param {string} playerName - Player name
 * @returns {string} Position (QB, RB, WR, TE, or null)
 */
function getPlayerPosition(playerName) {
  // QB list
  const qbs = ['Josh Allen', 'Lamar Jackson', 'Joe Burrow', 'Patrick Mahomes', 'Jalen Hurts',
    'C.J. Stroud', 'Jayden Daniels', 'Anthony Richardson', 'Caleb Williams', 'Drake Maye',
    'Bo Nix', 'Trevor Lawrence', 'Kyler Murray', 'Jared Goff', 'Dak Prescott', 'Justin Herbert',
    'Brock Purdy', 'Tua Tagovailoa'];

  // RB list
  const rbs = ['Bijan Robinson', 'Jahmyr Gibbs', 'Breece Hall', 'Jonathan Taylor',
    'Saquon Barkley', 'De\'Von Achane', 'Travis Etienne', 'Isiah Pacheco', 'Derrick Henry',
    'Ashton Jeanty', 'Omarion Hampton', 'Quinshon Judkins', 'James Conner', 'Cam Skattebo',
    'Josh Jacobs', 'Aaron Jones', 'Kyren Williams', 'James Cook', 'Kenneth Walker III',
    'Najee Harris', 'Javonte Williams', 'Rachaad White', 'Rhamondre Stevenson',
    'David Montgomery'];

  // TE list
  const tes = ['Brock Bowers', 'Sam LaPorta', 'Trey McBride', 'George Kittle', 'Travis Kelce',
    'Kyle Pitts', 'Dalton Kincaid', 'Jake Ferguson', 'Evan Engram', 'David Njoku',
    'Mark Andrews', 'Dallas Goedert', 'Pat Freiermuth', 'Cole Kmet'];

  if (qbs.includes(playerName)) return 'QB';
  if (rbs.includes(playerName)) return 'RB';
  if (tes.includes(playerName)) return 'TE';

  // If not found in other lists, assume WR (or null)
  if (PLAYER_VALUES[playerName]) return 'WR';

  return null;
}

/**
 * Get adjusted player value with league settings
 * Combines getPlayerValue with league adjustments
 * @param {Object} player - Player object
 * @param {Object} leagueSettings - League configuration
 * @param {Object} ktcValues - Optional KTC values to merge
 * @returns {number} Adjusted value
 */
export function getAdjustedPlayerValue(player, leagueSettings = {}, ktcValues = {}) {
  const baseValue = getPlayerValue(player);

  if (!leagueSettings || Object.keys(leagueSettings).length === 0) {
    return baseValue;
  }

  const name = player.name || `${player.firstName} ${player.lastName}`;
  const mergedValues = mergePlayerValues(ktcValues);
  const adjustedValues = adjustValuesForLeague(mergedValues, leagueSettings);

  return adjustedValues[name] || baseValue;
}

export default {
  getPlayerValue,
  getPickValue,
  analyzeTrade,
  estimatePickTier,
  mergePlayerValues,
  adjustValuesForLeague,
  getAdjustedPlayerValue
};
