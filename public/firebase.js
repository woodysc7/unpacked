// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2-Ns0c-yTGIjmTcLOC5koCBiLFGHVs9I",
  authDomain: "unpacked-1b2b1.firebaseapp.com",
  projectId: "unpacked-1b2b1",
  storageBucket: "unpacked-1b2b1.firebasestorage.app",
  messagingSenderId: "59965033310",
  appId: "1:59965033310:web:ac0ed69b6f5727c0561dcf",
  measurementId: "G-8XX716E629"
};

// Initialize Firebase (v8 syntax for compatibility with your signup.html)
firebase.initializeApp(firebaseConfig);

// Export for use in other files if needed
window.firebase = firebase;
