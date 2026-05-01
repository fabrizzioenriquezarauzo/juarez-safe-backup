export const renderAdminDashboard = (user, pending = null, completed = null, professionals = null, pendingWithdrawals = [], ongoingContracts = null, companies = null, finishedHistory = null, withdrawalHistory = []) => {
    if (!user || user.userType !== 'admin') {
        return `<div style="padding:40px;text-align:center;"><h2>Acceso Denegado</h2></div>`;
    }

    // GANANCIAS
    let totalCommissions = 0, verifiedCount = 0;
    const earningsDetail = [];
    if (finishedHistory) {
        finishedHistory.forEach(req => {
            const commission = Number(req.adminCommission || (Number(req.totalAmount || 0) * 0.15));
            totalCommissions += commission;
            verifiedCount++;
            earningsDetail.push({
                professional: req.professionalName || '---',
                client: req.clientName || '---',
                total: Number(req.totalAmount || 0),
                commission,
                date: req.finishedAt ? new Date(req.finishedAt.seconds*1000).toLocaleDateString('es-PE') : '---'
            });
        });
    }
    // Modal de detalle de ganancias (oculto, se muestra con JS)
    const earningsDetailRows = earningsDetail.length === 0
        ? `<tr><td colspan="4" style="padding:20px;text-align:center;color:#94A3B8;">Sin datos aún.</td></tr>`
        : earningsDetail.map(e => `
            <tr style="border-bottom:1px solid #E2E8F0;font-size:0.85rem;">
                <td style="padding:12px 16px;">${e.professional}</td>
                <td style="padding:12px 16px;color:#475569;">${e.client?.toUpperCase()}</td>
                <td style="padding:12px 16px;color:#475569;">S/ ${e.total.toFixed(2)}</td>
                <td style="padding:12px 16px;color:#10B981;font-weight:800;">+ S/ ${e.commission.toFixed(2)}</td>
            </tr>`).join('');

    // HISTORIAL TRABAJOS FINALIZADOS
    let historyRows = `<tr><td colspan="6" style="padding:20px;text-align:center;color:#94A3B8;">No hay trabajos finalizados aún.</td></tr>`;
    if (finishedHistory && finishedHistory.length > 0) {
        historyRows = finishedHistory.map(h => `
        <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
            <td style="padding:16px;"><strong>${h.clientName?.toUpperCase()||'---'}</strong></td>
            <td style="padding:16px;color:#475569;">${h.professionalName||'---'}</td>
            <td style="padding:16px;color:#475569;">S/ ${Number(h.totalAmount||0).toFixed(2)}</td>
            <td style="padding:16px;color:#10B981;font-weight:800;">+ S/ ${Number(h.adminCommission||((h.totalAmount||0)*0.15)).toFixed(2)}</td>
            <td style="padding:16px;color:#475569;">${h.finishedAt?new Date(h.finishedAt.seconds*1000).toLocaleDateString('es-PE'):'---'}</td>
            <td style="padding:16px;"><span style="background:#DCFCE7;color:#166534;padding:4px 10px;border-radius:100px;font-size:0.65rem;font-weight:800;">✓ PAGADO</span></td>
        </tr>`).join('');
    }

    // HISTORIAL DE PAGO A ESPECIALISTAS (nuestros pagos a profesionales)
    let voucherRows = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#94A3B8;">No hay pagos registrados a especialistas.</td></tr>`;
    if (completed && completed.length > 0) {
        voucherRows = completed.map(v => {
            const profEarnings = Number(v.profEarnings || (Number(v.totalAmount||0) * 0.85));
            const payVoucher = v.profPaymentVoucherUrl || v.paymentVoucherUrl || null;
            return `
        <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
            <td style="padding:16px;color:#475569;">${v.updatedAt?new Date(v.updatedAt.seconds*1000).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'---'}</td>
            <td style="padding:16px;color:#475569;">${v.clientName?.toUpperCase()||'---'}</td>
            <td style="padding:16px;"><strong>${v.professionalName||'---'}</strong></td>
            <td style="padding:16px;font-weight:700;color:#10B981;">S/ ${profEarnings.toFixed(2)}</td>
            <td style="padding:16px;">${payVoucher?`<a href="${payVoucher}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0;padding:8px 14px;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;"><i class="fa-solid fa-eye"></i> Ver Comprobante</a>`:'<span style="color:#94A3B8;font-size:0.8rem;">Sin comprobante</span>'}</td>
        </tr>`;
        }).join('');
    }

    // VOUCHERS DE INGRESOS (empresas que pagan - pendiente de verificación admin)
    let incomingVoucherRows = `<tr><td colspan="6" style="padding:20px;text-align:center;color:#94A3B8;">No hay vouchers de ingreso pendientes.</td></tr>`;
    if (pending && pending.length > 0) {
        incomingVoucherRows = pending.map(req => {
            const date = req.createdAt ? new Date(req.createdAt.seconds*1000).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '---';
            const voucherUrl = req.voucherUrl || req.paymentVoucherUrl || null;
            return `
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;color:#475569;">${date}</td>
                <td style="padding:16px;"><strong>${req.clientName?.toUpperCase()||'---'}</strong></td>
                <td style="padding:16px;color:#475569;">${req.professionalName||'---'}</td>
                <td style="padding:16px;font-weight:800;color:#0F172A;">S/ ${Number(req.totalAmount||0).toFixed(2)}</td>
                <td style="padding:16px;">
                    ${voucherUrl
                        ? `<a href="${voucherUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:8px 14px;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;"><i class="fa-solid fa-eye"></i> Ver Voucher</a>`
                        : `<span style="color:#94A3B8;font-size:0.8rem;">Sin voucher</span>`}
                </td>
                <td style="padding:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <button class="btn-approve-pay"
                        data-id="${req.id}"
                        data-amount="${req.totalAmount||0}"
                        style="background:#10B981;color:white;border:none;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;white-space:nowrap;">
                        <i class="fa-solid fa-check"></i> Aprobar
                    </button>
                    <button class="btn-reject-pay"
                        data-id="${req.id}"
                        style="background:#EF4444;color:white;border:none;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;white-space:nowrap;">
                        <i class="fa-solid fa-xmark"></i> Rechazar
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    // CONTRATOS EN CURSO
    let ongoingRows = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#94A3B8;">No hay contratos activos.</td></tr>`;
    if (ongoingContracts && ongoingContracts.length > 0) {
        ongoingRows = ongoingContracts.map(req => {
            const s = req.status||'accepted';
            const badge = (s==='accepted')
                ? `<span style="background:#FEF3C7;color:#D97706;padding:4px 12px;border-radius:100px;font-size:0.7rem;font-weight:800;">Aceptado</span>`
                : `<span style="background:#DCFCE7;color:#166534;padding:4px 12px;border-radius:100px;font-size:0.7rem;font-weight:800;">Aprobado / En progreso</span>`;
            return `
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;"><strong>${req.clientName||'---'}</strong><br><span style="font-size:0.75rem;color:#94A3B8;">${req.clientPhone||''}</span></td>
                <td style="padding:16px;"><strong>${req.professionalName||'---'}</strong></td>
                <td style="padding:16px;color:#475569;">${req.duration||'---'}</td>
                <td style="padding:16px;font-weight:800;">S/ ${Number(req.totalAmount||0).toFixed(2)}</td>
                <td style="padding:16px;">${badge}</td>
            </tr>`;
        }).join('');
    }

    // EMPRESAS REGISTRADAS
    let companiesRows = `<tr><td colspan="6" style="padding:20px;text-align:center;color:#94A3B8;">No hay empresas registradas.</td></tr>`;
    if (companies && companies.length > 0) {
        companiesRows = companies.map(c => {
            const st = (c.validationStatus||'pendiente').toLowerCase();
            const badge = st==='aprobada'
                ? `<span style="color:#10B981;font-weight:700;font-size:0.8rem;">✓ APROBADA</span>`
                : st==='observada'
                ? `<span style="color:#EF4444;font-weight:700;font-size:0.8rem;">✗ OBSERVADA</span>`
                : `<span style="color:#94A3B8;font-weight:700;font-size:0.8rem;">● PENDIENTE</span>`;
            return `
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;"><strong>${c.companyName||c.name||c.displayName||'---'}</strong><br><span style="font-size:0.75rem;color:#94A3B8;">${c.email||''}</span></td>
                <td style="padding:16px;color:#475569;">${c.ruc||'---'}</td>
                <td style="padding:16px;color:#475569;">${c.phone||'No registrado'}</td>
                <td style="padding:16px;color:#475569;">${c.createdAt?new Date(c.createdAt.seconds*1000).toLocaleDateString('es-PE'):'---'}</td>
                <td style="padding:16px;">${badge}</td>
                <td style="padding:16px;display:flex;gap:6px;align-items:center;">
                    <button class="btn-approve-company" data-id="${c.id}" title="Aprobar" style="background:#10B981;color:white;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-observe-company" data-id="${c.id}" title="Observar" style="background:#F59E0B;color:white;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    <button class="btn-reject-company" data-id="${c.id}" title="Eliminar" style="background:#EF4444;color:white;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    }

    // SOLICITUDES DE RETIRO
    let withdrawalRows = `<tr><td colspan="6" style="padding:20px;text-align:center;color:#94A3B8;">No hay solicitudes de retiro pendientes.</td></tr>`;
    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
        withdrawalRows = pendingWithdrawals.map(w => {
            const d = w.createdAt?new Date(w.createdAt.seconds*1000).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'---';
            return `
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;color:#475569;">${d}</td>
                <td style="padding:16px;"><strong>${w.professionalName||'---'}</strong></td>
                <td style="padding:16px;color:#10B981;font-weight:800;">S/ ${Number(w.amount||0).toFixed(2)}</td>
                <td style="padding:16px;color:#475569;"><i class="fa-solid fa-building-columns" style="margin-right:4px;"></i>${w.bank||w.method||'---'}</td>
                <td style="padding:16px;font-size:0.8rem;color:#475569;">N°: ${w.account||w.accountNumber||'---'}<br><span style="color:#94A3B8;">Titular: ${w.professionalName||'---'}</span></td>
                <td style="padding:16px;">
                    <button class="btn-mark-paid-withdrawal" data-id="${w.id}" style="background:#10B981;color:white;border:none;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;"><i class="fa-solid fa-check"></i> Marcar Depositado</button>
                </td>
            </tr>`;
        }).join('');
    }

    // Busca la URL del documento probando TODAS las variantes de campo que existen en Firestore:
    // Patrón A (perfil): prof.documentation.dni = "https://..."
    // Patrón B (registro): prof.documentation.dniUrl = "https://..."
    // Patrón C (registro viejo): prof.documentation.certificadosUrl (para 'certs')
    const findDocUrl = (prof, type) => {
        const documentation = prof.documentation || {};
        const isUrl = (v) => v && typeof v === 'string' && v.startsWith('http');
        
        // Mapa de aliases: algunos tipos tienen nombres alternativos en Firestore
        const keyAliases = {
            'certs':      ['certs', 'certsUrl', 'certificados', 'certificadosUrl', 'certMedico', 'certMedicoUrl'],
            'certiadulto':['certiadulto', 'certiadultoUrl', 'certAdulto', 'certAdultoUrl'],
            'dni':        ['dni', 'dniUrl'],
            'cv':         ['cv', 'cvUrl'],
            'altura':     ['altura', 'alturaUrl'],
            'caliente':   ['caliente', 'calienteUrl'],
            'electrico':  ['electrico', 'electricoUrl'],
            'confinados': ['confinados', 'confinadosUrl'],
            'loto':       ['loto', 'lotoUrl'],
            'recibo':     ['recibo', 'reciboUrl', 'rhe', 'rheUrl'],
        };
        const keysToTry = keyAliases[type] || [type, type + 'Url'];
        
        // 1. Buscar en documentation con aliases exactos
        for (const k of keysToTry) {
            if (isUrl(documentation[k])) return documentation[k];
        }
        // 2. Buscar en raíz del prof con aliases exactos
        for (const k of keysToTry) {
            if (isUrl(prof[k])) return prof[k];
        }
        // 3. Búsqueda flexible: cualquier clave en documentation que contenga el type
        for (const k of Object.keys(documentation)) {
            if (k.toLowerCase().includes(type.toLowerCase()) && isUrl(documentation[k])) return documentation[k];
        }
        // 4. Búsqueda flexible: cualquier clave en raíz del prof que contenga el type
        for (const k of Object.keys(prof)) {
            if (k !== 'documentation' && k.toLowerCase().includes(type.toLowerCase()) && isUrl(prof[k])) return prof[k];
        }
        return null;
    };


    const DOC_TYPES = [
        { key:'dni', label:'DNI', icon:'fa-solid fa-id-card' },
        { key:'certiadulto', label:'Certiadulto', icon:'fa-solid fa-shield-halved' },
        { key:'cv', label:'CV', icon:'fa-solid fa-file-pdf' },
        { key:'certs', label:'Cert. Médico Ocupacional', icon:'fa-solid fa-certificate' },
        { key:'medico', label:'Cert. Médico Ocupacional', icon:'fa-solid fa-certificate' },
        { key:'altura', label:'Altura', icon:'fa-solid fa-mountain' },
        { key:'caliente', label:'Caliente', icon:'fa-solid fa-fire' },
        { key:'electrico', label:'Eléctrico', icon:'fa-solid fa-bolt' },
        { key:'confinados', label:'Confinados', icon:'fa-solid fa-door-closed' },
        { key:'loto', label:'LOTO', icon:'fa-solid fa-lock' },
    ];

    let professionalsRows = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#94A3B8;">Cargando especialistas...</td></tr>`;
    if (professionals) {
        if (professionals.length === 0) {
            professionalsRows = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#94A3B8;">No hay especialistas registrados.</td></tr>`;
        } else {
            // Eliminar duplicados de labels ya mostrados (ej: certs y medico son el mismo)
            const shownUrls = new Set();
            professionalsRows = professionals.map(prof => {
                shownUrls.clear();
                const status = (prof.validationStatus||'pendiente').toLowerCase();
                let statusBadge = `<span style="background:#F1F5F9;color:#475569;padding:4px 10px;border-radius:100px;font-size:0.65rem;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-circle" style="font-size:0.4rem;"></i> PENDIENTE</span>`;
                if (status==='aprobada') statusBadge = `<span style="background:#DCFCE7;color:#166534;padding:4px 10px;border-radius:100px;font-size:0.65rem;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-circle" style="font-size:0.4rem;"></i> APROBADA</span>`;
                if (status==='observada') statusBadge = `<span style="background:#FEE2E2;color:#991B1B;padding:4px 10px;border-radius:100px;font-size:0.65rem;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-circle" style="font-size:0.4rem;"></i> OBSERVADA</span>`;

                const pills = DOC_TYPES.map(dt => {
                    const url = findDocUrl(prof, dt.key);
                    if (!url || shownUrls.has(url)) return '';
                    shownUrls.add(url);
                    return `<a href="${url}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:3px 8px;border-radius:100px;font-size:0.7rem;font-weight:700;text-decoration:none;margin:2px;white-space:nowrap;"><i class="${dt.icon}" style="font-size:0.6rem;"></i>${dt.label}</a>`;
                }).filter(b=>b!=='').join('');

                const docsHTML = pills
                    ? `<div style="display:flex;flex-wrap:wrap;max-width:300px;">${pills}</div>`
                    : `<span style="color:#94A3B8;font-size:0.8rem;">Sin Documentos</span>`;

                return `
                <tr style="border-bottom:1px solid #F1F5F9;">
                    <td style="padding:16px 12px;font-family:monospace;color:#94A3B8;font-size:0.75rem;font-weight:700;">${prof.id?prof.id.substring(0,6).toUpperCase():'---'}</td>
                    <td style="padding:16px 12px;"><strong style="font-size:0.85rem;">${prof.name||'---'}</strong><br><span style="font-size:0.72rem;color:#94A3B8;">${prof.email||''}</span></td>
                    <td style="padding:16px 12px;color:#475569;font-size:0.8rem;">${prof.category||prof.specialty||'---'}</td>
                    <td style="padding:16px 12px;">${statusBadge}</td>
                    <td style="padding:16px 12px;">${docsHTML}</td>
                    <td style="padding:16px 12px;">
                        <div style="display:flex;gap:8px;flex-shrink:0;">
                            <button class="btn-approve-prof" data-id="${prof.id}" style="background:#10B981;color:white;border:none;padding:10px 16px;border-radius:8px;font-weight:800;cursor:pointer;white-space:nowrap;font-size:0.8rem;"><i class="fa-solid fa-check"></i> Aprobar</button>
                            <button class="btn-observe-prof" data-id="${prof.id}" style="background:white;border:2px solid #EF4444;color:#EF4444;padding:10px 14px;border-radius:8px;font-weight:800;cursor:pointer;white-space:nowrap;font-size:0.8rem;"><i class="fa-solid fa-xmark"></i> Observar</button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }
    }

    const card = (content) => `<div style="background:#fff;border-radius:16px;border:1px solid #F1F5F9;overflow-x:auto;margin-bottom:32px;box-shadow:0 1px 8px rgba(0,0,0,0.04);">${content}</div>`;
    const th = (...cols) => `<thead style="background:#F8FAFC;"><tr>${cols.map(c=>`<th style="padding:14px 16px;font-size:0.7rem;color:#64748B;text-transform:uppercase;font-weight:700;white-space:nowrap;">${c}</th>`).join('')}</tr></thead>`;
    const sec = (icon,color,title) => `<h3 style="font-weight:900;margin:0 0 16px 0;color:#0F172A;display:flex;align-items:center;gap:10px;font-size:1rem;"><i class="${icon}" style="color:${color};"></i>${title}</h3>`;

    return `
    <style>
        html,body{overflow:auto!important;height:auto!important;margin:0;padding:0;}
        #app{overflow:auto!important;height:auto!important;width:100%!important;max-width:100%!important;}
        .atbl{width:100%;border-collapse:collapse;text-align:left;}
        .atbl tr:hover{background:#FAFAFA;}
    </style>
    <div style="background:#F8FAFC;min-height:100vh;padding-bottom:80px;width:100%;box-sizing:border-box;">

        <nav style="background:#fff;border-bottom:1px solid #F1F5F9;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:999;box-sizing:border-box;">
            <div style="display:flex;align-items:center;gap:10px;">
                <img src="img/logo.png" style="height:30px;" onerror="this.style.display='none'">
                <span style="font-weight:900;font-size:1rem;color:#0F172A;">J&A SafeWork</span>
            </div>
            <div style="display:flex;align-items:center;gap:16px;">
                <span style="font-size:0.85rem;color:#64748B;font-weight:600;">Hola, Administrador</span>
                <button id="btn-logout-admin" style="background:#F1F5F9;border:none;padding:8px 16px;border-radius:10px;font-weight:700;cursor:pointer;color:#0F172A;display:flex;align-items:center;gap:8px;font-size:0.85rem;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Salir</button>
            </div>
        </nav>

        <div style="padding:32px;box-sizing:border-box;">

            <!-- GANANCIAS -->
            <div style="background:#fff;border-radius:16px;border:1px solid #F1F5F9;padding:28px 32px;margin-bottom:32px;box-shadow:0 1px 8px rgba(0,0,0,0.04);">
                <div style="display:flex;align-items:center;gap:24px;">
                    <div style="background:#DCFCE7;color:#10B981;width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;"><i class="fa-solid fa-chart-line"></i></div>
                    <div style="flex:1;">
                        <div style="color:#64748B;font-weight:700;font-size:0.82rem;margin-bottom:2px;">Ganancias (Comisiones)</div>
                        <div style="font-size:2.2rem;font-weight:900;color:#0F172A;line-height:1.1;">S/ ${totalCommissions.toFixed(2)}</div>
                        <div style="color:#94A3B8;font-size:0.78rem;margin-top:2px;">De ${verifiedCount} servicios finalizados</div>
                    </div>
                    <button id="btn-toggle-earnings" onclick="const p=document.getElementById('earnings-detail-panel');p.style.display=p.style.display==='none'?'block':'none';" style="background:#2563EB;color:white;border:none;padding:10px 20px;border-radius:10px;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;">
                        <i class="fa-solid fa-list"></i> Detalle
                    </button>
                </div>
                <!-- Panel de detalle expandible -->
                <div id="earnings-detail-panel" style="display:none;margin-top:24px;border-top:1px solid #F1F5F9;padding-top:20px;">
                    <div style="font-size:0.8rem;font-weight:700;color:#475569;margin-bottom:12px;">DESGLOSE DE COMISIONES (15%)</div>
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#F8FAFC;">
                                <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:#64748B;font-weight:800;text-transform:uppercase;">Especialista</th>
                                <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:#64748B;font-weight:800;text-transform:uppercase;">Empresa / Cliente</th>
                                <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:#64748B;font-weight:800;text-transform:uppercase;">Monto Servicio</th>
                                <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:#10B981;font-weight:800;text-transform:uppercase;">Nuestra Ganancia (15%)</th>
                            </tr>
                        </thead>
                        <tbody>${earningsDetailRows}</tbody>
                    </table>
                </div>
            </div>

            <!-- HISTORIAL TRABAJOS -->
            ${sec('fa-solid fa-circle-check','#10B981','Historial de Trabajos Finalizados')}
            ${card(`<table class="atbl">${th('Cliente','Especialista','Monto Total','Ganancia (15%)','Fecha','Estado del Pago')}<tbody>${historyRows}</tbody></table>`)}

            <!-- VOUCHERS PAGO A ESPECIALISTAS -->
            ${sec('fa-solid fa-hand-holding-dollar','#10B981','Historial de Pago a Especialistas')}
            ${card(`<table class="atbl">${th('Fecha / Hora','Cliente','Especialista','Monto Pagado','Comprobante')}<tbody>${voucherRows}</tbody></table>`)}

            <!-- VOUCHERS DE INGRESOS (pendientes de aprobación) -->
            ${sec('fa-solid fa-file-invoice-dollar','#2563EB','Vouchers de Ingresos (Pendientes de Aprobación)')}
            ${card(`<table class="atbl">${th('Fecha','Empresa / Cliente','Especialista','Monto','Voucher','Acción')}<tbody>${incomingVoucherRows}</tbody></table>`)}

            <!-- CONTRATOS EN CURSO -->
            ${sec('fa-solid fa-briefcase','#2563EB','Contratos en Curso')}
            ${card(`<table class="atbl">${th('Empresa / Cliente','Trabajador / Especialista','Duración','Costo Total','Estado')}<tbody>${ongoingRows}</tbody></table>`)}

            <!-- EMPRESAS -->
            ${sec('fa-solid fa-building','#8B5CF6','Empresas Registradas')}
            ${card(`<table class="atbl">${th('Empresa','RUC','Teléfono','Fecha de Registro','Estado','Acción')}<tbody>${companiesRows}</tbody></table>`)}

            <!-- RETIROS -->
            ${sec('fa-solid fa-money-bill-transfer','#10B981','Solicitudes de Retiro (Pendientes)')}
            ${card(`<table class="atbl">${th('Fecha','Profesional','Monto','Banco / Método','Datos de Cuenta','Acción')}<tbody>${withdrawalRows}</tbody></table>`)}

            <!-- VALIDACIÓN -->
            ${sec('fa-solid fa-user-shield','#0F172A','Validación de Documentos de Especialistas')}
            ${card(`<table class="atbl">${th('N° Ticket','Especialista','Categoría','Estatus','Documentos','Acción')}<tbody>${professionalsRows}</tbody></table>`)}

        </div>
    </div>
    <div id="commissions-modal" style="display:none;"></div>
    <div id="commissions-list" style="display:none;"></div>
    <button id="btn-close-commissions" style="display:none;"></button>
    <div id="btn-view-commissions" style="display:none;"></div>
    `;
};
