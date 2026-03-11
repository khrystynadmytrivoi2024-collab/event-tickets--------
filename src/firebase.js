import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Додаємо для автентифікації [cite: 136, 143]

const firebaseConfig = {
  apiKey: "AIzaSyBE_T0bxUK3itKKKGP6ZXoYOX8nJCq10g8",
  authDomain: "event-tickets-5e625.firebaseapp.com",
  projectId: "event-tickets-5e625",
  storageBucket: "event-tickets-5e625.firebasestorage.app",
  messagingSenderId: "959565642887",
  appId: "1:959565642887:web:f2b0eee1e5242175024c22",
  measurementId: "G-107MZXYPGH"
};

// Ініціалізація Firebase [cite: 153]
const app = initializeApp(firebaseConfig);

// Експортуємо сервіси, щоб використовувати їх в App.js
export const auth = getAuth(app); 
