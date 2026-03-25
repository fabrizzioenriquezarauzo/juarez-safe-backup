// ====================================================
// CONFIGURACIÓN DE FIREBASE - J&A Safework
// Proyecto: ja-safework | Plan: Spark (Gratuito)
// ====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyB5dxEnF5nr0ZZ7QgAh1frUlJeo7eZdmKQ",
    authDomain: "ja-safework.firebaseapp.com",
    projectId: "ja-safework",
    storageBucket: "ja-safework.firebasestorage.app",
    messagingSenderId: "597377853665",
    appId: "1:597377853665:web:0956f36a66e7b41005efa0",
    measurementId: "G-0SBB07N4R8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios que usaremos en la app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
