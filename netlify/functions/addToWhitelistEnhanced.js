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
    let email, adminKey, reason, accessType;
    
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      email = body.email;
      reason = body.reason || 'Admin granted access';
      accessType = body.accessType || 'whitelist'; // 'whitelist' or 'paid'
      adminKey = body.adminKey || 'admin_fix_2024';
    } else {
      email = event.queryStringParameters?.email;
      reason = event.queryStringParameters?.reason || 'Admin granted access';
      accessType = event.queryStringParameters?.type || 'whitelist';
      adminKey = event.queryStringParameters?.key;
    }
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }
    
    // Simple admin key check
    if (adminKey !== 'admin_fix_2024') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid admin key' })
      };
    }

    console.log(`Adding user to ${accessType}:`, email, 'with reason:', reason);

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Try to find user in users collection first
    const usersQuery = await admin.firestore().collection('users').where('email', '==', normalizedEmail).get();
    
    if (!usersQuery.empty) {
      // User exists, use their UID
      const userDoc = usersQuery.docs[0];
      const userUID = userDoc.id;

      if (accessType === 'paid') {
        // Add to paid collection
        await admin.firestore().collection('paid').doc(userUID).set({
          email: normalizedEmail,
          timestamp: new Date(),
          reason: reason,
          addedBy: 'admin_manual',
          status: 'active'
        });
        
        // Also update users collection
        await admin.firestore().collection('users').doc(userUID).update({
          paid: true,
          paidTimestamp: new Date()
        });
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `Successfully added ${normalizedEmail} to paid users`,
            uid: userUID,
            type: 'paid'
          })
        };
      } else {
        // Add to whitelist collection
        await admin.firestore().collection('whitelist').doc(userUID).set({
          email: normalizedEmail,
          timestamp: new Date(),
          reason: reason,
          addedBy: 'admin_manual'
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `Successfully added ${normalizedEmail} to whitelist`,
            uid: userUID,
            type: 'whitelist'
          })
        };
      }
    } else {
      // User doesn't exist yet, add them to pre-registration collection
      const emailDocId = normalizedEmail.replace(/[.#$[\]@]/g, '_');
      
      const collectionName = accessType === 'paid' ? 'preregistration_paid' : 'preregistration_whitelist';
      
      await admin.firestore().collection(collectionName).doc(emailDocId).set({
        email: normalizedEmail,
        timestamp: new Date(),
        reason: reason,
        addedBy: 'admin_manual',
        preRegistration: true,
        accessType: accessType
      });

      // Also add to general whitelist for immediate email-based checking
      await admin.firestore().collection('whitelist').doc(emailDocId).set({
        email: normalizedEmail,
        timestamp: new Date(),
        reason: reason,
        addedBy: 'admin_manual',
        preRegistration: true,
        accessType: accessType
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Successfully pre-registered ${normalizedEmail} for ${accessType} access. They will get automatic access when they sign up.`,
          emailDocId: emailDocId,
          type: accessType,
          preRegistration: true
        })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};
