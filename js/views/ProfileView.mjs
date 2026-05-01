export const renderProfile = (user) => {
    const userName = user?.name || 'Profesional';

    // Helper para generar una tarjeta de carga de documento (Style Light)
    const renderUploadCard = (id, label, icon, currentUrl) => {
        return `
            <div class="upload-card" style="padding: 16px; position:relative; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 12px; text-align: center; transition: all 0.2s;">
                <i class="fa-solid ${icon}" style="font-size: 1.25rem; margin-bottom: 8px; color: ${currentUrl ? '#10B981' : '#64748B'};"></i>
                <span style="display:block; color:#1E293B; font-size:0.75rem; font-weight:700;">${label}</span>
                <input type="file" id="${id}" accept=".pdf,image/*" style="position:absolute; inset:0; opacity:0; cursor:pointer;">
                ${currentUrl ?
                `<div class="upload-status" style="color: #10B981; font-size: 0.65rem; margin-top: 6px; font-weight:600;"><i class="fa-solid fa-circle-check"></i> <a href="${currentUrl}" target="_blank" style="color:inherit; text-decoration:underline;">Ver Archivo</a></div>` :
                '<div class="upload-status" style="color: #94A3B8; font-size: 0.65rem; margin-top: 6px;">Click para subir</div>'}
            </div>
        `;
    };

    return `
        <div class="profile-tab-content animate-fade-in" style="padding: 24px; background: #FFFFFF; border-radius: 24px; color: #1E293B; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 40px;">
            <header style="margin-bottom: 24px; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px;">
                <h2 style="color: #0F172A; font-size: 1.4rem; font-weight: 800; margin-bottom: 4px;">Mi Perfil Profesional</h2>
                <p style="color: #64748B; font-size: 0.85rem;">Gestiona tus credenciales y visibilidad.</p>
            </header>

            <form id="profile-settings-form">
                <!-- 0. Foto de Perfil (SUPER PROMINENTE) -->
                <div style="margin-bottom: 40px; text-align: center; background: #fff; padding: 32px 24px; border-radius: 24px; border: 2px solid #F1F5F9; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <div style="position: relative; width: 130px; height: 130px; margin: 0 auto 20px auto;">
                        <img id="prof-photo-preview" src="${user?.img || 'https://via.placeholder.com/130?text=SST'}" alt="Foto de Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 8px 25px rgba(37,99,235,0.15);">
                        <label for="prof-photo-input" style="position: absolute; bottom: 5px; right: 5px; background: #2563EB; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: transform 0.2s;">
                            <i class="fa-solid fa-camera" style="font-size: 1.1rem;"></i>
                        </label>
                        <input type="file" id="prof-photo-input" accept="image/*" style="display: none;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #0F172A; font-size: 1.25rem; font-weight: 800; margin: 0 0 6px 0;">¡Hola, ${userName}!</h3>
                        <p style="color: #64748B; font-size: 0.85rem; max-width: 300px; margin: 0 auto;">Agrega una foto clara de tu rostro para generar más confianza con tus clientes.</p>
                    </div>
                    <label for="prof-photo-input" style="display: inline-flex; align-items: center; gap: 10px; background: #2563EB; color: #fff; padding: 12px 28px; border-radius: 100px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(37,99,235,0.3); transition: all 0.2s;">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Seleccionar Foto Real
                    </label>
                </div>

                <!-- 0.5 Almanaque de Trabajo (NUEVO) -->
                <div style="margin-bottom: 40px;">
                    <h3 style="color: #FF7A00; font-size: 1.1rem; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-regular fa-calendar-days"></i> Mi Calendario de Trabajo
                    </h3>
                    <div id="prof-almanac-container" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <div style="color:#64748B; font-size:0.9rem; text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando calendario...</div>
                    </div>
                </div>

                <!-- 1. Documentación Obligatoria -->
                <div style="margin-bottom: 32px;">
                    <h3 style="color: #2563EB; font-size: 1rem; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-file-shield"></i> Documentación Obligatoria
                    </h3>
                    
                    <div class="upload-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        ${renderUploadCard('prof-doc-dni', 'DNI', 'fa-id-card', user?.documentation?.dniUrl || user?.documentation?.dni)}
                        ${renderUploadCard('prof-doc-certiadulto', 'Certiadulto', 'fa-shield-halved', user?.documentation?.certiadultoUrl || user?.documentation?.certiadulto)}
                        ${renderUploadCard('prof-doc-cv', 'CV SST', 'fa-file-pdf', user?.documentation?.cvUrl || user?.documentation?.cv)}
                        ${renderUploadCard('prof-doc-certs', 'Cert. Médico Ocupacional', 'fa-certificate', user?.documentation?.certificadosUrl || user?.documentation?.certs || user?.documentation?.certificados)}
                        ${renderUploadCard('prof-doc-recibo', 'RHE', 'fa-file-invoice-dollar', user?.documentation?.recibo)}
                    </div>
                </div>

                <!-- 2. Certificaciones Alto Riesgo -->
                <div style="margin-bottom: 32px; padding: 20px; background: #F1F5F9; border-radius: 20px;">
                    <h3 style="color: #0F172A; font-size: 0.95rem; font-weight: 700; margin-bottom: 16px;">
                        <i class="fa-solid fa-triangle-exclamation" style="color: #F59E0B;"></i> Riesgos Críticos
                    </h3>
                    <div class="upload-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${renderUploadCard('prof-doc-altura', 'Altura', 'fa-mountain', user?.documentation?.altura)}
                        ${renderUploadCard('prof-doc-caliente', 'Caliente', 'fa-fire', user?.documentation?.caliente)}
                        ${renderUploadCard('prof-doc-electrico', 'Eléctrico', 'fa-bolt', user?.documentation?.electrico)}
                        ${renderUploadCard('prof-doc-confinados', 'Confinados', 'fa-door-closed', user?.documentation?.confinados)}
                        ${renderUploadCard('prof-doc-loto', 'LOTO', 'fa-lock', user?.documentation?.loto)}
                    </div>
                </div>

                <!-- 3. Datos Profesionales -->
                <div style="margin-bottom: 32px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="input-group">
                            <label style="display: block; color: #475569; font-size: 0.7rem; margin-bottom: 6px; font-weight: 700; text-transform: uppercase;">Nivel Profesional</label>
                            <select id="prof-specialty" style="width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; color: #0F172A; outline: none; font-size: 0.9rem;">
                                <option value="Tecnico" ${user?.specialty === 'Tecnico' ? 'selected' : ''}>Técnico SST</option>
                                <option value="Universitario" ${user?.specialty === 'Universitario' ? 'selected' : ''}>Universitario SST</option>
                                <option value="Ing Colegiado" ${user?.specialty === 'Ing Colegiado' ? 'selected' : ''}>Ing. Colegiado</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label style="display: block; color: #475569; font-size: 0.7rem; margin-bottom: 6px; font-weight: 700; text-transform: uppercase;">Categoría de Servicio</label>
                            <select id="prof-category" style="width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; color: #0F172A; outline: none; font-size: 0.9rem;">
                                <option value="Prevencionista" ${(user?.category || user?.jobCategory) === 'Prevencionista' ? 'selected' : ''}>Prevencionista</option>
                                <option value="Técnico Electricista" ${(user?.category || user?.jobCategory) === 'Técnico Electricista' ? 'selected' : ''}>Técnico Electricista</option>
                                <option value="Técnico de Drywall" ${(user?.category || user?.jobCategory) === 'Técnico de Drywall' ? 'selected' : ''}>Técnico de Drywall</option>
                                <option value="Ama de Casa" ${(user?.category || user?.jobCategory) === 'Ama de Casa' ? 'selected' : ''}>Ama de Casa</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="input-group">
                            <label style="display: block; color: #475569; font-size: 0.7rem; margin-bottom: 6px; font-weight: 700; text-transform: uppercase;">Tarifa Día (S/)</label>
                            <input type="number" id="prof-rate" value="${user?.rate || 0}" style="width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; color: #0F172A; outline: none; font-size: 0.9rem;">
                        </div>
                    </div>

                    <div class="input-group" style="margin-bottom: 16px;">
                        <label style="display: block; color: #475569; font-size: 0.7rem; margin-bottom: 6px; font-weight: 700; text-transform: uppercase;">WhatsApp / Celular</label>
                        <input type="tel" id="prof-phone" value="${user?.phone || ''}" style="width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; color: #0F172A; outline: none; font-size: 0.9rem;" placeholder="Ej: 987654321">
                    </div>

                    <div class="input-group">
                        <label style="display: block; color: #475569; font-size: 0.7rem; margin-bottom: 6px; font-weight: 700; text-transform: uppercase;">Resumen Curricular</label>
                        <textarea id="prof-experience" style="width: 100%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; color: #0F172A; outline: none; min-height: 80px; resize: none; font-size: 0.85rem;">${user?.experience || ''}</textarea>
                    </div>
                </div>

                <!-- GPS Section -->
                <div style="background: #FFF7ED; padding: 16px; border-radius: 16px; border: 1px solid #FFEDD5; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                    <div>
                        <h4 style="color: #9A3412; font-size: 0.8rem; font-weight: 800; margin: 0;">Ubicación GPS</h4>
                        <span id="gps-status" style="font-size: 0.65rem; font-weight: 700; color: ${user?.lat ? '#16A34A' : '#9A3412'};">
                            ${user?.lat ? 'Verificada' : 'Pendiente'}
                        </span>
                    </div>
                    <button type="button" id="btn-detect-gps" style="background: #EA580C; border: none; border-radius: 50px; padding: 8px 16px; color: #fff; font-size: 0.75rem; font-weight: 800; cursor: pointer;">
                        <i class="fa-solid fa-location-crosshairs"></i> Detectar
                    </button>
                </div>

                <div id="profile-save-msg" style="display: none; padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center; font-size: 0.85rem; font-weight: 600;"></div>

                <button type="submit" id="btn-save-profile" style="width: 100%; background: #FF7A00; color: #fff; border: none; border-radius: 16px; padding: 16px; font-weight: 800; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 12px rgba(255,122,0,0.25); margin-bottom: 40px;">
                    <span id="save-btn-text">Guardar cambios</span>
                    <div id="save-spinner" class="spinner-small" style="display: none;"></div>
                </button>
            </form>
        </div>
    `;
};

