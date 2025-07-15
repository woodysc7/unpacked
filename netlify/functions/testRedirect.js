exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: event.path,
      queryStringParameters: event.queryStringParameters,
      pathParameters: event.pathParameters,
      rawUrl: event.rawUrl,
      rawQuery: event.rawQuery,
      headers: event.headers
    }, null, 2)
  };
};
