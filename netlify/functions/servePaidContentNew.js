const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');

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

async function checkUserAccess(event) {
  try {
    // Check for test access parameter for development
    if (event.queryStringParameters?.test === 'woodysc7') {
      return true;
    }

    // Extract token from Authorization header or cookie
    const authHeader = event.headers.authorization;
    const cookies = event.headers.cookie;
    
    let token = null;
    
    // Try to get token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Try to get token from cookies if not in header
    if (!token && cookies) {
      const cookieMatch = cookies.match(/authToken=([^;]+)/);
      if (cookieMatch) {
        token = cookieMatch[1];
      }
    }

    // If no token, user is not authenticated
    if (!token) {
      return false;
    }

    // Verify the Firebase token
    if (admin.apps.length > 0) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Check if user has paid access
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (userDoc.exists && userDoc.data().paid) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Authentication error:", error);
    return false;
  }
}

function getAccessDeniedPage() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Access Denied</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700,900&display=swap" rel="stylesheet" />
        <style>
          body { 
            font-family: 'Montserrat', sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            text-align: center; 
            background: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          }
          .denied { 
            color: #d32f2f; 
            background: #ffebee; 
            padding: 30px; 
            border-radius: 12px; 
            border-left: 4px solid #d32f2f;
          }
          .signup-btn {
            display: inline-block;
            margin: 15px 10px;
            padding: 12px 24px;
            background: #6B4226;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: background 0.2s;
          }
          .signup-btn:hover { background: #A9746E; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="denied">
            <h1>🔒 Premium Content</h1>
            <p><strong>This content requires a paid subscription.</strong></p>
            <p>Get unlimited access to detailed travel guides, city information, and premium features.</p>
            <div style="margin-top: 30px;">
              <a href="/Atlas/Free/signup.html" class="signup-btn">🔐 Sign Up / Log In</a>
              <a href="/Atlas/Free/Atlas.html" class="signup-btn">🆓 Free Version</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  console.log('servePaidContentNew called with page:', page);

  if (!page) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: "Missing page parameter"
    };
  }

  try {
    // Security check - prevent directory traversal
    if (page.includes('..') || page.includes('\\') || page.startsWith('/')) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'text/plain' },
        body: "Forbidden path"
      };
    }

    // Check user access
    const hasAccess = await checkUserAccess(event);
    
    if (!hasAccess) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'text/html' },
        body: getAccessDeniedPage()
      };
    }

    // User has access - serve the actual content
    try {
      let filePath;
      
      if (page.endsWith('.json')) {
        filePath = path.join(__dirname, '_Paid', page);
      } else if (page.endsWith('.html')) {
        filePath = path.join(__dirname, '_Paid', page);
      } else {
        filePath = path.join(__dirname, '_Paid', `${page}.html`);
      }
      
      console.log('Attempting to read file:', filePath);
      
      if (!fs.existsSync(filePath)) {
        // File not found in function directory, redirect to static version
        const staticUrl = `/paidcontent/${page.toLowerCase().replace('.html', '')}`;
        return {
          statusCode: 302,
          headers: { 'Location': staticUrl },
          body: ''
        };
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      let contentType = 'text/html';
      if (page.endsWith('.json')) {
        contentType = 'application/json';
      } else if (page.endsWith('.css')) {
        contentType = 'text/css';
      } else if (page.endsWith('.js')) {
        contentType = 'application/javascript';
      }
      
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        },
        body: content
      };
      
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      
      // Fallback to static content redirect
      const staticUrl = `/paidcontent/${page.toLowerCase().replace('.html', '')}`;
      return {
        statusCode: 302,
        headers: { 'Location': staticUrl },
        body: ''
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Internal server error'
    };
  }
};
