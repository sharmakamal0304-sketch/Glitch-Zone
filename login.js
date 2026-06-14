// ============================================================
// KahaniRang — Login Page Logic
// ============================================================

import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  friendlyAuthError
} from "./auth.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("errorMsg");
const submitBtn = document.getElementById("loginBtn");

// If the user is already logged in, send them to the homepage.
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "index.html";
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  errorBox.classList.remove("show");
  errorBox.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      // onAuthStateChanged above will handle the redirect,
      // but redirect immediately for a snappier experience.
      window.location.href = "index.html";
    })
    .catch((error) => {
      errorBox.textContent = friendlyAuthError(error);
      errorBox.classList.add("show");
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    });
});
