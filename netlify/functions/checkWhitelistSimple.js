exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { uid, email } = JSON.parse(event.body);
    
    if (!uid || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing uid or email' })
      };
    }

    console.log('Checking whitelist for:', { uid, email });

    // Use Firestore REST API to check whitelist
    const projectId = 'unpacked-1b2b1';
    const apiKey = 'AIzaSyD2-Ns0c-yTGIjmTcLOC5koCBiLFGHVs9I';
    
    // Check whitelist by UID
    const whitelistByUidUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/whitelist/${uid}?key=${apiKey}`;
    
    try {
      const whitelistResponse = await fetch(whitelistByUidUrl);
      
      if (whitelistResponse.ok) {
        const whitelistData = await whitelistResponse.json();
        console.log('Found in whitelist by UID:', whitelistData);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            hasAccess: true,
            accessType: 'whitelist',
            method: 'uid_check',
            details: { whitelistData }
          })
        };
      }
    } catch (uidError) {
      console.log('Error checking whitelist by UID:', uidError.message);
    }

    // Check whitelist by email query
    const whitelistByEmailUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/whitelist?key=${apiKey}`;
    
    try {
      const emailQueryResponse = await fetch(whitelistByEmailUrl);
      
      if (emailQueryResponse.ok) {
        const queryData = await emailQueryResponse.json();
        
        if (queryData.documents) {
          for (const doc of queryData.documents) {
            if (doc.fields && doc.fields.email && doc.fields.email.stringValue === email) {
              console.log('Found in whitelist by email:', doc);
              
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                  hasAccess: true,
                  accessType: 'whitelist',
                  method: 'email_check',
                  details: { whitelistData: doc }
                })
              };
            }
          }
        }
      }
    } catch (emailError) {
      console.log('Error checking whitelist by email:', emailError.message);
    }

    // Check paid collection by UID
    const paidByUidUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/paid/${uid}?key=${apiKey}`;
    
    try {
      const paidResponse = await fetch(paidByUidUrl);
      
      if (paidResponse.ok) {
        const paidData = await paidResponse.json();
        console.log('Found in paid collection:', paidData);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            hasAccess: true,
            accessType: 'paid',
            method: 'paid_check',
            details: { paidData }
          })
        };
      }
    } catch (paidError) {
      console.log('Error checking paid collection:', paidError.message);
    }

    // Check users collection paid field
    const userByUidUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`;
    
    try {
      const userResponse = await fetch(userByUidUrl);
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('Found user data:', userData);
        
        if (userData.fields && userData.fields.paid && userData.fields.paid.booleanValue === true) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              hasAccess: true,
              accessType: 'users_paid',
              method: 'users_check',
              details: { userData }
            })
          };
        }
      }
    } catch (userError) {
      console.log('Error checking users collection:', userError.message);
    }

    console.log('No access found for user:', { uid, email });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasAccess: false,
        accessType: null,
        method: 'none',
        details: { message: 'No access found in any collection' }
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
