import { AppState } from './state.js';
import Router from './router.js';
import { renderAdminDashboard } from './views/AdminDashboardView.js?v=MAY5';
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
    deleteProfessional
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

        let pending = null;
        let completed = null;
        let professionals = null;
        let pendingWithdrawals = [];
        let ongoingContracts = null;
        let companies = null;
        let finishedHistory = null;
        let withdrawalHistory = [];

        let renderTimeout = null;
        const renderBoth = () => {
            if (this.isProcessing) return; // BLOQUEO: No renderizar si estamos procesando algo
            
            if (renderTimeout) clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                const appElement = document.getElementById('app');
                if (!appElement) return;
                
                appElement.innerHTML = renderAdminDashboard(
                    AppState.user, 
                    pending, 
                    completed, 
                    professionals, 
                    pendingWithdrawals, 
                    ongoingContracts, 
                    companies, 
                    finishedHistory, 
                    withdrawalHistory
                );
                this.bindAdminEvents(renderBoth);
            }, 1000); // 1s debounce para mayor estabilidad
        };

        // Initial loading state
        renderBoth();

        import('./services/database.js?v=MAY5').then(({ 
            listenForPendingPayments, 
            listenForCompletedServices, 
            getProfessionalsForAdmin, 
            getPendingWithdrawals, 
            listenForOngoingContracts, 
            getCompaniesForAdmin, 
            listenForFinishedHistory, 
            listenForWithdrawalHistory 
        }) => {
            const unsub1 = listenForPendingPayments((data) => { pending = data; renderBoth(); });
            const unsub2 = listenForCompletedServices((data) => { completed = data; renderBoth(); });
            const unsub3 = listenForOngoingContracts((data) => { ongoingContracts = data; renderBoth(); });
            const unsub4 = listenForFinishedHistory((data) => { finishedHistory = data; renderBoth(); });
            const unsubWithdrawHistory = listenForWithdrawalHistory((data) => { withdrawalHistory = data; renderBoth(); });
            
            getProfessionalsForAdmin().then(data => { professionals = data; renderBoth(); });
            getPendingWithdrawals().then(data => { pendingWithdrawals = data; renderBoth(); });
            getCompaniesForAdmin().then(data => { companies = data; renderBoth(); });

            AppState.adminListeners.push(unsub1, unsub2, unsub3, unsub4, unsubWithdrawHistory);
        });

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

        // Approve Payment (Vouchers Clientes)
        document.querySelectorAll('.btn-approve-pay').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reqId = e.currentTarget.dataset.id;
                const amount = parseFloat(e.currentTarget.dataset.amount);
                this.isProcessing = true;
                if (confirm("¿Aprobar este pago?")) {
                    await approvePayment(reqId, amount);
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
