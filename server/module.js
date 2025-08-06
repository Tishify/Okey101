const _ = require('underscore');

function gameStart(onlineList) {
  numbers = ["1","2","3","4","5","6","7","8","9","10","11","12","13"];
  colours = ["Red", "Yellow", "Black", "Blue"];
  deck = new Array;
  
  const stone = {
    isOkey: false,
    isIndicator: false,
    isFalseJoker: false,
    isJoker: false, // Add proper joker identification
    playernickname: function() {
      return `${this.colour} (${this.numb})`;
    },
    colornumberWrite: function() {
      console.log(`${this.colour} (${this.numb})`);
    }
  };
  
  const joker = Object.create(stone);
  joker.colour = "";
  joker.numb = "";
  joker.isFalseJoker = true;
  joker.isJoker = false; // False jokers are not actual jokers
  
  function valueofjoker(fakejoker) {
    // Give the real okey's values to the false joker.
    if (fakejoker.isFalseJoker) {
      fakejoker.colour = okeystone.colour;
      fakejoker.numb = okeystone.numb;
    };
  };
  
  // Create regular stones (13 numbers × 4 colors × 2 each = 104 stones)
  for (let colour = 0; colour < colours.length; colour++) {
    for (let numb = 0; numb < numbers.length; numb++) {
      let me = Object.create(stone);
      me.colour = colours[colour];
      me.numb = numbers[numb];
      deck.push(me);
      deck.push(me);  // 2 of each stone.
    };
  };
  
  console.log("Regular stones created:", deck.length, "(should be 104)");
  
  var deck = _.shuffle(deck);  // First shuffle.
  
  // Select the first stone as Okey. Its pair is automatically selected.
  const okeystone = deck[0];
  okeystone.isOkey = true;
  console.log("Indicator stone:", okeystone);

  // Calculate the joker number (one higher than indicator, or 1 if indicator is 13)
  let jokerNumber;
  if (okeystone.numb === "13") {
    jokerNumber = "1";
  } else {
    jokerNumber = (parseInt(okeystone.numb) + 1).toString();
  }
  
  // Mark all tiles of the same color as the indicator and joker number as actual jokers
  for (let i = 0; i < deck.length; i++) {
    const stone = deck[i];
    if (stone.colour === okeystone.colour && stone.numb === jokerNumber) {
      stone.isJoker = true;
      console.log("Joker identified:", stone);
    }
  }

  valueofjoker(joker);
  deck.push(joker);
  deck.push(joker);
  
  console.log("Total stones after adding false jokers:", deck.length, "(should be 106)");
  
  for (let i = 0; i < deck.length; i++) {
    const stone = deck[i];
    // TODO: If Okey = 1, direct the indicator to 13!
    if (okeystone.numb !== "1") {
      if (stone.colour === okeystone.colour && Number(stone.numb) === Number(okeystone.numb) - 1) {
        var indicatorstone = stone;
        indicatorstone.isIndicator = true;
        console.log("Indicator stone found:", indicatorstone);
        break
      }
    } else {
      if (stone.colour === okeystone.colour && stone.numb === "13") {
        var indicatorstone = stone;
        indicatorstone.isIndicator = true;
        console.log("Indicator stone found:", indicatorstone);
        break
      }
    }
  }
  var deck = _.shuffle(deck); // Final shuffle. After fake okey is added.
  
  // Move functions to separate .js file.
  function deckSort(deck) {
    deck.sort((a, b) => {
      return a.numb - b.numb;
    });
  };

  for (let player = 0; player < onlineList.length; player++) {
    destesi = new Array;
    
    // According to Okey 101 rules:
    // - First player gets 22 stones
    // - Other players get 21 stones each
    const stonesToGive = onlineList[player].isFirstPlayer ? 22 : 21;
    
    for (let stone = 0; stone < stonesToGive; stone++) {
      const stone = deck.pop();
      destesi.push(stone);
    };
    
    deckSort(destesi);  // Sorts everyone's deck.
    onlineList[player].destesi = destesi;
    
    console.log(`Player ${onlineList[player].playernickname} gets ${destesi.length} stones`);
  };
  
  console.log("Number of stones in the middle: " + deck.length, "(should be 21)");
  
  // Verify total stone count
  const totalDistributed = onlineList.reduce((sum, player) => sum + player.destesi.length, 0);
  const totalStones = totalDistributed + deck.length;
  console.log("Total stones verification:", totalStones, "(should be 106)");
  
  if (totalStones !== 106) {
    console.error("ERROR: Total stone count is incorrect!");
  }
  
  return [okeystone, indicatorstone, onlineList, deck];
};

function findPlayer(soketID, onlineList) {
  return _.where(onlineList, { id: soketID });  // Returns list!
};

module.exports = {
  gameStart,
  findPlayer,
};