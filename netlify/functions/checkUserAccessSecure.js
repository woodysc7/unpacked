const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Firebase initialization failed" })
      };
    }
  }
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { idToken } = JSON.parse(event.body);
    
    if (!idToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID token is required' })
      };
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    console.log('Checking access for user:', uid, email);

    const db = admin.firestore();
    let hasAccess = false;
    let accessType = '';
    let details = {};

    // Check whitelist collection first (free access)
    try {
      const whitelistDoc = await db.collection('whitelist').doc(uid).get();
      if (whitelistDoc.exists) {
        console.log('User found in whitelist by UID');
        hasAccess = true;
        accessType = 'whitelist';
        details.whitelistByUID = whitelistDoc.data();
      } else {
        // Check by email
        const whitelistQuery = await db.collection('whitelist').where('email', '==', email).get();
        if (!whitelistQuery.empty) {
          console.log('User found in whitelist by email');
          hasAccess = true;
          accessType = 'whitelist';
          details.whitelistByEmail = whitelistQuery.docs[0].data();
        }
      }
    } catch (error) {
      console.log('Error checking whitelist:', error);
      details.whitelistError = error.message;
    }

    // Check paid collection if not whitelisted
    if (!hasAccess) {
      try {
        const paidDoc = await db.collection('paid').doc(uid).get();
        if (paidDoc.exists) {
          console.log('User found in paid collection');
          hasAccess = true;
          accessType = 'paid';
          details.paid = paidDoc.data();
        }
      } catch (error) {
        console.log('Error checking paid collection:', error);
        details.paidError = error.message;
      }
    }

    // Check users collection paid field if not found elsewhere
    if (!hasAccess) {
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists() && userDoc.data().paid === true) {
          console.log('User has paid access in users collection');
          hasAccess = true;
          accessType = 'users_paid';
          details.users = userDoc.data();
        } else if (userDoc.exists()) {
          details.users = userDoc.data();
        }
      } catch (error) {
        console.log('Error checking users collection:', error);
        details.usersError = error.message;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uid,
        email,
        hasAccess,
        accessType,
        details
      })
    };

  } catch (error) {
    console.error('Error checking user access:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
