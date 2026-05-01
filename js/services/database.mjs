// SERVICIO DE BASE DE DATOS (Firestore)
// ====================================================
import { db, storage } from './firebase.js';
import {
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    GeoPoint
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ==========================================
// 1. Datos Demo (Eliminados para Producción)
// ==========================================
const MOCK_PROFESSIONALS = [];

/**
 * Obtiene la lista de profesionales.
 * Carga exclusivamente datos reales de Firestore.
 */
export const getProfessionals = async (filter = 'all') => {
    try {
        const usersRef = collection(db, "users");
        const profQuery = query(usersRef, where("userType", "==", "professional"));
        const querySnapshot = await getDocs(profQuery);

        if (!querySnapshot.empty) {
            let professionals = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                professionals.push({
                    id: doc.id,
                    ...data,
                    location: {
                        lat: data.lat ?? data.location?.lat ?? data.location?.latitude ?? null,
                        lng: data.lng ?? data.location?.lng ?? data.location?.longitude ?? null
                    }
                });
            });

            // ÚNICO criterio: que el admin haya aprobado al profesional
            // No se verifica documentos aquí — el admin ya los revisó al aprobar
            professionals = professionals.filter(p => {
                const name = (p.name || '').toLowerCase();
                const comp = (p.companyName || '').toLowerCase();
                if (name.includes('prueba') || comp.includes('prueba')) return false;
                return p.validationStatus === 'aprobada';
            });

            // Filtro de búsqueda/categoría
            if (filter.startsWith('search:')) {
                const term = filter.split(':')[1].toLowerCase();
                professionals = professionals.filter(p => p.name.toLowerCase().includes(term));
            } else if (filter !== 'all') {
                const filterLower = filter.toLowerCase();
                const categoryKeywords = {
                    'prevencion': ['prevencionis', 'prevenci\u00f3n', 'ssoma', 'sst', 'seguridad', 'higiene'],
                    'electricidad': ['el\u00e9ctric', 'electric', 'electricista'],
                    'drywall': ['drywall', 'tabique', 'construc'],
                    'hogar': ['ama de casa', 'hogar', 'limpieza', 'dom\u00e9stico', 'domes']
                };
                const keywords = categoryKeywords[filterLower] || [filterLower];
                professionals = professionals.filter(p => {
                    const spec = (p.specialty || '').toLowerCase();
                    return keywords.some(kw => spec.includes(kw));
                });
            }

            console.log(`✅ Aprobados cargados desde Firestore: ${professionals.length}`);
            return professionals;
        } else {
            console.warn("⚠️ Firestore no devolvió datos.");
            return [];
        }
    } catch (error) {
        console.error("❌ Error al obtener datos Firebase:", error.code || error.message);
        return [];
    }
};

/**
 * Escucha en tiempo real a todos los profesionales que están ONLINE.
 */
export const listenForAllOnlineProfessionals = (callback) => {
    console.log("📡 [Firebase] Escuchando profesionales ONLINE y APROBADOS...");
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("userType", "==", "professional"), where("isOnline", "==", true));

    return onSnapshot(q, (snapshot) => {
        const professionals = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const p = { id: docSnap.id, ...data };

            // ÚNICO criterio: aprobado por el admin y no es cuenta de prueba
            const name = (p.name || '').toLowerCase();
            const comp = (p.companyName || '').toLowerCase();
            const isTest = name.includes('prueba') || comp.includes('prueba');

            if (!isTest && p.validationStatus === 'aprobada') {
                professionals.push({
                    ...p,
                    location: p.location || { lat: p.lat, lng: p.lng }
                });
            }
        });
        callback(professionals);
    }, (error) => {
        console.error("❌ Error en onSnapshot de profesionales online:", error);
    });
};

/**
 * Obtiene el perfil completo de un profesional por su ID.
 */
