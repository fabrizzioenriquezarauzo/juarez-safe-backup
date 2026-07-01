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
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    GeoPoint
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Datos mock locales para usar mientras Firebase no está configurado
const MOCK_PROFESSIONALS = [
    {
        id: "p1",
        name: "Carlos Mendoza",
        specialty: "Tecnico",
        experience: "5 años Exp. en Construcción",
        rate: 125,
        rating: 4.8,
        certifications: ["Primeros Auxilios Avanzados", "Trabajos en Altura", "Manejo de Extintores"],
        img: "https://randomuser.me/api/portraits/men/32.jpg",
        location: { lat: -12.0970, lng: -77.0370 }
    },
    {
        id: "p2",
        name: "Diana Rojas",
        specialty: "Tecnico",
        experience: "3 años Exp. en Industria",
        rate: 125,
        rating: 4.9,
        certifications: ["Identificación de Peligros (IPERC)", "Evaluación de Riesgos", "Primeros Auxilios Básicos"],
        img: "https://randomuser.me/api/portraits/women/44.jpg",
        location: { lat: -12.1001, lng: -77.0315 }
    },
    {
        id: "p3",
        name: "Ing. Jorge Vasquez",
        specialty: "Universitario",
        experience: "8 años Exp. en Minería",
        rate: 180,
        rating: 5.0,
        certifications: ["Auditor Trinorma ISO", "Supervisión SSOMA", "Ing. de Seguridad Minera"],
        img: "https://randomuser.me/api/portraits/men/65.jpg",
        location: { lat: -12.1120, lng: -77.0350 }
    },
    {
        id: "p4",
        name: "Ing. Luis Garcia",
        specialty: "Ing Colegiado",
        experience: "12 años Exp. Múltiple",
        rate: 250,
        rating: 4.9,
        certifications: ["Colegiatura CIP Habilitada", "Maestría en Seguridad Industrial", "Especialista en SST"],
        img: "https://randomuser.me/api/portraits/men/85.jpg",
        location: { lat: -12.1220, lng: -77.0250 }
    }
];

/**
 * Obtiene la lista de profesionales.
 * Si Firebase está configurado, los carga de Firestore.
 * Si no, usa los datos mock (modo demo/desarrollo).
 */
export const getProfessionals = async (filter = 'all') => {
    try {
        // Cargar todos los profesionales desde Firestore
        const professionalsRef = collection(db, "professionals");
        const querySnapshot = await getDocs(professionalsRef);

        if (!querySnapshot.empty) {
            let professionals = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                professionals.push({
                    id: doc.id,
                    ...data,
                    // Manejar tanto campos planos (lat/lng) como GeoPoint o location object
                    location: {
                        lat: data.lat ?? data.location?.lat ?? data.location?.latitude ?? null,
                        lng: data.lng ?? data.location?.lng ?? data.location?.longitude ?? null
                    }
                });
            });

            // FILTRO DE SEGURIDAD: Solo aprobados (Recuperado del plan)
            professionals = professionals.filter(p => p.validationStatus === 'aprobada');

            // Filtro flexible del lado del cliente (case-insensitive, partial match)
            if (filter !== 'all') {
                const filterLower = filter.toLowerCase();
                // Mapa de categorías a palabras clave que pueden aparecer en specialty
                const categoryKeywords = {
                    'prevencion': ['prevenci', 'sst', 'seguridad', 'ssoma', 'higiene'],
                    'electricidad': ['electric', 'eléctric'],
                    'drywall': ['drywall', 'tabique', 'construc'],
                    'hogar': ['hogar', 'limpieza', 'ama de casa', 'doméstico', 'domes']
                };
                const keywords = categoryKeywords[filterLower] || [filterLower];
                professionals = professionals.filter(p => {
                    const spec = (p.specialty || '').toLowerCase();
                    return keywords.some(kw => spec.includes(kw));
                });
            }

            console.log(`✅ Datos cargados desde Firestore (${professionals.length} profesionales)`);
            return professionals;
        } else {
            console.warn("⚠️ Firestore vacío. Usando datos mock.");
            return MOCK_PROFESSIONALS.filter(p => filter === 'all' || p.specialty.toLowerCase().includes(filter.toLowerCase()));
        }
    } catch (error) {
        console.warn("ℹ️ Firebase no configurado aún. Usando datos de demostración:", error.code || error.message);
        return MOCK_PROFESSIONALS.filter(p => filter === 'all' || p.specialty.toLowerCase().includes(filter.toLowerCase()));
    }
};

/**
 * Escucha en tiempo real a todos los profesionales que están ONLINE.
 */
