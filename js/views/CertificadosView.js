import { AppState } from '../state.js';
import Router from '../router.js';

const DEFAULT_COURSES = [
    {
        id: 'local-1', name: 'Prevención de Riesgos', icon: 'fa-hard-hat',
        questions: [
            { text: '¿Qué significa EPP?', correctOption: 'b', options: [{id:'a',text:'Equipo Personal Permanente'},{id:'b',text:'Equipo de Protección Personal'},{id:'c',text:'Equipo de Prevención Primaria'}] },
            { text: '¿Cada cuánto se revisan los extintores?', correctOption: 'a', options: [{id:'a',text:'Anualmente'},{id:'b',text:'Cada 5 años'},{id:'c',text:'Solo cuando se usan'}] },
            { text: '¿Qué es una ATS?', correctOption: 'c', options: [{id:'a',text:'Análisis de Tareas Simples'},{id:'b',text:'Auditoría de Trabajo Seguro'},{id:'c',text:'Análisis de Trabajo Seguro'}] }
        ]
    },
    {
        id: 'local-2', name: 'Trabajo en Altura', icon: 'fa-mountain',
        questions: [
            { text: '¿A partir de qué altura se considera trabajo en altura?', correctOption: 'b', options: [{id:'a',text:'1 metro'},{id:'b',text:'1.8 metros'},{id:'c',text:'3 metros'}] },
            { text: '¿Qué equipo es obligatorio en altura?', correctOption: 'a', options: [{id:'a',text:'Arnés de seguridad'},{id:'b',text:'Casco solamente'},{id:'c',text:'Guantes de cuero'}] },
            { text: '¿Qué es el punto de anclaje?', correctOption: 'c', options: [{id:'a',text:'El punto más alto'},{id:'b',text:'La línea de vida'},{id:'c',text:'Punto de conexión del anticaídas'}] }
        ]
    },
    {
        id: 'local-3', name: 'Trabajos Eléctricos', icon: 'fa-bolt',
        questions: [
            { text: '¿Qué es LOTO?', correctOption: 'a', options: [{id:'a',text:'Lockout/Tagout - bloqueo y etiquetado'},{id:'b',text:'Lista de Operaciones Técnicas'},{id:'c',text:'Logística de Trabajos'}] },
            { text: '¿Cuántos voltios tiene la red domiciliaria en Perú?', correctOption: 'b', options: [{id:'a',text:'110 V'},{id:'b',text:'220 V'},{id:'c',text:'380 V'}] },
            { text: '¿Qué guantes se usan en trabajos eléctricos?', correctOption: 'c', options: [{id:'a',text:'Guantes de cuero'},{id:'b',text:'Guantes de nitrilo'},{id:'c',text:'Guantes dieléctricos'}] }
        ]
    }
];

