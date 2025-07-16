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
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email required" })
      };
    }

    // For testing - mark woodysc7@gmail.com or Wyattlorenzen123@gmail.com as paid
    if (email === "woodysc7@gmail.com" || email === "Wyattlorenzen123@gmail.com") {
      // Find user by email
      const userQuery = await admin.auth().getUserByEmail(email);
      const uid = userQuery.uid;
      
      // Set paid status
      await db.collection('users').doc(uid).set({
        email: email,
        paid: true,
        paidAt: new Date()
      }, { merge: true });

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "Account marked as paid" })
      };
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Not authorized for manual access" })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
