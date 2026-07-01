export const renderAdminDashboard = (user, pending = null, completed = null, professionals = null, pendingWithdrawals = [], ongoingContracts = null, companies = null, finishedHistory = null, withdrawalHistory = [], pendingCertificates = null, certificateCourses = null, issuedCertificates = []) => {
    if (!user || user.userType !== 'admin') {
        return `<div style="padding:40px;text-align:center;"><h2>Acceso Denegado</h2></div>`;
    }

    // MEMBRESÍAS
    let activeMemberships = 0;
    if (companies) {
        companies.forEach(c => {
            if (c.membershipStatus === 'active') activeMemberships++;
        });
    }

    // HISTORIAL TRABAJOS FINALIZADOS
    let historyRows = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#94A3B8;">No hay trabajos finalizados aún.</td></tr>`;
    if (finishedHistory && finishedHistory.length > 0) {
        historyRows = finishedHistory.map(h => `
        <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
            <td style="padding:16px;"><strong>${h.clientName?.toUpperCase()||'---'}</strong></td>
            <td style="padding:16px;color:#475569;">${h.professionalName||'---'}</td>
            <td style="padding:16px;color:#475569;">S/ ${Number(h.totalAmount||0).toFixed(2)}</td>
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

    // VOUCHERS DE INGRESOS (MEMBRESÍAS PENDIENTES)
    let incomingVoucherRows = `<tr><td colspan="4" style="padding:20px;text-align:center;color:#94A3B8;">No hay vouchers de membresías pendientes.</td></tr>`;
    if (pending && pending.length > 0) {
        incomingVoucherRows = pending.map(req => {
            const date = req.createdAt ? new Date(req.createdAt.seconds*1000).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '---';
            const voucherUrl = req.voucherUrl || null;
            // Para mostrar el nombre de la empresa, buscaremos si la tenemos en la lista global de 'companies'
            const comp = companies ? companies.find(c => c.id === req.companyId) : null;
            const companyName = comp ? (comp.companyName || comp.name || comp.displayName) : 'ID: ' + req.companyId.substring(0,6);
            
            return `
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;color:#475569;">${date}</td>
                <td style="padding:16px;"><strong>${companyName}</strong></td>
                <td style="padding:16px;">
                    ${voucherUrl
                        ? `<a href="${voucherUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:8px 14px;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;"><i class="fa-solid fa-eye"></i> Ver Voucher</a>`
                        : `<span style="color:#94A3B8;font-size:0.8rem;">Sin voucher</span>`}
                </td>
                <td style="padding:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <button class="btn-approve-membership-pay"
                        data-id="${req.id}"
                        data-companyid="${req.companyId}"
                        style="background:#10B981;color:white;border:none;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;white-space:nowrap;">
                        <i class="fa-solid fa-check"></i> Aprobar Membresía
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    // VOUCHERS DE CERTIFICADOS (solicitudes de usuarios + vouchers manuales de admin)
    let allCertVoucherRows = [];

    // 1) Solicitudes pendientes de usuarios
    if (pendingCertificates && pendingCertificates.length > 0) {
        pendingCertificates.forEach(req => {
            const date = req.createdAt ? new Date(req.createdAt.seconds*1000).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '---';
            const voucherUrl = req.voucherUrl || null;
            allCertVoucherRows.push(`
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;color:#475569;">${date}</td>
                <td style="padding:16px;">
                    <strong>${req.userName}</strong><br>
                    <span style="font-size:0.75rem;color:#94A3B8;">DNI: ${req.userDni}</span><br>
                    <span style="font-size:0.75rem;color:#475569;">Curso: ${req.courseName}</span>
                </td>
                <td style="padding:16px;">
                    ${voucherUrl
                        ? `<a href="${voucherUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:8px 14px;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;"><i class="fa-solid fa-eye"></i> Ver Voucher</a>`
                        : `<span style="color:#94A3B8;font-size:0.8rem;">Sin voucher</span>`}
                </td>
                <td style="padding:16px;">
                    <span style="background:#DBEAFE;color:#1D4ED8;padding:4px 10px;border-radius:100px;font-size:0.7rem;font-weight:800;">Usuario</span>
                </td>
                <td style="padding:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <button class="btn-approve-certificate"
                        data-id="${req.id}"
                        style="background:#10B981;color:white;border:none;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;white-space:nowrap;">
                        <i class="fa-solid fa-check"></i> Aprobar Certificado
                    </button>
                </td>
            </tr>`);
        });
    }

    // 2) Vouchers subidos manualmente por el admin desde "Certificados Emitidos"
    if (issuedCertificates && issuedCertificates.length > 0) {
        issuedCertificates.filter(c => c.certVoucherUrl).forEach(c => {
            const date = c.certVoucherUploadedAt
                ? new Date(c.certVoucherUploadedAt.seconds ? c.certVoucherUploadedAt.seconds*1000 : c.certVoucherUploadedAt).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
                : (c.createdAt ? new Date(c.createdAt.seconds*1000).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '---');
            allCertVoucherRows.push(`
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;color:#475569;">${date}</td>
                <td style="padding:16px;">
                    <strong>${c.userName}</strong><br>
                    <span style="font-size:0.75rem;color:#94A3B8;">DNI: ${c.userDni || 'N/A'}</span><br>
                    <span style="font-size:0.75rem;color:#475569;">Curso: ${c.courseName}</span><br>
                    <span style="font-size:0.7rem;font-family:monospace;color:#94A3B8;">${c.uniqueCode}</span>
                </td>
                <td style="padding:16px;">
                    <a href="${c.certVoucherUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#FFF7ED;color:#EA580C;border:1px solid #FED7AA;padding:8px 14px;border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;"><i class="fa-solid fa-receipt"></i> Ver Voucher</a>
                </td>
                <td style="padding:16px;">
                    <span style="background:#FEF3C7;color:#B45309;padding:4px 10px;border-radius:100px;font-size:0.7rem;font-weight:800;">Admin</span>
                </td>
                <td style="padding:16px;">
                    <span style="color:#10B981;font-size:0.8rem;font-weight:700;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-circle-check"></i> Emitido</span>
                </td>
            </tr>`);
        });
    }

    let certificateVoucherRows = allCertVoucherRows.length > 0
        ? allCertVoucherRows.join('')
        : `<tr><td colspan="5" style="padding:20px;text-align:center;color:#94A3B8;">No hay vouchers de certificados.</td></tr>`;

    // GESTIÓN DE CURSOS
    let coursesRows = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#94A3B8;">No hay cursos configurados.</td></tr>`;
    if (certificateCourses && certificateCourses.length > 0) {
        coursesRows = certificateCourses.map(course => {
            return `
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;"><strong>${course.name}</strong></td>
                <td style="padding:16px;color:#475569;"><i class="fa-solid ${course.icon||'fa-certificate'}"></i></td>
                <td style="padding:16px;color:#475569;">${course.questions ? course.questions.length : 0} preguntas</td>
                <td style="padding:16px;">${course.isActive ? '<span style="color:#10B981;font-weight:700;">Activo</span>' : '<span style="color:#EF4444;font-weight:700;">Inactivo</span>'}</td>
                <td style="padding:16px;">
                    <button class="btn-edit-course" data-id="${course.id}" style="background:#F1F5F9;color:#2563EB;border:none;padding:8px 12px;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.75rem;"><i class="fa-solid fa-pen"></i> Editar</button>
                    <button class="btn-delete-course" data-id="${course.id}" style="background:#FEF2F2;color:#EF4444;border:none;padding:8px 12px;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.75rem;"><i class="fa-solid fa-trash"></i></button>
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
            const memBadge = c.membershipStatus === 'active' 
                ? `<span style="background:#DCFCE7;color:#166534;padding:4px 8px;border-radius:6px;font-size:0.7rem;font-weight:700;">ACTIVA</span>`
                : `<span style="background:#FEE2E2;color:#991B1B;padding:4px 8px;border-radius:6px;font-size:0.7rem;font-weight:700;">INACTIVA</span>`;
            return `
            <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                <td style="padding:16px;"><strong>${c.companyName||c.name||c.displayName||'---'}</strong><br><span style="font-size:0.75rem;color:#94A3B8;">${c.email||''}</span></td>
                <td style="padding:16px;color:#475569;">${c.ruc||'---'}</td>
                <td style="padding:16px;color:#475569;">${c.phone||'No registrado'}</td>
                <td style="padding:16px;color:#475569;">${memBadge}</td>
                <td style="padding:16px;">${badge}</td>
                <td style="padding:16px;display:flex;gap:6px;align-items:center;">
                    <button class="btn-approve-company" data-id="${c.id}" title="Aprobar" style="background:#10B981;color:white;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-observe-company" data-id="${c.id}" title="Observar" style="background:#F59E0B;color:white;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    <button class="btn-reject-company" data-id="${c.id}" title="Eliminar" style="background:#EF4444;color:white;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-activate-membership" data-id="${c.id}" title="Activar Membresía" style="background:#2563EB;color:white;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;"><i class="fa-solid fa-id-card"></i></button>
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

            <!-- MEMBRESÍAS -->
            <div style="background:#fff;border-radius:16px;border:1px solid #F1F5F9;padding:28px 32px;margin-bottom:32px;box-shadow:0 1px 8px rgba(0,0,0,0.04);">
                <div style="display:flex;align-items:center;gap:24px;">
                    <div style="background:#EFF6FF;color:#2563EB;width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;"><i class="fa-solid fa-id-card-clip"></i></div>
                    <div style="flex:1;">
                        <div style="color:#64748B;font-weight:700;font-size:0.82rem;margin-bottom:2px;">Membresías Activas</div>
                        <div style="font-size:2.2rem;font-weight:900;color:#0F172A;line-height:1.1;">${activeMemberships}</div>
                        <div style="color:#94A3B8;font-size:0.78rem;margin-top:2px;">Empresas suscritas actualmente</div>
                    </div>
                </div>
            </div>

            <!-- HISTORIAL TRABAJOS -->
            ${sec('fa-solid fa-circle-check','#10B981','Historial de Trabajos Finalizados')}
            ${card(`<table class="atbl">${th('Cliente','Especialista','Monto Total','Fecha','Estado del Pago')}<tbody>${historyRows}</tbody></table>`)}

            <!-- VOUCHERS PAGO A ESPECIALISTAS -->
            ${sec('fa-solid fa-hand-holding-dollar','#10B981','Historial de Pago a Especialistas')}
            ${card(`<table class="atbl">${th('Fecha / Hora','Cliente','Especialista','Monto Pagado','Comprobante')}<tbody>${voucherRows}</tbody></table>`)}

            <!-- VOUCHERS DE INGRESOS (pendientes de aprobación) -->
            ${sec('fa-solid fa-file-invoice-dollar','#2563EB','VOUCHERS DE MEMBRESÍAS')}
            ${card(`<table class="atbl">${th('Fecha','Empresa','Voucher','Acción')}<tbody>${incomingVoucherRows}</tbody></table>`)}

            <!-- VOUCHERS DE CERTIFICADOS -->
            ${sec('fa-solid fa-graduation-cap','#F59E0B','VOUCHERS DE CERTIFICADOS')}
            ${card(`<table class="atbl">${th('Fecha','Usuario','Voucher','Origen','Acción')}<tbody>${certificateVoucherRows}</tbody></table>`)}

            <!-- CERTIFICADOS EMITIDOS -->
            ${sec('fa-solid fa-award','#10B981','Certificados Emitidos')}
            ${(() => {
                let issuedRows = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#94A3B8;">No hay certificados emitidos aún.</td></tr>`;
                if (issuedCertificates && issuedCertificates.length > 0) {
                    issuedRows = issuedCertificates.map(c => {
                        const date = c.createdAt ? new Date(c.createdAt.seconds*1000).toLocaleDateString('es-PE') : 'N/A';
                        const verifyUrl = `${window.location.origin}${window.location.pathname}#/certificados?verify=${c.uniqueCode}`;
                        return `
                        <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
                            <td style="padding:16px;color:#475569;">${date}</td>
                            <td style="padding:16px;">
                                <strong>${c.userName}</strong><br>
                                <span style="font-size:0.75rem;color:#64748B;">DNI: ${c.userDni || 'N/A'}</span>
                            </td>
                            <td style="padding:16px;color:#475569;">${c.courseName}</td>
                            <td style="padding:16px;font-family:monospace;font-weight:700;color:#0F172A;">${c.uniqueCode}</td>
                            <td style="padding:16px;">
                                <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                                    ${c.pdfUrl ? `<a href="${c.pdfUrl}" target="_blank" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:6px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-file-pdf"></i> PDF</a>` : ''}
                                    <button class="btn-upload-final-pdf" data-id="${c.id}" data-code="${c.uniqueCode}" style="background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0;padding:6px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Subir / Reemplazar PDF"><i class="fa-solid fa-upload"></i> ${c.pdfUrl ? '' : 'Subir PDF'}</button>
                                    <button class="btn-upload-cert-voucher" data-id="${c.id}" data-code="${c.uniqueCode}" style="background:#FFF7ED;color:#EA580C;border:1px solid #FED7AA;padding:6px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Subir comprobante de pago del certificado"><i class="fa-solid fa-receipt"></i> Voucher</button>
                                    ${c.certVoucherUrl ? `<a href="${c.certVoucherUrl}" target="_blank" style="background:#FEF3C7;color:#B45309;border:1px solid #FDE68A;padding:6px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;" title="Ver voucher subido"><i class="fa-solid fa-eye"></i> Ver</a>` : ''}
                                    <button class="btn-show-qr" data-code="${c.uniqueCode}" data-url="${verifyUrl}" style="background:#F8FAFC;color:#475569;border:1px solid #E2E8F0;padding:6px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-qrcode"></i> QR</button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('');
                }
                return card(`<table class="atbl">${th('Fecha','Titular','Curso','Código','Acciones')}<tbody>${issuedRows}</tbody></table>`);
            })()}


            <!-- EMITIR CERTIFICADO (GENERAR QR Y LUEGO SUBIR PDF) -->
            ${sec('fa-solid fa-certificate','#7C3AED','Emitir Certificado Oficial')}
            <div style="background:#fff;border-radius:16px;border:1px solid #F1F5F9;overflow:hidden;margin-bottom:32px;box-shadow:0 1px 8px rgba(0,0,0,0.04);">
                <div style="padding:28px;display:grid;grid-template-columns:1fr 1fr;gap:32px;" id="cert-emit-container">
                    <!-- Formulario -->
                    <div>
                        <p style="color:#64748B;font-size:0.85rem;margin:0 0 20px 0;">Ingresa los datos para generar el código y el QR. Luego de agregarlos al certificado en Canva, podrás subir el PDF final.</p>
                        <div style="display:flex;flex-direction:column;gap:12px;">
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;color:#64748B;display:block;margin-bottom:4px;">NOMBRE COMPLETO DEL TITULAR *</label>
                                <input id="cert-emit-name" type="text" placeholder="Ej: Juan Pérez García" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;font-size:0.9rem;outline:none;">
                            </div>
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;color:#64748B;display:block;margin-bottom:4px;">DNI DEL TITULAR *</label>
                                <input id="cert-emit-dni" type="text" placeholder="Ej: 12345678" maxlength="8" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;font-size:0.9rem;outline:none;">
                            </div>
                            <div>
                                <label style="font-size:0.75rem;font-weight:700;color:#64748B;display:block;margin-bottom:4px;">NOMBRE DEL CURSO / CERTIFICADO *</label>
                                <input id="cert-emit-course" type="text" placeholder="Ej: Prevención de Riesgos" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;font-size:0.9rem;outline:none;">
                            </div>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;color:#64748B;display:block;margin-bottom:4px;">FECHA DE EMISIÓN</label>
                                    <input id="cert-emit-date" type="date" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;font-size:0.9rem;outline:none;">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;color:#64748B;display:block;margin-bottom:4px;">FECHA DE VENCIMIENTO</label>
                                    <input id="cert-emit-expiry" type="date" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;font-size:0.9rem;outline:none;">
                                </div>
                            </div>
                            <button id="btn-emit-certificate" style="width:100%;padding:14px;background:linear-gradient(135deg,#7C3AED,#2563EB);color:#fff;border:none;border-radius:10px;font-weight:800;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                                <i class="fa-solid fa-qrcode"></i> Generar Código y Guardar
                            </button>
                        </div>
                    </div>
                    <!-- Panel QR (se muestra tras generar) -->
                    <div id="cert-emit-qr-panel" style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:#F8FAFC;border-radius:12px;border:2px dashed #E2E8F0;padding:24px;text-align:center;min-height:300px;">
                        <i class="fa-solid fa-qrcode" style="font-size:3rem;color:#CBD5E1;margin-bottom:12px;"></i>
                        <p style="color:#94A3B8;font-size:0.85rem;margin:0;">El código QR aparecerá aquí después de generar</p>
                    </div>
                </div>
            </div>

            <!-- GESTIÓN DE CURSOS DE CERTIFICACIÓN -->
            ${sec('fa-solid fa-book-open-reader','#14B8A6','Gestión de Cursos y Exámenes')}
            ${card(`<table class="atbl">${th('Curso','Icono','Preguntas','Estado','Acción')}<tbody>${coursesRows}</tbody></table>
            <div style="margin-top:16px;text-align:right;">
                <button id="btn-add-new-course" class="btn-primary" style="background:#14B8A6;color:white;border:none;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-plus"></i> Agregar Nuevo Curso</button>
            </div>
            `)}

            <!-- CONTRATOS EN CURSO -->
            ${sec('fa-solid fa-briefcase','#2563EB','Contratos en Curso')}
            ${card(`<table class="atbl">${th('Empresa / Cliente','Trabajador / Especialista','Duración','Costo Total','Estado')}<tbody>${ongoingRows}</tbody></table>`)}

            <!-- EMPRESAS -->
            ${sec('fa-solid fa-building','#8B5CF6','Empresas Registradas')}
            ${card(`<table class="atbl">${th('Empresa','RUC','Teléfono','Membresía','Validación','Acción')}<tbody>${companiesRows}</tbody></table>`)}

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
