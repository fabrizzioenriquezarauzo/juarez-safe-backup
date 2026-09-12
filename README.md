# J&A SafeWork - Plataforma de Gestión de Servicios Técnicos y Mantenimiento

[![Firebase](https://img.shields.io/badge/Backend-Firebase-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![JavaScript](https://img.shields.io/badge/Frontend-ES6%2B%20Vanilla%20JS-f7df1e?style=flat-square&logo=javascript)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=flat-square)](#)

**J&A SafeWork** es una Single Page Application (SPA) modular diseñada para la gestión, solicitud y administración de servicios de ingeniería, seguridad industrial y mantenimiento técnico. La plataforma integra un flujo completo entre Clientes, Especialistas Técnicos y Administradores.

---

## 🛠️ Arquitectura y Tecnologías

- **Frontend**: HTML5, CSS3 (Diseño responsivo con variables de diseño personalizadas), JavaScript ES6+ (Arquitectura orientada a módulos SPA).
- **Backend & Database**: Firebase Authentication, Cloud Firestore (Base de datos NoSQL en tiempo real), Firebase Storage.
- **Hosting & Infraestructura**: Firebase Hosting con despliegue automatizado.
- **Patrón de Arquitectura**: MVC / SPA con Enrutamiento Dinámico de vistas (`router.js`), Manejo de Estado reactivo (`state.js`) y Controladores de Administración (`AdminController.js`).

---

## 🚀 Características Principales

### 👨‍💻 Cliente / Usuario
- **Catálogo Dinámico de Servicios**: Solicitud de servicios técnicos y de mantenimiento.
- **Checkout y Proceso de Pago**: Subida de comprobantes de pago (BCP, Interbank, Yape, Plin) con envío directo a verificación.
- **Seguimiento en Tiempo Real**: Estado del servicio solicitado (`esperando_profesional`, `esperando_pago`, `pago_verificando`, `aprobado`, `finalizado`).

### 👷 Especialistas Técnicos
- **Mapeo de Solicitudes**: Aceptación o rechazo de servicios asignados.
- **Carga de Certificados y Documentos**: Validación de perfil técnico mediante Firebase Storage.
- **Historial de Trabajos y Pagos**: Visualización de servicios realizados e ingresos netos.

### 🛡️ Panel de Administración (Admin Dashboard)
- **Verificación de Comprobantes de Pago**: Aprobación y rechazo dinámico de vouchers cargados por clientes.
- **Control Financiero y Comisiones**:
  - Registro automatizado del **25% de comisión para la plataforma**.
  - Cálculo del **75% neto a abonar al especialista**.
- **Gestión de Usuarios y Roles**: Administración de roles y permisos mediante Firestore Security Rules (RBAC).

---

## 📂 Estructura del Proyecto

```bash
Juarez Empresa/
├── css/                     # Hojas de estilo estructuradas y variables de tema
├── js/
│   ├── services/            # Servicios de integración con Firebase (Auth, Database, Storage)
│   ├── views/               # Vistas modulares de la SPA (AdminDashboard, Checkout, Profile, etc.)
│   ├── AdminController.js   # Controlador de lógica administrativa y financiera
│   ├── app.js               # Punto de entrada principal y bootstrap de la aplicación
│   ├── router.js            # Enrutador cliente SPA
│   └── state.js             # Gestor de estado global de la aplicación
├── FASE_6_PLAN_PAGOS.md     # Documento de especificación técnica y modelo de negocio
├── firestore.rules          # Reglas de seguridad NoSQL y control de acceso RBAC
├── storage.rules            # Reglas de seguridad para carga de archivos y comprobantes
├── firebase.json            # Configuración de despliegue en Firebase Hosting
└── index.html               # Contenedor principal SPA
```

---

## 📄 Documentación Técnica

El proyecto cuenta con especificaciones detalladas para cada módulo:
1. **[Plan de Pagos y Panel Admin](FASE_6_PLAN_PAGOS.md)**: Detalle del modelo financiero, comisión del 25%, flujo de caja y ciclo de vida de los estados del servicio.
2. **Reglas de Firestore (`firestore.rules`)**: Matriz de permisos detallada para garantizar que solo administradores autenticados puedan modificar estados financieros y los usuarios solo accedan a sus propias solicitudes.

---

## 🔧 Instalación y Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/fabrizzioenriquezarauzo/juarez-safe-backup.git
   cd juarez-safe-backup
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo local:**
   ```bash
   python3 dev_server.py
   # O abrir index.html a través de un servidor HTTP local (Live Server / http-server)
   ```

4. **Despliegue a producción (Firebase Hosting):**
   ```bash
   npx firebase deploy
   ```

---

## 🔒 Licencia y Propiedad
Desarrollado para J&A SafeWork. Todos los derechos reservados.
