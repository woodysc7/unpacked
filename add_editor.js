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
  } else {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found");
    process.exit(1);
  }
}

async function addEditorToWhitelist() {
  try {
    const email = "bmcapo26@g.holycross.edu";
    const reason = "editor";
    
    console.log(`Adding ${email} to whitelist with reason: ${reason}`);
    
    // Use email as document ID (safe since we sanitize)
    const emailDocId = email.replace(/[.#$[\]]/g, '_');
    
    await admin.firestore().collection('whitelist').doc(emailDocId).set({
      email: email,
      timestamp: new Date(),
      reason: reason,
      addedBy: 'admin_script',
      preRegistration: true
    });
    
    console.log(`✅ Successfully added ${email} to whitelist`);
    console.log(`Document ID: ${emailDocId}`);
    
    // Verify it was added
    const doc = await admin.firestore().collection('whitelist').doc(emailDocId).get();
    if (doc.exists) {
      console.log('✅ Verified: Document exists in Firestore');
      console.log('Document data:', doc.data());
    } else {
      console.log('❌ Error: Document not found after creation');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding to whitelist:', error);
    process.exit(1);
  }
}

addEditorToWhitelist();
