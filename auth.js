// ============================================================
// KahaniRang — Firebase Init & Shared Auth Helpers
// ============================================================
// This file initializes Firebase using the config from
// firebase-config.js and exports the auth instance plus
// commonly used Firebase Auth functions.
//
// All three pages (index.html, login.html, signup.html)
// import from this single file so Firebase is only
// initialized once.
// ============================================================

import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Logs the current user out and redirects to login.html
 */
function logout() {
  return signOut(auth).then(() => {
    window.location.href = "login.html";
  });
}

/**
 * Converts Firebase Auth error codes into friendly messages.
 */
function friendlyAuthError(error) {
  const map = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/missing-password": "Please enter a password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your connection."
  };
  return map[error.code] || "Something went wrong. Please try again.";
}

export {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  logout,
  friendlyAuthError
};
