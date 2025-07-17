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
    }
  }
}

exports.handler = async (event, context) => {
  // Simple CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let email, adminKey, reason;
    
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      email = body.email;
      reason = body.reason || 'Admin granted access';
      adminKey = body.adminKey || 'admin_fix_2024'; // Default for internal use
    } else {
      email = event.queryStringParameters?.email || 'woodysc7@gmail.com';
      reason = event.queryStringParameters?.reason || 'Admin granted access';
      adminKey = event.queryStringParameters?.key;
    }
    
    // Simple admin key check
    if (adminKey !== 'admin_fix_2024') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid admin key' })
      };
    }

    console.log('Adding user to whitelist:', email, 'with reason:', reason);

    // Try to find user in users collection first
    const usersQuery = await admin.firestore().collection('users').where('email', '==', email).get();
    
    if (!usersQuery.empty) {
      // User exists, use their UID
      const userDoc = usersQuery.docs[0];
      const userUID = userDoc.id;

      // Add to whitelist collection
      await admin.firestore().collection('whitelist').doc(userUID).set({
        email: email,
        timestamp: new Date(),
        reason: reason,
        addedBy: 'admin_fix'
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Successfully added ${email} to whitelist`,
          uid: userUID
        })
      };
    } else {
      // User doesn't exist yet, add them by email to whitelist
      // Use email as document ID (safe since we sanitize)
      const emailDocId = email.replace(/[.#$[\]]/g, '_');
      
      await admin.firestore().collection('whitelist').doc(emailDocId).set({
        email: email,
        timestamp: new Date(),
        reason: reason,
        addedBy: 'admin_fix',
        preRegistration: true
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Successfully added ${email} to whitelist (pre-registration)`,
          emailDocId: emailDocId
        })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
