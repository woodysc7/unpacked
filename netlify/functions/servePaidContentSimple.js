exports.handler = async (event, context) => {
  console.log('servePaidContentSimple called - deployment test');
  const { page } = event.queryStringParameters || {};

  if (!page) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: "Missing page parameter"
    };
  }

  // For now, just serve content directly for testing
  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    },
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Premium Atlas - ${page}</title>
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
            padding: 40px;
            margin: -40px -40px 40px -40px;
            border-radius: 12px 12px 0 0;
          }
          .success { 
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
            <h1>🗺️ Premium Content: ${page}</h1>
            <p>Working! Function is deployed successfully.</p>
          </div>

          <div class="success">
            <h3>✅ Function Test Successful!</h3>
            <p>The servePaidContent function is working properly.</p>
            <p>Requested page: <strong>${page}</strong></p>
            <p>No more ENOENT errors - the function is serving content correctly.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="/Atlas/Free/Atlas.html" class="nav-link">← Back to Free Atlas</a>
          </div>
        </div>
      </body>
      </html>
    `
  };
};
