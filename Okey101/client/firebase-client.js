// Firebase Client-Side Integration
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  off 
} from 'firebase/database';
import { firebaseConfig } from '../firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Authentication Provider
const provider = new GoogleAuthProvider();

// User State Management
let currentUser = null;
let userStats = null;

// Authentication Functions
class FirebaseAuth {
  static async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create or update user profile
      await this.createUserProfile(user);
      
      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      await signOut(auth);
      currentUser = null;
      userStats = null;
      console.log('User signed out');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  static async createUserProfile(user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
          averageScore: 0
        });
        console.log('New user profile created');
      } else {
        // Update last login
        await updateDoc(userRef, {
          lastLoginAt: new Date()
        });
        console.log('User profile updated');
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        userStats = await this.getUserStats(user.uid);
        callback(user, userStats);
      } else {
        currentUser = null;
        userStats = null;
        callback(null, null);
      }
    });
  }

  static async getUserStats(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  static getCurrentUser() {
    return currentUser;
  }

  static getUserStats() {
    return userStats;
  }
}

// Game Session Management
class FirebaseGameSession {
  static async createGameSession(gameData) {
    try {
      const gameRef = doc(collection(db, 'game_sessions'));
      const gameId = gameRef.id;
      
      await setDoc(gameRef, {
        gameId,
        createdAt: new Date(),
        status: 'active',
        players: gameData.players,
        gameState: gameData.gameState,
        settings: gameData.settings,
        createdBy: currentUser.uid
      });

      return gameId;
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  }

  static async updateGameState(gameId, gameState) {
    try {
      const gameRef = doc(db, 'game_sessions', gameId);
      await updateDoc(gameRef, {
        gameState,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }

  static async endGameSession(gameId, finalState) {
    try {
      const gameRef = doc(db, 'game_sessions', gameId);
      await updateDoc(gameRef, {
        status: 'completed',
        endedAt: new Date(),
        finalState
      });
    } catch (error) {
      console.error('Error ending game session:', error);
      throw error;
    }
  }

  static setupRealtimeListener(gameId, callback) {
    const gameRef = ref(rtdb, `games/${gameId}`);
    
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });

    // Return unsubscribe function
    return () => off(gameRef);
  }
}

// Leaderboard Management
class FirebaseLeaderboard {
  static async getTopPlayers(limit = 10) {
    try {
      const leaderboardRef = collection(db, 'leaderboard');
      const q = query(leaderboardRef, orderBy('gamesWon', 'desc'), limit(limit));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  static async updatePlayerStats(gameResult) {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const newGamesPlayed = userData.gamesPlayed + 1;
      const newGamesWon = userData.gamesWon + (gameResult.won ? 1 : 0);
      const newTotalScore = userData.totalScore + gameResult.score;
      const newAverageScore = newTotalScore / newGamesPlayed;

      await updateDoc(userRef, {
        gamesPlayed: newGamesPlayed,
        gamesWon: newGamesWon,
        totalScore: newTotalScore,
        averageScore: newAverageScore,
        lastGameAt: new Date()
      });

      // Update leaderboard
      await this.updateLeaderboardEntry({
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email,
        gamesWon: newGamesWon,
        totalScore: newTotalScore,
        averageScore: newAverageScore
      });

      // Update local stats
      userStats = await FirebaseAuth.getUserStats(currentUser.uid);
    } catch (error) {
      console.error('Error updating player stats:', error);
      throw error;
    }
  }

  static async updateLeaderboardEntry(playerData) {
    try {
      const leaderboardRef = doc(db, 'leaderboard', playerData.uid);
      await setDoc(leaderboardRef, {
        ...playerData,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }
  }
}

// UI Components for Firebase Integration
class FirebaseUI {
  static createAuthButton() {
    const authButton = document.createElement('button');
    authButton.id = 'firebase-auth-btn';
    authButton.className = 'auth-button';
    authButton.innerHTML = `
      <span class="auth-icon">🔐</span>
      <span class="auth-text">Sign in with Google</span>
    `;
    
    authButton.addEventListener('click', async () => {
      try {
        await FirebaseAuth.signInWithGoogle();
      } catch (error) {
        console.error('Authentication failed:', error);
        alert('Authentication failed. Please try again.');
      }
    });

    return authButton;
  }

  static createUserProfile() {
    if (!currentUser) return null;

    const profileDiv = document.createElement('div');
    profileDiv.className = 'user-profile';
    profileDiv.innerHTML = `
      <div class="user-info">
        <img src="${currentUser.photoURL || 'default-avatar.png'}" alt="Avatar" class="user-avatar">
        <div class="user-details">
          <h3>${currentUser.displayName || currentUser.email}</h3>
          ${userStats ? `
            <p>Games: ${userStats.gamesPlayed} | Wins: ${userStats.gamesWon} | Avg Score: ${userStats.averageScore.toFixed(1)}</p>
          ` : ''}
        </div>
      </div>
      <button id="sign-out-btn" class="sign-out-btn">Sign Out</button>
    `;

    // Add sign out functionality
    const signOutBtn = profileDiv.querySelector('#sign-out-btn');
    signOutBtn.addEventListener('click', async () => {
      try {
        await FirebaseAuth.signOut();
        this.updateAuthUI();
      } catch (error) {
        console.error('Sign out failed:', error);
      }
    });

    return profileDiv;
  }

  static createLeaderboard() {
    const leaderboardDiv = document.createElement('div');
    leaderboardDiv.className = 'leaderboard';
    leaderboardDiv.innerHTML = `
      <h2>🏆 Leaderboard</h2>
      <div id="leaderboard-list" class="leaderboard-list">
        <p>Loading...</p>
      </div>
    `;

    // Load leaderboard data
    this.loadLeaderboard(leaderboardDiv);

    return leaderboardDiv;
  }

  static async loadLeaderboard(container) {
    try {
      const topPlayers = await FirebaseLeaderboard.getTopPlayers(10);
      const listContainer = container.querySelector('#leaderboard-list');
      
      if (topPlayers.length === 0) {
        listContainer.innerHTML = '<p>No players yet</p>';
        return;
      }

      const leaderboardHTML = topPlayers.map((player, index) => `
        <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
          <span class="rank">${index + 1}</span>
          <span class="name">${player.displayName}</span>
          <span class="stats">
            <span class="wins">${player.gamesWon} wins</span>
            <span class="avg-score">${player.averageScore.toFixed(1)} avg</span>
          </span>
        </div>
      `).join('');

      listContainer.innerHTML = leaderboardHTML;
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      container.querySelector('#leaderboard-list').innerHTML = '<p>Error loading leaderboard</p>';
    }
  }

  static updateAuthUI() {
    const authContainer = document.getElementById('firebase-auth-container');
    if (!authContainer) return;

    if (currentUser) {
      // User is signed in
      authContainer.innerHTML = '';
      const profile = this.createUserProfile();
      const leaderboard = this.createLeaderboard();
      
      authContainer.appendChild(profile);
      authContainer.appendChild(leaderboard);
    } else {
      // User is signed out
      authContainer.innerHTML = '';
      const authButton = this.createAuthButton();
      authContainer.appendChild(authButton);
    }
  }
}

// Initialize Firebase UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create auth container
  const authContainer = document.createElement('div');
  authContainer.id = 'firebase-auth-container';
  authContainer.className = 'firebase-auth-container';
  document.body.appendChild(authContainer);

  // Set up auth state listener
  FirebaseAuth.onAuthStateChange((user, stats) => {
    FirebaseUI.updateAuthUI();
  });
});

// Export for use in main.js
window.FirebaseAuth = FirebaseAuth;
window.FirebaseGameSession = FirebaseGameSession;
window.FirebaseLeaderboard = FirebaseLeaderboard;
window.FirebaseUI = FirebaseUI; 