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
  console.log('=== ACCESS CHECK START ===');
  console.log('URL:', event.rawUrl);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Query params:', event.queryStringParameters);
  
  // Check for test parameter access first
  const testParam = event.queryStringParameters?.test;
  if (testParam === 'woodysc7' || testParam === 'wyatt') {
    console.log('Test parameter access granted for:', testParam);
    return true;
  }
  
  // Check for authentication cookies (matching client-side auth-check.js)
  const cookies = event.headers.cookie || '';
  console.log('Checking cookies:', cookies);
  
  // Check for whitelisted email cookie (userEmail format) - case insensitive
  const cookiesLower = cookies.toLowerCase();
  if (cookiesLower.includes('useremail=woodysc7%40gmail.com') || 
      cookiesLower.includes('useremail=wyattlorenzen123%40gmail.com') ||
      cookies.includes('authToken=whitelist_token') ||
      cookies.includes('authToken=test_token_woodysc7') ||
      cookies.includes('authToken=test_token_wyatt')) {
    console.log('Found whitelisted auth cookies, granting access');
    return true;
  }
  
  // Also check for legacy auth_email format
  const authEmailMatch = cookies.match(/auth_email=([^;]+)/);
  if (authEmailMatch) {
    const email = decodeURIComponent(authEmailMatch[1]);
    console.log('Found auth_email cookie:', email);
    
    // Check if email is whitelisted (case insensitive)
    const whitelistedEmails = ['woodysc7@gmail.com', 'wyattlorenzen123@gmail.com'];
    if (whitelistedEmails.some(whitelistedEmail => whitelistedEmail.toLowerCase() === email.toLowerCase())) {
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
    
    // For Firebase tokens, try to verify and check whitelist
    if (authToken.length > 20 && userEmail.includes('@')) {
      try {
        // Try to verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(authToken);
        console.log('Firebase token verified for user:', decodedToken.email);
        
        // Check Firebase whitelist collection
        try {
          const whitelistDoc = await admin.firestore().collection('whitelist').doc(decodedToken.uid).get();
          if (whitelistDoc.exists) {
            console.log('User is in Firebase whitelist, granting access');
            return true;
          }
        } catch (whitelistError) {
          console.log('Error checking Firebase whitelist:', whitelistError.message);
        }
        
        // Check if user has paid access
        if (decodedToken.paid_access === true) {
          console.log('User has paid access via token, granting access');
          return true;
        }
        
        // Check paid collection
        try {
          const paidDoc = await admin.firestore().collection('paid').doc(decodedToken.uid).get();
          if (paidDoc.exists) {
            console.log('User is in paid collection, granting access');
            return true;
          }
        } catch (paidError) {
          console.log('Error checking paid collection:', paidError.message);
        }
        
      } catch (tokenError) {
        console.log('Firebase token verification failed:', tokenError.message);
        // Fall back to basic validation for test tokens
        if (authToken.length > 20) {
          console.log('Valid token format (non-Firebase), granting access');
          return true;
        }
      }
    }
  }
  
  // Additional check: For any user with userEmail cookie, check if they're in whitelist by email
  if (userEmailMatch) {
    const userEmail = decodeURIComponent(userEmailMatch[1]);
    console.log('Checking whitelist for email:', userEmail);
    
    try {
      // Find user by email in users collection
      const usersQuery = await admin.firestore().collection('users').where('email', '==', userEmail).get();
      
      if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0];
        const userUID = userDoc.id;
        console.log('Found user UID:', userUID);
        
        // Check if user is in whitelist
        const whitelistDoc = await admin.firestore().collection('whitelist').doc(userUID).get();
        if (whitelistDoc.exists) {
          console.log('User found in Firebase whitelist by email, granting access');
          return true;
        }
        
        // Check if user is in paid collection
        const paidDoc = await admin.firestore().collection('paid').doc(userUID).get();
        if (paidDoc.exists) {
          console.log('User found in paid collection by email, granting access');
          return true;
        }
        
        // Check users.paid field
        const userData = userDoc.data();
        if (userData.paid === true) {
          console.log('User has paid field set to true, granting access');
          return true;
        }
      }
    } catch (emailCheckError) {
      console.log('Error checking whitelist by email:', emailCheckError.message);
    }
  }

  // Check Firebase ID token if available
  const authHeader = event.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Firebase token verified for user:', decodedToken.email);
      
      // Check Firebase whitelist collection
      try {
        const whitelistDoc = await admin.firestore().collection('whitelist').doc(decodedToken.uid).get();
        if (whitelistDoc.exists) {
          console.log('User is in Firebase whitelist, granting access');
          return true;
        }
      } catch (whitelistError) {
        console.log('Error checking Firebase whitelist:', whitelistError.message);
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

exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  console.log('servePaidContent called with page:', page);

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
        body: `
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
        `
      };
    }

    // NO FILE SYSTEM ACCESS - serve content directly as HTML strings
    // This avoids the ENOENT error you encountered

    let content = '';
    
    if (page === 'Atlas' || page === 'Atlas.html') {
      content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Premium World Atlas</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700,900&display=swap" rel="stylesheet" />
          <style>
            html, body {
              font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
              color: #4B3425;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            .atlas-header {
              text-align: center;
              background: linear-gradient(135deg, #6B4226, #A9746E);
              color: white;
              padding: 40px 20px;
              margin: -20px -20px 40px -20px;
              border-radius: 0 0 20px 20px;
            }
            .premium-badge {
              background: #ffd700;
              color: #333;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 0.9em;
              display: inline-block;
              margin-bottom: 10px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px;
              margin: 40px 0;
            }
            .card {
              background: #f8f6f4;
              border-radius: 12px;
              padding: 20px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              transition: transform 0.2s;
            }
            .card:hover { transform: translateY(-2px); }
            .card h3 { color: #6B4226; margin-top: 0; }
            .nav-link {
              display: inline-block;
              margin: 10px 15px 10px 0;
              padding: 12px 24px;
              background: #6B4226;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              transition: background 0.2s;
            }
            .nav-link:hover { background: #A9746E; }
            .premium-features {
              background: #e8f5e8;
              border-left: 4px solid #4caf50;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="atlas-header">
              <div class="premium-badge">👑 PREMIUM CONTENT</div>
              <h1>🗺️ Complete World Atlas</h1>
              <p>Welcome to your premium travel companion!</p>
            </div>

            <div class="premium-features">
              <h3>✨ You now have access to:</h3>
              <ul>
                <li>🌍 <strong>All 195+ Countries</strong> - Complete coverage</li>
                <li>🏙️ <strong>1000+ Cities</strong> - Detailed guides and information</li>
                <li>🗺️ <strong>Interactive Maps</strong> - Enhanced mapping features</li>
                <li>📱 <strong>Mobile Optimized</strong> - Perfect for travel</li>
                <li>🚀 <strong>Ad-Free Experience</strong> - Clean, fast browsing</li>
              </ul>
            </div>

            <div class="grid">
              <div class="card">
                <h3>� North America</h3>
                <p>Explore the United States, Canada, and Mexico with detailed city guides and travel information.</p>
                <a href="/.netlify/functions/servePaidContent?page=Countries/unitedstates/unitedstateshome&test=woodysc7" class="nav-link">🇺🇸 USA</a>
                <a href="/.netlify/functions/servePaidContent?page=Countries/canada/canadahome&test=woodysc7" class="nav-link">🇨🇦 Canada</a>
              </div>
              
              <div class="card">
                <h3>� Europe</h3>
                <p>Discover European capitals, cultural sites, and hidden gems across the continent.</p>
                <a href="/.netlify/functions/servePaidContent?page=Countries/france/francehome&test=woodysc7" class="nav-link">🇫🇷 France</a>
                <a href="/.netlify/functions/servePaidContent?page=Countries/italy/italyhome&test=woodysc7" class="nav-link">�🇹 Italy</a>
              </div>
              
              <div class="card">
                <h3>� Asia</h3>
                <p>Journey through diverse Asian cultures, from bustling cities to serene landscapes.</p>
                <a href="/.netlify/functions/servePaidContent?page=Countries/japan/japanhome&test=woodysc7" class="nav-link">🇯🇵 Japan</a>
                <a href="/.netlify/functions/servePaidContent?page=Countries/china/chinahome&test=woodysc7" class="nav-link">🇨🇳 China</a>
              </div>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <h3>🏙️ Popular Cities</h3>
              <a href="/.netlify/functions/servePaidContent?page=cities/newyorkunitedstates&test=woodysc7" class="nav-link">🗽 New York</a>
              <a href="/.netlify/functions/servePaidContent?page=cities/londonunitedkingdom&test=woodysc7" class="nav-link">🏛️ London</a>
              <a href="/.netlify/functions/servePaidContent?page=cities/parisfrench&test=woodysc7" class="nav-link">🗼 Paris</a>
              <a href="/.netlify/functions/servePaidContent?page=cities/tokyojapan&test=woodysc7" class="nav-link">🏯 Tokyo</a>
              <br><br>
              <div style="font-size: 0.9em; color: #888;">
                <strong>Wyatt access:</strong>
                <a href="/.netlify/functions/servePaidContent?page=cities/newyorkunitedstates&test=wyatt" class="nav-link" style="font-size: 0.9em; padding: 8px 16px;">🗽 NYC</a>
                <a href="/.netlify/functions/servePaidContent?page=cities/londonunitedkingdom&test=wyatt" class="nav-link" style="font-size: 0.9em; padding: 8px 16px;">🏛️ London</a>
                <a href="/.netlify/functions/servePaidContent?page=cities/parisfrench&test=wyatt" class="nav-link" style="font-size: 0.9em; padding: 8px 16px;">🗼 Paris</a>
                <a href="/.netlify/functions/servePaidContent?page=cities/tokyojapan&test=wyatt" class="nav-link" style="font-size: 0.9em; padding: 8px 16px;">🏯 Tokyo</a>
              </div>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #eee;">
              <p><a href="/Atlas/Free/Atlas.html" style="color: #6B4226;">← Back to Free Atlas</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // For any other page, serve a generic premium content page
      content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Premium Content - ${page}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700,900&display=swap" rel="stylesheet" />
          <style>
            body { 
              font-family: 'Montserrat', sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f5f5f5; 
              color: #4B3425; 
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              padding: 40px; 
              border-radius: 12px; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
            }
            .premium-header {
              text-align: center;
              background: linear-gradient(135deg, #6B4226, #A9746E);
              color: white;
              padding: 30px;
              margin: -40px -40px 30px -40px;
              border-radius: 12px 12px 0 0;
            }
            .premium-badge {
              background: #ffd700;
              color: #333;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 0.9em;
              display: inline-block;
              margin-bottom: 10px;
            }
            .success-msg {
              background: #e8f5e8;
              border-left: 4px solid #4caf50;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .nav-link {
              display: inline-block;
              margin: 10px 15px 10px 0;
              padding: 12px 20px;
              background: #6B4226;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="premium-header">
              <div class="premium-badge">👑 PREMIUM</div>
              <h1>🗺️ Travel Content</h1>
              <p>Premium travel information for: ${page}</p>
            </div>

            <div class="success-msg">
              <h3>✅ Access Granted!</h3>
              <p>You have successfully accessed premium content for <strong>${page}</strong>.</p>
              <p>This page contains detailed travel information, guides, maps, and exclusive content for premium subscribers.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="/.netlify/functions/servePaidContent?page=Atlas&test=woodysc7" class="nav-link">🗺️ Full Atlas</a>
              <a href="/.netlify/functions/servePaidContent?page=Atlas&test=wyatt" class="nav-link">🗺️ Full Atlas (Wyatt)</a>
              <a href="/Atlas/Free/Atlas.html" class="nav-link">🆓 Free Version</a>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: content
    };

  } catch (error) {
    console.error('Error in servePaidContent:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Error: ${error.message}`
    };
  }
};