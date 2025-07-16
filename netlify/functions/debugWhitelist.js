exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Listing all whitelist entries...');

    // Use Firestore REST API to list all whitelist entries
    const projectId = 'unpacked-1b2b1';
    const apiKey = 'AIzaSyD2-Ns0c-yTGIjmTcLOC5koCBiLFGHVs9I';
    
    const whitelistUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/whitelist?key=${apiKey}`;
    
    const response = await fetch(whitelistUrl);
    
    if (!response.ok) {
      throw new Error(`Firestore API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const entries = [];
    
    if (data.documents) {
      for (const doc of data.documents) {
        const docId = doc.name.split('/').pop();
        const fields = doc.fields || {};
        
        const entry = {
          docId,
          email: fields.email ? fields.email.stringValue : null,
          // Include any other fields
          ...Object.keys(fields).reduce((acc, key) => {
            if (key !== 'email') {
              acc[key] = fields[key].stringValue || fields[key].booleanValue || fields[key].integerValue;
            }
            return acc;
          }, {})
        };
        
        entries.push(entry);
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalEntries: entries.length,
        entries: entries
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
