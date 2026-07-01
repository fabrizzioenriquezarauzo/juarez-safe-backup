import { AppState } from './state.js';
import Router from './router.js';
import { renderAdminDashboard } from './views/AdminDashboardView.js';
import { 
    approvePayment, 
    updateServiceRequestStatus, 
    markServiceAsPaid, 
    updateProfessionalStatus,
    updateCompanyStatus,
    markWithdrawalAsPaid,
    deleteWithdrawalRecord,
    uploadProfessionalVoucher,
    deleteServiceRequest,
    deleteProfessional,
    updateCompanyMembershipStatus,
    approveMembershipPayment
} from './services/database.js';
import { logoutUser } from './services/auth.js';

export const AdminController = {
    isProcessing: false,
    loadAdminDashboard() {
        if (!AppState.user || AppState.user.userType !== 'admin') {
            Router.navigateTo('/login');
            return;
        }

        // Cleanup old listeners
        if (AppState.adminListeners) {
            AppState.adminListeners.forEach(unsub => unsub());
        }
        AppState.adminListeners = [];

        let pendingMemberships = null;
        let completed = null;
        let professionals = null;
        let pendingWithdrawals = [];
        let ongoingContracts = null;
        let companies = null;
        let finishedHistory = null;
        let withdrawalHistory = [];
        let pendingCertificates = null; // NUEVO
        let certificateCourses = null; // NUEVO
        let issuedCertificates = []; // Certificados emitidos (status: active)

        let renderTimeout = null;
        const renderBoth = () => {
            if (this.isProcessing) return; // BLOQUEO: No renderizar si estamos procesando algo
            
            if (renderTimeout) clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                const appElement = document.getElementById('app');
                if (!appElement) return;
                
                appElement.innerHTML = renderAdminDashboard(
                    AppState.user, 
                    pendingMemberships, 
                    completed, 
                    professionals, 
                    pendingWithdrawals, 
                    ongoingContracts, 
                    companies, 
                    finishedHistory, 
                    withdrawalHistory,
                    pendingCertificates,
                    certificateCourses,
                    issuedCertificates
                );
                this.bindAdminEvents(renderBoth);
            }, 1000); // 1s debounce para mayor estabilidad
        };

        // Initial loading state
        renderBoth();

        import('./services/database.mjs?v=MAY10B').then(({ 
            listenForPendingMemberships, 
            listenForCompletedServices, 
            getProfessionalsForAdmin, 
            getPendingWithdrawals, 
            listenForOngoingContracts, 
            getCompaniesForAdmin, 
            listenForFinishedHistory, 
            listenForWithdrawalHistory,
            listenForPendingCertificates,
            onCertificateCoursesChanged,
            listenForIssuedCertificates
        }) => {
            const unsub1 = listenForPendingMemberships((data) => { pendingMemberships = data; renderBoth(); });
            const unsub2 = listenForCompletedServices((data) => { completed = data; renderBoth(); });
            const unsub3 = listenForOngoingContracts((data) => { ongoingContracts = data; renderBoth(); });
            const unsub4 = listenForFinishedHistory((data) => { finishedHistory = data; renderBoth(); });
            const unsubWithdrawHistory = listenForWithdrawalHistory((data) => { withdrawalHistory = data; renderBoth(); });
            const unsubCertificates = listenForPendingCertificates((data) => { pendingCertificates = data; renderBoth(); });
            const unsubCourses = onCertificateCoursesChanged((data) => { certificateCourses = data; renderBoth(); });
            const unsubIssued = listenForIssuedCertificates((data) => { issuedCertificates = data; renderBoth(); });
            
            getProfessionalsForAdmin().then(data => { professionals = data; renderBoth(); });
            getPendingWithdrawals().then(data => { pendingWithdrawals = data; renderBoth(); });
            getCompaniesForAdmin().then(data => { companies = data; renderBoth(); });

            AppState.adminListeners.push(unsub1, unsub2, unsub3, unsub4, unsubWithdrawHistory, unsubCertificates, unsubCourses, unsubIssued);
        }).catch(err => console.error("Error loading admin database module:", err));

        // Pasar la función de renderizado a los eventos
        this.bindAdminEvents(renderBoth);
    },

    bindAdminEvents(renderBoth) {
        const safeRender = () => { if (renderBoth) renderBoth(); };

        // Abrir Modal de Ganancias
        const btnViewComm = document.getElementById('btn-view-commissions');
        const modalComm = document.getElementById('commissions-modal');
        if (btnViewComm && modalComm) {
            btnViewComm.addEventListener('click', () => {
                modalComm.style.display = 'flex';
            });
        }

        // Cerrar Modal de Ganancias
        const btnCloseComm = document.getElementById('btn-close-commissions');
        if (btnCloseComm && modalComm) {
            btnCloseComm.addEventListener('click', () => {
                modalComm.style.display = 'none';
            });
        }

        // Logout
        const btnLogout = document.getElementById('btn-logout-admin');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                if (AppState.adminListeners) {
                    AppState.adminListeners.forEach(unsub => unsub());
                }
                await logoutUser();
                Router.navigateTo('/login');
            });
        }

        // Approve Membership Payment
        document.querySelectorAll('.btn-approve-membership-pay').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reqId = e.currentTarget.dataset.id;
                const companyId = e.currentTarget.dataset.companyid;
                this.isProcessing = true;
                if (confirm("¿Aprobar el pago de membresía de esta empresa? (Esto activará su membresía por 30 días)")) {
                    await approveMembershipPayment(reqId, companyId);
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Reject Payment (Vouchers Clientes)
        document.querySelectorAll('.btn-reject-pay').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reqId = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Rechazar este pago?")) {
                    await updateServiceRequestStatus(reqId, 'awaiting_payment');
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // GESTIÓN DE CURSOS DE CERTIFICACIÓN
        document.querySelectorAll('.btn-delete-course').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const courseId = e.currentTarget.dataset.id;
                if (confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
                    import('./services/database.mjs?v=MAY10B').then(async ({ deleteCertificateCourse }) => {
                        await deleteCertificateCourse(courseId);
                        // safeRender is called via the onSnapshot listener automatically
                    });
                }
            });
        });

        const openCourseModal = (course = null) => {
            const existingModal = document.getElementById('course-edit-modal');
            if (existingModal) existingModal.remove();

            const isEdit = !!course;
            const courseData = course || { name: '', icon: 'fa-certificate', isActive: true, questions: [] };
            
            const modalHTML = `
            <div id="course-edit-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">
                <div style="background:#fff;padding:32px;border-radius:16px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;">
                    <h3 style="margin-top:0;font-size:1.4rem;color:#0F172A;">${isEdit ? 'Editar Curso' : 'Nuevo Curso'}</h3>
                    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
                        <label style="font-size:0.85rem;font-weight:700;color:#475569;">Nombre del Curso
                            <input type="text" id="ce-name" style="width:100%;padding:10px;border-radius:8px;border:1px solid #CBD5E1;margin-top:6px;" value="${courseData.name}">
                        </label>
                        <label style="font-size:0.85rem;font-weight:700;color:#475569;">Ícono (clase FontAwesome, ej. fa-fire)
                            <input type="text" id="ce-icon" style="width:100%;padding:10px;border-radius:8px;border:1px solid #CBD5E1;margin-top:6px;" value="${courseData.icon}">
                        </label>
                        <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;font-weight:700;color:#475569;">
                            <input type="checkbox" id="ce-active" ${courseData.isActive ? 'checked' : ''} style="width:16px;height:16px;"> Curso Activo
                        </label>
                    </div>
                    
                    <h4 style="margin:24px 0 12px 0;font-size:1.1rem;color:#1E293B;">Preguntas del Examen</h4>
                    <div id="ce-questions-container" style="display:flex;flex-direction:column;gap:16px;margin-bottom:20px;">
                        <!-- Preguntas aquí -->
                    </div>
                    <button id="btn-ce-add-q" style="background:#F1F5F9;color:#2563EB;border:none;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer;margin-bottom:24px;width:100%;"><i class="fa-solid fa-plus"></i> Añadir Pregunta</button>

                    <div style="display:flex;justify-content:flex-end;gap:12px;border-top:1px solid #E2E8F0;padding-top:20px;">
                        <button id="btn-ce-cancel" style="background:#F1F5F9;color:#475569;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:700;">Cancelar</button>
                        <button id="btn-ce-save" style="background:#10B981;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:800;">Guardar Curso</button>
                    </div>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            let currentQuestions = JSON.parse(JSON.stringify(courseData.questions || []));

            const renderQuestions = () => {
                const container = document.getElementById('ce-questions-container');
                container.innerHTML = currentQuestions.map((q, i) => `
                    <div style="background:#F8FAFC;border:1px solid #E2E8F0;padding:16px;border-radius:8px;position:relative;">
                        <button class="btn-ce-del-q" data-index="${i}" style="position:absolute;top:16px;right:16px;background:#FEE2E2;border:none;color:#EF4444;width:28px;height:28px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-times"></i></button>
                        <input type="text" class="ce-q-text" data-index="${i}" value="${q.text}" placeholder="Escribe la pregunta..." style="width:calc(100% - 40px);padding:10px;border-radius:8px;border:1px solid #CBD5E1;margin-bottom:12px;font-weight:600;">
                        <div style="display:flex;flex-direction:column;gap:8px;padding-left:16px;">
                            ${(q.options || [ {id:'A',text:''}, {id:'B',text:''}, {id:'C',text:''} ]).map(opt => `
                                <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;">
                                    <input type="radio" name="ce-q-correct-${i}" value="${opt.id}" ${q.correctOption===opt.id?'checked':''}>
                                    <span style="font-weight:700;">${opt.id}:</span> 
                                    <input type="text" class="ce-q-opt" data-qindex="${i}" data-optid="${opt.id}" value="${opt.text}" style="width:100%;padding:8px;border-radius:6px;border:1px solid #E2E8F0;">
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            };

            renderQuestions();

            // Eventos del modal
            document.getElementById('ce-questions-container').addEventListener('input', (e) => {
                if (e.target.classList.contains('ce-q-text')) {
                    currentQuestions[e.target.dataset.index].text = e.target.value;
                }
                if (e.target.classList.contains('ce-q-opt')) {
                    const qIdx = e.target.dataset.qindex;
                    const optId = e.target.dataset.optid;
                    const opt = currentQuestions[qIdx].options.find(o => o.id === optId);
                    if (opt) opt.text = e.target.value;
                }
            });

            document.getElementById('ce-questions-container').addEventListener('change', (e) => {
                if (e.target.type === 'radio' && e.target.name.startsWith('ce-q-correct-')) {
                    const qIdx = e.target.name.split('-')[3];
                    currentQuestions[qIdx].correctOption = e.target.value;
                }
            });

            document.getElementById('ce-questions-container').addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-ce-del-q');
                if (btn) {
                    currentQuestions.splice(btn.dataset.index, 1);
                    renderQuestions();
                }
            });

            document.getElementById('btn-ce-add-q').addEventListener('click', () => {
                currentQuestions.push({
                    text: '',
                    options: [ {id:'A',text:''}, {id:'B',text:''}, {id:'C',text:''} ],
                    correctOption: 'A'
                });
                renderQuestions();
            });

            document.getElementById('btn-ce-cancel').addEventListener('click', () => {
                document.getElementById('course-edit-modal').remove();
            });

            document.getElementById('btn-ce-save').addEventListener('click', async () => {
                const name = document.getElementById('ce-name').value;
                const icon = document.getElementById('ce-icon').value;
                const isActive = document.getElementById('ce-active').checked;
                
                if (!name.trim()) return alert("El nombre es obligatorio");

                const btnSave = document.getElementById('btn-ce-save');
                btnSave.disabled = true;
                btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

                const finalData = { name, icon, isActive, questions: currentQuestions };
                
                import('./services/database.mjs?v=MAY10B').then(async ({ addCertificateCourse, updateCertificateCourse }) => {
                    let result;
                    if (isEdit) {
                        result = await updateCertificateCourse(course.id, finalData);
                    } else {
                        result = await addCertificateCourse(finalData);
                    }
                    if (result.success) {
                        document.getElementById('course-edit-modal').remove();
                    } else {
                        alert("Error al guardar: " + result.error);
                        btnSave.disabled = false;
                        btnSave.innerHTML = 'Guardar Curso';
                    }
                });
            });
        };

        document.getElementById('btn-add-new-course')?.addEventListener('click', () => openCourseModal());

        // =============================================
        // EMITIR CERTIFICADO PDF CON QR INCRUSTADO
        // =============================================
        document.getElementById('btn-emit-certificate')?.addEventListener('click', async () => {
            const nameVal    = document.getElementById('cert-emit-name')?.value?.trim();
            const dniVal     = document.getElementById('cert-emit-dni')?.value?.trim();
            const courseVal  = document.getElementById('cert-emit-course')?.value?.trim();
            const dateVal    = document.getElementById('cert-emit-date')?.value;
            const expiryVal  = document.getElementById('cert-emit-expiry')?.value;

            if (!nameVal || !dniVal || !courseVal) {
                alert('Completa los campos obligatorios: Nombre, DNI y Curso para generar el registro.'); return;
            }

            const btn = document.getElementById('btn-emit-certificate');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

            try {
                // Generar código único
                const year  = new Date().getFullYear();
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                let rand = '';
                for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
                const uniqueCode = `CERT-${year}-${rand}`;

                const { createCertificateRecord } = await import('./services/database.mjs?v=MAY10B');
                
                const result = await createCertificateRecord({
                    userName:   nameVal,
                    userDni:    dniVal,
                    courseName: courseVal,
                    issueDate:  dateVal || null,
                    expiryDate: expiryVal || null,
                    adminId:    AppState.user?.uid,
                    forceCode:  uniqueCode
                });

                if (!result.success) {
                    alert('Error al guardar: ' + result.error);
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-qrcode"></i> Generar Código y Guardar';
                    return;
                }

                // Generar QR visual en el panel
                const verifyUrl = `${window.location.origin}${window.location.pathname}#/certificados?verify=${uniqueCode}`;
                const qrPanel = document.getElementById('cert-emit-qr-panel');
                if (qrPanel) {
                    qrPanel.innerHTML = `
                        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
                            <div style="background:#fff;padding:10px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);" id="qr-display-gen"></div>
                            <div style="text-align:center;">
                                <p style="font-size:0.7rem;color:#64748B;margin:0 0 4px 0;">CÓDIGO ÚNICO</p>
                                <p style="font-size:1.1rem;font-weight:900;color:#0F172A;font-family:monospace;margin:0 0 12px 0;">${uniqueCode}</p>
                                <p style="font-size:0.7rem;color:#94A3B8;margin:0 0 16px 0;">Titular: <strong>${nameVal}</strong> | DNI: ${dniVal}</p>
                            </div>
                        </div>
                    `;
                    new QRCode(document.getElementById(`qr-display-gen`), {
                        text: verifyUrl,
                        width: 140,
                        height: 140,
                        colorDark: '#1E293B',
                        colorLight: '#FFFFFF',
                        correctLevel: QRCode.CorrectLevel.H
                    });
                }

                // Limpiar formulario
                document.getElementById('cert-emit-name').value  = '';
                document.getElementById('cert-emit-dni').value   = '';
                document.getElementById('cert-emit-course').value = '';
                document.getElementById('cert-emit-date').value  = '';
                document.getElementById('cert-emit-expiry').value = '';

                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-qrcode"></i> Generar Código y Guardar';

            } catch (err) {
                console.error('[emit-cert] Error:', err);
                alert('Error: ' + err.message);
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-qrcode"></i> Generar Código y Guardar';
            }
        });

        // Event listener para el botón de "Subir PDF" en la tabla
        document.querySelectorAll('.btn-upload-final-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.currentTarget.dataset.id;
                const uniqueCode = e.currentTarget.dataset.code;
                
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/pdf';
                input.onchange = async (ev) => {
                    const file = ev.target.files[0];
                    if (!file) return;

                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

                    try {
                        const { attachPDFToCertificate } = await import('./services/database.mjs?v=MAY10B');
                        const result = await attachPDFToCertificate(docId, uniqueCode, file);
                        if (!result.success) {
                            alert('Error al subir PDF: ' + result.error);
                            btn.disabled = false;
                            btn.innerHTML = '<i class="fa-solid fa-upload"></i> Subir PDF';
                        }
                    } catch (err) {
                        console.error('Error attaching PDF', err);
                        alert('Error: ' + err.message);
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-upload"></i> Subir PDF';
                    }
                };
                input.click();
            });
        });

        // Subir voucher de pago de certificado emitido
        document.querySelectorAll('.btn-upload-cert-voucher').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.currentTarget.dataset.id;
                const uniqueCode = e.currentTarget.dataset.code;

                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,application/pdf';
                input.onchange = async (ev) => {
                    const file = ev.target.files[0];
                    if (!file) return;

                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

                    try {
                        const { db, storage } = await import('./services/firebase.js');
                        const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js');
                        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');

                        const ext = file.name.split('.').pop();
                        const storageRef = ref(storage, `certificates/vouchers/${uniqueCode}_${Date.now()}.${ext}`);
                        const snapshot = await uploadBytes(storageRef, file);
                        const downloadUrl = await getDownloadURL(snapshot.ref);

                        await updateDoc(doc(db, 'certificates', docId), {
                            certVoucherUrl: downloadUrl,
                            certVoucherUploadedAt: new Date()
                        });

                        btn.innerHTML = '<i class="fa-solid fa-receipt"></i> Voucher';
                        btn.disabled = false;
                        alert('✅ Voucher subido correctamente');
                        safeRender();
                    } catch (err) {
                        console.error('[upload-cert-voucher] Error:', err);
                        alert('Error al subir el voucher: ' + err.message);
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-receipt"></i> Voucher';
                    }
                };
                input.click();
            });
        });

        document.querySelectorAll('.btn-edit-course').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                import('./services/database.mjs?v=MAY10B').then(async ({ getCertificateCourses }) => {
                    const res = await getCertificateCourses();
                    const course = res.courses.find(c => c.id === id);
                    if (course) openCourseModal(course);
                });
            });
        });

        // Mark as Paid to Professional
        document.querySelectorAll('.btn-mark-paid').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reqId = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Confirmas el pago al profesional?")) {
                    await markServiceAsPaid(reqId);
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Subir Voucher de Pago a Especialista
        document.querySelectorAll('.btn-upload-prof-voucher').forEach(btn => {
            btn.addEventListener('click', () => {
                const reqId = btn.dataset.id;
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    btn.disabled = true;
                    await uploadProfessionalVoucher(reqId, file);
                    safeRender();
                };
                input.click();
            });
        });

        // Approve Professional
        document.querySelectorAll('.btn-approve-prof').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const uid = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Aprobar este especialista?")) {
                    await updateProfessionalStatus(uid, 'aprobada');
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Observe Professional
        document.querySelectorAll('.btn-observe-prof').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const uid = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Observar este especialista?")) {
                    await updateProfessionalStatus(uid, 'observada');
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Approve Company
        document.querySelectorAll('.btn-approve-company').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Aprobar esta empresa?")) {
                    await updateCompanyStatus(id, 'aprobada');
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Reject/Observe Company
        document.querySelectorAll('.btn-reject-company').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Observar esta empresa?")) {
                    await updateCompanyStatus(id, 'observada');
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Activate Membership
        document.querySelectorAll('.btn-activate-membership').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Activar la membresía de esta empresa? Podrán acceder a la plataforma libremente.")) {
                    await updateCompanyMembershipStatus(id, 'active');
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Approve Certificate
        document.querySelectorAll('.btn-approve-certificate').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reqId = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Aprobar el pago y generar el certificado oficial?")) {
                    import('./services/database.mjs?v=MAY9C').then(async ({ approveCertificate }) => {
                        const result = await approveCertificate(reqId);
                        if (result.success) {
                            alert("Certificado generado con el código: " + result.uniqueCode);
                        } else {
                            alert("Error al aprobar certificado: " + result.error);
                        }
                        safeRender();
                    });
                } else {
                    this.isProcessing = false;
                }
            });
        });

        // Mark Withdrawal as Paid
        document.querySelectorAll('.btn-mark-paid-withdrawal').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Marcar este retiro como pagado?")) {
                    await markWithdrawalAsPaid(id);
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Delete Withdrawal Record
        document.querySelectorAll('.btn-delete-withdrawal').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Eliminar este registro de retiro?")) {
                    await deleteWithdrawalRecord(id);
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Delete Professional
        document.querySelectorAll('.btn-delete-prof').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Eliminar permanentemente a este profesional? (Se quitará del mapa)")) {
                    await deleteProfessional(id);
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Mostrar QR de certificado emitido
        document.querySelectorAll('.btn-show-qr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.currentTarget.dataset.code;
                const url = e.currentTarget.dataset.url;
                
                const existingModal = document.getElementById('qr-modal');
                if (existingModal) existingModal.remove();

                const modalHTML = `
                <div id="qr-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">
                    <div style="background:#fff;padding:32px;border-radius:16px;width:100%;max-width:320px;text-align:center;position:relative;">
                        <button id="btn-close-qr-modal" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:1.5rem;color:#94A3B8;cursor:pointer;">&times;</button>
                        <h3 style="margin-top:0;font-size:1.1rem;color:#0F172A;margin-bottom:20px;">Código QR de Verificación</h3>
                        <div id="qr-modal-canvas" style="display:flex;justify-content:center;background:#F8FAFC;padding:16px;border-radius:12px;border:1px solid #E2E8F0;margin-bottom:16px;"></div>
                        <p style="font-family:monospace;font-weight:800;font-size:1.2rem;color:#2563EB;margin:0;">${code}</p>
                    </div>
                </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);

                new QRCode(document.getElementById('qr-modal-canvas'), {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: '#1E293B',
                    colorLight: '#F8FAFC',
                    correctLevel: QRCode.CorrectLevel.M
                });

                document.getElementById('btn-close-qr-modal').addEventListener('click', () => {
                    document.getElementById('qr-modal').remove();
                });
            });
        });

        // Finalizar Contrato Manualmente
        document.querySelectorAll('.btn-finish-contract').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                this.isProcessing = true;
                if (confirm("¿Marcar este trabajo como Finalizado? Pasará al historial.")) {
                    await updateServiceRequestStatus(id, 'finished');
                }
                this.isProcessing = false;
                safeRender();
            });
        });

        // Delete Service Request (Cleanup test data)
        document.querySelectorAll('.btn-delete-request').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                this.isProcessing = true;
                await deleteServiceRequest(id);
                this.isProcessing = false;
                safeRender();
            });
        });
    }
};
