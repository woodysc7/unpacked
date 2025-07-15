const path = require('path');
const fs = require('fs');
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : require("../../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  if (!page) {
    return {
      statusCode: 400,
      body: "Missing page parameter"
    };
  }

  // Check for Firebase auth token
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 302,
      headers: {
        'Location': '/Free/signup.html'
      },
      body: ''
    };
  }

  try {
    // Verify the Firebase token
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if user has paid access
    const userDoc = await db.collection("paid").doc(uid).get();
    const whitelistDoc = await db.collection("whitelist").doc(uid).get();
    
    const isPaid = (userDoc.exists && userDoc.data().paid) || whitelistDoc.exists;
    
    if (!isPaid) {
      return {
        statusCode: 302,
        headers: {
          'Location': '/Free/blocked.html'
        },
        body: ''
      };
    }

    // User is authorized, serve the content
    const filePath = path.join(__dirname, '../../..', 'Paid', `${page}.html`);

    // Security: prevent directory traversal
    if (filePath.includes('..')) {
      return { statusCode: 403, body: "Forbidden" };
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: fileContents
    };
  } catch (err) {
    // Auth failed, redirect to signup
    return {
      statusCode: 302,
      headers: {
        'Location': '/Free/signup.html'
      },
      body: ''
    };
  }
};