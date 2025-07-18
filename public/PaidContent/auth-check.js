// Premium content authentication check
// This script protects premium content from unauthorized access

async function checkPremiumAccess() {
  console.log('🔒 Starting premium content authentication check...');
  
  // First, try Firebase authentication if available
  if (typeof firebase !== 'undefined' && firebase.auth && window.firebaseAuthEnhanced) {
    try {
      console.log('Checking Firebase authentication with enhanced module...');
      const firebaseAuth = await window.firebaseAuthEnhanced.getAuthStatus();
      if (firebaseAuth.hasAccess) {
        console.log('✅ Access granted via Firebase:', firebaseAuth.reason);
        return true;
      } else {
        console.log('❌ Firebase user not authenticated or no permissions:', firebaseAuth.reason);
      }
    } catch (error) {
      console.log('⚠️ Firebase auth check failed:', error);
    }
  } else {
    console.log('⚠️ Firebase not available, checking other auth methods...');
  }

  const cookies = document.cookie;
  const cookiesLower = cookies.toLowerCase();
  
  // Check for valid authentication cookies
  if (cookies.includes('authToken=whitelist_token') ||
      cookies.includes('paid_access=true')) {
    // User is authorized, continue loading page
    console.log('✅ Access granted via cookie check');
    return true;
  }
  
  // Check for valid authentication token
  const authToken = getCookie('authToken');
  const userEmail = getCookie('userEmail');
  
  if (!authToken || !userEmail) {
    console.log('❌ No auth token or user email found in cookies');
    return false;
  }
  
  // For Firebase tokens, we'll do basic validation
  if (authToken.length > 20 && userEmail.includes('@')) {
    console.log('✅ Valid-looking Firebase token found for:', userEmail);
    return true; // Likely valid Firebase token
  }
  
  // Additional check: For any userEmail cookie, check server-side whitelist/paid status
  if (userEmail && userEmail.includes('@')) {
    try {
      console.log('🔍 Checking server-side access for:', userEmail);
      const response = await fetch(`/.netlify/functions/checkUserAccess?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasAccess && (data.access.whitelist || data.access.paid || data.access.usersPaid)) {
          console.log('✅ User authorized via server-side access check:', data.accessType);
          return true;
        } else {
          console.log('❌ Server-side check: User not found or no access:', data);
        }
      } else {
        console.log('⚠️ Server-side check failed with status:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Error checking server-side access:', error);
    }
  }
  
  console.log('❌ Access denied - no valid authentication found');
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
