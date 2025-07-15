// Premium content authentication check
// This script protects premium content from unauthorized access

function checkPremiumAccess() {
  const cookies = document.cookie;
  
  // Check for valid authentication cookies
  if (cookies.includes('userEmail=woodysc7%40gmail.com') || 
      cookies.includes('authToken=whitelist_token') ||
      cookies.includes('authToken=test_token_woodysc7')) {
    // User is authorized, continue loading page
    return true;
  }
  
  // User is not authorized, redirect to signup
  window.location.href = '/Atlas/Free/signup.html';
  return false;
}

// Run authentication check immediately when script loads
if (!checkPremiumAccess()) {
  // Stop page loading if not authorized
  document.addEventListener('DOMContentLoaded', function() {
    document.body.innerHTML = '<div style="text-align:center;margin-top:100px;font-family:Montserrat,Arial,sans-serif;color:#4B3425;"><p>Access denied. Redirecting to signup...</p></div>';
  });
}
