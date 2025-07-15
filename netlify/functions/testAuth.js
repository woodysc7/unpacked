exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  console.log('testAuth called with page:', page);

  if (!page) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: "Missing page parameter"
    };
  }

  try {
    // Simple authentication check
    const hasTestAccess = event.queryStringParameters?.test === 'woodysc7';
    
    if (!hasTestAccess) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Access Denied</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                .denied { color: #d32f2f; background: #ffebee; padding: 30px; border-radius: 12px; }
              </style>
            </head>
            <body>
              <div class="denied">
                <h1>🔒 Premium Content</h1>
                <p>This content requires authentication.</p>
                <p><a href="?test=woodysc7">Click here for test access</a></p>
              </div>
            </body>
          </html>
        `
      };
    }

    // User has access - redirect to static content
    let staticUrl = `/paidcontent/${page.toLowerCase().replace('.html', '').replace('.json', '/cities.json')}`;
    
    console.log('Redirecting to:', staticUrl);
    
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
      body: `Error: ${error.message}`
    };
  }
};
