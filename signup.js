// ============================================================
// KahaniRang — Signup Page Logic
// ============================================================

import {
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  friendlyAuthError
} from "./auth.js";

const form = document.getElementById("signupForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const ageCheckbox = document.getElementById("ageConfirm");
const errorBox = document.getElementById("errorMsg");
const submitBtn = document.getElementById("signupBtn");

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

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!ageCheckbox.checked) {
    errorBox.textContent = "You must confirm you are 18 years or older.";
    errorBox.classList.add("show");
    return;
  }

  if (password.length < 6) {
    errorBox.textContent = "Password should be at least 6 characters.";
    errorBox.classList.add("show");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Save the display name on the new user's profile (optional)
      if (name) {
        return updateProfile(userCredential.user, { displayName: name });
      }
    })
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      errorBox.textContent = friendlyAuthError(error);
      errorBox.classList.add("show");
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    });
});
