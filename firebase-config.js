// =====================================================
// BADAM MILK - FIREBASE CONFIGURATION
// =====================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// Firebase Configuration
const firebaseConfig = {

    apiKey: "AIzaSyAOApQRF4SKWIMbVrROkPj3CC9TWBYlMng",

    authDomain: "badam-b3f26.firebaseapp.com",

    projectId: "badam-b3f26",

    storageBucket: "badam-b3f26.firebasestorage.app",

    messagingSenderId: "998397495743",

    appId: "1:998397495743:web:e1465e25e8a7241258390a",

    measurementId: "G-RLDW7WEZ8Z"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Firebase Authentication
const auth = getAuth(app);


// Firestore Database
const db = getFirestore(app);


// Export
export {
    app,
    auth,
    db
};