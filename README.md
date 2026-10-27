# 🌿 Amrutam Telemedicine Backend

[![Build](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Jest Tests](https://img.shields.io/badge/Jest%20Tests-30%2F30%20Passed-brightgreen.svg)]()
[![Playwright E2E](https://img.shields.io/badge/Playwright%20E2E-24%2F24%20Passed-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-gold.svg)]()
[![License](https://img.shields.io/badge/License-ISC-lightgrey.svg)]()

Production-grade, highly available healthcare API designed for **100,000 daily consultations** with sub-200ms read latency, AES-256-GCM clinical data encryption, RFC 6238 TOTP Multi-Factor Authentication, distributed idempotency, Prometheus observability, and an interactive Developer Portal.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
  - [Option 1: Autonomous Test & Dev Server (Zero External Setup)](#option-1-autonomous-test--dev-server-zero-external-setup)
  - [Option 2: Docker Compose Full Stack](#option-2-docker-compose-full-stack)
- [Interactive Developer Portal](#-interactive-developer-portal)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Project Structure](#-project-structure)
- [Security & Compliance](#-security--compliance)
- [Demo Video Walkthrough Script](#-demo-video-walkthrough-script)

---

## 🏗️ Architecture Overview

The system is engineered for high-throughput healthcare workflows:
- **Application Layer:** Express.js + TypeScript (modular domain architecture)
- **Database & ORM:** PostgreSQL 15 + Prisma ORM (8 normalized tables, 20+ composite indexes)
- **Distributed Caching & Rate Limiting:** Redis 7 with sliding-window algorithm and graceful offline fallback
- **Asynchronous Task Queues:** Bull MQ for async appointment notifications, reminder scheduling, and webhook processing
- **Observability Stack:** Prometheus metrics (`http_requests_total`, `http_request_duration_seconds` histograms), Pino structured JSON logging with distributed trace IDs (`X-Trace-Id`), and `/health` + `/ready` liveness/readiness probes

```
[ Client / Mobile Apps ]
          │
          ▼
   [ Nginx / ALB ]
          │
          ▼
 [ Express.js Backend ] ─── Helmet · CORS · Rate Limiter · Tracing · JWT Auth · Idempotency
    │         │
    ▼         ▼
[ PostgreSQL ] [ Redis ] ─── Bull MQ Worker Queues (Email, Reminders, Razorpay)
    │
    ▼
[ Prometheus ] ──► [ Grafana Dashboards ]
```

---

## 🌟 Key Features

1. **Authentication & Identity Management**:
   - 15-minute access tokens + 7-day cryptographically rotating refresh tokens
   - TOTP Multi-Factor Authentication (RFC 6238 via Speakeasy) with QR code generation
   - Privilege escalation blocked: self-registration as `ADMIN` is automatically sanitized to `PATIENT`
2. **Ayurvedic Doctor Directory**:
   - Search by specialty, Prakriti typing, spoken languages, rating, and consultation fee
   - Slot management with conflict detection preventing overlapping or past appointments
   - Public discovery with role-aware enrichments
3. **Consultations & Clinical Lifecycle**:
   - End-to-end status lifecycle: `SCHEDULED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`
   - Clinical notes & symptoms encrypted at rest with **AES-256-GCM**
4. **Ayurvedic Prescriptions**:
   - Structured medication regimens (dosage, frequency, duration, dietary advice) linked to consultations
5. **Distributed Idempotency Engine**:
   - Database-level unique constraint on `(key, userId, method, path)` with 24-hour TTL and SHA-256 request payload hashing
   - Completely eliminates double-booking and duplicate payment processing under concurrent race conditions
6. **Payments & Audit Trail**:
   - Razorpay-ready consultation payments, refund processing, and immutable compliance audit logs for all security and financial events

---

## 🚀 Quick Start

### Option 1: Autonomous Test & Dev Server (Zero External Setup)
Run the self-contained test environment that automatically boots Embedded Postgres and Redis:

```bash
# 1. Install dependencies
npm install

# 2. Build portal & start server
node scripts/start-test-server.js
```

The portal and API will be running at:
- **Developer Portal:** [http://localhost:3000/](http://localhost:3000/)
- **Health Check:** [http://localhost:3000/health](http://localhost:3000/health)
- **Readiness Check:** [http://localhost:3000/ready](http://localhost:3000/ready)
- **Prometheus Metrics:** [http://localhost:3000/metrics](http://localhost:3000/metrics)
- **OpenAPI Schema:** [http://localhost:3000/api/openapi.json](http://localhost:3000/api/openapi.json)

### Option 2: Docker Compose Full Stack
Spin up all 5 containers (Backend, Postgres, Redis, Prometheus, Grafana):

```bash
cp .env.example .env
docker-compose up -d

# Seed database with sample Ayurvedic doctors and admin
npm run seed
```

---

## 🌐 Interactive Developer Portal

Access the portal at `http://localhost:3000/` or `http://localhost:3000/portal` to experience:
- **Live Health & Metrics Probes:** Real-time probing of `/health`, `/ready`, and Prometheus `/metrics`.
- **API Explorer:** Collapsible documentation cards for all modules with schema definitions, required field tags, and curl copy.
- **Interactive Request Runner ("Try It"):** Live in-browser request execution with formatted responses and token capture.
- **Architecture & Project Topology:** Interactive visual request workflow diagrams.

---

## 🧪 Testing & Quality Assurance

The codebase includes comprehensive automated testing:

```bash
# Run Jest Integration Test Suite (30/30 tests)
npm test

# Run Playwright End-to-End Test Suite (24/24 tests)
npm run test:playwright

# TypeScript Typecheck & Build
npm run build
```

### Test Suite Breakdown:
| Suite | Framework | Count | Coverage | Status |
|-------|-----------|-------|----------|--------|
| **Unit & Integration** | Jest + Supertest | **30 Tests** | Auth, RBAC, Consultations, Doctors, Payments, Idempotency, Metrics | ✅ PASS |
| **End-to-End & UI** | Playwright Chromium | **24 Tests** | Observability, E2E Auth, Doctor Search, Idempotency Replay, Portal UI | ✅ PASS |
| **Total Automated Tests** | | **54 Tests** | Full stack validation | **100% PASS** |

---

## 📁 Project Structure

```
telemedicine-backend/
├── src/
│   ├── app.ts                  # Express application, middleware chain & routes
│   ├── server.ts               # HTTP listener & graceful shutdown handlers
│   ├── modules/
│   │   ├── auth/               # JWT, TOTP MFA, refresh token rotation, validation
│   │   ├── doctors/            # Profiles, slot management, search & filters
│   │   ├── consultations/      # Booking, state machine, AES-256 clinical notes
│   │   ├── prescriptions/      # Ayurvedic medication prescriptions
│   │   ├── payments/           # INR payments, Razorpay hooks, refunds
│   │   └── admin/              # Analytics KPIs, user directory, audit trails
│   └── shared/
│       ├── database/           # Prisma client & connection management
│       ├── middleware/         # Auth, validation, rate limiter, idempotency, error handler
│       ├── observability/      # Prometheus metrics, Pino logger, distributed tracing
│       ├── security/           # AES-256-GCM encryption & password hashing
│       └── jobs/               # Bull MQ queues (notifications, reminders)
├── prisma/
│   ├── schema.prisma           # 8 normalized models with indexes
│   └── migrations/             # Production deployment migrations
├── scripts/
│   ├── build-portal.js         # Generates the Developer Portal UI
│   ├── start-test-server.js    # Self-contained dev/test server runner
│   └── seed.js                 # Demo data seeder
├── tests/                      # Jest test suites & Playwright E2E specs
├── docs/
│   ├── openapi.json            # Complete OpenAPI 3.0 specification
│   └── DEMO_VIDEO_SCRIPT.md    # Step-by-step video presentation guide
└── docker-compose.yml          # Multi-container local orchestration
```

---

## 🔒 Security & Compliance

- **Clinical Encryption:** AES-256-GCM with authenticated tags protects consultation notes, diagnoses, and patient symptoms at rest.
- **Rate Limiting:** Sliding-window counter in Redis (100 req / 15 min default) with standard `X-RateLimit-*` headers.
- **Audit Trails:** Immutable database logging of all security events (`USER_LOGIN`, `MFA_VERIFIED`, `PAYMENT_COMPLETED`, etc.) with IP and User-Agent capture.
- **Zero Hardcoded Secrets:** Enforced via strict Zod environment validation on boot (`src/config/index.ts`).

---

## 🎥 Demo Video Walkthrough Script

A complete 5-7 minute walkthrough script with timestamps, screen actions, and word-for-word voiceover is available in:  
👉 **[docs/DEMO_VIDEO_SCRIPT.md](file:///c:/Users/Bonth/Downloads/Amrutam%20Pharmaceuticals/telemedicine-backend/docs/DEMO_VIDEO_SCRIPT.md)**
