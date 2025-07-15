exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: `Test redirect received page: ${event.queryStringParameters?.page || 'NO PAGE PARAM'}`
  };
};
