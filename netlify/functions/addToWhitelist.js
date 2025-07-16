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
    const email = event.queryStringParameters?.email || 'scwood26@g.holycross.edu';
    const adminKey = event.queryStringParameters?.key;
    
    // Simple admin key check
    if (adminKey !== 'admin_fix_2024') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid admin key' })
      };
    }

    console.log('Adding user to whitelist:', email);

    // Find user in users collection
    const usersQuery = await admin.firestore().collection('users').where('email', '==', email).get();
    
    if (usersQuery.empty) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: `User ${email} not found in users collection. They need to sign up first at /Atlas/Free/signup.html` 
        })
      };
    }

    const userDoc = usersQuery.docs[0];
    const userUID = userDoc.id;

    // Add to whitelist collection
    await admin.firestore().collection('whitelist').doc(userUID).set({
      email: email,
      timestamp: new Date(),
      reason: 'Admin granted free access via fix function',
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

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
