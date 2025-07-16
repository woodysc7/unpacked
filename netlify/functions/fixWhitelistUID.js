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
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Firebase configuration" })
    };
  }
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    console.log('Fixing whitelist entry for email:', email);

    // Find user by email in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('Found Firebase user:', userRecord.uid, userRecord.email);
    } catch (error) {
      console.log('User not found in Firebase Auth:', error.message);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found in Firebase Auth' })
      };
    }

    const db = admin.firestore();
    
    // Check if user already has correct whitelist entry by UID
    const correctWhitelistDoc = await db.collection('whitelist').doc(userRecord.uid).get();
    if (correctWhitelistDoc.exists) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'User already has correct whitelist entry',
          uid: userRecord.uid,
          data: correctWhitelistDoc.data()
        })
      };
    }

    // Look for whitelist entries by email
    const whitelistQuery = await db.collection('whitelist').where('email', '==', email).get();
    
    if (whitelistQuery.empty) {
      // Create new whitelist entry
      await db.collection('whitelist').doc(userRecord.uid).set({
        email: email,
        addedAt: new Date(),
        fixedUID: true
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Created new whitelist entry with correct UID',
          uid: userRecord.uid,
          email: email
        })
      };
    } else {
      // Update existing entry to use correct UID
      const oldDoc = whitelistQuery.docs[0];
      const oldData = oldDoc.data();
      
      // Delete old entry
      await oldDoc.ref.delete();
      
      // Create new entry with correct UID
      await db.collection('whitelist').doc(userRecord.uid).set({
        ...oldData,
        email: email,
        updatedAt: new Date(),
        oldDocId: oldDoc.id,
        fixedUID: true
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Fixed whitelist entry UID',
          oldDocId: oldDoc.id,
          newUID: userRecord.uid,
          email: email
        })
      };
    }

  } catch (error) {
    console.error('Error fixing whitelist:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
