import { ROOKIES_2026, getRookiesByADP } from '../data/rookies2026';

// Mock Draft Simulator for Dynasty Rookie Drafts
class MockDraft {
  constructor(settings) {
    this.numTeams = settings.numTeams || 12;
    this.rounds = settings.rounds || 4;
    this.userPick = settings.userPick || 1; // 1-indexed
    this.draftOrder = this.generateDraftOrder(this.numTeams);
    this.available = this.loadRookies();
    this.picks = []; // Completed picks: { pick, round, teamIndex, player }
    this.currentPick = 1;
    this.currentRound = 1;
    this.isSnakeDraft = true; // Snake draft format
    this.userTeamIndex = this.userPick - 1; // 0-indexed
  }

  loadRookies() {
    // Return all rookies sorted by ADP
    return getRookiesByADP().map(r => ({ ...r, available: true }));
  }

  generateDraftOrder(numTeams) {
    // Generate team names/ids
    return Array.from({ length: numTeams }, (_, i) => ({
      teamIndex: i,
      teamName: i === this.userPick - 1 ? 'YOU' : `Team ${i + 1}`,
      isUser: i === this.userPick - 1
    }));
  }

  getCurrentPick() {
    const round = this.currentRound;
    const totalPicks = this.picks.length;
    const pickInRound = totalPicks % this.numTeams || this.numTeams;

    // Snake draft logic
    let teamIndex;
    if (round % 2 === 1) {
      // Odd rounds: 1, 2, 3, ..., N
      teamIndex = pickInRound - 1;
    } else {
      // Even rounds: N, N-1, ..., 2, 1
      teamIndex = this.numTeams - pickInRound;
    }

    return {
      pick: totalPicks + 1,
      round,
      pickInRound,
      teamIndex,
      team: this.draftOrder[teamIndex],
      isUserPick: teamIndex === this.userTeamIndex
    };
  }

  userMakePick(playerId) {
    const current = this.getCurrentPick();

    if (!current.isUserPick) {
      throw new Error('Not your pick!');
    }

    const player = this.available.find(p => p.id === playerId && p.available);
    if (!player) {
      throw new Error('Player not available');
    }

    // Record pick
    this.makePick(player, current);

    // Run AI picks until user's next turn
    this.runAIPicksUntilUser();
  }

  makePick(player, pickInfo) {
    // Mark player as unavailable
    const idx = this.available.findIndex(p => p.id === player.id);
    if (idx >= 0) {
      this.available[idx].available = false;
    }

    // Record the pick
    this.picks.push({
      pick: pickInfo.pick,
      round: pickInfo.round,
      pickInRound: pickInfo.pickInRound,
      teamIndex: pickInfo.teamIndex,
      teamName: pickInfo.team.teamName,
      player: { ...player }
    });

    // Update round if needed
    if (this.picks.length % this.numTeams === 0) {
      this.currentRound++;
    }
  }

  runAIPicksUntilUser() {
    while (!this.isDraftComplete()) {
      const current = this.getCurrentPick();

      if (current.isUserPick) {
        break; // Stop when it's user's turn
      }

      // AI makes pick
      const player = this.aiMakePick(current.teamIndex);
      this.makePick(player, current);
    }
  }

  aiMakePick(teamIndex) {
    // AI draft logic: Mix of BPA (Best Player Available) and positional need
    const teamPicks = this.getTeamPicks(teamIndex);
    const needs = this.calculateNeeds(teamPicks);

    // Get available players
    const availablePlayers = this.available.filter(p => p.available);

    // 70% of time: draft best available player
    // 30% of time: reach for positional need
    const shouldReachForNeed = Math.random() < 0.3;

    let selectedPlayer;

    if (shouldReachForNeed && needs.length > 0) {
      // Filter by needed positions
      const needsPlayers = availablePlayers.filter(p => needs.includes(p.position));

      if (needsPlayers.length > 0) {
        // Pick best player from needed position with some variance
        selectedPlayer = this.selectWithVariance(needsPlayers);
      } else {
        // No needs available, go BPA
        selectedPlayer = this.selectWithVariance(availablePlayers);
      }
    } else {
      // Go BPA with variance
      selectedPlayer = this.selectWithVariance(availablePlayers);
    }

    return selectedPlayer || availablePlayers[0];
  }

  selectWithVariance(players) {
    // Add some randomness: pick from top 5 available
    const topPlayers = players.slice(0, Math.min(5, players.length));

    // Weight heavily toward top picks but allow reaches
    const weights = [0.5, 0.25, 0.15, 0.07, 0.03];
    const rand = Math.random();
    let cumulative = 0;

    for (let i = 0; i < topPlayers.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) {
        return topPlayers[i];
      }
    }

