// ====================================================
// SERVICIO DE AUTENTICACIÓN con Firebase Auth
// ====================================================
import { auth } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import { db } from './firebase.js';
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/**
 * Registra un nuevo usuario con email y contraseña.
 * Guarda información adicional en Firestore.
 */
export const registerUser = async (name, email, password, userType, documentation = null, companyData = null, specialty = '') => {
    try {
        // Interceptar cuenta admin principal
        if (email === 'admin@safework.com') {
            userType = 'admin';
            name = 'Administrador Principal';
        }

        // 1. Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Actualizar el nombre de pantalla
        await updateProfile(user, { displayName: name });

        // 3. Guardar información extendida en Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            userType: userType, // 'client' o 'professional'
            createdAt: serverTimestamp(),
            isOnline: false,
            documentation: documentation,
            validationStatus: userType === 'client' ? 'pending' : (userType === 'professional' ? 'pending' : 'aprobada'),
            // Datos de empresa si aplican
            ...(companyData && {
                ruc: companyData.ruc,
                companyName: companyData.companyName
            }),
            // Campos extra para profesionales
            ...(userType === 'professional' && {
                specialty: specialty,
                rate: 0,
                rating: 5.0,
                certifications: [],
                experience: '',
                location: null
            })
        });

        return { success: true, user };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
};

/**
 * Inicia sesión con email y contraseña.
 */
export const loginUser = async (email, password) => {
    try {
        let userCredential;
        try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (innerError) {
            // Auto-crear la cuenta de administrador si aún no existe en Firebase
            if (email === 'admin@safework.com' && (innerError.code === 'auth/invalid-credential' || innerError.code === 'auth/user-not-found' || innerError.code === 'auth/wrong-password')) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);

                const adminData = {
                    uid: userCredential.user.uid,
                    name: 'Administrador Principal',
                    email: email,
                    userType: 'admin'
                };
                await setDoc(doc(db, "users", userCredential.user.uid), adminData);
                return { success: true, user: userCredential.user, userData: adminData };
            } else {
                throw innerError;
            }
        }

        const user = userCredential.user;

        // Obtener datos del usuario desde Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));

        let userData = userDoc.exists() ? userDoc.data() : { userType: 'client' };

        // Forzar rol admin si es el correo principal, por si hubo algún problema al guardar
        if (email === 'admin@safework.com') {
            userData.userType = 'admin';
            userData.name = userData.name || 'Administrador Principal';
        }

        return { success: true, user, userData };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
};

/**
 * Cierra sesión del usuario actual.
 */
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Escucha los cambios de estado de autenticación.
 * Llama a callback(user) cuando el estado cambia.
 */
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Convierte los códigos de error de Firebase en mensajes en español.
 */
const getAuthErrorMessage = (code) => {
    const messages = {
        'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
        'auth/invalid-email': 'El correo electrónico no es válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
        'auth/wrong-password': 'Contraseña incorrecta. Intenta de nuevo.',
        'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
        'auth/network-request-failed': 'Sin conexión a internet. Verifica tu red.',
    };
    return messages[code] || 'Ocurrió un error inesperado. Intenta de nuevo.';
};
