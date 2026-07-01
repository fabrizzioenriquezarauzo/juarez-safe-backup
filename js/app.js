import { AppState } from './state.js';
import Router from './router.js?v=MAY9E';
import { renderHome } from './views/HomeViewV200.js?v=MAY10C';
import { renderLogin } from './views/LoginView.js';
import { renderRegister } from './views/RegisterView.js';
import { renderDashboard } from './views/DashboardView.js';
import { renderProfile } from './views/ProfileView.js';
import { renderCheckout } from './views/CheckoutView.js';
import { renderSeed, loadSeed } from './views/SeedView.js';
import { renderAdminDashboard } from './views/AdminDashboardView.js';
import { renderCertificados, bindCertificadosEvents } from './views/CertificadosView.js?v=MAY12A';
import { AdminController } from './AdminController.js?v=MAY10B';
import {
    getProfessionals,
    updateProfessionalProfile,
    createServiceRequest,
    listenForServiceRequests,
    listenForClientRequests,
    updateServiceRequestStatus,
    getProfessionalStats,
    getAcceptedServices,
    uploadDocument,
    uploadPaymentVoucher,
    listenForPendingPayments,
    listenForCompletedServices,
    approvePayment,
    markServiceAsPaid,
    listenForAllPendingRequests,
    getCompanies,
    listenForAllCompanies,
    updateCompanyLocation,
    getProfessionalById,
    listenForAllOnlineProfessionals,
    getProfessionalsForAdmin,
    updateProfessionalStatus,
    addReview,
    getReviews,
    listenForOngoingContracts,
    listenForFinishedHistory,
    getPendingWithdrawals,
    getCompaniesForAdmin,
    updateCompanyStatus,
    markWithdrawalAsPaid,
    deleteWithdrawalRecord,
    listenForWithdrawalHistory,
    uploadProfessionalVoucher,
    sendChatMessage,
    listenForChatMessages
} from './services/database.js';
import { loginUser, registerUser, logoutUser, onAuthChange } from './services/auth.js';
export { logoutUser }; // Permite que las vistas lo importen desde aquí sin circulares
import { db } from './services/firebase.js';
import { doc, getDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// =====================================================================
// FUNCIONES GLOBALES - Definidas a nivel de módulo para que estén
// disponibles inmediatamente cuando se usa onclick="window.openCertReq()"
// =====================================================================

window.openCertVerify = (e) => {
    if (e) e.preventDefault();
    const modal = document.getElementById('certificates-portal-modal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error('[openCertVerify] Modal certificates-portal-modal no encontrado en el DOM');
    }
};

// Cursos de certificación por defecto (siempre disponibles sin necesidad de Firestore)
const DEFAULT_CERT_COURSES = [
    {
        id: 'local-1',
        name: 'Prevención de Riesgos',
        icon: 'fa-hard-hat',
        isActive: true,
        questions: [
            { text: '¿Qué significa EPP?', correctOption: 'b', options: [
                {id:'a', text:'Equipo Personal Permanente'},
                {id:'b', text:'Equipo de Protección Personal'},
                {id:'c', text:'Equipo de Prevención Primaria'}
            ]},
            { text: '¿Cada cuánto se deben revisar los extintores?', correctOption: 'a', options: [
                {id:'a', text:'Anualmente'},
                {id:'b', text:'Cada 5 años'},
                {id:'c', text:'Solo cuando se usan'}
            ]},
            { text: '¿Qué es una ATS?', correctOption: 'c', options: [
                {id:'a', text:'Análisis de Tareas Simples'},
                {id:'b', text:'Auditoría de Trabajo Seguro'},
                {id:'c', text:'Análisis de Trabajo Seguro'}
            ]}
        ]
    },
    {
        id: 'local-2',
        name: 'Trabajo en Altura',
        icon: 'fa-mountain',
        isActive: true,
        questions: [
            { text: '¿A partir de qué altura se considera trabajo en altura?', correctOption: 'b', options: [
                {id:'a', text:'1 metro'},
                {id:'b', text:'1.8 metros'},
                {id:'c', text:'3 metros'}
            ]},
            { text: '¿Qué equipo es obligatorio en trabajo en altura?', correctOption: 'a', options: [
                {id:'a', text:'Arnés de seguridad'},
                {id:'b', text:'Casco solamente'},
                {id:'c', text:'Guantes de cuero'}
            ]},
            { text: '¿Qué es el punto de anclaje?', correctOption: 'c', options: [
                {id:'a', text:'El punto más alto'},
                {id:'b', text:'La línea de vida'},
                {id:'c', text:'Punto donde se conecta el equipo anticaídas'}
            ]}
        ]
    },
    {
        id: 'local-3',
        name: 'Trabajos Eléctricos',
        icon: 'fa-bolt',
        isActive: true,
        questions: [
            { text: '¿Qué es LOTO?', correctOption: 'a', options: [
                {id:'a', text:'Lockout/Tagout - bloqueo y etiquetado de energía'},
                {id:'b', text:'Lista de Operaciones Técnicas Obligatorias'},
                {id:'c', text:'Logística de Trabajos Operativos'}
            ]},
            { text: '¿Cuántos voltios tiene la corriente domiciliaria en Perú?', correctOption: 'b', options: [
                {id:'a', text:'110 V'},
                {id:'b', text:'220 V'},
                {id:'c', text:'380 V'}
            ]},
            { text: '¿Qué guantes se usan para trabajos eléctricos?', correctOption: 'c', options: [
                {id:'a', text:'Guantes de cuero'},
                {id:'b', text:'Guantes de nitrilo'},
                {id:'c', text:'Guantes dieléctricos'}
            ]}
        ]
    }
];

window.openCertReq = async (e) => {
    if (e) e.preventDefault();

    const modal = document.getElementById('certificate-request-modal');
    if (!modal) {
        console.error('[openCertReq] Modal no encontrado');
        alert('Error: Recarga la página e inténtalo de nuevo.');
        return;
    }

    // Abrir modal y resetear pasos INMEDIATAMENTE (sin esperar Firestore)
    modal.style.display = 'flex';
    ['cert-req-step-1','cert-req-step-2','cert-req-step-3','cert-req-step-4','cert-req-step-5'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.style.display = i === 0 ? 'block' : 'none';
    });

    const btnContainer = document.getElementById('cert-course-buttons');
    if (!btnContainer) return;

    // Si ya tenemos cursos en caché, mostrarlos de inmediato
    if (AppState.certificateCourses && AppState.certificateCourses.length > 0) {
        renderCertCourseButtons(btnContainer);
        return;
    }

    // Usar cursos por defecto INMEDIATAMENTE (sin spinner, sin esperar Firebase)
    AppState.certificateCourses = [...DEFAULT_CERT_COURSES];
    renderCertCourseButtons(btnContainer);

    // Intentar enriquecer con cursos de Firestore en segundo plano (silencioso)
    try {
        const snapshot = await getDocs(collection(db, 'certificate_courses'));
        if (!snapshot.empty) {
            const remoteCourses = [];
            snapshot.forEach(d => remoteCourses.push({ id: d.id, ...d.data() }));
            const active = remoteCourses.filter(c => c.isActive !== false);
            if (active.length > 0) {
                AppState.certificateCourses = active;
                renderCertCourseButtons(btnContainer); // actualizar con datos de Firestore
            }
        }
    } catch (err) {
        // Silencioso: ya mostramos los cursos por defecto
        console.warn('[openCertReq] Firestore no disponible, usando cursos locales:', err.code || err.message);
    }
};

function renderCertCourseButtons(btnContainer) {
    btnContainer.innerHTML = '';
    (AppState.certificateCourses || []).forEach(course => {
        const btn = document.createElement('button');
        btn.style.cssText = 'padding:12px;background:#fff;border:1px solid #CBD5E1;border-radius:8px;font-size:0.85rem;font-weight:600;color:#1E293B;cursor:pointer;text-align:center;transition:all 0.2s;width:100%;';
        btn.innerHTML = `<i class="fa-solid ${course.icon || 'fa-certificate'}" style="margin-right:5px;color:#2563EB;"></i> ${course.name}`;
        btn.addEventListener('click', () => {
            AppState.selectedCertCourse = course;
            const quizContainer = document.getElementById('quiz-form');
            if (!quizContainer) return;
            quizContainer.innerHTML = '';
            if (course.questions && course.questions.length > 0) {
                course.questions.forEach((q, index) => {
                    let optHtml = '';
                    q.options.forEach(opt => {
                        optHtml += `<label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;color:#475569;margin-bottom:8px;cursor:pointer;"><input type="radio" name="q${index}" value="${opt.id}"> ${opt.text}</label>`;
                    });
                    quizContainer.innerHTML += `<div class="quiz-question" data-correct="${q.correctOption}"><p style="font-weight:700;color:#1E293B;font-size:0.95rem;margin:0 0 12px 0;">${index + 1}. ${q.text}</p>${optHtml}</div>`;
                });
            } else {
                quizContainer.innerHTML = '<p style="color:#94A3B8;text-align:center;">No hay preguntas configuradas.</p>';
            }
            document.getElementById('cert-req-step-1').style.display = 'none';
            document.getElementById('cert-req-step-2').style.display = 'block';
        });
        btn.addEventListener('mouseenter', () => btn.style.background = '#F1F5F9');
        btn.addEventListener('mouseleave', () => btn.style.background = '#fff');
        btnContainer.appendChild(btn);
    });
}


