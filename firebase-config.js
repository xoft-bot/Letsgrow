import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBAQsYHIn8IfwOKzWf0whgWwFP3-YUQ3vQ",
  authDomain: "letsgrowinvestmentclub-26878.firebaseapp.com",
  projectId: "letsgrowinvestmentclub-26878",
  storageBucket: "letsgrowinvestmentclub-26878.firebasestorage.app",
  messagingSenderId: "209749782294",
  appId: "1:209749782294:web:069f8353e806da0d6a2a37",
  measurementId: "G-L3215N99KY"
};

const fbApp = initializeApp(firebaseConfig);
export const db   = getFirestore(fbApp);
export const auth = getAuth(fbApp);
