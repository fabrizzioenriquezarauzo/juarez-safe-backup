import { AppState } from '../state.js';
import { logoutUser } from '../services/auth.js';
import Router from '../router.js';

export const renderHome = (user) => {
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
                </div>
            </div>
        </div>

        <!-- Sidebar / List (Ride-Sharing Style) -->
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
                <div class="filters" style="flex-wrap:wrap; gap:6px;">
                    <button class="filter-btn active" data-filter="all">Todos</button>
                    <button class="filter-btn" data-filter="prevencion"><i class="fa-solid fa-hard-hat"></i> Prevención</button>
                    <button class="filter-btn" data-filter="electricidad"><i class="fa-solid fa-bolt"></i> Electricista</button>
                    <button class="filter-btn" data-filter="drywall"><i class="fa-solid fa-hammer"></i> Drywall</button>
                    <button class="filter-btn" data-filter="hogar"><i class="fa-solid fa-broom"></i> Hogar</button>
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
            <div class="map-container" id="map">
                <!-- Leaflet Map -->
            </div>
        </main>
    
        <div class="modal-overlay" id="prof-modal">
            <div class="modal-content"></div>
        </div>
      </div>
    `;
};