export function renderCertificados() {
    return `
    <div style="min-height:100vh; background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%); padding:24px 16px; font-family:'Plus Jakarta Sans',sans-serif;">

        <!-- Header -->
        <div style="max-width:640px; margin:0 auto;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:32px;">
                <button id="cert-back-home" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; width:40px; height:40px; border-radius:50%; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <h1 style="color:#fff; font-size:1.4rem; font-weight:800; margin:0;">Portal de Certificaciones</h1>
                    <p style="color:#94A3B8; font-size:0.8rem; margin:0;">J&A SafeWork</p>
                </div>
            </div>

            <!-- Tabs -->
            <div style="display:flex; background:rgba(255,255,255,0.05); border-radius:16px; padding:4px; margin-bottom:24px; gap:4px;">
                <button id="tab-obtener" onclick="switchCertTab('obtener')" style="flex:1; padding:12px; border-radius:12px; border:none; background:#2563EB; color:#fff; font-weight:700; font-size:0.9rem; cursor:pointer;">
                    <i class="fa-solid fa-graduation-cap"></i> Obtener Certificado
                </button>
                <button id="tab-verificar" onclick="switchCertTab('verificar')" style="flex:1; padding:12px; border-radius:12px; border:none; background:transparent; color:#94A3B8; font-weight:700; font-size:0.9rem; cursor:pointer;">
                    <i class="fa-solid fa-magnifying-glass"></i> Verificar Certificado
                </button>
            </div>

            <!-- Panel: Obtener Certificado -->
            <div id="panel-obtener">
                <!-- Step 1: Selección de curso -->
                <div id="step-1">
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:24px; margin-bottom:16px;">
                        <h2 style="color:#fff; font-size:1.1rem; font-weight:800; margin:0 0 8px 0;">Obtén tu Certificado Oficial</h2>
                        <p style="color:#94A3B8; font-size:0.85rem; margin:0 0 20px 0;">Selecciona el tipo de certificado y completa el examen. Costo de emisión: <strong style="color:#fff;">S/ 35.00</strong></p>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;" id="course-grid">
                            <!-- Cursos renderizados por JS -->
                        </div>
                    </div>
                </div>

                <!-- Step 2: Quiz -->
                <div id="step-2" style="display:none;">
                    <div style="background:#fff; border-radius:20px; padding:24px; margin-bottom:16px;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
                            <button onclick="goStep(1)" style="background:#F1F5F9; border:none; padding:8px 14px; border-radius:8px; font-size:0.8rem; font-weight:700; cursor:pointer; color:#475569;">← Volver</button>
                            <h2 style="color:#0F172A; font-size:1.1rem; font-weight:800; margin:0;" id="quiz-title">Examen</h2>
                        </div>
                        <div id="quiz-questions" style="display:flex; flex-direction:column; gap:20px;"></div>
                        <div id="quiz-error" style="display:none; background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:12px; margin-top:16px; color:#DC2626; font-size:0.85rem; font-weight:700; text-align:center;">
                            ❌ Respuestas incorrectas. Revisa e intenta de nuevo.
                        </div>
                        <button onclick="submitQuiz()" style="width:100%; margin-top:20px; padding:14px; background:#2563EB; color:#fff; border:none; border-radius:12px; font-weight:800; font-size:1rem; cursor:pointer;">
                            Evaluar Respuestas
                        </button>
                    </div>
                </div>

                <!-- Step 3: Aprobado -->
                <div id="step-3" style="display:none;">
                    <div style="background:#fff; border-radius:20px; padding:32px; text-align:center; margin-bottom:16px;">
                        <div style="width:70px; height:70px; background:#DCFCE7; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem; color:#16A34A; margin:0 auto 16px;">✓</div>
                        <h2 style="color:#166534; font-size:1.4rem; font-weight:800; margin:0 0 8px 0;">¡Examen Aprobado!</h2>
                        <p style="color:#64748B; margin:0 0 24px 0;">Ahora realiza el pago para emitir tu certificado.</p>
                        <button onclick="goStep(4)" style="width:100%; padding:14px; background:#10B981; color:#fff; border:none; border-radius:12px; font-weight:800; font-size:1rem; cursor:pointer;">
                            Continuar al Pago →
                        </button>
                    </div>
                </div>

                <!-- Step 4: Pago -->
                <div id="step-4" style="display:none;">
                    <div style="background:#fff; border-radius:20px; padding:24px; margin-bottom:16px;">
                        <h2 style="color:#0F172A; font-size:1.1rem; font-weight:800; margin:0 0 16px 0;">Emisión de Certificado — S/ 35.00</h2>
                        <div style="display:flex; gap:8px; margin-bottom:16px;">
                            <div style="flex:1; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px; text-align:center;">
                                <div style="font-size:0.65rem; font-weight:900; color:#94A3B8; margin-bottom:4px;">INTERBANK</div>
                                <div style="font-weight:800; font-size:0.8rem; color:#0F172A;">898 3432134 43 2</div>
                            </div>
                            <div style="flex:1; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px; text-align:center;">
                                <div style="font-size:0.65rem; font-weight:900; color:#94A3B8; margin-bottom:4px;">YAPE / PLIN</div>
                                <div style="font-weight:800; font-size:0.8rem; color:#0F172A;">942 225 352</div>
                            </div>
                        </div>
                        <label style="display:block; font-size:0.85rem; font-weight:700; color:#475569; margin-bottom:8px;">Sube tu comprobante de pago:</label>
                        <input type="file" id="voucher-file" accept="image/*" style="width:100%; box-sizing:border-box; padding:10px; border:2px dashed #CBD5E1; border-radius:8px; font-size:0.85rem; cursor:pointer; margin-bottom:16px;">
                        <button onclick="submitCertRequest()" id="btn-submit-cert" style="width:100%; padding:14px; background:#10B981; color:#fff; border:none; border-radius:12px; font-weight:800; font-size:1rem; cursor:pointer;">
                            Enviar Solicitud
                        </button>
                    </div>
                </div>

                <!-- Step 5: Enviado -->
                <div id="step-5" style="display:none;">
                    <div style="background:#fff; border-radius:20px; padding:32px; text-align:center;">
                        <div style="font-size:3rem; margin-bottom:16px;">🎓</div>
                        <h2 style="color:#0F172A; font-size:1.3rem; font-weight:800; margin:0 0 12px 0;">¡Solicitud Enviada!</h2>
                        <p style="color:#64748B; line-height:1.6; margin:0 0 24px 0;">Hemos recibido tu examen y comprobante. Un administrador validará el pago y emitirá tu certificado con código QR.</p>
                        <button onclick="window.location.hash='/'" style="padding:12px 28px; background:#2563EB; color:#fff; border:none; border-radius:12px; font-weight:700; cursor:pointer;">
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            </div>

            <!-- Panel: Verificar Certificado -->
            <div id="panel-verificar" style="display:none;">
                <div style="background:#fff; border-radius:20px; padding:24px;">
                    <h2 style="color:#0F172A; font-size:1.1rem; font-weight:800; margin:0 0 8px 0;">Verificar Autenticidad</h2>
                    <p style="color:#64748B; font-size:0.85rem; margin:0 0 20px 0;">Ingresa el DNI o código único del certificado.</p>
                    <input type="text" id="verify-input" placeholder="Ej: 12345678 o CERT-2026-X" style="width:100%; box-sizing:border-box; padding:12px; border:1px solid #CBD5E1; border-radius:10px; font-size:1rem; margin-bottom:12px; outline:none;">
                    <button onclick="verifyCert()" style="width:100%; padding:14px; background:#10B981; color:#fff; border:none; border-radius:12px; font-weight:800; font-size:1rem; cursor:pointer;">
                        <i class="fa-solid fa-magnifying-glass"></i> Verificar
                    </button>
                    <div id="verify-result" style="margin-top:16px; display:none;"></div>
                </div>
            </div>
        </div>
    </div>`;
}

