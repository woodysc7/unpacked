import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
    await signInWithEmailAndPassword(auth, email, password);
    successMsg.textContent = 'Login successful! Redirecting...';
    setTimeout(() => window.location.href = '/Paid/paid.html', 1000);
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user record in Firestore (mark as not paid yet)
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email,
      paid: false,
      createdAt: new Date()
    });
    successMsg.textContent = 'Sign up successful! Please log in.';
  } catch (err) {
    errorMsg.textContent = err.message;
  }
};