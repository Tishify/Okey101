const app = require('./app');
const server = require('http').createServer(app);
const io = require("socket.io")(server);
const { gameStart, findPlayer } = require('./module');

// Performance optimizations
const DEBUG_MODE = process.env.NODE_ENV === 'development';
const PLAYER_CACHE = new Map();
const GAME_STATE_CACHE = new Map();

// Optimized logging function
function log(message, ...args) {
  if (DEBUG_MODE) {
    console.log(message, ...args);
  }
}

// Cache player lookup
function findPlayerCached(socketId, players) {
  const cacheKey = `${socketId}_${players.length}`;
  if (PLAYER_CACHE.has(cacheKey)) {
    return PLAYER_CACHE.get(cacheKey);
  }
  
  const result = findPlayer(socketId, players);
  PLAYER_CACHE.set(cacheKey, result);
  return result;
}

// Clear player cache when needed
function clearPlayerCache() {
  PLAYER_CACHE.clear();
}

// Calculate score for a player based on remaining stones
function calculatePlayerScore(playerDeck) {
  let score = 0;
  for (let stone of playerDeck) {
    if (stone && stone.numb && !isNaN(parseInt(stone.numb))) {
      score += parseInt(stone.numb);
    } else if (stone && stone.isJoker) {
      // Jokers are scored based on what they represent
      // For scoring purposes, use the joker number (one higher than indicator)
      if (okey && okey.numb) {
        let jokerNumber;
        if (okey.numb === "13") {
          jokerNumber = 1;
        } else {
          jokerNumber = parseInt(okey.numb) + 1;
        }
        score += jokerNumber;
      } else {
        // Fallback: use average value
        score += 7;
      }
    } else if (stone && stone.isFalseJoker) {
      // False jokers represent the joker tile value
      if (okey && okey.numb) {
        let jokerNumber;
        if (okey.numb === "13") {
          jokerNumber = 1;
        } else {
          jokerNumber = parseInt(okey.numb) + 1;
        }
        score += jokerNumber;
      } else {
        // Fallback: use average value
        score += 7;
      }
    }
  }
  return score;
}

// Check if game should end
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

// Function to check if all players have only pairs
function checkAllPlayersHaveOnlyPairs() {
  // This is a complex check that would require tracking table state
  // For now, we'll implement a basic version that checks if all players
  // have dropped combinations and have only pairs in hand
  
  let allPlayersHavePairs = true;
  
  for (let player of onlinePlayers) {
    // Skip players who haven't dropped any combinations
    if (!playersWhoDroppedCombinations.has(player.player)) {
      allPlayersHavePairs = false;
      break;
    }
    
    // Check if player has only pairs in hand
    if (!hasOnlyPairsInHand(player.destesi)) {
      allPlayersHavePairs = false;
      break;
    }
  }
  
  return allPlayersHavePairs;
}

// Function to check if player has only pairs in hand
function hasOnlyPairsInHand(playerDeck) {
  if (playerDeck.length === 0) {
    return false; // Empty hand means they won
  }
  
  if (playerDeck.length % 2 !== 0) {
    return false; // Odd number of stones can't be all pairs
  }
  
  // Group stones by their value
  const stoneGroups = {};
  playerDeck.forEach(stone => {
    const key = stone.numb;
    if (!stoneGroups[key]) {
      stoneGroups[key] = [];
    }
    stoneGroups[key].push(stone);
  });
  
  // Check if all groups have exactly 2 stones (pairs)
  for (const [key, stones] of Object.entries(stoneGroups)) {
    if (stones.length !== 2) {
      return false;
    }
  }
  
  return true;
}

