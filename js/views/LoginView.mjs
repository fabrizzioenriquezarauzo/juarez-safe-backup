export const renderLogin = () => {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <button onclick="window.location.hash='#/'" class="back-link">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </button>

                <div class="logo-wrapper" style="margin-bottom: 32px;">
                    <img src="img/logo.png" alt="Logo J&A SafeWork" class="responsive-logo">
                    <h1 class="brand-title">J&A SafeWork</h1>
                    <h2 style="color: #94A3B8; font-size: 1.1rem; font-weight: 600; margin-bottom: 4px; letter-spacing: 1px;">Iniciar Sesión</h2>
                </div>

                <!-- Error Message Box -->
                <div id="auth-error" style="display:none; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:12px 16px; margin-bottom:20px; color:#FCA5A5; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span id="auth-error-text"></span>
                </div>

                <form id="login-form">
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <div class="input-with-icon">
                            <i class="fa-solid fa-envelope"></i>
                            <input type="email" id="login-email" class="standard-input" placeholder="tu@correo.com" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Contraseña</label>
                        <div class="input-with-icon">
                            <i class="fa-solid fa-lock"></i>
                            <input type="password" id="login-password" class="standard-input" placeholder="••••••••" required>
                        </div>
                    </div>

                    <button type="submit" class="btn-primary" id="login-btn" style="margin-top: 24px;">
                        <span id="login-btn-text">Ingresar</span>
                        <i class="fa-solid fa-spinner fa-spin" id="login-spinner" style="display:none;"></i>
                    </button>

                    <div class="auth-footer">
                        <p>¿No tienes una cuenta? <a href="#/register" onclick="window.location.hash='#/register'">Regístrate aquí</a></p>
                    </div>
                </form>
            </div>
        </div>
    `;
};
