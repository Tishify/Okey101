# Game End Conditions - Implementation Guide

## Overview

This implementation handles all three game end conditions for Okey 101, including proper scoring and joker penalties. The game can end in three different ways, each with specific scoring rules.

## Game End Conditions

### 1. Player Wins by Going Out
**Description:** A player melds all their tiles except one, and discards the last tile.

**Implementation:**
- Player's hand becomes empty (length = 0)
- Player is declared the winner
- All other players receive penalty points

**Scoring Rules:**
- **Winner:** Gets -101 points (negative score = win)
- **Other Players:** 
  - If they dropped combinations: Penalty based on remaining stones + joker penalty (if any)
  - If they haven't dropped combinations: Double penalty + joker penalty (if any)
  - Joker penalty: +101 points if holding a joker

### 2. Drawing Stack Exhausted (NEW)
**Description:** The face-down drawing stack is completely consumed, leaving only the exposed tile that determines the joker, and the next player chooses not to take the previous discard.

**Implementation:**
- `remaining_decks.length === 0`
- Only players who have completed their first meld (≥101 points) are eligible for scoring
- Lowest total score wins the round
- Players who haven't opened receive no scoring

**Scoring Rules:**
- **Eligible Players (have opened):** Sum of remaining tile values (lowest wins)
- **Ineligible Players (haven't opened):** No score (excluded from ranking)
- **Tile Values:** Face value (1-13 points), jokers = value they represent
- **Winner:** Player(s) with lowest score among eligible players
- **Ties:** Multiple winners possible

### 3. No Tiles Left to Draw (Legacy)
**Description:** The drawing stacks are empty, leaving only the exposed tile that determines the joker.

**Implementation:**
- `remaining_decks.length === 0` (legacy scenario)
- No winner declared
- Game ends immediately when next player can't draw

**Scoring Rules:**
- **All Players:**
  - If they dropped combinations: Score based on remaining stones + joker penalty (if any)
  - If they haven't dropped combinations: Joker penalty only (if any)
  - Joker penalty: +101 points if holding a joker

### 4. All Players Meld Only Pairs
**Description:** If all four players have only pairs on the table, no player can win.

**Implementation:**
- All players must have dropped combinations
- All players must have only pairs in hand
- No winner declared

**Scoring Rules:**
- **All Players:** Joker penalty only (if any)
- Joker penalty: +101 points if holding a joker

## Technical Implementation

### Server-Side (server/server.js)

#### Game End Detection
```javascript
function checkGameEnd() {
  // Check if any player has empty hand (Player Wins by Going Out)
  for (let player of onlinePlayers) {
    if (player.destesi.length === 0) {
      gameEndReason = 'hand_empty';
      winner = player.player;
      gameActive = false;
      return true;
    }
  }
  
  // Check if deck is empty (Drawing Stack Exhausted)
  if (remaining_decks.length === 0) {
    gameEndReason = 'drawing_stack_exhausted';
    winner = null; // No immediate winner, need to determine based on scoring
    gameActive = false;
    return true;
  }
  
  // Check if all players have only pairs (All Players Meld Only Pairs)
  if (checkAllPlayersHaveOnlyPairs()) {
    gameEndReason = 'all_pairs';
    winner = null; // No winner when all players have only pairs
    gameActive = false;
    return true;
  }
  
  return false;
}
```

#### Winner Determination for Drawing Stack Exhausted
```javascript
function determineWinnerFromScores(finalScores) {
  // Filter out players who haven't opened (null scores)
  const eligibleScores = Object.entries(finalScores)
    .filter(([playerId, score]) => score !== null)
    .map(([playerId, score]) => ({ playerId: parseInt(playerId), score }));
  
  if (eligibleScores.length === 0) {
    // No players have opened - no-score draw
    return { winners: [], isDraw: true };
  }
  
  // Find the lowest score (lowest wins)
  const minScore = Math.min(...eligibleScores.map(entry => entry.score));
  const winners = eligibleScores
    .filter(entry => entry.score === minScore)
    .map(entry => entry.playerId);
  
  return { 
    winners, 
    isDraw: winners.length > 1,
    winningScore: minScore
  };
}
```

#### Scoring Function
```javascript
function calculateFinalScores() {
  const finalScores = {};
  
  for (let player of onlinePlayers) {
    const playerScore = calculatePlayerScore(player.destesi);
    const hasDroppedCombinations = playersWhoDroppedCombinations.has(player.player);
    const hasJoker = hasJokerInHand(player.destesi);
    
    if (gameEndReason === 'hand_empty') {
      // Player Wins by Going Out
      if (player.player === winner) {
        finalScores[player.player] = -101;
      } else {
        let penalty = playerScore;
        if (hasJoker) penalty += 101;
        
        if (hasDroppedCombinations) {
          finalScores[player.player] = penalty;
        } else {
          finalScores[player.player] = penalty * 2;
        }
      }
    } else if (gameEndReason === 'drawing_stack_exhausted') {
      // Drawing Stack Exhausted - Only first-meld players are eligible for scoring
      if (hasDroppedCombinations) {
        // Players who have opened (completed first meld) get scored
        finalScores[player.player] = playerScore;
      } else {
        // Players who haven't opened get no score (excluded from ranking)
        finalScores[player.player] = null; // null indicates no score/not eligible
      }
    } else if (gameEndReason === 'deck_empty') {
      // Legacy deck empty scenario (keeping for backward compatibility)
      let score = 0;
      if (hasJoker) score += 101;
      
      if (hasDroppedCombinations) {
        score += playerScore;
      }
      finalScores[player.player] = score;
    } else if (gameEndReason === 'all_pairs') {
      // All Players Meld Only Pairs
      let score = 0;
      if (hasJoker) score += 101;
      finalScores[player.player] = score;
    }
  }
  
  return finalScores;
}
```

#### Helper Functions
```javascript
// Check if player has joker in hand
function hasJokerInHand(playerDeck) {
  return playerDeck.some(stone => stone.isJoker || stone.isFalseJoker);
}

// Check if all players have only pairs
function checkAllPlayersHaveOnlyPairs() {
  let allPlayersHavePairs = true;
  
  for (let player of onlinePlayers) {
    if (!playersWhoDroppedCombinations.has(player.player)) {
      allPlayersHavePairs = false;
      break;
    }
    
    if (!hasOnlyPairsInHand(player.destesi)) {
      allPlayersHavePairs = false;
      break;
    }
  }
  
  return allPlayersHavePairs;
}

// Check if player has only pairs in hand
function hasOnlyPairsInHand(playerDeck) {
  if (playerDeck.length === 0 || playerDeck.length % 2 !== 0) {
    return false;
  }
  
  const stoneGroups = {};
  playerDeck.forEach(stone => {
    const key = stone.numb;
    if (!stoneGroups[key]) {
      stoneGroups[key] = [];
    }
    stoneGroups[key].push(stone);
  });
  
  for (const [key, stones] of Object.entries(stoneGroups)) {
    if (stones.length !== 2) {
      return false;
    }
  }
  
  return true;
}
```

### Client-Side (client/main.js)

#### Game End Display
```javascript
socket.on('game ended', function(data) {
  let gameEndHTML = '<h2>Game Ended</h2>';
  
  if (data.reason === 'hand_empty') {
    const winnerName = list_of_gamers.find(p => p.player === data.winner)?.playernickname || `Player ${data.winner}`;
    gameEndHTML += `<p><strong>Winner: ${winnerName}</strong></p>`;
    gameEndHTML += '<p>Reason: Player emptied their hand (went out)</p>';
  } else if (data.reason === 'drawing_stack_exhausted') {
    if (data.isDraw) {
      const winnerNames = data.winners.map(w => list_of_gamers.find(p => p.player === w)?.playernickname || `Player ${w}`).join(', ');
      gameEndHTML += `<p><strong>Winners: ${winnerNames}</strong> (Tie)</p>`;
      gameEndHTML += `<p>Reason: Drawing stack exhausted - lowest score wins (${data.winningScore} points)</p>`;
    } else if (data.winner) {
      const winnerName = list_of_gamers.find(p => p.player === data.winner)?.playernickname || `Player ${data.winner}`;
      gameEndHTML += `<p><strong>Winner: ${winnerName}</strong></p>`;
      gameEndHTML += `<p>Reason: Drawing stack exhausted - lowest score wins (${data.winningScore} points)</p>`;
    } else {
      gameEndHTML += '<p><strong>No Winner</strong></p>';
      gameEndHTML += '<p>Reason: Drawing stack exhausted - no players have opened</p>';
    }
  } else if (data.reason === 'deck_empty') {
    gameEndHTML += '<p><strong>No Winner</strong></p>';
    gameEndHTML += '<p>Reason: No tiles left to draw</p>';
  } else if (data.reason === 'all_pairs') {
    gameEndHTML += '<p><strong>No Winner</strong></p>';
    gameEndHTML += '<p>Reason: All players have only pairs</p>';
  }
  
  // Display scores with special handling for drawing stack exhausted
  for (let player of list_of_gamers) {
    const score = data.scores[player.player];
    const hasDropped = data.playersWhoDropped.includes(player.player);
    
    if (data.reason === 'drawing_stack_exhausted') {
      if (score === null) {
        // Player hasn't opened - no score
        gameEndHTML += `<p><strong>${player.playernickname}:</strong> <em>No score (hasn't opened)</em></p>`;
      } else {
        // Player has opened - show score
        const scoreText = score > 0 ? `+${score}` : score.toString();
        gameEndHTML += `<p><strong>${player.playernickname}:</strong> ${scoreText} (Opened player)</p>`;
      }
    } else {
      // Other game end scenarios
      const scoreValue = score || 0;
      const scoreText = scoreValue > 0 ? `+${scoreValue}` : scoreValue.toString();
      const droppedText = hasDropped ? ' (Dropped combinations)' : ' (No combinations)';
      
      let jokerText = '';
      if (scoreValue >= 101 && hasDropped) {
        jokerText = ' (Includes joker penalty)';
      } else if (scoreValue >= 101 && !hasDropped) {
        jokerText = ' (Joker penalty only)';
      }
      
      gameEndHTML += `<p><strong>${player.playernickname}:</strong> ${scoreText}${droppedText}${jokerText}</p>`;
    }
  }
});
```

#### Go Out Detection
```javascript
// Check if player can go out (has valid combinations for all stones except one)
function checkCanGoOut() {
  const stonesInHand = getStonesInHand();
  
  if (stonesInHand.length < 2 || !hasCompletedInitialMeld()) {
    return false;
  }
  
  // Try to find valid combinations for all stones except one
  for (let i = 0; i < stonesInHand.length; i++) {
    const stonesForCombination = stonesInHand.filter((_, index) => index !== i);
    
    if (canFormValidCombinations(stonesForCombination)) {
      return true;
    }
  }
  
  return false;
}
```

## Usage Examples

### Example 1: Player Goes Out
1. Player discards last stone → Game ends
2. Winner: -101 points
3. Others: Penalties based on remaining stones

### Example 2: Drawing Stack Exhausted
1. Drawing stack becomes empty
2. Next player declines discard → Game ends
3. **Player A (opened):** 15 points remaining
4. **Player B (opened):** 8 points remaining ← **Winner**
5. **Player C (not opened):** No score
6. **Player D (not opened):** No score

### Example 3: Drawing Stack Exhausted with Tie
1. Drawing stack becomes empty
2. Next player declines discard → Game ends
3. **Player A (opened):** 12 points remaining ← **Winner (tie)**
4. **Player B (opened):** 12 points remaining ← **Winner (tie)**
5. **Player C (not opened):** No score
6. **Player D (not opened):** No score

### Example 4: No Players Opened
1. Drawing stack becomes empty
2. Next player declines discard → Game ends
3. **All players:** No score (haven't opened)
4. **Result:** No-score draw

### Example 5: All Players Have Only Pairs
1. All players have only pairs → Game ends
2. **All players:** Joker penalty only (if any)
3. **Result:** No winner

## Testing

### Test Buttons
- 🏁 **Test Can Go Out**: Checks if current player can go out
- 🃏 **Test All Pairs End**: Triggers all pairs game end (Player 1 only)
- 🎯 **Test Drawing Stack Exhausted**: Tests drawing stack exhausted scenario (Player 1 only)

### Manual Testing
1. **Go Out Test**: Get down to 1 stone and try to finish hand
2. **Drawing Stack Exhausted Test**: Use test button to simulate scenario
3. **All Pairs Test**: Use test button to simulate all pairs scenario

## Scoring Summary

| Scenario | Winner | Dropped Combinations | Has Joker | Score |
|----------|--------|---------------------|-----------|-------|
| **Go Out** | Yes | - | - | -101 |
| **Go Out** | No | Yes | No | Remaining stones |
| **Go Out** | No | Yes | Yes | Remaining stones + 101 |
| **Go Out** | No | No | No | Remaining stones × 2 |
| **Go Out** | No | No | Yes | (Remaining stones × 2) + 101 |
| **Drawing Stack Exhausted** | - | Yes | - | Remaining stones (lowest wins) |
| **Drawing Stack Exhausted** | - | No | - | No score (not eligible) |
| **Deck Empty (Legacy)** | - | Yes | No | Remaining stones |
| **Deck Empty (Legacy)** | - | Yes | Yes | Remaining stones + 101 |
| **Deck Empty (Legacy)** | - | No | No | 0 |
| **Deck Empty (Legacy)** | - | No | Yes | 101 |
| **All Pairs** | - | - | No | 0 |
| **All Pairs** | - | - | Yes | 101 |

## Error Handling

### Common Issues
1. **Game doesn't end**: Check if `checkGameEnd()` is called after each action
2. **Wrong scoring**: Verify joker detection and combination tracking
3. **Winner not determined**: Check eligibility for drawing stack exhausted scenario

### Debug Tools
- Server console logging for game end detection
- Client-side score display with detailed breakdown
- Test buttons for simulating different scenarios

## Future Enhancements

### Planned Features
- Automatic go out detection and suggestion
- Visual indicators for players close to going out
- Enhanced all pairs detection with table state tracking
- Tournament scoring system

### Potential Improvements
- AI analysis of optimal discard choices
- Replay functionality for game end scenarios
- Advanced statistics tracking
- Custom scoring rules support

## Conclusion

This implementation provides comprehensive game end condition handling for Okey 101, including the new "Drawing Stack Exhausted" scenario with proper first-meld eligibility rules and lowest-score-wins logic. The system handles all four end scenarios with appropriate scoring and provides clear feedback to players about game outcomes. 