// Calculate final scores for all players
function calculateFinalScores() {
  const finalScores = {};
  
  for (let player of onlinePlayers) {
    const playerScore = calculatePlayerScore(player.destesi);
    const hasDroppedCombinations = playersWhoDroppedCombinations.has(player.player);
    const hasJoker = hasJokerInHand(player.destesi);
    
    if (gameEndReason === 'hand_empty') {
      // Player Wins by Going Out
      if (player.player === winner) {
        // Winner gets negative score (they win)
        finalScores[player.player] = -101;
      } else {
        // Other players get penalty based on remaining stones
        let penalty = playerScore;
        
        // Add joker penalty if player has joker
        if (hasJoker) {
          penalty += 101;
        }
        
        if (hasDroppedCombinations) {
          finalScores[player.player] = penalty;
        } else {
          // Players who haven't dropped combinations get double penalty
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
      
      // Add joker penalty if player has joker
      if (hasJoker) {
        score += 101;
      }
      
      if (hasDroppedCombinations) {
        // Players who dropped combinations get score based on remaining stones
        score += playerScore;
      }
      // Players who haven't dropped combinations get no additional score
      
      finalScores[player.player] = score;
    } else if (gameEndReason === 'all_pairs') {
      // All Players Meld Only Pairs
      let score = 0;
      
      // Add joker penalty if player has joker
      if (hasJoker) {
        score += 101;
      }
      
      // No additional scoring for remaining stones in this scenario
      finalScores[player.player] = score;
    }
  }
  
  return finalScores;
}

// Function to check if player has joker in hand
function hasJokerInHand(playerDeck) {
  return playerDeck.some(stone => stone.isJoker || stone.isFalseJoker);
}

// Function to determine winner when drawing stack is exhausted
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

let onlinePlayers = new Array; //TODO: Should not be more than 4 people!
var currentPlayer = 1;
let stonePull = false;  // !???
let remaining_decks = [];

// Game state tracking
let gameActive = false;
let gameEndReason = null; // 'hand_empty' or 'deck_empty'
let winner = null;
let playerScores = new Map(); // Track scores for each player
let playersWhoDroppedCombinations = new Set(); // Track who has dropped combinations
let playersInitialMeld = new Set(); // Track who has made their initial meld
let currentTurnPlayer = 1; // Track whose turn it is
let playersWhoDiscardedAfterMeld = new Set(); // Track who has discarded after melding

io.on('connection', (socket) => {
  const soketID = socket.id;
  log('User connected: ' + soketID);
  io.emit('players', onlinePlayers);

  socket.on('name information', (name) => {
    // Optimized name processing
    name = name.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
    const playerIndex = onlinePlayers.length + 1;
    const player = { player: playerIndex, id: soketID, playernickname: name };
    
    if (onlinePlayers.length === 0) {
      player.isFirstPlayer = true;
    }
    
    onlinePlayers.push(player);
    log('Player added:', player.playernickname);
    io.emit('players', onlinePlayers);
    
    if (onlinePlayers.length === 4) { // FOR TESTING === 1 ELSE 4.
      const [ okeystone, indicatorstone, onlineList, remaining_deck ] = gameStart(onlinePlayers);
      
      // Reset old parameters when new game starts:
      currentPlayer = 1;
      stonePull = true; // First player should have the right to draw stones
      onlinePlayers = onlineList;
      remaining_decks = remaining_deck;
      okey = okeystone;
      
      // Initialize game state
      gameActive = true;
      gameEndReason = null;
      winner = null;
      playerScores.clear();
      playersWhoDroppedCombinations.clear();
      
      // Clear caches for new game
      clearPlayerCache();
      GAME_STATE_CACHE.clear();
      
      // Optimized deck distribution
      const gameData = {
        current: currentPlayer,
        stoneRights: stonePull,
        remainingStones: remaining_deck.length
      };
      
      onlinePlayers.forEach((player, index) => {
        const playerData = {
          gameInfo: "Game begins...",
          indicatorStone: indicatorstone,
          board: onlinePlayers[index].destesi,
          player: {
            current: currentPlayer, 
            you: onlinePlayers[index].player,
            ilkBaşlar: player.isFirstPlayer,
            okeystone: okey,
          }
        };
        
        // Send all data in optimized batches
        io.to(player.id).emit('game info', playerData.gameInfo);
        io.to(player.id).emit('indicator stone', playerData.indicatorStone);
        io.to(player.id).emit('your board', playerData.board);
        io.to(player.id).emit('player', playerData.player);
        io.to(player.id).emit('number of remaining stones', playerData.remainingStones);
      });
      
      // Send initial turn information to all players
      io.emit('current player', gameData);
    }
  });

  socket.on("throw stones on the ground", (element) => {
    try {
      const findThePlayer = findPlayerCached(soketID, onlinePlayers);
      var playerRank = findThePlayer[0].player;
      
      if (playerRank === currentPlayer) {
        // Mark that this player has discarded after melding
        playersWhoDiscardedAfterMeld.add(playerRank);
        
        currentPlayer = currentPlayer === 4 ? 1 : currentPlayer + 1;
        stonePull = true;
        
        // Reset discarded flag for the new player
        playersWhoDiscardedAfterMeld.delete(currentPlayer);
        
        log("Turn passed to player:", currentPlayer);
        
        // Optimized event emission
        const turnData = {
          current: currentPlayer,
          stoneRights: stonePull
        };
        
        const stoneData = {
          whoSentStone: playerRank,
          stone: element.stone
        };
        
        io.emit('current player', turnData);
        io.emit('table stone', stoneData);
      }
    } catch (error) {
      log('Error in throw stones:', error);
    }
  });

  socket.on('ask for new stone', (information) => {
    log("Received 'ask for new stone' request from player:", information.player);
    const find_player = findPlayerCached(soketID, onlinePlayers);
    log("Found player:", find_player[0].playernickname);
    
    var player_deck = find_player[0].destesi;
    log("Player deck length before:", player_deck.length);

    /*if (player_deck.length >= 16) {
      log("Player already has 16 stones, cannot take more");
      return;
    }*/

    // Allow drawing until deck is completely empty (count reaches 0)
    if (remaining_decks.length === 0) {
      log("Deck is completely empty! Game should end according to Okey 101 rules.");
      
      // Check if game should end
      if (checkGameEnd()) {
        const finalScores = calculateFinalScores();
        
        // Determine winner based on game end reason
        let gameWinner = winner;
        let isDraw = false;
        let winningScore = null;
        
        if (gameEndReason === 'drawing_stack_exhausted') {
          const winnerResult = determineWinnerFromScores(finalScores);
          gameWinner = winnerResult.winners.length > 0 ? winnerResult.winners[0] : null;
          isDraw = winnerResult.isDraw;
          winningScore = winnerResult.winningScore;
        }
        
        // Send game end event to all players
        io.emit('game ended', {
          reason: gameEndReason,
          winner: gameWinner,
          winners: gameEndReason === 'drawing_stack_exhausted' ? winnerResult.winners : [winner],
          isDraw: isDraw,
          winningScore: winningScore,
          scores: finalScores,
          playersWhoDropped: Array.from(playersWhoDroppedCombinations)
        });
        
        log(`Game ended - Reason: ${gameEndReason}, Winner: ${gameWinner}, Is Draw: ${isDraw}`);
        log(`Final scores:`, finalScores);
      }
      
      io.to(soketID).emit('deck_empty', { message: "Deck is completely empty - game should end" });
      return;
    }

    let new_stone = remaining_decks.pop();
    log("Server sending new stone:", new_stone);
    
    // Double-check that we got a valid stone
    if (!new_stone) {
      log("Error: Received undefined stone from deck!");
      io.to(soketID).emit('deck_error', { message: "Error drawing stone from deck" });
      return;
    }
    
    find_player[0].destesi.push(new_stone);
    log("Player deck length after:", find_player[0].destesi.length);
    
    io.to(soketID).emit('yeni taş', new_stone);
    log("Sent 'yeni taş' event to player");

    log("Number of new stones remaining: " + remaining_decks.length);
    io.emit('number of remaining stones', remaining_decks.length);
    log("Sent 'number of remaining stones' event to all players");
    
    log("Player drew stone from middle deck, keeping turn for stone throwing");
  });

  socket.on('stone puller', (info) => {
    log("Player", info.player, "took stone from previous player");
    socket.broadcast.emit('stone puller', info.player);
    log("Player took stone from previous player, keeping turn for stone throwing");
  });

  socket.on('handisfinished', (finishing_hand) => {
    const find_player = findPlayerCached(soketID, onlinePlayers);
    const playerName = find_player[0].playernickname;
    
    log(`Player ${playerName} finished their hand!`);
    
    // Check if game should end
    if (checkGameEnd()) {
      const finalScores = calculateFinalScores();
      
      // Determine winner based on game end reason
      let gameWinner = winner;
      let isDraw = false;
      let winningScore = null;
      
      if (gameEndReason === 'drawing_stack_exhausted') {
        const winnerResult = determineWinnerFromScores(finalScores);
        gameWinner = winnerResult.winners.length > 0 ? winnerResult.winners[0] : null;
        isDraw = winnerResult.isDraw;
        winningScore = winnerResult.winningScore;
      }
      
      // Send game end event to all players
      io.emit('game ended', {
        reason: gameEndReason,
        winner: gameWinner,
        winners: gameEndReason === 'drawing_stack_exhausted' ? winnerResult.winners : [winner],
        isDraw: isDraw,
        winningScore: winningScore,
        scores: finalScores,
        playersWhoDropped: Array.from(playersWhoDroppedCombinations)
      });
      
      log(`Game ended - Reason: ${gameEndReason}, Winner: ${gameWinner}, Is Draw: ${isDraw}`);
      log(`Final scores:`, finalScores);
    }
    
    io.emit('finished', finishing_hand);
  });

  socket.on('drop combinations to table', (data) => {
    log('Received drop combinations request:', data);
    const find_player = findPlayerCached(soketID, onlinePlayers);
    const playerName = find_player[0].playernickname;
    log(`Player ${playerName} attempting to drop combinations`);
    
    // Check if it's the player's turn
    if (find_player[0].player !== currentPlayer) {
      log(`Player ${playerName} attempted to drop combinations out of turn`);
      io.to(soketID).emit('meld_error', { 
        message: `It's not your turn. You can only drop combinations during your turn.` 
      });
      return;
    }
    
    const player_deck = find_player[0].destesi;
    const combinations = data.combinations;
    const totalPoints = data.totalPoints;
    
    // Check if this is the player's initial meld (must be at least 101 points)
    const isInitialMeld = !playersInitialMeld.has(find_player[0].player);
    
    if (isInitialMeld && totalPoints < 101) {
      log(`Player ${playerName} attempted initial meld with insufficient points: ${totalPoints}`);
      io.to(soketID).emit('meld_error', { 
        message: `Initial meld must be at least 101 points. You have ${totalPoints} points.` 
      });
      return;
    }
    
    // Check if player has drawn a stone this turn (except for first player)
    const isFirstPlayer = find_player[0].isFirstPlayer;
    const hasDrawnStone = data.hasDrawnStone || isFirstPlayer;
    
    if (!isFirstPlayer && !hasDrawnStone) {
      log(`Player ${playerName} attempted to drop combinations without drawing a stone first`);
      io.to(soketID).emit('meld_error', { 
        message: `You must draw a stone before dropping combinations.` 
      });
      return;
    }
    
    // Check if player has already discarded this turn (they can't drop combinations after discarding)
    if (playersWhoDiscardedAfterMeld.has(find_player[0].player)) {
      log(`Player ${playerName} attempted to drop combinations after already discarding`);
      io.to(soketID).emit('meld_error', { 
        message: `You have already discarded this turn. You cannot drop more combinations.` 
      });
      return;
    }
    
    // Track that this player has dropped combinations
    playersWhoDroppedCombinations.add(find_player[0].player);
    
    // Track initial meld
    if (isInitialMeld) {
      playersInitialMeld.add(find_player[0].player);
      log(`Player ${playerName} completed initial meld with ${totalPoints} points`);
    }
    
    // Optimized stone removal
    const positionsToRemove = new Set();
    combinations.forEach(combo => {
      for (let i = combo.startIndex; i <= combo.endIndex; i++) {
        positionsToRemove.add(i);
      }
    });
    
    const sortedPositions = Array.from(positionsToRemove).sort((a, b) => b - a);
    sortedPositions.forEach(position => {
      if (position < player_deck.length) {
        player_deck.splice(position, 1);
      }
    });
    
    find_player[0].destesi = player_deck;
    
    // Player continues their turn after dropping combinations
    // Don't change currentPlayer - they can continue drawing and dropping
    
    // Check if game should end after dropping combinations
    if (checkGameEnd()) {
      const finalScores = calculateFinalScores();
      
      // Determine winner based on game end reason
      let gameWinner = winner;
      let isDraw = false;
      let winningScore = null;
      
      if (gameEndReason === 'drawing_stack_exhausted') {
        const winnerResult = determineWinnerFromScores(finalScores);
        gameWinner = winnerResult.winners.length > 0 ? winnerResult.winners[0] : null;
        isDraw = winnerResult.isDraw;
        winningScore = winnerResult.winningScore;
      }
      
      // Send game end event to all players
      io.emit('game ended', {
        reason: gameEndReason,
        winner: gameWinner,
        winners: gameEndReason === 'drawing_stack_exhausted' ? winnerResult.winners : [winner],
        isDraw: isDraw,
        winningScore: winningScore,
        scores: finalScores,
        playersWhoDropped: Array.from(playersWhoDroppedCombinations)
      });
      
      log(`Game ended - Reason: ${gameEndReason}, Winner: ${gameWinner}, Is Draw: ${isDraw}`);
      log(`Final scores:`, finalScores);
    }
    
    log('Sending combinations dropped to table event to all players');
    io.emit('combinations dropped to table', {
      player: data.player,
      playerName: playerName,
      combinations: combinations,
      totalPoints: data.totalPoints,
      isInitialMeld: isInitialMeld
    });
    
    // Notify the player that they have opened (if this was their initial meld)
    if (isInitialMeld) {
      io.to(soketID).emit('player opened', {
        player: data.player,
        totalPoints: data.totalPoints
      });
    }
    
    log(`Player ${playerName} dropped combinations worth ${data.totalPoints} points`);
    log('Combinations dropped successfully');
  });

  // Handle adding stones to existing table combinations
  socket.on('add stone to table combination', (data) => {
    const find_player = findPlayerCached(soketID, onlinePlayers);
    const playerName = find_player[0].playernickname;
    
    // Check if it's the player's turn
    if (find_player[0].player !== currentPlayer) {
      log(`Player ${playerName} attempted to add stone to combination out of turn`);
      io.to(soketID).emit('add stone error', { 
        message: `It's not your turn. You can only add stones during your turn.` 
      });
      return;
    }
    
    // Check if player has completed initial meld
    if (!playersInitialMeld.has(find_player[0].player)) {
      log(`Player ${playerName} attempted to add stone without completing initial meld`);
      io.to(soketID).emit('add stone error', { 
        message: `You must complete your initial meld (101+ points) before adding stones to existing combinations.` 
      });
      return;
    }
    
    // Check if player has drawn a stone this turn
    const hasDrawnStone = data.hasDrawnStone || find_player[0].isFirstPlayer;
    if (!find_player[0].isFirstPlayer && !hasDrawnStone) {
      log(`Player ${playerName} attempted to add stone without drawing first`);
      io.to(soketID).emit('add stone error', { 
        message: `You must draw a stone before adding to combinations.` 
      });
      return;
    }
    
    const stone = data.stone;
    const targetCombination = data.targetCombination;
    const position = data.position;
    
    // Validate the operation
    const validationResult = validateAddStoneToCombination(stone, targetCombination, position);
    if (!validationResult.valid) {
      io.to(soketID).emit('add stone error', { 
        message: validationResult.message 
      });
      return;
    }
    
    // Remove stone from player's hand
    const player_deck = find_player[0].destesi;
    const stoneIndex = findStoneInDeck(stone, player_deck);
    if (stoneIndex === -1) {
      log(`Player ${playerName} attempted to add stone not in their hand`);
      io.to(soketID).emit('add stone error', { 
        message: `Stone not found in your hand.` 
      });
      return;
    }
    
    player_deck.splice(stoneIndex, 1);
    find_player[0].destesi = player_deck;
    
    // Process the addition
    const result = processAddStoneToCombination(stone, targetCombination, position);
    
    // Send result to all players
    if (result.splitResult) {
      io.emit('combination split', {
        player: data.player,
        playerName: playerName,
        stone: stone,
        originalCombination: targetCombination,
        splitResult: result.splitResult
      });
    } else {
      io.emit('stone added to combination', {
        player: data.player,
        playerName: playerName,
        stone: stone,
        originalCombination: targetCombination,
        updatedCombination: result.updatedCombination
      });
    }
    
    log(`Player ${playerName} added stone ${stone.numb} to combination`);
  });

  // Handle placing new combinations after initial meld
  socket.on('place new combination', (data) => {
    const find_player = findPlayerCached(soketID, onlinePlayers);
    const playerName = find_player[0].playernickname;
    
    // Check if it's the player's turn
    if (find_player[0].player !== currentPlayer) {
      log(`Player ${playerName} attempted to place new combination out of turn`);
      io.to(soketID).emit('new combination error', { 
        message: `It's not your turn. You can only place combinations during your turn.` 
      });
      return;
    }
    
    // Check if player has completed initial meld
    if (!playersInitialMeld.has(find_player[0].player)) {
      log(`Player ${playerName} attempted to place new combination without completing initial meld`);
      io.to(soketID).emit('new combination error', { 
        message: `You must complete your initial meld (101+ points) before placing new combinations.` 
      });
      return;
    }
    
    // Check if player has drawn a stone this turn
    const hasDrawnStone = data.hasDrawnStone || find_player[0].isFirstPlayer;
    if (!find_player[0].isFirstPlayer && !hasDrawnStone) {
      log(`Player ${playerName} attempted to place new combination without drawing first`);
      io.to(soketID).emit('new combination error', { 
        message: `You must draw a stone before placing new combinations.` 
      });
      return;
    }
    
    const combination = data.combination;
    
    // Validate the combination
    const validationResult = validateNewCombination(combination, find_player[0].destesi);
    if (!validationResult.valid) {
      io.to(soketID).emit('new combination error', { 
        message: validationResult.message 
      });
      return;
    }
    
    // Remove stones from player's hand
    const player_deck = find_player[0].destesi;
    const positionsToRemove = combination.stones.map(stone => stone.boardIndex).sort((a, b) => b - a);
    
    positionsToRemove.forEach(index => {
      if (index < player_deck.length) {
        player_deck.splice(index, 1);
      }
    });
    
    find_player[0].destesi = player_deck;
    
    // Track that this player has placed a new combination
    playersWhoDroppedCombinations.add(find_player[0].player);
    
    // Check if game should end after placing combination
    if (checkGameEnd()) {
      const finalScores = calculateFinalScores();
      
      // Determine winner based on game end reason
      let gameWinner = winner;
      let isDraw = false;
      let winningScore = null;
      
      if (gameEndReason === 'drawing_stack_exhausted') {
        const winnerResult = determineWinnerFromScores(finalScores);
        gameWinner = winnerResult.winners.length > 0 ? winnerResult.winners[0] : null;
        isDraw = winnerResult.isDraw;
        winningScore = winnerResult.winningScore;
      }
      
      io.emit('game ended', {
        reason: gameEndReason,
        winner: gameWinner,
        winners: gameEndReason === 'drawing_stack_exhausted' ? winnerResult.winners : [winner],
        isDraw: isDraw,
        winningScore: winningScore,
        scores: finalScores,
        playersWhoDropped: Array.from(playersWhoDroppedCombinations)
      });
      
      log(`Game ended - Reason: ${gameEndReason}, Winner: ${gameWinner}, Is Draw: ${isDraw}`);
      log(`Final scores:`, finalScores);
    }
    
    // Send combination placed event to all players
    io.emit('combination placed', {
      player: data.player,
      playerName: playerName,
      combination: combination
    });
    
    log(`Player ${playerName} placed new combination worth ${combination.points} points`);
  });

  // Test function to trigger all pairs game end
  socket.on('test all pairs end', () => {
    const find_player = findPlayerCached(soketID, onlinePlayers);
    if (!find_player || find_player[0].player !== 1) {
      // Only allow player 1 to trigger this for testing
      return;
    }
    
    log('Test: Triggering all pairs game end');
    
    // Force all players to have only pairs for testing
    for (let player of onlinePlayers) {
      playersWhoDroppedCombinations.add(player.player);
      
      // Create pairs for testing (this is just for demonstration)
      if (player.destesi.length > 0) {
        // Keep only first two stones to simulate pairs
        player.destesi = player.destesi.slice(0, 2);
      }
    }
    
    // Trigger game end
    gameEndReason = 'all_pairs';
    winner = null;
    gameActive = false;
    
    const finalScores = calculateFinalScores();
    
    io.emit('game ended', {
      reason: gameEndReason,
      winner: winner,
      winners: [winner],
      isDraw: false,
      winningScore: null,
      scores: finalScores,
      playersWhoDropped: Array.from(playersWhoDroppedCombinations)
    });
    
    log(`Game ended - Reason: ${gameEndReason}, Winner: ${winner}`);
    log(`Final scores:`, finalScores);
  });

  // Test function to trigger drawing stack exhausted game end
  socket.on('test drawing stack exhausted', () => {
    const find_player = findPlayerCached(soketID, onlinePlayers);
    if (!find_player || find_player[0].player !== 1) {
      // Only allow player 1 to trigger this for testing
      return;
    }
    
    log('Test: Triggering drawing stack exhausted game end');
    
    // Simulate some players having opened and some not
    // Player 1 and 2 have opened, Player 3 and 4 haven't
    playersWhoDroppedCombinations.add(1);
    playersWhoDroppedCombinations.add(2);
    
    // Give players different scores to test winner determination
    if (onlinePlayers.length >= 1) {
      onlinePlayers[0].destesi = [{ numb: '5' }, { numb: '3' }]; // Score: 8
    }
    if (onlinePlayers.length >= 2) {
      onlinePlayers[1].destesi = [{ numb: '2' }, { numb: '4' }]; // Score: 6 (winner)
    }
    if (onlinePlayers.length >= 3) {
      onlinePlayers[2].destesi = [{ numb: '7' }, { numb: '8' }, { numb: '9' }]; // Score: 24 (not opened)
    }
    if (onlinePlayers.length >= 4) {
      onlinePlayers[3].destesi = [{ numb: '1' }, { numb: '2' }]; // Score: 3 (not opened)
    }
    
    // Trigger game end
    gameEndReason = 'drawing_stack_exhausted';
    winner = null;
    gameActive = false;
    
    const finalScores = calculateFinalScores();
    const winnerResult = determineWinnerFromScores(finalScores);
    
    io.emit('game ended', {
      reason: gameEndReason,
      winner: winnerResult.winners.length > 0 ? winnerResult.winners[0] : null,
      winners: winnerResult.winners,
      isDraw: winnerResult.isDraw,
      winningScore: winnerResult.winningScore,
      scores: finalScores,
      playersWhoDropped: Array.from(playersWhoDroppedCombinations)
    });
    
    log(`Game ended - Reason: ${gameEndReason}, Winners: ${winnerResult.winners}, Is Draw: ${winnerResult.isDraw}`);
    log(`Final scores:`, finalScores);
  });

  socket.on('disconnect', () => {
    log('Disconnected: ' + soketID);
    onlinePlayers = onlinePlayers.filter(item => item.id !== soketID);
    log('Remaining players:', onlinePlayers.length);
    io.emit('players', onlinePlayers);
    
    // Clear caches for disconnected player
    clearPlayerCache();
  });
});

// Helper functions for adding stones to combinations

// Function to find stone in player's deck
function findStoneInDeck(stone, deck) {
  return deck.findIndex(deckStone => 
    deckStone.numb === stone.numb && 
    deckStone.colour === stone.colour  // Fixed: Use 'colour' instead of 'suit'
  );
}

// Function to resolve joker value based on indicator stone
function resolveJokerValue(joker, indicatorStone) {
  if (joker.isJoker || joker.isFalseJoker) {
    let jokerNumber;
    if (indicatorStone.numb === "13") {
      jokerNumber = 1;
    } else {
      jokerNumber = parseInt(indicatorStone.numb) + 1;
    }
    return { numb: jokerNumber.toString(), colour: indicatorStone.colour };
  }
  return joker;
}

// Function to validate adding stone to combination
function validateAddStoneToCombination(stone, combination, position) {
  if (!combination || !combination.stones || combination.stones.length === 0) {
    return { valid: false, message: 'Invalid combination.' };
  }

  const stones = combination.stones;
  
  // Check if it's a run (consecutive numbers, same suit)
  if (isRun(stones)) {
    return validateAddToRun(stone, stones, position);
  }
  
  // Check if it's a set (same number, different suits)
  if (isSet(stones)) {
    return validateAddToSet(stone, stones);
  }
  
  return { valid: false, message: 'Invalid combination type.' };
}

// Function to check if combination is a run
function isRun(stones) {
  if (stones.length < 3) return false;
  
  // Check if all stones have the same suit
  const suit = stones[0].suit;
  if (!stones.every(stone => stone.suit === suit)) return false;
  
  // Check if numbers are consecutive
  const numbers = stones.map(stone => parseInt(stone.numb)).sort((a, b) => a - b);
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i-1] + 1) return false;
  }
  
  return true;
}

