// Wait for DOM to be ready and Firebase to be initialized
document.addEventListener('DOMContentLoaded', function() {
  // Use Firebase v8 syntax to match firebase.js
  const auth = firebase.auth();
  const db = firebase.firestore();

  const authForm = document.getElementById('authForm');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');

loginBtn.onclick = async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';
  successMsg.textContent = '';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('=== LOGIN SUCCESS ===');
    console.log('User:', user.email, 'UID:', user.uid);
    console.log('Current timestamp:', new Date().toISOString());
    
    // Check whitelist directly using client-side Firebase
    let hasAccess = false;
    let accessType = '';
    
    try {
      console.log('Checking whitelist via client-side Firebase...');
      
      // Check whitelist by UID first
      const whitelistDoc = await db.collection('whitelist').doc(user.uid).get();
      const whitelistExists = whitelistDoc && whitelistDoc.data() !== undefined;
      console.log('Whitelist by UID - exists:', whitelistExists, 'data:', whitelistDoc.data());
      
      if (whitelistExists) {
        hasAccess = true;
        accessType = 'whitelist';
        console.log('✅ Found in whitelist by UID');
      } else {
        // Check whitelist by email as fallback
        console.log('Checking whitelist by email...');
        const emailQuery = await db.collection('whitelist').where('email', '==', user.email).get();
        console.log('Email query size:', emailQuery.size);
        
        if (!emailQuery.empty) {
          hasAccess = true;
          accessType = 'whitelist';
          console.log('✅ Found in whitelist by email');
        } else {
          // Check paid collection
          console.log('Checking paid collection...');
          const paidDoc = await db.collection('paid').doc(user.uid).get();
          const paidExists = paidDoc && paidDoc.data() !== undefined;
          console.log('Paid by UID - exists:', paidExists, 'data:', paidDoc.data());
          
          if (paidExists) {
            hasAccess = true;
            accessType = 'paid';
            console.log('✅ Found in paid collection');
          } else {
            // Check users collection paid field
            console.log('Checking users collection...');
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userExists = userDoc && userDoc.data() !== undefined;
            console.log('User doc - exists:', userExists, 'data:', userDoc.data());
            
            if (userExists && userDoc.data().paid === true) {
              hasAccess = true;
              accessType = 'users_paid';
              console.log('✅ Found paid flag in users collection');
            }
          }
        }
      }
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      console.log('❌ Client-side Firestore check failed');
    }
    
    console.log('=== FINAL RESULTS ===');
    console.log('User:', user.email, 'UID:', user.uid);
    console.log('Has Access:', hasAccess);
    console.log('Access Type:', accessType);
    console.log('================');
    
    if (hasAccess) {
      // Set authentication cookies for the Netlify function
      const token = await user.getIdToken();
      document.cookie = `authToken=${token}; path=/; secure; samesite=strict`;
      document.cookie = `userEmail=${encodeURIComponent(user.email)}; path=/; secure; samesite=strict`;
      
      console.log('Setting auth cookies for user with access:', user.email);
      console.log('Cookies set:', document.cookie);
      
      successMsg.textContent = `Login successful! You have ${accessType === 'whitelist' ? 'free' : 'paid'} access. Redirecting...`;
      
      setTimeout(() => {
        console.log('Redirecting to paid content...');
        window.location.href = '/.netlify/functions/servePaidContentNew?page=Atlas';
      }, 2000);
    } else {
      console.log('No access found, redirecting to purchase');
      successMsg.textContent = 'Login successful! Please purchase access to view paid content.';
      
      // Add a button to manually test whitelist access
      successMsg.innerHTML += '<br><button onclick="testWhitelistAccess()" style="margin-top: 10px; padding: 8px 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">🔍 Debug Whitelist Access</button>';
      
      setTimeout(() => window.location.href = '/.netlify/functions/create-checkout-session', 4000);
    }
  } catch (err) {
    errorMsg.textContent = err.message;
    console.error('Login error:', err);
  }
};

signupBtn.onclick = async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';
  successMsg.textContent = '';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    // Create user record in Firestore (mark as not paid yet)
    await db.collection('users').doc(userCredential.user.uid).set({
      email: email,
      paid: false,
      createdAt: new Date()
    });
    successMsg.textContent = 'Sign up successful! Please log in.';
  } catch (err) {
    errorMsg.textContent = err.message;
  }
};

// Manual test function for debugging whitelist access
window.testWhitelistAccess = async function() {
  console.log('=== MANUAL WHITELIST TEST ===');
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in');
    return;
  }
  
  console.log('Testing whitelist access for:', user.email, user.uid);
  
  try {
    // Direct whitelist check by UID
    const whitelistDoc = await db.collection('whitelist').doc(user.uid).get();
    const whitelistExists = whitelistDoc && whitelistDoc.data() !== undefined;
    console.log('Direct UID check result:', whitelistExists);
    if (whitelistExists) {
      console.log('Whitelist data:', whitelistDoc.data());
      alert('✅ Found in whitelist by UID! Should have access.');
      
      // Also test the server-side function
      console.log('Testing server-side access check...');
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/.netlify/functions/checkUserAccessSecure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Server-side result:', result);
          alert(`Server-side check: hasAccess=${result.hasAccess}, accessType=${result.accessType}`);
        } else {
          console.log('Server-side check failed:', response.status);
          alert('Server-side check failed');
        }
      } catch (error) {
        console.log('Server-side check error:', error);
        alert('Server-side check error: ' + error.message);
      }
      
      return;
    }
    
    // Check by email
    const whitelistQuery = await db.collection('whitelist').where('email', '==', user.email).get();
    console.log('Email query result size:', whitelistQuery.size);
    if (!whitelistQuery.empty) {
      whitelistQuery.forEach(doc => {
        console.log('Found by email - Doc ID:', doc.id, 'Data:', doc.data());
      });
      alert('✅ Found in whitelist by email! Should have access.');
      return;
    }
    
    // Show all whitelist entries for debugging
    const allWhitelist = await db.collection('whitelist').get();
    console.log('All whitelist entries:');
    allWhitelist.forEach(doc => {
      console.log('Doc ID:', doc.id, 'Data:', doc.data());
    });
    
    alert('❌ Not found in whitelist. Check console for all whitelist entries.');
    
  } catch (error) {
    console.error('Error in manual test:', error);
    alert('Error: ' + error.message);
  }
};

}); // End DOMContentLoaded