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
    
    // Check access in order: whitelist, paid collection, users.paid field
    let hasAccess = false;
    let accessType = '';
    
    console.log('Checking access for user:', user.uid, user.email);
    
    // Try client-side checks first, fallback to server-side if permissions fail
    let permissionError = false;
    
    // Check whitelist collection first (free access)
    try {
      // Check by UID first
      const whitelistDoc = await db.collection('whitelist').doc(user.uid).get();
      console.log('Whitelist check by UID - doc exists:', whitelistDoc.exists);
      if (whitelistDoc.exists) {
        console.log('Whitelist doc data:', whitelistDoc.data());
        hasAccess = true;
        accessType = 'whitelist';
      } else {
        // Check by email with case-insensitive comparison
        const userEmailLower = user.email.toLowerCase().trim();
        console.log('Checking whitelist by email:', userEmailLower);
        
        const whitelistQuery = await db.collection('whitelist').where('email', '==', user.email).get();
        console.log('Whitelist check by email (exact) - query size:', whitelistQuery.size);
        
        if (!whitelistQuery.empty) {
          console.log('Found whitelist entry by email (exact match)');
          hasAccess = true;
          accessType = 'whitelist';
        } else {
          // Try case-insensitive search by getting all whitelist docs and checking manually
          console.log('Trying case-insensitive whitelist search...');
          const allWhitelistDocs = await db.collection('whitelist').get();
          console.log('Total whitelist docs to check:', allWhitelistDocs.size);
          
          allWhitelistDocs.forEach(doc => {
            const docData = doc.data();
            console.log('Checking whitelist doc:', doc.id, docData);
            if (docData.email && docData.email.toLowerCase().trim() === userEmailLower) {
              console.log('Found whitelist match with case-insensitive comparison!');
              hasAccess = true;
              accessType = 'whitelist';
            }
          });
        }
      }
    } catch (error) {
      console.log('Error checking whitelist:', error);
      if (error.message.includes('permission') || error.message.includes('insufficient')) {
        permissionError = true;
      }
    }
    
    // Check paid collection if not whitelisted
    if (!hasAccess && !permissionError) {
      try {
        const paidDoc = await db.collection('paid').doc(user.uid).get();
        console.log('Paid check - doc exists:', paidDoc.exists);
        if (paidDoc.exists) {
          console.log('Paid doc data:', paidDoc.data());
          hasAccess = true;
          accessType = 'paid';
        }
      } catch (error) {
        console.log('Error checking paid collection:', error);
        if (error.message.includes('permission') || error.message.includes('insufficient')) {
          permissionError = true;
        }
      }
    }
    
    // Check users collection paid field if not found elsewhere
    if (!hasAccess && !permissionError) {
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        console.log('Users check - doc exists:', userDoc.exists);
        if (userDoc.exists) {
          console.log('Users doc data:', userDoc.data());
          if (userDoc.data().paid === true) {
            hasAccess = true;
            accessType = 'users_paid';
          }
        }
      } catch (error) {
        console.log('Error checking users collection:', error);
        if (error.message.includes('permission') || error.message.includes('insufficient')) {
          permissionError = true;
        }
      }
    }
    
    // If we hit permission errors, use server-side function
    if (permissionError) {
      console.log('Permission errors detected, using server-side access check...');
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/.netlify/functions/checkUserAccessSecure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Server-side access check result:', result);
          hasAccess = result.hasAccess;
          accessType = result.accessType;
        } else {
          console.log('Server-side access check failed:', response.status);
        }
      } catch (fetchError) {
        console.log('Error calling server-side access check:', fetchError);
      }
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
      successMsg.textContent = `Login successful! You have ${accessType === 'whitelist' ? 'free' : 'paid'} access. Redirecting...`;
      
      // Add a manual verification step before redirect
      console.log('Cookies set:', document.cookie);
      setTimeout(() => {
        console.log('Redirecting to paid content...');
        window.location.href = '/.netlify/functions/servePaidContentNew?page=Atlas';
      }, 1500);
    } else {
      console.log('No access found, redirecting to purchase');
      successMsg.textContent = 'Login successful! Please purchase access to view paid content.';
      
      // Add a button to manually test whitelist access
      successMsg.innerHTML += '<br><button onclick="testWhitelistAccess()" style="margin-top: 10px; padding: 8px 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">🔍 Debug Whitelist Access</button>';
      
      setTimeout(() => window.location.href = '/.netlify/functions/create-checkout-session', 3000);
    }
  } catch (err) {
    errorMsg.textContent = err.message;
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
    console.log('Direct UID check result:', whitelistDoc.exists);
    if (whitelistDoc.exists) {
      console.log('Whitelist data:', whitelistDoc.data());
      alert('✅ Found in whitelist by UID! Should have access.');
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