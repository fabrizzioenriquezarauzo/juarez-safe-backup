# J&A SafeWork - Technical Services & Industrial Safety Management Platform

J&A SafeWork is a modular Single Page Application (SPA) designed for requesting, scheduling, and managing industrial engineering, technical maintenance, and safety services. The platform connects Clients, Field Specialists, and Administrators in a unified real-time workflow.

## Architecture & Tech Stack

- Frontend: HTML5, CSS3 (Responsive design with CSS custom properties), JavaScript ES6+ (Module-based SPA architecture).
- Backend & Database: Firebase Authentication, Cloud Firestore (Real-time NoSQL Database), Firebase Storage.
- Hosting & Infrastructure: Firebase Hosting with automated CLI deployment pipelines.
- Architectural Patterns: SPA / MVC architecture with client-side dynamic routing (router.js), reactive state management (state.js), and centralized admin controllers (AdminController.js).

## Core Features

### Client Portal
- Dynamic Service Catalog: Interactive requesting of technical and maintenance services.
- Checkout & Payment Verification: Proof-of-payment upload (wire transfers, digital wallets) with instant routing for validation.
- Real-Time Request Tracking: Multi-stage tracking pipeline (waiting_specialist, pending_payment, verifying_payment, approved, completed).

### Technical Specialists
- Mission Dispatch: Acceptance or rejection of assigned engineering requests.
- Credentials & Certificate Management: Verification of technical qualifications via Firebase Storage.
- Earnings & Work History: Financial summaries of completed jobs and net income payouts.

### Admin Dashboard & Control Panel
- Payment Voucher Audit: Real-time approval or rejection of customer payment receipts.
- Financial Controls & Platform Fees: Automated 25% platform service fee calculation and tracking of 75% net payout balance owed to technical specialists.
- Role-Based Access Control (RBAC): Fine-grained user role administration enforced via Firestore Security Rules.

## Project Structure

```bash
Juarez Empresa/
├── css/                     # Structured design tokens and modular stylesheets
├── js/
│   ├── services/            # Firebase SDK service integrations (Auth, Firestore, Storage)
│   ├── views/               # SPA modular views (AdminDashboard, Checkout, Profile, etc.)
│   ├── AdminController.js   # Financial & administrative business logic controller
│   ├── app.js               # Main application entry point & bootstrap script
│   ├── router.js            # Client-side SPA routing engine
│   └── state.js             # Global reactive state manager
├── FASE_6_PLAN_PAGOS.md     # Technical specification & financial business model
├── firestore.rules          # NoSQL Security Rules & RBAC access control matrices
├── storage.rules            # Security rules for file uploads & payment receipts
├── firebase.json            # Firebase Hosting & deployment configuration
└── index.html               # SPA root mount point
```

## Technical Documentation

1. Payment Model & Admin Specification (FASE_6_PLAN_PAGOS.md): Detailed breakdown of the financial engine, 25% commission model, transaction flow, and service lifecycle states.
2. Firestore Security Rules (firestore.rules): Access control matrix ensuring only authenticated admins modify financial balances, while clients and specialists are isolated to their authorized data scope.

## Installation & Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/fabrizzioenriquezarauzo/juarez-safe-backup.git
   cd juarez-safe-backup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start local development server:
   ```bash
   python3 dev_server.py
   ```

4. Deploy to production (Firebase Hosting):
   ```bash
   npx firebase deploy
   ```

## Author & License

Developed and maintained by Gerson Fabrizio Enriquez Arauzo for J&A SafeWork. All rights reserved.