export async function bindCertificadosEvents() {
    // Botón volver
    document.getElementById('cert-back-home')?.addEventListener('click', () => {
        Router.navigateTo('/');
    });

    // Renderizar cursos desde Firestore (con fallback a DEFAULT_COURSES)
    const grid = document.getElementById('course-grid');
    if (grid) {
        // Mostrar cursos en caché o locales inmediatamente
        let courses = AppState.certificateCourses?.length ? AppState.certificateCourses : DEFAULT_COURSES;
        AppState.certificateCourses = courses;
        renderCourseGrid(grid, courses);

        // Intentar cargar cursos actualizados desde Firestore en segundo plano
        try {
            const { db } = await import('../services/firebase.js');
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
            const snapshot = await getDocs(collection(db, 'certificate_courses'));
            if (!snapshot.empty) {
                const remoteCourses = [];
                snapshot.forEach(d => remoteCourses.push({ id: d.id, ...d.data() }));
                const active = remoteCourses.filter(c => c.isActive !== false);
                if (active.length > 0) {
                    AppState.certificateCourses = active;
                    // Actualizar la grilla con los cursos reales de Firestore
                    grid.innerHTML = '';
                    renderCourseGrid(grid, active);
                }
            }
        } catch (err) {
            console.warn('[CertificadosView] Firestore no disponible, usando cursos locales:', err.message);
        }
    }

    // Exponer funciones globales necesarias
    window.switchCertTab = (tab) => {
        const isObtener = tab === 'obtener';
        document.getElementById('panel-obtener').style.display = isObtener ? 'block' : 'none';
        document.getElementById('panel-verificar').style.display = isObtener ? 'none' : 'block';
        document.getElementById('tab-obtener').style.background = isObtener ? '#2563EB' : 'transparent';
        document.getElementById('tab-obtener').style.color = isObtener ? '#fff' : '#94A3B8';
        document.getElementById('tab-verificar').style.background = isObtener ? 'transparent' : '#10B981';
        document.getElementById('tab-verificar').style.color = isObtener ? '#94A3B8' : '#fff';
    };

    window.goStep = (n) => {
        [1,2,3,4,5].forEach(i => {
            const el = document.getElementById(`step-${i}`);
            if (el) el.style.display = i === n ? 'block' : 'none';
        });
    };

    window.submitQuiz = () => {
        const questions = document.querySelectorAll('.cert-question');
        let allCorrect = true;
        questions.forEach((q, i) => {
            const correct = q.dataset.correct;
            const selected = document.querySelector(`input[name="cq${i}"]:checked`)?.value;
            if (selected !== correct) allCorrect = false;
        });
        document.getElementById('quiz-error').style.display = allCorrect ? 'none' : 'block';
        if (allCorrect) window.goStep(3);
    };

    window.submitCertRequest = async () => {
        const file = document.getElementById('voucher-file').files[0];
        if (!file) { alert('Selecciona el comprobante de pago.'); return; }
        if (!AppState.user) { alert('Debes iniciar sesión para solicitar el certificado.'); Router.navigateTo('/login'); return; }
        const btn = document.getElementById('btn-submit-cert');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
        btn.disabled = true;
        try {
            const { uploadCertificateVoucher } = await import('../services/database.mjs');
            const courseName = AppState.selectedCertCourse?.name || 'Curso General';
            const result = await uploadCertificateVoucher(AppState.user.uid, file, AppState.user.name, AppState.user.dni || '', courseName);
            if (result.success) { window.goStep(5); }
            else { alert('Error: ' + result.error); btn.innerHTML = 'Enviar Solicitud'; btn.disabled = false; }
        } catch(e) { alert('Error: ' + e.message); btn.innerHTML = 'Enviar Solicitud'; btn.disabled = false; }
    };

    window.verifyCert = async () => {
        const val = document.getElementById('verify-input').value.trim();
        if (!val) { alert('Ingresa un DNI o código válido'); return; }
        const resultDiv = document.getElementById('verify-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div style="text-align:center; padding:20px; color:#64748B;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando...</div>';
        try {
            const { searchCertificate } = await import('../services/database.mjs');
            const r = await searchCertificate(val);
            if (r.success) {
                const cert = r.certificate;
                const parseDate = (d) => {
                    if (!d) return null;
                    if (d.seconds) return new Date(d.seconds * 1000).toLocaleDateString('es-PE');
                    // Si es string "YYYY-MM-DD"
                    const parts = d.split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    return d;
                };
                const date       = parseDate(cert.issueDate) || 'N/A';
                const expiryDate = parseDate(cert.expiryDate) || null;
                const pdfBtn = cert.pdfUrl
                    ? `<a href="${cert.pdfUrl}" target="_blank"
                          style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;
                                 background:#2563EB;color:#fff;padding:12px 24px;border-radius:10px;
                                 font-weight:800;font-size:0.9rem;text-decoration:none;
                                 box-shadow:0 4px 12px rgba(37,99,235,0.35);">
                          <i class="fa-solid fa-file-pdf"></i> Ver Certificado PDF
                       </a>`
                    : '';
                resultDiv.innerHTML = `
                    <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:16px; padding:24px; text-align:center;">
                        <i class="fa-solid fa-circle-check" style="color:#16A34A; font-size:2.8rem; margin-bottom:12px; display:block;"></i>
                        <h3 style="color:#166534; margin:0 0 16px 0; font-size:1.2rem;">Certificado Válido ✓</h3>
                        <div style="background:#fff; border-radius:10px; padding:16px; text-align:left; margin-bottom:4px; border:1px solid #DCFCE7;">
                            <p style="margin:6px 0; color:#1E293B; font-size:0.9rem;">
                                <i class="fa-solid fa-user" style="color:#16A34A; width:16px;"></i>
                                <strong> Titular:</strong> ${cert.userName || 'N/A'}
                            </p>
                            ${cert.userDni ? `<p style="margin:6px 0; color:#1E293B; font-size:0.9rem;">
                                <i class="fa-solid fa-id-card" style="color:#16A34A; width:16px;"></i>
                                <strong> DNI:</strong> ${cert.userDni}
                            </p>` : ''}
                            <p style="margin:6px 0; color:#1E293B; font-size:0.9rem;">
                                <i class="fa-solid fa-graduation-cap" style="color:#16A34A; width:16px;"></i>
                                <strong> Curso:</strong> ${cert.courseName || 'N/A'}
                            </p>
                            <p style="margin:6px 0; color:#1E293B; font-size:0.9rem;">
                                <i class="fa-solid fa-calendar-check" style="color:#16A34A; width:16px;"></i>
                                <strong> Emitido:</strong> ${date}
                            </p>
                            ${expiryDate ? `<p style="margin:6px 0; color:#1E293B; font-size:0.9rem;">
                                <i class="fa-solid fa-calendar-xmark" style="color:#F59E0B; width:16px;"></i>
                                <strong> Vence:</strong> ${expiryDate}
                            </p>` : ''}
                            <p style="margin:6px 0; color:#64748B; font-size:0.8rem; font-family:monospace;">
                                <i class="fa-solid fa-qrcode" style="width:16px;"></i>
                                Código: ${cert.uniqueCode || 'N/A'}
                            </p>
                        </div>
                        ${pdfBtn}
                    </div>`;
            } else {
                resultDiv.innerHTML = `<div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; padding:20px; text-align:center; color:#DC2626;">
                    <i class="fa-solid fa-circle-xmark" style="font-size:2rem; margin-bottom:8px;"></i>
                    <p style="margin:0; font-weight:700;">No encontrado</p>
                    <p style="margin:4px 0; font-size:0.85rem;">${r.error}</p>
                </div>`;
            }
        } catch(e) {
            resultDiv.innerHTML = `<div style="color:#DC2626; text-align:center;">Error al verificar: ${e.message}</div>`;
        }
    };

    // =============================================
    // AUTO-VERIFICAR SI HAY ?verify= EN LA URL
    // (resultado de escanear el QR del certificado)
    // =============================================
    const hashParts = window.location.hash.split('?');
    const urlParams = new URLSearchParams(hashParts[1] || '');
    const autoCode  = urlParams.get('verify');
    if (autoCode) {
        window.switchCertTab('verificar');
        const input = document.getElementById('verify-input');
        if (input) {
            input.value = autoCode;
            setTimeout(() => window.verifyCert && window.verifyCert(), 300);
        }
    }
}

function renderCourseGrid(grid, courses) {
    courses.forEach(course => {
        const btn = document.createElement('button');
        btn.style.cssText = 'padding:16px 12px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:14px; color:#fff; font-size:0.85rem; font-weight:700; cursor:pointer; text-align:center; transition:all 0.2s;';
        btn.innerHTML = `<i class="fa-solid ${course.icon||'fa-certificate'}" style="font-size:1.5rem; display:block; margin-bottom:8px; color:#60A5FA;"></i>${course.name}`;
        btn.addEventListener('click', () => selectCourse(course));
        btn.addEventListener('mouseenter', () => { btn.style.background='rgba(255,255,255,0.15)'; btn.style.borderColor='rgba(255,255,255,0.3)'; });
        btn.addEventListener('mouseleave', () => { btn.style.background='rgba(255,255,255,0.08)'; btn.style.borderColor='rgba(255,255,255,0.15)'; });
        grid.appendChild(btn);
    });
}

function selectCourse(course) {
    AppState.selectedCertCourse = course;
    const qContainer = document.getElementById('quiz-questions');
    const title = document.getElementById('quiz-title');
    if (title) title.textContent = course.name;
    if (qContainer) {
        qContainer.innerHTML = '';
        (course.questions || []).forEach((q, i) => {
            const div = document.createElement('div');
            div.className = 'cert-question';
            div.dataset.correct = q.correctOption;
            div.style.cssText = 'background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px;';
            let opts = q.options.map(o =>
                `<label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;color:#475569;margin-bottom:8px;cursor:pointer;">
                    <input type="radio" name="cq${i}" value="${o.id}"> ${o.text}
                </label>`
            ).join('');
            div.innerHTML = `<p style="font-weight:700;color:#1E293B;font-size:0.95rem;margin:0 0 12px 0;">${i+1}. ${q.text}</p>${opts}`;
            qContainer.appendChild(div);
        });
    }
    window.goStep(2);
}
