import { AppState } from '../state.js';
import { logoutUser } from '../services/auth.js';
import Router from '../router.js';

export const renderHome = (user) => {
    const isPendingValidation = user && user.userType === 'client' && (user.status === 'pendiente' || user.status === 'observada' || user.validationStatus === 'pendiente' || user.validationStatus === 'observada');
    
    let diffDays = null;
    if (user && user.membershipExpiry) {
        const expiry = new Date(user.membershipExpiry);
        const now = new Date();
        diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    }
    
    const isVerifyingMembership = user && user.userType === 'client' && user.membershipStatus === 'verifying';
    const isMembershipExpiredOrMissing = user && user.userType === 'client' && !isPendingValidation && !isVerifyingMembership && (user.membershipStatus !== 'active' || (diffDays !== null && diffDays <= 0));
    const isExpired = diffDays !== null && diffDays <= 0;

    let heroContent = '';

    if (isPendingValidation) {
        heroContent = `
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); color: #F59E0B; display:flex; align-items:center; justify-content:center; font-size: 2rem; margin: 0 auto 24px;">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
                <h2 style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 12px;">Cuenta en Revisión</h2>
                <p style="color: #94A3B8; line-height: 1.6; margin-bottom: 32px;">
                    Tu registro como empresa ha sido recibido con éxito. Nuestro equipo administrativo está validando tu RUC y Razón Social. Recibirás un correo cuando tu cuenta sea aprobada.
                </p>
                <button onclick="window.location.reload()" class="btn-primary" style="padding: 14px 32px; font-size: 1rem; border-radius: 12px; background: #F59E0B; color: white; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(245,158,11,0.3);">
                    <i class="fa-solid fa-rotate"></i> Verificar Estado
                </button>
            </div>
        `;
    } else if (isVerifyingMembership) {
        heroContent = `
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(59, 130, 246, 0.1); color: #3B82F6; display:flex; align-items:center; justify-content:center; font-size: 2rem; margin: 0 auto 24px;">
                    <i class="fa-solid fa-money-check-dollar"></i>
                </div>
                <h2 style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 12px;">Verificando Pago</h2>
                <p style="color: #94A3B8; line-height: 1.6; margin-bottom: 32px;">
                    Hemos recibido tu comprobante de pago de membresía. Un administrador lo validará en breve para habilitar tu acceso.
                </p>
                <button onclick="window.location.reload()" class="btn-primary" style="padding: 14px 32px; font-size: 1rem; border-radius: 12px; background: #3B82F6; color: white; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(59,130,246,0.3);">
                    <i class="fa-solid fa-rotate"></i> Actualizar
                </button>
            </div>
        `;
    } else if (isMembershipExpiredOrMissing) {
        heroContent = `
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #EF4444; display:flex; align-items:center; justify-content:center; font-size: 2rem; margin: 0 auto 24px;">
                    <i class="fa-solid ${isExpired ? 'fa-calendar-xmark' : 'fa-lock'}"></i>
                </div>
                <h2 style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 12px;">${isExpired ? 'Membresía Expirada' : 'Suscripción Requerida'}</h2>
                <p style="color: #94A3B8; line-height: 1.6; margin-bottom: 32px;">
                    ${isExpired ? 'Tu membresía mensual ha expirado.' : 'Para acceder a la plataforma y visualizar a nuestros especialistas, requieres una membresía activa.'} Por favor, realiza el pago mensual de S/ 100.
                </p>
                <button onclick="document.getElementById('membership-pay-modal').style.display='flex'; setTimeout(()=>document.getElementById('membership-pay-modal').classList.add('active'), 10);" class="btn-pay-membership-ui btn-primary" style="padding: 14px 32px; font-size: 1rem; border-radius: 12px; background: #10B981; color: white; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3);">
                    <i class="fa-solid fa-credit-card"></i> ${isExpired ? 'Renovar Membresía' : 'Pagar Membresía'}
                </button>
            </div>
        `;
    } else {
        heroContent = `
            <div class="hero-search-wrapper">
                <h3 id="hero-question">¿A quién estás buscando hoy?</h3>
                <div class="hero-search-bar" id="hero-search-trigger">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Buscar especialista...</span>
                </div>
                
                <div class="hero-categories">
                    <button class="cat-btn" data-filter="prevencion"><i class="fa-solid fa-hard-hat"></i> Prevención</button>
                    <button class="cat-btn" data-filter="electricidad"><i class="fa-solid fa-bolt"></i> Eléctricista</button>
                    <button class="cat-btn" data-filter="drywall"><i class="fa-solid fa-hammer"></i> Drywall</button>
                    <button class="cat-btn" data-filter="hogar"><i class="fa-solid fa-broom"></i> Hogar</button>
                </div>

                <div style="margin-top: 32px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                    <button
                        onclick="window.location.hash='#/certificados';"
                        style="background: rgba(37,99,235,0.85); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 14px 28px; border-radius: 100px; font-weight: 800; font-size: 1rem; cursor: pointer; backdrop-filter: blur(10px); display: flex; align-items: center; gap: 10px; transition: all 0.2s; box-shadow: 0 10px 25px rgba(0,0,0,0.3);"
                        onmouseover="this.style.background='rgba(37,99,235,1)'"
                        onmouseout="this.style.background='rgba(37,99,235,0.85)'">
                        <i class="fa-solid fa-graduation-cap"></i> Obtener Certificado Oficial
                    </button>
                    <button
                        onclick="window.location.hash='#/certificados'; setTimeout(()=>window.switchCertTab&&window.switchCertTab('verificar'),300);"
                        style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 14px 28px; border-radius: 100px; font-weight: 800; font-size: 1rem; cursor: pointer; backdrop-filter: blur(10px); display: flex; align-items: center; gap: 10px; transition: all 0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.25)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        <i class="fa-solid fa-magnifying-glass"></i> Consultar Certificado
                    </button>
                </div>

            </div>
        `;
    }

    return `
      <div class="home-view hero-active" id="home-view-container">
        <!-- 3. Pantalla de Bienvenida (Hero Splash) V200 -->
        <div class="app-hero">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-branding">
                    <img src="img/logo.png" alt="Logo" class="hero-logo">
                    <h1 class="hero-title">J&A SAFEWORK</h1>
                    <p class="hero-subtitle">GESTIÓN DE TRABAJO SEGURO</p>
                </div>
                
                ${heroContent}
            </div>
        </div>

        <!-- Sidebar / List (Ride-Sharing Style) -->
        ${(user && user.userType === 'client' && (user.status === 'pendiente' || user.status === 'observada' || user.validationStatus === 'pendiente' || user.validationStatus === 'observada')) ? '' : `
        <aside class="sidebar">
            <div class="sheet-handle"></div>
            <div class="sidebar-header">
                <!-- Search and Logo -->
                <div class="search-bar">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="prof-search" placeholder="Busca un profesional...">
                </div>
                <div class="logo-wrapper" style="display:none;">
                    <img src="img/logo.png" alt="Logo" class="logo">
                </div>
                <div class="filters">
                    <button class="filter-btn active" data-filter="all">Todos</button>
                    <!-- v230: Categorías dinámicas removidas para estabilidad en reversión -->
                </div>
            </div>
            
            <div class="list-header">
                <h3>Cerca de ti</h3>
                <span id="prof-count">0 disponibles</span>
            </div>

            <div class="professionals-list" id="prof-list">
                <!-- Professionals cards will be injected here -->
            </div>
        </aside>
        `}

        <!-- Floating Top Navigation Overlay -->
        <div class="top-nav">
            <div style="display:flex; gap:12px; align-items:center;">
                ${user ? `
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="auth-buttons" style="background: #fff; padding: 5px 15px; border-radius: 100px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span class="welcome-text" style="color: #0F172A; font-size: 0.8rem;">¡Hola, <strong>${user.name.split(' ')[0]}</strong>!</span>
                        ${user.userType === 'professional' ?
                  `<a href="/dashboard" data-link class="btn-register-pill" style="font-size: 0.75rem; padding: 4px 12px;">Panel</a>` :
                  user.userType === 'admin' ?
                      `<a href="#/admin" class="btn-register-pill" style="font-size: 0.75rem; padding: 4px 12px;">Administración</a>
                           <button id="logout-btn-home" class="btn-logout-minimal" style="margin-left:8px; color: #0F172A;"><i class="fa-solid fa-power-off"></i></button>` :
                      `<a href="/dashboard" data-link class="btn-register-pill" style="font-size: 0.75rem; padding: 4px 12px;">Mis Solicitudes</a>
                           <button id="logout-btn-home" class="btn-logout-minimal" style="margin-left:8px; color: #0F172A;"><i class="fa-solid fa-power-off"></i></button>`
              }
                    </div>
                  </div>
                ` : `
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="auth-buttons" style="background: #fff; padding: 4px; border-radius: 100px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: flex; align-items: center;">
                        <a href="/login" data-link class="btn-login-pill" style="color: #0F172A; font-size: 0.75rem; padding: 5px 12px;">Iniciar Sesión</a>
                        <a href="/register" data-link class="btn-register-pill" style="font-size: 0.75rem; padding: 5px 15px; background: #2563EB; color: #fff; border-radius: 100px; font-weight: 700; display: flex; align-items: center; justify-content: center;">Registrarse</a>
                    </div>
                  </div>
                `}
            </div>
            <button class="btn-location" id="btn-my-location" title="Mi ubicación">
                <i class="fa-solid fa-location-crosshairs"></i>
            </button>
        </div>
  
        <!-- Map Container -->
        <main class="main-content">
            ${(() => {
                let bannerHTML = '';
                if (user && user.userType === 'client' && user.membershipStatus === 'active' && user.membershipExpiry) {
                    const expiry = new Date(user.membershipExpiry);
                    const now = new Date();
                    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > 0 && diffDays <= 5) {
                        bannerHTML = `
                            <div style="position:absolute; top: 20px; left: 50%; transform: translateX(-50%); background: #F59E0B; color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: 700; z-index: 1000; box-shadow: 0 4px 15px rgba(245,158,11,0.4); display: flex; align-items: center; gap: 8px; font-size: 0.9rem; white-space: nowrap;">
                                <i class="fa-solid fa-triangle-exclamation"></i> Tu membresía expira en ${diffDays} día${diffDays !== 1 ? 's' : ''}. 
                                <button onclick="document.getElementById('membership-pay-modal').style.display='flex'; setTimeout(()=>document.getElementById('membership-pay-modal').classList.add('active'), 10);" class="btn-pay-membership-ui" style="background: rgba(0,0,0,0.2); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 800; margin-left: 8px; cursor: pointer;">Renovar</button>
                            </div>
                        `;
                    }
                }

                return `
                    ${bannerHTML}
                    <div class="map-container" id="map">
                        <!-- Leaflet Map -->
                    </div>
                `;
            })()}
        </main>
    
        <div class="modal-overlay" id="prof-modal">
            <div class="modal-content"></div>
        </div>

        <!-- Modal Pago de Membresía (Ultra Modern Transparent Glass) -->
        <div class="modal-overlay" id="membership-pay-modal" style="display:none; z-index: 2000;">
            <div class="modal-content" style="max-width: 480px; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; padding: 32px; position: relative; box-shadow: 0 30px 60px rgba(0,0,0,0.6);">
                <button onclick="document.getElementById('membership-pay-modal').classList.remove('active'); setTimeout(()=>document.getElementById('membership-pay-modal').style.display='none', 300);" style="position:absolute; top:20px; right:20px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); width:32px; height:32px; border-radius:50%; font-size:1rem; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'"><i class="fa-solid fa-xmark"></i></button>
                
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px;">
                    <div style="width: 54px; height: 54px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                        <i class="fa-solid fa-gem"></i>
                    </div>
                    <div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.7rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">Premium Plan</div>
                        <h3 style="font-size: 1.35rem; font-weight: 800; color: #FFFFFF; margin: 0; line-height: 1.1;">Membresía Empresarial</h3>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px;">
                    <div style="display: flex; align-items: flex-start; gap: 10px; color: rgba(255,255,255,0.9); font-size: 0.85rem; line-height: 1.4;">
                        <i class="fa-solid fa-check" style="color: #fff; font-size: 0.9rem; margin-top: 2px; background: rgba(255,255,255,0.2); padding: 4px; border-radius: 50%;"></i> 
                        <div><strong>Garantía J&A SafeWork:</strong> Trabajadores verificados y respaldo total.</div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 10px; color: rgba(255,255,255,0.9); font-size: 0.85rem; line-height: 1.4;">
                        <i class="fa-solid fa-check" style="color: #fff; font-size: 0.9rem; margin-top: 2px; background: rgba(255,255,255,0.2); padding: 4px; border-radius: 50%;"></i> 
                        <div><strong>Acceso Ilimitado:</strong> Red completa de especialistas y publicaciones.</div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 10px; color: rgba(255,255,255,0.9); font-size: 0.85rem; line-height: 1.4;">
                        <i class="fa-solid fa-check" style="color: #fff; font-size: 0.9rem; margin-top: 2px; background: rgba(255,255,255,0.2); padding: 4px; border-radius: 50%;"></i> 
                        <div><strong>Validación Digital:</strong> Certificados médicos y capacitaciones.</div>
                    </div>
                </div>

                <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 16px;">
                        <span style="color: rgba(255,255,255,0.7); font-weight: 600; font-size: 0.85rem;">Monto a transferir</span>
                        <span style="font-size: 1.5rem; font-weight: 900; color: #fff;">S/ 100.00 <span style="font-size: 0.8rem; color:rgba(255,255,255,0.5); font-weight:600;">/mes</span></span>
                    </div>
                    
                    <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 16px;">
                        <div style="background: rgba(255,255,255,0.1); padding: 10px 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); text-align: center; flex: 1.5; backdrop-filter: blur(10px);">
                            <div style="color: rgba(255,255,255,0.6); font-weight: 900; font-size: 0.65rem; margin-bottom: 4px;">INTERBANK</div>
                            <div style="font-weight: 800; font-size: 0.75rem; color: #fff;">Cuenta: 898 3136153503</div>
                            <div style="font-weight: 600; font-size: 0.65rem; color: rgba(255,255,255,0.8); margin-top: 2px;">CCI: 00389801313615350345</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 10px 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); text-align: center; flex: 1; backdrop-filter: blur(10px); display: flex; flex-direction: column; justify-content: center;">
                            <div style="color: rgba(255,255,255,0.6); font-weight: 900; font-size: 0.65rem; margin-bottom: 4px;">YAPE / PLIN</div>
                            <div style="font-weight: 800; font-size: 0.8rem; color: #fff;">915 079 361</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 0.8rem; color: rgba(255,255,255,0.7); margin: 0 0 8px 0; font-weight: 600;">Sube la captura de tu transferencia:</p>
                    <input type="file" id="membership-voucher-file" accept="image/*" style="width: 100%; font-size: 0.8rem; padding: 10px; border: 1px dashed rgba(255,255,255,0.3); border-radius: 8px; background: rgba(0,0,0,0.2); color: #fff; outline: none; margin-bottom: 0; cursor: pointer; transition: background 0.3s;" onmouseover="this.style.background='rgba(0,0,0,0.4)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
                </div>

                <button id="btn-submit-membership" class="btn-primary" style="width: 100%; padding: 16px; border-radius: 16px; font-weight: 800; font-size: 1rem; background: #fff; border: none; color: #000; cursor: pointer; box-shadow: 0 8px 25px rgba(255,255,255,0.2); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 30px rgba(255,255,255,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(255,255,255,0.2)'">
                    Activar Membresía Empresarial
                </button>
            </div>
        </div>

        <!-- Modal Portal de Certificados -->
        <div class="modal-overlay" id="certificates-portal-modal" style="display:none; z-index: 2000;">
            <div class="modal-content" style="max-width: 500px; background: #fff; border-radius: 20px; padding: 30px; position: relative;">
                <button onclick="document.getElementById('certificates-portal-modal').style.display='none'" style="position:absolute; top:20px; right:20px; background:none; border:none; font-size:1.5rem; color:#94A3B8; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: rgba(16,185,129,0.1); color: #10B981; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 16px;">
                        <i class="fa-solid fa-certificate"></i>
                    </div>
                    <h3 style="font-size: 1.3rem; font-weight: 800; color: #0F172A; margin: 0;">Portal de Verificación</h3>
                    <p style="color: #64748B; font-size: 0.9rem; margin-top: 8px;">Valida la autenticidad de los certificados emitidos por J&A SafeWork.</p>
                </div>

                <div id="cert-search-view">
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px;">DNI o Código de Certificado</label>
                        <input type="text" id="cert-search-input" placeholder="Ej. 12345678 o CERT-2026-X" style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 1rem;">
                    </div>
                    
                    <button id="btn-search-cert" class="btn-primary" style="width: 100%; padding: 14px; border-radius: 12px; font-weight: 800; font-size: 1rem; background: #10B981; border: none; box-shadow: 0 4px 15px rgba(16,185,129,0.3); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fa-solid fa-magnifying-glass"></i> Verificar
                    </button>
                </div>

                <div id="cert-result-view" style="display:none; text-align: center;">
                    <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <i class="fa-solid fa-circle-check" style="color: #16A34A; font-size: 3rem; margin-bottom: 12px;"></i>
                        <h4 style="color: #166534; font-weight: 800; font-size: 1.2rem; margin: 0 0 8px 0;">Certificado Válido</h4>
                        <p style="color: #15803D; font-size: 0.9rem; margin: 0 0 16px 0;">El documento se encuentra registrado y validado en nuestro sistema.</p>
                        
                        <div style="text-align: left; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #E2E8F0; position: relative;">
                            <div style="margin-bottom: 8px;"><strong style="color:#64748B; font-size: 0.8rem; display: block;">Titular:</strong> <span id="cert-result-holder-name" style="font-weight: 700;">Juan Pérez Demo</span></div>
                            <div style="margin-bottom: 8px;"><strong style="color:#64748B; font-size: 0.8rem; display: block;">Curso/Acreditación:</strong> <span id="cert-result-course-name" style="font-weight: 700;">Prevención de Riesgos Laborales (Simulado)</span></div>
                            <div><strong style="color:#64748B; font-size: 0.8rem; display: block;">Fecha de Emisión:</strong> <span id="cert-result-issue-date" style="font-weight: 700;">10 Mayo 2026</span></div>
                            <img id="cert-result-qr" src="" alt="QR" style="position: absolute; right: 16px; top: 16px; width: 60px; height: 60px; border-radius: 8px; border: 1px solid #E2E8F0; display: none;">
                        </div>
                    </div>
                    <button id="btn-cert-back" style="background: none; border: none; color: #2563EB; font-weight: 700; cursor: pointer; text-decoration: underline;">Realizar otra búsqueda</button>
                </div>
            </div>
        </div>

        <!-- Modal Solicitud de Certificado (Quiz & Payment) -->
        <div class="modal-overlay" id="certificate-request-modal" style="display:none; z-index: 2000;">
            <div class="modal-content" style="max-width: 500px; background: #fff; border-radius: 20px; padding: 30px; position: relative; max-height: 90vh; overflow-y: auto;">
                <button onclick="document.getElementById('certificate-request-modal').style.display='none'" style="position:absolute; top:20px; right:20px; background:none; border:none; font-size:1.5rem; color:#94A3B8; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                
                <!-- Step 1: Intro -->
                <div id="cert-req-step-1">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="width: 64px; height: 64px; background: rgba(37,99,235,0.1); color: #2563EB; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 16px;">
                            <i class="fa-solid fa-graduation-cap"></i>
                        </div>
                        <h3 style="font-size: 1.3rem; font-weight: 800; color: #0F172A; margin: 0;">Certificación J&A SafeWork</h3>
                        <p style="color: #64748B; font-size: 0.9rem; margin-top: 8px;">Obtén tu certificado oficial demostrando tus conocimientos. Costo de emisión: <strong>S/ 35.00 (Inc. IGV)</strong>.</p>
                    </div>
                    
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1E293B; margin: 0 0 12px 0;"><i class="fa-solid fa-list-check" style="color: #64748B;"></i> Instrucciones</h4>
                        <ul style="font-size: 0.85rem; color: #475569; padding-left: 20px; margin: 0; line-height: 1.6;">
                            <li>Selecciona el tipo de certificado a obtener.</li>
                            <li>El examen consta de 3 preguntas de seguridad.</li>
                            <li>Debes responder correctamente todas para aprobar.</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 24px; text-align: left;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px;">Selecciona el Tipo de Certificado</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;" id="cert-course-buttons">
                            <!-- Los botones se generarán dinámicamente desde Firestore -->
                            <div style="grid-column: span 2; text-align: center; color: #94A3B8; padding: 20px;">
                                <i class="fa-solid fa-spinner fa-spin"></i> Cargando cursos...
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Quiz -->
                <div id="cert-req-step-2" style="display:none;">
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: #0F172A; margin: 0 0 20px 0; border-bottom: 2px solid #E2E8F0; padding-bottom: 12px;">Examen de Certificación</h3>
                    
                    <div id="quiz-form" style="display:flex; flex-direction:column; gap:20px; margin-bottom: 24px;">
                        <!-- Las preguntas se generarán dinámicamente -->
                        <div style="text-align: center; color: #94A3B8; padding: 20px;">
                            <i class="fa-solid fa-spinner fa-spin"></i> Preparando examen...
                        </div>
                    </div>
                    
                    <div id="quiz-error" style="color:#EF4444; font-size:0.85rem; font-weight:700; margin-bottom:12px; display:none; text-align:center;">Respuestas incorrectas. Revisa y vuelve a intentarlo.</div>
                    
                    <button id="btn-submit-quiz" class="btn-primary" style="width: 100%; padding: 14px; border-radius: 12px; font-weight: 800; font-size: 1rem; background: #2563EB; border: none; box-shadow: 0 4px 15px rgba(37,99,235,0.3); color: white; cursor: pointer;">
                        Evaluar Respuestas
                    </button>
                </div>

                <!-- Step 3: Success Result -->
                <div id="cert-req-step-3" style="display:none; text-align:center;">
                    <div style="width: 60px; height: 60px; background: rgba(16,185,129,0.1); color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 12px;">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h3 style="font-size: 1.4rem; font-weight: 800; color: #166534; margin: 0 0 8px 0;">¡Examen Aprobado!</h3>
                    <p style="color: #64748B; font-size: 0.95rem; margin-bottom: 24px;">Has demostrado tus conocimientos satisfactoriamente.</p>
                    
                    <button id="btn-generate-cert-view" class="btn-primary" style="width: 100%; padding: 14px; border-radius: 12px; font-weight: 800; font-size: 1rem; background: #10B981; border: none; color: white; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3);">
                        Generar Certificado Oficial
                    </button>
                </div>

                <!-- Step 4: Payment -->
                <div id="cert-req-step-4" style="display:none;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(37,99,235,0.1); color: #2563EB; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 12px;">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                        </div>
                        <h3 style="font-size: 1.3rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0;">Emisión de Certificado</h3>
                        <p style="color: #64748B; font-size: 0.9rem;">Para emitir tu certificado validado mediante código QR, realiza el pago de S/ 35.00 y sube el voucher.</p>
                    </div>

                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                        <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 16px;">
                            <span style="color: #64748B; font-weight: 700; font-size: 0.85rem;">Monto a transferir</span>
                            <span style="font-size: 1.5rem; font-weight: 900; color: #0F172A;">S/ 35.00</span>
                        </div>
                        
                        <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 16px;">
                            <div style="background: #fff; padding: 10px 4px; border-radius: 10px; border: 1px solid #E2E8F0; text-align: center; flex: 1.5;">
                                <div style="color: #94A3B8; font-weight: 900; font-size: 0.65rem; margin-bottom: 4px;">INTERBANK</div>
                                <div style="font-weight: 800; font-size: 0.75rem; color: #0F172A;">Cuenta: 898 3136153503</div>
                                <div style="font-weight: 600; font-size: 0.6rem; color: #64748B; margin-top: 2px;">CCI: 00389801313615350345</div>
                            </div>
                            <div style="background: #fff; padding: 10px 4px; border-radius: 10px; border: 1px solid #E2E8F0; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                <div style="color: #94A3B8; font-weight: 900; font-size: 0.65rem; margin-bottom: 4px;">YAPE / PLIN</div>
                                <div style="font-weight: 800; font-size: 0.8rem; color: #0F172A;">915 079 361</div>
                            </div>
                        </div>
                        
                        <p style="font-size: 0.8rem; color: #475569; margin: 0 0 8px 0; font-weight: 700;">Sube la captura de tu pago:</p>
                        <input type="file" id="cert-voucher-file" accept="image/*" style="width: 100%; box-sizing: border-box; font-size: 0.8rem; padding: 10px; border: 1px dashed #CBD5E1; border-radius: 8px; background: #fff; color: #475569; outline: none; margin-bottom: 0; cursor: pointer;">
                    </div>

                    <button id="btn-submit-cert-request" class="btn-primary" style="width: 100%; padding: 16px; border-radius: 16px; font-weight: 800; font-size: 1rem; background: #10B981; border: none; color: white; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3);">
                        Enviar Solicitud
                    </button>
                </div>
                
                <!-- Step 5: Success Message -->
                <div id="cert-req-step-5" style="display:none; text-align:center;">
                     <div style="width: 80px; height: 80px; background: rgba(16,185,129,0.1); color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 20px;">
                         <i class="fa-solid fa-clock-rotate-left"></i>
                     </div>
                     <h3 style="font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0 0 12px 0;">Solicitud Recibida</h3>
                     <p style="color: #64748B; line-height: 1.6; margin-bottom: 24px;">Hemos recibido tu examen y comprobante de pago. Un administrador validará tu depósito. Una vez aprobado, el sistema generará el código QR y código único de tu certificado.</p>
                     <button onclick="document.getElementById('certificate-request-modal').style.display='none'; location.reload();" class="btn-primary" style="padding: 12px 30px; border-radius: 100px; font-weight: 800; font-size: 0.95rem; background: #F8FAFC; border: 1px solid #E2E8F0; color: #475569; cursor: pointer;">Cerrar</button>
                </div>
            </div>
      </div>

    `;
};
