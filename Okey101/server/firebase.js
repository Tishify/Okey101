const admin = require('firebase-admin');
const { adminConfig } = require('../firebase-config');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(adminConfig),
  databaseURL: `https://${adminConfig.project_id}-default-rtdb.firebaseio.com`
});

const db = admin.firestore();
const auth = admin.auth();
const rtdb = admin.database();

// Firebase Database Collections
const COLLECTIONS = {
  USERS: 'users',
  GAMES: 'games',
  GAME_SESSIONS: 'game_sessions',
  PLAYER_STATS: 'player_stats',
  LEADERBOARD: 'leaderboard'
};

// User Management
class FirebaseUserManager {
  static async createUser(userData) {
    try {
      const userRef = db.collection(COLLECTIONS.USERS).doc(userData.uid);
      await userRef.set({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || userData.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        averageScore: 0
      });
      return userData.uid;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUser(uid) {
    try {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  static async updateUserStats(uid, gameResult) {
    try {
      const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) return;

      const userData = userDoc.data();
      const newGamesPlayed = userData.gamesPlayed + 1;
      const newGamesWon = userData.gamesWon + (gameResult.won ? 1 : 0);
      const newTotalScore = userData.totalScore + gameResult.score;
      const newAverageScore = newTotalScore / newGamesPlayed;

      await userRef.update({
        gamesPlayed: newGamesPlayed,
        gamesWon: newGamesWon,
        totalScore: newTotalScore,
        averageScore: newAverageScore,
        lastGameAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }
}

// Game Session Management
class FirebaseGameManager {
  static async createGameSession(gameData) {
    try {
      const gameRef = db.collection(COLLECTIONS.GAME_SESSIONS).doc();
      const gameId = gameRef.id;
      
      await gameRef.set({
        gameId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        players: gameData.players,
        gameState: gameData.gameState,
        settings: gameData.settings
      });

      // Set up real-time listeners
      this.setupGameListeners(gameId);
      
      return gameId;
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  }

  static async updateGameState(gameId, gameState) {
    try {
      await db.collection(COLLECTIONS.GAME_SESSIONS).doc(gameId).update({
        gameState,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }

  static async endGameSession(gameId, finalState) {
    try {
      await db.collection(COLLECTIONS.GAME_SESSIONS).doc(gameId).update({
        status: 'completed',
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
        finalState
      });
    } catch (error) {
      console.error('Error ending game session:', error);
      throw error;
    }
  }

  static setupGameListeners(gameId) {
    // Real-time database listener for game state changes
    const gameRef = rtdb.ref(`games/${gameId}`);
    gameRef.on('value', (snapshot) => {
      const gameData = snapshot.val();
      if (gameData) {
        // Handle real-time game updates
        console.log('Game state updated:', gameData);
      }
    });
  }
}

// Leaderboard Management
class FirebaseLeaderboardManager {
  static async updateLeaderboard(playerData) {
    try {
      const leaderboardRef = db.collection(COLLECTIONS.LEADERBOARD).doc(playerData.uid);
      await leaderboardRef.set({
        uid: playerData.uid,
        displayName: playerData.displayName,
        gamesWon: playerData.gamesWon,
        totalScore: playerData.totalScore,
        averageScore: playerData.averageScore,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }
  }

  static async getTopPlayers(limit = 10) {
    try {
      const snapshot = await db.collection(COLLECTIONS.LEADERBOARD)
        .orderBy('gamesWon', 'desc')
        .orderBy('averageScore', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
}

// Authentication Middleware
const authenticateUser = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decodedToken = await auth.verifyIdToken(token);
    socket.userId = decodedToken.uid;
    socket.userEmail = decodedToken.email;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

module.exports = {
  admin,
  db,
  auth,
  rtdb,
  FirebaseUserManager,
  FirebaseGameManager,
  FirebaseLeaderboardManager,
  authenticateUser,
  COLLECTIONS
}; 