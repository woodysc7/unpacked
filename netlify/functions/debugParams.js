exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queryStringParameters: event.queryStringParameters,
      pathParameters: event.pathParameters,
      path: event.path,
      rawUrl: event.rawUrl,
      headers: event.headers
    }, null, 2)
  };
};
