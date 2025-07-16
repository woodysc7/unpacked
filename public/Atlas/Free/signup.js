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
    
    // Check whitelist collection first (free access)
    try {
      const whitelistDoc = await db.collection('whitelist').doc(user.uid).get();
      console.log('Whitelist check - doc exists:', whitelistDoc.exists);
      if (whitelistDoc.exists) {
        console.log('Whitelist doc data:', whitelistDoc.data());
        hasAccess = true;
        accessType = 'whitelist';
      }
    } catch (error) {
      console.log('Error checking whitelist:', error);
    }
    
    // Check paid collection if not whitelisted
    if (!hasAccess) {
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
      }
    }
    
    // Check users collection paid field if not found elsewhere
    if (!hasAccess) {
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        console.log('Users check - doc exists:', userDoc.exists);
        if (userDoc.exists()) {
          console.log('Users doc data:', userDoc.data());
          if (userDoc.data().paid === true) {
            hasAccess = true;
            accessType = 'users_paid';
          }
        }
      } catch (error) {
        console.log('Error checking users collection:', error);
      }
    }
    
    console.log('Final access result:', hasAccess, accessType);
    
    if (hasAccess) {
      // Set authentication cookies for the Netlify function
      const token = await user.getIdToken();
      document.cookie = `authToken=${token}; path=/; secure; samesite=strict`;
      document.cookie = `userEmail=${encodeURIComponent(user.email)}; path=/; secure; samesite=strict`;
      
      successMsg.textContent = `Login successful! You have ${accessType === 'whitelist' ? 'free' : 'paid'} access. Redirecting...`;
      setTimeout(() => window.location.href = '/.netlify/functions/servePaidContentNew?page=Atlas', 1000);
    } else {
      successMsg.textContent = 'Login successful! Please purchase access to view paid content.';
      setTimeout(() => window.location.href = '/.netlify/functions/create-checkout-session', 1000);
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