    return topPlayers[0];
  }

  calculateNeeds(teamPicks) {
    // Determine what positions the team needs
    const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };

    teamPicks.forEach(pick => {
      const pos = pick.player.position;
      if (positionCounts[pos] !== undefined) {
        positionCounts[pos]++;
      }
    });

    // Define needs based on roster composition
    const needs = [];

    // Need at least 1 QB
    if (positionCounts.QB === 0) needs.push('QB');

    // Need at least 2 RBs
    if (positionCounts.RB < 2) needs.push('RB');

    // Need at least 2 WRs
    if (positionCounts.WR < 2) needs.push('WR');

    // Need at least 1 TE
    if (positionCounts.TE === 0) needs.push('TE');

    return needs;
  }

  getTeamPicks(teamIndex) {
    return this.picks.filter(p => p.teamIndex === teamIndex);
  }

  getUserPicks() {
    return this.getTeamPicks(this.userTeamIndex);
  }

  getRecommendations() {
    // Return top 3-5 recommendations for user's next pick
    const userPicks = this.getUserPicks();
    const needs = this.calculateNeeds(userPicks);
    const availablePlayers = this.available.filter(p => p.available);

    const recommendations = [];

    // BPA recommendation
    const bpa = availablePlayers[0];
    if (bpa) {
      recommendations.push({
        player: bpa,
        reason: 'Best Player Available',
        type: 'bpa'
      });
    }

    // Need-based recommendations
    needs.forEach(pos => {
      const bestAtPos = availablePlayers.find(p => p.position === pos);
      if (bestAtPos && !recommendations.find(r => r.player.id === bestAtPos.id)) {
        recommendations.push({
          player: bestAtPos,
          reason: `Best ${pos} - Team Need`,
          type: 'need'
        });
      }
    });

    // Value pick (player fallen from ADP)
    const valuePick = availablePlayers.find(p => {
      const picksDifference = this.picks.length - (p.adp * this.numTeams);
      return picksDifference > 6; // Fallen at least 6 picks from ADP
    });

    if (valuePick && !recommendations.find(r => r.player.id === valuePick.id)) {
      recommendations.push({
        player: valuePick,
        reason: 'Value Pick - Fallen from ADP',
        type: 'value'
      });
    }

    return recommendations.slice(0, 5);
  }

  getDraftGrade(teamPicks) {
    // Grade picks based on ADP vs actual pick
    if (!teamPicks || teamPicks.length === 0) {
      return { grade: 'N/A', score: 0, analysis: [] };
    }

    let totalScore = 0;
    const analysis = [];

    teamPicks.forEach(pick => {
      const expectedPick = pick.player.adp * this.numTeams;
      const actualPick = pick.pick;
      const difference = expectedPick - actualPick;

      let pickScore = 0;
      let verdict = '';

      if (difference > 10) {
        pickScore = 95; // Steal
        verdict = 'STEAL 🔥';
      } else if (difference > 5) {
        pickScore = 85; // Great value
        verdict = 'Great Value ✓';
      } else if (difference > 0) {
        pickScore = 75; // Good pick
        verdict = 'Good Pick';
      } else if (difference > -5) {
        pickScore = 65; // Slight reach
        verdict = 'Slight Reach';
      } else if (difference > -10) {
        pickScore = 50; // Reach
        verdict = 'Reach';
      } else {
        pickScore = 30; // Big reach
        verdict = 'Big Reach ⚠';
      }

      totalScore += pickScore;

      analysis.push({
        pick: pick.pick,
        round: pick.round,
        player: pick.player.name,
        position: pick.player.position,
        adp: pick.player.adp.toFixed(2),
        score: pickScore,
        verdict
      });
    });

    const avgScore = totalScore / teamPicks.length;
    let grade = 'F';

    if (avgScore >= 90) grade = 'A+';
    else if (avgScore >= 85) grade = 'A';
    else if (avgScore >= 80) grade = 'A-';
    else if (avgScore >= 75) grade = 'B+';
    else if (avgScore >= 70) grade = 'B';
    else if (avgScore >= 65) grade = 'B-';
    else if (avgScore >= 60) grade = 'C+';
    else if (avgScore >= 55) grade = 'C';
    else if (avgScore >= 50) grade = 'C-';
    else if (avgScore >= 45) grade = 'D';

    return { grade, score: Math.round(avgScore), analysis };
  }

  isDraftComplete() {
    return this.picks.length >= this.numTeams * this.rounds;
  }

  simToUserPick() {
    // Simulate AI picks until it's the user's turn
    this.runAIPicksUntilUser();
  }

  getAvailablePlayers() {
    return this.available.filter(p => p.available);
  }

  getDraftBoard() {
    // Return picks organized by round and pick
    const board = [];

    for (let round = 1; round <= this.rounds; round++) {
      const roundPicks = [];

      for (let pickInRound = 1; pickInRound <= this.numTeams; pickInRound++) {
        const overallPick = (round - 1) * this.numTeams + pickInRound;
        const pick = this.picks.find(p => p.pick === overallPick);

        // Determine team index for this pick (snake draft)
        let teamIndex;
        if (round % 2 === 1) {
          teamIndex = pickInRound - 1;
        } else {
          teamIndex = this.numTeams - pickInRound;
        }

        roundPicks.push({
          pick: overallPick,
          round,
          pickInRound,
          teamIndex,
          teamName: this.draftOrder[teamIndex].teamName,
          isUser: teamIndex === this.userTeamIndex,
          player: pick?.player || null
        });
      }

      board.push(roundPicks);
    }

    return board;
  }
}

export default MockDraft;
