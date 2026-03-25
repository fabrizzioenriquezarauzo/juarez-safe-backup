import { renderProfile } from './ProfileView.js';

const renderClientDashboard = (user) => {
    const requests = user.clientRequests || [];

    let html = `
        <div class="client-dashboard" style="background: var(--bg-light); min-height: 100vh; padding: 40px 24px;">
            <div style="max-width: 800px; margin: 0 auto;">
                <div class="client-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
                    <button class="btn-outline" onclick="window.location.hash='#/'" style="padding: 8px 16px; width:auto;"><i class="fa-solid fa-arrow-left"></i> Volver al Mapa</button>
                    <h2 style="font-size: 1.5rem; color: var(--primary); margin:0;">Mis Solicitudes</h2>
                    <button id="logout-btn-client" class="btn-outline" style="padding: 8px 16px; color:var(--error); border-color:var(--error); width:auto;"><i class="fa-solid fa-power-off"></i> Salir</button>
                </div>
    `;

    if (requests.length === 0) {
        html += `<div style="text-align:center; padding: 48px; background: var(--surface-white); border-radius: 12px; border: 1px solid var(--border-color);">
            <i class="fa-regular fa-folder-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
            <h3 style="color: var(--text-dark);">Aún no tienes solicitudes</h3>
            <p style="color: var(--text-muted); margin-bottom: 24px;">Solicita un profesional desde el mapa.</p>
            <a href="#/" class="btn-primary" style="display:inline-block; padding: 12px 24px; text-decoration:none; width:auto;">Ver Mapa</a>
        </div>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap: 16px;">`;
        requests.forEach(req => {
            let statusText = '';
            let statusColor = '';
            let actionHtml = '';

            // Using the new flow states
            if (req.status === 'pending') {
                statusText = 'Esperando al Profesional';
                statusColor = '#F59E0B'; // Amber
            } else if (req.status === 'accepted_awaiting_payment' || req.status === 'accepted') {
                statusText = 'Profesional aceptó - Pago requerido';
                statusColor = '#EF4444'; // Red
                actionHtml = `
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        <p style="font-size: 0.9rem; color: var(--text-dark); margin-bottom: 12px;"><strong>Instrucciones de Pago:</strong></p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Transfiere <strong>S/ ${req.totalAmount}.00</strong> a la cuenta BCP o Yapea al 999 999 999 (J&A SafeWork) y sube tu comprobante para confirmar el servicio.</p>
                        <label id="lbl-upload-${req.id}" for="upload-voucher-${req.id}" class="btn-primary" style="background: #FF7A00; border-color: #FF7A00; cursor:pointer; text-align:center; display:block; padding: 12px; box-shadow: 0 4px 15px rgba(255,122,0,0.2);">
                            <i class="fa-solid fa-cloud-arrow-up"></i> Pagar y Subir Voucher
                        </label>
                        <input type="file" id="upload-voucher-${req.id}" data-reqid="${req.id}" class="voucher-upload-input" accept="image/*,.pdf" style="display:none;">
                    </div>
                `;
            } else if (req.status === 'payment_verifying') {
                statusText = 'Comprobante en verificación';
                statusColor = '#3B82F6'; // Blue
                actionHtml = `<div style="margin-top:16px; font-size: 0.85rem; color: #FF7A00; background: rgba(255, 122, 0, 0.1); padding: 12px; border-radius: 8px;"><i class="fa-solid fa-clock"></i> Estamos verificando tu pago. Te contactaremos pronto.</div>`;
            } else if (req.status === 'approved') {
                statusText = 'Pago Aprobado - Servicio Activo';
                statusColor = '#10B981'; // Green
                actionHtml = `<div style="margin-top:16px; font-size: 0.85rem; color: #1E293B; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 8px;"><i class="fa-solid fa-check" style="color:#FF7A00;"></i> El profesional ha sido notificado y se pondrá en contacto pronto.</div>`;
            } else if (req.status === 'completed' || req.status === 'paid_to_professional') {
                statusText = 'Servicio Finalizado';
                statusColor = '#64748B'; // Slate

                if (!req.hasReview) {
                    actionHtml = `
                    <div style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                        <button class="btn-primary open-review-btn" data-reqid="${req.id}" data-profid="${req.professionalId}" data-profname="${req.professionalName}" style="background:#F59E0B; border:none; width:100%;">
                            <i class="fa-solid fa-star"></i> Calificar Especialista
                        </button>
                    </div>`;
                } else {
                    actionHtml = `<div style="margin-top:16px; font-size: 0.85rem; color: #F59E0B; background: rgba(245, 159, 11, 0.1); padding: 12px; border-radius: 8px;"><i class="fa-solid fa-star"></i> Especialista Calificado</div>`;
                }
            } else if (req.status === 'rejected') {
                statusText = 'Solicitud Rechazada por el profesional';
                statusColor = '#EF4444';
            }

            html += `
                <div style="background: var(--surface-white); border-radius: 12px; border: 1px solid var(--border-color); padding: 24px;">
                    <div class="req-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <h3 style="color: var(--text-dark); margin:0 0 4px 0;">${req.professionalName || 'Profesional'}</h3>
                            <p style="color: var(--text-muted); font-size: 0.85rem; margin:0;"><i class="fa-solid fa-location-dot"></i> ${req.address || 'Ubicación'}</p>
                        </div>
                        <div style="text-align:right;">
                            <span style="display:block; font-weight: 800; color: var(--primary); font-size: 1.1rem;">S/ ${req.totalAmount}.00</span>
                            <span style="font-size: 0.75rem; color: var(--text-light);">${req.days} días</span>
                        </div>
                    </div>
                    <div style="display:inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: ${statusColor}15; color: ${statusColor};">
                        ${statusText}
                    </div>
                    ${actionHtml}
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `
            </div>
            
            <!-- Rating Modal -->
            <div class="modal-overlay" id="rating-modal">
                <div class="modal-content" style="max-width: 400px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); background: var(--surface-white);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                        <h2 style="color: var(--text-dark); font-size: 1.25rem; margin:0;">Calificar Servicio</h2>
                        <button id="close-rating-modal" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">¿Cómo calificarías el servicio de <strong id="rating-prof-name"></strong>?</p>
                    
                    <form id="rating-form" style="display:flex; flex-direction:column; gap:16px;">
                        <input type="hidden" id="rating-req-id">
                        <input type="hidden" id="rating-prof-id">
                        
                        <div style="display:flex; justify-content:center; gap:8px; font-size:2rem; cursor:pointer;" id="star-rating-container">
                            <i class="fa-regular fa-star star-btn" data-val="1" style="color:#F59E0B;"></i>
                            <i class="fa-regular fa-star star-btn" data-val="2" style="color:#F59E0B;"></i>
                            <i class="fa-regular fa-star star-btn" data-val="3" style="color:#F59E0B;"></i>
                            <i class="fa-regular fa-star star-btn" data-val="4" style="color:#F59E0B;"></i>
                            <i class="fa-regular fa-star star-btn" data-val="5" style="color:#F59E0B;"></i>
                        </div>
                        <input type="hidden" id="rating-value" value="0">
                        
                        <div>
                            <label style="color:var(--text-dark); font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Comentario (Opcional)</label>
                            <textarea id="rating-comment" class="standard-input" rows="3" placeholder="Muy buen trabajo, puntual..." style="padding:10px; font-size:0.85rem; resize:none;"></textarea>
                        </div>

                        <div id="rating-error" style="background:rgba(239, 68, 68, 0.1); color:#EF4444; font-size:0.85rem; display:none; padding:12px; border-radius:8px;"></div>
                        
                        <button type="submit" id="btn-submit-rating" class="btn-primary" style="background:#F59E0B; border:none; margin-top:8px;">
                            <span id="rating-btn-text">Enviar Calificación</span>
                            <i class="fa-solid fa-spinner fa-spin" id="rating-spinner" style="display:none;"></i>
                        </button>
                    </form>
                </div>
            </div>
            
        </div>
    `;
    return html;
};

export const renderDashboard = (user) => {
    if (user.userType === 'client') {
        return renderClientDashboard(user);
    }

    return `
        <div class="dashboard-container animate-fade-in">
            <!-- Removed floating header, moved natively to sidebar -->

            <!-- Map Area (Background) -->
            <main class="dashboard-map-area">
                <div id="map-dashboard" style="width: 100%; height: 100%;"></div>
            </main>

            <!-- Bottom Sheet Sidebar (Foreground) -->
            <aside class="dashboard-sidebar">
                <div class="dashboard-content">
                    
                    <!-- Native Header inside Sidebar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <a href="#/" style="display:flex; align-items:center; gap:8px; text-decoration:none;">
                                <img src="img/logo.png" alt="Logo" style="height: 48px; width: auto;">
                                <span style="color: #1E293B; font-size: 1.1rem; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">J&A SafeWork</span>
                            </a>
                        </div>
                        <button onclick="window.location.hash='#/profile';" style="background: white; border: 1px solid #E2E8F0; color: #1E293B; border-radius: 100px; padding: 6px 14px 6px 6px; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                            <img src="${user.img || 'https://via.placeholder.com/32?text=P'}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,122,0,0.4);">
                            Mi Perfil
                        </button>
                    </div>
                    ${user.validationStatus === 'observada' ? `
                    <!-- Alerta de Observación -->
                    <div class="v22-card animate-fade-in" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.4); margin-bottom: 16px;">
                        <h3 style="color: #EF4444; margin: 0 0 8px 0; font-size: 1rem;"><i class="fa-solid fa-triangle-exclamation"></i> Documentos Observados</h3>
                        <p style="color: #FCA5A5; font-size: 0.85rem; margin: 0 0 12px 0;">Tu documentación tiene la siguiente observación: <strong style="color:#fff;">${user.validationReason || 'Por favor revisa y vuelve a subir.'}</strong></p>
                        <button id="btn-reupload-docs" class="btn-primary" style="background: #EF4444; border: none; font-size: 0.85rem; width: 100%;"><i class="fa-solid fa-cloud-arrow-up"></i> Subir Documentos Corregidos</button>
                    </div>
                    ` : (user.validationStatus === 'pendiente' || !user.validationStatus) ? `
                    <!-- Alerta de Revisión Pendiente -->
                    <div class="v22-card animate-fade-in" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); margin-bottom: 16px;">
                        <h3 style="color: #F59E0B; margin: 0 0 8px 0; font-size: 1rem;"><i class="fa-solid fa-clock"></i> Cuenta en Revisión</h3>
                        <p style="color: #FCD34D; font-size: 0.85rem; margin: 0;">Tus documentos están siendo verificados por un administrador. Podrás recibir solicitudes muy pronto.</p>
                    </div>
                    ` : ''}

                    <!-- 1. Stats and Welcome (Compact) -->
                    <div class="v22-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
                            <div>
                                <h2 style="font-size: 1.1rem; font-weight: 800; color: #1E293B; margin:0;">¡Hola, ${user.name.split(' ')[0]}!</h2>
                                <p style="color: #64748B; font-size: 0.75rem; margin:0;">Modo Conductor Activo</p>
                            </div>
                            <div style="text-align:right;">
                                <span style="font-size: 0.85rem; font-weight: 800; color: #FF7A00;">S/ ${user.totalEarnings || 0}</span>
                            </div>
                        </div>
                        
                        <div class="stats-mini-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div style="background: rgba(0,0,0,0.02); padding: 8px; border-radius: 8px; text-align:center;">
                                <span style="font-size: 0.6rem; color: #64748B; text-transform: uppercase; display:block;">Misiones</span>
                                <span style="font-size: 0.9rem; font-weight: 700; color: #1E293B;">${user.completedServices || 0}</span>
                            </div>
                            <div style="background: rgba(0,0,0,0.02); padding: 8px; border-radius: 8px; text-align:center;">
                                <span style="font-size: 0.6rem; color: #64748B; text-transform: uppercase; display:block;">Rating</span>
                                <span style="font-size: 0.9rem; font-weight: 700; color: #1E293B;">${user.rating || '5.0'} ⭐</span>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Availability Toggle (Crucial) -->
                    <div class="v22-card" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 122, 0, 0.05); border: 1px solid rgba(255, 122, 0, 0.2);">
                        <div>
                            <h4 style="margin: 0; color: #1E293B; font-size: 0.9rem;">Disponibilidad Radar</h4>
                            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: ${user.isOnline ? '#FF7A00' : '#94A3B8'}; font-weight: 600;" id="status-text">
                                ${user.isOnline ? 'Estás visible' : 'Desconectado'}
                            </p>
                        </div>
                        <label class="switch-ios">
                            <input type="checkbox" id="toggle-online" ${user.isOnline ? 'checked' : ''}>
                            <span class="slider-ios"></span>
                        </label>
                    </div>

                    <!-- 3. Missions List -->
                    <div class="v22-card" id="missions-section" style="background: transparent; border: none; padding: 0; box-shadow:none;">
                        <h3 style="color: #1E293B; font-size: 0.85rem; margin-bottom: 12px; padding-left: 4px;"><i class="fa-solid fa-briefcase"></i> Misiones en curso</h3>
                        <div id="accepted-services-list"></div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 10px 0 30px 0;">
                        <button id="logout-btn" style="width: 100%; padding: 12px; border-radius: 12px; background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); cursor: pointer; font-weight: 700; font-size: 0.85rem;">
                            <i class="fa-solid fa-power-off"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Modals (Hidden by default) -->
            <div class="modal-overlay" id="incoming-request-modal">
                <div class="modal-content" style="max-width: 360px; padding: 24px; text-align: center; border: 1px solid rgba(255,122,0,0.3);">
                    <div style="width: 60px; height: 60px; background: rgba(255, 122, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                        <i class="fa-solid fa-bell-concierge" style="font-size: 1.5rem; color: #FF7A00;"></i>
                    </div>
                    <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 8px;">¡Nueva Misión!</h2>
                    <p style="color: #94A3B8; margin-bottom: 20px; font-size: 0.85rem;">Hay un servicio disponible cerca de ti.</p>
                    
                    <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 14px; margin-bottom: 20px; text-align: left; border: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
                        <div class="req-row" style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748B;">Cliente:</span> <span class="value" style="color:#fff; font-weight:700;">---</span></div>
                        <div class="req-row" style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748B;">Proyecto:</span> <span class="value" style="color:#fff; font-weight:700;">---</span></div>
                        <div class="req-row" style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748B;">Duración:</span> <span class="value" style="color:#fff; font-weight:700;">---</span></div>
                        <div class="req-row total" style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px; margin-top:8px;"><span style="color:#2563EB; font-weight:800;">GANANCIA:</span> <span class="value" style="color:#2563EB; font-weight:800; font-size:1rem;">---</span></div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button id="btn-reject-req" class="btn-outline" style="border:1px solid rgba(239,68,68,0.2); color:#EF4444; background:transparent; padding:10px; border-radius:10px; cursor:pointer; font-weight:700; font-size:0.85rem;">Rechazar</button>
                        <button id="btn-accept-req" class="btn-primary" style="padding:10px; border-radius:10px; cursor:pointer; font-size:0.85rem;">Aceptar</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="service-accepted-modal">
                <div class="modal-content" style="max-width: 400px; padding: 32px; text-align: center; border: 1px solid rgba(52, 211, 153, 0.2);">
                    <div style="width: 64px; height: 64px; background: rgba(52, 211, 153, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;">
                        <i class="fa-solid fa-check" style="font-size: 2rem; color: #34D399;"></i>
                    </div>
                    <h2 style="color: #fff; font-size: 1.5rem; font-weight: 800; margin-bottom: 8px;">¡Confirmado!</h2>
                    <p style="color: #94A3B8; margin-bottom: 24px; font-size: 0.95rem; line-height: 1.5;">Has aceptado el servicio de <strong id="accepted-client-name" style="color:#fff;">---</strong>.</p>
                    
                    <a id="btn-whatsapp-contact" target="_blank" class="btn-primary" style="background:#25D366; text-decoration:none; margin-bottom:12px; font-size:0.9rem;">
                        <i class="fa-brands fa-whatsapp"></i> Contactar Cliente
                    </a>
                    <button onclick="location.reload()" class="btn-outline" style="width:100%; background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.1); padding:10px; border-radius:12px; font-size:0.85rem;">Ir al Mapa</button>
                </div>
            </div>

            <!-- Reupload Modal -->
            <div class="modal-overlay" id="reupload-docs-modal">
                <div class="modal-content" style="max-width: 400px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-dark);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                        <h2 style="color: #fff; font-size: 1.25rem; font-weight: 800; margin:0;">Corregir Documentos</h2>
                        <button id="close-reupload-modal" style="background:transparent; border:none; color:#94A3B8; font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="color: #93C5FD; font-size: 0.8rem; margin: 0;"><i class="fa-solid fa-circle-info"></i> Sube únicamente el documento que fue observado o vuelve a subir todo corregido.</p>
                    </div>
                    
                    <form id="reupload-form" style="display:flex; flex-direction:column; gap:16px;">
                        <div>
                            <label style="color:#E2E8F0; font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">DNI (Frente y Reverso)</label>
                            <input type="file" id="reupload-dni" class="standard-input" accept="image/*,.pdf" style="padding:10px; font-size:0.8rem;">
                        </div>
                        <div>
                            <label style="color:#E2E8F0; font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Certiadulto / Antecedentes</label>
                            <input type="file" id="reupload-certiadulto" class="standard-input" accept="image/*,.pdf" style="padding:10px; font-size:0.8rem;">
                        </div>
                        ${user.specialty !== 'Ama de Casa' ? `
                        <div>
                            <label style="color:#E2E8F0; font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">CV Documentado</label>
                            <input type="file" id="reupload-cv" class="standard-input" accept="image/*,.pdf" style="padding:10px; font-size:0.8rem;">
                        </div>
                        <div>
                            <label style="color:#E2E8F0; font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Certificados (Opcional)</label>
                            <input type="file" id="reupload-cert" class="standard-input" accept="image/*,.pdf" style="padding:10px; font-size:0.8rem;">
                        </div>
                        ` : ''}

                        <div id="reupload-error" style="background:rgba(239, 68, 68, 0.1); color:#FCA5A5; font-size:0.85rem; display:none; padding:12px; border-radius:8px; border:1px solid rgba(239, 68, 68, 0.3);"></div>
                        
                        <button type="submit" id="btn-submit-reupload" class="btn-primary" style="margin-top:8px; display:flex; justify-content:center; align-items:center; gap:8px;">
                            <span id="reupload-btn-text">Subir y Enviar a Revisión</span>
                            <i class="fa-solid fa-spinner fa-spin" id="reupload-spinner" style="display:none;"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
};

// We keep renderHomeTab as a reference or if we ever need it, but renderDashboard is now unified.
export const renderHomeTab = (user) => {
    return `<!-- Unified into renderDashboard -->`;
};
