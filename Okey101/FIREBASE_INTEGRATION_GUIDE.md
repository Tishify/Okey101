# Firebase Integration Guide for Okey 101 Game

## Overview
This guide provides step-by-step instructions for integrating Firebase into your Okey 101 game project. Firebase will provide authentication, real-time database, user management, and leaderboard functionality.

## Prerequisites
- Node.js and npm installed
- Firebase account
- Basic knowledge of JavaScript and Firebase

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `Okey-Baba-Game`
4. Enable Google Analytics (optional)
5. Choose default Google Analytics account
6. Click "Create project"

### 1.2 Enable Firebase Services
1. **Authentication:**
   - Go to Authentication → Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains

2. **Firestore Database:**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select location closest to your users

3. **Realtime Database:**
   - Go to Realtime Database
   - Click "Create database"
   - Choose "Start in test mode"
   - Select location

4. **Storage (optional):**
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"

### 1.3 Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web
4. Register app with nickname: `Okey-Baba-Web`
5. Copy the config object

## Step 2: Project Configuration

### 2.1 Update Firebase Configuration
1. Copy `firebase-config.example.js` to `firebase-config.js`
2. Replace placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2.2 Get Admin SDK Service Account
1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the values and add to `firebase-config.js`:

```javascript
const adminConfig = {
  type: "service_account",
  project_id: "your-project-id",
  private_key_id: "your-private-key-id",
  private_key: "-----BEGIN PRIVATE KEY-----\nYour actual private key\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  // ... other values
};
```

## Step 3: Firebase Security Rules

### 3.1 Firestore Rules
Go to Firestore Database → Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Game sessions - authenticated users can read/write
    match /game_sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Leaderboard - anyone can read, authenticated users can write
    match /leaderboard/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3.2 Realtime Database Rules
Go to Realtime Database → Rules and set:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## Step 4: Integration Features

### 4.1 Authentication
- **Google Sign-in:** Users can sign in with Google accounts
- **User Profiles:** Automatic profile creation and management
- **Session Management:** Persistent login state

### 4.2 User Management
- **User Statistics:** Track games played, wins, scores
- **Profile Management:** User avatars and display names
- **Achievement System:** Track player progress

### 4.3 Game Sessions
- **Real-time Game State:** Live game state synchronization
- **Game History:** Store completed games
- **Player Tracking:** Monitor active players

### 4.4 Leaderboard
- **Top Players:** Display best players
- **Statistics:** Games won, average scores
- **Real-time Updates:** Live leaderboard updates

## Step 5: Testing the Integration

### 5.1 Local Testing
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open browser and navigate to your app
3. Check for Firebase authentication button in top-right corner
4. Test Google sign-in
5. Verify user profile and leaderboard display

### 5.2 Firebase Console Verification
1. **Authentication:** Check for new users in Firebase Console
2. **Firestore:** Verify user documents and game sessions
3. **Realtime Database:** Monitor game state updates

## Step 6: Production Deployment

### 6.1 Environment Variables
Create `.env` file with your Firebase config:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 6.2 Security Rules (Production)
Update security rules for production:

```javascript
// Firestore Rules (Production)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /game_sessions/{sessionId} {
      allow read, write: if request.auth != null;
      allow delete: if false; // Prevent deletion
    }
    
    match /leaderboard/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6.3 Hosting (Optional)
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase hosting:
   ```bash
   firebase init hosting
   ```

3. Deploy:
   ```bash
   firebase deploy
   ```

## Step 7: Advanced Features

### 7.1 Real-time Game State
The integration includes real-time game state synchronization using Firebase Realtime Database:

```javascript
// Subscribe to game updates
const unsubscribe = FirebaseGameSession.setupRealtimeListener(gameId, (gameData) => {
  // Update UI with new game state
  updateGameUI(gameData);
});
```

### 7.2 User Statistics
Track and display user statistics:

```javascript
// Update player stats after game
await FirebaseLeaderboard.updatePlayerStats({
  won: true,
  score: 150,
  gameDuration: 1800
});
```

### 7.3 Leaderboard Integration
Display top players:

```javascript
// Get top 10 players
const topPlayers = await FirebaseLeaderboard.getTopPlayers(10);
displayLeaderboard(topPlayers);
```

## Troubleshooting

### Common Issues

1. **Authentication Errors:**
   - Verify Firebase config is correct
   - Check authorized domains in Firebase Console
   - Ensure Google sign-in is enabled

2. **Database Permission Errors:**
   - Check Firestore security rules
   - Verify user authentication state
   - Test with authenticated user

3. **Real-time Updates Not Working:**
   - Check Realtime Database rules
   - Verify database URL in config
   - Check network connectivity

### Debug Tools

1. **Firebase Console:** Monitor real-time data
2. **Browser Console:** Check for JavaScript errors
3. **Network Tab:** Verify API calls
4. **Firebase Emulator:** Local development testing

## Resources

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Realtime Database](https://firebase.google.com/docs/database)

### Tools
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)

### Community
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase YouTube Channel](https://www.youtube.com/user/Firebase)

## Next Steps

1. **Customize UI:** Modify Firebase UI components to match your game's design
2. **Add More Features:** Implement chat, notifications, achievements
3. **Performance Optimization:** Implement caching and offline support
4. **Analytics:** Add Firebase Analytics for user behavior tracking
5. **Push Notifications:** Implement Firebase Cloud Messaging

## Support

For issues with this integration:
1. Check the troubleshooting section
2. Review Firebase documentation
3. Check browser console for errors
4. Verify Firebase Console configuration

---

**Note:** This integration provides a solid foundation for Firebase features. You can extend it based on your specific requirements and game features. 