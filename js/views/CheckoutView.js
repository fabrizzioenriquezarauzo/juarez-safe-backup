export const renderCheckout = (professional) => {
    if (!professional) {
        return `
            <div style="padding: 40px; text-align: center; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <h2>Error: Profesional no seleccionado</h2>
                <button class="btn-primary" onclick="window.history.back()" style="max-width:200px; margin-top: 20px;">Volver</button>
            </div>
        `;
    }

    return `
        <div class="checkout-page" style="display:flex; height:100vh; background:var(--bg-light);">
            <div class="checkout-sidebar" style="width: 480px; background:var(--surface-white); padding:32px; border-right:1px solid var(--border-color); overflow-y:auto;">
                <button class="btn-outline" style="margin-bottom: 24px; width:auto; padding: 8px 16px;" onclick="window.location.hash='#/'">
                    <i class="fa-solid fa-arrow-left"></i> Volver al Mapa
                </button>
                
                <h2 style="font-size: 1.5rem; color:var(--primary); margin-bottom:8px;">Solicitar Servicio</h2>
                <p style="color:var(--text-muted); margin-bottom: 24px;">Completa los detalles para tu requerimiento SSOMA.</p>

                <div class="prof-card" style="margin-bottom: 32px; pointer-events:none;">
                    <div class="prof-header">
                        <img src="${professional.img}" class="prof-avatar">
                        <div class="prof-info-main">
                            <h4>${professional.name}</h4>
                            <span class="badge ${professional.specialty.replace(' ', '-').toLowerCase()}" style="display:inline-block; margin-top:4px; padding:4px 10px; font-size:0.75rem;">${professional.specialty}</span>
                        </div>
                        <div class="price">
                            <strong>S/ ${professional.rate}</strong><span>/día</span>
                        </div>
                    </div>
                </div>

                <form id="checkout-form">
                    <div class="form-group">
                        <label>Fecha de Inicio del Servicio</label>
                        <div class="input-with-icon">
                            <i class="fa-regular fa-calendar" style="position:absolute; left:16px; top:14px; color:var(--text-muted);"></i>
                            <input type="date" id="service-date" class="standard-input" style="padding-left:44px;" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Días requeridos</label>
                        <div class="input-with-icon">
                            <i class="fa-regular fa-clock" style="position:absolute; left:16px; top:14px; color:var(--text-muted);"></i>
                            <input type="number" id="days-input" class="standard-input" value="1" min="1" style="padding-left:44px;" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Dirección del Proyecto</label>
                        <div class="input-with-icon">
                            <i class="fa-solid fa-location-dot" style="position:absolute; left:16px; top:14px; color:var(--text-muted);"></i>
                            <input type="text" id="project-address" class="standard-input" placeholder="Ej. Av. Larco 123, Miraflores" style="padding-left:44px;" required>
                        </div>
                    </div>

                    <div class="form-group" style="margin-top:20px;">
                        <label>Nombre del Solicitante / Empresa</label>
                        <input type="text" id="client-name" class="standard-input" placeholder="Tu nombre o Razón Social" required>
                    </div>

                    <div style="display:flex; gap:12px; margin-top:12px;">
                        <div class="form-group" style="flex:1;">
                            <label>Email de Contacto</label>
                            <input type="email" id="client-email" class="standard-input" placeholder="correo@ejemplo.com" required>
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Teléfono</label>
                            <input type="tel" id="client-phone" class="standard-input" placeholder="999 999 999" required>
                        </div>
                    </div>

                    <div class="pricing-card" style="margin-top:32px; background:#F8FAFC; border:1px solid #E2E8F0; padding:24px; border-radius:12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px; color:var(--text-dark);">
                            <span>Tarifa Especialista</span>
                            <span id="calc-subtotal" style="font-weight:600;">S/ ${professional.rate}.00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:16px; color:var(--text-dark);">
                            <span>Garantía SafeWork (25%)</span>
                            <span id="calc-commission" style="font-weight:600;">S/ ${(professional.rate * 0.25).toFixed(2)}</span>
                        </div>
                        <div style="border-top:1px solid var(--border-color); padding-top:16px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Reserva Total</span>
                            <span class="price-value" id="total-price" style="font-size:2rem; font-weight:700; color:var(--primary);">S/ ${(professional.rate * 1.25).toFixed(2)}</span>
                        </div>
                    </div>

                    <button type="submit" id="btn-submit-request" class="btn-primary" style="margin-top: 24px; padding:16px; font-size:1.1rem; background-color: var(--primary);">
                        <i class="fa-solid fa-paper-plane"></i> Enviar Solicitud al Profesional
                    </button>
                </form>
            </div>
            
            <div class="checkout-map" style="flex:1; background-color: #FFF7ED; background-image: radial-gradient(circle at 50% 50%, #FFEDD5 0%, #FFF7ED 100%); display:flex; align-items:center; justify-content:center; flex-direction:column; color:#1E293B;">
                <div class="logo-wrapper" style="margin-bottom: 24px;">
                    <img src="img/logo.png" alt="Logo J&A SafeWork" class="responsive-logo" style="height: 240px;">
                    <h1 class="brand-title" style="font-size: 2.4rem; color: #FF7A00;">J&A SafeWork</h1>
                    <p style="color: #F59E0B; font-size: 0.9rem; font-weight: 700; letter-spacing: 5px; margin-top: 8px; text-align: center;">GESTIÓN DE TRABAJO SEGURO</p>
                </div>
                
                <p style="font-size:1.1rem; color:var(--text-muted); opacity:0.9; max-width:400px; text-align:center;">Conectando empresas con los mejores profesionales SSOMA validados.</p>
            </div>

            <!-- Success Modal -->
            <div class="modal-overlay" id="success-modal">
                <div class="modal-content" style="text-align:center; padding:48px 32px;">
                    <div style="width:80px; height:80px; border-radius:50%; background:rgba(16,185,129,0.15); border: 2px solid rgba(16,185,129,0.4); display:flex; align-items:center; justify-content:center; margin:0 auto 24px auto;">
                        <i class="fa-solid fa-paper-plane" style="font-size:2.5rem; color:#34D399;"></i>
                    </div>
                    <h2 style="font-size:1.75rem; color:#FFFFFF; margin-bottom:12px;">¡Solicitud Enviada!</h2>
                    <p style="color:#94A3B8; margin-bottom: 32px; font-size:1.05rem; line-height:1.6;">Hemos notificado a <strong style="color:#FFFFFF;">${professional.name}</strong>. Cuando acepte el trabajo, podrás realizar el pago desde tu Panel de Control.</p>
                    <button class="btn-primary" onclick="window.location.hash='#/dashboard'" style="padding:14px 28px;">Ir a mis Solicitudes</button>
                </div>
            </div>
        </div>
    `;
};
