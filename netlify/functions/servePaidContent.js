const path = require('path');
const fs = require('fs');

exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  console.log('servePaidContent called with page:', page);
  console.log('event.path:', event.path);

  if (!page) {
    return {
      statusCode: 400,
      body: "Missing page parameter"
    };
  }

  // For testing, let's serve the actual content from _Paid folder
  try {
    const filePath = path.join(__dirname, '../../..', '_Paid', `${page}.html`);
    console.log('Looking for file at:', filePath);
    
    // Security: prevent directory traversal
    if (filePath.includes('..')) {
      return { statusCode: 403, body: "Forbidden" };
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: fileContents
    };
  } catch (err) {
    console.log('File read error:', err.message);
    // If file not found, redirect to signup
    return {
      statusCode: 302,
      headers: {
        'Location': '/Free/signup.html'
      },
      body: 'Redirecting to signup...'
    };
  }
};