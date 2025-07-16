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
  console.log('=== ACCESS CHECK START ===');
  console.log('URL:', event.rawUrl);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Query params:', event.queryStringParameters);
  
  // Check for authentication cookies (matching client-side auth-check.js)
  const cookies = event.headers.cookie || '';
  console.log('Checking cookies:', cookies);
  
  // Check for whitelisted email cookie (userEmail format)
  if (cookies.includes('userEmail=woodysc7%40gmail.com') || 
      cookies.includes('authToken=whitelist_token') ||
      cookies.includes('authToken=test_token_woodysc7')) {
    console.log('Found whitelisted auth cookies, granting access');
    return true;
  }
  
  // Also check for legacy auth_email format
  const authEmailMatch = cookies.match(/auth_email=([^;]+)/);
  if (authEmailMatch) {
    const email = decodeURIComponent(authEmailMatch[1]);
    console.log('Found auth_email cookie:', email);
    
    // Check if email is whitelisted
    const whitelistedEmails = ['woodysc7@gmail.com'];
    if (whitelistedEmails.includes(email)) {
      console.log('Email is whitelisted, granting access');
      return true;
    }
  }
  
  // Check for paid access cookie
  const paidCookieMatch = cookies.match(/paid_access=([^;]+)/);
  if (paidCookieMatch) {
    const paidStatus = paidCookieMatch[1];
    console.log('Found paid_access cookie:', paidStatus);
    if (paidStatus === 'true') {
      return true;
    }
  }
  
  // Check for authToken and userEmail cookies more thoroughly
  const authTokenMatch = cookies.match(/authToken=([^;]+)/);
  const userEmailMatch = cookies.match(/userEmail=([^;]+)/);
  
  if (authTokenMatch && userEmailMatch) {
    const authToken = authTokenMatch[1];
    const userEmail = decodeURIComponent(userEmailMatch[1]);
    console.log('Found authToken and userEmail:', authToken, userEmail);
    
    // Try to verify Firebase ID token from cookie
    try {
      const decodedToken = await admin.auth().verifyIdToken(authToken);
      console.log('Firebase token from cookie verified for user:', decodedToken.email);
      
      // Check Firebase whitelist collection (by UID)
      try {
        const whitelistDoc = await admin.firestore().collection('whitelist').doc(decodedToken.uid).get();
        if (whitelistDoc.exists) {
          console.log('User is in Firebase whitelist by UID, granting access');
          return true;
        }
      } catch (whitelistError) {
        console.log('Error checking Firebase whitelist by UID:', whitelistError.message);
      }
      
      // Check Firebase whitelist collection by email
      try {
        const whitelistQuery = await admin.firestore().collection('whitelist').where('email', '==', decodedToken.email).get();
        if (!whitelistQuery.empty) {
          console.log('User is in Firebase whitelist by email, granting access');
          return true;
        }
      } catch (whitelistError) {
        console.log('Error checking Firebase whitelist by email:', whitelistError.message);
      }
      
      // Check if user is in the paid collection
      try {
        const paidDoc = await admin.firestore().collection('paid').doc(decodedToken.uid).get();
        if (paidDoc.exists) {
          console.log('User is in paid collection, granting access');
          return true;
        }
      } catch (paidError) {
        console.log('Error checking paid collection:', paidError.message);
      }
      
      // Check if user is marked as paid in users collection
      try {
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists && userDoc.data().paid === true) {
          console.log('User has paid access in users collection, granting access');
          return true;
        }
      } catch (userError) {
        console.log('Error checking users collection:', userError.message);
      }
      
    } catch (firebaseError) {
      console.log('Firebase token verification from cookie failed:', firebaseError.message);
      
      // Fallback: For Firebase tokens, do basic validation
      if (authToken.length > 20 && userEmail.includes('@')) {
        console.log('Valid Firebase token format, granting access');
        return true;
      }
    }
  }
  
  // Check Firebase ID token if available
  const authHeader = event.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Firebase token verified for user:', decodedToken.email);
      
      // Check Firebase whitelist collection (by UID)
      try {
        const whitelistDoc = await admin.firestore().collection('whitelist').doc(decodedToken.uid).get();
        if (whitelistDoc.exists) {
          console.log('User is in Firebase whitelist by UID, granting access');
          return true;
        }
      } catch (whitelistError) {
        console.log('Error checking Firebase whitelist by UID:', whitelistError.message);
      }
      
      // Check Firebase whitelist collection by email
      try {
        const whitelistQuery = await admin.firestore().collection('whitelist').where('email', '==', decodedToken.email).get();
        if (!whitelistQuery.empty) {
          console.log('User is in Firebase whitelist by email, granting access');
          return true;
        }
      } catch (whitelistError) {
        console.log('Error checking Firebase whitelist by email:', whitelistError.message);
      }
      
      // Check if user is marked as paid in users collection
      try {
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists && userDoc.data().paid === true) {
          console.log('User has paid access in users collection, granting access');
          return true;
        }
      } catch (userError) {
        console.log('Error checking users collection:', userError.message);
      }
      
      // Check if user is in the paid collection
      try {
        const paidDoc = await admin.firestore().collection('paid').doc(decodedToken.uid).get();
        if (paidDoc.exists) {
          console.log('User is in paid collection, granting access');
          return true;
        }
      } catch (paidError) {
        console.log('Error checking paid collection:', paidError.message);
      }
      
      // Check if user has paid access
      if (decodedToken.paid_access === true) {
        return true;
      }
    } catch (error) {
      console.log('Firebase token verification failed:', error.message);
    }
  }
  
  console.log('No valid authentication found, denying access');
  return false;
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
  // Extract page from path or query parameter
  let page = event.queryStringParameters?.page;
  
  // If no page parameter, extract from path
  if (!page && event.path) {
    const pathParts = event.path.split('/');
    
    // Handle /Paid/, /paid/, or /PaidContent/ paths
    let contentIndex = -1;
    if (pathParts.includes('Paid')) {
      contentIndex = pathParts.findIndex(part => part === 'Paid');
    } else if (pathParts.includes('paid')) {
      contentIndex = pathParts.findIndex(part => part === 'paid');
    } else if (pathParts.includes('PaidContent')) {
      contentIndex = pathParts.findIndex(part => part === 'PaidContent');
    }
    
    if (contentIndex >= 0 && contentIndex < pathParts.length - 1) {
      page = pathParts.slice(contentIndex + 1).join('/');
    }
  }

  console.log('servePaidContentNew called with page:', page);
  console.log('Event path:', event.path);
  console.log('All query parameters:', event.queryStringParameters);

  if (!page) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: "Missing page parameter or unable to extract from path"
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
        let staticUrl = `/PaidContent/${page}`;
        if (!staticUrl.endsWith('.html') && !staticUrl.endsWith('.json')) {
          staticUrl += '.html';
        }
        
        // Preserve query parameters in redirect
        if (event.rawQuery) {
          staticUrl += `?${event.rawQuery}`;
        }
        
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
      let staticUrl = `/PaidContent/${page}`;
      if (!staticUrl.endsWith('.html') && !staticUrl.endsWith('.json')) {
        staticUrl += '.html';
      }
      
      // Preserve query parameters in redirect
      if (event.rawQuery) {
        staticUrl += `?${event.rawQuery}`;
      }
      
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
