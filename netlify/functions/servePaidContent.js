const path = require('path');
const fs = require('fs');

exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  console.log('servePaidContent called with page:', page);
  console.log('event.path:', event.path);
  console.log('__dirname:', __dirname);

  if (!page) {
    return {
      statusCode: 400,
      body: "Missing page parameter"
    };
  }

  // Try multiple possible paths for the _Paid folder
  const possiblePaths = [
    path.join(__dirname, '_Paid', `${page}.html`),
    path.join(__dirname, '..', '_Paid', `${page}.html`),
    path.join(process.cwd(), 'netlify', 'functions', '_Paid', `${page}.html`),
    path.join('/var/task', 'netlify', 'functions', '_Paid', `${page}.html`)
  ];

  for (const filePath of possiblePaths) {
    console.log('Trying file path:', filePath);
    
    // Security: prevent directory traversal
    if (filePath.includes('..') && !possiblePaths.includes(filePath)) {
      continue;
    }

    try {
      if (fs.existsSync(filePath)) {
        console.log('Found file at:', filePath);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'text/html' },
          body: fileContents
        };
      }
    } catch (readError) {
      console.log('Error reading file:', readError.message);
      continue;
    }
  }

  // If we get here, file not found
  console.log('File not found at any of the attempted paths');
  return {
    statusCode: 404,
    body: 'Paid content not found'
  };
};