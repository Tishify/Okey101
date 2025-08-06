const app = require('./app');
const server = require('http').createServer(app);
const io = require("socket.io").listen(server);
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
  // Check if any player has empty hand
  for (let player of onlinePlayers) {
    if (player.destesi.length === 0) {
      gameEndReason = 'hand_empty';
      winner = player.player;
      gameActive = false;
      return true;
    }
  }
  
  // Check if deck is empty
  if (remaining_decks.length === 0) {
    gameEndReason = 'deck_empty';
    winner = null; // No winner in deck empty scenario
    gameActive = false;
    return true;
  }
  
  return false;
}

// Calculate final scores for all players
function calculateFinalScores() {
  const finalScores = {};
  
  for (let player of onlinePlayers) {
    const playerScore = calculatePlayerScore(player.destesi);
    const hasDroppedCombinations = playersWhoDroppedCombinations.has(player.player);
    
    if (gameEndReason === 'hand_empty') {
      if (player.player === winner) {
        // Winner gets negative score
        finalScores[player.player] = -101;
      } else {
        // Other players get penalty based on remaining stones
        if (hasDroppedCombinations) {
          finalScores[player.player] = playerScore;
        } else {
          // Players who haven't dropped combinations get double penalty
          finalScores[player.player] = playerScore * 2;
        }
      }
    } else if (gameEndReason === 'deck_empty') {
      if (hasDroppedCombinations) {
        // Players who dropped combinations get score based on remaining stones
        finalScores[player.player] = playerScore;
      } else {
        // Players who haven't dropped combinations get no score (0)
        finalScores[player.player] = 0;
      }
    }
  }
  
  return finalScores;
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
        
        // Send game end event to all players
        io.emit('game ended', {
          reason: gameEndReason,
          winner: winner,
          scores: finalScores,
          playersWhoDropped: Array.from(playersWhoDroppedCombinations)
        });
        
        log(`Game ended - Reason: ${gameEndReason}, Winner: ${winner}`);
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
      
      // Send game end event to all players
      io.emit('game ended', {
        reason: gameEndReason,
        winner: winner,
        scores: finalScores,
        playersWhoDropped: Array.from(playersWhoDroppedCombinations)
      });
      
      log(`Game ended - Reason: ${gameEndReason}, Winner: ${winner}`);
      log(`Final scores:`, finalScores);
    }
    
    io.emit('finished', finishing_hand);
  });

  socket.on('drop combinations to table', (data) => {
    const find_player = findPlayerCached(soketID, onlinePlayers);
    const playerName = find_player[0].playernickname;
    
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
      
      // Send game end event to all players
      io.emit('game ended', {
        reason: gameEndReason,
        winner: winner,
        scores: finalScores,
        playersWhoDropped: Array.from(playersWhoDroppedCombinations)
      });
      
      log(`Game ended - Reason: ${gameEndReason}, Winner: ${winner}`);
      log(`Final scores:`, finalScores);
    }
    
    io.emit('combinations dropped to table', {
      player: data.player,
      playerName: playerName,
      combinations: combinations,
      totalPoints: data.totalPoints,
      isInitialMeld: isInitialMeld
    });
    
    log(`Player ${playerName} dropped combinations worth ${data.totalPoints} points`);
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

const port = process.env.PORT || 3000;
server.listen(port, () => {
  log(`Server listening on http://localhost:${port}`);
  log(`Debug mode: ${DEBUG_MODE}`);
});