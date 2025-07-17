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
    const { email, uid } = JSON.parse(event.body || '{}');
    
    if (!email || !uid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and UID are required' })
      };
    }

    console.log('Transferring pre-registration access for:', email, 'UID:', uid);
    
    const normalizedEmail = email.toLowerCase().trim();
    const emailDocId = normalizedEmail.replace(/[.#$[\]@]/g, '_');
    
    let transferredAccess = [];
    
    // Check pre-registration whitelist
    const preRegWhitelistDoc = await admin.firestore().collection('preregistration_whitelist').doc(emailDocId).get();
    if (preRegWhitelistDoc.exists()) {
      const data = preRegWhitelistDoc.data();
      
      // Transfer to actual whitelist with UID
      await admin.firestore().collection('whitelist').doc(uid).set({
        email: normalizedEmail,
        timestamp: new Date(),
        reason: data.reason + ' (transferred from pre-registration)',
        addedBy: data.addedBy,
        originalPreRegTimestamp: data.timestamp
      });
      
      // Clean up pre-registration entry
      await admin.firestore().collection('preregistration_whitelist').doc(emailDocId).delete();
      
      transferredAccess.push('whitelist');
      console.log('Transferred whitelist access for:', email);
    }
    
    // Check pre-registration paid
    const preRegPaidDoc = await admin.firestore().collection('preregistration_paid').doc(emailDocId).get();
    if (preRegPaidDoc.exists()) {
      const data = preRegPaidDoc.data();
      
      // Transfer to actual paid collection with UID
      await admin.firestore().collection('paid').doc(uid).set({
        email: normalizedEmail,
        timestamp: new Date(),
        reason: data.reason + ' (transferred from pre-registration)',
        addedBy: data.addedBy,
        status: 'active',
        originalPreRegTimestamp: data.timestamp
      });
      
      // Update users collection
      await admin.firestore().collection('users').doc(uid).update({
        paid: true,
        paidTimestamp: new Date()
      });
      
      // Clean up pre-registration entry
      await admin.firestore().collection('preregistration_paid').doc(emailDocId).delete();
      
      transferredAccess.push('paid');
      console.log('Transferred paid access for:', email);
    }
    
    // Check email-based whitelist entries (old system compatibility)
    const emailWhitelistDoc = await admin.firestore().collection('whitelist').doc(emailDocId).get();
    if (emailWhitelistDoc.exists() && emailWhitelistDoc.data().preRegistration) {
      const data = emailWhitelistDoc.data();
      
      // Transfer to UID-based entry
      await admin.firestore().collection('whitelist').doc(uid).set({
        email: normalizedEmail,
        timestamp: new Date(),
        reason: data.reason + ' (transferred from email-based entry)',
        addedBy: data.addedBy,
        originalTimestamp: data.timestamp
      });
      
      // Clean up email-based entry
      await admin.firestore().collection('whitelist').doc(emailDocId).delete();
      
      if (!transferredAccess.includes('whitelist')) {
        transferredAccess.push('whitelist');
      }
      console.log('Transferred email-based whitelist access for:', email);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: transferredAccess.length > 0 
          ? `Successfully transferred ${transferredAccess.join(' and ')} access for ${email}`
          : `No pre-registration access found for ${email}`,
        transferredAccess: transferredAccess,
        email: normalizedEmail,
        uid: uid
      })
    };

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
