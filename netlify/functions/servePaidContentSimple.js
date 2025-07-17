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

async function checkUserAccess(event) {
  // IMMEDIATE BYPASS - GRANT ACCESS TO EVERYONE FOR DEBUGGING
  console.log('SIMPLE FUNCTION - BYPASSING ALL AUTH - GRANTING ACCESS TO ALL');
  return true;
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
            <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
              For testing: <a href="?test=woodysc7" style="color: #6B4226;">Click here for test access (woody)</a> | 
              <a href="?test=wyatt" style="color: #6B4226;">Test access (wyatt)</a> | 
              <a href="?test=scwood26" style="color: #6B4226;">Test access (scwood26)</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  console.log('servePaidContentSimple called with page:', page);

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

    // User has access - redirect to static content
    let staticUrl;
    
    if (page.endsWith('.json')) {
      // For JSON files, serve them from the static location
      staticUrl = `/paidcontent/${page.toLowerCase()}`;
    } else if (page.endsWith('.html')) {
      // For HTML files, remove extension and convert to lowercase
      staticUrl = `/paidcontent/${page.toLowerCase().replace('.html', '')}`;
    } else {
      // For files without extension, assume HTML and use pretty URL
      staticUrl = `/paidcontent/${page.toLowerCase()}`;
    }
    
    console.log('Redirecting authenticated user to:', staticUrl);
    
    return {
      statusCode: 302,
      headers: { 
        'Location': staticUrl,
        'Cache-Control': 'no-cache'
      },
      body: ''
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Internal server error'
    };
  }
};