export const getProfessionalById = async (id) => {
    try {
        const docRef = doc(db, "professionals", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
    } catch (error) {
        // Fallback a datos mock
    }
    return MOCK_PROFESSIONALS.find(p => p.id === id) || null;
};

/**
 * Escucha en tiempo real a TODOS los profesionales aprobados.
 * Actualiza la lista del panel principal automáticamente cuando el admin aprueba uno nuevo.
 */
export const listenForApprovedProfessionals = (callback) => {
    console.log('📡 [Firebase] Escuchando profesionales APROBADOS en tiempo real...');
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("userType", "==", "professional"), where("validationStatus", "==", "aprobada"));
    return onSnapshot(q, (snapshot) => {
        const professionals = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const name = (data.name || '').toLowerCase();
            const comp = (data.companyName || '').toLowerCase();
            if (!name.includes('prueba') && !comp.includes('prueba')) {
                professionals.push({
                    id: docSnap.id,
                    ...data,
                    location: {
                        lat: data.lat ?? data.location?.lat ?? data.location?.latitude ?? null,
                        lng: data.lng ?? data.location?.lng ?? data.location?.longitude ?? null
                    }
                });
            }
        });
        console.log(`✅ [Real-time] ${professionals.length} profesionales aprobados.`);
        callback(professionals);
    }, (error) => {
        console.error('❌ Error en listener de aprobados:', error);
    });
};

/**
 * Actualiza el perfil de un profesional y lo hace visible en el mapa.
 */
export const updateProfessionalProfile = async (uid, data) => {
    try {
        // 1. Actualizar datos en la colección 'users'
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });

        // 2. Si es profesional, actualizar/crear en la colección 'professionals' para que aparezca en el mapa
        const profRef = doc(db, "professionals", uid);
        await setDoc(profRef, {
            ...data,
            id: uid, // Mantener el mismo ID para fácil vinculación
            updatedAt: serverTimestamp()
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Guarda la ubicación GPS de una empresa en Firestore.
 */
export const updateCompanyLocation = async (uid, lat, lng, companyName) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            lat, lng,
            location: { lat, lng },
            companyName: companyName || '',
            lastSeen: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.warn("No se pudo guardar ubicación de empresa:", error.message);
        return { success: false };
    }
};

/**
 * Obtiene todas las empresas (userType = 'client') con su ubicación GPS.
 */
export const getCompanies = async () => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("userType", "==", "client"));
        const snapshot = await getDocs(q);
        const companies = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            companies.push({
                id: docSnap.id,
                name: data.companyName || data.name || 'Empresa',
                lat: data.lat ?? data.location?.lat ?? null,
                lng: data.lng ?? data.location?.lng ?? null,
                email: data.email || '',
                ruc: data.ruc || ''
            });
        });
        return companies.filter(c => c.lat !== null && c.lng !== null);
    } catch (error) {
        console.warn("No se pudieron cargar empresas:", error.message);
        return [];
    }
};

/**
 * Escucha en tiempo real a todas las empresas (userType = 'client').
 */
export const listenForAllCompanies = (callback) => {
    console.log("📡 [Firebase] Escuchando todas las empresas...");
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("userType", "==", "client"));

    return onSnapshot(q, (snapshot) => {
        const companies = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const lat = data.lat ?? data.location?.lat ?? null;
            const lng = data.lng ?? data.location?.lng ?? null;

            if (lat !== null && lng !== null) {
                companies.push({
                    id: docSnap.id,
                    name: data.companyName || data.name || 'Empresa',
                    lat, lng,
                    email: data.email || '',
                    ruc: data.ruc || ''
                });
            }
        });
        callback(companies);
    }, (error) => {
        console.error("❌ Error en onSnapshot de empresas:", error);
    });
};

/**
 * Escucha las solicitudes de servicio en tiempo real para un profesional específico.
 */
export const listenForServiceRequests = (profId, callback) => {
    console.log("📡 [Firebase] Escuchando solicitudes para el profesional ID:", profId);
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
        requestsRef,
        where("professionalId", "==", profId),
        where("status", "==", "pending")
    );

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        // Ordenar localmente para evitar requerir índice compuesto en Firebase por ahora
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("❌ Error en onSnapshot de solicitudes:", error);
    });
};

/**
 * Helper to update ALL pending payments with bank credentials
 */