// Function to check if combination is a set
function isSet(stones) {
  if (stones.length < 3) return false;
  
  // Check if all stones have the same number
  const number = stones[0].numb;
  if (!stones.every(stone => stone.numb === number)) return false;
  
  // Check if all stones have different suits
  const suits = stones.map(stone => stone.suit);
  const uniqueSuits = new Set(suits);
  return uniqueSuits.size === suits.length;
}

// Function to validate adding stone to run
function validateAddToRun(stone, runStones, position) {
  if (stone.suit !== runStones[0].suit) {
    return { valid: false, message: 'Stone must have the same suit as the run.' };
  }
  
  const numbers = runStones.map(s => parseInt(s.numb)).sort((a, b) => a - b);
  const stoneNumber = parseInt(stone.numb);
  
  // Check if stone can be added at the beginning
  if (position === 'start' && stoneNumber === numbers[0] - 1) {
    return { valid: true };
  }
  
  // Check if stone can be added at the end
  if (position === 'end' && stoneNumber === numbers[numbers.length - 1] + 1) {
    return { valid: true };
  }
  
  // Check if stone can be inserted in the middle (splitting the run)
  for (let i = 0; i < numbers.length - 1; i++) {
    if (stoneNumber === numbers[i] + 1 && stoneNumber === numbers[i + 1] - 1) {
      return { valid: true, split: true, splitIndex: i };
    }
  }
  
  return { valid: false, message: 'Stone cannot be added to this run.' };
}

