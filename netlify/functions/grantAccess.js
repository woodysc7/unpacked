const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required");
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { email } = JSON.parse(event.body || '{}');
  
  if (!email) {
    return { statusCode: 400, body: "Missing email" };
  }

  try {
    // Find user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Update their paid status
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      paid: true,
      paidAt: new Date(),
      manuallyGranted: true
    }, { merge: true });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Paid access granted to ${email}`,
        uid: userRecord.uid
      })
    };
  } catch (error) {
    console.error('Error granting access:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};
