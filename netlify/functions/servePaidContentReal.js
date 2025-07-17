const fs = require('fs');
const path = require('path');

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

    // Check for test access (temporary for development)
    const testAccess = event.queryStringParameters?.test === 'woodysc7' ||
                      event.queryStringParameters?.test === 'wyatt';
    
    // TODO: Add proper Firebase authentication check here
    if (!testAccess) {
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
                  border-radius: 10px; 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .upgrade-btn { 
                  background: #ff6b6b; 
                  color: white; 
                  padding: 12px 24px; 
                  border: none; 
                  border-radius: 5px; 
                  font-size: 16px; 
                  cursor: pointer; 
                  text-decoration: none; 
                  display: inline-block; 
                  margin-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🔒 Premium Content</h1>
                <p>This content is only available to premium subscribers.</p>
                <p>Upgrade to access exclusive travel guides, detailed city information, and premium features.</p>
                <a href="/Atlas/Free/signup.html" class="upgrade-btn">Upgrade to Premium</a>
                <p><a href="/Atlas/Free/Atlas.html">← Back to Free Atlas</a></p>
              </div>
            </body>
          </html>
        `
      };
    }

    // Try to serve the actual content from _Paid directory
    let filePath;
    let contentType = 'text/html';
    
    if (page === 'Atlas' || page === 'Atlas.html') {
      filePath = path.join(__dirname, '_Paid', 'Atlas.html');
    } else if (page.startsWith('cities/')) {
      const cityFile = page.replace('cities/', '') + '.html';
      filePath = path.join(__dirname, '_Paid', 'cities', cityFile);
    } else if (page.startsWith('Countries/')) {
      filePath = path.join(__dirname, '_Paid', page + '.html');
    } else {
      // Default to trying the page as-is
      filePath = path.join(__dirname, '_Paid', page + '.html');
    }

    console.log('Attempting to serve file:', filePath);

    // Check if file exists and read it
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log('Successfully read file, length:', content.length);
      
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: content
      };
    } else {
      console.log('File not found:', filePath);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: `Premium content not found: ${page}`
      };
    }

  } catch (error) {
    console.error('Error in servePaidContent:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Error: ${error.message}`
    };
  }
};
