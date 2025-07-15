const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

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
  const { page } = event.queryStringParameters || {};

  console.log('servePaidContent called with page:', page);
  console.log('__dirname:', __dirname);
  console.log('process.cwd():', process.cwd());

  if (!page) {
    return {
      statusCode: 400,
      body: "Missing page parameter"
    };
  }

  try {
    // Check for Firebase ID token in Authorization header
    const authHeader = event.headers.authorization;
    let userPaid = false;
    let userEmail = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userEmail = decodedToken.email;
        
        // Check if user has paid status
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists()) {
          userPaid = userDoc.data().paid || false;
        }
      } catch (authError) {
        console.log('Auth verification failed:', authError);
      }
    }

    // For testing: allow woodysc7@gmail.com to access without payment
    if (userEmail === 'woodysc7@gmail.com') {
      userPaid = true;
    }

    // If user is not authenticated or hasn't paid, show access denied
    if (!userPaid) {
      return {
        statusCode: 403,
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Access Denied - Paid Content</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                .denied { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #d32f2f; }
                .btn { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px 0 0; }
                .btn:hover { background: #1565c0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="denied">
                  <h1>🔒 Access Denied</h1>
                  <p>This content requires a paid subscription.</p>
                  <p>Please log in and purchase access to view this content.</p>
                  <a href="/atlas/free/signup.html" class="btn">Login / Sign Up</a>
                  <a href="/atlas/free/atlas.html" class="btn">← Back to Free Atlas</a>
                </div>
              </div>
            </body>
          </html>
        `
      };
    }
    // Security check - prevent directory traversal but allow forward slashes for nested paths
    if (page.includes('..') || page.includes('\\') || page.startsWith('/')) {
      return {
        statusCode: 403,
        body: "Forbidden path"
      };
    }

    // Handle different content types:
    // - Atlas.html (root level)
    // - Countries/countryname/filename.html 
    // - cities/cityname.html
    let filePath;
    
    if (page === 'Atlas') {
      filePath = path.join(__dirname, '_Paid', 'Atlas.html');
    } else if (page.startsWith('Countries/')) {
      // For country pages like Countries/unitedstates/unitedstateshome.html
      filePath = path.join(__dirname, '_Paid', `${page}.html`);
    } else if (page.startsWith('cities/')) {
      // For city pages like cities/newyorkunitedstates.html
      filePath = path.join(__dirname, '_Paid', `${page}.html`);
    } else {
      // Default case - assume it's a direct file
      filePath = path.join(__dirname, '_Paid', `${page}.html`);
    }
    
    console.log('Looking for file at:', filePath);

    // Check if file exists and read it
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: fileContents
      };
    } else {
      // File not found
      return {
        statusCode: 404,
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Content Not Found</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error">
                  <h1>Content Not Found</h1>
                  <p>The requested content "${page}" could not be found.</p>
                  <p><a href="/atlas/free/atlas.html">← Back to Free Atlas</a></p>
                </div>
              </div>
            </body>
          </html>
        `
      };
    }
  } catch (error) {
    console.error('Error in servePaidContent:', error);
    return {
      statusCode: 500,
      body: `Error: ${error.message}`
    };
  }
};