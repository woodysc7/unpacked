exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: 'Hello from Netlify function!'
  };
};
// Last updated: Mon Jul 14 23:51:07 EDT 2025
