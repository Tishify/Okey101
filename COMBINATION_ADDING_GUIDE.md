# Combination Adding Guide - Okey 101

## Overview

This guide covers the implementation of the "Add New Combinations After Opening" feature for Okey 101. Once a player has made their initial meld (≥101 points), they can add tiles to existing combinations and create new combinations from their hand.

## Key Features

### 1. Initial Meld Requirement (NEW)
**Players must complete their initial meld before creating new combinations:**

- **Sets/Runs:** Valid sets and/or runs totaling ≥101 points in a single turn
- **Doubles:** At least five pairs in one turn
- **Tile Values:** Face value (1-13 points), jokers = value they represent

### 2. Adding to Existing Combinations
After opening, players can:
- Add tiles to any existing combination on the table (their own or other players')
- Split existing runs to insert tiles
- Extend runs at the beginning or end

### 3. Creating New Combinations (RESTRICTED)
**Only opened players can create new combinations:**
- Place new valid combinations directly from their hand
- Each combination must be a valid run or set
- Can be done in the same turn as adding to existing combinations

## Implementation Details

### Client-Side (client/main.js)

#### Player Opened Status Tracking
```javascript
// Global variable to track if current player has completed initial meld
let currentPlayerHasOpened = false;

function hasCompletedInitialMeld() {
  // Check if current player has completed their initial meld
  return currentPlayerHasOpened;
}
```

#### New Combination Creation (RESTRICTED)
```javascript
function createNewCombinationFromStones() {
  // Check if player has completed initial meld
  if (!hasCompletedInitialMeld()) {
    alert('Вы должны сначала сбросить комбинацию на 101+ очков, прежде чем создавать новые комбинации.');
    return false;
  }

  // Get selected stones from the board
  const selectedStones = getSelectedStonesFromBoard();
  if (selectedStones.length < 3) {
    alert('Выберите минимум 3 камня для создания комбинации.');
    return false;
  }

  // Validate the combination
  if (!isValidCombination(selectedStones)) {
    alert('Выбранные камни не образуют валидную комбинацию.');
    return false;
  }

  // Send new combination to server
  socket.emit('place new combination', {
    player: you,
    combination: combination,
    hasDrawnStone: hasDrawnStoneThisTurn
  });

  return true;
}
```

#### Stone Selection (RESTRICTED)
```javascript
function toggleStoneSelectionForNewCombination(stoneElement) {
  if (!hasCompletedInitialMeld()) {
    alert('Вы должны сначала сбросить комбинацию на 101+ очков, прежде чем создавать новые комбинации.');
    return;
  }

  // Toggle selection logic...
}
```

#### UI Button Updates
```javascript
function updateCreateCombinationButton() {
  const button = getCachedElement('#create-new-combination-btn');
  const selectedStones = getSelectedStonesFromBoard();
  const isValid = selectedStones.length >= 3 && isValidCombination(selectedStones);
  const points = isValid ? calculateCombinationPoints(selectedStones) : 0;
  const hasOpened = hasCompletedInitialMeld();

  if (isValid && hasOpened) {
    button.disabled = false;
    button.textContent = `Создать комбинацию (${points} очков)`;
    button.style.backgroundColor = '#4CAF50';
  } else if (isValid && !hasOpened) {
    button.disabled = true;
    button.textContent = `Создать комбинацию (${points} очков) - Сначала откройте руку`;
    button.style.backgroundColor = '#f44336';
  } else {
    button.disabled = true;
    button.textContent = 'Создать комбинацию';
    button.style.backgroundColor = '#ccc';
  }
}
```

### Server-Side (server/server.js)

#### Initial Meld Tracking
```javascript
// Track players who have completed their initial meld
const playersInitialMeld = new Set();

// When player drops combinations
if (isInitialMeld) {
  playersInitialMeld.add(find_player[0].player);
  log(`Player ${playerName} completed initial meld with ${totalPoints} points`);
}
```

#### New Combination Validation (RESTRICTED)
```javascript
socket.on('place new combination', (data) => {
  // Check if player has completed initial meld
  if (!playersInitialMeld.has(find_player[0].player)) {
    log(`Player ${playerName} attempted to place new combination without completing initial meld`);
    io.to(soketID).emit('new combination error', { 
      message: `You must complete your initial meld (101+ points) before placing new combinations.` 
    });
    return;
  }
  
  // Continue with validation...
});
```

#### Player Opened Notification
```javascript
// Notify the player that they have opened (if this was their initial meld)
if (isInitialMeld) {
  io.to(soketID).emit('player opened', {
    player: data.player,
    totalPoints: data.totalPoints
  });
}
```

### Client-Side Event Handlers

#### Player Opened Notification
```javascript
socket.on('player opened', function(data) {
  console.log('Player opened:', data);
  if (data.player === you) {
    currentPlayerHasOpened = true;
    console.log('Current player has opened with', data.totalPoints, 'points');
    alert(`Поздравляем! Вы открыли руку с ${data.totalPoints} очками. Теперь вы можете создавать новые комбинации и добавлять камни к существующим комбинациям.`);
  }
});
```

#### New Combination Placed
```javascript
socket.on('combination placed', function(data) {
  // If this is the current player, mark them as opened
  if (data.player === you && !currentPlayerHasOpened) {
    currentPlayerHasOpened = true;
    console.log('Current player has opened by placing new combination');
  }
  
  // Add combination to table display...
});
```

## Usage Examples

### Example 1: Player Opens with Initial Meld
1. **Player draws stone** and arranges hand
2. **Player creates combinations** totaling ≥101 points
3. **Player clicks "Drop Combinations"** → Initial meld completed
4. **Server sends 'player opened'** notification
5. **Client updates status** → `currentPlayerHasOpened = true`
6. **Player can now** create new combinations and add to existing ones

### Example 2: Attempting New Combination Before Opening
1. **Player tries to select stones** for new combination
2. **Client checks** `hasCompletedInitialMeld()` → Returns `false`
3. **Alert shown**: "Вы должны сначала сбросить комбинацию на 101+ очков..."
4. **Stone selection blocked** until player opens

### Example 3: Creating New Combination After Opening
1. **Player has opened** (`currentPlayerHasOpened = true`)
2. **Player selects 3+ stones** forming valid combination
3. **Button shows**: "Создать комбинацию (X очков)" in green
4. **Player clicks button** → Combination sent to server
5. **Server validates** player has opened → Allows placement
6. **Stones removed** from hand, combination appears on table

### Example 4: Adding to Existing Combinations
1. **Player has opened** (can add to any combination)
2. **Player clicks** on existing combination on table
3. **Modal shows** available stones from hand
4. **Player selects stone** → Stone added to combination
5. **Combination updated** on table

## Validation Rules

### Initial Meld Requirements
- **Minimum Points**: 101 points total
- **Valid Combinations**: Runs (3+ consecutive same color) or Sets (3-4 same number, different colors)
- **Joker Handling**: Jokers replace missing tiles, valued as the tile they represent
- **Doubles Alternative**: 5+ pairs can also open the hand

### New Combination Rules (RESTRICTED)
- **Eligibility**: Only players who have completed initial meld
- **Minimum Stones**: 3 stones per combination
- **Valid Types**: Runs or Sets only
- **Turn Requirements**: Must be player's turn and have drawn a stone

### Adding to Existing Combinations
- **Eligibility**: Only players who have completed initial meld
- **Valid Additions**: Must maintain valid run or set structure
- **Run Splitting**: Can split runs to insert tiles
- **Set Limits**: Maximum 4 stones per set (one per suit)

## UI Elements

### Buttons
- **"Drop Combinations"**: For initial meld (≥101 points)
- **"Create New Combination"**: For new combinations (only if opened)
- **"Add Stone"**: For adding to existing combinations (only if opened)

### Visual Indicators
- **Green Button**: Can create new combination (opened + valid selection)
- **Red Button**: Valid selection but not opened
- **Gray Button**: Invalid selection or not enough stones
- **Selected Stones**: Green border and scale effect

### Status Messages
- **Success**: "Поздравляем! Вы открыли руку с X очками..."
- **Error**: "Вы должны сначала сбросить комбинацию на 101+ очков..."
- **Validation**: "Выберите минимум 3 камня для создания комбинации"

## Testing

### Test Functions
- **`checkPlayerOpenedStatus()`**: Shows current opened status and requirements
- **`debugCombinationDropping()`**: Debug combination creation process
- **`testNewCombinationCreation()`**: Test new combination functionality

### Test Scenarios
1. **Pre-Opening**: Try to create combinations before opening
2. **Post-Opening**: Create combinations after completing initial meld
3. **Invalid Combinations**: Try to create invalid runs/sets
4. **Adding to Combinations**: Add stones to existing table combinations

## Error Handling

### Client-Side Validation
- **Opened Status Check**: Prevents actions before initial meld
- **Combination Validation**: Ensures valid runs/sets
- **Stone Count Check**: Minimum 3 stones required
- **Turn Validation**: Must be player's turn

### Server-Side Validation
- **Initial Meld Check**: Verifies player has opened
- **Turn Validation**: Ensures it's the player's turn
- **Stone Ownership**: Confirms stones are from player's hand
- **Combination Validity**: Validates run/set structure

### Error Messages
- **Not Opened**: "You must complete your initial meld (101+ points) before placing new combinations"
- **Wrong Turn**: "It's not your turn. You can only place combinations during your turn"
- **Invalid Combination**: "Selected stones do not form a valid combination"
- **Not Enough Stones**: "Select at least 3 stones to create a combination"

## Performance Optimizations

### Caching
- **DOM Elements**: Cached selectors for better performance
- **Combination Validation**: Memoized validation results
- **Stone Selection**: Efficient selection tracking

### Event Handling
- **Debounced Updates**: Prevents excessive button updates
- **Optimized Listeners**: Efficient event delegation
- **Memory Cleanup**: Proper cleanup of event listeners

## Future Enhancements

### Planned Features
- **Visual Feedback**: Enhanced visual indicators for opened status
- **Auto-Suggestions**: Suggest valid combinations
- **Undo Functionality**: Allow undoing combination placements
- **Advanced Validation**: More sophisticated combination validation

### Potential Improvements
- **Animation Effects**: Smooth transitions for combination placement
- **Sound Effects**: Audio feedback for successful actions
- **Keyboard Shortcuts**: Hotkeys for common actions
- **Mobile Optimization**: Touch-friendly interface improvements

## Conclusion

The "Add New Combinations After Opening" feature provides a strategic layer to Okey 101 gameplay. Players must carefully consider when to open their hand (≥101 points) to gain the ability to create new combinations and manipulate existing ones. The restriction ensures that the initial meld requirement is properly enforced while allowing opened players to be more flexible in their gameplay.

The implementation includes comprehensive validation, clear user feedback, and proper error handling to ensure a smooth gaming experience. The feature enhances the strategic depth of the game by requiring players to balance the benefits of opening early versus the risks of exposing their hand. 