/**
 * Integration Testing for Okey 101 Stone Addition Logic
 * Tests the complete flow from client to server and back
 */

const io = require('socket.io-client');
const CombinationTester = require('./combination-testing.js');

class IntegrationTester {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.clients = [];
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  // Connect test clients
  async connectClients(numPlayers = 4) {
    console.log(`🔌 Connecting ${numPlayers} test clients...`);
    
    for (let i = 0; i < numPlayers; i++) {
      const client = io(this.serverUrl);
      const playerName = `TestPlayer${i + 1}`;
      
      await this.waitForConnection(client);
      
      // Join game
      await this.joinGame(client, playerName);
      
      this.clients.push({
        socket: client,
        name: playerName,
        id: i + 1
      });
    }
    
    console.log(`✅ All ${numPlayers} clients connected and joined game`);
  }

  // Wait for client connection
  waitForConnection(client) {
    return new Promise((resolve) => {
      if (client.connected) {
        resolve();
      } else {
        client.on('connect', resolve);
      }
    });
  }

  // Join game
  joinGame(client, playerName) {
    return new Promise((resolve) => {
      client.emit('join game', { player: playerName });
      
      // Wait for confirmation
      client.once('game joined', (data) => {
        console.log(`Player ${playerName} joined game`);
        resolve(data);
      });
    });
  }

  // Run all integration tests
  async runAllTests() {
    console.log("🧪 Starting Integration Testing...");
    
    try {
      // Connect clients
      await this.connectClients(4);
      
      // Wait for game to start
      await this.waitForGameStart();
      
      // Run test suites
      await this.runStoneAdditionTests();
      await this.runCombinationSplittingTests();
      await this.runJokerHandlingTests();
      await this.runErrorHandlingTests();
      
      this.generateTestReport();
      
    } catch (error) {
      console.error("❌ Integration test failed:", error);
    } finally {
      // Cleanup
      await this.disconnectClients();
    }
  }

  // Wait for game to start
  async waitForGameStart() {
    console.log("⏳ Waiting for game to start...");
    
    return new Promise((resolve) => {
      let playersReady = 0;
      const requiredPlayers = 4;
      
      this.clients.forEach(client => {
        client.socket.once('game started', (data) => {
          playersReady++;
          console.log(`Player ${client.name} received game start`);
          
          if (playersReady === requiredPlayers) {
            console.log("🎮 Game started for all players");
            resolve(data);
          }
        });
      });
    });
  }

  // Test stone addition to combinations
  async runStoneAdditionTests() {
    console.log("\n➕ Running Stone Addition Integration Tests...");
    
    const player1 = this.clients[0];
    const player2 = this.clients[1];
    
    // Test 1: Add stone to beginning of run
    this.test("Integration: Add Stone to Run Beginning", async () => {
      // Create a run on table
      const run = [
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" },
        { numb: "6", colour: "Red" }
      ];
      
      await this.placeCombination(player2, run);
      
      // Try to add stone to beginning
      const stone = { numb: "3", colour: "Red" };
      const result = await this.addStoneToCombination(player1, stone, run, "start");
      
      return result.success === true;
    });
    
    // Test 2: Add stone to set
    this.test("Integration: Add Stone to Set", async () => {
      const set = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Yellow" },
        { numb: "8", colour: "Blue" }
      ];
      
      await this.placeCombination(player2, set);
      
      const stone = { numb: "8", colour: "Black" };
      const result = await this.addStoneToCombination(player1, stone, set, "auto");
      
      return result.success === true;
    });
    
