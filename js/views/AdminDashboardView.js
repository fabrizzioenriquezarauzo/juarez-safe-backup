export const renderAdminDashboard = (user, pending = null, completed = null, professionals = null) => {
    if (!user || user.userType !== 'admin') {
        return `
            <div style="padding: 40px; text-align: center;">
                <h2>Acceso Denegado</h2>
                <p>No tienes permisos de administrador.</p>
                <button class="btn-primary" onclick="window.history.back()" style="max-width:200px; margin-top:20px;">Volver</button>
            </div>
        `;
    }

    // List of Pending Validations
    let pendingRows = `<tr><td colspan="6" style="padding:32px; text-align:center; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>`;
    if (pending) {
        if (pending.length === 0) {
            pendingRows = `<tr><td colspan="6" style="padding:24px; text-align:center; color:var(--text-muted);">No hay vouchers pendientes de aprobación.</td></tr>`;
        } else {
            pendingRows = pending.map(req => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding:16px; font-family:monospace; color:var(--text-muted);">${req.id.substring(0, 6).toUpperCase()}</td>
                    <td style="padding:16px;"><strong>${req.clientName || 'Empresa'}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${req.clientPhone || ''}</span></td>
                    <td style="padding:16px;"><strong>${req.professionalName || 'Especialista'}</strong></td>
                    <td style="padding:16px; color:var(--primary); font-weight:700;">S/ ${req.totalAmount}.00</td>
                    <td style="padding:16px;">
                        <a href="${req.paymentVoucherUrl || req.voucherUrl}" target="_blank" class="btn-outline" style="padding:6px 12px; font-size:0.8rem; width:auto; border-color:var(--text-light); color:var(--text-dark); display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-file-invoice-dollar"></i> Ver Voucher</a>
                    </td>
                    <td style="padding:16px; display:flex; gap:8px;">
                        <button class="btn-primary btn-approve-pay" data-id="${req.id}" data-amount="${req.totalAmount}" style="padding:6px 12px; font-size:0.75rem; width:auto; background:#10B981; border-color:#10B981;"><i class="fa-solid fa-check"></i> Aprobar</button>
                        <button class="btn-outline btn-reject-pay" data-id="${req.id}" style="padding:6px 12px; font-size:0.75rem; width:auto; border-color:#EF4444; color:#EF4444;"><i class="fa-solid fa-xmark"></i> Rechazar</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // List of Pending Payments to Professionals
    let completedRows = `<tr><td colspan="5" style="padding:32px; text-align:center; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>`;
    if (completed) {
        if (completed.length === 0) {
            completedRows = `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--text-muted);">No hay pagos pendientes a profesionales.</td></tr>`;
        } else {
            completedRows = completed.map(req => {
                const toPay = req.profEarnings || (req.totalAmount * 0.75);
                const comm = req.adminCommission || (req.totalAmount * 0.25);
                return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding:16px;">${req.id.substring(0, 6).toUpperCase()}</td>
                    <td style="padding:16px;"><strong>${req.professionalName || 'Profesional'}</strong></td>
                    <td style="padding:16px; color:var(--success); font-weight:700;">S/ ${toPay} (75%)</td>
                    <td style="padding:16px; color:var(--warning); font-weight:600;">S/ ${comm} (25%)</td>
                    <td style="padding:16px;">
                        <button class="btn-primary btn-mark-paid" data-id="${req.id}" style="padding:8px 16px; font-size:0.8rem; width:auto;"><i class="fa-solid fa-money-bill-transfer"></i> Marcar como Pagado</button>
                    </td>
                </tr>
            `;
            }).join('');
        }
    }

    // List of Professionals to Validate
    let professionalsRows = `<tr><td colspan="6" style="padding:32px; text-align:center; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Cargando especialistas...</td></tr>`;
    if (professionals) {
        if (professionals.length === 0) {
            professionalsRows = `<tr><td colspan="6" style="padding:24px; text-align:center; color:var(--text-muted);">No hay especialistas registrados.</td></tr>`;
        } else {
            professionalsRows = professionals.map(prof => {
                const status = prof.validationStatus || 'pendiente';

                // Color y badge según estado
                let statusBadge = '';
                if (status === 'pendiente') statusBadge = `<span style="background:var(--bg-light); color:var(--text-dark); padding:6px 12px; border-radius:100px; font-weight:700; font-size:0.75rem;"><i class="fa-solid fa-clock"></i> PENDIENTE</span>`;
                if (status === 'observada') statusBadge = `<span style="background:rgba(239, 68, 68, 0.1); color:#EF4444; padding:6px 12px; border-radius:100px; font-weight:700; font-size:0.75rem;"><i class="fa-solid fa-circle-exclamation"></i> OBSERVADA</span>`;
                if (status === 'aprobada') statusBadge = `<span style="background:rgba(16, 185, 129, 0.1); color:#10B981; padding:6px 12px; border-radius:100px; font-weight:700; font-size:0.75rem;"><i class="fa-solid fa-circle-check"></i> APROBADA</span>`;

                const docs = prof.documentation || {};
                const docLink = (url, label, icon) => url ? `<a href="${url}" target="_blank" style="color:var(--primary); font-size:0.8rem; display:inline-flex; align-items:center; gap:4px; margin-right:8px; background:rgba(255,122,0,0.1); padding:4px 8px; border-radius:6px; text-decoration:none;"><i class="fa-solid ${icon}"></i> ${label}</a>` : '';

                const dniLink = docLink(docs.dniUrl || docs.dni, 'DNI', 'fa-id-card');
                const certiadultoLink = docLink(docs.certiadultoUrl || docs.certiadulto, 'Certiadulto', 'fa-shield-halved');
                const cvLink = docLink(docs.cvUrl || docs.cv, 'CV', 'fa-file-pdf');
                const certLink = docLink(docs.certificadosUrl || docs.certs || docs.certificados, 'Cert. Médico Ocupacional', 'fa-certificate');

                const alturaLink = docLink(docs.altura, 'Altura', 'fa-mountain');
                const calienteLink = docLink(docs.caliente, 'Caliente', 'fa-fire');
                const electricoLink = docLink(docs.electrico, 'Eléctrico', 'fa-bolt');
                const confinadosLink = docLink(docs.confinados, 'Confinados', 'fa-door-closed');
                const lotoLink = docLink(docs.loto, 'LOTO', 'fa-lock');

                return `
                <tr style="border-bottom: 1px solid var(--border-color); background: ${status === 'observada' ? 'rgba(239, 68, 68, 0.02)' : 'transparent'};">
                    <td style="padding:16px; font-family:monospace; color:var(--text-muted);">${prof.id.substring(0, 6).toUpperCase()}</td>
                    <td style="padding:16px;">
                        <strong>${prof.name || 'Especialista'}</strong><br>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${prof.email || ''}</span>
                    </td>
                    <td style="padding:16px;"><span class="category-pill" style="font-size:0.75rem; padding:4px 8px;">${prof.specialty || 'Categoría'}</span></td>
                    <td style="padding:16px;">${statusBadge}</td>
                    <td style="padding:16px;">
                        <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:250px;">
                            ${dniLink} ${certiadultoLink} ${cvLink} ${certLink}
                            ${alturaLink} ${calienteLink} ${electricoLink} ${confinadosLink} ${lotoLink}
                            ${!dniLink && !cvLink ? '<span style="color:#94A3B8; font-size:0.8rem;">Sin Documentos</span>' : ''}
                        </div>
                    </td>
                    <td style="padding:16px; display:flex; gap:8px;">
                        <button class="btn-primary btn-approve-prof" data-id="${prof.id}" style="padding:6px 12px; font-size:0.75rem; width:auto; background:#10B981; border-color:#10B981;"><i class="fa-solid fa-check"></i> Aprobar</button>
                        <button class="btn-outline btn-observe-prof" data-id="${prof.id}" style="padding:6px 12px; font-size:0.75rem; width:auto; border-color:#EF4444; color:#EF4444;"><i class="fa-solid fa-xmark"></i> Observar</button>
                    </td>
                </tr>
            `;
            }).join('');
        }
    }

    return `
        <!-- Navbar Minimalista -->
        <nav class="navbar" style="border-bottom: 1px solid var(--border-color); background: var(--surface-white); display: flex; align-items: center; justify-content: space-between; padding: 10px 48px; min-height: 70px;">
            <div class="logo-container" style="display: flex; align-items: center; gap: 12px;">
                <img src="img/logo.png" alt="Logo" style="height: 40px; border-radius: 6px;">
                <div>
                   <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">J&A SafeWork</span> <span style="background:var(--error); color:white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">ADMIN</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <span class="user-greeting" style="font-weight: 600; color: var(--text-dark);">Hola, ${user.name.split(' ')[0]}</span>
                <button id="btn-logout-admin" class="btn-outline" style="padding: 6px 12px; font-size: 0.85rem; width:auto; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Salir</button>
            </div>
        </nav>

        <div class="admin-layout" style="display:flex; max-width: 1400px; margin: 0 auto; padding: 32px 24px; gap: 32px; height:calc(100vh - 70px); overflow-y:auto; padding-bottom:100px;">
            
            <div class="admin-content-area" style="flex: 1; display:flex; flex-direction:column; gap:32px;">
                
                <!-- Section 1: Profesionales a Validar (NUEVO) -->
                <div>
                    <div style="margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
                        <h2 style="font-size:1.35rem; color:var(--text-dark);"><i class="fa-solid fa-id-card-clip" style="color:var(--primary);"></i> Validación de Documentos de Especialistas</h2>
                    </div>
                    <div class="admin-table-wrapper" style="background: var(--surface-white); border-radius: 12px; border: 1px solid var(--border-color); overflow-x: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                        <table style="width:100%; text-align:left; border-collapse:collapse;">
                            <thead style="background: var(--bg-light); color: var(--text-muted); font-size: 0.85rem; text-transform:uppercase;">
                                <tr>
                                    <th style="padding:16px;">N° Ticket</th>
                                    <th style="padding:16px;">Especialista</th>
                                    <th style="padding:16px;">Categoría</th>
                                    <th style="padding:16px;">Estatus</th>
                                    <th style="padding:16px;">Documentos</th>
                                    <th style="padding:16px;">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="admin-professionals-list">
                                ${professionalsRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Section 1.5: Vouchers to validate (NUEVO) -->
                <div>
                    <div style="margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
                        <h2 style="font-size:1.35rem; color:var(--text-dark);"><i class="fa-solid fa-receipt" style="color:var(--warning);"></i> Verificación de Vouchers (Clientes)</h2>
                    </div>
                    <div class="admin-table-wrapper" style="background: var(--surface-white); border-radius: 12px; border: 1px solid var(--border-color); overflow-x: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                        <table style="width:100%; text-align:left; border-collapse:collapse;">
                            <thead style="background: var(--bg-light); color: var(--text-muted); font-size: 0.85rem; text-transform:uppercase;">
                                <tr>
                                    <th style="padding:16px;">Ticket ID</th>
                                    <th style="padding:16px;">Cliente (Empresa)</th>
                                    <th style="padding:16px;">Especialista</th>
                                    <th style="padding:16px;">Monto Total</th>
                                    <th style="padding:16px;">Voucher S.</th>
                                    <th style="padding:16px;">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="admin-pending-payments-list">
                                ${pendingRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Section 2: Vouchers to validate -->
                <div>
                    <div style="margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
                        <h2 style="font-size:1.35rem; color:var(--text-dark);"><i class="fa-solid fa-users" style="color:var(--success);"></i> Pagos a Profesionales (Servicios Finalizados)</h2>
                    </div>
                    <div class="admin-table-wrapper" style="background: var(--surface-white); border-radius: 12px; border: 1px solid var(--border-color); overflow-x: auto;">
                        <table style="width:100%; text-align:left; border-collapse:collapse;">
                            <thead style="background: var(--bg-light); color: var(--text-muted); font-size: 0.85rem; text-transform:uppercase;">
                                <tr>
                                    <th style="padding:16px;">Servicio ID</th>
                                    <th style="padding:16px;">Profesional</th>
                                    <th style="padding:16px;">Deuda a Pagar (75%)</th>
                                    <th style="padding:16px;">Nuestra Com. (25%)</th>
                                    <th style="padding:16px;">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="admin-completed-payments-list">
                                ${completedRows}
                            </tbody>
                        </table>
                    </div>
                </div>
                
            </div>
        </div>
    `;
};
