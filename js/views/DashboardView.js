import { renderProfile } from './ProfileView.js';

const renderClientDashboard = (user) => {
    const requests = user.clientRequests || [];

    let html = `
        <div class="client-dashboard" style="background: var(--bg-light); height: 100dvh; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; padding: 24px 24px 100px 24px;">
            <div style="max-width: 800px; margin: 0 auto;">
                <div class="client-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
                    <button class="btn-outline" onclick="window.location.hash='#/'" style="padding: 8px 16px; width:auto; border-radius: 8px;"><i class="fa-solid fa-arrow-left"></i> Volver al Mapa</button>
                    <h2 style="font-size: 1.6rem; color: var(--primary); font-weight:800; margin:0;">Mis Solicitudes</h2>
                    <button id="logout-btn-client" class="btn-outline" style="padding: 8px 16px; color:var(--error); border-color:var(--error); border-radius: 8px; width:auto;"><i class="fa-solid fa-power-off"></i> Salir</button>
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
            } else if (req.status === 'accepted_awaiting_payment' || req.status === 'accepted' || req.status === 'awaiting_payment') {
                statusText = req.status === 'awaiting_payment' ? 'Pago Rechazado - Subir nuevo comprobante' : 'Profesional aceptó - Pago requerido';
                statusColor = '#EF4444'; // Red
                actionHtml = `
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        ${req.status === 'awaiting_payment' ? `
                            <div style="background:rgba(239, 68, 68, 0.1); color:#EF4444; padding:12px; border-radius:8px; margin-bottom:16px; font-size:0.85rem; border:1px solid rgba(239, 68, 68, 0.2);">
                                <i class="fa-solid fa-circle-exclamation"></i> <strong>Tu comprobante anterior fue rechazado.</strong> Por favor verifica los datos y sube un nuevo voucher válido.
                            </div>
                        ` : ''}
                        <p style="font-size: 0.9rem; color: var(--text-dark); margin-bottom: 12px;"><strong>Instrucciones de Pago:</strong></p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Transfiere <strong>S/ ${req.totalAmount}.00</strong> a la cuenta <strong>INTERBANK: 898 3136153503 (CCI: 00389801313615350345)</strong> o Yapea al <strong>915 079 361 (Gerson Enriquez Arauzo)</strong> y sube tu comprobante para confirmar el servicio.</p>
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
                <div style="background: #ffffff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 12px rgba(0,0,0,0.02); padding: 24px; position:relative; overflow:hidden;">
                    <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:${statusColor};"></div>
                    <div class="req-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 16px;">
                        <div style="display:flex; align-items:center; gap: 14px;">
                            <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #FF7A00, #F59E0B); display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.4rem; font-weight:800; box-shadow: 0 4px 10px rgba(255,122,0,0.2);">
                                ${req.professionalName ? req.professionalName.charAt(0).toUpperCase() : 'P'}
                            </div>
                            <div>
                                <h3 style="color: #1E293B; margin:0 0 4px 0; font-size: 1.15rem; font-weight: 800; letter-spacing:-0.3px;">${req.professionalName || 'Profesional'}</h3>
                                <p style="color: #64748B; font-size: 0.85rem; margin:0; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-location-dot" style="color:#CBD5E1;"></i> ${req.address || 'Ubicación'}</p>
                            </div>
                        </div>
                        <div style="text-align:right; background: #F8FAFC; padding: 10px 14px; border-radius: 12px; border: 1px solid #E2E8F0;">
                            <span style="display:block; font-weight: 800; color: #0F172A; font-size: 1.15rem;">S/ ${req.totalAmount}.00</span>
                            <span style="font-size: 0.75rem; color: #94A3B8; font-weight:600; text-transform:uppercase;">${req.days} días</span>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div style="display:inline-flex; align-items:center; gap:6px; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: ${statusColor}15; color: ${statusColor};">
                            <div style="width:6px; height:6px; border-radius:50%; background:${statusColor};"></div>
                            ${statusText}
                        </div>
                        ${(req.status !== 'pending' && req.status !== 'rejected') ? `
                            <button class="btn-open-chat" data-reqid="${req.id}" data-othername="${req.professionalName || 'Profesional'}" data-othertype="professional" style="background:#FFFFFF; color:#1E293B; border: 1px solid #E2E8F0; padding:6px 16px; border-radius:100px; font-size:0.85rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow: 0 4px 10px rgba(0,0,0,0.04); transition: transform 0.2s ease;">
                                💬 Chat
                            </button>
                        ` : ''}
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
            <aside class="dashboard-sidebar" style="position: relative; overflow: hidden; background: #F8FAFC; border-right: 1px solid rgba(0,0,0,0.05);">
                <!-- Premium Cover Background (Solid Orange) -->
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 220px; background: #FF7A00; z-index: 0;"></div>
                
                <div class="dashboard-content" style="position: relative; z-index: 1; padding: 24px;">
                    
                    <!-- Native Header inside Sidebar -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">
                            <a href="#/" style="display:flex; align-items:center; gap:8px; text-decoration:none; background: rgba(255,255,255,0.9); padding: 4px 12px; border-radius: 12px; backdrop-filter: blur(4px); box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                                <img src="img/logo.png" alt="Logo" style="height: 32px; width: auto;">
                                <span style="color: #1E293B; font-size: 0.95rem; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">SafeWork</span>
                            </a>
                        </div>
                        <button onclick="window.location.hash='#/profile';" style="background: rgba(255,255,255,0.95); border: 1px solid rgba(255,255,255,0.4); color: #1E293B; border-radius: 100px; padding: 4px 12px 4px 4px; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); backdrop-filter: blur(4px);">
                            <img src="${user.img || 'https://via.placeholder.com/32?text=P'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #FF7A00;">
                            Mi Perfil
                        </button>
                    </div>
                    ${user.validationStatus === 'observada' ? `
                    <!-- Alerta de Observación -->
                    <div class="v22-card animate-fade-in" style="background: #FEF2F2; border: 1px solid #FECACA; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);">
                        <h3 style="color: #B91C1C; margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 800;"><i class="fa-solid fa-triangle-exclamation"></i> Documentos Observados</h3>
                        <p style="color: #991B1B; font-size: 0.8rem; margin: 0 0 12px 0;">Tu documentación tiene la siguiente observación: <strong style="color:#7F1D1D;">${user.validationReason || 'Por favor revisa y vuelve a subir.'}</strong></p>
                        <button id="btn-reupload-docs" class="btn-primary" style="background: #DC2626; border: none; font-size: 0.85rem; width: 100%; box-shadow: 0 4px 10px rgba(220,38,38,0.3);"><i class="fa-solid fa-cloud-arrow-up"></i> Corregir Documentos</button>
                    </div>
                    ` : (user.validationStatus === 'pendiente' || !user.validationStatus) ? `
                    <!-- Alerta de Revisión Pendiente -->
                    <div class="v22-card animate-fade-in" style="background: #FFFBEB; border: 1px solid #FDE68A; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);">
                        <h3 style="color: #D97706; margin: 0 0 6px 0; font-size: 0.95rem; font-weight: 800;"><i class="fa-solid fa-clock"></i> Cuenta en Revisión</h3>
                        <p style="color: #B45309; font-size: 0.8rem; margin: 0;">Tus documentos están siendo verificados por un admin.</p>
                    </div>
                    ` : ''}

                    <!-- 1. Stats and Welcome (Modernized) -->
                    <div class="v22-card" style="background: #FFFFFF; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border-radius: 16px; margin-bottom: 20px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 16px;">
                            <div>
                                <h2 style="font-size: 1.25rem; font-weight: 900; color: #0F172A; margin:0; letter-spacing: -0.5px;">¡Hola, ${user.name.split(' ')[0]}!</h2>
                                <p style="color: #64748B; font-size: 0.8rem; margin:2px 0 0 0; font-weight: 600;">Modo Conductor Activo</p>
                            </div>
                            <div style="text-align:right;">
                                <span style="font-size: 1rem; font-weight: 900; color: #10B981; background: rgba(16,185,129,0.1); padding: 4px 10px; border-radius: 8px;">S/ ${user.totalEarnings || 0}</span>
                                <button id="btn-global-withdraw" class="btn-primary" style="display:block; width:100%; margin-top:8px; padding: 6px 12px; font-size: 0.75rem; border-radius: 8px; background: #10B981; border: none; box-shadow: 0 4px 10px rgba(16,185,129,0.2); cursor:pointer;"><i class="fa-solid fa-money-bill-transfer"></i> Retirar</button>
                            </div>
                        </div>
                        
                        <div class="stats-mini-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div style="background: #F8FAFC; padding: 12px; border-radius: 12px; text-align:center; border: 1px solid #F1F5F9;">
                                <span style="font-size: 0.65rem; color: #64748B; font-weight: 700; text-transform: uppercase; display:block; margin-bottom: 4px;">Misiones</span>
                                <span style="font-size: 1.1rem; font-weight: 800; color: #0F172A;">${user.completedServices || 0}</span>
                            </div>
                            <div style="background: #F8FAFC; padding: 12px; border-radius: 12px; text-align:center; border: 1px solid #F1F5F9;">
                                <span style="font-size: 0.65rem; color: #64748B; font-weight: 700; text-transform: uppercase; display:block; margin-bottom: 4px;">Rating</span>
                                <span style="font-size: 1.1rem; font-weight: 800; color: #0F172A;">${user.rating || '5.0'} <span style="color:#F59E0B; font-size:0.9rem;">★</span></span>
                            </div>
                        </div>
                        <button id="btn-view-my-reviews" class="btn-outline" style="width:100%; margin-top: 12px; font-size: 0.8rem; padding: 10px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-weight: 700; color: #0F172A; cursor: pointer; transition: all 0.2s ease;">
                            <i class="fa-regular fa-comments" style="color: #3B82F6; margin-right: 6px;"></i> Ver mis comentarios
                        </button>
                    </div>

                    <!-- 2. Availability Toggle (Premium) -->
                    <div class="v22-card" style="display: flex; justify-content: space-between; align-items: center; background: ${user.isOnline ? '#FFF7ED' : '#F8FAFC'}; border: 1px solid ${user.isOnline ? '#FED7AA' : '#E2E8F0'}; box-shadow: 0 4px 12px rgba(0,0,0,0.02); border-radius: 16px; margin-bottom: 24px; transition: all 0.3s ease;">
                        <div>
                            <h4 style="margin: 0; color: #0F172A; font-size: 0.95rem; font-weight: 800;">Radar de Trabajo</h4>
                            <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: ${user.isOnline ? '#EA580C' : '#64748B'}; font-weight: 700;" id="status-text">
                                ${user.isOnline ? '🟢 Estás visible en el mapa' : '⚫ Desconectado'}
                            </p>
                        </div>
                        <label class="switch-ios">
                            <input type="checkbox" id="toggle-online" ${user.isOnline ? 'checked' : ''}>
                            <span class="slider-ios"></span>
                        </label>
                    </div>

                    <!-- 3. Missions List -->
                    <div id="missions-section" style="background: transparent; border: none; padding: 0; box-shadow:none;">
                        <h3 style="color: #0F172A; font-size: 0.9rem; margin-bottom: 16px; padding-left: 2px; font-weight: 800; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-briefcase" style="color:#FF7A00;"></i> Misiones en curso</h3>
                        <div id="accepted-services-list"></div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 20px 0 30px 0;">
                        <button id="logout-btn" style="width: 100%; padding: 14px; border-radius: 14px; background: transparent; color: #EF4444; border: 1.5px solid rgba(239,68,68,0.3); cursor: pointer; font-weight: 800; font-size: 0.85rem; transition: background 0.2s ease;">
                            <i class="fa-solid fa-power-off"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Modals (Hidden by default) -->
            <div class="modal-overlay" id="incoming-request-modal">
                <div class="modal-content" style="max-width: 360px; padding: 24px; text-align: center; border: 1px solid rgba(255,122,0,0.3); position: relative;">
                    <button onclick="document.getElementById('incoming-request-modal').classList.remove('active')" style="position: absolute; top: 12px; right: 16px; background: transparent; border: none; color: #94A3B8; font-size: 1.2rem; cursor: pointer; z-index: 10;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div style="width: 60px; height: 60px; background: rgba(255, 122, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                        <i class="fa-solid fa-bell-concierge" style="font-size: 1.5rem; color: #FF7A00;"></i>
                    </div>
                    <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 8px;">¡Nueva Misión!</h2>
                    <p style="color: #94A3B8; margin-bottom: 16px; font-size: 0.85rem;">Hay un servicio disponible cerca de ti.</p>
                    
                    <div id="incoming-req-error" style="display:none; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #FCA5A5; font-size: 0.85rem; padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: left; line-height: 1.4;"></div>
                    
                    <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 14px; margin-bottom: 20px; text-align: left; border: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
                        <div class="req-row" style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748B;">Cliente:</span> <span class="value" style="color:#fff; font-weight:700;">---</span></div>
                        <div class="req-row" style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748B;">Proyecto:</span> <span class="value" style="color:#fff; font-weight:700;">---</span></div>
                        <div class="req-row" style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748B;">Duración:</span> <span class="value" style="color:#fff; font-weight:700;">---</span></div>
                        <div class="req-row total" style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px; margin-top:8px;"><span style="color:#2563EB; font-weight:800;">GANANCIA:</span> <span class="value" style="color:#2563EB; font-weight:800; font-size:1rem;">---</span></div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button onclick="window.rejectMission()" class="btn-outline" style="border:1px solid rgba(239,68,68,0.2); color:#EF4444; background:transparent; padding:10px; border-radius:10px; cursor:pointer; font-weight:700; font-size:0.85rem;">Rechazar</button>
                        <button onclick="window.acceptMission()" class="btn-primary" style="padding:10px; border-radius:10px; cursor:pointer; font-size:0.85rem;">Aceptar</button>
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
                    <button id="btn-chat-from-accepted" class="btn-primary" style="width:100%; margin-bottom:12px; font-size:0.9rem; background:#2563EB; border:none;">
                        <i class="fa-solid fa-comments"></i> Abrir Chat con el Cliente
                    </button>
                    <button onclick="document.getElementById('service-accepted-modal').classList.remove('active')" class="btn-outline" style="width:100%; background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.1); padding:10px; border-radius:12px; font-size:0.85rem;">Cerrar</button>
                </div>
            </div>

            <!-- CHAT MODAL -->
            <div class="modal-overlay" id="chat-modal" style="z-index:10000;">
                <div class="modal-content" style="max-width:480px;width:96%;padding:0;border:1px solid rgba(37,99,235,0.3);background:#F8FAFC;display:flex;flex-direction:column;max-height:90vh;overflow:hidden;">
                    <!-- Header -->
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#2563EB;flex-shrink:0;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <i class="fa-solid fa-comments" style="color:#fff;font-size:1.1rem;"></i>
                            <div>
                                <h3 style="margin:0;color:#fff;font-size:1rem;font-weight:800;" id="chat-header-name">Chat</h3>
                                <p style="margin:0;color:rgba(255,255,255,0.7);font-size:0.72rem;" id="chat-header-sub">Conversación del servicio</p>
                            </div>
                        </div>
                        <button id="close-chat-modal" style="background:rgba(255,255,255,0.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <!-- Messages -->
                    <div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:280px;"></div>
                    <!-- Input -->
                    <div style="padding:12px 16px;border-top:1px solid #E2E8F0;background:#fff;flex-shrink:0;display:flex;gap:8px;">
                        <input id="chat-input" type="text" placeholder="Escribe un mensaje..." style="flex:1;padding:10px 14px;border:1px solid #E2E8F0;border-radius:10px;font-size:0.9rem;outline:none;font-family:inherit;"/>
                        <button id="btn-send-chat" style="background:#2563EB;color:#fff;border:none;padding:10px 16px;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.85rem;">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Professional Reviews Modal for Worker Dashboard -->
            <div class="modal-overlay" id="my-reviews-modal">
                <div class="modal-content" style="max-width: 480px; padding: 24px; background: #F8FAFC;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                        <h2 style="color: #0F172A; font-size: 1.25rem; font-weight: 800; margin:0;"><i class="fa-solid fa-star" style="color: #F59E0B;"></i> Mis Comentarios</h2>
                        <button id="close-my-reviews-modal" style="background:transparent; border:none; color:#64748B; font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div id="my-reviews-list" style="display:flex; flex-direction:column; gap:16px; max-height: 50vh; overflow-y: auto; padding-right: 8px;">
                         <p style="text-align:center; color:#94A3B8; font-size:0.9rem; padding: 20px;">Cargando comentarios...</p>
                    </div>
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

            <!-- Withdraw Request Modal -->
            <div class="modal-overlay" id="withdraw-modal">
                <div class="modal-content" style="max-width: 400px; padding: 24px; border: 1px solid rgba(16,185,129,0.3); background: var(--surface-white);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
                        <h2 style="color: var(--text-dark); font-size: 1.25rem; font-weight: 800; margin:0;"><i class="fa-solid fa-money-bill-transfer" style="color:var(--success); margin-right:8px;"></i> Retiro de Fondos</h2>
                        <button id="close-withdraw-modal" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div style="display:flex; margin-bottom: 16px; border-bottom: 2px solid var(--border-color);">
                        <button type="button" id="tab-btn-withdraw-method" style="flex:1; padding: 10px; background:none; border:none; border-bottom:3px solid #EF4444; color:#EF4444; font-weight:800; cursor:pointer; font-size: 0.9rem;">Métodos de retiro</button>
                        <button type="button" id="tab-btn-withdraw-history" style="flex:1; padding: 10px; background:none; border:none; border-bottom:3px solid transparent; color:var(--text-muted); font-weight:700; cursor:pointer; font-size: 0.9rem;">Estado de solicitud</button>
                    </div>

                    <div id="withdraw-tab-method">
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">Ingresa tu cuenta bancaria o billetera digital para recibir tus ganancias.</p>
                        
                        <form id="withdraw-form" style="display:flex; flex-direction:column; gap:16px;">
                        <input type="hidden" id="withdraw-req-id">
                        <div>
                            <label style="color:var(--text-dark); font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Método de Pago / Banco</label>
                            <select id="withdraw-bank" class="standard-input" style="padding:10px; font-size:0.85rem;" required>
                                <option value="">Selecciona tu banco...</option>
                                <option value="Yape">Yape</option>
                                <option value="Plin">Plin</option>
                                <option value="BCP">BCP - Banco de Crédito del Perú</option>
                                <option value="Interbank">Interbank</option>
                                <option value="BBVA">BBVA</option>
                                <option value="Scotiabank">Scotiabank</option>
                                <option value="Banco de la Nación">Banco de la Nación</option>
                                <option value="Caja Arequipa">Caja Arequipa</option>
                                <option value="Otro">Otro Banco...</option>
                            </select>
                        </div>
                        <div>
                            <input type="text" id="withdraw-account" class="standard-input" placeholder="Ej. 191-12345678-0-12 o 915 079 361" style="padding:10px; font-size:0.85rem;" required>
                        </div>
                        <div>
                            <label style="color:var(--text-dark); font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Titular de la cuenta</label>
                            <input type="text" id="withdraw-titular" class="standard-input" placeholder="Nombre completo" required style="padding:10px; font-size:0.85rem;" value="${user.name}">
                        </div>

                        <div style="background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); padding: 12px; border-radius: 8px; margin-top: 12px;">
                            <label style="color:var(--text-dark); font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">Monto a Retirar (S/)</label>
                            <input type="number" id="withdraw-amount" class="standard-input" placeholder="Ej. 150" max="${user.totalEarnings || 0.0001}" step="1" required style="padding:10px; font-size:0.85rem; font-weight: 800; color:var(--text-dark);">
                            <span style="display:block; margin-top:4px; font-size: 0.7rem; color: var(--text-muted);">Saldo disponible máximo: S/ <strong>${user.totalEarnings || 0}</strong></span>
                        </div>

                        <div id="withdraw-error" style="background:rgba(239, 68, 68, 0.1); color:#EF4444; font-size:0.85rem; display:none; padding:12px; border-radius:8px; margin-top: 12px;"></div>
                        
                        <button type="submit" id="btn-submit-withdraw" class="btn-primary" style="margin-top:8px; display:flex; justify-content:center; align-items:center; gap:8px; background:#10B981; border:none; box-shadow: 0 4px 10px rgba(16,185,129,0.2);">
                            <span id="withdraw-btn-text">Enviar Solicitud de Retiro</span>
                            <i class="fa-solid fa-spinner fa-spin" id="withdraw-spinner" style="display:none;"></i>
                        </button>
                        </form>
                    </div>

                    <div id="withdraw-tab-history" style="display:none; flex-direction:column; gap:8px;">
                        <div id="withdraw-history-list" style="max-height: 250px; overflow-y: auto; display:flex; flex-direction:column; gap:8px;">
                            <div style="text-align:center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando estado...</div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Company Details Modal -->
            <div class="modal-overlay" id="company-modal">
                <div class="modal-content" style="max-width: 400px; padding: 24px; border: 1px solid rgba(37,99,235,0.3); background: var(--surface-white);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                        <h2 style="color: var(--text-dark); font-size: 1.25rem; font-weight: 800; margin:0;"><i class="fa-solid fa-building" style="color:var(--primary); margin-right:8px;"></i> Perfil de Empresa</h2>
                        <button id="close-company-modal" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div style="background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.1); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                        <h3 id="comp-modal-name" style="color: var(--primary); font-size: 1.1rem; margin: 0 0 8px 0;">---</h3>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0 0 4px 0;"><i class="fa-solid fa-envelope" style="width:16px;"></i> <span id="comp-modal-email">---</span></p>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;"><i class="fa-solid fa-id-card" style="width:16px;"></i> RUC: <span id="comp-modal-ruc">No registrado</span></p>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:0.85rem; color:#10B981; font-weight:600; padding:12px; background:rgba(16,185,129,0.1); border-radius:8px;">
                        <i class="fa-solid fa-shield-halved"></i> Empresa Registrada y Verificada
                    </div>
                </div>
            </div>
        </div>
    `;
};

// We keep renderHomeTab as a reference or if we ever need it, but renderDashboard is now unified.
export const renderHomeTab = (user) => {
    return `<!-- Unified into renderDashboard -->`;
};
