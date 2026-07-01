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
                // El profesional gana el 100% (cero comisiones)
                const earnings = data.profEarnings !== undefined ? data.profEarnings : Number(data.totalAmount || 0);
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
        const commission = 0;
        const profEarnings = totalAmount;

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
 * Actualiza el estado de membresía de una empresa.
 */
export const updateCompanyMembershipStatus = async (uid, status) => {
    try {
        const userRef = doc(db, "users", uid);
        const updateData = {
            membershipStatus: status,
            updatedAt: serverTimestamp()
        };
        if (status === 'active') {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            updateData.membershipExpiry = expiry.toISOString();
        }
        await updateDoc(userRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating company membership status:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Sube voucher de membresía de empresa.
 */
export const uploadMembershipVoucher = async (uid, file) => {
    return new Promise((resolve) => {
        try {
            const storageRef = ref(storage, `memberships/${uid}/voucher_${Date.now()}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', null,
                (error) => resolve({ success: false, error: error.message }),
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        const paymentsRef = collection(db, "membershipPayments");
                        await addDoc(paymentsRef, {
                            companyId: uid,
                            voucherUrl: downloadURL,
                            status: 'pending',
                            createdAt: serverTimestamp()
                        });
                        
                        const userRef = doc(db, "users", uid);
                        await updateDoc(userRef, {
                            membershipStatus: 'verifying',
                            updatedAt: serverTimestamp()
                        });
                        
                        resolve({ success: true, url: downloadURL });
                    } catch (err) {
                        resolve({ success: false, error: err.message });
                    }
                }
            );
        } catch (error) {
            resolve({ success: false, error: error.message });
        }
    });
};

/**
 * Escucha pagos de membresía pendientes para el admin
 */
export const listenForPendingMemberships = (callback) => {
    const q = query(collection(db, "membershipPayments"), where("status", "==", "pending"));
    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((docSnap) => {
            requests.push({ id: docSnap.id, ...docSnap.data() });
        });
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("Error en onSnapshot de memberships:", error);
    });
};

/**
 * Aprueba el pago de una membresía
 */
export const approveMembershipPayment = async (paymentId, companyId) => {
    try {
        const paymentRef = doc(db, "membershipPayments", paymentId);
        await updateDoc(paymentRef, {
            status: 'approved',
            updatedAt: serverTimestamp()
        });
        
        return await updateCompanyMembershipStatus(companyId, 'active');
    } catch (error) {
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
 * =====================================
 * MÓDULO DE CERTIFICADOS
 * =====================================
 */

/**
 * Genera un código único de certificado estilo CERT-YYYY-XXXXXX
 */
const generateUniqueCode = () => {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    return `CERT-${year}-${rand}`;
};

/**
 * Admin sube un certificado PDF y genera código único + QR.
 * @param {object} params - { userName, userDni, courseName, issueDate, expiryDate, file, adminId }
 */
export const uploadCertificatePDF = async ({ userName, userDni, courseName, issueDate, expiryDate, file, adminId, forceCode }) => {
    try {
        // Usar el código ya generado por el frontend (que ya tiene el QR incrustado)
        // o generar uno nuevo si no viene
        const uniqueCode = forceCode || generateUniqueCode();
        const fileName = `certificates/pdfs/${uniqueCode}.pdf`;
        const storageRef = ref(storage, fileName);

        // Subir PDF
        const uploadTask = uploadBytesResumable(storageRef, file);
        const pdfUrl = await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', null,
                (err) => reject(err),
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                }
            );
        });

        // Guardar en Firestore
        await addDoc(collection(db, 'certificates'), {
            uniqueCode,
            userName: userName || 'Sin nombre',
            userDni: userDni || '',
            courseName: courseName || 'Certificado General',
            pdfUrl,
            issueDate: issueDate || null,
            expiryDate: expiryDate || null,
            status: 'active',
            source: 'admin',
            issuedBy: adminId || 'admin',
            createdAt: serverTimestamp(),
        });

        return { success: true, uniqueCode, pdfUrl };
    } catch (error) {
        console.error('[uploadCertificatePDF] Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sube voucher de pago para certificado.
 */
export const uploadCertificateVoucher = async (uid, file, userName, userDni, courseName) => {
    return new Promise((resolve) => {
        try {
            const storageRef = ref(storage, `certificates/${uid}/voucher_${Date.now()}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', null,
                (error) => resolve({ success: false, error: error.message }),
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    const certsRef = collection(db, "certificates");
                    await addDoc(certsRef, {
                        userId: uid,
                        userName: userName || 'Usuario Desconocido',
                        userDni: userDni || 'No provisto',
                        courseName: courseName,
                        voucherUrl: downloadURL,
                        status: 'pending', // pending, active
                        uniqueCode: '', // Se genera al aprobar
                        createdAt: serverTimestamp()
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
 * Escucha solicitudes de certificados pendientes para el admin
 */
export const listenForPendingCertificates = (callback) => {
    const q = query(collection(db, "certificates"), where("status", "==", "pending"));
    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((docSnap) => {
            requests.push({ id: docSnap.id, ...docSnap.data() });
        });
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("Error en onSnapshot de certificates:", error);
    });
};

/**
 * Escucha todos los certificados activos (ya emitidos) para mostrar en el admin
 */
export const listenForIssuedCertificates = (callback) => {
    const q = query(collection(db, "certificates"), where("status", "==", "active"));
    return onSnapshot(q, (snapshot) => {
        const certs = [];
        snapshot.forEach((docSnap) => {
            certs.push({ id: docSnap.id, ...docSnap.data() });
        });
        certs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(certs);
    }, (error) => {
        console.error("Error en onSnapshot de issued certificates:", error);
    });
};


/**
 * Aprueba el pago de un certificado y genera el código único
 */
export const approveCertificate = async (certificateId) => {
    try {
        const certRef = doc(db, "certificates", certificateId);
        
        // Generar un código único simple (ej. CERT-2026-XYZ123)
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const year = new Date().getFullYear();
        const uniqueCode = `CERT-${year}-${randomString}`;
        
        await updateDoc(certRef, {
            status: 'active',
            uniqueCode: uniqueCode,
            issueDate: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        return { success: true, uniqueCode };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Busca un certificado por su código único o DNI
 */
export const searchCertificate = async (queryTerm) => {
    try {
        const certsRef = collection(db, "certificates");
        
        // Primero intentamos por uniqueCode
        const qCode = query(certsRef, where("uniqueCode", "==", queryTerm), where("status", "==", "active"));
        const snapshotCode = await getDocs(qCode);
        
        if (!snapshotCode.empty) {
            return { success: true, certificate: { id: snapshotCode.docs[0].id, ...snapshotCode.docs[0].data() } };
        }
        
        // Si no hay por código, intentamos por DNI
        const qDni = query(certsRef, where("userDni", "==", queryTerm), where("status", "==", "active"));
        const snapshotDni = await getDocs(qDni);
        
        if (!snapshotDni.empty) {
            // Retorna el más reciente si hay varios
            const sortedDocs = snapshotDni.docs.sort((a, b) => (b.data().issueDate?.seconds || 0) - (a.data().issueDate?.seconds || 0));
            return { success: true, certificate: { id: sortedDocs[0].id, ...sortedDocs[0].data() } };
        }
        
        return { success: false, error: 'Certificado no encontrado o no válido.' };
    } catch (error) {
        console.error("Error searching certificate:", error);
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

/**
 * Obtiene la lista de cursos de certificación y sus preguntas
 */
export const getCertificateCourses = async () => {
    try {
        const q = query(collection(db, "certificate_courses"));
        const snapshot = await getDocs(q);
        const courses = [];
        snapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, courses };
    } catch (error) {
        console.error("Error al obtener cursos:", error);
        return { success: false, error: error.message };
    }
};

export const onCertificateCoursesChanged = (callback) => {
    const q = query(collection(db, "certificate_courses"));
    return onSnapshot(q, (snapshot) => {
        const courses = [];
        snapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });
        callback(courses);
    }, (error) => {
        console.error("Error al escuchar courses:", error);
    });
};

export const addCertificateCourse = async (courseData) => {
    try {
        await addDoc(collection(db, "certificate_courses"), courseData);
        return { success: true };
    } catch (error) {
        console.error("Error al agregar curso:", error);
        return { success: false, error: error.message };
    }
};

export const updateCertificateCourse = async (courseId, courseData) => {
    try {
        const docRef = doc(db, "certificate_courses", courseId);
        await updateDoc(docRef, courseData);
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar curso:", error);
        return { success: false, error: error.message };
    }
};

export const deleteCertificateCourse = async (courseId) => {
    try {
        const docRef = doc(db, "certificate_courses", courseId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar curso:", error);
        return { success: false, error: error.message };
    }
};


/**
 * Siembra los cursos iniciales en la base de datos (Ejecutar solo una vez)
 */
export const seedCertificateCourses = async () => {
    const initialCourses = [
        { 
            name: "Prevención de Riesgos Laborales", 
            icon: "fa-shield-halved", 
            isActive: true,
            questions: [
                {
                    text: "¿Qué significan las siglas IPERC?",
                    options: [
                        { id: "A", text: "Identificación de Peligros, Evaluación de Riesgos y Controles" },
                        { id: "B", text: "Índice de Prevención y Evaluación de Riesgos Comunes" },
                        { id: "C", text: "Investigación de Peligros en Riesgos de Construcción" }
                    ],
                    correctOption: "A"
                },
                {
                    text: "¿Cuál es el orden de la Jerarquía de Controles?",
                    options: [
                        { id: "A", text: "EPP, Administrativo, Ingeniería, Sustitución, Eliminación" },
                        { id: "B", text: "Eliminación, Sustitución, Ingeniería, Administrativo, EPP" },
                        { id: "C", text: "Ingeniería, Eliminación, EPP, Administrativo, Sustitución" }
                    ],
                    correctOption: "B"
                },
                {
                    text: "¿Qué es un incidente de trabajo?",
                    options: [
                        { id: "A", text: "Suceso con potencial de pérdida que pudo ser accidente" },
                        { id: "B", text: "Una lesión grave en el área de trabajo" },
                        { id: "C", text: "Un permiso de trabajo no autorizado" }
                    ],
                    correctOption: "A"
                }
            ]
        },
        { 
            name: "Trabajos en Altura", 
            icon: "fa-person-arrow-up-from-line", 
            isActive: true,
            questions: [
                {
                    text: "¿A partir de qué altura se considera trabajo en altura en Perú (Norma G.050)?",
                    options: [
                        { id: "A", text: "1.20 metros" },
                        { id: "B", text: "1.50 metros" },
                        { id: "C", text: "1.80 metros" }
                    ],
                    correctOption: "C"
                },
                {
                    text: "¿Cuál es el punto de anclaje mínimo requerido para el arnés?",
                    options: [
                        { id: "A", text: "Soportar 1000 lbs (450 kg)" },
                        { id: "B", text: "Soportar 5000 lbs (2268 kg) por trabajador" },
                        { id: "C", text: "Cualquier estructura firme" }
                    ],
                    correctOption: "B"
                },
                {
                    text: "En un sistema anticaídas, ¿qué componente absorbe la energía del impacto?",
                    options: [
                        { id: "A", text: "El absorbedor de impacto (shock absorber)" },
                        { id: "B", text: "El anillo D de la espalda" },
                        { id: "C", text: "La línea de vida horizontal" }
                    ],
                    correctOption: "A"
                }
            ]
        },
        { 
            name: "Trabajos en Caliente", 
            icon: "fa-fire", 
            isActive: true,
            questions: [
                {
                    text: "¿A qué distancia mínima deben alejarse los materiales combustibles de un trabajo en caliente?",
                    options: [
                        { id: "A", text: "5 metros" },
                        { id: "B", text: "11 metros" },
                        { id: "C", text: "20 metros" }
                    ],
                    correctOption: "B"
                },
                {
                    text: "¿Qué función cumple el vigía de fuego (Fire Watch)?",
                    options: [
                        { id: "A", text: "Supervisar el área durante y hasta 30-60 min después del trabajo" },
                        { id: "B", text: "Soldar las estructuras metálicas" },
                        { id: "C", text: "Solo firmar el permiso de trabajo" }
                    ],
                    correctOption: "A"
                },
                {
                    text: "¿Qué equipo portátil es obligatorio en todo trabajo en caliente?",
                    options: [
                        { id: "A", text: "Una manta térmica" },
                        { id: "B", text: "Un extintor operativo y adecuado" },
                        { id: "C", text: "Un detector de gases" }
                    ],
                    correctOption: "B"
                }
            ]
        },
        { 
            name: "Trabajos en Espacios Confinados", 
            icon: "fa-box-open", 
            isActive: true,
            questions: [
                {
                    text: "¿Cuál es el nivel aceptable de oxígeno en un espacio confinado?",
                    options: [
                        { id: "A", text: "15.5% - 18.0%" },
                        { id: "B", text: "19.5% - 23.5%" },
                        { id: "C", text: "25.0% - 30.0%" }
                    ],
                    correctOption: "B"
                },
                {
                    text: "¿Qué se debe realizar antes de ingresar a un espacio confinado?",
                    options: [
                        { id: "A", text: "Monitoreo de gases y purga/ventilación" },
                        { id: "B", text: "Ingresar rápidamente para ver si hay peligro" },
                        { id: "C", text: "Encender fuego para quemar gases tóxicos" }
                    ],
                    correctOption: "A"
                },
                {
                    text: "¿Quién no debe entrar al espacio confinado bajo ninguna circunstancia?",
                    options: [
                        { id: "A", text: "El trabajador entrante" },
                        { id: "B", text: "El vigía (Observador)" },
                        { id: "C", text: "El supervisor de turno" }
                    ],
                    correctOption: "B"
                }
            ]
        },
        { 
            name: "Primeros Auxilios Básicos", 
            icon: "fa-truck-medical", 
            isActive: true,
            questions: [
                {
                    text: "¿Cuál es el orden correcto de la regla nemotécnica PAS?",
                    options: [
                        { id: "A", text: "Prevenir, Alertar, Socorrer" },
                        { id: "B", text: "Proteger, Avisar, Socorrer" },
                        { id: "C", text: "Preguntar, Atender, Sanar" }
                    ],
                    correctOption: "B"
                },
                {
                    text: "En la técnica de RCP en adultos, ¿cuál es el ritmo de compresiones?",
                    options: [
                        { id: "A", text: "15 compresiones por 1 ventilación" },
                        { id: "B", text: "30 compresiones por 2 ventilaciones" },
                        { id: "C", text: "50 compresiones por 5 ventilaciones" }
                    ],
                    correctOption: "B"
                },
                {
                    text: "¿Qué se debe hacer ante una quemadura térmica leve?",
                    options: [
                        { id: "A", text: "Aplicar pasta dental de inmediato" },
                        { id: "B", text: "Enfriar la zona con agua tibia o a temperatura ambiente por 10-15 min" },
                        { id: "C", text: "Reventar las ampollas para evitar infección" }
                    ],
                    correctOption: "B"
                }
            ]
        },
        { 
            name: "Seguridad Eléctrica", 
            icon: "fa-bolt", 
            isActive: true,
            questions: [
                {
                    text: "¿Cuál es el primer paso de las 5 Reglas de Oro de la seguridad eléctrica?",
                    options: [
                        { id: "A", text: "Prevenir cualquier posible realimentación (Bloqueo/Etiquetado)" },
                        { id: "B", text: "Desconectar o corte visible de todas las fuentes de tensión" },
                        { id: "C", text: "Poner a tierra y en cortocircuito" }
                    ],
                    correctOption: "B"
                },
                {
                    text: "¿Qué es el sistema LOTO?",
                    options: [
                        { id: "A", text: "Lock Out Tag Out (Bloqueo y Etiquetado de energías peligrosas)" },
                        { id: "B", text: "Logistical Operations Testing (Pruebas Operativas Logísticas)" },
                        { id: "C", text: "Limitación de Tensión Oscilante" }
                    ],
                    correctOption: "A"
                },
                {
                    text: "Si una persona está recibiendo una descarga eléctrica, ¿qué debe hacer primero?",
                    options: [
                        { id: "A", text: "Empujarla con las manos para separarla" },
                        { id: "B", text: "Cortar el suministro de energía principal" },
                        { id: "C", text: "Lanzarle agua para enfriarla" }
                    ],
                    correctOption: "B"
                }
            ]
        }
    ];

    try {
        for (const course of initialCourses) {
            await addDoc(collection(db, "certificate_courses"), course);
        }
        console.log("Cursos y preguntas sembrados correctamente.");
        return { success: true };
    } catch (error) {
        console.error("Error al sembrar cursos:", error);
        return { success: false, error: error.message };
    }
};

export const createCertificateRecord = async ({ userName, userDni, courseName, issueDate, expiryDate, adminId, forceCode }) => {
    try {
        const uniqueCode = forceCode;
        await addDoc(collection(db, 'certificates'), {
            uniqueCode,
            userName: userName || 'Sin nombre',
            userDni: userDni || '',
            courseName: courseName || 'Certificado General',
            pdfUrl: null,
            issueDate: issueDate || null,
            expiryDate: expiryDate || null,
            status: 'active',
            source: 'admin',
            issuedBy: adminId || 'admin',
            createdAt: serverTimestamp(),
        });
        return { success: true, uniqueCode };
    } catch (error) {
        console.error('[createCertificateRecord] Error:', error);
        return { success: false, error: error.message };
    }
}

export const attachPDFToCertificate = async (docId, uniqueCode, file) => {
    try {
        const fileName = `certificates/pdfs/${uniqueCode}.pdf`;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);
        const pdfUrl = await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', null,
                (err) => reject(err),
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                }
            );
        });
        await updateDoc(doc(db, 'certificates', docId), { pdfUrl });
        return { success: true, pdfUrl };
    } catch(err) {
        console.error('[attachPDFToCertificate] Error:', err);
        return { success: false, error: err.message };
    }
}
