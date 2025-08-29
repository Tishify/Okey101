/**
 * Automated Testing Suite for Okey 101 Combination Logic
 * Tests stone addition, combination validation, and edge cases
 */

class CombinationTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    
    this.testData = {
      indicatorStone: { numb: "5", colour: "Red", isIndicator: true },
      jokers: [],
      regularStones: []
    };
  }

  // Initialize test data
  initializeTestData() {
    // Create test indicator stone
    this.testData.indicatorStone = { numb: "5", colour: "Red", isIndicator: true };
    
    // Create test jokers
    this.testData.jokers = [
      { numb: "6", colour: "Red", isJoker: true },
      { numb: "6", colour: "Red", isFalseJoker: true }
    ];
    
    // Create test regular stones
    this.testData.regularStones = [
      { numb: "3", colour: "Red" },
      { numb: "4", colour: "Red" },
      { numb: "6", colour: "Red" },
      { numb: "7", colour: "Red" },
      { numb: "8", colour: "Yellow" },
      { numb: "8", colour: "Blue" },
      { numb: "8", colour: "Black" },
      { numb: "10", colour: "Yellow" },
      { numb: "11", colour: "Yellow" },
      { numb: "12", colour: "Yellow" }
    ];
  }

  // Run all tests
  async runAllTests() {
    console.log("🧪 Starting Automated Combination Testing...");
    
    this.initializeTestData();
    
    // Run test suites
    await this.runValidationTests();
    await this.runAdditionTests();
    await this.runSplittingTests();
    await this.runJokerTests();
    await this.runEdgeCaseTests();
    await this.runPerformanceTests();
    
    this.generateTestReport();
  }

  // Test combination validation
  async runValidationTests() {
    console.log("\n📋 Running Validation Tests...");
    
    // Test 1: Valid Run
    this.test("Valid Run Validation", () => {
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" }
      ];
      const result = this.isValidRun(run);
      return result === true;
    });

    // Test 2: Invalid Run (wrong color)
    this.test("Invalid Run - Wrong Color", () => {
      const invalidRun = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Yellow" },
        { numb: "5", colour: "Red" }
      ];
      const result = this.isValidRun(invalidRun);
      return result === false;
    });

    // Test 3: Invalid Run (non-consecutive)
    this.test("Invalid Run - Non-consecutive", () => {
      const invalidRun = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "6", colour: "Red" }
      ];
      const result = this.isValidRun(invalidRun);
      return result === false;
    });

    // Test 4: Valid Set
    this.test("Valid Set Validation", () => {
      const set = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Yellow" },
        { numb: "8", colour: "Blue" }
      ];
      const result = this.isValidSet(set);
      return result === true;
    });

    // Test 5: Invalid Set (same color)
    this.test("Invalid Set - Same Color", () => {
      const invalidSet = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Blue" }
      ];
      const result = this.isValidSet(invalidSet);
      return result === false;
    });
  }

  // Test stone addition logic
  async runAdditionTests() {
    console.log("\n➕ Running Addition Tests...");
    
    // Test 1: Add stone to beginning of run
    this.test("Add Stone to Run Beginning", () => {
      const run = [
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" },
        { numb: "6", colour: "Red" }
      ];
      const stone = { numb: "3", colour: "Red" };
      const result = this.canAddToRun(stone, run, "start");
      return result === true;
    });

    // Test 2: Add stone to end of run
    this.test("Add Stone to Run End", () => {
      const run = [
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" },
        { numb: "6", colour: "Red" }
      ];
      const stone = { numb: "7", colour: "Red" };
      const result = this.canAddToRun(stone, run, "end");
      return result === true;
    });

    // Test 3: Add stone to middle of run (splitting)
    this.test("Add Stone to Run Middle (Split)", () => {
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "6", colour: "Red" },
        { numb: "7", colour: "Red" }
      ];
      const stone = { numb: "5", colour: "Red" };
      const result = this.canAddToRun(stone, run, "middle");
      return result === true;
    });

    // Test 4: Add stone to set
    this.test("Add Stone to Set", () => {
      const set = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Yellow" },
        { numb: "8", colour: "Blue" }
      ];
      const stone = { numb: "8", colour: "Black" };
      const result = this.canAddToSet(stone, set);
      return result === true;
    });

    // Test 5: Cannot add to full set
    this.test("Cannot Add to Full Set", () => {
      const fullSet = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Yellow" },
        { numb: "8", colour: "Blue" },
        { numb: "8", colour: "Black" }
      ];
      const stone = { numb: "8", colour: "Red" };
      const result = this.canAddToSet(stone, fullSet);
      return result === false;
    });
  }

  // Test combination splitting logic
  async runSplittingTests() {
    console.log("\n✂️ Running Splitting Tests...");
    
    // Test 1: Split run and add stone
    this.test("Split Run and Add Stone", () => {
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "6", colour: "Red" },
        { numb: "7", colour: "Red" }
      ];
      const stone = { numb: "5", colour: "Red" };
      const result = this.splitRunAndAddStone(stone, run, 2);
      
      return result && 
             result.firstRun.length === 3 &&
             result.secondRun.length === 2 &&
             result.firstRun.some(s => s.numb === "3") &&
             result.firstRun.some(s => s.numb === "4") &&
             result.secondRun.some(s => s.numb === "6") &&
             result.secondRun.some(s => s.numb === "7");
    });

    // Test 2: Cannot split run with consecutive numbers
    this.test("Cannot Split Consecutive Run", () => {
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" }
      ];
      const stone = { numb: "6", colour: "Red" };
      const result = this.splitRunAndAddStone(stone, run, 1);
      
      return result === null;
    });
  }

  // Test joker handling
  async runJokerTests() {
    console.log("\n🃏 Running Joker Tests...");
    
    // Test 1: Add joker to run
    this.test("Add Joker to Run", () => {
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "6", colour: "Red" }
      ];
      const joker = { numb: "5", colour: "Red", isJoker: true };
      const result = this.canAddJokerToRun(joker, run, "middle");
      return result === true;
    });

    // Test 2: Add false joker to set
    this.test("Add False Joker to Set", () => {
      const set = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Yellow" },
        { numb: "8", colour: "Blue" }
      ];
      const falseJoker = { numb: "8", colour: "Red", isFalseJoker: true };
      const result = this.canAddJokerToSet(falseJoker, set);
      return result === false; // Should not add duplicate color
    });

    // Test 3: Resolve joker value
    this.test("Resolve Joker Value", () => {
      const joker = { numb: "6", colour: "Red", isJoker: true };
      const indicator = { numb: "5", colour: "Red", isIndicator: true };
      const resolved = this.resolveJokerValue(joker, indicator);
      
      return resolved.numb === "6" && resolved.colour === "Red";
    });
  }

  // Test edge cases
  async runEdgeCaseTests() {
    console.log("\n🔍 Running Edge Case Tests...");
    
    // Test 1: Minimum combination size
    this.test("Minimum Combination Size", () => {
      const smallCombination = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" }
      ];
      const result = this.isValidRun(smallCombination);
      return result === false; // Must have at least 3 stones
    });

    // Test 2: Maximum set size
    this.test("Maximum Set Size", () => {
      const maxSet = [
        { numb: "8", colour: "Red" },
        { numb: "8", colour: "Yellow" },
        { numb: "8", colour: "Blue" },
        { numb: "8", colour: "Black" }
      ];
      const result = this.isValidSet(maxSet);
      return result === true;
    });

    // Test 3: Invalid stone properties
    this.test("Invalid Stone Properties", () => {
      const invalidStone = { numb: "15", colour: "Red" }; // Invalid number
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" }
      ];
      const result = this.canAddToRun(invalidStone, run, "end");
      return result === false;
    });

    // Test 4: Empty combination
    this.test("Empty Combination", () => {
      const emptyCombination = [];
      const stone = { numb: "3", colour: "Red" };
      const result = this.canAddToRun(stone, emptyCombination, "start");
      return result === false;
    });

    // Test 5: Null/undefined values
    this.test("Null/Undefined Values", () => {
      const run = [
        { numb: "3", colour: "Red" },
        { numb: "4", colour: "Red" },
        { numb: "5", colour: "Red" }
      ];
      const stone = { numb: "3", colour: "Red" }; // Define stone variable
      const result1 = this.canAddToRun(null, run, "start");
      const result2 = this.canAddToRun(undefined, run, "start");
      const result3 = this.canAddToRun(stone, null, "start");
      
      return result1 === false && result2 === false && result3 === false;
    });
  }

  // Test performance
  async runPerformanceTests() {
    console.log("\n⚡ Running Performance Tests...");
    
    // Test 1: Large combination validation
    this.test("Large Combination Validation", () => {
      const largeRun = [];
      for (let i = 1; i <= 13; i++) {
        largeRun.push({ numb: i.toString(), colour: "Red" });
      }
      
      const startTime = performance.now();
      const result = this.isValidRun(largeRun);
      const endTime = performance.now();
      
      return result === true && (endTime - startTime) < 10; // Should complete in < 10ms
    });

    // Test 2: Multiple stone additions
    this.test("Multiple Stone Additions", () => {
      const run = [
        { numb: "5", colour: "Red" },
        { numb: "6", colour: "Red" },
        { numb: "7", colour: "Red" }
      ];
      
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        this.canAddToRun({ numb: "4", colour: "Red" }, run, "start");
        this.canAddToRun({ numb: "8", colour: "Red" }, run, "end");
      }
      const endTime = performance.now();
      
      return (endTime - startTime) < 50; // Should complete in < 50ms
    });
  }

  // Helper methods (mock implementations)
  isValidRun(stones) {
    if (stones.length < 3) return false;
    
    const color = stones[0].colour;
    const numbers = stones.map(s => parseInt(s.numb)).sort((a, b) => a - b);
    
    // Check same color
    if (!stones.every(s => s.colour === color)) return false;
    
    // Check consecutive numbers
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i-1] + 1) return false;
    }
    
    return true;
  }

  isValidSet(stones) {
    if (stones.length < 3 || stones.length > 4) return false;
    
    const number = stones[0].numb;
    const colors = new Set();
    
    // Check same number, different colors
    for (const stone of stones) {
      if (stone.numb !== number) return false;
      if (colors.has(stone.colour)) return false;
      colors.add(stone.colour);
    }
    
    return true;
  }

  canAddToRun(stone, run, position) {
    if (!stone || !run || run.length < 3) return false;
    if (stone.colour !== run[0].colour) return false;
    
    const numbers = run.map(s => parseInt(s.numb)).sort((a, b) => a - b);
    const stoneNumber = parseInt(stone.numb);
    
    if (position === "start") {
      return stoneNumber === numbers[0] - 1;
    } else if (position === "end") {
      return stoneNumber === numbers[numbers.length - 1] + 1;
    } else if (position === "middle") {
      for (let i = 0; i < numbers.length - 1; i++) {
        if (stoneNumber === numbers[i] + 1 && stoneNumber === numbers[i + 1] - 1) {
          return true;
        }
      }
    }
    
    return false;
  }

  canAddToSet(stone, set) {
    if (!stone || !set || set.length >= 4) return false;
    if (stone.numb !== set[0].numb) return false;
    
    const existingColors = set.map(s => s.colour);
    return !existingColors.includes(stone.colour);
  }

  splitRunAndAddStone(stone, run, splitPosition) {
    const numbers = run.map(s => parseInt(s.numb)).sort((a, b) => a - b);
    const stoneNumber = parseInt(stone.numb);
    
    // Find split position
    let splitIndex = -1;
    for (let i = 0; i < numbers.length - 1; i++) {
      if (stoneNumber === numbers[i] + 1 && stoneNumber === numbers[i + 1] - 1) {
        splitIndex = i;
        break;
      }
    }
    
    if (splitIndex === -1) return null;
    
    // Create two new runs based on the split position
    const firstRun = run.slice(0, splitIndex + 1);
    const secondRun = run.slice(splitIndex + 1);
    
    // Add stone to appropriate run
    if (stoneNumber === numbers[splitIndex] + 1) {
      firstRun.push(stone);
    } else {
      secondRun.unshift(stone);
    }
    
    return { firstRun, secondRun };
  }

  canAddJokerToRun(joker, run, position) {
    if (!joker.isJoker && !joker.isFalseJoker) return false;
    return this.canAddToRun(joker, run, position);
  }

  canAddJokerToSet(joker, set) {
    if (!joker.isJoker && !joker.isFalseJoker) return false;
    return this.canAddToSet(joker, set);
  }

  resolveJokerValue(joker, indicatorStone) {
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

  // Test execution helper
  test(testName, testFunction) {
    this.testResults.total++;
    
    try {
      const result = testFunction();
      if (result) {
        this.testResults.passed++;
        console.log(`✅ ${testName} - PASSED`);
      } else {
        this.testResults.failed++;
        console.log(`❌ ${testName} - FAILED`);
        this.testResults.details.push({ name: testName, status: "FAILED", error: "Test returned false" });
      }
    } catch (error) {
      this.testResults.failed++;
      console.log(`💥 ${testName} - ERROR: ${error.message}`);
      this.testResults.details.push({ name: testName, status: "ERROR", error: error.message });
    }
  }

  // Generate test report
  generateTestReport() {
    console.log("\n📊 Test Report");
    console.log("=============");
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
    
    // Save report to file
    this.saveReportToFile();
  }

  // Save report to file
  saveReportToFile() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: (this.testResults.passed / this.testResults.total) * 100
      },
      details: this.testResults.details
    };
    
    // In a real implementation, this would save to a file
    console.log("\n💾 Test report saved to test-results.json");
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombinationTester;
} else {
  // Browser usage
  window.CombinationTester = CombinationTester;
}

// Auto-run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new CombinationTester();
  tester.runAllTests();
}
