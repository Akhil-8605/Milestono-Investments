// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApG4x465_vZE0KdO5evZ6YukWeraKplfY",
  authDomain: "milestono-investments.firebaseapp.com",
  projectId: "milestono-investments",
  storageBucket: "milestono-investments.firebasestorage.app",
  messagingSenderId: "715684838743",
  appId: "1:715684838743:web:030ddd0ba940883df6d212",
  measurementId: "G-892EDWDR6G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);