var socket = io();

// Performance optimizations
const DOM_CACHE = new Map();
const DEBOUNCE_TIMERS = new Map();

// Performance monitoring
const PERFORMANCE_METRICS = {
  domQueries: 0,
  stoneCalculations: 0,
  combinationChecks: 0,
  renderTime: 0
};

// Automated debugging system
const AUTO_DEBUG = {
  enabled: false,
  interval: null,
  lastState: {},
  issues: [],
  performance: {
    frameTime: 0,
    memoryUsage: 0,
    domQueries: 0,
    stoneCalculations: 0
  }
};

// Enable automated debugging
function enableAutoDebug() {
  AUTO_DEBUG.enabled = true;
  console.log("🤖 Automated debugging enabled");
  
  // Start monitoring
  AUTO_DEBUG.interval = setInterval(() => {
    if (AUTO_DEBUG.enabled) {
      runAutomatedDebug();
    }
  }, 2000); // Check every 2 seconds
}

// Disable automated debugging
function disableAutoDebug() {
  AUTO_DEBUG.enabled = false;
  if (AUTO_DEBUG.interval) {
    clearInterval(AUTO_DEBUG.interval);
    AUTO_DEBUG.interval = null;
  }
  console.log("🤖 Automated debugging disabled");
}

// Toggle automated debugging
function toggleAutoDebug() {
  const button = getCachedElement('#auto-debug-toggle');
  const panel = getCachedElement('#debug-panel');
  const content = getCachedElement('#debug-content');
  
  if (AUTO_DEBUG.enabled) {
    disableAutoDebug();
    button.textContent = '🤖 Enable Auto Debug';
    button.style.backgroundColor = '#00d2d3';
    panel.style.display = 'none';
  } else {
    enableAutoDebug();
    button.textContent = '🛑 Disable Auto Debug';
    button.style.backgroundColor = '#ff6b6b';
    panel.style.display = 'block';
    updateDebugPanel();
  }
}

// Update debug panel with current status
function updateDebugPanel() {
  const content = getCachedElement('#debug-content');
  if (!content) return;
  
  const state = captureGameState();
  const issues = detectIssues(state);
  
  let html = `
    <div style="margin-bottom: 10px;">
      <strong>Game Status:</strong><br>
      • Player: ${state.player} | Current: ${state.currentPlayer}<br>
      • Stones in Hand: ${state.stonesInHand}<br>
      • Jokers: ${state.jokersInHand}<br>
      • Valid Combinations: ${state.validCombinations}<br>
      • Total Points: ${state.totalPoints}
    </div>
  `;
  
  if (issues.length > 0) {
    html += `<div style="margin-bottom: 10px;">
      <strong>Issues Found:</strong><br>
      ${issues.map(issue => `• ${getSeverityIcon(issue.severity)} ${issue.message}`).join('<br>')}
    </div>`;
  } else {
    html += `<div style="color: #28a745;">✅ No issues detected</div>`;
  }
  
  html += `<div style="margin-top: 10px; font-size: 11px; color: #999;">
    Check browser console for detailed reports
  </div>`;
  
  content.innerHTML = html;
}

// Enhanced automated debug with panel updates
function runAutomatedDebug() {
  const currentState = captureGameState();
  const issues = detectIssues(currentState);
  const performance = measurePerformance();
  
  // Update debug panel
  updateDebugPanel();
  
  // Only log to console if there are issues or significant changes
  if (issues.length > 0 || hasSignificantChanges(currentState)) {
    logDebugReport(currentState, issues, performance);
    
    // Auto-resolve simple issues
    autoResolveIssues(issues);
  }
  
  // Update last state
  AUTO_DEBUG.lastState = currentState;
}

// Capture current game state
function captureGameState() {
  const board = getCachedElements('.board > div');
  const stones = [];
  
  board.forEach(div => {
    if (div.firstChild) {
      stones.push(stoneCSStoOBJECT(div.firstChild));
    }
  });
  
  return {
    timestamp: Date.now(),
    player: you,
    currentPlayer: currentPlayer,
    stoneWithdrawalRight: stoneWithdrawalRight,
    didugetstone: didugetstone,
    firstStart: firstStart,
    stonesInHand: stones.length,
    jokersInHand: stones.filter(s => s && s.isFalseJoker).length,
    validCombinations: findAllValidCombinations().length,
    totalPoints: calculateTotalCombinationPoints(),
    middleDeckStone: getCachedElement('.new'),
    okeyStone: okey
  };
}

// Detect potential issues
function detectIssues(state) {
  const issues = [];
  
  // Check for stone drawing issues
  if (state.player === state.currentPlayer && !state.stoneWithdrawalRight && !state.didugetstone) {
    issues.push({
      type: 'stone_drawing',
      severity: 'high',
      message: 'Player should be able to draw stones but cannot',
      data: { player: state.player, currentPlayer: state.currentPlayer }
    });
  }
  
  // Check for joker issues
  if (state.jokersInHand > 0 && state.validCombinations === 0) {
    issues.push({
      type: 'joker_combination',
      severity: 'medium',
      message: 'Jokers in hand but no valid combinations found',
      data: { jokers: state.jokersInHand, combinations: state.validCombinations }
    });
  }
  
  // Check for performance issues
  if (AUTO_DEBUG.performance.domQueries > 100) {
    issues.push({
      type: 'performance',
      severity: 'low',
      message: 'High number of DOM queries detected',
      data: { domQueries: AUTO_DEBUG.performance.domQueries }
    });
  }
  
  // Check for missing elements
  if (!state.middleDeckStone) {
    issues.push({
      type: 'missing_element',
      severity: 'medium',
      message: 'Middle deck stone element not found',
      data: { element: 'middle-deck-stone' }
    });
  }
  
  return issues;
}

// Measure performance metrics
function measurePerformance() {
  return {
    frameTime: PERFORMANCE_METRICS.renderTime,
    memoryUsage: performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0,
    domQueries: PERFORMANCE_METRICS.domQueries,
    stoneCalculations: PERFORMANCE_METRICS.stoneCalculations
  };
}

// Check for significant state changes
function hasSignificantChanges(currentState) {
  if (!AUTO_DEBUG.lastState.timestamp) return true;
  
  const changes = [
    currentState.player !== AUTO_DEBUG.lastState.player,
    currentState.currentPlayer !== AUTO_DEBUG.lastState.currentPlayer,
    currentState.stoneWithdrawalRight !== AUTO_DEBUG.lastState.stoneWithdrawalRight,
    currentState.didugetstone !== AUTO_DEBUG.lastState.didugetstone,
    currentState.stonesInHand !== AUTO_DEBUG.lastState.stonesInHand,
    currentState.jokersInHand !== AUTO_DEBUG.lastState.jokersInHand,
    currentState.validCombinations !== AUTO_DEBUG.lastState.validCombinations,
    Math.abs(currentState.totalPoints - AUTO_DEBUG.lastState.totalPoints) > 10
  ];
  
  return changes.some(change => change);
}

// Log debug report
function logDebugReport(state, issues, performance) {
  console.group("🤖 Automated Debug Report");
  console.log("⏰ Time:", new Date().toLocaleTimeString());
  
  if (issues.length > 0) {
    console.group("🚨 Issues Detected:");
    issues.forEach(issue => {
      console.log(`${getSeverityIcon(issue.severity)} ${issue.message}`, issue.data);
    });
    console.groupEnd();
  }
  
  console.group("📊 Game State:");
  console.log("Player:", state.player, "Current Player:", state.currentPlayer);
  console.log("Can Draw Stones:", state.stoneWithdrawalRight);
  console.log("Has Drawn Stone:", state.didugetstone);
  console.log("Stones in Hand:", state.stonesInHand);
  console.log("Jokers in Hand:", state.jokersInHand);
  console.log("Valid Combinations:", state.validCombinations);
  console.log("Total Points:", state.totalPoints);
  console.groupEnd();
  
  console.group("⚡ Performance:");
  console.log("Frame Time:", performance.frameTime.toFixed(2) + "ms");
  console.log("Memory Usage:", performance.memoryUsage.toFixed(2) + "MB");
  console.log("DOM Queries:", performance.domQueries);
  console.log("Stone Calculations:", performance.stoneCalculations);
  console.groupEnd();
  
  console.groupEnd();
}

