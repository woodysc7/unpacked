// Premium content authentication check
// This script protects premium content from unauthorized access

async function checkPremiumAccess() {
  // First, try Firebase authentication if available
  if (typeof firebase !== 'undefined' && firebase.auth && window.firebaseAuthEnhanced) {
    try {
      console.log('Checking Firebase authentication...');
      const firebaseAuth = await window.firebaseAuthEnhanced.getAuthStatus();
      if (firebaseAuth.hasAccess) {
        console.log('Access granted via Firebase:', firebaseAuth.reason);
        return true;
      }
    } catch (error) {
      console.log('Firebase auth check failed:', error);
    }
  }

  const cookies = document.cookie;
  const cookiesLower = cookies.toLowerCase();
  
  // Check for valid authentication cookies (case insensitive for emails, including scwood26)
  if (cookiesLower.includes('useremail=woodysc7%40gmail.com') || 
      cookiesLower.includes('useremail=wyattlorenzen123%40gmail.com') ||
      cookiesLower.includes('useremail=scwood26%40g.holycross.edu') ||
      cookies.includes('authToken=whitelist_token') ||
      cookies.includes('authToken=test_token_woodysc7') ||
      cookies.includes('authToken=test_token_wyatt') ||
      cookies.includes('authToken=test_token_scwood26')) {
    // User is authorized, continue loading page
    console.log('Access granted via hardcoded cookie check');
    return true;
  }
  
  // Check for valid authentication token
  const authToken = getCookie('authToken');
  const userEmail = getCookie('userEmail');
  
  if (!authToken || !userEmail) {
    console.log('No auth token or user email found in cookies');
    return false;
  }
  
  // For Firebase tokens, we'll do basic validation
  if (authToken.length > 20 && userEmail.includes('@')) {
    console.log('Valid-looking Firebase token found');
    return true; // Likely valid Firebase token
  }
  
  // Additional check: For any userEmail cookie, check server-side whitelist/paid status
  if (userEmail && userEmail.includes('@')) {
    try {
      console.log('Checking server-side access for:', userEmail);
      const response = await fetch(`/.netlify/functions/checkUserAccess?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasAccess && (data.access.whitelist || data.access.paid || data.access.usersPaid)) {
          console.log('User authorized via server-side access check:', data.accessType);
          return true;
        }
      }
    } catch (error) {
      console.log('Error checking server-side access:', error);
    }
  }
  
  console.log('Access denied - no valid authentication found');
  return false;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Run authentication check immediately when script loads
(async () => {
  const hasAccess = await checkPremiumAccess();
  if (!hasAccess) {
    // User is not authorized, redirect to signup
    window.location.href = '/Atlas/Free/signup.html';
  } else {
    // User is authorized - set a flag to prevent multiple checks
    window.premiumAccessVerified = true;
  }
})();
