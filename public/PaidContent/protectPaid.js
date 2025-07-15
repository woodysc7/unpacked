// ProtectPaid.js
// This script protects premium content by checking if the user is a paying member
// OR is whitelisted in the Firestore 'whitelist' collection.

// Make sure your firebase.js exports initialized 'auth' and 'db' (Firestore) objects.
import { auth, db } from '../firebase.js';
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function redirectToLogin() {
  window.location.href = "/signup ";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    redirectToLogin();
    return;
  }

  // 1. Check if user is whitelisted
  const whitelistDoc = await getDoc(doc(db, "whitelist", user.uid));
  if (whitelistDoc.exists()) {
    // User is whitelisted, allow access
    localStorage.setItem("isPaid", "1");
    return;
  }

  // 2. Check if user is marked as paid in your users collection
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists() && userDoc.data().paid) {
    localStorage.setItem("isPaid", "1");
    return; // Allow access
  }

  // 3. Not whitelisted and not paid
  alert("You must be a paying member to view this content.");
  redirectToLogin();
});