export const listenForAllOnlineProfessionals = (callback) => {
    console.log("📡 [Firebase] Escuchando todos los profesionales ONLINE (Y VALIDADOS)...");
    const profRef = collection(db, "professionals");
    const q = query(
        profRef, 
        where("isOnline", "==", true),
        where("validationStatus", "==", "aprobada")
    );

    return onSnapshot(q, (snapshot) => {
        const professionals = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            professionals.push({
                id: docSnap.id,
                ...data,
                location: data.location || { lat: data.lat, lng: data.lng }
            });
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
 * Actualiza el estado de una solicitud de servicio (accepted, rejected, completed).
 */
export const updateServiceRequestStatus = async (requestId, status) => {
    try {
        const docRef = doc(db, "serviceRequests", requestId);
        await updateDoc(docRef, {
            status: status,
            updatedAt: serverTimestamp()
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
            where("status", "==", "accepted")
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

/**
 * Obtiene las estadísticas de servicios para un profesional.
 */
export const getProfessionalStats = async (profId) => {
    try {
        const requestsRef = collection(db, "serviceRequests");
        const q = query(requestsRef, where("professionalId", "==", profId));
        const querySnapshot = await getDocs(q);

        let totalEarnings = 0;
        let completedServices = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Solo acreditar cuando el servicio esté COMPLETADO, no al aceptar
            if (data.status === 'completed' || data.status === 'paid_to_professional') {
                totalEarnings += data.profEarnings || (data.totalAmount * 0.85) || 0;
                completedServices++;
            }
        });

        return { totalEarnings, completedServices };
    } catch (error) {
        return { totalEarnings: 0, completedServices: 0 };
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
 */
export const uploadDocument = async (uid, file, docType) => {
    return new Promise((resolve) => {
        try {
            const fileExtension = file.name.split('.').pop();
            const storageRef = ref(storage, `documents/${uid}/${docType}_${Date.now()}.${fileExtension}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            const timeout = setTimeout(() => {
                uploadTask.cancel();
                resolve({ success: false, error: "Tiempo agotado (20s). Verifica tu conexión." });
            }, 20000);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`📊 ${docType} progress: ${progress.toFixed(0)}%`);
                },
                (error) => {
                    clearTimeout(timeout);
                    resolve({ success: false, error: error.message });
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
 * Escucha pagos pendientes para el Admin Dashboard
 */
export const listenForPendingPayments = (callback) => {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(requestsRef, where("status", "==", "payment_verifying"));

    return onSnapshot(q, (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
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
        const commission = totalAmount * 0.25;
        const profEarnings = totalAmount * 0.75;

        await updateDoc(docRef, {
            status: 'approved',
            adminCommission: commission,
            profEarnings: profEarnings,
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
        snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(requests);
    }, (error) => {
        console.error("❌ Error en onSnapshot de completados:", error);
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
            requests.push({ id: doc.id, ...doc.data() });
        });
        callback(requests);
    }, (error) => {
        console.error("❌ Error en Radar onSnapshot:", error);
    });
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
            professionals.push({ id: docSnap.id, ...docSnap.data() });
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
        const q = query(collection(db, "reviews"), where("professionalId", "==", profId), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error("Error getting reviews: ", err);
        // Sometimes missing index for orderBy createdAt. Return without order if error happens, but we'll return empty array for safety
        return [];
    }
};

// Re-exportar datos mock
export const MOCK_DB = MOCK_PROFESSIONALS;

// ============================================================
// FUNCIONES PARA EL PANEL DE ADMINISTRADOR
// ============================================================

/**
 * Escucha contratos en curso - prueba ambas colecciones y todos los estados posibles
 */
export const listenForOngoingContracts = (callback) => {
    let results = [];
    const activeStatuses = ["accepted", "in_progress", "ongoing", "active", "aceptado", "aprobado", "en_progreso", "approved"];
    
    // Intentar con colección serviceRequests (camelCase)
    const tryCollection = (colName) => {
        try {
            const q = query(collection(db, colName));
            return onSnapshot(q, (snap) => {
                const filtered = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(r => {
                        const s = (r.status || '').toLowerCase();
                        return s !== 'pending' && s !== 'finished' && s !== 'cancelled' && s !== 'rejected' && s !== 'completed' && s !== 'pagado' && s !== '';
                    });
                callback(filtered);
            }, (err) => { console.warn(colName + ' error:', err); callback([]); });
        } catch(e) { return null; }
    };
    
    // Probar serviceRequests primero, luego service_requests
    const unsub = tryCollection('serviceRequests') || tryCollection('service_requests');
    return unsub || (() => {});
};

/**
 * Escucha historial de trabajos finalizados - prueba ambas colecciones
 */
export const listenForFinishedHistory = (callback) => {
    const tryCollection = (colName) => {
        try {
            const q = query(collection(db, colName), where("status", "in", ["finished", "completed", "finalizado", "pagado"]));
            return onSnapshot(q, (snap) => {
                callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => { console.warn(colName + ' finished error:', err); callback([]); });
        } catch(e) { return null; }
    };
    return tryCollection('serviceRequests') || tryCollection('service_requests') || (() => {});
};

/**
 * Obtiene solicitudes de retiro pendientes
 */
export const getPendingWithdrawals = async () => {
    try {
        const q = query(collection(db, "withdrawals"), where("status", "==", "pending"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error("getPendingWithdrawals error:", err);
        return [];
    }
};

/**
 * Obtiene todas las empresas para el panel admin
 * En Firestore las empresas pueden ser userType='client', 'empresa', 'company' o 'Empresa'
 */
export const getCompaniesForAdmin = async () => {
    try {
        const snap = await getDocs(collection(db, "users"));
        const companies = [];
        snap.forEach(d => {
            const data = d.data();
            const type = (data.userType || data.role || '').toLowerCase();
            // Incluir: client, empresa, company, Empresa, y excluir: professional, admin
            const isNotProfOrAdmin = type !== 'professional' && type !== 'admin';
            const isCompanyLike = type === 'client' || type.includes('empr') || type.includes('comp');
            if (isCompanyLike && isNotProfOrAdmin) {
                companies.push({ id: d.id, ...data });
            }
        });
        console.log('[Admin] Empresas encontradas:', companies.length, companies.map(c => c.userType || c.role));
        return companies;
    } catch (err) {
        console.error("getCompaniesForAdmin error:", err);
        return [];
    }
};

/**
 * Actualiza el estado de una empresa
 */
export const updateCompanyStatus = async (companyId, status) => {
    try {
        await updateDoc(doc(db, "users", companyId), {
            validationStatus: status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (err) {
        console.error("updateCompanyStatus error:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Actualiza el estado de membresía de una empresa
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
    } catch (err) {
        console.error("updateCompanyMembershipStatus error:", err);
        return { success: false, error: err.message };
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
 * Marca un retiro como pagado
 */
export const markWithdrawalAsPaid = async (withdrawalId) => {
    try {
        await updateDoc(doc(db, "withdrawals", withdrawalId), {
            status: "paid",
            paidAt: serverTimestamp()
        });
        return { success: true };
    } catch (err) {
        console.error("markWithdrawalAsPaid error:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Elimina un registro de retiro
 */
export const deleteWithdrawalRecord = async (withdrawalId) => {
    try {
        const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");
        await deleteDoc(doc(db, "withdrawals", withdrawalId));
        return { success: true };
    } catch (err) {
        console.error("deleteWithdrawalRecord error:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Escucha historial de retiros
 */
export const listenForWithdrawalHistory = (callback) => {
    try {
        const q = query(collection(db, "withdrawals"), where("status", "==", "paid"));
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => { console.error("listenForWithdrawalHistory error:", err); callback([]); });
    } catch (err) {
        console.error("listenForWithdrawalHistory setup error:", err);
        callback([]);
        return () => {};
    }
};

/**
 * Sube un voucher de pago para un profesional
 */
export const uploadProfessionalVoucher = async (requestId, file) => {
    try {
        const storageRef = ref(storage, `vouchers/professional/${requestId}_${Date.now()}`);
        const snap = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snap.ref);
        await updateDoc(doc(db, "service_requests", requestId), {
            professionalVoucherUrl: url,
            professionalPaidAt: serverTimestamp()
        });
        return { success: true, url };
    } catch (err) {
        console.error("uploadProfessionalVoucher error:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Elimina un profesional de la base de datos
 */
export const deleteProfessional = async (profId) => {
    try {
        const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");
        await deleteDoc(doc(db, "professionals", profId));
        await deleteDoc(doc(db, "users", profId));
        return { success: true };
    } catch (err) {
        console.error("deleteProfessional error:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Elimina una solicitud de servicio
 */
export const deleteServiceRequest = async (requestId) => {
    try {
        const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");
        await deleteDoc(doc(db, "service_requests", requestId));
        return { success: true };
    } catch (err) {
        console.error("deleteServiceRequest error:", err);
        return { success: false, error: err.message };
    }
};

// ============================================================
// CHAT INTERNO (Firestore subcollection: chats/{reqId}/messages)
// ============================================================

/**
 * Envía un mensaje de chat para una solicitud de servicio.
 */
export const sendChatMessage = async (reqId, senderId, senderName, text) => {
    try {
        const messagesRef = collection(db, 'chats', reqId, 'messages');
        await addDoc(messagesRef, {
            senderId,
            senderName,
            text: text.trim(),
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (err) {
        console.error('sendChatMessage error:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Escucha en tiempo real los mensajes de chat de una solicitud.
 * Retorna la función para cancelar la suscripción.
 */
export const listenForChatMessages = (reqId, callback) => {
    const messagesRef = collection(db, 'chats', reqId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(messages);
    });
};