export const requestGlobalWithdrawal = async (profId, bankData) => {
    try {
        const requestsRef = collection(db, "serviceRequests");
        const q = query(
            requestsRef,
            where("professionalId", "==", profId),
            where("status", "==", "completed")
        );
        const querySnapshot = await getDocs(q);

        // Batch update all completed tickets (which correspond to unwithdrawn earnings)
        const updatePromises = [];
        querySnapshot.forEach((docSnap) => {
            // We just update the bank info on the ticket since Admin sees it there
            const docRef = doc(db, "serviceRequests", docSnap.id);
            updatePromises.push(updateDoc(docRef, { ...bankData, withdrawRequestedAt: serverTimestamp() }));
        });

        await Promise.all(updatePromises);

        // Podríamos también guardar el banco en el user profile
        const userRef = doc(db, "users", profId);
        await updateDoc(userRef, { lastBankInfo: bankData });

        return { success: true };
    } catch (error) {
        console.error("Error al procesar retiro global:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Actualiza el estado de una solicitud de servicio (accepted, rejected, completed).
 */
export const updateServiceRequestStatus = async (requestId, status, additionalData = {}) => {
    try {
        const docRef = doc(db, "serviceRequests", requestId);
        await updateDoc(docRef, {
            status: status,
            updatedAt: serverTimestamp(),
            ...additionalData
        });
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar solicitud:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Escucha las solicitudes de servicio en tiempo real para un cliente específico.
 */
export const listenForClientRequests = (clientId, callback) => {
    console.log("📡 [Firebase] Escuchando solicitudes para el cliente ID:", clientId);
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
        requestsRef,
        where("clientId", "==", clientId)
    );

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("❌ Error en onSnapshot de solicitudes de cliente:", error);
    });
};

/**
 * Obtiene los servicios aceptados para un profesional específico.
 */
export const getAcceptedServices = async (profId) => {
    try {
        const requestsRef = collection(db, "serviceRequests");
        const q = query(
            requestsRef,
            where("professionalId", "==", profId),
            where("status", "in", ["accepted", "payment_verifying", "approved"])
        );
        const querySnapshot = await getDocs(q);
        const services = [];
        querySnapshot.forEach((doc) => {
            services.push({ id: doc.id, ...doc.data() });
        });
        // Ordenar por fecha de creación descendente
        return services.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
        console.error("Error al obtener servicios aceptados:", error);
        return [];
    }
};

export const getProfessionalStats = async (profId) => {
    try {
        const requestsRef = collection(db, "serviceRequests");
        const q = query(requestsRef, where("professionalId", "==", profId));
        const querySnapshot = await getDocs(q);

        let totalEarnings = 0;
        let completedServices = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Solo cuentan servicios donde el pago ya fue aprobado por el admin o ya se completaron
            if (['approved', 'completed', 'paid_to_professional'].includes(data.status)) {
                // El profesional gana el 85% (el admin se queda con el 15% de comisión)
                const earnings = data.profEarnings || (Number(data.totalAmount || 0) * 0.85);
                totalEarnings += earnings;
                if (data.status === 'completed' || data.status === 'paid_to_professional') completedServices++;
            }
        });

        // Fetch user's withdrawals to deduct them from totalEarnings
        let totalWithdrawn = 0;
        try {
            const wQ = query(collection(db, "withdrawals"), where("professionalId", "==", profId));
            const wSnap = await getDocs(wQ);
            wSnap.forEach(d => {
                const wStatus = d.data().status;
                // Si está pendiente, aprobado, o depositado, SE DEBE RESTAR del saldo disponible para no retirar doble
                if (wStatus === 'pending' || wStatus === 'approved' || wStatus === 'deposited') {
                    totalWithdrawn += parseFloat(d.data().amount || 0);
                }
            });
        } catch (e) {
            console.warn("No se pudieron cargar los retiros al calcular estadísticas", e);
        }

        const netEarnings = Math.max(0, totalEarnings - totalWithdrawn);
        return { totalEarnings: netEarnings, completedServices };
    } catch (error) {
        return { totalEarnings: 0, completedServices: 0 };
    }
};

/**
 * =====================================
 * GESTION DE RETIROS (WITHDRAWALS)
 * =====================================
 */

/**
 * Crea una nueva solicitud de retiro
 */
