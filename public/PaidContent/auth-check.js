// Premium content authentication check
// This script protects premium content from unauthorized access

function checkPremiumAccess() {
  const cookies = document.cookie;
  const cookiesLower = cookies.toLowerCase();
  
  // Check for valid authentication cookies (case insensitive for emails)
  if (cookiesLower.includes('useremail=woodysc7%40gmail.com') || 
      cookiesLower.includes('useremail=wyattlorenzen123%40gmail.com') ||
      cookies.includes('authToken=whitelist_token') ||
      cookies.includes('authToken=test_token_woodysc7') ||
      cookies.includes('authToken=test_token_wyatt')) {
    // User is authorized, continue loading page
    return true;
  }
  
  // Check for valid authentication token
  const authToken = getCookie('authToken');
  const userEmail = getCookie('userEmail');
  
  if (!authToken || !userEmail) {
    return false;
  }
  
  // For Firebase tokens, we'll do basic validation
  if (authToken.length > 20 && userEmail.includes('@')) {
    return true; // Likely valid Firebase token
  }
  
  return false;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Run authentication check immediately when script loads
if (!checkPremiumAccess()) {
  // User is not authorized, redirect to signup
  window.location.href = '/Atlas/Free/signup.html';
} else {
  // User is authorized - set a flag to prevent multiple checks
  window.premiumAccessVerified = true;
}
