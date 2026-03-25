# FASE 6: Plan de Pagos Manuales y Panel de Administración

Este documento detalla la estrategia para monetizar la plataforma "J&A SafeWork" mediante el cobro de comisiones por servicio de forma manual para mitigar riesgos de fraude y evitar costos de pasarelas de terceros.

## 1. Modelo de Negocio
- **Comisión de Plataforma**: 25% sobre el total del servicio.
- **Flujo**: 
  1. El cliente solicita el servicio.
  2. El profesional o empresa acepta el trabajo.
  3. Tras la aceptación, el cliente realiza el pago total vía Depósito/Transferencia (BCP, Yape, Plin) a las cuentas de J&A SafeWork.
  4. El cliente sube el comprobante a la plataforma y lo envía vía WhatsApp al +51915079361.
  5. Un Administrador aprueba el comprobante en su Panel (Dashboard).
  6. Al verificarse el pago, la plataforma registra el ingreso y calcula el 25% de comisión de J&A SafeWork y el 75% por pagar al profesional.
  7. Al finalizar el trabajo, el Administrador paga al profesional el 75% correspondiente y lo marca como pagado en el sistema.

## 2. Requerimientos Técnicos
- **Base de Datos**: 
  - Nuevos estados de servicio: `esperando_profesional`, `esperando_pago`, `pago_verificando`, `aprobado`, `pagado_profesional`.
  - Roles de usuario: Crear rol `admin` para visualizar el Dashboard.
- **Frontend (Cliente)**:
  - Formulario/vista para cargar foto del comprobante (integración con Firebase Storage).
  - Botón de envío directo a WhatsApp.
- **Frontend (Admin Dashboard)**:
  - Vista exclusiva para roles `admin`.
  - Panel para aprobar/rechazar comprobantes.
  - Panel financiero con la deuda pendiente a profesionales y botón "Marcar como Pagado".

## 3. Próximos Pasos de Desarrollo
1. Implementar roles de usuario.
2. Adaptar el flujo de la solicitud (Checkout después de la aceptación).
3. Implementar la subida del comprobante y redirección a WhatsApp.
4. Construir el Admin Dashboard completo.