export const requestWithdrawal = async (profId, profName, bankData, amount) => {
    try {
        const withdrawalsRef = collection(db, "withdrawals");
        await addDoc(withdrawalsRef, {
            professionalId: profId,
            professionalName: profName,
            bank: bankData.withdrawalBank,
            account: bankData.withdrawalAccount,
            titular: bankData.withdrawalName,
            amount: parseFloat(amount),
            status: 'pending', // 'pending' -> 'deposited'
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (err) {
        console.error("Error al solicitar retiro:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Obtiene el historial de retiros de un profesional
 */
export const getProfessionalWithdrawals = async (profId) => {
    try {
        const withdrawalsRef = collection(db, "withdrawals");
        const q = query(withdrawalsRef, where("professionalId", "==", profId));
        const snap = await getDocs(q);
        const w = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        w.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        return w;
    } catch (err) {
        return [];
    }
};

/**
 * Obtiene todos los retiros pendientes para el Panel Admin
 */
export const getPendingWithdrawals = async () => {
    try {
        const withdrawalsRef = collection(db, "withdrawals");
        const q = query(withdrawalsRef, where("status", "==", "pending"));
        const snap = await getDocs(q);
        const w = [];
        snap.docs.forEach(doc => {
            const data = doc.data();
            if (!data.titular?.toLowerCase().includes('prueba') && !data.professionalName?.toLowerCase().includes('prueba')) {
                w.push({ id: doc.id, ...data });
            }
        });
        w.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        return w;
    } catch (err) {
        return [];
    }
};

/**
 * Marca un retiro como depositado (Admin)
 */
export const approveWithdrawalRequest = async (withdrawalId) => {
    try {
        const docRef = doc(db, "withdrawals", withdrawalId);
        await updateDoc(docRef, {
            status: 'deposited',
            depositedAt: serverTimestamp()
        });
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

/**
 * Crea una solicitud de servicio en Firestore.
 */
export const createServiceRequest = async (requestData) => {
    try {
        const requestsRef = collection(db, "serviceRequests");
        const docRef = await addDoc(requestsRef, {
            ...requestData,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error al crear solicitud:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Sube un documento a Firebase Storage y retorna su URL de descarga.
 * onProgress: función opcional que recibe el % de avance (0-100)
 */
export const uploadDocument = async (uid, file, docType, onProgress = null) => {
    return new Promise((resolve) => {
        try {
            // Validar tamaño máximo: 15 MB
            const MAX_MB = 15;
            if (file.size > MAX_MB * 1024 * 1024) {
                resolve({ success: false, error: `El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)} MB). El máximo permitido es ${MAX_MB} MB. Por favor comprime el archivo e intenta de nuevo.` });
                return;
            }

            const fileExtension = file.name.split('.').pop();
            const storageRef = ref(storage, `documents/${uid}/${docType}_${Date.now()}.${fileExtension}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Timeout generoso: 3 minutos para conexiones lentas
            const timeout = setTimeout(() => {
                uploadTask.cancel();
                resolve({ success: false, error: "El archivo tardó demasiado en subir. Verifica tu conexión a internet o intenta con un archivo más pequeño." });
            }, 180000);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`📊 ${docType} progress: ${progress.toFixed(0)}%`);
                    if (onProgress) onProgress(Math.round(progress));
                },
                (error) => {
                    clearTimeout(timeout);
                    let msg = error.message;
                    if (error.code === 'storage/canceled') msg = 'Subida cancelada. Inténtalo de nuevo.';
                    if (error.code === 'storage/quota-exceeded') msg = 'Espacio de almacenamiento lleno. Contacta al administrador.';
                    if (error.code === 'storage/unauthorized') msg = 'Sin permisos para subir. Contacta al administrador.';
                    resolve({ success: false, error: msg });
                },
                async () => {
                    clearTimeout(timeout);
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({ success: true, url: downloadURL });
                }
            );
        } catch (error) {
            resolve({ success: false, error: error.message });
        }
    });
};


/**
 * Sube un voucher de pago para una solicitud
 */
export const uploadPaymentVoucher = async (requestId, file) => {
    return new Promise((resolve) => {
        try {
            const storageRef = ref(storage, `vouchers/${requestId}/voucher_${Date.now()}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', null,
                (error) => resolve({ success: false, error: error.message }),
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const docRef = doc(db, "serviceRequests", requestId);
                    await updateDoc(docRef, {
                        voucherUrl: downloadURL,
                        status: 'payment_verifying',
                        updatedAt: serverTimestamp()
                    });
                    resolve({ success: true, url: downloadURL });
                }
            );
        } catch (error) {
            resolve({ success: false, error: error.message });
        }
    });
};

/**
 * Sube un voucher de pago realizado AL profesional (Pago de Admin -> Especialista)
 */
export const uploadProfessionalVoucher = async (requestId, file) => {
    return new Promise((resolve) => {
        try {
            const storageRef = ref(storage, `professional_vouchers/${requestId}/prof_voucher_${Date.now()}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', null,
                (error) => resolve({ success: false, error: error.message }),
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const docRef = doc(db, "serviceRequests", requestId);
                    await updateDoc(docRef, {
                        professionalVoucherUrl: downloadURL,
                        status: 'paid_to_professional',
                        isPaidToProfessional: true,
                        updatedAt: serverTimestamp()
                    });
                    resolve({ success: true, url: downloadURL });
                }
            );
        } catch (error) {
            resolve({ success: false, error: error.message });
        }
    });
};

/**
 * Escucha pagos pendientes para el Admin Dashboard
 */
export const listenForPendingPayments = (callback) => {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(requestsRef, where("status", "==", "payment_verifying"));

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const cName = data.clientName?.toLowerCase() || '';
            const pName = data.professionalName?.toLowerCase() || '';
            if (cName.includes('prueba') || pName.includes('prueba') || pName.includes('test')) {
                deleteDoc(docSnap.ref).catch(e => console.error("Error purging test", e));
            } else {
                requests.push({ id: docSnap.id, ...data });
            }
        });
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("❌ Error en onSnapshot de pagos:", error);
    });
};

/**
 * Aprueba un pago
 */
export const approvePayment = async (requestId, totalAmount) => {
    try {
        const docRef = doc(db, "serviceRequests", requestId);
        const commission = totalAmount * 0.15;
        const profEarnings = totalAmount * 0.85;

        await updateDoc(docRef, {
            status: 'approved',
            totalAmount: totalAmount,
            adminCommission: commission,
            profEarnings: profEarnings,
            days: totalAmount <= 140 ? 1 : Math.round(totalAmount / 140), // Estimación razonable de días
            profitCalculated: true,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error al aprobar pago:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Escucha servicios completados que esperan pago al profesional
 */
export const listenForCompletedServices = (callback) => {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(requestsRef, where("status", "==", "completed"));

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const cName = data.clientName?.toLowerCase() || '';
            const pName = data.professionalName?.toLowerCase() || '';
            if (cName.includes('prueba') || pName.includes('prueba') || pName.includes('test')) {
                deleteDoc(docSnap.ref).catch(e => console.error("Error purging test", e));
            } else {
                requests.push({ id: docSnap.id, ...data });
            }
        });
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("❌ Error en onSnapshot de completados:", error);
    });
};

/**
 * Escucha el historial de todos los servicios finalizados (completados y pagados) para el reporte de ganancias
 */
export const listenForFinishedHistory = (callback) => {
    const requestsRef = collection(db, "serviceRequests");
    // Listen to ALL requests and filter client-side to ensure we don't miss anything due to missing indices
    const q = query(requestsRef);

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            
            // Check status client-side: Incluimos 'approved' para que cuente como ganancia desde que se verifica el pago
            const isFinished = ['approved', 'completed', 'paid_to_professional'].includes(data.status);
            if (!isFinished) return;

            const cName = data.clientName?.toLowerCase() || '';
            const pName = data.professionalName?.toLowerCase() || '';
            if (cName.includes('prueba') || pName.includes('prueba') || pName.includes('test')) {
                // ignorar
            } else {
                requests.push({ id: docSnap.id, ...data });
            }
        });
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("❌ Error en onSnapshot de historial finalizado:", error);
    });
};

/**
 * Escucha el historial de RETIROS ya completados (depósitos realizados).
 */
export const listenForWithdrawalHistory = (callback) => {
    const withdrawalsRef = collection(db, "withdrawals");
    const q = query(withdrawalsRef, where("status", "==", "deposited"));

    return onSnapshot(q, (snapshot) => {
        const history = [];
        snapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() });
        });
        history.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(history);
    }, (error) => {
        console.error("❌ Error en onSnapshot de historial de retiros:", error);
    });
};

/**
 * Marca un servicio completado como pagado al profesional
 */
export const markServiceAsPaid = async (requestId) => {
    try {
        const docRef = doc(db, "serviceRequests", requestId);
        await updateDoc(docRef, {
            status: 'paid_to_professional',
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error al marcar como pagado:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Escucha TODAS las solicitudes pendientes (Radar para profesionales)
 */
export const listenForAllPendingRequests = (callback) => {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(requestsRef, where("status", "==", "pending"));

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.clientName?.toLowerCase().includes('prueba') && !data.professionalName?.toLowerCase().includes('prueba')) {
                requests.push({ id: doc.id, ...data });
            }
        });
        callback(requests);
    }, (error) => {
        console.error("❌ Error en Radar onSnapshot:", error);
    });
};

/**
 * Escucha los contratos en curso para el Panel Admin
 */
export const listenForOngoingContracts = (callback) => {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(requestsRef, where("status", "in", ["accepted", "payment_verifying", "approved"]));

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const cName = data.clientName?.toLowerCase() || '';
            const pName = data.professionalName?.toLowerCase() || '';
            if (!cName.includes('prueba') && !pName.includes('prueba')) {
                requests.push({ id: docSnap.id, ...data });
            }
        });
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("❌ Error en onSnapshot de contratos en curso:", error);
    });
};

/**
 * Obtiene todas las empresas registradas para el Panel Admin
 */
export const getCompaniesForAdmin = async () => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("userType", "==", "client"));
        const snapshot = await getDocs(q);
        const companies = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const name = (data.companyName || data.name || '').toLowerCase();
            if (!name.includes('prueba')) {
                companies.push({ id: docSnap.id, ...data });
            }
        });
        return companies.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
        console.error("Error loading companies for admin:", error);
        return [];
    }
};

/**
 * Actualiza el estado de validación de una empresa.
 */
export const updateCompanyValidationStatus = async (uid, status) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            validationStatus: status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating company validation status:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Elimina el documento de una empresa de la base de datos de usuarios.
 * (Nota: No elimina al usuario de Firebase Auth, pero oculta la empresa de la vista del sistema).
 */
export const deleteCompanyDocument = async (uid) => {
    try {
        const userRef = doc(db, "users", uid);
        await deleteDoc(userRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting company document:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Obtiene todos los profesionales (userType = 'professional') para validación en el Admin Dashboard.
 */
export const getProfessionalsForAdmin = async () => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("userType", "==", "professional"));
        const snapshot = await getDocs(q);
        const professionals = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // El admin ve a TODOS los profesionales, con o sin documentos completos
            // Solo se excluyen cuentas de prueba
            const name = (data.name || '').toLowerCase();
            const comp = (data.companyName || '').toLowerCase();
            if (!name.includes('prueba') && !comp.includes('prueba')) {
                professionals.push({ id: docSnap.id, ...data });
            }
        });
        return professionals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
        console.error("Error loading professionals for admin:", error);
        return [];
    }
};

/**
 * Actualiza el estado de validación de un profesional.
 */
export const updateProfessionalStatus = async (uid, status, reason = null) => {
    try {
        const userRef = doc(db, "users", uid);
        const updateData = {
            validationStatus: status,
            updatedAt: serverTimestamp()
        };

        if (reason !== null) {
            updateData.validationReason = reason;
        }

        await updateDoc(userRef, updateData);

        // También actualizar el documento público en `professionals`
        const profRef = doc(db, "professionals", uid);
        await updateDoc(profRef, updateData);

        return { success: true };
    } catch (error) {
        console.error("Error updating professional validation status:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Añadir una nueva reseña al especialista
 */
export const addReview = async (profId, clientId, clientName, rating, comment, reqId) => {
    try {
        await addDoc(collection(db, "reviews"), {
            professionalId: profId,
            clientId: clientId,
            clientName: clientName,
            rating: Number(rating),
            comment: comment,
            serviceRequestId: reqId,
            createdAt: serverTimestamp()
        });

        // Recalcular el promedio de estrellas
        const q = query(collection(db, "reviews"), where("professionalId", "==", profId));
        const snap = await getDocs(q);

        let sum = 0;
        snap.forEach(doc => { sum += Number(doc.data().rating); });
        const avg = sum / snap.size;

        const newRating = Number(avg.toFixed(1));

        // Update professional rating
        try { await updateDoc(doc(db, "professionals", profId), { rating: newRating }); } catch (e) { }
        try { await updateDoc(doc(db, "users", profId), { rating: newRating }); } catch (e) { }

        // Mark request as reviewed
        if (reqId) {
            try { await updateDoc(doc(db, "service_requests", reqId), { hasReview: true }); } catch (e) { }
        }

        return { success: true };
    } catch (err) {
        console.error("Error adding review: ", err);
        return { success: false, error: err.message };
    }
};

/**
 * Obtener reseñas de un especialista
 */
export const getReviews = async (profId) => {
    try {
        const q = query(collection(db, "reviews"), where("professionalId", "==", profId));
        const snap = await getDocs(q);
        const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort manually to avoid Firestore missing composite index errors
        reviews.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        return reviews;
    } catch (err) {
        console.error("Error getting reviews: ", err);
        return [];
    }
};

/**
 * =====================================
 * REAL-TIME CHAT SUBSYSTEM
 * =====================================
 */

/**
 * Enviar un mensaje a una sala de chat específica
 * @param {string} reqId ID de la solicitud (funciona como Sala de Chat)
 * @param {string} senderId ID de quien lo envía (UID)
 * @param {string} senderType 'client' o 'professional'
 * @param {string} text El mensaje
 */
export const sendMessage = async (reqId, senderId, senderType, text) => {
    try {
        const messagesRef = collection(db, "service_requests", reqId, "messages");
        await addDoc(messagesRef, {
            text: text,
            senderId: senderId,
            senderType: senderType,
            timestamp: serverTimestamp()
        });
        return true;
    } catch (err) {
        console.error("Error sending message: ", err);
        return false;
    }
};

/**
 * Escuchar una sala de chat en tiempo real
 * @param {string} reqId ID de la solicitud
 * @param {function} callback Función que recibe la lista de mensajes actualizada
 * @returns {function} Unsubscribe handler (Para apagar el chat al cerrar la ventana)
 */
export const listenToChat = (reqId, callback) => {
    const q = query(collection(db, "service_requests", reqId, "messages"), orderBy("timestamp", "asc"));

    // onSnapshot activa el callback CADA VEZ que alguien envía un mensaje nuevo
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Manejar mensajes locales cuyo timestamp aún no llegó del servidor
        messages.forEach(m => {
            if (!m.timestamp) m.timestamp = { toMillis: () => Date.now() };
        });

        callback(messages);
    }, (error) => {
        console.error("Error listening to chat: ", error);
        callback([]); // Retornar vacío si falla indexación o permisos
    });

    return unsubscribe;
};

// Re-exportar datos mock
export const MOCK_DB = MOCK_PROFESSIONALS;

/**
 * Obtiene los días ocupados de un profesional
 */
export const getProfessionalOccupiedDates = async (professionalId) => {
    try {
        const requestsRef = collection(db, "serviceRequests");
        const q = query(requestsRef, where("professionalId", "==", professionalId));
        const snapshot = await getDocs(q);
        
        const occupiedDates = {}; // formato: { 'YYYY-MM-DD': { clientName: '...' } }
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Ignorar solo solicitudes rechazadas o canceladas (pending, accepted, ongoing bloquean el día)
            if (['rejected', 'cancelled', 'failed'].includes(data.status)) return;
            
            if (data.selectedDays && Array.isArray(data.selectedDays)) {
                data.selectedDays.forEach(day => {
                    occupiedDates[day] = {
                        clientName: data.clientName || 'Empresa Privada',
                        status: data.status
                    };
                });
            }
        });
        
        return occupiedDates;
    } catch (error) {
        console.error("Error al obtener fechas ocupadas:", error);
        return {};
    }
};

/**
 * Elimina permanentemente una solicitud de servicio (usado por admin para limpiar pruebas)
 */
export const deleteServiceRequest = async (requestId) => {
    try {
        const docRef = doc(db, "serviceRequests", requestId);
        await deleteDoc(docRef);
        console.log(`Solicitud ${requestId} eliminada con éxito.`);
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar la solicitud:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Elimina un registro del historial de retiros
 */
export const deleteWithdrawalRecord = async (withdrawalId) => {
    try {
        const docRef = doc(db, "withdrawals", withdrawalId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar el retiro:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Actualiza campos específicos de una solicitud
 */
export const updateServiceRequestFields = async (requestId, fields) => {
    try {
        const docRef = doc(db, "serviceRequests", requestId);
        await updateDoc(docRef, fields);
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar campos:", error);
        return { success: false, error: error.message };
    }
};
