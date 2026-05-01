export const renderRegister = () => {
    return `
        <div class="auth-container">
            <div class="auth-card glass-panel animate-fade-in" style="width: 100%; max-width: 480px; padding: 40px; border-radius: 24px;">
                <button onclick="window.location.hash='#/'" class="back-link" style="position: absolute; top: 24px; left: 24px; color: #94A3B8; border: none; background: transparent; cursor: pointer;">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </button>

                <div class="logo-wrapper" style="margin-bottom: 32px;">
                    <img src="img/logo.png" alt="Logo J&A SafeWork" class="responsive-logo">
                    <h1 class="brand-title">J&A SafeWork</h1>
                    <h2 style="color: #fff; font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px;">Crea tu cuenta</h2>
                    <p style="color: #94A3B8; font-size: 0.95rem;">Únete a la red SSOMA más grande del Perú</p>
                </div>

                <div class="error-box" id="register-error" style="display: none; padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; color: #FCA5A5; font-size: 0.85rem; margin-bottom: 24px; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span id="register-error-text"></span>
                </div>

                <form id="register-form">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; color: #94A3B8; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Nombre Completo</label>
                        <input type="text" id="register-name" class="standard-input" placeholder="Ej: Juan Pérez" required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; color: #fff; outline: none; transition: all 0.2s;">
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; color: #94A3B8; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Correo Electrónico</label>
                        <input type="email" id="register-email" class="standard-input" placeholder="tu@empresa.com" required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; color: #fff; outline: none; transition: all 0.2s;">
                    </div>

                    <div class="form-group" style="margin-bottom: 24px;">
                        <label style="display: block; color: #94A3B8; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Contraseña Segura</label>
                        <input type="password" id="register-password" class="standard-input" placeholder="••••••••" required style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; color: #fff; outline: none; transition: all 0.2s;">
                    </div>

                    <!-- Campos exclusivos para Empresas -->
                    <div id="company-extra-fields" style="display: none; border-left: 2px solid var(--primary-accent); padding-left: 16px; margin-bottom: 24px; animation: slideDown 0.3s ease;">
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="display: block; color: var(--primary-accent); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">RUC (11 dígitos)</label>
                            <input type="text" id="register-ruc" class="standard-input" placeholder="10XXXXXXXXX" maxlength="11" style="width: 100%; background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 10px; padding: 12px; color: #fff; outline: none;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; color: var(--primary-accent); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Razón Social / Nombre Comercial</label>
                            <input type="text" id="register-company" class="standard-input" placeholder="Nombre de tu empresa" style="width: 100%; background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 10px; padding: 12px; color: #fff; outline: none;">
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 32px;">
                        <label style="display: block; color: #94A3B8; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">¿Qué tipo de cuenta deseas crear?</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                            <div class="type-btn active" data-type="professional" style="cursor: pointer; padding: 16px; border-radius: 12px; border: 2px solid var(--primary-accent); background: rgba(37, 99, 235, 0.05); text-align: center; transition: all 0.3s;">
                                <i class="fa-solid fa-helmet-safety" style="display: block; font-size: 20px; color: var(--primary-accent); margin-bottom: 8px;"></i>
                                <span style="color: #fff; font-size: 0.85rem; font-weight: 600;">Especialista</span>
                            </div>
                            <div class="type-btn" data-type="client" style="cursor: pointer; padding: 16px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); text-align: center; transition: all 0.3s;">
                                <i class="fa-solid fa-building" style="display: block; font-size: 20px; color: #94A3B8; margin-bottom: 8px;"></i>
                                <span style="color: #94A3B8; font-size: 0.85rem; font-weight: 600;">Empresa</span>
                            </div>
                        </div>

                        <!-- Panel de Especialista (Desplegable y Documentos) -->
                        <div id="professional-extra-fields" style="display: block; animation: slideDown 0.3s ease; background: rgba(255,255,255,0.02); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
                            
                            <div class="form-group" style="margin-bottom: 20px;">
                                <label style="display: block; color: var(--primary-accent); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Selecciona tu Especialidad</label>
                                <select id="register-specialty" class="standard-input" style="width: 100%; background: #0F172A; border: 1px solid rgba(37, 99, 235, 0.3); border-radius: 10px; padding: 12px; color: #fff; outline: none; cursor: pointer; appearance: none;">
                                    <option value="Prevencionista">Prevencionista</option>
                                    <option value="Técnico Electricista">Técnico Electricista</option>
                                    <option value="Técnico de Drywall">Técnico de Drywall</option>
                                    <option value="Ama de Casa">Ama de Casa</option>
                                </select>
                            </div>

                            <div style="margin-top: 24px;">
                                <h4 style="color: #fff; font-size: 0.9rem; margin-bottom: 12px; font-weight: 600;"><i class="fa-solid fa-cloud-arrow-up" style="color: var(--primary-accent); margin-right: 6px;"></i> Documentación Requerida (PDF)</h4>
                                <p style="color: #94A3B8; font-size: 0.75rem; margin-bottom: 16px;">Sube tus documentos para validar tu perfil.</p>
                                
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <!-- DNI (Todos) -->
                                    <div class="file-upload-wrapper">
                                        <label style="display: block; color: #CBD5E1; font-size: 0.8rem; margin-bottom: 4px;">DNI Escaneado (Obligatorio)</label>
                                        <input type="file" id="file-dni" accept=".pdf" style="width: 100%; color: #94A3B8; font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                                    </div>
                                    
                                    <!-- CertiAdulto (Todos) -->
                                    <div class="file-upload-wrapper">
                                        <label style="display: block; color: #CBD5E1; font-size: 0.8rem; margin-bottom: 4px;">Certiadulto (Obligatorio)</label>
                                        <input type="file" id="file-certiadulto" accept=".pdf" style="width: 100%; color: #94A3B8; font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                                    </div>

                                    <!-- CV y Certificados (Solo para Prevencionista, Electricista, Drywall) -->
                                    <div id="technical-docs-wrapper" style="display: flex; flex-direction: column; gap: 12px;">
                                        <div class="file-upload-wrapper">
                                            <label style="display: block; color: #CBD5E1; font-size: 0.8rem; margin-bottom: 4px;">CV Documentado (PDF)</label>
                                            <input type="file" id="file-cv" accept=".pdf" style="width: 100%; color: #94A3B8; font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                                        </div>
                                        
                                        <div class="file-upload-wrapper">
                                            <label style="display: block; color: #CBD5E1; font-size: 0.8rem; margin-bottom: 4px;">Certificados de Trabajo (PDF)</label>
                                            <input type="file" id="file-certificados" accept=".pdf" style="width: 100%; color: #94A3B8; font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="form-group terms-checkbox" style="margin-bottom: 24px; display: flex; align-items: start; gap: 12px; background: rgba(255,255,255,0.02); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <input type="checkbox" id="register-terms" required style="margin-top: 2px; cursor: pointer; width: 20px; height: 20px; accent-color: var(--primary-accent); flex-shrink: 0;">
                        <label for="register-terms" style="color: #94A3B8; font-size: 0.85rem; line-height: 1.5; cursor: pointer;">
                            He leído y acepto los <a href="./TERMINOS Y CONDICIONES/TÉRMINOS Y CONDICIONES GENERALES DE PRESTACIÓN DE SERVICIOS JYA SAFEWORK (1).pdf" target="_blank" style="color: var(--primary-accent); text-decoration: underline; font-weight: 600;">Términos y Condiciones Generales de Prestación de Servicios</a>.
                        </label>
                    </div>

                    <button type="submit" class="btn-primary" id="register-btn" style="width: 100%; background: linear-gradient(135deg, var(--primary-accent) 0%, #1D4ED8 100%); color: #fff; border: none; border-radius: 12px; padding: 16px; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.2);">
                        <span id="register-btn-text">Crear Cuenta</span>
                        <i class="fa-solid fa-spinner fa-spin" id="register-spinner" style="display:none;"></i>
                    </button>
                    
                    <p style="text-align: center; color: #64748B; font-size: 0.9rem; margin-top: 24px;">
                        ¿Ya tienes cuenta? <a href="#/login" style="color: var(--primary-accent); text-decoration: none; font-weight: 600;">Inicia Sesión</a>
                    </p>
                </form>
            </div>
        </div>
    `;
};
