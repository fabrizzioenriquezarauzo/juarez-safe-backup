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
            <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
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
            <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
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
            <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #EF4444; display:flex; align-items:center; justify-content:center; font-size: 2rem; margin: 0 auto 24px;">
                    <i class="fa-solid ${isExpired ? 'fa-calendar-xmark' : 'fa-lock'}"></i>
                </div>
                <h2 style="font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 12px;">${isExpired ? 'Membresía Expirada' : 'Suscripción Requerida'}</h2>
                <p style="color: #94A3B8; line-height: 1.6; margin-bottom: 32px;">
                    ${isExpired ? 'Tu membresía mensual ha expirado.' : 'Para acceder a la plataforma y visualizar a nuestros especialistas, requieres una membresía activa.'} Por favor, realiza el pago mensual de S/ 100.
                </p>
                <button class="btn-pay-membership-ui btn-primary" style="padding: 14px 32px; font-size: 1rem; border-radius: 12px; background: #10B981; color: white; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3);">
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

                <!-- NUEVO: Apartado de Certificados -->
                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="background: linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(16,185,129,0.15) 100%); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; text-align: left; backdrop-filter: blur(12px); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="color: #fff; margin: 0; font-size: 1.1rem; font-weight: 800; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-certificate" style="color: #10B981; font-size: 1.2rem; filter: drop-shadow(0 0 5px rgba(16,185,129,0.5));"></i> Emisión de Certificados
                            </h4>
                            <span style="background: rgba(16,185,129,0.2); color: #34D399; font-size: 0.65rem; padding: 4px 10px; border-radius: 100px; font-weight: 900; letter-spacing: 0.5px; border: 1px solid rgba(16,185,129,0.4);">GARANTÍA OFICIAL</span>
                        </div>
                        <p style="color: #E2E8F0; font-size: 0.85rem; margin: 0 0 16px 0; line-height: 1.5; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
                            Plataforma exclusiva para emitir y validar certificados con el respaldo y seguridad de J&A SafeWork.
                        </p>
                        <button id="btn-open-certificates" style="background: linear-gradient(to right, #2563EB, #1D4ED8); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 12px 20px; border-radius: 10px; font-weight: 800; width: 100%; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(37,99,235,0.4); display: flex; align-items: center; justify-content: center; gap: 8px;">
                            Ingresar al Portal <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
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
            <div class="auth-buttons">
                ${user ? `
                  <div class="user-welcome-nav">
                      <span class="welcome-text">¡Hola, <strong>${user.name.split(' ')[0]}</strong>!</span>
                      ${user.userType === 'professional' ?
                `<a href="/dashboard" data-link class="btn-register-pill">Panel</a>` :
                user.userType === 'admin' ?
                    `<a href="#/admin" class="btn-register-pill">Administración</a>
                         <button id="logout-btn-home" class="btn-logout-minimal" style="margin-left:8px;"><i class="fa-solid fa-power-off"></i></button>` :
                    `<a href="/dashboard" data-link class="btn-register-pill">Mis Solicitudes</a>
                         <button id="logout-btn-home" class="btn-logout-minimal" style="margin-left:8px;"><i class="fa-solid fa-power-off"></i></button>`
            }
                  </div>
                ` : `
                  <a href="/login" data-link class="btn-login-pill">Iniciar Sesión</a>
                  <a href="/register" data-link class="btn-register-pill">Registrarse</a>
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
                                <button class="btn-pay-membership-ui" style="background: rgba(0,0,0,0.2); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 800; margin-left: 8px; cursor: pointer;">Renovar</button>
                            </div>
                        `;
                    }
                }

                return `
                    <div style="position: relative; height: 100%; width: 100%;">
                        ${bannerHTML}
                        <div class="map-container" id="map" style="height: 100%;">
                            <!-- Leaflet Map -->
                        </div>
                    </div>
                `;
            })()}
        </main>
    
        <div class="modal-overlay" id="prof-modal">
            <div class="modal-content"></div>
        </div>

        <!-- Modal Pago de Membresía -->
        <div class="modal-overlay" id="membership-pay-modal" style="display:none; z-index: 2000;">
            <div class="modal-content" style="max-width: 450px; background: #fff; border-radius: 20px; padding: 30px; position: relative;">
                <button onclick="document.getElementById('membership-pay-modal').style.display='none'" style="position:absolute; top:20px; right:20px; background:none; border:none; font-size:1.5rem; color:#94A3B8; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: #EFF6FF; color: #2563EB; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 16px;">
                        <i class="fa-solid fa-gem"></i>
                    </div>
                    <h3 style="font-size: 1.3rem; font-weight: 800; color: #0F172A; margin: 0;">Membresía Empresarial</h3>
                    <p style="color: #64748B; font-size: 0.9rem; margin-top: 8px;">Acceso ilimitado a nuestra red de especialistas verificados.</p>
                </div>

                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #CBD5E1;">
                        <span style="color: #64748B; font-weight: 600;">Plan Mensual</span>
                        <span style="font-size: 1.2rem; font-weight: 800; color: #0F172A;">S/ 100.00</span>
                    </div>
                    <p style="font-size: 0.8rem; color: #64748B; margin: 0 0 12px 0;">1. Transfiere el monto exacto a cualquiera de nuestras cuentas:</p>
                    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 16px;">
                        <div style="background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #E2E8F0; text-align: center; flex: 1;">
                            <img src="img/yape-logo.png" alt="Yape" style="height: 24px; margin-bottom: 4px;" onerror="this.src='';this.alt='YAPE';this.style.fontWeight='800';this.style.color='#740B7E';">
                            <div style="font-weight: 800; font-size: 0.9rem;">942 225 352</div>
                        </div>
                        <div style="background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #E2E8F0; text-align: center; flex: 1;">
                            <img src="img/plin-logo.png" alt="Plin" style="height: 24px; margin-bottom: 4px;" onerror="this.src='';this.alt='PLIN';this.style.fontWeight='800';this.style.color='#013473';">
                            <div style="font-weight: 800; font-size: 0.9rem;">942 225 352</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 0.8rem; color: #64748B; margin: 0 0 8px 0;">2. Sube la captura de pantalla de tu transferencia:</p>
                    <input type="file" id="membership-voucher-file" accept="image/*" style="width: 100%; font-size: 0.8rem; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px; background: #fff;">
                </div>

                <button id="btn-submit-membership" class="btn-primary" style="width: 100%; padding: 14px; border-radius: 12px; font-weight: 800; font-size: 1rem; background: #2563EB; border: none; box-shadow: 0 4px 15px rgba(37,99,235,0.3); color: white; cursor: pointer;">
                    Enviar Comprobante
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
                        
                        <div style="text-align: left; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #E2E8F0;">
                            <div style="margin-bottom: 8px;"><strong style="color:#64748B; font-size: 0.8rem; display: block;">Titular:</strong> <span style="font-weight: 700;">Juan Pérez Demo</span></div>
                            <div style="margin-bottom: 8px;"><strong style="color:#64748B; font-size: 0.8rem; display: block;">Curso/Acreditación:</strong> <span style="font-weight: 700;">Prevención de Riesgos Laborales (Simulado)</span></div>
                            <div><strong style="color:#64748B; font-size: 0.8rem; display: block;">Fecha de Emisión:</strong> <span style="font-weight: 700;">10 Mayo 2026</span></div>
                        </div>
                    </div>
                    <button id="btn-cert-back" style="background: none; border: none; color: #2563EB; font-weight: 700; cursor: pointer; text-decoration: underline;">Realizar otra búsqueda</button>
                </div>
            </div>
        </div>
      </div>
    `;
};
