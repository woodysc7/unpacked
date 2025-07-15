exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: 'Hello from simple test function! Functions are working.'
  };
};