// Function to validate adding stone to set
function validateAddToSet(stone, setStones) {
  // Check if stone has same number as set
  if (stone.numb !== setStones[0].numb) {
    return { valid: false, message: 'Stone must have the same number as the set.' };
  }
  
  // Check if set is already full (maximum 4 stones)
  if (setStones.length >= 4) {
    return { valid: false, message: 'Set is already full (maximum 4 stones).' };
  }
  
  // Check for duplicate colors (except for jokers)
  const existingColors = setStones.map(s => s.colour);
  if (existingColors.includes(stone.colour)) {
    return { valid: false, message: 'Set already contains a stone of this color.' };
  }
  
  return { valid: true };
}

// Function to process adding stone to combination
function processAddStoneToCombination(stone, combination, position) {
  const stones = combination.stones;
  
  if (isRun(stones)) {
    return processAddToRun(stone, stones, position, combination);
  } else if (isSet(stones)) {
    return processAddToSet(stone, stones, combination);
  }
  
  return { error: 'Invalid combination type' };
}

// Function to process adding stone to run
function processAddToRun(stone, runStones, position, originalCombination) {
  const numbers = runStones.map(s => parseInt(s.numb)).sort((a, b) => a - b);
  const stoneNumber = parseInt(stone.numb);
  
  // Check if stone can be added at the beginning
  if (position === 'start' && stoneNumber === numbers[0] - 1) {
    const newStones = [stone, ...runStones];
    return {
      updatedCombination: {
        ...originalCombination,
        stones: newStones,
        points: calculateCombinationPoints(newStones)
      }
    };
  }
  
  // Check if stone can be added at the end
  if (position === 'end' && stoneNumber === numbers[numbers.length - 1] + 1) {
    const newStones = [...runStones, stone];
    return {
      updatedCombination: {
        ...originalCombination,
        stones: newStones,
        points: calculateCombinationPoints(newStones)
      }
    };
  }
  
  // Check if stone can be inserted in the middle (splitting the run)
  for (let i = 0; i < numbers.length - 1; i++) {
    if (stoneNumber === numbers[i] + 1 && stoneNumber === numbers[i + 1] - 1) {
      const firstRun = runStones.slice(0, i + 1);
      const secondRun = runStones.slice(i + 1);
      
      // Add stone to appropriate run
      if (stoneNumber === numbers[i] + 1) {
        firstRun.push(stone);
      } else {
        secondRun.unshift(stone);
      }
      
      return {
        splitResult: {
          firstRun: {
            ...originalCombination,
            stones: firstRun,
            points: calculateCombinationPoints(firstRun)
          },
          secondRun: {
            ...originalCombination,
            stones: secondRun,
            points: calculateCombinationPoints(secondRun)
          }
        }
      };
    }
  }
  
  return { error: 'Cannot add stone to run' };
}

