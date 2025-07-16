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
    const email = event.queryStringParameters?.email;
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email parameter required' })
      };
    }

    console.log('Checking access for email:', email);

    // Find user in users collection
    const usersQuery = await admin.firestore().collection('users').where('email', '==', email).get();
    
    if (usersQuery.empty) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          found: false, 
          message: 'User not found in users collection. They need to sign up first.' 
        })
      };
    }

    const userDoc = usersQuery.docs[0];
    const userUID = userDoc.id;
    const userData = userDoc.data();

    let result = {
      found: true,
      email: email,
      uid: userUID,
      userData: userData,
      access: {
        whitelist: false,
        paid: false,
        usersPaid: false
      }
    };

    // Check whitelist
    try {
      const whitelistDoc = await admin.firestore().collection('whitelist').doc(userUID).get();
      if (whitelistDoc.exists) {
        result.access.whitelist = true;
        result.whitelistData = whitelistDoc.data();
      }
    } catch (error) {
      console.log('Error checking whitelist:', error);
    }

    // Check paid collection
    try {
      const paidDoc = await admin.firestore().collection('paid').doc(userUID).get();
      if (paidDoc.exists) {
        result.access.paid = true;
        result.paidData = paidDoc.data();
      }
    } catch (error) {
      console.log('Error checking paid:', error);
    }

    // Check users.paid field
    if (userData.paid === true) {
      result.access.usersPaid = true;
    }

    // Determine overall access
    result.hasAccess = result.access.whitelist || result.access.paid || result.access.usersPaid;
    result.accessType = result.access.whitelist ? 'whitelist' : 
                       result.access.paid ? 'paid' : 
                       result.access.usersPaid ? 'users_paid' : 'none';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
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
