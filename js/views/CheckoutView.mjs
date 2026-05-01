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
            <div class="checkout-sidebar" style="width: 500px; background:var(--surface-white); padding:28px 28px; border-right:1px solid var(--border-color); overflow-y:auto;">
                <button class="btn-outline" style="margin-bottom: 20px; width:auto; padding: 8px 16px;" onclick="window.location.hash='#/'">
                    <i class="fa-solid fa-arrow-left"></i> Volver al Mapa
                </button>
                
                <h2 style="font-size: 1.5rem; color:var(--primary); margin-bottom:6px;">Solicitar Servicio</h2>
                <p style="color:var(--text-muted); margin-bottom: 20px;">Selecciona los días que necesitas al profesional.</p>

                <div class="prof-card" style="margin-bottom: 24px; pointer-events:none;">
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
                    <!-- ═══ CALENDARIO MULTI-DÍA ═══ -->
                    <div style="margin-bottom:20px;">
                        <label style="display:flex; align-items:center; gap:8px; font-weight:700; color:#0F172A; margin-bottom:10px;">
                            <i class="fa-regular fa-calendar-days" style="color:#FF7A00;"></i>
                            Selecciona los días de trabajo
                        </label>

                        <!-- Leyenda -->
                        <div style="display:flex; gap:12px; margin-bottom:10px; flex-wrap:wrap;">
                            <span style="display:flex;align-items:center;gap:5px;font-size:0.72rem;color:#64748B;">
                                <span style="width:12px;height:12px;border-radius:3px;background:#FF7A00;display:inline-block;"></span> Día seleccionado
                            </span>
                            <span style="display:flex;align-items:center;gap:5px;font-size:0.72rem;color:#EF4444;">
                                <span style="width:12px;height:12px;border-radius:3px;background:#FEE2E2;border:1px solid #EF4444;display:inline-block;"></span> Domingo (paga ×2)
                            </span>
                            <span style="display:flex;align-items:center;gap:5px;font-size:0.72rem;color:#94A3B8;">
                                <span style="width:12px;height:12px;border-radius:3px;background:#F1F5F9;display:inline-block;"></span> No disponible
                            </span>
                        </div>

                        <!-- Nota de domingos -->
                        <div style="background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:flex-start; gap:8px;">
                            <i class="fa-solid fa-circle-exclamation" style="color:#EF4444; margin-top:2px; flex-shrink:0;"></i>
                            <p style="margin:0; color:#7F1D1D; font-size:0.78rem; line-height:1.5;">
                                <strong>Los domingos no se laboran normalmente.</strong> Si necesitas al profesional ese día, la tarifa será del <strong>doble (×2)</strong>.
                            </p>
                        </div>

                        <!-- Calendario container -->
                        <div id="multi-calendar" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px; user-select:none;">

                            <!-- Navegación de mes -->
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                                <button type="button" id="cal-prev" style="background:#fff; border:1px solid #E2E8F0; border-radius:8px; width:34px; height:34px; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center;">
                                    <i class="fa-solid fa-chevron-left" style="font-size:0.75rem; color:#64748B;"></i>
                                </button>
                                <span id="cal-month-label" style="font-weight:800; color:#0F172A; font-size:0.95rem;"></span>
                                <button type="button" id="cal-next" style="background:#fff; border:1px solid #E2E8F0; border-radius:8px; width:34px; height:34px; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center;">
                                    <i class="fa-solid fa-chevron-right" style="font-size:0.75rem; color:#64748B;"></i>
                                </button>
                            </div>

                            <!-- Cabecera días de la semana -->
                            <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:6px;">
                                ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) =>
        `<div style="text-align:center; font-size:0.7rem; font-weight:800; color:${i === 6 ? '#EF4444' : '#64748B'}; padding:4px 0;">${d}</div>`
    ).join('')}
                            </div>

                            <!-- Grid de días (se llena con JS) -->
                            <div id="cal-grid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:3px;"></div>
                        </div>

                        <!-- Días seleccionados (lista resumen) -->
                        <div id="selected-days-summary" style="margin-top:12px; display:none;">
                            <p style="font-size:0.72rem; color:#64748B; font-weight:700; text-transform:uppercase; margin-bottom:6px;">Días seleccionados:</p>
                            <div id="selected-days-list" style="display:flex; flex-wrap:wrap; gap:6px;"></div>
                        </div>
                    </div>

                    <!-- Dirección, Info empresa -->
                    <div class="form-group">
                        <label>Dirección del Proyecto</label>
                        <div class="input-with-icon">
                            <i class="fa-solid fa-location-dot" style="position:absolute; left:16px; top:14px; color:var(--text-muted);"></i>
                            <input type="text" id="project-address" class="standard-input" placeholder="Ej. Av. Larco 123, Miraflores" style="padding-left:44px;" required>
                        </div>
                    </div>

                    <div class="form-group" style="margin-top:16px;">
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
                            <input type="tel" id="client-phone" class="standard-input" placeholder="915 079 361" required>
                        </div>
                    </div>

                    <!-- Pricing -->
                    <div class="pricing-card" style="margin-top:24px; background:#F8FAFC; border:1px solid #E2E8F0; padding:20px; border-radius:12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:var(--text-dark); font-size:0.85rem;">
                            <span id="days-summary-label">Días seleccionados: <strong>0</strong></span>
                            <span id="calc-subtotal" style="font-weight:600;">S/ 0.00</span>
                        </div>
                        <div id="sunday-row" style="display:none; justify-content:space-between; margin-bottom:8px; font-size:0.82rem; color:#EF4444;">
                            <span>↳ <span id="sunday-count">0</span> domingo(s) ×2</span>
                            <span id="sunday-extra">+ S/ 0.00</span>
                        </div>
                        <div style="border-top:1px solid var(--border-color); padding-top:14px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Total a Pagar</span>
                            <span class="price-value" id="total-price" style="font-size:2rem; font-weight:700; color:var(--primary);">S/ 0.00</span>
                        </div>
                    </div>

                    <!-- Datos bancarios -->
                    <div style="margin-top:20px; background:linear-gradient(135deg,#0F172A,#1E293B); border:2px solid #FF7A00; border-radius:16px; padding:20px; position:relative; overflow:hidden;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
                            <div style="background:#FF7A00; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <i class="fa-solid fa-building-columns" style="color:white; font-size:0.85rem;"></i>
                            </div>
                            <div>
                                <h4 style="margin:0; color:#FF7A00; font-size:0.9rem; font-weight:800;">Datos para el Pago</h4>
                                <span style="color:#94A3B8; font-size:0.72rem;">Transfiere al confirmar tu solicitud</span>
                            </div>
                        </div>
                        <div style="background:rgba(255,255,255,0.04); border-radius:10px; padding:12px; margin-bottom:8px; border:1px solid rgba(255,122,0,0.2);">
                            <span style="color:#94A3B8; font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Banco</span>
                            <p style="margin:3px 0 0; color:#fff; font-weight:800; font-size:0.95rem;">🏦 INTERBANK</p>
                        </div>
                        <div style="background:rgba(255,255,255,0.04); border-radius:10px; padding:12px; margin-bottom:8px; border:1px solid rgba(255,122,0,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText('8983136153503'); showToast('¡Número copiado!','success')">
                            <span style="color:#94A3B8; font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:1px;">N° Cuenta <i class="fa-regular fa-copy" style="margin-left:4px;"></i></span>
                            <p style="margin:3px 0 0; color:#FF7A00; font-weight:800; font-size:1rem; letter-spacing:1px;">898 3136153503</p>
                        </div>
                        <div style="background:rgba(255,255,255,0.04); border-radius:10px; padding:12px; border:1px solid rgba(255,122,0,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText('00389801313615350345'); showToast('¡CCI copiado!','success')">
                            <span style="color:#94A3B8; font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:1px;">CCI <i class="fa-regular fa-copy" style="margin-left:4px;"></i></span>
                            <p style="margin:3px 0 0; color:#fff; font-weight:700; font-size:0.85rem; letter-spacing:0.5px;">0038 9801 3136 1535 0345</p>
                        </div>
                        <div style="margin-top:12px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:10px 12px; display:flex; align-items:flex-start; gap:8px;">
                            <i class="fa-solid fa-circle-info" style="color:#10B981; margin-top:2px; flex-shrink:0;"></i>
                            <p style="margin:0; color:#94A3B8; font-size:0.75rem; line-height:1.5;">Envía tu solicitud y luego realiza la transferencia. <strong style="color:#10B981;">Sube tu voucher desde "Mis Solicitudes".</strong></p>
                        </div>
                    </div>

                    <button type="submit" id="btn-submit-request" class="btn-primary" style="margin-top: 20px; padding:16px; font-size:1.05rem; background-color: var(--primary);">
                        <i class="fa-solid fa-paper-plane"></i> Enviar Solicitud al Profesional
                    </button>
                </form>
            </div>
            
            <div class="checkout-map" style="flex:1; background: linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.95) 100%), url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') center/cover; display:flex; align-items:center; justify-content:center; flex-direction:column; color:#F8FAFC; padding: 40px; text-align: center;">
                <div class="logo-wrapper" style="margin-bottom: 24px;">
                    <img src="img/logo.png" alt="Logo J&A SafeWork" class="responsive-logo" style="height: 240px; filter: drop-shadow(0 15px 25px rgba(255,122,0,0.4));">
                    <h1 class="brand-title" style="font-size: 2.8rem; color: #FF7A00; text-shadow: 0 4px 15px rgba(0,0,0,0.6);">J&A SafeWork</h1>
                    <p style="color: #FCD34D; font-size: 1rem; font-weight: 800; letter-spacing: 5px; margin-top: 12px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">GESTIÓN DE TRABAJO SEGURO</p>
                </div>
                <p style="font-size:1.15rem; color:#CBD5E1; opacity:0.95; max-width:440px; text-align:center; line-height:1.6; text-shadow: 0 2px 4px rgba(0,0,0,0.4);">Conectando empresas con los mejores profesionales SSOMA validados a nivel nacional.</p>
            </div>

            <!-- Success Modal -->
            <div class="modal-overlay" id="success-modal">
                <div class="modal-content" style="text-align:center; padding:40px 32px; max-width:480px;">
                    <div style="width:70px; height:70px; border-radius:50%; background:rgba(16,185,129,0.15); border: 2px solid rgba(16,185,129,0.4); display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto;">
                        <i class="fa-solid fa-check" style="font-size:2rem; color:#34D399;"></i>
                    </div>
                    <h2 style="font-size:1.6rem; color:#FFFFFF; margin-bottom:8px;">¡Solicitud Enviada!</h2>
                    <p style="color:#94A3B8; margin-bottom:24px; font-size:0.95rem; line-height:1.6;">Hemos notificado a <strong style="color:#FFFFFF;">${professional.name}</strong>. Ahora <strong style="color:#FF7A00;">realiza la transferencia</strong> para reservar el servicio:</p>
                    <div style="background:#0F172A; border:2px solid #FF7A00; border-radius:14px; padding:20px; text-align:left; margin-bottom:24px;">
                        <p style="color:#94A3B8; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0 0 4px;">🏦 Banco</p>
                        <p style="color:#fff; font-weight:800; margin:0 0 14px;">INTERBANK</p>
                        <p style="color:#94A3B8; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0 0 4px;">N° de Cuenta</p>
                        <p style="color:#FF7A00; font-weight:800; font-size:1.1rem; letter-spacing:1px; margin:0 0 14px;">898 3136153503</p>
                        <p style="color:#94A3B8; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0 0 4px;">CCI</p>
                        <p style="color:#fff; font-weight:700; margin:0;">0038 9801 3136 1535 0345</p>
                    </div>
                    <p style="color:#94A3B8; font-size:0.82rem; margin-bottom:20px;">Después de transferir, sube tu <strong style="color:#10B981;">voucher de pago</strong> desde "Mis Solicitudes" para que el admin lo verifique.</p>
                    <button class="btn-primary" onclick="window.location.hash='#/'" style="padding:14px 28px; width:100%;">Ir al Panel Principal</button>
                </div>
            </div>
        </div>
    `;
};