// Function to process adding stone to set
function processAddToSet(stone, setStones, originalCombination) {
  const newStones = [...setStones, stone];
  return {
    updatedCombination: {
      ...originalCombination,
      stones: newStones,
      points: calculateCombinationPoints(newStones)
    }
  };
}

// Function to calculate combination points
function calculateCombinationPoints(stones) {
  return stones.reduce((total, stone) => {
    if (stone && stone.numb && !isNaN(parseInt(stone.numb))) {
      return total + parseInt(stone.numb);
    }
    return total;
  }, 0);
}

// Function to validate new combination
function validateNewCombination(combination, playerDeck) {
  if (!combination || !combination.stones || combination.stones.length < 3) {
    return { valid: false, message: 'Combination must have at least 3 stones.' };
  }
  
  const stones = combination.stones;
  
  // Check if all stones are in player's hand
  const playerStoneCounts = {};
  playerDeck.forEach(stone => {
    const key = `${stone.numb}_${stone.suit}`;
    playerStoneCounts[key] = (playerStoneCounts[key] || 0) + 1;
  });
  
  const combinationStoneCounts = {};
  stones.forEach(stone => {
    const key = `${stone.numb}_${stone.suit}`;
    combinationStoneCounts[key] = (combinationStoneCounts[key] || 0) + 1;
  });
  
  // Check if player has all the stones
  for (const [key, count] of Object.entries(combinationStoneCounts)) {
    if (!playerStoneCounts[key] || playerStoneCounts[key] < count) {
      return { valid: false, message: 'You do not have all the stones in this combination.' };
    }
  }
  
  // Validate combination type
  if (isRun(stones)) {
    return { valid: true, type: 'run' };
  } else if (isSet(stones)) {
    return { valid: true, type: 'set' };
  } else {
    return { valid: false, message: 'Invalid combination. Must be a run or set.' };
  }
}

const port = process.env.PORT || 3000;
server.listen(port, () => {
  log(`Server listening on http://localhost:${port}`);
  log(`Debug mode: ${DEBUG_MODE}`);
});