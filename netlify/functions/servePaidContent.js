const path = require('path');
const fs = require('fs');

exports.handler = async (event, context) => {
  const { page } = event.queryStringParameters || {};

  if (!page) {
    return {
      statusCode: 400,
      body: "Missing page parameter"
    };
  }

  // Construct the path to the requested file in the private Paid folder
  const filePath = path.join(__dirname, '../../..', 'Paid', `${page}.html`);

  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    return { statusCode: 403, body: "Forbidden" };
  }

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: fileContents
    };
  } catch (err) {
    return {
      statusCode: 404,
      body: "File not found"
    };
  }
};