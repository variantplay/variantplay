// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDw0ONcCCYxf7ARNGT656VPUNbcm8LqOYU",
  authDomain: "variant-play.firebaseapp.com",
  projectId: "variant-play",
  storageBucket: "variant-play.firebasestorage.app",
  messagingSenderId: "359529468135",
  appId: "1:359529468135:web:f6c3fa094200c44ad69242",
  measurementId: "G-81Y6ZBJTYM"
};

// Initialize Firebase using the Compat syntax (global firebase object)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Make them available globally so other scripts can use them without modules
window.auth = auth;
window.db = db;