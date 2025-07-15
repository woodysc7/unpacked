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
    
    // Check if user has paid status
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists() && userDoc.data().paid) {
      successMsg.textContent = 'Login successful! Redirecting to paid content...';
      setTimeout(() => window.location.href = '/.netlify/functions/servePaidContent?page=Atlas', 1000);
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