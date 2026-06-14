// ============================================================
// KahaniRang — Firebase Configuration
// ============================================================
//
// >>> PASTE YOUR FIREBASE CONFIG OBJECT BELOW <<<
//
// How to get this:
// 1. Go to https://console.firebase.google.com
// 2. Open your project (or create a new one — it's free)
// 3. Click the ⚙️ gear icon → "Project settings"
// 4. Scroll to "Your apps" → click the "</>" (Web) icon to register a web app
// 5. Firebase will show you a config object that looks like the one below
// 6. Copy YOUR values and replace the placeholders inside firebaseConfig
//
// Then also go to Build → Authentication → Sign-in method,
// and enable the "Email/Password" provider (this is free).
//
// ============================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export { firebaseConfig };
