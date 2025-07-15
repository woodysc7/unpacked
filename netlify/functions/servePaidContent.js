const path = require('path');
const fs = require('fs');

exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  console.log('servePaidContent called with page:', page);

  if (!page) {
    return {
      statusCode: 400,
      body: "Missing page parameter"
    };
  }

  try {
    // For testing: allow access with special parameter
    const testAccess = event.queryStringParameters?.test === 'woodysc7';

    if (!testAccess) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Access Denied</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; text-align: center; }
                .container { max-width: 600px; margin: 0 auto; }
                .denied { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="denied">
                  <h1>🔒 Access Denied</h1>
                  <p>This content requires a paid subscription.</p>
                  <p><a href="/Atlas/Free/signup.html">Sign up or log in</a> to access paid content.</p>
                  <p><a href="/Atlas/Free/Atlas.html">← Back to Free Atlas</a></p>
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

    // Handle different content types
    let filePath;
    
    if (page === 'Atlas') {
      filePath = path.join(__dirname, '_Paid', 'Atlas.html');
    } else if (page.startsWith('Countries/')) {
      filePath = path.join(__dirname, '_Paid', `${page}.html`);
    } else if (page.startsWith('cities/')) {
      filePath = path.join(__dirname, '_Paid', `${page}.html`);
    } else {
      filePath = path.join(__dirname, '_Paid', `${page}.html`);
    }
    
    console.log('Looking for file at:', filePath);
    console.log('File exists?', fs.existsSync(filePath));
    console.log('Directory contents:', fs.readdirSync(path.join(__dirname, '_Paid')));

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
      // File not found, return test content for now
      return {
        statusCode: 200,
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
              <title>Debug Info - ${page}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                .debug { color: blue; background: #f0f8ff; padding: 20px; border-radius: 8px; }
                .file-list { background: #f5f5f5; padding: 10px; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="debug">
                  <h1>� Debug: File Not Found</h1>
                  <p><strong>Page requested:</strong> ${page}</p>
                  <p><strong>File path:</strong> ${filePath}</p>
                  <p><strong>__dirname:</strong> ${__dirname}</p>
                  <p><strong>File exists?:</strong> ${fs.existsSync(filePath)}</p>
                  <div class="file-list">
                    <strong>Files in _Paid directory:</strong><br>
                    ${fs.readdirSync(path.join(__dirname, '_Paid')).join('<br>')}
                  </div>
                  <p><a href="/Atlas/Free/Atlas.html">← Back to Free Atlas</a></p>
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
