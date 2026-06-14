// ============================================================
// KahaniRang — Homepage Auth Guard
// ============================================================
// - Redirects to login.html if no user is logged in
// - Shows the logged-in user's email in the nav bar
// - Wires up the logout button
// ============================================================

import { auth, onAuthStateChanged, logout } from "./auth.js";

const loadingScreen = document.getElementById("authLoading");
const userInfo = document.getElementById("userInfo");
const userEmailEl = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Not logged in -> send to login page
    window.location.href = "login.html";
    return;
  }

  // Logged in -> show user email and reveal the page
  userEmailEl.textContent = user.email;
  userInfo.style.display = "flex";

  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    logout();
  });
}
