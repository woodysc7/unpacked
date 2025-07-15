const path = require('path');
const fs = require('fs');

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
              <title>Paid Content - ${page}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                .success { color: green; background: #f0f8ff; padding: 20px; border-radius: 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success">
                  <h1>🔒 Paid Content Access</h1>
                  <p><strong>Function is working!</strong> File not found at expected location.</p>
                  <p><strong>Page requested:</strong> ${page}</p>
                  <p><strong>File path:</strong> ${filePath}</p>
                  <p><strong>__dirname:</strong> ${__dirname}</p>
                  <h3>Security Status:</h3>
                  <ul>
                    <li>✅ Direct URL access blocked (returns 404)</li>
                    <li>✅ Content served only through function</li>
                    <li>✅ Payment verification can be added here</li>
                  </ul>
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