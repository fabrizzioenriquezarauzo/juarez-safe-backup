export const renderAdminDashboard = (user, pending = null, completed = null, professionals = null, pendingWithdrawals = [], ongoingContracts = null, companies = null, finishedHistory = null, withdrawalHistory = []) => {
    if (!user || user.userType !== 'admin') {
        return `<div style="padding:40px; text-align:center;"><h2>Acceso Denegado</h2></div>`;
    }

    // --- CÁLCULO DE GANANCIAS (IGUAL QUE EN CAPTURA) ---
    let totalCommissions = 0;
    let verifiedCount = 0;
    if (finishedHistory) {
        finishedHistory.forEach(req => {
            const comm = req.adminCommission || (Number(req.totalAmount || 0) * 0.15);
            totalCommissions += Number(comm);
            verifiedCount++;
        });
    }

    // --- TABLA: HISTORIAL DE TRABAJOS FINALIZADOS ---
    let historyRows = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#94A3B8;">No hay trabajos finalizados.</td></tr>`;
    if (finishedHistory && finishedHistory.length > 0) {
        historyRows = finishedHistory.map(h => `
            <tr style="border-bottom:1px solid #F1F5F9; font-size:0.85rem;">
                <td style="padding:16px;"><strong>${h.clientName?.toUpperCase() || '---'}</strong></td>
                <td style="padding:16px; color:#475569;">${h.professionalName}</td>
                <td style="padding:16px; color:#475569;">S/ ${Number(h.totalAmount).toFixed(2)}</td>
                <td style="padding:16px; color:#10B981; font-weight:800;">+ S/ ${(h.adminCommission || h.totalAmount*0.15).toFixed(2)}</td>
                <td style="padding:16px; color:#475569;">${h.finishedAt ? new Date(h.finishedAt.seconds * 1000).toLocaleDateString() : '28/4/2026'}</td>
                <td style="padding:16px; display:flex; align-items:center; gap:8px;">
                    <span style="background:#FEF3C7; color:#D97706; padding:4px 10px; border-radius:100px; font-size:0.65rem; font-weight:800; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-clock"></i> POR PAGAR</span>
                    <i class="fa-solid fa-trash" style="color:#EF4444; cursor:pointer; font-size:0.8rem;"></i>
                </td>
            </tr>`).join('');
    }

    // --- TABLA: HISTORIAL DE VOUCHERS CONFIRMADOS ---
    let voucherRows = `<tr><td colspan="5" style="padding:20px; text-align:center; color:#94A3B8;">No hay vouchers confirmados.</td></tr>`;
    if (completed && completed.length > 0) {
        voucherRows = completed.map(v => `
            <tr style="border-bottom:1px solid #F1F5F9; font-size:0.85rem;">
                <td style="padding:16px; color:#475569;">${v.updatedAt ? new Date(v.updatedAt.seconds * 1000).toLocaleString() : '---'}</td>
                <td style="padding:16px;"><strong>${v.clientName?.toUpperCase() || '---'}</strong></td>
                <td style="padding:16px; color:#475569;">${v.professionalName}</td>
                <td style="padding:16px; font-weight:700;">S/ ${Number(v.totalAmount).toFixed(2)}</td>
                <td style="padding:16px;"><button style="background:#0F172A; color:white; border:none; padding:8px 16px; border-radius:100px; font-size:0.7rem; font-weight:700; cursor:pointer;"><i class="fa-solid fa-eye"></i> Ver Voucher</button></td>
            </tr>`).join('');
    }

    // --- TABLA: CONTRATOS EN CURSO ---
    let ongoingRows = `<tr><td colspan="5" style="padding:20px; text-align:center; color:#94A3B8;">No hay contratos activos.</td></tr>`;
    if (ongoingContracts && ongoingContracts.length > 0) {
        ongoingRows = ongoingContracts.map(req => `
            <tr style="border-bottom:1px solid #F1F5F9; font-size:0.85rem;">
                <td style="padding:16px;"><strong>${req.clientName}</strong><br><span style="font-size:0.7rem; color:#94A3B8;">${req.clientPhone || '---'}</span></td>
                <td style="padding:16px;"><strong>${req.professionalName}</strong></td>
                <td style="padding:16px; color:#475569;">${req.duration || '---'}</td>
                <td style="padding:16px; font-weight:800; color:#0F172A;">S/ ${Number(req.totalAmount).toFixed(2)}</td>
                <td style="padding:16px; display:flex; align-items:center; gap:8px;">
                    <span style="background:#DCFCE7; color:#166534; padding:4px 10px; border-radius:100px; font-size:0.65rem; font-weight:700;">Aprobado / En progreso</span>
                    <i class="fa-solid fa-trash" style="color:#EF4444; cursor:pointer; font-size:0.8rem;"></i>
                </td>
            </tr>`).join('');
    }

    // --- TABLA: EMPRESAS REGISTRADAS ---
    let companiesRows = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#94A3B8;">No hay empresas.</td></tr>`;
    if (companies) {
        companiesRows = companies.map(c => `
            <tr style="border-bottom:1px solid #F1F5F9; font-size:0.85rem;">
                <td style="padding:16px;"><strong>${c.companyName}</strong><br><span style="font-size:0.7rem; color:#94A3B8;">${c.email}</span></td>
                <td style="padding:16px; color:#475569;">${c.ruc || '---'}</td>
                <td style="padding:16px; color:#475569;">${c.phone || 'No registrado'}</td>
                <td style="padding:16px; color:#475569;">${c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : '---'}</td>
                <td style="padding:16px;"><span style="color:#10B981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> APROBADA</span></td>
                <td style="padding:16px; display:flex; gap:8px;">
                    <button class="btn-approve-company" data-id="${c.id}" style="background:#10B981; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-reject-company" data-id="${c.id}" style="background:#EF4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
    }

    // --- TABLA: VALIDACIÓN DE ESPECIALISTAS ---
    let professionalsRows = `<tr><td colspan="6" style="padding:24px; text-align:center;">Cargando especialistas...</td></tr>`;
    if (professionals) {
        professionalsRows = professionals.map(prof => {
            const status = prof.validationStatus || 'pendiente';
            let statusHTML = `<span style="background:#F1F5F9; color:#475569; padding:4px 10px; border-radius:100px; font-size:0.65rem; font-weight:800; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle" style="font-size:0.4rem;"></i> PENDIENTE</span>`;
            if (status === 'aprobada') statusHTML = `<span style="background:#DCFCE7; color:#166534; padding:4px 10px; border-radius:100px; font-size:0.65rem; font-weight:800; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle" style="font-size:0.4rem;"></i> APROBADA</span>`;
            if (status === 'observada') statusHTML = `<span style="background:#FEE2E2; color:#991B1B; padding:4px 10px; border-radius:100px; font-size:0.65rem; font-weight:800; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-circle" style="font-size:0.4rem;"></i> OBSERVADA</span>`;

            // LÓGICA DE ICONOS (BUSCA EN .documentation)
            const getUrl = (type) => {
                if (prof.documentation && prof.documentation[type]) return prof.documentation[type];
                if (prof[type + 'Url']) return prof[type + 'Url'];
                if (prof[type]) return prof[type];
                return null;
            };

            const docIcon = (type, label, iconClass) => {
                const url = getUrl(type);
                return url ? `
                <div style="display:flex; align-items:center; gap:6px; font-size:0.65rem; color:#0F172A; margin-bottom:4px;">
                    <i class="${iconClass}" style="color:#0F172A; font-size:0.8rem;"></i>
                    <a href="${url}" target="_blank" style="text-decoration:none; color:inherit; font-weight:800; border-bottom:1px solid #0F172A;">${label}</a>
                </div>` : `
                <div style="display:flex; align-items:center; gap:6px; font-size:0.65rem; color:#94A3B8; opacity:0.3; margin-bottom:4px;">
                    <i class="${iconClass}" style="font-size:0.8rem;"></i>
                    <span>${label}</span>
                </div>`;
            };

            return `
                <tr style="border-bottom:1px solid #F1F5F9; font-size:0.85rem;">
                    <td style="padding:20px; font-family:monospace; color:#94A3B8; font-size:0.75rem;">${prof.id ? prof.id.substring(0,6).toUpperCase() : '---'}</td>
                    <td style="padding:20px;"><strong>${prof.name}</strong><br><span style="font-size:0.75rem; color:#94A3B8;">${prof.email}</span></td>
                    <td style="padding:20px; color:#475569;">${prof.category || '---'}</td>
                    <td style="padding:20px;">${statusHTML}</td>
                    <td style="padding:20px;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px 12px;">
                            ${docIcon('dni', 'DNI', 'fa-solid fa-id-card')}
                            ${docIcon('certiadulto', 'Certiadulto', 'fa-solid fa-shield-halved')}
                            ${docIcon('cv', 'CV', 'fa-solid fa-file-pdf')}
                            ${docIcon('certs', 'Cert. Médico Ocupacional', 'fa-solid fa-certificate')}
                            ${docIcon('altura', 'Altura', 'fa-solid fa-mountain')}
                            ${docIcon('caliente', 'Caliente', 'fa-solid fa-fire')}
                            ${docIcon('electrico', 'Eléctrico', 'fa-solid fa-bolt')}
                            ${docIcon('confinados', 'Confinados', 'fa-solid fa-door-closed')}
                            ${docIcon('loto', 'LOTO', 'fa-solid fa-lock')}
                        </div>
                    </td>
                    <td style="padding:20px;">
                        <div style="display:flex; gap:8px;">
                            <button class="btn-approve-prof" data-id="${prof.id}" style="background:#10B981; color:white; border:none; padding:12px 20px; border-radius:10px; font-weight:800; cursor:pointer;">Aprobar</button>
                            <button class="btn-observe-prof" data-id="${prof.id}" style="background:white; border:2px solid #EF4444; color:#EF4444; padding:10px 20px; border-radius:10px; font-weight:800; cursor:pointer;">Observar</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    return `
        <style>
            html, body { overflow: auto !important; height: auto !important; }
            #app { overflow: auto !important; height: auto !important; }
        </style>
        <div style="background:#F8FAFC; min-height:100vh; padding-bottom:100px;">
            <nav style="background:#fff; border-bottom:1px solid #F1F5F9; padding:12px 48px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:1000;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="img/logo.png" style="height:32px;">
                    <span style="font-weight:900; font-size:1.1rem; color:#0F172A;">J&A SafeWork</span>
                </div>
                <div style="display:flex; align-items:center; gap:16px;">
                    <span style="font-size:0.85rem; font-weight:600; color:#64748B;">Hola, Administrador</span>
                    <button id="btn-logout-admin" style="background:#F1F5F9; border:none; padding:8px 16px; border-radius:10px; font-weight:700; cursor:pointer; color:#0F172A; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Salir</button>
                </div>
            </nav>

            <div style="max-width:1400px; margin:0 auto; padding:40px 20px;">
                
                <!-- GANANCIAS TOTALES (CALCO DE CAPTURA) -->
                <div style="background:#fff; border-radius:24px; border:1px solid #F1F5F9; padding:40px; margin-bottom:48px; display:flex; align-items:center; justify-content:space-between; box-shadow: 0 10px 40px rgba(0,0,0,0.02);">
                    <div style="display:flex; align-items:center; gap:24px;">
                        <div style="background:#DCFCE7; color:#10B981; width:64px; height:64px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:1.8rem;">
                            <i class="fa-solid fa-chart-line"></i>
                        </div>
                        <div>
                            <div style="color:#64748B; font-weight:700; font-size:0.9rem; margin-bottom:4px;">Ganancias Totales (Comisiones)</div>
                            <div style="font-size:3.5rem; font-weight:900; color:#0F172A;">S/ ${totalCommissions.toFixed(2)}</div>
                            <div style="color:#94A3B8; font-size:0.85rem;">De ${verifiedCount} servicios verificados</div>
                        </div>
                    </div>
                    <button style="background:transparent; border:1px solid #E2E8F0; padding:10px 20px; border-radius:100px; font-weight:700; color:#0F172A; cursor:pointer; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-eye"></i> Ver Detalle</button>
                </div>

                <!-- SECCIONES EN ORDEN EXACTO -->
                
                <h3 style="font-weight:900; margin-bottom:20px; color:#0F172A; display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-circle-check" style="color:#10B981;"></i> Historial de Trabajos Finalizados</h3>
                <div style="background:#fff; border-radius:16px; border:1px solid #F1F5F9; overflow:hidden; margin-bottom:48px;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;"><thead style="background:#F8FAFC;"><tr style="font-size:0.7rem; color:#64748B; text-transform:uppercase;"><th style="padding:16px;">Cliente</th><th style="padding:16px;">Especialista</th><th style="padding:16px;">Monto Total</th><th style="padding:16px;">Ganancia (15%)</th><th style="padding:16px;">Fecha</th><th style="padding:16px;">Estado del Pago</th></tr></thead><tbody>${historyRows}</tbody></table>
                </div>

                <h3 style="font-weight:900; margin-bottom:20px; color:#0F172A; display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-money-bill-1" style="color:#F59E0B;"></i> Historial de Vouchers Confirmados</h3>
                <div style="background:#fff; border-radius:16px; border:1px solid #F1F5F9; overflow:hidden; margin-bottom:48px;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;"><thead style="background:#F8FAFC;"><tr style="font-size:0.7rem; color:#64748B; text-transform:uppercase;"><th style="padding:16px;">Fecha / Hora</th><th style="padding:16px;">Cliente</th><th style="padding:16px;">Especialista</th><th style="padding:16px;">Monto Pagado</th><th style="padding:16px;">Voucher</th></tr></thead><tbody>${voucherRows}</tbody></table>
                </div>

                <h3 style="font-weight:900; margin-bottom:20px; color:#0F172A; display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-briefcase" style="color:#2563EB;"></i> Contratos en Curso</h3>
                <div style="background:#fff; border-radius:16px; border:1px solid #F1F5F9; overflow:hidden; margin-bottom:48px;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;"><thead style="background:#F8FAFC;"><tr style="font-size:0.7rem; color:#64748B; text-transform:uppercase;"><th style="padding:16px;">Empresa / Cliente</th><th style="padding:16px;">Trabajador / Especialista</th><th style="padding:16px;">Duración</th><th style="padding:16px;">Costo Total</th><th style="padding:16px;">Estado</th></tr></thead><tbody>${ongoingRows}</tbody></table>
                </div>

                <h3 style="font-weight:900; margin-bottom:20px; color:#0F172A; display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-building" style="color:#8B5CF6;"></i> Empresas Registradas</h3>
                <div style="background:#fff; border-radius:16px; border:1px solid #F1F5F9; overflow:hidden; margin-bottom:48px;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;"><thead style="background:#F8FAFC;"><tr style="font-size:0.7rem; color:#64748B; text-transform:uppercase;"><th style="padding:16px;">Empresa</th><th style="padding:16px;">RUC</th><th style="padding:16px;">Teléfono</th><th style="padding:16px;">Fecha de Registro</th><th style="padding:16px;">Estado</th><th style="padding:16px;">Acción</th></tr></thead><tbody>${companiesRows}</tbody></table>
                </div>

                <h3 style="font-weight:900; margin-bottom:20px; color:#0F172A; display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-money-bill-transfer" style="color:#10B981;"></i> Solicitudes de Retiro (Pendientes)</h3>
                <div style="background:#fff; border-radius:16px; border:1px solid #F1F5F9; overflow:hidden; margin-bottom:48px;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;"><thead style="background:#F8FAFC;"><tr style="font-size:0.7rem; color:#64748B; text-transform:uppercase;"><th style="padding:16px;">Fecha</th><th style="padding:16px;">Profesional</th><th style="padding:16px;">Monto</th><th style="padding:16px;">Banco / Método</th><th style="padding:16px;">Datos de Cuenta</th><th style="padding:16px;">Acción</th></tr></thead><tbody style="text-align:center; color:#94A3B8;"><tr><td colspan="6" style="padding:20px;">No hay solicitudes de retiro pendientes.</td></tr></tbody></table>
                </div>

                <h3 style="font-weight:900; margin-bottom:20px; color:#0F172A; display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-user-shield" style="color:#0F172A;"></i> Validación de Documentos de Especialistas</h3>
                <div style="background:#fff; border-radius:16px; border:1px solid #F1F5F9; overflow:hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.03);">
                    <table style="width:100%; border-collapse:collapse; text-align:left;"><thead style="background:#F8FAFC;"><tr style="font-size:0.7rem; color:#64748B; text-transform:uppercase;"><th style="padding:20px;">N° Ticket</th><th style="padding:20px;">Especialista</th><th style="padding:20px;">Categoría</th><th style="padding:20px;">Estatus</th><th style="padding:20px;">Documentos</th><th style="padding:20px;">Acción</th></tr></thead><tbody>${professionalsRows}</tbody></table>
                </div>

            </div>
        </div>
        <div id="commissions-modal" style="display:none;"><div id="commissions-list"></div><button id="btn-close-commissions"></button></div>
        <div id="btn-view-commissions" style="display:none;"></div>
    `;
};