// Get severity icon
function getSeverityIcon(severity) {
  switch (severity) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

// Smart issue resolution
function autoResolveIssues(issues) {
  issues.forEach(issue => {
    switch (issue.type) {
      case 'missing_element':
        if (issue.data.element === 'middle-deck-stone') {
          initializeMiddleDeckStone();
          console.log("🔧 Auto-fixed: Initialized middle deck stone");
        }
        break;
        
      case 'performance':
        if (issue.data.domQueries > 100) {
          clearDOMCache();
          console.log("🔧 Auto-fixed: Cleared DOM cache");
        }
        break;
    }
  });
}

// Enhanced performance monitoring with auto-fixes
function trackPerformance(metric, startTime = performance.now()) {
  if (window.DEBUG_MODE || AUTO_DEBUG.enabled) {
    PERFORMANCE_METRICS[metric]++;
    if (metric === 'renderTime') {
      PERFORMANCE_METRICS.renderTime = performance.now() - startTime;
      
      // Auto-detect performance issues
      if (PERFORMANCE_METRICS.renderTime > 100) {
        console.warn("⚠️ Slow render detected:", PERFORMANCE_METRICS.renderTime.toFixed(2) + "ms");
      }
    }
  }
}

// Performance monitoring function
function showPerformanceMetrics() {
  console.log("=== PERFORMANCE METRICS ===");
  console.log("DOM Queries:", PERFORMANCE_METRICS.domQueries);
  console.log("Stone Calculations:", PERFORMANCE_METRICS.stoneCalculations);
  console.log("Combination Checks:", PERFORMANCE_METRICS.combinationChecks);
  console.log("Last Render Time:", PERFORMANCE_METRICS.renderTime.toFixed(2) + "ms");
  console.log("Memory Usage:", performance.memory ? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` : "Not available");
  console.log("=== END PERFORMANCE METRICS ===");
}

// Combination calculation cache
const COMBINATION_CACHE = new Map();

// Memoized combination validation
function isValidCombinationMemoized(stones) {
  const key = stones.map(s => `${s?.colour}-${s?.numb}-${s?.isFalseJoker}`).join('|');
  if (COMBINATION_CACHE.has(key)) {
    return COMBINATION_CACHE.get(key);
  }
  
  trackPerformance('combinationChecks');
  const result = isValidCombination(stones);
  COMBINATION_CACHE.set(key, result);
  return result;
}

// Clear combination cache
function clearCombinationCache() {
  COMBINATION_CACHE.clear();
}

// Optimized combination highlighting with performance tracking
const debouncedHighlightCombinations = debounce(() => {
  const startTime = performance.now();
  highlightCombinationsOnBoard();
  trackPerformance('renderTime', startTime);
}, 100);

// Debug function to test joker combinations
function debugJokerCombinations() {
  console.log("=== DEBUGGING JOKER COMBINATIONS ===");
  
  const board = getCachedElements('.board > div');
  let stones = [];
  board.forEach(div => {
    if (div.firstChild) {
      stones.push(stoneCSStoOBJECT(div.firstChild));
    }
  });
  
  console.log("All stones in hand:", stones);
  
  // Check each stone for joker properties
  stones.forEach((stone, index) => {
    if (stone) {
      console.log(`Stone ${index}:`, {
        colour: stone.colour,
        numb: stone.numb,
        isJoker: stone.isJoker,
        isFalseJoker: stone.isFalseJoker,
        isIndicator: stone.isIndicator,
        isOkey: stone.isOkey
      });
    }
  });
  
  // Test combinations
  for (let i = 0; i < stones.length; i++) {
    for (let len = 3; len <= stones.length - i; len++) {
      const group = stones.slice(i, i + len);
      if (group.every(s => s !== null)) {
        const isValid = isValidCombinationWithJoker(group);
        const points = calculateCombinationPoints(group);
        console.log(`Combination ${i}-${i+len-1}:`, {
          stones: group.map(s => `${s.colour} ${s.numb}`),
          isValid: isValid,
          points: points,
          jokers: group.filter(s => s.isJoker || s.isFalseJoker).length
        });
      }
    }
  }
  
  console.log("=== END JOKER DEBUG ===");
}

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Debounce function for performance
function debounce(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(DEBOUNCE_TIMERS.get(func));
      func(...args);
    };
    clearTimeout(DEBOUNCE_TIMERS.get(func));
    const timer = setTimeout(later, wait);
    DEBOUNCE_TIMERS.set(func, timer);
  };
}

// Stone object cache for performance
const STONE_CACHE = new Map();

// Cached DOM element getter with performance tracking
function getCachedElement(selector) {
  trackPerformance('domQueries');
  if (!DOM_CACHE.has(selector)) {
    DOM_CACHE.set(selector, document.querySelector(selector));
  }
  return DOM_CACHE.get(selector);
}

// Cached DOM elements getter for multiple elements
function getCachedElements(selector) {
  trackPerformance('domQueries');
  if (!DOM_CACHE.has(selector)) {
    DOM_CACHE.set(selector, document.querySelectorAll(selector));
  }
  return DOM_CACHE.get(selector);
}

// Clear DOM cache when needed
function clearDOMCache() {
  DOM_CACHE.clear();
}

// Clear stone cache when needed
function clearStoneCache() {
  STONE_CACHE.clear();
}

// Memory cleanup function
function cleanupMemory() {
  clearDOMCache();
  clearStoneCache();
  DEBOUNCE_TIMERS.forEach(timer => clearTimeout(timer));
  DEBOUNCE_TIMERS.clear();
}

// Optimized event listener with cleanup
function addOptimizedEventListener(element, event, handler, options = {}) {
  if (element) {
    element.addEventListener(event, handler, options);
    // Store for cleanup
    if (!element._eventListeners) {
      element._eventListeners = [];
    }
    element._eventListeners.push({ event, handler, options });
  }
}

// Cleanup event listeners
function cleanupEventListeners(element) {
  if (element && element._eventListeners) {
    element._eventListeners.forEach(({ event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    element._eventListeners = [];
  }
}

// Html elements - cached
var form = getCachedElement('#form');
var input = getCachedElement('#input');
var indicator = getCachedElement('#indicator');
var isimDivi = getCachedElement('.choose-name');
var onlineList = getCachedElement('.onlinelist');
var playerList = getCachedElement('.playerslist');
var gameArea = getCachedElement('.gameroom');
var playerAwaiting = getCachedElement('.expectedplayers');
var infoMessage = getCachedElement('.info-message');
var newStonePull = getCachedElement('.new');
var middle_stone_pull = getCachedElement('.middle-stone-place');
var dealer_name = getCachedElement('.dealer');
var player2 = getCachedElement('.player-2');
var player3 = getCachedElement('.player-3');
var player4 = getCachedElement('.player-4');

// Cache ID elements
const id1 = getCachedElement("#id-1");
const id2 = getCachedElement("#id-2");
const id3 = getCachedElement("#id-3");
const id4 = getCachedElement("#id-4");

// Add event listeners with performance optimization
if (indicator) {
  addOptimizedEventListener(indicator, 'dragenter', indicatorEnter);
  addOptimizedEventListener(indicator, 'dragover', indicatorOver);
  addOptimizedEventListener(indicator, 'dragleave', indicatorLeave);
  addOptimizedEventListener(indicator, 'drop', indicatorDrop);
}

if (middle_stone_pull) {
  addOptimizedEventListener(middle_stone_pull, 'dragenter', finishEnter);
  addOptimizedEventListener(middle_stone_pull, 'dragover', finishOver);
  addOptimizedEventListener(middle_stone_pull, 'dragleave', finishLeave);
  addOptimizedEventListener(middle_stone_pull, 'drop', finishDrop);
}

function indicatorEnter(e) {
  e.preventDefault();
};
function indicatorOver(e) {
  e.preventDefault();
};
function indicatorLeave(e) {
  e.preventDefault();
};
function indicatorDrop(e) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  var drifting = document.getElementById(id);
  const element = stoneCSStoOBJECT(drifting);
  if (currentPlayer === you && turn === 1 && !didugetstone && !indicator_made
    && element.colour === indicatorstone.colour && element.numb === indicatorstone.numb) {
    // !TODO: Turn number will come from server.
    // In Turn 1, everyone should be able to make indicator before their turn comes...
    console.log("Indicator thrown: " + element.colour + " " + element.numb);
    // Open socket, notify other players.
    // !TODO: Other players' points will be reduced.
    indicator_made = true;  // Don't forget to set to 'false' again in the next match.
  };
};

var isimDivi = document.querySelector('.choose-name');
var onlineList = document.querySelector('.onlinelist');
var playerList = document.querySelector('.playerslist');
var gameArea = document.querySelector('.gameroom');
var playerAwaiting = document.querySelector('.expectedplayers');
var infoMessage = document.querySelector('.info-message');
var newStonePull = document.querySelector('.new');
// ID elements are now cached above
var middle_stone_pull = document.querySelector('.middle-stone-place');
addOptimizedEventListener(middle_stone_pull, 'dragenter', finishEnter);
addOptimizedEventListener(middle_stone_pull, 'dragover', finishOver);
addOptimizedEventListener(middle_stone_pull, 'dragleave', finishLeave);
addOptimizedEventListener(middle_stone_pull, 'drop', finishDrop);

function finishEnter(e) {
  e.preventDefault();
};
function finishOver(e) {
  e.preventDefault();
};
function finishLeave(e) {
  e.preventDefault();
};
function finishDrop(e) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  var drifting = document.getElementById(id);
  const finishing_stone = stoneCSStoOBJECT(drifting);  // Add okey to this function too.
  let ending_stones = [];
  if (currentPlayer === you && didugetstone) {
    console.log("Game finishing stone thrown: " + finishing_stone.colour + " " + finishing_stone.numb);
    // Add validation.
    var finishing_playershand = document.querySelectorAll('.board > div');
    for (let i = 0; i < finishing_playershand.length; i++) {
      let div = finishing_playershand[i];
      //console.log(div);
      let stonevalue = stoneCSStoOBJECT(div.firstChild);
      ending_stones.push(stonevalue);
    };
    //console.log(finishing_playershand);
    socket.emit('handisfinished', { player: you, board: ending_stones, last_stone: finishing_stone });
    // Other players' points will be reduced.
    // gameActive = false;
  };
};

var dealer_name = document.querySelector('.dealer');
var player2 = document.querySelector('.player-2');
var player3 = document.querySelector('.player-3');
var player4 = document.querySelector('.player-4');

// Variables
let stoneSymbol = "❤";
let fakejokerSymbol = "♣";
let jokerSymbol = "★"; // Add symbol for actual jokers
let stoneWithdrawalRight  = false;
let firstStart = false;
let didugetstone = false;
let hasDrawnStoneThisTurn = false; // Track if player has drawn a stone this turn
let list_of_gamers = [];
let you;
let turn = 0;
let indicatorstone;
let indicator_made = false;

// Event listeners
form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('name information', input.value);  // Send to server.
    // input.value = '';
    isimDivi.remove();
    
    // Initialize responsive design after form submission
    initResponsiveDesign();
    addTouchOptimizations();
  };
});

// Functions
function getPlayerNames(liste) {
  if (you === 1) {
    player2.textContent = liste[1].playernickname + " (20)";
    player3.textContent = liste[2].playernickname + " (20)";
    player4.textContent = liste[3].playernickname + " (20)";
  } else if (you === 2) {
    player2.textContent = liste[2].playernickname + " (20)";
    player3.textContent = liste[3].playernickname + " (20)";
    player4.textContent = liste[0].playernickname + " (20)";
  } else if (you === 3) {
    player2.textContent = liste[3].playernickname + " (20)";
    player3.textContent = liste[0].playernickname + " (20)";
    player4.textContent = liste[1].playernickname + " (20)";
  } else if (you === 4) {
    player2.textContent = liste[0].playernickname + " (20)";
    player3.textContent = liste[1].playernickname + " (20)";
    player4.textContent = liste[2].playernickname + " (20)";
  };
};

function stoneSlipProperty(stone, element) {
  // stone: 'div', element: '{colour, numb}'
  stone.setAttribute('draggable', true);
  addOptimizedEventListener(stone, 'dragstart', dragStart);
  addOptimizedEventListener(stone, 'drag', drag);
  addOptimizedEventListener(stone, 'dragend', dragEnd);
  //taş.addEventListener("dblclick", doubleClicktoSendStone);
  if (element) {
    addOptimizedEventListener(stone, 'click', e => {
      console.log(element);
    });
  };
};

function stoneCSStoOBJECT(div) {
  try {
    // Use cache if available
    if (STONE_CACHE.has(div)) {
      return STONE_CACHE.get(div);
    }
    
    // Only log in debug mode
    if (window.DEBUG_MODE) {
      console.log("stoneCSStoOBJECT called with div:", div);
      console.log("Div textContent:", div.textContent);
      console.log("Div classes:", div.className);
    }
    
    // stone = {colour: "Blue", numb: "1"}
    let stone = {};
    // from colour class + numb textContent (regex) + validate.
    const isYellow = div.classList.contains('yellow');
    const isRed = div.classList.contains('red');
    const isBlack = div.classList.contains('black');
    const isBlue = div.classList.contains('blue');
    const isGreen = div.classList.contains('green');
    
    if (window.DEBUG_MODE) {
      console.log("Color classes - yellow:", isYellow, "red:", isRed, "black:", isBlack, "blue:", isBlue, "green:", isGreen);
    }
    
    if (isYellow) {
      stone.colour = "Yellow";
    } else if (isRed) {
      stone.colour = "Red";
    } else if (isBlack) {
      stone.colour = "Black";
    } else if (isBlue) {
      stone.colour = "Blue";
    };
    
    // Check if it's a joker stone (has green class or contains fakejokerSymbol)
    if (isGreen || div.textContent.includes(fakejokerSymbol)) {
      if (window.DEBUG_MODE) {
        console.log("Detected false joker stone");
      }
      if (typeof okey !== 'undefined' && okey) {
      stone.colour = okey.colour;
      stone.numb = okey.numb;
      stone.isFalseJoker = true;
        if (window.DEBUG_MODE) {
          console.log("Set false joker properties - colour:", stone.colour, "numb:", stone.numb);
        }
      } else {
        if (window.DEBUG_MODE) {
          console.log("Warning: okey variable is undefined, cannot set joker properties");
        }
        // Fallback: set as a generic joker
        stone.colour = "Joker";
        stone.numb = "Joker";
        stone.isFalseJoker = true;
      }
    } else if (div.classList.contains('joker') || div.textContent.includes(jokerSymbol)) {
      if (window.DEBUG_MODE) {
        console.log("Detected actual joker stone");
      }
      // Actual jokers represent the joker tile value
      if (typeof okey !== 'undefined' && okey) {
        // Calculate joker number (one higher than indicator, or 1 if indicator is 13)
        let jokerNumber;
        if (okey.numb === "13") {
          jokerNumber = "1";
        } else {
          jokerNumber = (parseInt(okey.numb) + 1).toString();
        }
        stone.colour = okey.colour;
        stone.numb = jokerNumber;
        stone.isJoker = true;
        if (window.DEBUG_MODE) {
          console.log("Set actual joker properties - colour:", stone.colour, "numb:", stone.numb);
        }
      } else {
        if (window.DEBUG_MODE) {
          console.log("Warning: okey variable is undefined, cannot set joker properties");
        }
        // Fallback: set as a generic joker
        stone.colour = "Joker";
        stone.numb = "Joker";
        stone.isJoker = true;
      }
    } else if (div.textContent.match(/\d/g)) {
      stone.numb = div.textContent.match(/\d/g).join("");
      if (window.DEBUG_MODE) {
        console.log("Set regular stone number:", stone.numb);
      }
    } else {
      if (window.DEBUG_MODE) {
        console.log("Warning: Could not determine stone number from textContent:", div.textContent);
      }
      stone.numb = "?";
    };
    
    if (window.DEBUG_MODE) {
      console.log("Final stone object:", stone);
    }
    
    // Cache the result
    STONE_CACHE.set(div, stone);
    return stone;
  } catch (error) {
    if (window.DEBUG_MODE) {
      console.log("Error in stoneCSStoOBJECT:", error);
    }
    return null;
  };
};

function GetTheStoneFromThePlayer() {
  var coming_stone = document.querySelectorAll(".coming-stone-place > div");
  coming_stone.forEach(stone => {
    let element = stoneCSStoOBJECT(stone);
    stoneSlipProperty(stone, element);
  });
};

// Taking the stone thrown by the player on the left:
//id4.addEventListener("dblclick", DoubleClickTakeTheStoneFromTheLeftSide);

function DoubleClickTakeTheStoneFromTheLeftSide(e) {
  e.preventDefault();
  if (you === currentPlayer && stoneWithdrawalRight  === true) {
    // Check if player already has 15 stones
    const currentStones = countStonesInHand();
    /*if (currentStones >= 16) {
      console.log("Cannot take more stones - hand is full (16 stones)");
      return;
    }*/
    
    console.log("Stone drawn: " + id4.textContent);
    // !TODO: Ensure the stone drawing operation is performed.
    //Cut the content of id4 div.
    //if the first child div in Istaka is empty, add the drawn stone to its content.
    //Otherwise, add to the last child, it should be the 28th child.
    //Cut the classes from id4 div.
    //Cut the TextContent too.
  
    // Prevent drawing stone again:
    stoneWithdrawalRight  = false;
    didugetstone = true;
  };
};

// Taking new stone from the middle:
//newStonePull.addEventListener("dblclick", doubleClickGetNewMediumStone);

function doubleClickGetNewMediumStone(e) {
  e.preventDefault();
  if (you === currentPlayer && stoneWithdrawalRight  === true) {
    // Check if player already has 15 stones
    const currentStones = countStonesInHand();
    /*if (currentStones >= 16) {
      console.log("Cannot take more stones - hand is full (16 stones)");
      return;
    }*/
    
    console.log("New stone drawn from middle."); // Request stone from 'socket to deck'.
    // Don't forget to add the stone from socket to the player's real deck!
    // !TODO: Some logic.
  
    // Prevent drawing stone again:
    stoneWithdrawalRight  = false;
    didugetstone = true;
  };
};

function createStone(stone, id1) {  // Parent div that the stone is attached to for thrown stones.
  var sent_stone = document.createElement("div");
  var stone_name = document.createTextNode(stone.numb);
  sent_stone.appendChild(stone_name);
  id1.innerHTML = "";  // Shows only one stone.
  id1.appendChild(sent_stone);
  return sent_stone;
};

function dragStart(e) {
  //console.log(e.target);
  
  // Allow dragging count stones for requesting new stones
  if (e.target.classList.contains('stone-count')) {
    console.log("Dragging count stone to request new stone from deck");
    // Don't prevent default - allow the drag to continue
  }
  
  console.log("Starting drag for element:", e.target);
  console.log("Element classes:", e.target.className);
  console.log("Element textContent:", e.target.textContent);
  
  // Check if this is a joker stone
  if (e.target.classList.contains('green') || e.target.textContent.includes(fakejokerSymbol)) {
    console.log("WARNING: Dragging a false joker stone!");
    console.log("False joker stone properties:", {
      classes: e.target.className,
      textContent: e.target.textContent,
      isGreen: e.target.classList.contains('green'),
      containsJokerSymbol: e.target.textContent.includes(fakejokerSymbol)
    });
  } else if (e.target.classList.contains('joker') || e.target.textContent.includes(jokerSymbol)) {
    console.log("WARNING: Dragging an actual joker stone!");
    console.log("Actual joker stone properties:", {
      classes: e.target.className,
      textContent: e.target.textContent,
      isJoker: e.target.classList.contains('joker'),
      containsJokerSymbol: e.target.textContent.includes(jokerSymbol)
    });
  }
  
  e.target.setAttribute('id', 'iamstone');
  e.dataTransfer.setData('text/plain', e.target.id);
  setTimeout(() => {
    e.target.classList.add('destroy');
  }, 0);
};
function drag(e) {
  e.preventDefault();
  //console.log('stone is being dragged.');
};
function dragEnd(e) {
  e.preventDefault();
  e.target.removeAttribute('id');
  e.target.classList.remove('destroy');
};

function dragEnter(e) {
  e.preventDefault();
  //e.target.classList.add('drag-over');
};
function dragOver(e) {
  e.preventDefault();
  //e.target.classList.add('drag-over');
};
function dragLeave(e) {
  e.preventDefault();
  //e.target.classList.remove('drag-over');
};
function drop(e) {
  e.preventDefault();
  //e.target.classList.remove('drag-over');
  const newplace = document.getElementById(e.target.id);
  console.log("Drop target:", e.target.id, "newplace:", newplace);
  
  //console.log(newplace.firstChild); !BUG: Console error.
  if (!newplace.firstChild) {
    const id = e.dataTransfer.getData('text/plain');
    var drifting = document.getElementById(id);
    console.log("Dropping element with id:", id, "drifting:", drifting);
    console.log("Drifting classes:", drifting ? drifting.className : "null");
    
    if (drifting.classList.contains('new')) {
      // Draw new stone from middle:
      console.log("Attempting to pull from middle deck...");
      console.log("you: " + you + ", currentPlayer: " + currentPlayer + ", stoneWithdrawalRight: " + stoneWithdrawalRight);
      console.log("Drifting element:", drifting);
      console.log("Drifting classes:", drifting.className);
      
      /* Check if player already has 16 stones
      const currentStones = countStonesInHand();
      if (currentStones >= 16) {
        console.log("Cannot take more stones - hand is full (16 stones)");
        return;
      }*/
      
      if (you === currentPlayer && stoneWithdrawalRight  === true) {
        console.log("New stone drawn from middle.");
        console.log("Sending 'ask for new stone' request to server...");
        
        // Request new stone from server first
        socket.emit('ask for new stone', {
          player: you
        });
        
        // Don't move the count stone - wait for the real stone from server
        // The real stone will be placed in hand when 'yeni taş' event is received
        
        // Prevent drawing stone again:
        stoneWithdrawalRight  = false;
        didugetstone = true;
        console.log("Requested new stone from server");
        console.log("Updated state - stoneWithdrawalRight: " + stoneWithdrawalRight + ", didugetstone: " + didugetstone);
      } else {
        console.log("Cannot pull from middle deck - conditions not met");
        console.log("you:", you, "currentPlayer:", currentPlayer, "stoneWithdrawalRight:", stoneWithdrawalRight);
        console.log("Debug info - you === currentPlayer:", you === currentPlayer, "stoneWithdrawalRight === true:", stoneWithdrawalRight === true);
      };
    } else if (drifting.parentElement.classList.contains('coming-stone-place')) {
      // Take the stone thrown by the player on the left:
      console.log("Attempting to take stone from previous player...");
      console.log("you: " + you + ", currentPlayer: " + currentPlayer + ", stoneWithdrawalRight: " + stoneWithdrawalRight);
      
      // Check if player already has 16 stones
      const currentStones = countStonesInHand();
      /*if (currentStones >= 16) {
        console.log("Cannot take more stones - hand is full (16 stones)");
        return;
      }*/
      
      if (you === currentPlayer && stoneWithdrawalRight  === true) {
        // !TODO!: Remove stone from other players' divs and show the previously thrown stone.
        
        // Find empty slot in hand and place the stone there
        const emptySlot = findEmptySlotInHand();
        if (emptySlot) {
          emptySlot.appendChild(drifting);
          console.log("Stone from previous player placed in empty slot:", emptySlot.id);
        } else {
          console.log("No empty slots in hand!");
          return;
        }
        
        rightClickHideStone(drifting);
        // Reduce to single variable.
          stoneWithdrawalRight  = false;
          didugetstone = true; // These are opposites. Consider the first player as having taken a stone.
          socket.emit('stone puller', { player: you });
        };
      //var stone_board = document.querySelectorAll(".board .stone"); 
      // Update board to final state.
    } else if (drifting.classList.contains('stone')
    // Move stone on board:
    && !drifting.classList.contains('new')
    && !drifting.classList.contains('coming-stone-place')) {
      e.target.appendChild(drifting);
      //drifting.classList.remove('destroy');  // It already does this when drag event ends.
    };
  } else {
    console.log("Target already has a child, cannot drop here");
  };
  //drifting.removeAttribute('id');
  highlightCombinationsOnBoard();
  
  // Check if player can finish their hand after dropping combinations
  setTimeout(() => {
    if (checkCanFinishHand()) {
      console.log("Player finished their hand after dropping combinations!");
    } else {
      createFinishHandButton();
    }
  }, 100);
}

function stoneRollMechanics() {
  const stonegoing_place = document.querySelector('.going-stone-place');
  addOptimizedEventListener(stonegoing_place, 'dragenter', dragEnter);
  addOptimizedEventListener(stonegoing_place, 'dragover', dragOver);
  addOptimizedEventListener(stonegoing_place, 'dragleave', dragLeave);
  addOptimizedEventListener(stonegoing_place, 'drop', drop);
  function dragEnter(e) {
    e.preventDefault();
    //e.target.classList.add('drag-over');
  };
  function dragOver(e) {
    e.preventDefault();
    //e.target.classList.add('drag-over');
  };
  function dragLeave(e) {
    e.preventDefault();
    //e.target.classList.remove('drag-over');
  };
  function drop(e) {
    e.preventDefault();
    //e.target.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    var sent = document.getElementById(id);
    let stone = stoneCSStoOBJECT(sent);

    // Check if this is a joker stone being thrown
    if (stone && stone.isFalseJoker) {
      console.log("WARNING: Attempting to throw a joker stone!");
      console.log("Joker stone properties:", stone);
    }

    // Check if player can throw a stone
    const canThrowStone = firstStart || (you === currentPlayer && didugetstone);
    
    console.log("StoneRollMechanics drop - canThrowStone:", canThrowStone, "firstStart:", firstStart, "you:", you, "currentPlayer:", currentPlayer, "didugetstone:", didugetstone);

    if (canThrowStone) {
      if (!sent.classList.contains('new')) {
        console.log("Throwing stone: " + stone.colour + " " + stone.numb);
        if (stone.isFalseJoker) {
          console.log("This is a joker stone being thrown!");
        }
        console.log("firstStart: " + firstStart + ", currentPlayer: " + currentPlayer + ", you: " + you + ", didugetstone: " + didugetstone);
        didugetstone = false;
        firstStart = false;
        // Client-side validation can be added here...
        socket.emit("throw stones on the ground", {
          player: you,
          stone: stone
        });
        sent.remove();
        console.log("Stone thrown successfully to center");
        console.log("Updated state after throwing - didugetstone: " + didugetstone + ", firstStart: " + firstStart);
      };
    } else {
      console.log("Cannot throw stone to center - conditions not met");
      console.log("firstStart: " + firstStart + ", currentPlayer: " + currentPlayer + ", you: " + you + ", didugetstone: " + didugetstone);
      console.log("Debug info - firstStart:", firstStart, "you === currentPlayer:", you === currentPlayer, "didugetstone:", didugetstone);
    };

    // Instead of these, send the stone to server:
    // sent.removeAttribute('id');
    // sent.classList.remove('destroy');
    // sent.removeAttribute('draggable');
    // e.target.appendChild(sent);
    // console.log(sent);

    // socket.emit("throw stone on ground", {
    //   player: you,
    //   stone: element
    // });
  };
};

function doubleClicktoSendStone(event) {
  event.preventDefault();
  // If it's your turn and you took a new stone, you can send it. OR if you're the first player!
  // and also firstStart can be sent.
  const canThrowStone = firstStart || (you === currentPlayer && didugetstone);
  
  if (canThrowStone) {
    //!BUG: Player-1 is sending stone without drawing one first.
    didugetstone = false;
    firstStart = false;  // Bug solved.
    // Client-side validation:
    const isContain = !!yourBoard.find(stone => {  
      return stone === element;
    });
    if (isContain) {  // underscore could be used.
      //id0_list.push(element); Do this on server.
      yourBoard = yourBoard.filter(stone => stone !== element);
      
      //id0.textContent = _.last(id0_list).numb;  // = element.numb;
      // TODO: Also get the appropriate color. Convert CSS class selector to function, add here.

      socket.emit("throw stones on the ground", {
        player: you,
        stone: element
      });
      // !TODO!: Write the above operations on server. Let server decide what id0 will be.
      //console.log(id0_list);
    };

    // LTODO: Find another way to clear content.
    // stone.remove(); Works when it's a child.
    // Temporary solution:
    stone.className = "";
    stone.textContent = "";
    stone.innerHTML = "";
    // console.log(div);
    // div.classList.add("giden");
  } else if (currentPlayer && you === currentPlayer && !didugetstone) {
    alert("You forgot to take a stone!");
  };
};

function rightClickHideStone(stone) {
  addOptimizedEventListener(stone, "contextmenu", event => {
    event.preventDefault();
    stone.classList.toggle("gizle");
  });
};

function stoneColorConverter(stone, divstone) {  // Specifically the div of a single stone.
  console.log("stoneColorConverter called with stone:", stone);
  divstone.className = "stone";
  divstone.textContent = divstone.textContent + stoneSymbol;
  console.log("After adding stoneSymbol, textContent:", divstone.textContent);
  
  // Handle jokers first
  if (stone.isJoker) {
    console.log("Stone is an actual joker, setting to jokerSymbol");
    divstone.textContent = jokerSymbol;
    divstone.classList.add("joker");  // Add joker class for styling
  } else if (stone.isFalseJoker) {
    console.log("Stone is a false joker, setting to fakejokerSymbol");
    divstone.textContent = fakejokerSymbol;
    divstone.classList.add("green");  // Prevents fake okey from coming in different colors.
  } else {
    // Regular stone - apply color based on stone.colour
  if (stone.colour === "Red") {
    divstone.classList.add("red");
  } else if (stone.colour === "Yellow") {
    divstone.classList.add("yellow");
  } else if (stone.colour === "Black") {
    divstone.classList.add("black");
  } else if (stone.colour === "Blue") {
    divstone.classList.add("blue");
  };
  };
  
  console.log("Final divstone:", divstone);
};

// Right click blocker.
document.addEventListener('contextmenu', event => event.preventDefault());

// Sockets
socket.on('finished', (match_finisher) => {
  // $player, $board, $last_stone
  if (match_finisher.last_stone.isFalseJoker) {
    var last_shot = "Fake okey";
  } else {
    var last_shot = match_finisher.last_stone.colour + " " + match_finisher.last_stone.numb;
  };
  var finished_board = match_finisher.board;
  //console.log(finished_board);
  console.log(list_of_gamers[match_finisher.player - 1].playernickname + " finished with '" + last_shot + "'.");
  // Also show which stone it finished with.

  var finish_div = document.querySelector('.finished');
  for (let i = 0; i < finished_board.length; i++) {
    let stone = finished_board[i];
    if (stone) {
      var sent_stone = document.createElement("div");
      var stone_name = document.createTextNode(stone.numb);
      sent_stone.appendChild(stone_name);
      stoneColorConverter(stone, sent_stone);
      finish_div.appendChild(sent_stone);
    } else {
      finish_div.appendChild(document.createElement("div"));
    };
  };
  // Close this again when new game starts.
  document.querySelector('.message').textContent = list_of_gamers[match_finisher.player - 1].playernickname + ", '" + last_shot + "' ile bitirdi.";
  document.querySelector('.con-3').classList.remove('destroy');
});

socket.on('stone puller', (player) => {
  console.log("Player drawing stone: " + player);
  //const yer = document.getElementById(`id${player}`);
  if (player === 1) {
    if (you === 2) {
      id3.innerHTML = "";
    } else if (you === 3) {
      id2.innerHTML = "";
    } else if (you === 4) {
      id1.innerHTML = "";
    };
  } else if (player === 2) {
    if (you === 1) {
      id1.innerHTML = "";
    } else if (you === 3) {
      id3.innerHTML = "";
    } else if (you === 4) {
      id2.innerHTML = "";
    };
  } else if (player === 3) {
    if (you === 1) {
      id2.innerHTML = "";
    } else if (you === 2) {
      id1.innerHTML = "";
    } else if (you === 4) {
      id3.innerHTML = "";
    };
  } else if (player === 4) {
    if (you === 1) {
      id3.innerHTML = "";
    } else if (you === 2) {
      id2.innerHTML = "";
    } else if (you === 3) {
      id1.innerHTML = "";
    };
  };
  // !TODO: Don't let it stay empty, show the previously thrown stone.
});

socket.on('number of remaining stones', (numb) => {
  // When "stone count information" comes, creates new middle empty stone.
  console.log("Received 'number of remaining stones' event with number:", numb);
  
  // Update the existing stone in the middle or create a new one
  let newStonePull = document.querySelector('.new');
  if (!newStonePull) {
    console.log("No .new element found, creating new count stone");
    // Create new count stone if it doesn't exist
    const boş_taş = document.createElement('div');
    boş_taş.classList.add('new');
    boş_taş.classList.add('taş');
    boş_taş.classList.add('stone');
    boş_taş.classList.add('stone-count');
    middle_stone_pull.innerHTML = "";
    middle_stone_pull.appendChild(boş_taş);
    newStonePull = boş_taş;
  } else {
    console.log("Found existing .new element, updating count");
  }
  
  // Update the count
  newStonePull.textContent = numb;
  newStonePull.classList.add('stone-count'); // Ensure it has the count class
  newStonePull.classList.add('new'); // Ensure it has the new class for dragging
  
  // Check if deck is empty and update dragging accordingly
  if (numb === 0) {
    console.log("Deck is completely empty, disabling middle deck stone dragging");
    newStonePull.draggable = false;
    newStonePull.style.cursor = 'not-allowed';
    newStonePull.style.opacity = '0.5';
    // Remove drag event listeners
    cleanupEventListeners(newStonePull);
  } else {
    console.log("Deck has stones, enabling middle deck stone dragging");
    newStonePull.draggable = true;
    newStonePull.style.cursor = 'pointer';
    newStonePull.style.opacity = '1';
    // Set up drag properties
    stoneSlipProperty(newStonePull);
  }
  
  console.log("Updated count stone with number:", numb, "Element:", newStonePull);
  console.log("Count stone classes:", newStonePull.className);
  console.log("Count stone draggable:", newStonePull.draggable);
});

socket.on('yeni taş', (newstone) => {
  console.log("=== RECEIVED NEW STONE ===");
  console.log("Received new stone from server:", newstone);
  
  // Validate the received stone
  if (!newstone || !newstone.colour || !newstone.numb) {
    console.error("Invalid stone received:", newstone);
    infoMessage.textContent = "Error: Invalid stone received from server";
    return;
  }
  
  console.log("New stone properties - colour:", newstone.colour, "numb:", newstone.numb, "isFalseJoker:", newstone.isFalseJoker);
  console.log("Current game state - you:", you, "currentPlayer:", currentPlayer, "didugetstone:", didugetstone);
  
  // Find empty slot in hand
  const emptySlot = findEmptySlotInHand();
  if (!emptySlot) {
    console.log("No empty slots in hand! Cannot place new stone.");
    console.log("Current hand count:", countStonesInHand());
    return;
  }
  console.log("Found empty slot:", emptySlot.id);
  
  // Create new stone element for the hand
  const newStoneElement = document.createElement('div');
  newStoneElement.className = 'stone';
  newStoneElement.textContent = newstone.numb;
  stoneColorConverter(newstone, newStoneElement);
  stoneSlipProperty(newStoneElement, newstone);
  rightClickHideStone(newStoneElement);
  
  // Place the stone in the empty slot
  emptySlot.appendChild(newStoneElement);
  console.log("New stone placed in hand at slot:", emptySlot.id);
  
  // Don't update the middle stone - it should remain as a count stone
  // The count will be updated by the 'number of remaining stones' event
  
  // Update combinations display after getting new stone
  highlightCombinationsOnBoard();
  console.log("Updated combinations display");
  
  // Mark that player has drawn a stone this turn
  hasDrawnStoneThisTurn = true;
  
  // Check if player can finish hand after getting new stone
  setTimeout(() => {
    createFinishHandButton();
  }, 100);
  
  console.log("=== END RECEIVED NEW STONE ===");
});

// Handle deck empty error
socket.on('deck_empty', (data) => {
  console.log("=== DECK EMPTY ===");
  console.log("Server message:", data.message);
  infoMessage.textContent = "Deck is completely empty! Game should end according to Okey 101 rules.";
  console.log("=== END DECK EMPTY ===");
});

// Handle deck error
socket.on('deck_error', (data) => {
  console.log("=== DECK ERROR ===");
  console.log("Server message:", data.message);
  infoMessage.textContent = "Error drawing stone from deck. Please try again.";
  console.log("=== END DECK ERROR ===");
});

socket.on('player', function(player) {
  // Triggered "only" when the game starts.
  currentPlayer = player.current;
  you = player.you;
  firstStart = player.ilkBaşlar;
  okey = player.okeystone;
  if (currentPlayer === you) {
    turn += 1;
    console.log("Turn: " + turn); // Turn information should come from server when game starts.
  };
  dealer_name.textContent = list_of_gamers[you - 1].playernickname + " (20)"; // Hard-coded points for now.
  getPlayerNames(list_of_gamers);
  //console.log(list_of_gamers);
  if (firstStart) {
    infoMessage.textContent = "You start the game."
    didugetstone = true; // First player can throw a stone without pulling one first
    stoneWithdrawalRight = true; // First player has the right to take stones
    console.log("First player setup - didugetstone: " + didugetstone + ", stoneWithdrawalRight: " + stoneWithdrawalRight);
    console.log("First player can throw stone immediately");
    // A socket that only controls stone transfer can be opened. Between 'Deck to player'.
  } else {
    infoMessage.textContent = list_of_gamers[0].playernickname + " is expected.";
    stoneWithdrawalRight = false; // Other players don't have the right initially
    didugetstone = false; // Other players need to draw a stone first
    console.log("Other player setup - didugetstone: " + didugetstone + ", stoneWithdrawalRight: " + stoneWithdrawalRight);
  };
  console.log("current: " + currentPlayer + ", " + "you: " + you);
});

socket.on('current player', function(info) {
  // This socket is triggered when a stone is thrown.
  currentPlayer = info.current;
  stoneWithdrawalRight  = info.stoneRights;
  
  // Reset drawn stone flag when turn changes
  if (currentPlayer !== you) {
    hasDrawnStoneThisTurn = false;
  }
  
  console.log("=== TURN CHANGE ===");
  console.log("current: " + currentPlayer + ", " + "you: " + you + ", stoneWithdrawalRight: " + stoneWithdrawalRight);
  console.log("Game state - firstStart: " + firstStart + ", didugetstone: " + didugetstone);
  console.log("Received stoneRights:", info.stoneRights);
  console.log("Is it my turn?", currentPlayer === you);
  
  if (currentPlayer === you) {
    turn += 1;
    console.log("Turn: " + turn); // Turn information should come from server when game starts.
    infoMessage.textContent = "It's your turn."
    console.log("Turn is now mine - can draw stones:", stoneWithdrawalRight, "can throw stones:", didugetstone || firstStart);
  } else {
    infoMessage.textContent = list_of_gamers[currentPlayer - 1].playernickname + " is expected.";
    console.log("Turn is not mine - waiting for player", currentPlayer);
  };
  console.log("=== END TURN CHANGE ===");
});

socket.on('table stone', function(stoneINFO) {
  // Triggered when someone sends a stone.
  whoSentStone = stoneINFO.whoSentStone;
  let stone = stoneINFO.stone;
  console.log(whoSentStone + " by player no. " + stone.colour + " " + stone.numb + " sent.");
  console.log("You are player: " + you + ", whoSentStone: " + whoSentStone);
  
  // Determine which player should receive this stone (next player in turn)
  let nextPlayer = whoSentStone === 4 ? 1 : whoSentStone + 1;
  console.log("Next player who should receive this stone:", nextPlayer);
  
  if (whoSentStone === you) {
    // This is the stone you threw - don't make it draggable for you
    var sent_stone = createNonDraggableStone(stone, id1);
    stoneColorConverter(stone, sent_stone);
    // Don't apply stoneSlipProperty - this prevents you from dragging it back
    console.log("Stone you threw - not making it draggable for you");
  } else if (
    (you === 1 && whoSentStone === 2) || 
    (you === 2 && whoSentStone === 3) ||
    (you === 3 && whoSentStone === 4) ||
    (you === 4 && whoSentStone === 1)) {
    // This stone is for you (next player) - make it draggable
    var sent_stone = createStone(stone, id2);
    stoneColorConverter(stone, sent_stone);
    stoneSlipProperty(sent_stone, stone);
    console.log("Stone thrown to you - making it draggable");
  } else if (
    (you === 1 && whoSentStone === 3) ||
    (you === 2 && whoSentStone === 4) ||
    (you === 3 && whoSentStone === 1) ||
    (you === 4 && whoSentStone === 2)) {
    // This stone is for you (next player) - make it draggable
    var sent_stone = createStone(stone, id3);
    stoneColorConverter(stone, sent_stone);
    stoneSlipProperty(sent_stone, stone);
    console.log("Stone thrown to you - making it draggable");
  } else if (
    (you === 1 && whoSentStone === 4) ||
    (you === 2 && whoSentStone === 1) ||
    (you === 3 && whoSentStone === 2) ||
    (you === 4 && whoSentStone === 3)) {
    // This stone is for you (next player) - make it draggable
    var sent_stone = createStone(stone, id4);
    stoneColorConverter(stone, sent_stone);
    stoneSlipProperty(sent_stone, stone);
    console.log("Stone thrown to you - making it draggable");
  } else {
    // This stone is not for you - don't make it draggable
    var sent_stone = createNonDraggableStone(stone, id1);
    stoneColorConverter(stone, sent_stone);
    console.log("Stone not for you - not making it draggable");
  };
  GetTheStoneFromThePlayer();  //Bug solved: After stone is created.
});

socket.on('client konsol', function(msg) {
  console.log(msg);
});

// Handle combinations dropped to table
socket.on('combinations dropped to table', function(data) {
  const commonTable = document.getElementById('common-table');
  
  // Create a container for this player's combinations
  const playerCombinationsDiv = document.createElement('div');
  playerCombinationsDiv.style.marginBottom = '15px';
  
  // Add player name and total points
  const playerHeader = document.createElement('div');
  playerHeader.style.fontWeight = 'bold';
  playerHeader.style.fontSize = '16px';
  playerHeader.style.marginBottom = '8px';
  playerHeader.style.color = '#333';
  playerHeader.textContent = `${data.playerName} - Всего очков: ${data.totalPoints}`;
  playerCombinationsDiv.appendChild(playerHeader);
  
  // Add each combination
  data.combinations.forEach(combination => {
    const comboDisplay = createCombinationDisplay(combination, data.playerName);
    playerCombinationsDiv.appendChild(comboDisplay);
  });
  
  commonTable.appendChild(playerCombinationsDiv);
  
  // Show notification
  console.log(`${data.playerName} сбросил комбинации на ${data.totalPoints} очков`);
});

socket.on('players', function(msg) {
  // Testing....


  list_of_gamers = msg;
  if (msg.length === 0) {
    onlineList.classList.add("destroy");
  } else {
    onlineList.classList.remove("destroy");
  };
  playerList.innerHTML = '';  // REPLACE!
  msg.forEach(element => {
    if (msg.length >= 4) {
      playerAwaiting.textContent = `Server full! (${msg.length}/4)`
      playerList.style.display = 'none';
    } else {
      playerAwaiting.textContent = `Online players: (${msg.length}/4)`
    };
    // console.log(element.playernickname);
    const node = document.createElement("div");
    var textnode = document.createTextNode(element.playernickname);
    node.appendChild(textnode);
    playerList.appendChild(node);
  });
});

socket.on('game info', function(information) {
  console.log(information);  // Oyun başlıyor bilgisi buradan geliyor.
  gameArea.classList.remove("destroy")
  onlineList.style.display = 'none';
  
  // Clear common table when new game starts
  clearCommonTable();
});

socket.on('indicator stone', function(stone) {
  console.log(stone);
  indicatorstone = stone;
  // Okey taşı da gelsin, lazım olacak.
  // TODO: Desteden göstergeyi kes!?
  const divg = document.getElementById("indicator");
  // First, clear previous classnames:
  //divg.className = "stone";
  divg.textContent = `${indicatorstone.numb}`;
  stoneColorConverter(indicatorstone, divg);
});

socket.on('your board', function(yours) {
  console.log(yours);
  let yourBoard = yours;
  const board = document.querySelector(".board");
  // First, clear previous classnames:
  board.innerHTML = ""; // !BUG: If board is restarted, it messes up.
  let width = 14;
  let height = 2;
  // let squares = [];
  
  function createBoard() {
    for (let i = 0; i < width*height; i++) {
      const square = document.createElement("div");
      square.setAttribute('id', i + 1);
      addOptimizedEventListener(square, 'dragenter', dragEnter);
      addOptimizedEventListener(square, 'dragover', dragOver);
      addOptimizedEventListener(square, 'dragleave', dragLeave);
      addOptimizedEventListener(square, 'drop', drop);
      board.appendChild(square);
    };
  };

  function addElement() {
    for (let i = 0; i < yourBoard.length; i++) {
      const element = yourBoard[i];
      const board = document.getElementById(`${i + 1}`);
      const stone = document.createElement('div');
      stone.textContent = `${element.numb}`;
      stoneColorConverter(element, stone);
      stone.classList.add("stone");
      rightClickHideStone(stone);
      stoneSlipProperty(stone, element);
      board.appendChild(stone);
    };
  };
  
  createBoard();
  addElement();
  highlightCombinationsOnBoard();
  stoneRollMechanics();
  initializeMiddleDeckStone(); // Initialize middle deck stone properly
  
  // Initialize responsive design for game room
  if (!window.gameInitialized) {
    initResponsiveDesign();
    addTouchOptimizations();
    window.gameInitialized = true;
  }
  
  // The initial middle deck stone will be set up by the 'number of remaining stones' event
  // which is sent from the server when the game starts
});
// !TODO!: If connection drops, print "connection error".

// Checks if a group of stones is a valid combination
function isValidCombination(stones) {
  if (stones.length < 3) return false;

  // Check for duplicate cards (same color and number)
  for (let i = 0; i < stones.length; i++) {
    for (let j = i + 1; j < stones.length; j++) {
      if (stones[i].colour === stones[j].colour && stones[i].numb === stones[j].numb) {
        return false;
      }
    }
  }

  // Same color, consecutive numbers
  const allSameColor = stones.every(s => s.colour === stones[0].colour);
  if (allSameColor) {
    const numbers = stones.map(s => parseInt(s.numb, 10)).sort((a, b) => a - b);
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i - 1] + 1) return false;
    }
    return true;
  }

  // Same number, all different colors
  const allSameNumber = stones.every(s => s.numb === stones[0].numb);
  if (allSameNumber) {
    const uniqueColors = new Set(stones.map(s => s.colour));
    if (uniqueColors.size === stones.length && stones.length <= 4) {
      return true;
    }
  }

  return false;
}

function isValidCombinationWithJoker(stones) {
  if (stones.length < 3) return false;

  // Separate jokers (both actual jokers and false jokers) from regular stones
  const jokers = stones.filter(s => s && (s.isJoker || s.isFalseJoker));
  const nonJokers = stones.filter(s => s && !s.isJoker && !s.isFalseJoker);

  // If all stones are jokers, they can form a valid combination
  if (jokers.length === stones.length && stones.length >= 3) {
    return true;
  }

  // Check for duplicate cards among non-jokers (same color and number)
  for (let i = 0; i < nonJokers.length; i++) {
    for (let j = i + 1; j < nonJokers.length; j++) {
      if (nonJokers[i].colour === nonJokers[j].colour && nonJokers[i].numb === nonJokers[j].numb) {
        return false;
      }
    }
  }

  // If no non-jokers, jokers can form any combination
  if (nonJokers.length === 0) {
    return stones.length >= 3;
  }

  // 1. Try to form a run (same color, consecutive numbers)
  if (nonJokers.length > 0 && nonJokers.every(s => s.colour === nonJokers[0].colour)) {
    let numbers = nonJokers.map(s => parseInt(s.numb, 10)).sort((a, b) => a - b);
    
    // Try different possible positions for the run
    for (let start = Math.max(1, numbers[0] - jokers.length); 
         start <= Math.min(13 - stones.length + 1, numbers[numbers.length - 1]); 
         start++) {
      
      // Create the target sequence
      let targetSequence = [];
      for (let i = 0; i < stones.length; i++) {
        targetSequence.push(start + i);
      }
      
      // Check if all non-joker numbers are in the target sequence
      if (numbers.every(n => targetSequence.includes(n))) {
        return true;
      }
    }
  }

  // 2. Try to form a set (same number, all different colors)
  if (nonJokers.length > 0 && nonJokers.every(s => s.numb === nonJokers[0].numb)) {
    const usedColors = nonJokers.map(s => s.colour);
    const hasDuplicateColor = usedColors.length !== new Set(usedColors).size;
    
    if (!hasDuplicateColor) {
      // Check if we have enough total stones (non-jokers + jokers) for a valid set
      if (stones.length >= 3 && stones.length <= 4) {
      return true;
      }
    }
  }

  return false;
}

function calculateCombinationPoints(stones) {
  // For jokers, we need to determine what value they represent in the combination
  let totalPoints = 0;
  
  // First, determine the type of combination (run or set)
  const jokers = stones.filter(s => s && (s.isJoker || s.isFalseJoker));
  const nonJokers = stones.filter(s => s && !s.isJoker && !s.isFalseJoker);
  
  if (nonJokers.length === 0) {
    // All jokers - use average value
    return stones.length * 7;
  }
  
  // Check if it's a run (same color, consecutive numbers)
  const isRun = nonJokers.length > 0 && nonJokers.every(s => s.colour === nonJokers[0].colour);
  
  if (isRun) {
    // For runs, calculate the sequence and assign joker values
    let numbers = nonJokers.map(s => parseInt(s.numb, 10)).sort((a, b) => a - b);
    
    // Find the best possible run that includes all non-joker numbers
    let bestStart = Math.max(1, numbers[0] - jokers.length);
    let bestEnd = Math.min(13, numbers[numbers.length - 1] + jokers.length);
    
    // Create the target sequence
    let targetSequence = [];
    for (let i = bestStart; i <= bestEnd && targetSequence.length < stones.length; i++) {
      targetSequence.push(i);
    }
    
    // Calculate points for the run
    for (let stone of stones) {
      if (stone.isJoker || stone.isFalseJoker) {
        // Find the missing number in the sequence
        let missingNumbers = targetSequence.filter(n => !numbers.includes(n));
        if (missingNumbers.length > 0) {
          totalPoints += missingNumbers[0]; // Use the first missing number
        } else {
          totalPoints += 7; // Fallback
        }
      } else {
        totalPoints += parseInt(stone.numb, 10);
      }
    }
  } else {
    // Check if it's a set (same number, different colors)
    const isSet = nonJokers.length > 0 && nonJokers.every(s => s.numb === nonJokers[0].numb);
    
    if (isSet) {
      // For sets, all jokers represent the same number as the non-jokers
      const setNumber = parseInt(nonJokers[0].numb, 10);
      
      for (let stone of stones) {
        if (stone.isJoker || stone.isFalseJoker) {
          totalPoints += setNumber;
        } else {
          totalPoints += parseInt(stone.numb, 10);
        }
      }
    } else {
      // Fallback for other cases
      for (let stone of stones) {
        if (stone.isJoker || stone.isFalseJoker) {
          totalPoints += 7; // Average value
        } else {
          totalPoints += parseInt(stone.numb, 10);
        }
      }
    }
  }
  
  return totalPoints;
}

// Optimized combination highlighting with debouncing - defined later

function highlightCombinationsOnBoard() {
  const board = getCachedElements('.board > div');
  if (!board || board.length === 0) return;
  
  // Remove previous glow and points
  board.forEach(div => {
    if (div.firstChild) {
      div.firstChild.classList.remove('glow');
      let old = div.firstChild.querySelector('.combo-points');
      if (old) old.remove();
    }
  });

  // Collect stones and their DOM elements - optimized
  let stones = [];
  let divs = [];
  const boardLength = board.length;
  
  for (let i = 0; i < boardLength; i++) {
    const div = board[i];
    if (div.firstChild) {
      stones.push(stoneCSStoOBJECT(div.firstChild));
      divs.push(div.firstChild);
    } else {
      stones.push(null);
      divs.push(null);
    }
  }

  let totalComboPoints = 0;
  
  // Find all possible combinations using the proper joker logic
  let allPossibleCombinations = [];
  
  // Check all possible consecutive groups of 3+ stones
  for (let i = 0; i < stones.length; i++) {
    for (let len = 3; len <= stones.length - i; len++) {
      const group = stones.slice(i, i + len);
      const groupDivs = divs.slice(i, i + len);
      
      // Use the proper joker validation function
      if (group.every(s => s !== null) && isValidCombinationWithJoker(group)) {
        const points = calculateCombinationPoints(group);
        allPossibleCombinations.push({
          stones: group,
          points: points,
          startIndex: i,
          endIndex: i + len - 1,
          divs: groupDivs
        });
      }
    }
  }

  // Sort combinations by points (highest first) and length (longest first)
  allPossibleCombinations.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
  });

  // Select non-overlapping combinations
  let selectedCombinations = [];
  let usedPositions = new Set();

  for (const combo of allPossibleCombinations) {
    // Check if this combination overlaps with already selected ones
    let hasOverlap = false;
    for (let i = combo.startIndex; i <= combo.endIndex; i++) {
      if (usedPositions.has(i)) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      selectedCombinations.push(combo);
      totalComboPoints += combo.points;
      
      // Mark positions as used and add glow effect
      for (let i = combo.startIndex; i <= combo.endIndex; i++) {
        usedPositions.add(i);
        if (divs[i]) {
          divs[i].classList.add('glow');
        }
      }
    }
  }
  
  // Display points for each card based on the best combination it's part of
  selectedCombinations.forEach(combo => {
    // Add points display to the first stone in the group
    if (combo.divs[0]) {
      let pointsSpan = document.createElement('span');
      pointsSpan.className = 'combo-points';
      pointsSpan.textContent = `+${combo.points}`;
      pointsSpan.style.position = 'absolute';
      pointsSpan.style.top = '-20px';
      pointsSpan.style.left = '50%';
      pointsSpan.style.transform = 'translateX(-50%)';
      pointsSpan.style.background = 'rgba(255,255,255,0.9)';
      pointsSpan.style.color = 'red';
      pointsSpan.style.fontWeight = 'bold';
      pointsSpan.style.borderRadius = '6px';
      pointsSpan.style.padding = '2px 6px';
      pointsSpan.style.fontSize = '14px';
      pointsSpan.style.zIndex = '20';
      combo.divs[0].style.position = 'relative';
      combo.divs[0].appendChild(pointsSpan);
    }
  });
  
  // Show total points near the player's nickname
  const comboPointsTotal = getCachedElement('#combo-points-total');
  if (comboPointsTotal) {
    comboPointsTotal.textContent = totalComboPoints > 0 ? `Total: ${totalComboPoints}` : '';
  }
  
  // Update drop combinations button state
  updateDropCombinationsButton();
}

// Helper function to calculate run points
function calculateRunPoints(startNumber, length) {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += startNumber + i;
  }
  return sum;
}

// Function to count stones in player's hand
function countStonesInHand() {
  const board = getCachedElements('.board > div');
  let count = 0;
  console.log("Counting stones in hand. Total board divs:", board.length);
  
  board.forEach((div, index) => {
    if (div.firstChild) {
      count++;
      console.log(`Slot ${index} (${div.id}) has a stone:`, div.firstChild.textContent);
    } else {
      console.log(`Slot ${index} (${div.id}) is empty`);
    }
  });
  
  console.log("Total stones in hand:", count);
  return count;
}

// Function to find all valid combinations in player's hand
function findAllValidCombinations() {
  const board = getCachedElements('.board > div');
  let stones = [];
  let stonePositions = []; // Track actual positions of stones
  
  board.forEach((div, index) => {
    if (div.firstChild) {
      stones.push(stoneCSStoOBJECT(div.firstChild));
      stonePositions.push(index); // Store the actual board position
    }
  });

  // Find all possible combinations first
  let allPossibleCombinations = [];
  
  // Check all possible consecutive groups of 3+ stones
  for (let i = 0; i < stones.length; i++) {
    for (let len = 3; len <= stones.length - i; len++) {
      const group = stones.slice(i, i + len);
      
      if (isValidCombinationWithJoker(group)) {
        const points = calculateCombinationPoints(group);
        allPossibleCombinations.push({
          stones: group,
          points: points,
          startIndex: stonePositions[i], // Use actual board position
          endIndex: stonePositions[i + len - 1] // Use actual board position
        });
      }
    }
  }

  // Sort combinations by points (highest first) and length (longest first)
  allPossibleCombinations.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
  });

  // Select non-overlapping combinations
  let selectedCombinations = [];
  let usedPositions = new Set();

  for (const combo of allPossibleCombinations) {
    // Check if this combination overlaps with already selected ones
    let hasOverlap = false;
    for (let i = combo.startIndex; i <= combo.endIndex; i++) {
      if (usedPositions.has(i)) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      selectedCombinations.push(combo);
      // Mark positions as used
      for (let i = combo.startIndex; i <= combo.endIndex; i++) {
        usedPositions.add(i);
      }
    }
  }

  return selectedCombinations;
}

// Function to calculate total points from all valid combinations
function calculateTotalCombinationPoints() {
  const combinations = findAllValidCombinations();
  return combinations.reduce((total, combo) => total + combo.points, 0);
}

// Function to drop combinations to common table
function dropCombinationsToTable() {
  const totalPoints = calculateTotalCombinationPoints();
  
  if (totalPoints < 101) {
    alert(`Недостаточно очков для сброса! У вас ${totalPoints} очков, нужно минимум 101.`);
    return;
  }

  const combinations = findAllValidCombinations();
  if (combinations.length === 0) {
    alert('Нет валидных комбинаций для сброса!');
    return;
  }

  // Send combinations to server
  socket.emit('drop combinations to table', {
    player: you,
    combinations: combinations,
    totalPoints: totalPoints,
    hasDrawnStone: hasDrawnStoneThisTurn
  });

  // Clear the board (remove stones that are part of combinations)
  const board = getCachedElements('.board > div');
  const stonesToRemove = new Set();
  
  combinations.forEach(combo => {
    // Mark positions to remove based on startIndex and endIndex
    for (let i = combo.startIndex; i <= combo.endIndex; i++) {
      stonesToRemove.add(i);
    }
  });

  // Remove the stones in reverse order to maintain indices
  const positionsToRemove = Array.from(stonesToRemove).sort((a, b) => b - a);
  positionsToRemove.forEach(index => {
    if (board[index] && board[index].firstChild) {
      board[index].firstChild.remove();
    }
  });

  // Update combinations display
  highlightCombinationsOnBoard();
  
  // Check if player can finish their hand after dropping combinations
  setTimeout(() => {
    if (checkCanFinishHand()) {
      console.log("Player finished their hand after dropping combinations!");
    } else {
      createFinishHandButton();
    }
  }, 100);
}

// Function to create combination display element
function createCombinationDisplay(combination, playerName) {
  const comboDiv = document.createElement('div');
  comboDiv.className = 'combination-group';
  
  // Create stones
  combination.stones.forEach(stone => {
    const stoneDiv = document.createElement('div');
    stoneDiv.className = 'stone';
    stoneDiv.textContent = stone.numb;
    stoneColorConverter(stone, stoneDiv);
    comboDiv.appendChild(stoneDiv);
  });
  
  // Create info section
  const infoDiv = document.createElement('div');
  infoDiv.className = 'combination-info';
  
  const playerNameDiv = document.createElement('div');
  playerNameDiv.className = 'player-name';
  playerNameDiv.textContent = playerName;
  
  const pointsDiv = document.createElement('div');
  pointsDiv.className = 'combination-points';
  pointsDiv.textContent = `+${combination.points} очков`;
  
  infoDiv.appendChild(playerNameDiv);
  infoDiv.appendChild(pointsDiv);
  comboDiv.appendChild(infoDiv);
  
  return comboDiv;
}

// Function to update drop combinations button state
function updateDropCombinationsButton() {
  const button = getCachedElement('#drop-combinations-btn');
  if (!button) return;
  
  const totalPoints = calculateTotalCombinationPoints();
  const combinations = findAllValidCombinations();
  const currentStones = countStonesInHand();
  
  console.log("Button update - totalPoints:", totalPoints, "combinations:", combinations.length, "currentStones:", currentStones);
  
  if (totalPoints >= 101 && combinations.length > 0) {
    button.disabled = false;
    button.textContent = `Сбросить комбинации на стол (${totalPoints} очков)`;
    button.style.backgroundColor = '#4CAF50';
  } else {
    button.disabled = true;
    if (totalPoints < 101) {
      button.textContent = `Сбросить комбинации на стол (${totalPoints}/101 очков)`;
    } else {
      button.textContent = 'Сбросить комбинации на стол (нет комбинаций)';
    }
    button.style.backgroundColor = '#cccccc';
  }
}

// Function to clear common table
function clearCommonTable() {
  const commonTable = getCachedElement('common-table');
  if (commonTable) {
    commonTable.innerHTML = '';
  }
}

// Function to find empty slot in player's hand
function findEmptySlotInHand() {
  const board = getCachedElements('.board > div');
  console.log("Searching for empty slot in hand. Total slots:", board.length);
  
  for (let i = 0; i < board.length; i++) {
    if (!board[i].firstChild) {
      console.log("Found empty slot at index:", i, "with id:", board[i].id);
      return board[i];
    }
  }
  console.log("No empty slots found in hand");
  return null; // No empty slots
}

// Debug function to manually test stone drawing
function debugDrawStone() {
  console.log("=== DEBUG DRAW STONE ===");
  console.log("Current game state:");
  console.log("you:", you);
  console.log("currentPlayer:", currentPlayer);
  console.log("stoneWithdrawalRight:", stoneWithdrawalRight);
  console.log("didugetstone:", didugetstone);
  console.log("firstStart:", firstStart);
  
  // Check if player can draw stones
  if (you === currentPlayer && stoneWithdrawalRight === true) {
    console.log("Player can draw stones - attempting to draw from middle deck");
    
    // Check if player already has 16 stones
    /*const currentStones = countStonesInHand();
    if (currentStones >= 16) {
      console.log("Cannot take more stones - hand is full (16 stones)");
      return;
    }*/
    
    console.log("Sending 'ask for new stone' request to server...");
    socket.emit('ask for new stone', {
      player: you
    });
    
    // Prevent drawing stone again:
    stoneWithdrawalRight = false;
    didugetstone = true;
    console.log("Requested new stone from server");
    console.log("Updated state - stoneWithdrawalRight: " + stoneWithdrawalRight + ", didugetstone: " + didugetstone);
  } else {
    console.log("Player cannot draw stones:");
    console.log("you === currentPlayer:", you === currentPlayer);
    console.log("stoneWithdrawalRight === true:", stoneWithdrawalRight === true);
  }
  console.log("=== END DEBUG DRAW STONE ===");
}

// Debug function to manually test stone throwing
function debugThrowStone() {
  console.log("=== DEBUG THROW STONE ===");
  console.log("Current game state:");
  console.log("you:", you);
  console.log("currentPlayer:", currentPlayer);
  console.log("didugetstone:", didugetstone);
  console.log("firstStart:", firstStart);
  
  // Check if player can throw a stone
  const canThrowStone = firstStart || (you === currentPlayer && didugetstone);
  console.log("canThrowStone:", canThrowStone);
  
  if (canThrowStone) {
    console.log("Player can throw stones");
    
    // Find a stone to throw (first stone in hand)
    const board = getCachedElements('.board > div');
    let stoneToThrow = null;
    let stoneElement = null;
    
    for (let i = 0; i < board.length; i++) {
      if (board[i].firstChild) {
        stoneElement = board[i].firstChild;
        stoneToThrow = stoneCSStoOBJECT(stoneElement);
        console.log("Found stone to throw:", stoneToThrow);
        break;
      }
    }
    
    if (stoneToThrow) {
      console.log("Throwing stone:", stoneToThrow.colour, stoneToThrow.numb);
      didugetstone = false;
      firstStart = false;
      
      socket.emit("throw stones on the ground", {
        player: you,
        stone: stoneToThrow
      });
      
      // Remove the stone from hand
      stoneElement.remove();
      console.log("Stone thrown successfully");
      console.log("Updated state - didugetstone: " + didugetstone + ", firstStart: " + firstStart);
    } else {
      console.log("No stones found in hand to throw");
    }
  } else {
    console.log("Player cannot throw stones:");
    console.log("firstStart:", firstStart);
    console.log("you === currentPlayer:", you === currentPlayer);
    console.log("didugetstone:", didugetstone);
  }
  console.log("=== END DEBUG THROW STONE ===");
}

// Debug function to show current game state
function debugGameState() {
  console.log("=== DEBUG GAME STATE ===");
  console.log("Player info:");
  console.log("you:", you);
  console.log("currentPlayer:", currentPlayer);
  console.log("turn:", turn);
  
  console.log("Game state:");
  console.log("stoneWithdrawalRight:", stoneWithdrawalRight);
  console.log("didugetstone:", didugetstone);
  console.log("firstStart:", firstStart);
  
  console.log("Hand info:");
  const currentStones = countStonesInHand();
  console.log("Stones in hand:", currentStones);
  
  console.log("Middle deck:");
  const middleStone = getCachedElement('.new');
  console.log("Middle stone element:", middleStone);
  if (middleStone) {
    console.log("Middle stone classes:", middleStone.className);
    console.log("Middle stone text:", middleStone.textContent);
    console.log("Middle stone draggable:", middleStone.draggable);
  }
  
  console.log("Can draw stones:", you === currentPlayer && stoneWithdrawalRight === true);
  console.log("Can throw stones:", firstStart || (you === currentPlayer && didugetstone));
  console.log("=== END DEBUG GAME STATE ===");
}

// Function to properly initialize the middle deck stone
function initializeMiddleDeckStone() {
  console.log("Initializing middle deck stone...");
  let newStonePull = getCachedElement('.new');
  
  if (newStonePull) {
    console.log("Found existing middle deck stone, setting up drag properties");
    // Ensure it has the right classes
    newStonePull.classList.add('new');
    newStonePull.classList.add('stone');
    newStonePull.classList.add('stone-count');
    
    // Check if deck is empty (count is 0)
    const stoneCount = parseInt(newStonePull.textContent) || 0;
    if (stoneCount === 0) {
      console.log("Deck is completely empty, disabling middle deck stone dragging");
      newStonePull.draggable = false;
      newStonePull.style.cursor = 'not-allowed';
      newStonePull.style.opacity = '0.5';
    } else {
      // Set up drag properties only if deck has stones
      stoneSlipProperty(newStonePull);
    }
    
    console.log("Middle deck stone initialized with classes:", newStonePull.className);
    console.log("Middle deck stone draggable:", newStonePull.draggable);
    console.log("Middle deck stone count:", stoneCount);
  } else {
    console.log("No middle deck stone found, creating one");
    const boş_taş = document.createElement('div');
    boş_taş.classList.add('new');
    boş_taş.classList.add('stone');
    boş_taş.classList.add('stone-count');
    boş_taş.textContent = '?';
    
    const middle_stone_pull = getCachedElement('.middle-stone-place');
    if (middle_stone_pull) {
      middle_stone_pull.innerHTML = "";
      middle_stone_pull.appendChild(boş_taş);
      stoneSlipProperty(boş_taş);
      console.log("Created new middle deck stone");
    }
  }
}

// Debug function to check for joker stones in hand
function debugCheckJokerStones() {
  console.log("=== DEBUG CHECK JOKER STONES ===");
  const board = getCachedElements('.board > div');
  let falseJokerCount = 0;
  let actualJokerCount = 0;
  let totalStones = 0;
  
  board.forEach((div, index) => {
    if (div.firstChild) {
      totalStones++;
      const stone = div.firstChild;
      console.log(`Stone ${index + 1}:`, {
        textContent: stone.textContent,
        classes: stone.className,
        isGreen: stone.classList.contains('green'),
        isJoker: stone.classList.contains('joker'),
        containsFalseJokerSymbol: stone.textContent.includes(fakejokerSymbol),
        containsJokerSymbol: stone.textContent.includes(jokerSymbol)
      });
      
      if (stone.classList.contains('green') || stone.textContent.includes(fakejokerSymbol)) {
        falseJokerCount++;
        console.log(`FALSE JOKER FOUND at position ${index + 1}!`);
      }
      
      if (stone.classList.contains('joker') || stone.textContent.includes(jokerSymbol)) {
        actualJokerCount++;
        console.log(`ACTUAL JOKER FOUND at position ${index + 1}!`);
      }
    }
  });
  
  console.log(`Total stones in hand: ${totalStones}`);
  console.log(`False joker stones found: ${falseJokerCount}`);
  console.log(`Actual joker stones found: ${actualJokerCount}`);
  console.log("Okey variable:", okey);
  console.log("=== END DEBUG CHECK JOKER STONES ===");
}

// Debug function to simulate throwing a joker stone
function debugThrowJokerStone() {
  console.log("=== DEBUG THROW JOKER STONE ===");
  
  // Find a joker stone in hand
  const board = getCachedElements('.board > div');
  let jokerStone = null;
  let jokerElement = null;
  let jokerType = null;
  
  for (let i = 0; i < board.length; i++) {
    if (board[i].firstChild) {
      const stone = board[i].firstChild;
      if (stone.classList.contains('green') || stone.textContent.includes(fakejokerSymbol)) {
        jokerStone = stoneCSStoOBJECT(stone);
        jokerElement = stone;
        jokerType = "false joker";
        console.log("Found false joker stone at position", i + 1);
        break;
      } else if (stone.classList.contains('joker') || stone.textContent.includes(jokerSymbol)) {
        jokerStone = stoneCSStoOBJECT(stone);
        jokerElement = stone;
        jokerType = "actual joker";
        console.log("Found actual joker stone at position", i + 1);
        break;
      }
    }
  }
  
  if (jokerStone && jokerElement) {
    console.log(`Attempting to throw ${jokerType}:`, jokerStone);
    
    // Check if player can throw a stone
    const canThrowStone = firstStart || (you === currentPlayer && didugetstone);
    console.log("canThrowStone:", canThrowStone);
    
    if (canThrowStone) {
      console.log(`Throwing ${jokerType} to server...`);
      didugetstone = false;
      firstStart = false;
      
      socket.emit("throw stones on the ground", {
        player: you,
        stone: jokerStone
      });
      
      jokerElement.remove();
      console.log(`${jokerType} thrown successfully`);
      console.log("Updated state - didugetstone: " + didugetstone + ", firstStart: " + firstStart);
    } else {
      console.log(`Cannot throw ${jokerType} - conditions not met`);
    }
  } else {
    console.log("No joker stone found in hand");
  }
  
  console.log("=== END DEBUG THROW JOKER STONE ===");
}

// Responsive design utilities
const RESPONSIVE = {
  currentBreakpoint: 'desktop',
  breakpoints: {
    mobile: 480,
    tablet: 768,
    laptop: 1024,
    desktop: 1366,
    large: 1600,
    xlarge: 1920
  },
  resizeObserver: null,
  debouncedResize: null
};

// Initialize responsive design
function initResponsiveDesign() {
  // Set initial breakpoint
  updateBreakpoint();
  
  // Create debounced resize handler
  RESPONSIVE.debouncedResize = debounce(() => {
    updateBreakpoint();
    handleResize();
  }, 250);
  
  // Add resize listener
  window.addEventListener('resize', RESPONSIVE.debouncedResize);
  
  // Create ResizeObserver for more precise monitoring
  if (window.ResizeObserver) {
    RESPONSIVE.resizeObserver = new ResizeObserver(entries => {
      RESPONSIVE.debouncedResize();
    });
    
    // Observe the game container
    const gameContainer = getCachedElement('.gameroom');
    if (gameContainer) {
      RESPONSIVE.resizeObserver.observe(gameContainer);
    }
  }
  
  // Initial setup
  handleResize();
}

// Update current breakpoint
function updateBreakpoint() {
  const width = window.innerWidth;
  let newBreakpoint = 'xlarge';
  
  for (const [breakpoint, maxWidth] of Object.entries(RESPONSIVE.breakpoints)) {
    if (width <= maxWidth) {
      newBreakpoint = breakpoint;
      break;
    }
  }
  
  if (RESPONSIVE.currentBreakpoint !== newBreakpoint) {
    RESPONSIVE.currentBreakpoint = newBreakpoint;
    console.log(`📱 Breakpoint changed to: ${newBreakpoint} (${width}px)`);
  }
}

// Handle resize events
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Update CSS custom properties for dynamic sizing
  updateDynamicSizing(width, height);
  
  // Adjust game layout based on screen size
  adjustGameLayout(width, height);
  
  // Recalculate stone positions if needed
  if (window.gameInitialized) {
    recalculateStonePositions();
  }
}

// Update dynamic sizing based on viewport
function updateDynamicSizing(width, height) {
  const root = document.documentElement;
  
  // Calculate optimal stone size based on available space
  const availableWidth = Math.min(width * 0.95, 1600);
  const availableHeight = height * 0.6;
  
  // Calculate stone dimensions
  const stoneWidth = Math.max(40, Math.min(100, availableWidth / 16));
  const stoneHeight = stoneWidth * 1.5;
  const stoneFontSize = Math.max(16, stoneWidth * 0.5);
  
  // Set custom properties
  root.style.setProperty('--dynamic-stone-width', `${stoneWidth}px`);
  root.style.setProperty('--dynamic-stone-height', `${stoneHeight}px`);
  root.style.setProperty('--dynamic-stone-font-size', `${stoneFontSize}px`);
  root.style.setProperty('--dynamic-board-width', `${availableWidth}px`);
  root.style.setProperty('--dynamic-board-height', `${Math.min(availableHeight, 400)}px`);
}

// Adjust game layout for different screen sizes
function adjustGameLayout(width, height) {
  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const isLandscape = width > height;
  
  // Mobile optimizations
  if (isMobile) {
    optimizeForMobile();
  } else if (isTablet) {
    optimizeForTablet();
  } else {
    optimizeForDesktop();
  }
  
  // Landscape optimizations
  if (isLandscape && isMobile) {
    optimizeForLandscape();
  }
}

// Mobile optimizations
function optimizeForMobile() {
  const board = getCachedElement('.board');
  const debugPanel = getCachedElement('#debug-panel');
  
  if (board) {
    board.style.gridTemplateColumns = 'repeat(14, 1fr)';
    board.style.gridTemplateRows = 'repeat(2, 1fr)';
  }
  
  // Hide debug panel on very small screens
  if (window.innerWidth <= 480 && debugPanel) {
    debugPanel.style.display = 'none';
  }
  
  // Optimize touch interactions
  document.body.style.touchAction = 'manipulation';
}

// Tablet optimizations
function optimizeForTablet() {
  const board = getCachedElement('.board');
  
  if (board) {
    board.style.gridTemplateColumns = 'repeat(14, 1fr)';
    board.style.gridTemplateRows = 'repeat(2, 1fr)';
  }
}

// Desktop optimizations
function optimizeForDesktop() {
  const board = getCachedElement('.board');
  
  if (board) {
    board.style.gridTemplateColumns = 'repeat(14, 1fr)';
    board.style.gridTemplateRows = 'repeat(2, 1fr)';
  }
}

// Landscape optimizations
function optimizeForLandscape() {
  const board = getCachedElement('.board');
  
  if (board) {
    // Use more columns in landscape for better space utilization
    board.style.gridTemplateColumns = 'repeat(16, 1fr)';
    board.style.gridTemplateRows = 'repeat(2, 1fr)';
  }
}

// Recalculate stone positions after resize
function recalculateStonePositions() {
  const stones = getCachedElements('.stone');
  
  stones.forEach(stone => {
    // Ensure stones maintain proper dimensions
    const computedStyle = window.getComputedStyle(stone);
    const currentWidth = computedStyle.width;
    const currentHeight = computedStyle.height;
    
    // Apply minimum dimensions if needed
    if (parseInt(currentWidth) < 40) {
      stone.style.minWidth = '40px';
    }
    if (parseInt(currentHeight) < 60) {
      stone.style.minHeight = '60px';
    }
  });
}

// Get optimal stone size for current screen
function getOptimalStoneSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  if (width <= 480) return { width: 40, height: 60, fontSize: 20 };
  if (width <= 768) return { width: 50, height: 75, fontSize: 25 };
  if (width <= 1024) return { width: 60, height: 90, fontSize: 30 };
  if (width <= 1366) return { width: 70, height: 105, fontSize: 35 };
  if (width <= 1600) return { width: 80, height: 120, fontSize: 40 };
  if (width <= 1920) return { width: 90, height: 135, fontSize: 45 };
  
  return { width: 100, height: 150, fontSize: 50 };
}

// Check if device is touch-enabled
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Add touch-specific optimizations
function addTouchOptimizations() {
  if (isTouchDevice()) {
    // Increase touch targets
    const stones = getCachedElements('.stone');
    stones.forEach(stone => {
      stone.style.minHeight = '44px'; // Minimum touch target size
      stone.style.minWidth = '44px';
    });
    
    // Add touch feedback
    document.body.classList.add('touch-device');
  }
}

// Cleanup responsive design
function cleanupResponsiveDesign() {
  if (RESPONSIVE.resizeObserver) {
    RESPONSIVE.resizeObserver.disconnect();
  }
  
  if (RESPONSIVE.debouncedResize) {
    window.removeEventListener('resize', RESPONSIVE.debouncedResize);
  }
}

function createNonDraggableStone(stone, id1) {
  // Create stone without drag properties
  var sent_stone = document.createElement("div");
  var stone_name = document.createTextNode(stone.numb);
  sent_stone.appendChild(stone_name);
  id1.innerHTML = "";  // Shows only one stone.
  id1.appendChild(sent_stone);
  
  // Add visual indicator that this stone is not draggable
  sent_stone.style.opacity = '0.7';
  sent_stone.style.cursor = 'not-allowed';
  sent_stone.setAttribute('draggable', false);
  
  return sent_stone;
}

// Debug function to test stone throwing restrictions
function debugStoneThrowingRestrictions() {
  console.log("=== DEBUG STONE THROWING RESTRICTIONS ===");
  
  console.log("Current game state:");
  console.log("- You are player:", you);
  console.log("- Current player:", currentPlayer);
  console.log("- Who sent stone:", whoSentStone);
  console.log("- Did you get stone:", didugetstone);
  console.log("- First start:", firstStart);
  
  // Check if you can throw a stone
  const canThrowStone = firstStart || (you === currentPlayer && didugetstone);
  console.log("Can you throw a stone:", canThrowStone);
  
  // Check which stones are draggable
  const thrownStones = document.querySelectorAll('#id1, #id2, #id3, #id4');
  thrownStones.forEach((container, index) => {
    if (container.firstChild) {
      const stone = container.firstChild;
      const isDraggable = stone.getAttribute('draggable') === 'true';
      const opacity = stone.style.opacity;
      const cursor = stone.style.cursor;
      
      console.log(`Stone ${index + 1} (${container.id}):`, {
        isDraggable: isDraggable,
        opacity: opacity,
        cursor: cursor,
        textContent: stone.textContent,
        classes: stone.className
      });
    }
  });
  
  console.log("=== END DEBUG STONE THROWING RESTRICTIONS ===");
}

// Handle game end and scoring
socket.on('game ended', function(data) {
  console.log("=== GAME ENDED ===");
  console.log("Reason:", data.reason);
  console.log("Winner:", data.winner);
  console.log("Scores:", data.scores);
  console.log("Players who dropped combinations:", data.playersWhoDropped);
  
  // Create game end display
  const gameEndDiv = document.createElement('div');
  gameEndDiv.className = 'game-end-display';
  gameEndDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #333;
    border-radius: 10px;
    padding: 20px;
    z-index: 1000;
    max-width: 500px;
    text-align: center;
  `;
  
  let gameEndHTML = '<h2>Game Ended</h2>';
  
  if (data.reason === 'hand_empty') {
    const winnerName = list_of_gamers.find(p => p.player === data.winner)?.playernickname || `Player ${data.winner}`;
    gameEndHTML += `<p><strong>Winner: ${winnerName}</strong></p>`;
    gameEndHTML += '<p>Reason: Player emptied their hand</p>';
  } else if (data.reason === 'deck_empty') {
    gameEndHTML += '<p><strong>No Winner</strong></p>';
    gameEndHTML += '<p>Reason: Deck is empty</p>';
  }
  
  gameEndHTML += '<h3>Final Scores:</h3>';
  gameEndHTML += '<div style="text-align: left; margin: 10px 0;">';
  
  for (let player of list_of_gamers) {
    const score = data.scores[player.player] || 0;
    const hasDropped = data.playersWhoDropped.includes(player.player);
    const scoreText = score > 0 ? `+${score}` : score.toString();
    const droppedText = hasDropped ? ' (Dropped combinations)' : ' (No combinations)';
    
    gameEndHTML += `<p><strong>${player.playernickname}:</strong> ${scoreText}${droppedText}</p>`;
  }
  
  gameEndHTML += '</div>';
  gameEndHTML += '<button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 8px 16px;">Close</button>';
  
  gameEndDiv.innerHTML = gameEndHTML;
  document.body.appendChild(gameEndDiv);
  
  console.log("=== END GAME ENDED ===");
});

// Function to check if player can finish their hand
function checkCanFinishHand() {
  const board = getCachedElements('.board > div');
  const stonesInHand = [];
  
  board.forEach(div => {
    if (div.firstChild) {
      stonesInHand.push(div.firstChild);
    }
  });
  
  console.log("Stones in hand:", stonesInHand.length);
  
  // Player can finish if they have only 1 stone left and it's their turn
  if (stonesInHand.length === 1 && you === currentPlayer && didugetstone) {
    console.log("Player can finish their hand!");
    
    // Get the last stone
    const lastStone = stoneCSStoOBJECT(stonesInHand[0]);
    
    // Remove the stone from hand
    stonesInHand[0].remove();
    
    // Emit handisfinished event
    socket.emit('handisfinished', {
      player: you,
      board: [], // Empty board since hand is finished
      last_stone: lastStone
    });
    
    console.log("Hand finished - last stone:", lastStone);
    return true;
  }
  
  return false;
}

// Function to create finish hand button
function createFinishHandButton() {
  // Remove existing button if any
  const existingButton = document.getElementById('finish-hand-btn');
  if (existingButton) {
    existingButton.remove();
  }
  
  const board = getCachedElements('.board > div');
  const stonesInHand = [];
  
  board.forEach(div => {
    if (div.firstChild) {
      stonesInHand.push(div.firstChild);
    }
  });
  
  // Show finish hand button if player has only 1 stone and it's their turn
  if (stonesInHand.length === 1 && you === currentPlayer && didugetstone) {
    const finishButton = document.createElement('button');
    finishButton.id = 'finish-hand-btn';
    finishButton.textContent = '🎯 Finish Hand (Win!)';
    finishButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 10px 15px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    
    finishButton.addEventListener('click', () => {
      if (checkCanFinishHand()) {
        finishButton.remove();
      }
    });
    
    document.body.appendChild(finishButton);
    console.log("Finish hand button created");
  }
}

// Debug function to test complete game flow
function debugCompleteGameFlow() {
  console.log("=== DEBUG COMPLETE GAME FLOW ===");
  
  console.log("Current game state:");
  console.log("- You are player:", you);
  console.log("- Current player:", currentPlayer);
  console.log("- Did you get stone:", didugetstone);
  console.log("- First start:", firstStart);
  
  // Check stones in hand
  const board = getCachedElements('.board > div');
  const stonesInHand = [];
  board.forEach(div => {
    if (div.firstChild) {
      stonesInHand.push(div.firstChild);
    }
  });
  
  console.log("- Stones in hand:", stonesInHand.length);
  
  // Check if can finish hand
  const canFinish = stonesInHand.length === 1 && you === currentPlayer && didugetstone;
  console.log("- Can finish hand:", canFinish);
  
  // Check combinations
  const combinations = findAllValidCombinations();
  const totalPoints = calculateTotalCombinationPoints();
  console.log("- Valid combinations:", combinations.length);
  console.log("- Total points:", totalPoints);
  console.log("- Can drop combinations:", totalPoints >= 101);
  
  // Check middle deck
  const middleDeckStone = getCachedElement('.new');
  const deckCount = middleDeckStone ? parseInt(middleDeckStone.textContent) : 0;
  console.log("- Middle deck count:", deckCount);
  
  console.log("=== END DEBUG COMPLETE GAME FLOW ===");
}

// Handle meld errors (insufficient points for initial meld)
socket.on('meld_error', function(data) {
  console.log("=== MELD ERROR ===");
  console.log("Error message:", data.message);
  
  // Show error message to user
  alert(data.message);
  
  console.log("=== END MELD ERROR ===");
});

// Debug function to test all game rules
function debugAllGameRules() {
  console.log("=== DEBUG ALL GAME RULES ===");
  
  console.log("Current game state:");
  console.log("- You are player:", you);
  console.log("- Current player:", currentPlayer);
  console.log("- Did you get stone:", didugetstone);
  console.log("- Has drawn stone this turn:", hasDrawnStoneThisTurn);
  console.log("- First start:", firstStart);
  
  // Check stones in hand
  const board = getCachedElements('.board > div');
  const stonesInHand = [];
  board.forEach(div => {
    if (div.firstChild) {
      stonesInHand.push(div.firstChild);
    }
  });
  
  console.log("- Stones in hand:", stonesInHand.length);
  
  // Check if can finish hand
  const canFinish = stonesInHand.length === 1 && you === currentPlayer && didugetstone;
  console.log("- Can finish hand:", canFinish);
  
  // Check combinations
  const combinations = findAllValidCombinations();
  const totalPoints = calculateTotalCombinationPoints();
  console.log("- Valid combinations:", combinations.length);
  console.log("- Total points:", totalPoints);
  console.log("- Can drop combinations:", totalPoints >= 101);
  
  // Check turn rules
  const isMyTurn = you === currentPlayer;
  const canDrawStone = isMyTurn && stoneWithdrawalRight;
  const canDropCombinations = isMyTurn && (hasDrawnStoneThisTurn || firstStart);
  console.log("- Is my turn:", isMyTurn);
  console.log("- Can draw stone:", canDrawStone);
  console.log("- Can drop combinations:", canDropCombinations);
  
  // Check middle deck
  const middleDeckStone = getCachedElement('.new');
  const deckCount = middleDeckStone ? parseInt(middleDeckStone.textContent) : 0;
  console.log("- Middle deck count:", deckCount);
  
  console.log("=== END DEBUG ALL GAME RULES ===");
}

// Debug function to verify stone distribution and count
function debugStoneDistribution() {
  console.log("=== DEBUG STONE DISTRIBUTION ===");
  
  // Count stones in hand
  const board = getCachedElements('.board > div');
  const stonesInHand = [];
  board.forEach(div => {
    if (div.firstChild) {
      stonesInHand.push(div.firstChild);
    }
  });
  
  console.log("Stones in your hand:", stonesInHand.length);
  
  // Count stones by color
  const colorCount = {};
  stonesInHand.forEach(stone => {
    const color = stone.classList.contains('red') ? 'Red' :
                  stone.classList.contains('yellow') ? 'Yellow' :
                  stone.classList.contains('black') ? 'Black' :
                  stone.classList.contains('blue') ? 'Blue' : 'Unknown';
    colorCount[color] = (colorCount[color] || 0) + 1;
  });
  
  console.log("Stones by color:", colorCount);
  
  // Count jokers
  const jokers = stonesInHand.filter(stone => 
    stone.classList.contains('joker') || 
    stone.classList.contains('green') ||
    stone.textContent.includes(jokerSymbol) ||
    stone.textContent.includes(fakejokerSymbol)
  );
  
  console.log("Jokers in hand:", jokers.length);
  
  // Check middle deck count
  const middleDeckStone = getCachedElement('.new');
  const deckCount = middleDeckStone ? parseInt(middleDeckStone.textContent) : 0;
  console.log("Middle deck count:", deckCount);
  
  // Expected distribution according to Okey 101 rules:
  // - First player: 22 stones
  // - Other players: 21 stones each
  // - Middle deck: 21 stones
  const expectedHandSize = firstStart ? 22 : 21;
  console.log("Expected stones in hand:", expectedHandSize);
  console.log("Actual stones in hand:", stonesInHand.length);
  console.log("Distribution correct:", stonesInHand.length === expectedHandSize);
  
  console.log("=== END DEBUG STONE DISTRIBUTION ===");
}

