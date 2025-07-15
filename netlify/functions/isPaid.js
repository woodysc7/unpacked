const admin = require("firebase-admin");

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

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const uid = event.queryStringParameters.uid;
  if (!uid) {
    return { statusCode: 400, body: "Missing uid" };
  }
  try {
    const doc = await db.collection("paid").doc(uid).get();
    if (doc.exists && doc.data().paid) {
      return { statusCode: 200, body: JSON.stringify({ paid: true }) };
    }
    return { statusCode: 200, body: JSON.stringify({ paid: false }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};