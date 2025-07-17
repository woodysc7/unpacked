// Enhanced Firebase Authentication for Premium Content
// This module provides comprehensive authentication checking for Firebase users
// including whitelist, paid status, and automatic access granting

class FirebaseAuthEnhanced {
  constructor() {
    this.currentUser = null;
    this.authStateReady = false;
    this.authCheckPromise = null;
  }

  // Initialize Firebase authentication monitoring
  init() {
    if (this.authCheckPromise) {
      return this.authCheckPromise;
    }

    this.authCheckPromise = new Promise((resolve) => {
      firebase.auth().onAuthStateChanged(async (user) => {
        this.currentUser = user;
        this.authStateReady = true;
        
        if (user) {
          console.log('Firebase user authenticated:', user.email);
          const accessResult = await this.checkUserAccess(user);
          resolve(accessResult);
        } else {
          console.log('No Firebase user authenticated');
          resolve({ hasAccess: false, reason: 'No Firebase user' });
        }
      });

      // Timeout after 5 seconds if no auth state change
      setTimeout(() => {
        if (!this.authStateReady) {
          console.log('Firebase auth timeout');
          resolve({ hasAccess: false, reason: 'Firebase auth timeout' });
        }
      }, 5000);
    });

    return this.authCheckPromise;
  }

  // Check user access permissions (whitelist, paid status)
  async checkUserAccess(user) {
    if (!user) {
      return { hasAccess: false, reason: 'No user provided' };
    }

    try {
      const db = firebase.firestore();
      const email = user.email;
      const uid = user.uid;

      console.log(`Checking access for Firebase user: ${email} (UID: ${uid})`);

      // Get user token for server-side verification
      const token = await user.getIdToken();

      // Check whitelist collection
      try {
        const whitelistDoc = await db.collection('whitelist').doc(uid).get();
        if (whitelistDoc.exists()) {
          console.log('User found in Firebase whitelist collection');
          this.setAuthCookies(email, token, 'whitelist');
          return { 
            hasAccess: true, 
            reason: 'Firebase whitelist', 
            email: email,
            token: token,
            accessType: 'whitelist'
          };
        }
      } catch (error) {
        console.log('Error checking whitelist collection:', error);
      }

      // Check paid collection
      try {
        const paidDoc = await db.collection('paid').doc(uid).get();
        if (paidDoc.exists()) {
          console.log('User found in Firebase paid collection');
          this.setAuthCookies(email, token, 'paid');
          return { 
            hasAccess: true, 
            reason: 'Firebase paid collection', 
            email: email,
            token: token,
            accessType: 'paid'
          };
        }
      } catch (error) {
        console.log('Error checking paid collection:', error);
      }

      // Check users collection for paid status
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.paid === true) {
            console.log('User has paid status in users collection');
            this.setAuthCookies(email, token, 'users_paid');
            return { 
              hasAccess: true, 
              reason: 'Firebase users paid status', 
              email: email,
              token: token,
              accessType: 'users_paid'
            };
          }
        }
      } catch (error) {
        console.log('Error checking users collection:', error);
      }

      // Fallback: Check server-side via email lookup
      try {
        const response = await fetch(`/.netlify/functions/checkUserAccess?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasAccess && (data.access.whitelist || data.access.paid || data.access.usersPaid)) {
            console.log('User authorized via server-side access check');
            this.setAuthCookies(email, token, data.accessType);
            return { 
              hasAccess: true, 
              reason: 'Server-side verification', 
              email: email,
              token: token,
              accessType: data.accessType
            };
          }
        }
      } catch (error) {
        console.log('Error checking server-side access:', error);
      }

      console.log('Firebase user authenticated but no access permissions found');
      return { 
        hasAccess: false, 
        reason: 'No access permissions', 
        email: email 
      };

    } catch (error) {
      console.error('Error checking Firebase user access:', error);
      return { 
        hasAccess: false, 
        reason: 'Firebase error: ' + error.message 
      };
    }
  }

  // Set authentication cookies for the user
  setAuthCookies(email, token, accessType) {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 days
    
    // Set user email cookie
    document.cookie = `userEmail=${encodeURIComponent(email)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    // Set auth token cookie
    document.cookie = `authToken=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    // Set access type cookie for reference
    document.cookie = `accessType=${accessType}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    console.log(`Auth cookies set for ${email} with access type: ${accessType}`);
  }

  // Get current authentication status
  async getAuthStatus() {
    if (this.authCheckPromise) {
      return await this.authCheckPromise;
    } else {
      return await this.init();
    }
  }

  // Sign out user
  async signOut() {
    try {
      await firebase.auth().signOut();
      this.clearAuthCookies();
      this.currentUser = null;
      this.authStateReady = false;
      this.authCheckPromise = null;
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Clear authentication cookies
  clearAuthCookies() {
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'accessType=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  // Check if user is currently signed in
  isSignedIn() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// Create global instance
window.firebaseAuthEnhanced = new FirebaseAuthEnhanced();

// Auto-initialize when script loads
window.addEventListener('load', () => {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    window.firebaseAuthEnhanced.init();
  }
});