const App = {
    init() {
        try {
            console.log("🚀 Inicializando Aplicación...");
            Router.addRoute('/', this.loadHome.bind(this));
            Router.addRoute('/login', this.loadLogin.bind(this));
            Router.addRoute('/register', this.loadRegister.bind(this));
            Router.addRoute('/dashboard', this.loadDashboard.bind(this));
            Router.addRoute('/profile', this.loadProfile.bind(this));
            Router.addRoute('/checkout', this.loadCheckout.bind(this));
            Router.addRoute('/seed', this.loadSeedPage.bind(this));
            Router.addRoute('/certificados', this.loadCertificados.bind(this));
            // Admin route: espera a que auth cargue antes de verificar permisos
            Router.addRoute('/admin', async () => {
                // Esperar hasta 3 segundos por el estado de auth
                let waited = 0;
                while (AppState.user === undefined && waited < 3000) {
                    await new Promise(r => setTimeout(r, 100));
                    waited += 100;
                }
                AdminController.loadAdminDashboard();
            });
            Router.init();

            // Escuchar cambios de sesión
            onAuthChange(async (firebaseUser) => {
                try {
                    if (firebaseUser) {
                        // Solo cargar si no lo tenemos o si cambió el UID
                        if (!AppState.user || AppState.user.uid !== firebaseUser.uid) {
                            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                            if (userDoc.exists()) {
                                AppState.user = { uid: firebaseUser.uid, ...userDoc.data() };
                                console.log("👤 Usuario restaurado:", AppState.user.name);

                                // Re-renderizar vista actual si es necesario
                                const hash = window.location.hash;
                                if (hash === '#/dashboard' && AppState.user.userType === 'professional') {
                                    this.loadDashboard();
                                } else if (hash === '#/' || hash === '') {
                                    this.loadHome();
                                }
                            }
                        }
                    } else {
                        // Usuario cerró sesión
                        const wasLoggedIn = !!AppState.user;
                        AppState.user = null;
                        if (wasLoggedIn) {
                            console.log("👋 Sesión cerrada.");
                            Router.navigateTo('/login');
                        }
                    }
                } catch (authError) {
                    console.error("Error al restaurar sesión:", authError);
                }
            });
        } catch (initError) {
            console.error("🔥 Error Crítico en Init:", initError);
            alert("Error al cargar la aplicación: " + initError.message);
        }
    },

    async loadHome() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = renderHome(AppState.user);

        // Desuscribir listeners previos si existen
        if (AppState.professionalsListenerUnsubscribe) AppState.professionalsListenerUnsubscribe();

        // Initialize Map
        this.initMap();

        // Modo Real-time para el Mapa Principal
        AppState.professionalsListenerUnsubscribe = listenForAllOnlineProfessionals((professionals) => {
            console.log(`📡 [Real-time] ${professionals.length} especialistas online recibidos.`);
            AppState.professionals = professionals;
            this.renderMapMarkers();
        });

        this.bindHomeEvents();

        // Try getting real user location
        this.locateUser();

        // Obtener todos los especialistas por defecto al cargar el inicio solo si está logueado
        if (AppState.user) {
            this.fetchAndRenderProfessionals('all');
        }

        // Logout listener if on Home
        const btnLogout = document.getElementById('logout-btn-home');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                await logoutUser();
                Router.navigateTo('/login');
            });
        }
    },

    initMap() {
        if (AppState.map) {
            AppState.map.off();
            AppState.map.remove();
        }

        // Initialize Leaflet map targeting the div
        AppState.map = L.map('map', { zoomControl: false }).setView([AppState.userLocation.lat, AppState.userLocation.lng], 13);

        // v200: Usar mapa claro (Voyager) en todas las resoluciones
        const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileUrl, {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(AppState.map);

        L.control.zoom({ position: 'bottomright' }).addTo(AppState.map);
    },

    async fetchAndRenderProfessionals(filter) {
        document.getElementById('prof-list').innerHTML = '<div class="loader">Cargando profesionales...</div>';

        // Fetch data
        const data = await getProfessionals(filter);
        AppState.professionals = data;

        // Render List
        this.renderList();
        this.renderMapMarkers();
    },

    renderList() {
        const listContainer = document.getElementById('prof-list');
        const countSpan = document.getElementById('results-count') || document.getElementById('prof-count');

        countSpan.textContent = `${AppState.professionals.length} Encontrados`;
        listContainer.innerHTML = '';

        if (AppState.professionals.length === 0) {
            listContainer.innerHTML = '<p style="padding:1rem; color:#6b7280; text-align:center;">No se encontraron prevencionistas.</p>';
            return;
        }

        AppState.professionals.forEach(prof => {
            const profImg = prof.img || 'https://via.placeholder.com/150?text=SST';
            const card = document.createElement('div');
            card.className = 'prof-card';
            card.innerHTML = `
                <img src="${profImg}" alt="${prof.name}" class="prof-avatar">
                <div class="prof-info-main prof-details">
                    <h3 class="prof-name">${prof.name} <span class="status-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981; margin-left:4px;"></span></h3>
                    <div class="category-pill">${prof.specialty}</div>
                    <div class="rating-box" style="color:#FF7A00; font-size:0.85rem; font-weight:700; margin-top:4px;"><i class="fa-solid fa-star"></i> 4.9</div>
                </div>
                <div class="prof-price-box price">
                    <strong class="price-value" style="display:block; color:#FF7A00; font-size:1.25rem; font-weight:800;">S/ ${prof.rate}</strong>
                    <span class="price-unit" style="font-size:0.75rem; color:#94A3B8;">/día</span>
                </div>
            `;

            card.addEventListener('click', () => this.showProfessionalModal(prof));
            listContainer.appendChild(card);
        });
    },

    renderMapMarkers() {
        // Clear old markers from map
        AppState.markers.forEach(m => m.remove());
        AppState.markers = [];

        // Coordenadas por defecto (Lima centro) para especialistas sin GPS configurado
        const DEFAULT_LAT = AppState.userLocation?.lat || -12.0464;
        const DEFAULT_LNG = AppState.userLocation?.lng || -77.0428;

        const iconActive = L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="background-color:#FF7A00; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(255,122,0,0.4); border: 2px solid white;"><i class="fa-solid fa-shield-halved"></i></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const iconApprox = L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="background-color:#64748B; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.2); border: 2px solid white; opacity:0.75;"><i class="fa-solid fa-shield-halved"></i></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        AppState.professionals.forEach(prof => {
            const hasGPS = prof.location?.lat != null && prof.location?.lng != null
                && prof.location.lat !== 0 && prof.location.lng !== 0;

            const lat = hasGPS ? prof.location.lat : DEFAULT_LAT + (Math.random() - 0.5) * 0.02;
            const lng = hasGPS ? prof.location.lng : DEFAULT_LNG + (Math.random() - 0.5) * 0.02;
            const markerIcon = hasGPS ? iconActive : iconApprox;

            const popup = hasGPS
                ? `<b>${prof.name}</b><br>${prof.specialty}<br>S/ ${prof.rate}/día`
                : `<b>${prof.name}</b><br>${prof.specialty}<br>S/ ${prof.rate}/día<br><small style="color:#94A3B8;">📍 Ubicación aproximada</small>`;

            const marker = L.marker([lat, lng], { icon: markerIcon })
                .addTo(AppState.map)
                .bindPopup(popup);

            AppState.markers.push(marker);
        });
    },

    async showProfessionalModal(prof) {
        const modal = document.getElementById('prof-modal');
        const content = modal.querySelector('.modal-content');

        // Mostrar loading mientras cargamos datos frescos de Firestore
        content.innerHTML = `
            <div class="modal-header">
                <h2>Perfil Profesional</h2>
                <button class="btn-close" id="close-modal"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" style="display:flex;align-items:center;justify-content:center;min-height:200px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:#FF7A00;"></i>
            </div>`;
        modal.classList.add('active');
        document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('active'));

        // Cargar datos frescos de Firestore para ver documentos actualizados
        let fullProf = prof;
        try {
            const fresh = await getProfessionalById(prof.id);
            if (fresh) fullProf = { ...prof, ...fresh };
        } catch (e) { /* usar datos en caché si falla */ }

        const profImg = fullProf.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullProf.name || 'Especialista')}&background=FF7A00&color=fff&size=150`;
        const docs = fullProf.documentation || {};

        // Helper para renderizar botón de documento PDF
        const docBtn = (url, label, icon) => url
            ? `<a href="${url}" target="_blank" style="display:flex;align-items:center;gap:8px;background:rgba(16,185,129,0.1);color:#10B981;border:1px solid rgba(16,185,129,0.3);padding:10px 14px;border-radius:10px;text-decoration:none;font-size:0.8rem;font-weight:700;">
                <i class="fa-solid ${icon}"></i> ${label} <i class="fa-solid fa-arrow-up-right-from-square" style="margin-left:auto;opacity:0.7;font-size:0.7rem;"></i>
               </a>`
            : `<span style="display:flex;align-items:center;gap:8px;background:rgba(148,163,184,0.1);color:#64748B;border:1px solid rgba(148,163,184,0.2);padding:10px 14px;border-radius:10px;font-size:0.8rem;">
                <i class="fa-solid ${icon}"></i> ${label} <span style="margin-left:auto;font-size:0.7rem;">Pendiente</span>
               </span>`;

        content.innerHTML = `
            <div class="modal-header">
                <h2>Perfil Profesional</h2>
                <button class="btn-close" id="close-modal-2"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="prof-full-profile" style="display:flex;gap:16px;align-items:center;margin-bottom:20px;">
                    <img src="${profImg}" alt="${fullProf.name}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:3px solid #FF7A00;">
                    <div>
                        <h3 style="margin:0 0 4px 0;font-size:1.1rem;">${fullProf.name || 'Especialista'}</h3>
                        <span style="background:rgba(255,122,0,0.15);color:#FF7A00;border-radius:100px;padding:3px 12px;font-size:0.75rem;font-weight:700;">${fullProf.specialty || ''}</span>
                        ${fullProf.email ? `<p style="margin:6px 0 0;font-size:0.8rem;color:#94A3B8;">${fullProf.email}</p>` : ''}
                        ${fullProf.phone ? `<p style="margin:4px 0 0;font-size:0.8rem;color:#94A3B8;"><i class="fa-solid fa-phone"></i> ${fullProf.phone}</p>` : ''}
                    </div>
                </div>

                ${fullProf.experience ? `<p style="color:#94A3B8;font-size:0.85rem;margin-bottom:20px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;">${fullProf.experience}</p>` : ''}

                <!-- Documentos PDF -->
                <div style="margin-bottom:20px;">
                    <h4 style="color:#fff;font-size:0.85rem;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                        <i class="fa-solid fa-file-shield" style="color:#FF7A00;"></i> Documentación del Especialista
                    </h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        ${docBtn(docs.dniUrl || docs.dni, 'DNI Escaneado', 'fa-id-card')}
                        ${docBtn(docs.certiadultoUrl || docs.certiadulto, 'Certiadulto', 'fa-shield-halved')}
                        ${docBtn(docs.cvUrl || docs.cv, 'CV Documentado', 'fa-file-pdf')}
                        ${docBtn(docs.certificadosUrl || docs.certs || docs.certificados, 'Cert. Médico Ocupacional', 'fa-certificate')}
                    </div>
                </div>

                ${(docs.altura || docs.caliente || docs.electrico || docs.confinados || docs.loto) ? `
                <div style="margin-bottom:20px;">
                    <h4 style="color:#fff;font-size:0.85rem;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#F59E0B;"></i> Riesgos Críticos
                    </h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        ${docs.altura ? docBtn(docs.altura, 'Altura', 'fa-mountain') : ''}
                        ${docs.caliente ? docBtn(docs.caliente, 'Caliente', 'fa-fire') : ''}
                        ${docs.electrico ? docBtn(docs.electrico, 'Eléctrico', 'fa-bolt') : ''}
                        ${docs.confinados ? docBtn(docs.confinados, 'Confinados', 'fa-door-closed') : ''}
                        ${docs.loto ? docBtn(docs.loto, 'LOTO', 'fa-lock') : ''}
                    </div>
                </div>` : ''}

                ${(fullProf.certifications || []).length > 0 ? `
                <div class="certifications" style="margin-bottom:20px;">
                    <h4 style="font-size:0.85rem;font-weight:800;margin-bottom:10px;color:#94A3B8;">Cursos y Certificaciones</h4>
                    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;">
                        ${(fullProf.certifications || []).map(c => `<li style="display:flex;align-items:center;gap:8px;font-size:0.8rem;"><i class="fa-solid fa-check" style="color:#10B981;"></i> ${c}</li>`).join('')}
                    </ul>
                </div>` : ''}

                <!-- Reseñas -->
                <div style="margin-bottom:20px; padding: 12px; border-radius: 12px; background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-star" style="color:#F59E0B; font-size:1.5rem;"></i>
                            <div>
                                <strong style="color:#fff; font-size:1.2rem;">${fullProf.rating === undefined ? '5.0' : fullProf.rating}</strong>
                                <span style="color:#94A3B8; font-size:0.75rem; display:block;" id="reviews-count-label">Cargando reseñas...</span>
                            </div>
                        </div>
                        <button id="btn-show-reviews" class="btn-outline" style="border:1px solid rgba(245, 158, 11, 0.3); color:#F59E0B; background:transparent; font-size:0.8rem; padding:6px 12px; display:none;">
                            Leer Comentarios
                        </button>
                    </div>
                    <div id="reviews-list-container" style="display:none; margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05); max-height:200px; overflow-y:auto; flex-direction:column; gap:12px;"></div>
                </div>

                <div class="action-bar" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
                    <div>
                        <span style="color:#94A3B8;font-size:0.8rem;">Tarifa Diaria</span>
                        <strong style="display:block;color:#FF7A00;font-size:1.4rem;font-weight:800;">S/ ${fullProf.rate || 150}.00</strong>
                    </div>
                    <button class="btn-primary" id="btn-request" style="flex:1;max-width:200px;">Contratar</button>
                </div>
            </div>`;

        document.getElementById('close-modal-2').addEventListener('click', () => modal.classList.remove('active'));
        document.getElementById('btn-request').addEventListener('click', () => {
            AppState.selectedProfessional = fullProf;
            modal.classList.remove('active');
            Router.navigateTo('/checkout');
        });

        // Cargar reseñas asíncronamente
        getReviews(fullProf.id).then(reviews => {
            const countLabel = document.getElementById('reviews-count-label');
            const btnShow = document.getElementById('btn-show-reviews');
            const listContainer = document.getElementById('reviews-list-container');

            if (countLabel) {
                countLabel.textContent = reviews.length === 1 ? '1 reseña' : `${reviews.length} reseñas`;
            }
            if (reviews.length > 0 && btnShow) {
                btnShow.style.display = 'block';

                let reviewsHtml = '';
                reviews.forEach(rv => {
                    const date = rv.createdAt ? new Date(rv.createdAt.toDate()).toLocaleDateString() : 'Reciente';
                    reviewsHtml += `
                    <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span style="color:#e2e8f0; font-size:0.85rem; font-weight:700;">${rv.clientName || 'Cliente'}</span>
                            <div style="color:#F59E0B; font-size:0.75rem;">
                                ${'<i class="fa-solid fa-star"></i>'.repeat(rv.rating)}${'<i class="fa-regular fa-star"></i>'.repeat(5 - rv.rating)}
                            </div>
                        </div>
                        <p style="color:#94a3b8; font-size:0.8rem; margin:0 0 6px 0; font-style:italic;">"${rv.comment || 'Buen servicio.'}"</p>
                        <span style="color:#64748b; font-size:0.65rem;">${date}</span>
                    </div>`;
                });
                listContainer.innerHTML = reviewsHtml;

                btnShow.addEventListener('click', () => {
                    if (listContainer.style.display === 'none') {
                        listContainer.style.display = 'flex';
                        btnShow.textContent = 'Ocultar Comentarios';
                    } else {
                        listContainer.style.display = 'none';
                        btnShow.textContent = 'Leer Comentarios';
                    }
                });
            } else if (btnShow) {
                btnShow.style.display = 'block';
                btnShow.disabled = true;
                btnShow.style.opacity = '0.5';
                btnShow.textContent = 'Sin comentarios escritos';
            }
        });
    },

    bindHomeEvents() {
        // Hero Splash Toggles
        const catBtns = document.querySelectorAll('.cat-btn');

        // Buscar el contenedor dinámicamente en cada llamada para evitar problemas de caché de módulos
        const deactivateHero = () => {
            const container = document.getElementById('home-view-container')
                || document.querySelector('.home-view');
            if (container) {
                container.classList.remove('hero-active');
                if (AppState.map) {
                    setTimeout(() => AppState.map.invalidateSize(), 300);
                }
            }
        };

        const checkAuth = () => {
            if (!AppState.user) {
                alert("Para visualizar a nuestros especialistas y el mapa de cobertura, por favor inicie sesión o regístrese primero.");
                return false;
            }
            return true;
        };

        // Hero search bar click
        const heroSearchBar = document.getElementById('hero-search-trigger');
        if (heroSearchBar) {
            heroSearchBar.addEventListener('click', () => {
                if (checkAuth()) deactivateHero();
            });
        }

        // Botones de categoría del hero (data-filter o data-cat por compatibilidad)
        catBtns.forEach(btn => btn.addEventListener('click', (e) => {
            if (!checkAuth()) return;
            const filter = e.currentTarget.dataset.filter || e.currentTarget.dataset.cat;
            if (filter) {
                this.fetchAndRenderProfessionals(filter);
                // Activar el botón correspondiente en la barra lateral
                const sideBtns = document.querySelectorAll('.filter-btn');
                sideBtns.forEach(b => {
                    b.classList.remove('active');
                    if (b.dataset.filter === filter) b.classList.add('active');
                });
            }
            deactivateHero();
        }));

        // Filter Buttons del sidebar
        const btns = document.querySelectorAll('.filter-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!checkAuth()) return;
                btns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.fetchAndRenderProfessionals(e.target.dataset.filter);
                deactivateHero();
            });
        });

        // Botón de ubicación
        document.getElementById('btn-my-location')?.addEventListener('click', () => {
            if (!checkAuth()) return;
            this.locateUser();
            deactivateHero();
        });

        // --- BINDINGS DE CERTIFICADOS (hero) ---
        // Enlazados aquí por addEventListener para máxima compatibilidad
        document.getElementById('btn-hero-get-cert')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.openCertReq(e);
        });
        document.getElementById('btn-hero-verify-cert')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.openCertVerify(e);
        });

        document.getElementById('btn-search-cert')?.addEventListener('click', () => {
            const input = document.getElementById('cert-search-input').value;
            if (!input.trim()) {
                alert('Ingresa un DNI o código válido');
                return;
            }
            
            const btn = document.getElementById('btn-search-cert');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
            
            import('./services/database.mjs?v=MAY5').then(async ({ searchCertificate }) => {
                const result = await searchCertificate(input.trim());
                btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Verificar';
                
                if (result.success) {
                    const cert = result.certificate;
                    document.getElementById('cert-search-view').style.display = 'none';
                    
                    document.getElementById('cert-result-holder-name').textContent = cert.userName;
                    document.getElementById('cert-result-course-name').textContent = cert.courseName;
                    const issueDate = cert.issueDate ? new Date(cert.issueDate.seconds * 1000).toLocaleDateString('es-PE') : 'N/A';
                    document.getElementById('cert-result-issue-date').textContent = issueDate;
                    
                    const qrImg = document.getElementById('cert-result-qr');
                    if (qrImg && cert.uniqueCode) {
                        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(cert.uniqueCode)}`;
                        qrImg.style.display = 'block';
                    }
                    
                    document.getElementById('cert-result-view').style.display = 'block';
                } else {
                    alert(result.error);
                }
            });
        });

        document.getElementById('btn-cert-back')?.addEventListener('click', () => {
            document.getElementById('cert-search-input').value = '';
            document.getElementById('cert-search-view').style.display = 'block';
            document.getElementById('cert-result-view').style.display = 'none';
        });

        document.querySelectorAll('.btn-pay-membership-ui').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = document.getElementById('membership-pay-modal');
                if (modal) modal.style.display = 'flex';
            });
        });

        const btnSubmitMembership = document.getElementById('btn-submit-membership');
        if (btnSubmitMembership) {
            btnSubmitMembership.addEventListener('click', async () => {
                const fileInput = document.getElementById('membership-voucher-file');
                const file = fileInput.files[0];
                if (!file) {
                    alert('Por favor selecciona una imagen del comprobante.');
                    return;
                }
                btnSubmitMembership.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';
                btnSubmitMembership.disabled = true;

                import('./services/database.mjs?v=MAY5').then(async ({ uploadMembershipVoucher }) => {
                    const result = await uploadMembershipVoucher(AppState.user.uid, file);
                    if (result.success) {
                        alert('¡Comprobante enviado! El administrador lo validará pronto.');
                        window.location.reload();
                    } else {
                        alert('Error al subir comprobante: ' + result.error);
                        btnSubmitMembership.innerHTML = 'Enviar Comprobante';
                        btnSubmitMembership.disabled = false;
                    }
                });
            });
        }

        const btnSubmitQuiz = document.getElementById('btn-submit-quiz');
        if (btnSubmitQuiz) {
            btnSubmitQuiz.addEventListener('click', () => {
                const quizQuestions = document.querySelectorAll('.quiz-question');
                let allCorrect = true;
                
                if (quizQuestions.length === 0) return;

                quizQuestions.forEach((qDiv, index) => {
                    const correctVal = qDiv.dataset.correct;
                    const checkedVal = document.querySelector(`input[name="q${index}"]:checked`)?.value;
                    if (checkedVal !== correctVal) {
                        allCorrect = false;
                    }
                });

                const errorDiv = document.getElementById('quiz-error');
                
                if (allCorrect) {
                    errorDiv.style.display = 'none';
                    document.getElementById('cert-req-step-2').style.display = 'none';
                    document.getElementById('cert-req-step-3').style.display = 'block';
                } else {
                    errorDiv.style.display = 'block';
                }
            });
        }

        const btnGenerateCertView = document.getElementById('btn-generate-cert-view');
        if (btnGenerateCertView) {
            btnGenerateCertView.addEventListener('click', () => {
                document.getElementById('cert-req-step-3').style.display = 'none';
                document.getElementById('cert-req-step-4').style.display = 'block';
            });
        }

        const btnSubmitCertRequest = document.getElementById('btn-submit-cert-request');
        if (btnSubmitCertRequest) {
            btnSubmitCertRequest.addEventListener('click', async () => {
                if (!AppState.user) {
                    alert('Debes iniciar sesión o registrarte para solicitar un certificado.');
                    document.getElementById('certificate-request-modal').style.display = 'none';
                    window.location.hash = '/login';
                    return;
                }

                const fileInput = document.getElementById('cert-voucher-file');
                const file = fileInput.files[0];
                if (!file) {
                    alert('Por favor selecciona una imagen del comprobante de pago.');
                    return;
                }

                btnSubmitCertRequest.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
                btnSubmitCertRequest.disabled = true;

                import('./services/database.mjs?v=MAY5').then(async ({ uploadCertificateVoucher }) => {
                    const courseName = AppState.selectedCertCourse ? AppState.selectedCertCourse.name : 'Curso General';
                    const result = await uploadCertificateVoucher(AppState.user.uid, file, AppState.user.name, AppState.user.dni || 'No provisto', courseName);
                    if (result.success) {
                        document.getElementById('cert-req-step-4').style.display = 'none';
                        document.getElementById('cert-req-step-5').style.display = 'block';
                    } else {
                        alert('Error al enviar solicitud: ' + result.error);
                        btnSubmitCertRequest.innerHTML = 'Enviar Solicitud';
                        btnSubmitCertRequest.disabled = false;
                    }
                });
            });
        }
    },

    locateUser() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    // ACTUALIZAR ESTADO GLOBAL
                    AppState.userLocation = { lat, lng };
                    console.log(`📍 Ubicación detectada: ${lat}, ${lng}`);

                    if (AppState.map) {
                        AppState.map.flyTo([lat, lng], 14);

                        // User location marker
                        L.marker([lat, lng], {
                            icon: L.divIcon({
                                className: 'user-marker',
                                html: `<div style="background-color:#ef4444; width:15px; height:15px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.3);"></div>`,
                                iconSize: [15, 15]
                            })
                        }).addTo(AppState.map).bindPopup("Tu ubicación actual").openPopup();
                    }
                },
                (error) => {
                    console.warn("Geolocation denied or error:", error);
                    alert("No pudimos obtener tu ubicación. Por favor activa el GPS o da permiso al navegador.");
                },
                { enableHighAccuracy: true }
            );
        }
    },

    // Auth Routes
    loadLogin() {
        if (AppState.map) {
            AppState.map.off();
            AppState.map.remove();
            AppState.map = null;
        }
        document.getElementById('app').innerHTML = renderLogin();

        const form = document.getElementById('login-form');
        const errorBox = document.getElementById('auth-error');
        const errorText = document.getElementById('auth-error-text');
        const btnText = document.getElementById('login-btn-text');
        const spinner = document.getElementById('login-spinner');
        const btn = document.getElementById('login-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            // Mostrar estado de carga
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'inline-block';
            errorBox.style.display = 'none';

            const result = await loginUser(email, password);

            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';

            if (result.success) {
                // Guardar usuario en el estado global
                AppState.user = result.userData;

                // Si es empresa (client), capturar GPS y guardarlo en Firestore
                const userType = result.userData?.userType || 'client';
                if (userType === 'client' && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            const { latitude: lat, longitude: lng } = pos.coords;
                            AppState.user.lat = lat;
                            AppState.user.lng = lng;
                            await updateCompanyLocation(
                                result.userData.uid || result.user?.uid,
                                lat, lng,
                                result.userData.companyName || result.userData.name
                            );
                            console.log('📍 [Empresa] Ubicación GPS guardada:', lat, lng);
                        },
                        (err) => console.warn('GPS de empresa no disponible:', err.message),
                        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                    );
                }

                // Redirigir según el tipo de usuario
                if (userType === 'professional') {
                    Router.navigateTo('/dashboard');
                } else {
                    Router.navigateTo('/');
                }
            } else {
                // Mostrar error en español
                errorText.textContent = result.error;
                errorBox.style.display = 'flex';
            }
        });
    },

    loadRegister() {
        if (AppState.map) {
            AppState.map.off();
            AppState.map.remove();
            AppState.map = null;
        }
        document.getElementById('app').innerHTML = renderRegister();

        let selectedType = 'professional';
        const typeBtns = document.querySelectorAll('.type-btn');
        typeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                typeBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                selectedType = e.currentTarget.dataset.type;

                const docsSection = document.getElementById('professional-extra-fields');
                const companyFields = document.getElementById('company-extra-fields');
                
                if (selectedType === 'professional') {
                    if (docsSection) docsSection.style.display = 'block';
                    if (companyFields) companyFields.style.display = 'none';
                    document.getElementById('file-dni').required = true;
                    document.getElementById('file-certiadulto').required = true;
                } else {
                    if (docsSection) docsSection.style.display = 'none';
                    if (companyFields) companyFields.style.display = 'block';
                    document.getElementById('file-dni').required = false;
                    document.getElementById('file-certiadulto').required = false;
                    const cv = document.getElementById('file-cv');
                    const cert = document.getElementById('file-certificados');
                    if (cv) cv.required = false;
                    if (cert) cert.required = false;
                }
            });
        });

        // Toggle Technical Docs para "Ama de Casa"
        const specialtySelect = document.getElementById('register-specialty');
        if (specialtySelect) {
            specialtySelect.addEventListener('change', (e) => {
                const techDocs = document.getElementById('technical-docs-wrapper');
                if (techDocs) {
                    techDocs.style.display = e.target.value === 'Ama de Casa' ? 'none' : 'flex';

                    // Asegurar requirimientos dinamicos
                    const cvInput = document.getElementById('file-cv');
                    const certInput = document.getElementById('file-certificados');
                    if (e.target.value === 'Ama de Casa') {
                        if (cvInput) cvInput.required = false;
                        if (certInput) certInput.required = false;
                    } else {
                        if (cvInput) cvInput.required = true;
                        if (certInput) certInput.required = true;
                    }
                }
            });
        }

        const form = document.getElementById('register-form');
        const errorBox = document.getElementById('register-error');
        const errorText = document.getElementById('register-error-text');
        const btnText = document.getElementById('register-btn-text');
        const spinner = document.getElementById('register-spinner');
        const btn = document.getElementById('register-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;

            // Datos extra para empresas
            let companyData = null;
            let finalSpecialty = '';
            let documentationObj = {};

            if (selectedType === 'client') {
                const ruc = document.getElementById('register-ruc').value.trim();
                const companyName = document.getElementById('register-company').value.trim();

                if (ruc.length !== 11) {
                    errorText.textContent = "El RUC debe tener exactamente 11 dígitos.";
                    errorBox.style.display = 'flex';
                    return;
                }

                if (!companyName) {
                    errorText.textContent = "Debes ingresar la Razón Social de la empresa.";
                    errorBox.style.display = 'flex';
                    return;
                }

                companyData = { ruc, companyName };
            } else if (selectedType === 'professional') {
                finalSpecialty = document.getElementById('register-specialty').value;
                const reqDni = document.getElementById('file-dni').files[0];
                const reqCertiadulto = document.getElementById('file-certiadulto').files[0];

                if (!reqDni || !reqCertiadulto) {
                    errorText.textContent = "Debes subir tu DNI y Certiadulto.";
                    errorBox.style.display = 'flex';
                    return;
                }

                let reqCv = null, reqCert = null;
                if (finalSpecialty !== 'Ama de Casa') {
                    reqCv = document.getElementById('file-cv').files[0];
                    reqCert = document.getElementById('file-certificados').files[0];
                    if (!reqCv || !reqCert) {
                        errorText.textContent = "Debes subir tu CV documentado y Certificados de trabajo.";
                        errorBox.style.display = 'flex';
                        return;
                    }
                }

                // Generar un ID temporal para organizar los documentos antes de que FirebaseAuth nos dé el UID
                const tempId = btoa(email).replace(/[^a-zA-Z0-9]/g, '');

                btn.disabled = true;
                btnText.style.display = 'none';
                spinner.style.display = 'inline-block';
                errorBox.style.display = 'none';
                btnText.textContent = "Subiendo Documentos...";
                btnText.style.display = 'inline-block';

                try {
                    btnText.textContent = "Subiendo Documentos (0/4)...";

                    // Subir todos los documentos EN PARALELO para máxima velocidad
                    const uploadPromises = [
                        uploadDocument(tempId, reqDni, 'dni'),
                        uploadDocument(tempId, reqCertiadulto, 'certiadulto')
                    ];

                    if (finalSpecialty !== 'Ama de Casa') {
                        uploadPromises.push(uploadDocument(tempId, reqCv, 'cv'));
                        uploadPromises.push(uploadDocument(tempId, reqCert, 'certificados'));
                    }

                    btnText.textContent = `Subiendo ${uploadPromises.length} documentos...`;

                    const uploadResults = await Promise.all(uploadPromises);

                    const [resDni, resCertiadulto, resCv, resCert] = uploadResults;

                    if (resDni?.success) documentationObj.dniUrl = resDni.url;
                    if (resCertiadulto?.success) documentationObj.certiadultoUrl = resCertiadulto.url;
                    if (resCv?.success) documentationObj.cvUrl = resCv.url;
                    if (resCert?.success) documentationObj.certificadosUrl = resCert.url;

                    btnText.textContent = "Documentos listos ✓";

                } catch (upErr) {
                    spinner.style.display = 'none';
                    btn.disabled = false;
                    btnText.textContent = "Crear Cuenta";
                    errorText.textContent = "Error subiendo archivos pesados. Intenta con PDFs más ligeros.";
                    errorBox.style.display = 'flex';
                    return;
                }
            }

            // Mostrar estado de carga final de cuenta
            btn.disabled = true;
            btnText.textContent = "Creando cuenta segura...";
            spinner.style.display = 'inline-block';
            btnText.style.display = 'inline-block';
            errorBox.style.display = 'none';

            try {
                const result = await registerUser(name, email, password, selectedType, documentationObj, companyData, finalSpecialty);

                if (result.success) {
                    const uid = result.user.uid;

                    // Guardar datos COMPLETOS en AppState (incluye specialty)
                    AppState.user = {
                        uid,
                        name,
                        email,
                        userType: selectedType,
                        specialty: finalSpecialty || '',
                        rate: 150,
                        rating: 5.0,
                        isOnline: false
                    };

                    // Si es especialista, crear su entrada en 'professionals' DE INMEDIATO
                    // para que aparezca en Firestore aunque no haya activado el toggle
                    if (selectedType === 'professional') {
                        try {
                            await updateProfessionalProfile(uid, {
                                name,
                                email,
                                specialty: finalSpecialty || 'Especialista',
                                rate: 150,
                                rating: 5.0,
                                isOnline: false,
                                documentation: documentationObj
                            });
                            console.log('✅ Perfil profesional creado en Firestore');
                        } catch (profErr) {
                            console.warn('⚠️ No se pudo crear professionals:', profErr.message);
                        }
                        Router.navigateTo('/dashboard');
                    } else {
                        Router.navigateTo('/');
                    }
                } else {
                    throw new Error(result.error);
                }
            } catch (err) {
                errorText.textContent = err.message;
                errorBox.style.display = 'flex';
            } finally {
                btn.disabled = false;
                btnText.textContent = "Crear Cuenta";
                btnText.style.display = 'inline';
                spinner.style.display = 'none';
            }
        });
    },

    async loadProfile() {
        if (!AppState.user || AppState.user.userType !== 'professional') {
            Router.navigateTo('/dashboard');
            return;
        }

        if (AppState.map) { AppState.map.remove(); AppState.map = null; }
        if (this.dashboardMap) { this.dashboardMap.remove(); this.dashboardMap = null; }

        const { renderProfile } = await import('./views/ProfileView.js?v=' + Date.now());

        const html = `
            <div class="profile-scroll-container" style="position:fixed; inset:0; background: var(--bg-dark, #0F172A); height: 100vh; overflow-y: auto; -webkit-overflow-scrolling: touch; color: #fff; z-index: 100; padding: 40px 24px;">
                <div style="max-width: 800px; margin: 0 auto; position: relative;">
                    <button id="btn-back-to-dash" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 12px; padding: 10px 20px; font-weight: 700; cursor: pointer; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-arrow-left"></i> Volver al Mapa
                    </button>
                    ${renderProfile(AppState.user)}
                </div>
            </div>
        `;

        document.getElementById('app').innerHTML = html;

        document.getElementById('btn-back-to-dash').addEventListener('click', () => {
            Router.navigateTo('/dashboard');
        });

        this.bindProfileEvents();
    },

    async loadDashboard() {
        if (!AppState.user) {
            document.getElementById('app').innerHTML = `<div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#0F172A; color:#fff;">Cargando Panel...</div>`;
            return;
        }

        if (AppState.user.userType === 'client') {
            document.getElementById('app').innerHTML = renderDashboard(AppState.user);

            if (AppState.serviceListenerUnsubscribe) {
                AppState.serviceListenerUnsubscribe();
            }

            AppState.serviceListenerUnsubscribe = listenForClientRequests(AppState.user.uid, (requests) => {
                AppState.user.clientRequests = requests;
                document.getElementById('app').innerHTML = renderDashboard(AppState.user);
                this.bindClientDashboardEvents();
            });

            // Initial bind in case requests is empty
            this.bindClientDashboardEvents();
            return;
        }

        console.log("📊 [Dashboard] Cargando datos unificados (v22 style)...");
        const stats = await getProfessionalStats(AppState.user.uid);
        const acceptedServices = await getAcceptedServices(AppState.user.uid);
        const userWithStats = { ...AppState.user, ...stats, acceptedServices };

        // Render Unified UI
        document.getElementById('app').innerHTML = renderDashboard(userWithStats);

        // 1. Initialize Map
        this.initDashboardMap();

        // 2. Render Missions List
        this.renderAcceptedServices(acceptedServices);

        // 3. Online Toggle Listener - GPS automático + guarda todos los datos del profesional
        const toggleOnline = document.getElementById('toggle-online');
        if (toggleOnline) {
            toggleOnline.addEventListener('change', async (e) => {
                const isOnline = e.target.checked;
                const statusText = document.getElementById('status-text');
                const user = AppState.user;

                if (isOnline) {
                    if (user.validationStatus === 'observada' || user.validationStatus === 'pendiente' || !user.validationStatus) {
                        e.target.checked = false;
                        alert("No puedes ponerte en modo 'Visible' hasta que tus documentos sean aprobados por un administrador.");
                        return;
                    }

                    statusText.textContent = 'Detectando ubicación...';
                    statusText.style.color = '#F59E0B';

                    const getLocation = () => new Promise((resolve, reject) => {
                        if (!navigator.geolocation) { reject(new Error('GPS no disponible')); return; }
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        });
                    });

                    // Datos base del profesional que siempre se guardan
                    const baseData = {
                        isOnline: true,
                        name: user.name || user.displayName || 'Especialista',
                        specialty: user.specialty || user.userSpecialty || 'Técnico',
                        rate: user.rate || user.dailyRate || 150,
                        email: user.email || '',
                        uid: user.uid,
                        lastSeen: new Date().toISOString()
                    };

                    try {
                        const pos = await getLocation();
                        const { latitude: lat, longitude: lng } = pos.coords;

                        // Guardar datos completos + GPS en colecciones users y professionals
                        const res = await updateProfessionalProfile(user.uid, {
                            ...baseData,
                            lat,
                            lng,
                            location: { lat, lng }
                        });

                        if (res.success) {
                            AppState.user.isOnline = true;
                            AppState.user.lat = lat;
                            AppState.user.lng = lng;
                            statusText.textContent = '✅ Estás visible en el mapa';
                            statusText.style.color = '#10B981';

                            // Reubicar el mapa del dashboard a la posición real
                            if (this.dashboardMap) {
                                this.dashboardMap.setView([lat, lng], 15);
                                // Actualizar marcador del usuario
                                if (this._userMarker) this._userMarker.setLatLng([lat, lng]);
                                else {
                                    this._userMarker = L.marker([lat, lng], {
                                        icon: L.divIcon({
                                            className: 'user-marker',
                                            html: `<div style="position:relative;width:16px;height:16px;"><div style="position:absolute;background:#2563EB;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(37,99,235,0.5);z-index:2;"></div></div>`,
                                            iconSize: [16, 16], iconAnchor: [8, 8]
                                        })
                                    }).addTo(this.dashboardMap);
                                }
                            }
                        }
                    } catch (gpsErr) {
                        console.warn('GPS no disponible:', gpsErr.message);
                        const res = await updateProfessionalProfile(user.uid, baseData);
                        if (res.success) {
                            AppState.user.isOnline = true;
                            statusText.textContent = 'Visible (habilita GPS en tu navegador)';
                            statusText.style.color = '#F59E0B';
                        }
                    }
                } else {
                    const res = await updateProfessionalProfile(user.uid, { isOnline: false });
                    if (res.success) {
                        AppState.user.isOnline = false;
                        statusText.textContent = 'Desconectado';
                        statusText.style.color = '#64748B';
                    }
                }
            });
        }

        // 4. Real-time Service Request Listener
        if (AppState.user.userType === 'professional') {
            if (AppState.serviceListenerUnsubscribe) {
                AppState.serviceListenerUnsubscribe();
            }

            AppState.serviceListenerUnsubscribe = listenForServiceRequests(AppState.user.uid, (requests) => {
                const pendingRequests = requests.filter(r => r.status === 'pending');
                const acceptedRequests = requests.filter(r => ['accepted','approved','payment_verifying'].includes(r.status));

                // Render accepted missions in sidebar
                this.renderAcceptedServices(acceptedRequests);

                // Render ALL pending missions as cards in sidebar
                this.renderPendingMissions(pendingRequests);

                // Show modal notification only for first pending mission (if new)
                if (pendingRequests.length > 0) {
                    const firstPending = pendingRequests[0];
                    const modal = document.getElementById('incoming-request-modal');
                    if (modal && !modal.classList.contains('active')) {
                        this.showIncomingRequest(firstPending);
                    }
                }
            });
        }

        // 4.5. Reupload Docs Listener
        if (AppState.user.userType === 'professional') {
            const btnReupload = document.getElementById('btn-reupload-docs');
            const reuploadModal = document.getElementById('reupload-docs-modal');
            const closeReupload = document.getElementById('close-reupload-modal');
            if (btnReupload && reuploadModal && closeReupload) {
                btnReupload.addEventListener('click', () => reuploadModal.classList.add('active'));
                closeReupload.addEventListener('click', () => reuploadModal.classList.remove('active'));

                const form = document.getElementById('reupload-form');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();

                        const reqDni = document.getElementById('reupload-dni')?.files[0];
                        const reqCertiadulto = document.getElementById('reupload-certiadulto')?.files[0];
                        const reqCv = document.getElementById('reupload-cv')?.files[0];
                        const reqCert = document.getElementById('reupload-cert')?.files[0];
                        const errorBox = document.getElementById('reupload-error');

                        if (!reqDni && !reqCertiadulto && !reqCv && !reqCert) {
                            errorBox.textContent = "Sube al menos un documento para corregir.";
                            errorBox.style.display = 'block';
                            return;
                        }

                        // Show spinner
                        const btnSubmit = document.getElementById('btn-submit-reupload');
                        const btnText = document.getElementById('reupload-btn-text');
                        const spinner = document.getElementById('reupload-spinner');

                        btnSubmit.disabled = true;
                        btnText.style.display = 'none';
                        spinner.style.display = 'inline-block';
                        errorBox.style.display = 'none';

                        try {
                            let docsObj = AppState.user.documentation || {};
                            const uid = AppState.user.uid;

                            const promises = [];
                            if (reqDni) promises.push(uploadDocument(uid, reqDni, 'dni').then(r => { if (r.success) docsObj.dniUrl = r.url; }));
                            if (reqCertiadulto) promises.push(uploadDocument(uid, reqCertiadulto, 'certiadulto').then(r => { if (r.success) docsObj.certiadultoUrl = r.url; }));
                            if (reqCv) promises.push(uploadDocument(uid, reqCv, 'cv').then(r => { if (r.success) docsObj.cvUrl = r.url; }));
                            if (reqCert) promises.push(uploadDocument(uid, reqCert, 'certificados').then(r => { if (r.success) docsObj.certificadosUrl = r.url; }));

                            await Promise.all(promises);

                            // Set validationStatus to pendiente again
                            await updateProfessionalProfile(uid, { documentation: docsObj, validationStatus: 'pendiente', validationReason: null });

                            reuploadModal.classList.remove('active');
                            // Update local UI
                            AppState.user.validationStatus = 'pendiente';
                            AppState.user.validationReason = null;
                            this.loadDashboard();

                        } catch (err) {
                            errorBox.textContent = "Error al subir documentos: " + err.message;
                            errorBox.style.display = 'block';
                        } finally {
                            btnSubmit.disabled = false;
                            btnText.style.display = 'inline-block';
                            spinner.style.display = 'none';
                        }
                    });
                }
            }
        }

        // 5. Logout Listener
        const btnLogout = document.getElementById('logout-btn');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                if (AppState.serviceListenerUnsubscribe) AppState.serviceListenerUnsubscribe();
                await logoutUser();
                Router.navigateTo('/');
            });
        }
    },

    bindClientDashboardEvents() {
        // Logout
        const btnLogout = document.getElementById('logout-btn-client');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                if (AppState.serviceListenerUnsubscribe) AppState.serviceListenerUnsubscribe();
                await logoutUser();
                Router.navigateTo('/');
            });
        }

        // Voucher Uploads
        const uploadInputs = document.querySelectorAll('.voucher-upload-input');
        uploadInputs.forEach(input => {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reqId = e.target.dataset.reqid;
                const label = document.getElementById(`lbl-upload-${reqId}`);
                const oldHtml = label.innerHTML;
                label.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

                const res = await uploadPaymentVoucher(reqId, file);
                if (res.success) {
                    label.innerHTML = '<i class="fa-solid fa-check"></i> Comprobante Subido';
                    label.style.color = '#10B981';
                    label.style.background = '#065F46';
                    label.style.borderColor = '#065F46';

                    // Abrir WhatsApp
                    const waMsg = `Hola J&A SafeWork, acabo de subir mi voucher de pago para la solicitud de servicio con ID: ${reqId}. Por favor verificar.`;
                    window.open(`https://wa.me/51915079361?text=${encodeURIComponent(waMsg)}`, '_blank');
                } else {
                    label.innerHTML = '<i class="fa-solid fa-xmark"></i> Error al subir';
                    label.style.background = '#EF4444';
                    setTimeout(() => { label.innerHTML = oldHtml; label.style.background = ''; label.style.color = ''; label.style.borderColor = ''; }, 3000);
                }
            });
        });

        // Rating Modal Logic
        const ratingModal = document.getElementById('rating-modal');
        const closeRating = document.getElementById('close-rating-modal');
        const starContainer = document.getElementById('star-rating-container');
        const valInput = document.getElementById('rating-value');

        if (ratingModal) {
            document.querySelectorAll('.open-review-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const b = e.currentTarget;
                    document.getElementById('rating-req-id').value = b.dataset.reqid;
                    document.getElementById('rating-prof-id').value = b.dataset.profid;
                    document.getElementById('rating-prof-name').textContent = b.dataset.profname;

                    // Reset
                    valInput.value = 0;
                    document.querySelectorAll('.star-btn').forEach(s => {
                        s.classList.remove('fa-solid');
                        s.classList.add('fa-regular');
                    });
                    document.getElementById('rating-comment').value = '';
                    document.getElementById('rating-error').style.display = 'none';

                    ratingModal.classList.add('active');
                });
            });

            closeRating.addEventListener('click', () => ratingModal.classList.remove('active'));

            // Star selection interaction
            if (starContainer) {
                starContainer.addEventListener('click', (e) => {
                    if (e.target.classList.contains('star-btn')) {
                        const val = parseInt(e.target.dataset.val);
                        valInput.value = val;
                        document.querySelectorAll('.star-btn').forEach(s => {
                            const v = parseInt(s.dataset.val);
                            if (v <= val) {
                                s.classList.remove('fa-regular');
                                s.classList.add('fa-solid');
                            } else {
                                s.classList.remove('fa-solid');
                                s.classList.add('fa-regular');
                            }
                        });
                    }
                });
            }

            // Submit Review
            const form = document.getElementById('rating-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const reqId = document.getElementById('rating-req-id').value;
                    const profId = document.getElementById('rating-prof-id').value;
                    const rating = parseInt(valInput.value);
                    const comment = document.getElementById('rating-comment').value;
                    const errBox = document.getElementById('rating-error');

                    if (rating === 0) {
                        errBox.textContent = "Por favor selecciona una cantidad de estrellas.";
                        errBox.style.display = 'block';
                        return;
                    }

                    document.getElementById('btn-submit-rating').disabled = true;
                    document.getElementById('rating-btn-text').style.display = 'none';
                    document.getElementById('rating-spinner').style.display = 'inline-block';
                    errBox.style.display = 'none';

                    const res = await addReview(profId, AppState.user.uid, AppState.user.name || 'Cliente', rating, comment, reqId);

                    if (res.success) {
                        ratingModal.classList.remove('active');
                        // Quick UI update so client knows it was rated
                        const btn = document.querySelector(`.open-review-btn[data-reqid="${reqId}"]`);
                        if (btn) {
                            const parent = btn.parentElement;
                            parent.innerHTML = `<div style="font-size: 0.85rem; color: #F59E0B; background: rgba(245, 159, 11, 0.1); padding: 12px; border-radius: 8px;"><i class="fa-solid fa-star"></i> Especialista Calificado</div>`;
                            parent.style.borderTop = 'none';
                            parent.style.paddingTop = '0';
                        }
                    } else {
                        errBox.textContent = "Error al enviar: " + res.error;
                        errBox.style.display = 'block';
                    }

                    document.getElementById('btn-submit-rating').disabled = false;
                    document.getElementById('rating-btn-text').style.display = 'inline-block';
                    document.getElementById('rating-spinner').style.display = 'none';
                });
            }
        }
    },

    bindProfileEvents() {
        const form = document.getElementById('profile-settings-form');
        if (!form) return;

        // A. Profile Photo Upload
        const photoInput = document.getElementById('prof-photo-input');
        const photoPreview = document.getElementById('prof-photo-preview');
        const uploadLabel = document.querySelector('label[for="prof-photo-input"] .fa-cloud-arrow-up')?.parentElement;

        if (photoInput && photoPreview && uploadLabel) {
            photoInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // 1. Preview Local Inmediato
                const localUrl = URL.createObjectURL(file);
                photoPreview.src = localUrl;

                // 2. Feedback Visual
                const originalContent = uploadLabel.innerHTML;
                uploadLabel.style.opacity = "0.7";
                uploadLabel.style.pointerEvents = "none";
                uploadLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo a la nube...';

                try {
                    console.log("☁️ Iniciando subida de foto para:", AppState.user.uid);
                    const res = await uploadDocument(AppState.user.uid, file, 'profile_photo');

                    if (res.success) {
                        console.log("✅ Foto subida exitosamente:", res.url);
                        // 3. Guardar en Base de Datos
                        const dbRes = await updateProfessionalProfile(AppState.user.uid, { img: res.url });

                        if (dbRes.success) {
                            AppState.user.img = res.url;
                            uploadLabel.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡Guardado!';
                            uploadLabel.style.background = "#10B981";
                            setTimeout(() => {
                                uploadLabel.innerHTML = originalContent;
                                uploadLabel.style.background = "#2563EB";
                                uploadLabel.style.opacity = "1";
                                uploadLabel.style.pointerEvents = "auto";
                            }, 3000);
                        } else {
                            throw new Error(dbRes.error);
                        }
                    } else {
                        throw new Error(res.error);
                    }
                } catch (err) {
                    console.error("❌ Error en subida de foto:", err);
                    alert("Error al guardar la foto: " + err.message);
                    uploadLabel.innerHTML = originalContent;
                    uploadLabel.style.opacity = "1";
                    uploadLabel.style.pointerEvents = "auto";
                }
            };
        }

        // B. Detection GPS
        const btnGPS = document.getElementById('btn-detect-gps');
        if (btnGPS) {
            btnGPS.onclick = () => {
                btnGPS.disabled = true;
                btnGPS.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detectando...';

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        const { latitude, longitude } = pos.coords;
                        const res = await updateProfessionalProfile(AppState.user.uid, {
                            lat: latitude,
                            lng: longitude,
                            location: { latitude, longitude }
                        });
                        if (res.success) {
                            AppState.user.lat = latitude;
                            AppState.user.lng = longitude;
                            const gpsStatus = document.getElementById('gps-status');
                            if (gpsStatus) {
                                gpsStatus.textContent = "Verificada";
                                gpsStatus.style.color = "#34D399";
                            }
                        }
                        btnGPS.disabled = false;
                        btnGPS.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Detectar Ahora';
                    }, (err) => {
                        alert("Error al detectar GPS: " + err.message);
                        btnGPS.disabled = false;
                        btnGPS.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Detectar Ahora';
                    });
                }
            };
        }

        // B. Document Uploads (All 9 slots)
        const docIds = [
            { id: 'prof-doc-dni', type: 'dni' },
            { id: 'prof-doc-certiadulto', type: 'certiadulto' },
            { id: 'prof-doc-cv', type: 'cv' },
            { id: 'prof-doc-certs', type: 'certs' },
            { id: 'prof-doc-recibo', type: 'recibo' },
            { id: 'prof-doc-altura', type: 'altura' },
            { id: 'prof-doc-caliente', type: 'caliente' },
            { id: 'prof-doc-electrico', type: 'electrico' },
            { id: 'prof-doc-confinados', type: 'confinados' },
            { id: 'prof-doc-loto', type: 'loto' }
        ];

        docIds.forEach(docObj => {
            const input = document.getElementById(docObj.id);
            if (input) {
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const statusDiv = input.parentElement.querySelector('.upload-status');
                    const oldContent = statusDiv.innerHTML;
                    statusDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

                    const res = await uploadDocument(AppState.user.uid, file, docObj.type);
                    if (res.success) {
                        const docUpdate = { documentation: AppState.user.documentation || {} };
                        docUpdate.documentation[docObj.type] = res.url;

                        await updateProfessionalProfile(AppState.user.uid, docUpdate);
                        AppState.user.documentation = docUpdate.documentation;

                        statusDiv.innerHTML = `<i class="fa-solid fa-circle-check"></i> <a href="${res.url}" target="_blank" style="color:inherit; text-decoration:underline;">Ver Archivo</a>`;
                        statusDiv.style.color = "#10B981";
                    } else {
                        statusDiv.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Error';
                        statusDiv.style.color = "#EF4444";
                        setTimeout(() => { statusDiv.innerHTML = oldContent; }, 3000);
                    }
                };
            }
        });

        // C. Profile Form Submit
        form.onsubmit = async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btn-save-profile');
            const spinner = document.getElementById('save-spinner');
            const msg = document.getElementById('profile-save-msg');
            const btnText = document.getElementById('save-btn-text');

            btnSave.disabled = true;
            if (spinner) spinner.style.display = 'block';
            if (btnText) btnText.textContent = "Guardando...";

            const profileUpdate = {
                specialty: document.getElementById('prof-specialty').value,
                rate: parseFloat(document.getElementById('prof-rate').value) || 0,
                phone: document.getElementById('prof-phone').value,
                experience: document.getElementById('prof-experience').value
            };

            const res = await updateProfessionalProfile(AppState.user.uid, profileUpdate);
            if (res.success) {
                Object.assign(AppState.user, profileUpdate);
                if (msg) {
                    msg.textContent = "✅ ¡Perfil actualizado con éxito!";
                    msg.style.display = 'block';
                    msg.style.background = 'rgba(52, 211, 153, 0.1)';
                    msg.style.color = '#34D399';
                    setTimeout(() => { msg.style.display = 'none'; }, 4000);
                }
            } else {
                alert("Error al guardar perfil: " + res.error);
            }

            btnSave.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (btnText) btnText.textContent = "Guardar Cambios y Actualizar Perfil";
        };
    },

    initDashboardMap() {
        const mapDiv = document.getElementById('map-dashboard');
        if (!mapDiv) return;

        // Si el usuario tiene coordenadas propias, usarlas para centrar el mapa
        const centerLat = AppState.user?.lat || AppState.userLocation.lat;
        const centerLng = AppState.user?.lng || AppState.userLocation.lng;

        if (!this.dashboardMap) {
            console.log("📍 Inicializando Mapa de Radar (Taxi Style)...");
            this.dashboardMap = L.map('map-dashboard', {
                zoomControl: false,
                attributionControl: false
            }).setView([centerLat, centerLng], 15);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO'
            }).addTo(this.dashboardMap);

            // Marcador del Profesional (Punto Azul Pulsante)
            L.marker([centerLat, centerLng], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: `
                        <div style="position:relative; width:16px; height:16px;">
                            <div style="position:absolute; background:#2563EB; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(37,99,235,0.5); z-index:2;"></div>
                            <div style="position:absolute; background:#2563EB; width:16px; height:16px; border-radius:50%; opacity:0.4; animation: pulse-blue 2s infinite; z-index:1;"></div>
                        </div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(this.dashboardMap);
        } else {
            const existingMapContainer = this.dashboardMap.getContainer();
            if (existingMapContainer !== mapDiv) {
                mapDiv.appendChild(existingMapContainer);
            }
            this.dashboardMap.setView([centerLat, centerLng], 15);
            setTimeout(() => {
                this.dashboardMap.invalidateSize();
            }, 100);
        }

        // Iniciar Radar si no está activo
        this.startRadarListener();
    },

    startRadarListener() {
        if (AppState.radarListenerUnsubscribe) {
            AppState.radarListenerUnsubscribe();
        }
        if (AppState.companiesListenerUnsubscribe) AppState.companiesListenerUnsubscribe();

        // Cargar empresas EN TIEMPO REAL (onSnapshot)
        AppState.companiesListenerUnsubscribe = listenForAllCompanies((companies) => {
            if (!this.dashboardMap) return;

            // Limpiar marcadores de empresas anteriores
            AppState.radarMarkers = AppState.radarMarkers.filter(m => {
                if (!m._isSolicitudMarker) {
                    this.dashboardMap.removeLayer(m);
                    return false;
                }
                return true;
            });

            companies.forEach(company => {
                const marker = L.marker([company.lat, company.lng], {
                    icon: L.divIcon({
                        className: 'company-marker',
                        html: `<div style="background:#2563EB;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(37,99,235,0.5);font-size:0.8rem;">
                                   <i class="fa-solid fa-building"></i>
                               </div>`,
                        iconSize: [36, 36],
                        iconAnchor: [18, 18]
                    })
                }).addTo(this.dashboardMap);
                marker.bindPopup(`
                    <div style="font-family:'Inter',sans-serif;padding:4px;">
                        <strong style="display:block;font-size:0.85rem;margin-bottom:2px;"><i class="fa-solid fa-building"></i> ${company.name}</strong>
                        <span style="font-size:0.7rem;color:#64748B;">${company.email || 'Empresa registrada'}</span>
                    </div>
                `);
                AppState.radarMarkers.push(marker);
            });
            console.log(`🏢 [Radar Real-time] ${companies.length} empresas en el mapa.`);
        });

        AppState.radarListenerUnsubscribe = listenForAllPendingRequests((requests) => {
            console.log(`📡 [Radar] ${requests.length} solicitudes encontradas.`);

            // Limpiar solo marcadores de solicitudes (no los de empresas)
            AppState.radarMarkers = AppState.radarMarkers.filter(m => {
                if (m._isSolicitudMarker) {
                    this.dashboardMap.removeLayer(m);
                    return false;
                }
                return true;
            });

            requests.forEach(req => {
                if (req.lat && req.lng) {
                    // Crear un "Punto de Demanda" (Naranja)
                    const marker = L.circleMarker([req.lat, req.lng], {
                        radius: 8,
                        fillColor: "#F59E0B", // Ámbar
                        color: "#fff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(this.dashboardMap);

                    marker.bindPopup(`
                        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
                            <strong style="display:block; font-size: 0.85rem; margin-bottom: 2px;">Nueva Solicitud</strong>
                            <span style="font-size: 0.7rem; color: #64748B;">S/ ${req.profEarnings || (req.totalAmount * 0.75)} • ${req.days} días</span>
                        </div>
                    `);

                    // Marcar como solicitud para poder limpiarlos selectivamente
                    marker._isSolicitudMarker = true;
                }
            });
        });
    },

    renderPendingMissions(pendingRequests) {
        // Show all pending missions as cards in the sidebar with Accept/Reject buttons
        let pendingContainer = document.getElementById('pending-missions-list');
        if (!pendingContainer) {
            // Create the container if it doesn't exist
            const missionsSection = document.getElementById('missions-section');
            if (!missionsSection) return;
            const pendingSection = document.createElement('div');
            pendingSection.id = 'pending-missions-section';
            pendingSection.style.cssText = 'margin-bottom:16px;';
            missionsSection.parentNode.insertBefore(pendingSection, missionsSection);
            pendingSection.innerHTML = `
                <h3 style="color:#0F172A;font-size:0.9rem;margin-bottom:12px;padding-left:2px;font-weight:800;display:flex;align-items:center;gap:8px;">
                    <i class="fa-solid fa-bell" style="color:#F59E0B;"></i> Solicitudes Nuevas
                    <span id="pending-missions-badge" style="background:#EF4444;color:#fff;font-size:0.65rem;padding:2px 7px;border-radius:100px;">0</span>
                </h3>
                <div id="pending-missions-list"></div>
            `;
            pendingContainer = document.getElementById('pending-missions-list');
        }

        const badge = document.getElementById('pending-missions-badge');
        if (!pendingContainer) return;

        if (!pendingRequests || pendingRequests.length === 0) {
            if (badge) badge.style.display = 'none';
            pendingContainer.innerHTML = '';
            return;
        }

        if (badge) { badge.textContent = pendingRequests.length; badge.style.display = 'inline'; }

        pendingContainer.innerHTML = pendingRequests.map(req => {
            const earnings = req.profEarnings ? req.profEarnings.toFixed(2) : (Number(req.totalAmount || 0) * 0.85).toFixed(2);
            return `
            <div style="background:#FFFFFF;border:2px solid #F59E0B;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 4px 12px rgba(245,158,11,0.1);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div>
                        <strong style="font-size:0.9rem;color:#0F172A;">${req.clientName || '---'}</strong>
                        <p style="margin:2px 0 0;font-size:0.75rem;color:#64748B;">${req.address || (req.days + ' días')}</p>
                    </div>
                    <span style="font-size:1rem;font-weight:800;color:#10B981;">S/ ${earnings}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button class="btn-reject-pending" data-id="${req.id}"
                        style="background:transparent;color:#EF4444;border:1px solid rgba(239,68,68,0.3);padding:8px;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.8rem;">
                        ✕ Rechazar
                    </button>
                    <button class="btn-accept-pending" data-id="${req.id}" data-client="${req.clientName || ''}" data-phone="${req.clientPhone || ''}"
                        style="background:#FF7A00;color:#fff;border:none;padding:8px;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.8rem;">
                        ✓ Aceptar
                    </button>
                </div>
            </div>`;
        }).join('');

        // Bind events using data-attributes (no inline onclick needed)
        pendingContainer.querySelectorAll('.btn-reject-pending').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reqId = btn.dataset.id;
                btn.disabled = true;
                await updateServiceRequestStatus(reqId, 'rejected');
                this.loadDashboard();
            });
        });
        pendingContainer.querySelectorAll('.btn-accept-pending').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reqId = btn.dataset.id;
                const clientName = btn.dataset.client;
                const clientPhone = btn.dataset.phone;
                btn.disabled = true;
                btn.textContent = 'Aceptando...';
                const res = await updateServiceRequestStatus(reqId, 'accepted');
                if (res.success) {
                    const modal = document.getElementById('incoming-request-modal');
                    if (modal) modal.classList.remove('active');
                    const acceptedModal = document.getElementById('service-accepted-modal');
                    if (acceptedModal) {
                        const nameEl = document.getElementById('accepted-client-name');
                        if (nameEl) nameEl.textContent = clientName;
                        const waBtn = document.getElementById('btn-whatsapp-contact');
                        if (waBtn && clientPhone) waBtn.href = `https://wa.me/51${clientPhone}`;
                        acceptedModal.classList.add('active');
                    }
                    this.loadDashboard();
                }
            });
        });
    },

    showIncomingRequest(req) {
        const modal = document.getElementById('incoming-request-modal');
        if (!modal) return;

        const clientName = modal.querySelector('.req-row:nth-child(1) .value');
        const projectAddress = modal.querySelector('.req-row:nth-child(2) .value');
        const duration = modal.querySelector('.req-row:nth-child(3) .value');
        const totalAmount = modal.querySelector('.req-row.total .value');

        if (clientName) clientName.textContent = req.clientName;
        if (projectAddress) projectAddress.textContent = req.address || "Puno, Centro";
        if (duration) duration.textContent = `${req.days} Días`;

        if (totalAmount) {
            const earnings = req.profEarnings ? req.profEarnings.toFixed(2) : (req.totalAmount * 0.75).toFixed(2);
            totalAmount.textContent = `S/ ${earnings}`;
        }

        modal.classList.add('active');

        // Define global handlers that the inline onclick calls
        window.currentMissionReq = req;
        window.acceptMission = async (reqId, clientName, clientPhone) => {
            const targetId = reqId || (window.currentMissionReq && window.currentMissionReq.id);
            const targetClient = clientName || (window.currentMissionReq && window.currentMissionReq.clientName) || '---';
            const targetPhone = clientPhone || (window.currentMissionReq && window.currentMissionReq.clientPhone) || '';
            if (!targetId) return;
            const res = await updateServiceRequestStatus(targetId, 'accepted');
            if (res.success) {
                const modal = document.getElementById('incoming-request-modal');
                if (modal) modal.classList.remove('active');
                // Show success modal
                const acceptedModal = document.getElementById('service-accepted-modal');
                if (acceptedModal) {
                    const nameEl = document.getElementById('accepted-client-name');
                    if (nameEl) nameEl.textContent = targetClient;
                    const waBtn = document.getElementById('btn-whatsapp-contact');
                    if (waBtn && targetPhone) waBtn.href = `https://wa.me/51${targetPhone}`;
                    acceptedModal.classList.add('active');
                }
                this.loadDashboard();
            }
        };
        window.rejectMission = async (reqId) => {
            const targetId = reqId || (window.currentMissionReq && window.currentMissionReq.id);
            if (!targetId) return;
            await updateServiceRequestStatus(targetId, 'rejected');
            const modal = document.getElementById('incoming-request-modal');
            if (modal) modal.classList.remove('active');
            this.loadDashboard();
        };

        modal.classList.add('active');
    },

    renderAcceptedServices(services) {
        const listContainer = document.getElementById('accepted-services-list');
        if (!listContainer) return;

        if (!services || services.length === 0) {
            listContainer.innerHTML = '<p style="color:#64748B; font-size:0.8rem; text-align:center;">No hay misiones activas.</p>';
            return;
        }

        listContainer.innerHTML = services.map(req => {
            const earnings = req.profEarnings ? req.profEarnings.toFixed(2) : (Number(req.totalAmount || 0) * 0.85).toFixed(2);
            const datesHtml = (req.serviceDates && req.serviceDates.length > 0)
                ? `<div style="margin:6px 0 0;font-size:0.7rem;color:#2563EB;background:rgba(37,99,235,0.07);padding:4px 8px;border-radius:6px;">
                    <i class="fa-solid fa-calendar-days"></i> ${req.serviceDates.slice(0,3).join(' · ')}${req.serviceDates.length > 3 ? ` +${req.serviceDates.length - 3} más` : ''}
                  </div>`
                : '';
            return `
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                        <h4 style="color: #1E293B; margin: 0; font-size: 0.85rem; font-weight: 800;">${req.clientName}</h4>
                        <p style="color: #64748B; margin: 2px 0 0 0; font-size: 0.7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">
                            <i class="fa-solid fa-location-dot"></i> ${req.address || 'Puno'}
                        </p>
                        ${datesHtml}
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; color: #10B981; font-weight: 800; font-size: 0.8rem;">S/ ${earnings}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-open-chat-mission" data-reqid="${req.id}" data-othername="${req.clientName || 'Cliente'}" data-othertype="client"
                        style="flex:1; background:#2563EB; color:#fff; border:none; padding:8px; border-radius:8px; font-size:0.75rem; text-align:center; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;">
                        <i class="fa-solid fa-comments"></i> Chat
                    </button>
                    <button class="btn-complete-mission" data-id="${req.id}" style="flex:1; background:#FF7A00; color:#fff; border:none; padding:8px; border-radius:8px; font-size:0.75rem; font-weight:700; cursor:pointer; box-shadow: 0 4px 10px rgba(255,122,0,0.2);">
                        Finalizar
                    </button>
                </div>
            </div>`;
        }).join('');

        // Bind Complete Buttons
        listContainer.querySelectorAll('.btn-complete-mission').forEach(btn => {
            btn.onclick = async () => {
                const reqId = btn.getAttribute('data-id');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                const res = await updateServiceRequestStatus(reqId, 'completed');
                if (res.success) {
                    this.loadDashboard();
                } else {
                    btn.disabled = false;
                    btn.textContent = "Finalizar";
                }
            };
        });

        // Bind Chat Buttons in mission cards
        listContainer.querySelectorAll('.btn-open-chat-mission').forEach(btn => {
            btn.addEventListener('click', () => {
                const reqId = btn.dataset.reqid;
                const otherName = btn.dataset.othername;
                this.openChat(reqId, otherName);
            });
        });
    },

    openChat(reqId, otherName) {
        const modal = document.getElementById('chat-modal');
        if (!modal) return;

        // Set header
        const headerName = document.getElementById('chat-header-name');
        const headerSub = document.getElementById('chat-header-sub');
        if (headerName) headerName.textContent = `Chat con ${otherName}`;
        if (headerSub) headerSub.textContent = `Solicitud #${reqId.slice(-6).toUpperCase()}`;

        // Clear previous messages
        const messagesDiv = document.getElementById('chat-messages');
        if (messagesDiv) messagesDiv.innerHTML = '<p style="text-align:center;color:#94A3B8;font-size:0.8rem;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando mensajes...</p>';

        modal.classList.add('active');

        // Unsubscribe previous listener
        if (this._chatUnsubscribe) this._chatUnsubscribe();

        // Listen for messages in real-time
        this._chatUnsubscribe = listenForChatMessages(reqId, (messages) => {
            if (!messagesDiv) return;
            const myId = AppState.user?.uid;
            if (messages.length === 0) {
                messagesDiv.innerHTML = '<p style="text-align:center;color:#94A3B8;font-size:0.8rem;padding:20px;">Aún no hay mensajes. ¡Saluda primero!</p>';
                return;
            }
            messagesDiv.innerHTML = messages.map(msg => {
                const isMe = msg.senderId === myId;
                const time = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit'}) : '';
                return `
                <div style="display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'};">
                    <div style="max-width:78%;background:${isMe ? '#2563EB' : '#fff'};color:${isMe ? '#fff' : '#1E293B'};padding:10px 14px;border-radius:${isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};font-size:0.88rem;line-height:1.4;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                        ${!isMe ? `<span style="display:block;font-size:0.65rem;font-weight:800;color:#2563EB;margin-bottom:4px;">${msg.senderName || otherName}</span>` : ''}
                        ${msg.text}
                    </div>
                    <span style="font-size:0.6rem;color:#94A3B8;margin-top:3px;">${time}</span>
                </div>`;
            }).join('');
            // Auto-scroll to bottom
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });

        // Close button
        const closeBtn = document.getElementById('close-chat-modal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.classList.remove('active');
                if (this._chatUnsubscribe) { this._chatUnsubscribe(); this._chatUnsubscribe = null; }
            };
        }

        // Send button + Enter key
        const sendBtn = document.getElementById('btn-send-chat');
        const input = document.getElementById('chat-input');
        const doSend = async () => {
            const text = input?.value?.trim();
            if (!text) return;
            input.value = '';
            await sendChatMessage(reqId, AppState.user.uid, AppState.user.name || 'Usuario', text);
        };
        if (sendBtn) sendBtn.onclick = doSend;
        if (input) input.onkeydown = (e) => { if (e.key === 'Enter') doSend(); };

        // Wire chat button from service-accepted-modal
        const chatFromAccepted = document.getElementById('btn-chat-from-accepted');
        if (chatFromAccepted) {
            chatFromAccepted.onclick = () => {
                document.getElementById('service-accepted-modal')?.classList.remove('active');
                this.openChat(reqId, otherName);
            };
        }
    },

    async loadCheckout() {
        if (AppState.map) {
            AppState.map.off();
            AppState.map.remove();
            AppState.map = null;
        }

        if (!AppState.selectedProfessional) {
            Router.navigateTo('/');
            return;
        }

        document.getElementById('app').innerHTML = renderCheckout(AppState.selectedProfessional);

        // ═══ LÓGICA DEL CALENDARIO MULTI-DÍA ═══
        let currentMonth = new Date();
        let selectedDates = []; // Formato: "YYYY-MM-DD"
        let occupiedDates = []; // Fechas ya contratadas
        
        // Cargar fechas ocupadas desde Firebase
        const fetchOccupiedDates = async () => {
            try {
                const q = query(
                    collection(db, "requests"), 
                    where("professionalId", "==", AppState.selectedProfessional.id),
                    where("status", "==", "approved")
                );
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.serviceDates) {
                        occupiedDates.push(...data.serviceDates);
                    } else if (data.serviceDate) {
                        occupiedDates.push(data.serviceDate);
                    }
                });
                renderCal(); // Re-renderizar cuando tengamos los datos
            } catch (err) {
                console.error("Error cargando fechas ocupadas:", err);
            }
        };

        const renderCal = () => {
            const grid = document.getElementById('cal-grid');
            const label = document.getElementById('cal-month-label');
            if (!grid || !label) return;

            grid.innerHTML = '';
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const today = new Date();
            today.setHours(0,0,0,0);
            
            label.textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentMonth);

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let startingDay = firstDay === 0 ? 6 : firstDay - 1;

            for (let i = 0; i < startingDay; i++) {
                grid.innerHTML += '<div></div>';
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isSelected = selectedDates.includes(dateStr);
                const isOccupied = occupiedDates.includes(dateStr);
                const dateObj = new Date(year, month, d);
                const isSunday = dateObj.getDay() === 0;
                const isPast = dateObj < today;
                
                const dayEl = document.createElement('div');
                
                // Estilo base
                let bgColor = '#fff';
                let textColor = '#1E293B';
                let borderColor = '#E2E8F0';
                let cursor = 'pointer';
                let pointerEvents = 'auto';
                let opacity = '1';
                let labelExtra = '';

                if (isPast) {
                    bgColor = '#F1F5F9';
                    textColor = '#94A3B8';
                    cursor = 'default';
                    pointerEvents = 'none';
                    opacity = '0.6';
                } else if (isOccupied) {
                    bgColor = '#F1F5F9';
                    textColor = '#64748B';
                    borderColor = '#CBD5E1';
                    cursor = 'not-allowed';
                    pointerEvents = 'none';
                    labelExtra = '<span style="display:block; font-size:0.5rem; color:#EF4444; font-weight:800; margin-top:-2px;">OCUPADO</span>';
                } else if (isSelected) {
                    bgColor = '#FF7A00';
                    textColor = 'white';
                    borderColor = '#FF7A00';
                } else if (isSunday) {
                    bgColor = '#FEE2E2';
                    textColor = '#EF4444';
                    borderColor = '#FCA5A5';
                }

                dayEl.style.cssText = `
                    text-align:center; padding:8px 0; font-size:0.85rem; font-weight:600; border-radius:8px; 
                    cursor:${cursor}; transition:all 0.2s; background:${bgColor}; color:${textColor}; 
                    border:1px solid ${borderColor}; pointer-events:${pointerEvents}; opacity:${opacity};
                    display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:42px;
                `;
                
                dayEl.innerHTML = `<span>${d}</span>${labelExtra}`;
                
                dayEl.onclick = () => {
                    if (selectedDates.includes(dateStr)) {
                        selectedDates = selectedDates.filter(date => date !== dateStr);
                    } else {
                        selectedDates.push(dateStr);
                    }
                    renderCal();
                    updatePricing();
                };
                grid.appendChild(dayEl);
            }
        };

        const updatePricing = () => {
            const summaryList = document.getElementById('selected-days-list');
            const summaryContainer = document.getElementById('selected-days-summary');
            const subtotalEl = document.getElementById('calc-subtotal');
            const totalEl = document.getElementById('total-price');
            const daysLabel = document.getElementById('days-summary-label');
            const sundayRow = document.getElementById('sunday-row');
            const sundayCountEl = document.getElementById('sunday-count');
            const sundayExtraEl = document.getElementById('sunday-extra');

            if (!summaryList) return;

            summaryList.innerHTML = '';
            let subtotal = 0;
            let sundayExtra = 0;
            let sundayCount = 0;

            selectedDates.sort().forEach(dateStr => {
                const [y, m, d] = dateStr.split('-');
                const dateObj = new Date(y, m - 1, d);
                const isSunday = dateObj.getDay() === 0;
                const dayRate = AppState.selectedProfessional.rate;

                subtotal += dayRate;
                if (isSunday) {
                    sundayCount++;
                    sundayExtra += dayRate; // Se paga el doble (uno base + uno extra)
                }

                const pill = document.createElement('span');
                pill.style.cssText = 'background:rgba(255,122,0,0.1); color:#FF7A00; border:1px solid rgba(255,122,0,0.2); padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:700;';
                pill.innerHTML = `<i class="fa-solid fa-calendar-check"></i> ${d}/${m}`;
                summaryList.appendChild(pill);
            });

            summaryContainer.style.display = selectedDates.length > 0 ? 'block' : 'none';
            daysLabel.innerHTML = `Días seleccionados: <strong>${selectedDates.length}</strong>`;
            subtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;

            if (sundayCount > 0) {
                sundayRow.style.display = 'flex';
                sundayCountEl.textContent = sundayCount;
                sundayExtraEl.textContent = `+ S/ ${sundayExtra.toFixed(2)}`;
            } else {
                sundayRow.style.display = 'none';
            }

            const total = subtotal + sundayExtra;
            totalEl.textContent = `S/ ${total.toFixed(2)}`;
        };

        // Eventos de navegación del calendario
        document.getElementById('cal-prev').onclick = () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            renderCal();
        };
        document.getElementById('cal-next').onclick = () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            renderCal();
        };

        fetchOccupiedDates();
        renderCal();

        // Manejo del formulario
        const form = document.getElementById('checkout-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (selectedDates.length === 0) {
                    alert("Por favor, selecciona al menos un día en el calendario.");
                    return;
                }

                if (!AppState.user) {
                    alert("Debes iniciar sesión para solicitar un servicio.");
                    Router.navigateTo('/login');
                    return;
                }

                const btnSubmit = document.getElementById('btn-submit-request');
                const oldContent = btnSubmit.innerHTML;
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

                try {
                    const rate = AppState.selectedProfessional.rate;
                    let sundayCount = 0;
                    selectedDates.forEach(d => {
                        const dateObj = new Date(d);
                        if (dateObj.getDay() === 6) sundayCount++; // Date.getDay()=0 es domingo, pero en JS es 0-6. Ojo con el índice.
                    });
                    
                    // Recalcular domingos correctamente
                    let actualSundays = 0;
                    selectedDates.forEach(ds => {
                       const [y,m,d] = ds.split('-');
                       if (new Date(y, m-1, d).getDay() === 0) actualSundays++;
                    });

                    const subtotal = selectedDates.length * rate;
                    const sundayExtra = actualSundays * rate;
                    const total = subtotal + sundayExtra;

                    const requestData = {
                        professionalId: AppState.selectedProfessional.id,
                        professionalName: AppState.selectedProfessional.name,
                        clientId: AppState.user.uid,
                        clientName: document.getElementById('client-name').value,
                        clientEmail: document.getElementById('client-email').value,
                        clientPhone: document.getElementById('client-phone').value,
                        serviceDates: selectedDates, // Array de fechas
                        address: document.getElementById('project-address').value || '',
                        days: selectedDates.length,
                        totalAmount: total,
                        profEarnings: total, // 100% para el trabajador
                        adminCommission: 0, // Sin comisión por servicio
                        status: 'pending'
                    };

                    const result = await createServiceRequest(requestData);
                    if (result.success) {
                        // Crear el modal en document.body para que no sea destruido por el re-render del SPA
                        const existingModal = document.getElementById('dynamic-success-modal');
                        if (existingModal) existingModal.remove();

                        const profName = AppState.selectedProfessional?.name || 'el especialista';
                        const modalEl = document.createElement('div');
                        modalEl.id = 'dynamic-success-modal';
                        modalEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;backdrop-filter:blur(4px);';
                        modalEl.innerHTML = `
                            <div style="background:#1E293B;border-radius:20px;padding:40px 32px;max-width:460px;width:100%;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.6);max-height:90vh;overflow-y:auto;">
                                <div style="width:70px;height:70px;border-radius:50%;background:rgba(16,185,129,0.15);border:2px solid rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                                    <i class="fa-solid fa-check" style="font-size:2rem;color:#34D399;"></i>
                                </div>
                                <h2 style="font-size:1.6rem;color:#FFFFFF;margin:0 0 8px;">¡Solicitud Enviada!</h2>
                                <p style="color:#94A3B8;margin-bottom:24px;font-size:0.9rem;line-height:1.6;">
                                    Hemos notificado a <strong style="color:#FFFFFF;">${profName}</strong>. Ahora <strong style="color:#FF7A00;">realiza el pago</strong> para reservar el servicio:
                                </p>

                                <!-- INTERBANK -->
                                <div style="background:#0F172A;border:2px solid #FF7A00;border-radius:14px;padding:20px;text-align:left;margin-bottom:12px;">
                                    <p style="color:#94A3B8;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">🏦 BANCO</p>
                                    <p style="color:#fff;font-weight:800;font-size:1rem;margin:0 0 14px;">INTERBANK</p>
                                    <p style="color:#94A3B8;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">N° DE CUENTA</p>
                                    <p style="color:#FF7A00;font-weight:800;font-size:1.2rem;letter-spacing:2px;margin:0 0 14px;">898 3136153503</p>
                                    <p style="color:#94A3B8;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">CCI</p>
                                    <p style="color:#fff;font-weight:700;font-size:0.9rem;letter-spacing:1px;margin:0;">0038 9801 3136 1535 0345</p>
                                </div>

                                <!-- YAPE -->
                                <div style="background:#0F172A;border:2px solid #10B981;border-radius:14px;padding:16px;text-align:left;margin-bottom:12px;">
                                    <p style="color:#94A3B8;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">📱 YAPE</p>
                                    <p style="color:#10B981;font-weight:800;font-size:1.2rem;letter-spacing:2px;margin:0 0 4px;">915 079 361</p>
                                    <p style="color:#64748B;font-size:0.78rem;margin:0;">Gerson Enriquez Arauzo</p>
                                </div>

                                <!-- DECLARACIÓN JURADA -->
                                <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.35);border-radius:12px;padding:14px 16px;text-align:left;margin-bottom:20px;display:flex;align-items:flex-start;gap:10px;">
                                    <i class="fa-solid fa-file-signature" style="color:#F59E0B;flex-shrink:0;margin-top:2px;font-size:1rem;"></i>
                                    <p style="margin:0;color:#CBD5E1;font-size:0.82rem;line-height:1.55;"><strong style="color:#F59E0B;">Opción alternativa:</strong> Puedes adjuntar una <strong style="color:#F59E0B;">declaración jurada de pago</strong> al finalizar el servicio desde "Mis Solicitudes".</p>
                                </div>

                                <p style="color:#94A3B8;font-size:0.8rem;margin-bottom:24px;line-height:1.5;">
                                    Después de transferir, sube tu <strong style="color:#10B981;">voucher de pago</strong> desde "Mis Solicitudes" para que el admin lo verifique.
                                </p>

                                <button id="btn-go-home-modal" style="background:#FF7A00;color:white;border:none;padding:15px 28px;border-radius:12px;font-weight:800;font-size:1rem;cursor:pointer;width:100%;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.88" onmouseout="this.style.opacity=1">
                                    Ir al Panel Principal
                                </button>
                            </div>
                        `;
                        document.body.appendChild(modalEl);
                        document.getElementById('btn-go-home-modal').addEventListener('click', () => {
                            modalEl.remove();
                            Router.navigateTo('/');
                        });
                    } else {
                        throw new Error(result.error);
                    }
                } catch (err) {
                    alert("Error: " + err.message);
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = oldContent;
                }
            });
        }

        // Auto-llenar datos si está logueado
        if (AppState.user) {
            const nameInp = document.getElementById('client-name');
            const emailInp = document.getElementById('client-email');
            if (nameInp) nameInp.value = AppState.user.name || '';
            if (emailInp) emailInp.value = AppState.user.email || '';
        }
    },

    loadSeedPage() {
        if (AppState.map) { AppState.map.remove(); AppState.map = null; }
        document.getElementById('app').innerHTML = renderSeed();
        loadSeed();
    },

    async loadCertificados() {
        if (AppState.map) { AppState.map.remove(); AppState.map = null; }
        document.getElementById('app').innerHTML = renderCertificados();
        await bindCertificadosEvents();
    }
};

App.init();
