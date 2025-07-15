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

  // For now, return a test response to confirm the function works
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
              <p><strong>Success!</strong> You are accessing paid content through the protected function.</p>
              <p><strong>Page requested:</strong> ${page}</p>
              <p>This content is now properly protected and can only be accessed through the Netlify function, not directly via URL.</p>
              <h3>Security Status:</h3>
              <ul>
                <li>✅ Direct URL access blocked (returns 404)</li>
                <li>✅ Content served only through function</li>
                <li>✅ Payment verification can be added here</li>
              </ul>
              <p><a href="/Free/Atlas.html">← Back to Free Atlas</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};