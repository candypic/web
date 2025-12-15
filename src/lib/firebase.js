import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEgzrJvL-AZtTSWq4STQs9WBaI5YwVass",
  authDomain: "candypic-62248.firebaseapp.com",
  projectId: "candypic-62248",
  storageBucket: "candypic-62248.firebasestorage.app",
  messagingSenderId: "644765402718",
  appId: "1:644765402718:web:e884b7380c5bf165ab16cf",
  measurementId: "G-8H49XB5XM7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Function to ask user for permission and get their unique ID
export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        // ⚠️ IMPORTANT: You need to generate this in Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration
        vapidKey: 'BJmN3PaIqEB7WWVHz-QcAxVcC1vU8a9lNl0JYqHBhCT6Hi35mbFVoEbZgRUIVbs116Eeei69Iri49Ie2a-W6Ess' 
      });
      return token;
    } else {
      alert("Notifications blocked. Please enable them in browser settings.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
    return null;
  }
};