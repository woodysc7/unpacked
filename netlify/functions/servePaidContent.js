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

  // For now, redirect all paid content access to signup page
  // TODO: Implement proper authentication checking
  return {
    statusCode: 302,
    headers: {
      'Location': '/Free/signup.html'
    },
    body: ''
  };
};