    // Test 3: Cannot add to full set
    this.test("Integration: Cannot Add to Full Set", async () => {
      const fullSet = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Yellow" },
        { numb: "8", colour: "Blue" },
        { numb: "8", colour: "Black" }
      ];
      
      await this.placeCombination(player2, fullSet);
      
      const stone = { numb: "8", colour: "Red" };
      const result = await this.addStoneToCombination(player1, stone, fullSet, "auto");
      
      return result.success === false;
    });
  }

  // Test combination splitting
  async runCombinationSplittingTests() {
    console.log("\n✂️ Running Combination Splitting Integration Tests...");
    
    const player1 = this.clients[0];
    const player2 = this.clients[1];
    
    // Test 1: Split run and add stone
    this.test("Integration: Split Run and Add Stone", async () => {
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "6", colour: "Red" },
        { numb: "7", colour: "Red" }
      ];
      
      await this.placeCombination(player2, run);
      
      const stone = { numb: "5", colour: "Red" };
      const result = await this.addStoneToCombination(player1, stone, run, "middle");
      
      return result.success === true && result.splitResult;
    });
  }

  // Test joker handling
  async runJokerHandlingTests() {
    console.log("\n🃏 Running Joker Handling Integration Tests...");
    
    const player1 = this.clients[0];
    const player2 = this.clients[1];
    
    // Test 1: Add joker to run
    this.test("Integration: Add Joker to Run", async () => {
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "6", colour: "Red" }
      ];
      
      await this.placeCombination(player2, run);
      
      const joker = { numb: "5", colour: "Red", isJoker: true };
      const result = await this.addStoneToCombination(player1, joker, run, "middle");
      
      return result.success === true;
    });
    
    // Test 2: Add false joker to set
    this.test("Integration: Add False Joker to Set", async () => {
      const set = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Yellow" },
        { numb: "8", colour: "Blue" }
      ];
      
      await this.placeCombination(player2, set);
      
      const falseJoker = { numb: "8", colour: "Red", isFalseJoker: true };
      const result = await this.addStoneToCombination(player1, falseJoker, set, "auto");
      
      return result.success === false; // Should fail due to duplicate color
    });
  }

  // Test error handling
  async runErrorHandlingTests() {
    console.log("\n🚨 Running Error Handling Integration Tests...");
    
    const player1 = this.clients[0];
    
    // Test 1: Cannot add stone outside turn
    this.test("Integration: Cannot Add Stone Outside Turn", async () => {
      const run = [
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" },
        { numb: "6", colour: "Red" }
      ];
      
      const stone = { numb: "3", colour: "Red" };
      
      // Try to add stone when it's not player's turn
      const result = await this.addStoneToCombination(player1, stone, run, "start", false);
      
      return result.success === false && result.error.includes("not your turn");
    });
    
    // Test 2: Cannot add stone without initial meld
    this.test("Integration: Cannot Add Stone Without Initial Meld", async () => {
      const run = [
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" },
        { numb: "6", colour: "Red" }
      ];
      
      const stone = { numb: "3", colour: "Red" };
      
      // Try to add stone before completing initial meld
      const result = await this.addStoneToCombination(player1, stone, run, "start", false);
      
      return result.success === false && result.error.includes("initial meld");
    });
  }

  // Helper method to place combination on table
  async placeCombination(player, combination) {
    return new Promise((resolve) => {
      player.socket.emit('place new combination', {
        player: player.id,
        combination: combination,
        hasDrawnStone: true
      });
      
      player.socket.once('combination placed', resolve);
    });
  }

  // Helper method to add stone to combination
  async addStoneToCombination(player, stone, combination, position, checkTurn = true) {
    return new Promise((resolve) => {
      player.socket.emit('add stone to table combination', {
        player: player.id,
        stone: stone,
        targetCombination: combination,
        position: position,
        hasDrawnStone: true
      });
      
      // Listen for success or error
      player.socket.once('stone added to combination', (data) => {
        resolve({ success: true, data: data });
      });
      
      player.socket.once('add stone error', (data) => {
        resolve({ success: false, error: data.message });
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        resolve({ success: false, error: "Timeout" });
      }, 5000);
    });
  }

  // Test execution helper
  test(testName, testFunction) {
    this.testResults.total++;
    
    testFunction().then(result => {
      if (result) {
        this.testResults.passed++;
        console.log(`✅ ${testName} - PASSED`);
      } else {
        this.testResults.failed++;
        console.log(`❌ ${testName} - FAILED`);
        this.testResults.details.push({ name: testName, status: "FAILED", error: "Test returned false" });
      }
    }).catch(error => {
      this.testResults.failed++;
      console.log(`💥 ${testName} - ERROR: ${error.message}`);
      this.testResults.details.push({ name: testName, status: "ERROR", error: error.message });
    });
  }

  // Generate test report
  generateTestReport() {
    console.log("\n📊 Integration Test Report");
    console.log("=========================");
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
    
    if (this.testResults.failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.testResults.details.forEach(detail => {
        if (detail.status !== "PASSED") {
          console.log(`  - ${detail.name}: ${detail.error}`);
        }
      });
    }
  }

  // Disconnect all clients
  async disconnectClients() {
    console.log("🔌 Disconnecting clients...");
    
    for (const client of this.clients) {
      client.socket.disconnect();
    }
    
    this.clients = [];
    console.log("✅ All clients disconnected");
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntegrationTester;
} else {
  // Browser usage
  window.IntegrationTester = IntegrationTester;
}

// Auto-run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests();
}
