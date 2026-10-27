# 🎥 Amrutam Telemedicine Backend — Demo Video Walkthrough Script

**Target Video Duration:** 5 to 7 Minutes  
**Resolution:** 1080p / 60 FPS recommended  
**Presenter:** Backend Developer Candidate  
**Project:** Amrutam Pharmaceuticals Telemedicine System Backend  

---

## 🎬 Video Outline & Timestamps

| Timestamp | Segment | Key Focus |
|-----------|---------|-----------|
| **0:00 - 0:45** | **Introduction & Mission** | Problem context, 100k daily consultations target, stack overview |
| **0:45 - 1:45** | **Architecture & High-Scale Design** | Horizontal scaling, PostgreSQL 15 + Prisma, Redis caching, sub-200ms p95 |
| **1:45 - 2:45** | **Security & Compliance Deep Dive** | AES-256-GCM data encryption at rest, TOTP MFA, JWT rotation, privilege escalation prevention |
| **2:45 - 3:45** | **Concurrency & Distributed Idempotency** | Race conditions, double-booking prevention, 24h TTL, SHA-256 payload hashing |
| **3:45 - 4:45** | **Observability & Health Probes** | Prometheus histogram metrics, Grafana dashboards, Pino trace IDs, `/health`, `/ready` |
| **4:45 - 6:00** | **Live Developer Portal & UI/UX Demo** | Browser demo: Interactive API explorer, 1-click curl, schema docs, live request test |
| **6:00 - 6:45** | **Test Rigor & Automated Verification** | 30/30 Jest integration tests + 24/24 Playwright E2E tests passing |
| **6:45 - 7:00** | **Conclusion & Submission Wrap-Up** | Clean code maintenance, zero warnings, production readiness |

---

## 🎙️ Scene-by-Scene Script

### Scene 1: Introduction & Mission (0:00 – 0:45)
**Screen Setup:** Visual Studio Code workspace open at `telemedicine-backend/`, or the browser at `http://localhost:3000/`.  
**Voiceover:**
> *"Hello! Today I am presenting the backend system for the **Amrutam Telemedicine Platform**, built for the Backend Developer Assignment.*
>
> *The primary objective was to architect a production-grade, highly available healthcare API designed to support **100,000 daily consultations** while delivering sub-200 millisecond read latencies.*
>
> *Our tech stack is built on TypeScript, Express, PostgreSQL with Prisma ORM, Redis for distributed caching and sliding-window rate limiting, Bull MQ for asynchronous workflows, and Prometheus with Pino for enterprise-grade observability.*
>
> *Every single requirement from the assignment brief — from AES-256 encryption and TOTP multi-factor authentication to distributed idempotency and automated testing — has been rigorously engineered and verified."*

---

### Scene 2: Architecture & High-Scale Design (0:45 – 1:45)
**Screen Setup:** Open `docs/openapi.json`, `prisma/schema.prisma`, and the Architecture section of `http://localhost:3000/portal`.  
**Voiceover:**
> *"Let's examine how the system achieves 100k daily consultations reliably.*
>
> *At 100k consultations per day, traffic peaks at over 120 write operations and over 600 read requests per second during peak clinic hours.*
>
> *To guarantee sub-200ms latency:*
> 1. *Our database schema features 8 normalized models with composite B-Tree indexes on high-frequency query paths like `(doctorId, startTime)` for instant slot lookup, and `(patientId, createdAt)` for consultation histories.*
> 2. *Stateless application instances allow horizontal autoscaling behind any cloud load balancer or Nginx reverse proxy.*
> 3. *Read queries utilize Redis caching and connection-pooled PostgreSQL connections.*
> 4. *Heavy asynchronous tasks — such as appointment reminders, prescription email notifications, and Razorpay webhook processing — are offloaded to Bull MQ message queues with exponential backoff retries, protecting our HTTP request loop from blocking."*

---

### Scene 3: Security & Compliance Deep Dive (1:45 – 2:45)
**Screen Setup:** Open `src/shared/security/encryption.ts` and `src/modules/auth/service.ts`.  
**Voiceover:**
> *"Healthcare data requires strict compliance with HIPAA and DISHA guidelines. Here is our multi-layered security model:*
>
> *First, **Data at Rest Encryption**: All clinical notes, patient symptoms, and diagnoses are encrypted at rest using **AES-256-GCM** with authenticated checksum tags and PBKDF2 key derivation. Even if database files were intercepted, raw medical notes cannot be deciphered.*
>
> *Second, **Authentication & MFA**: We implement standard RFC 6238 TOTP Multi-Factor Authentication via Speakeasy with QR code generation. Access tokens expire in 15 minutes, while 7-day refresh tokens use cryptographic SHA-256 rotation where old tokens are destroyed upon first use to eliminate replay attacks.*
>
> *Third, **Privilege Escalation Protection**: In `validation.ts` and `service.ts`, registration schemas explicitly sanitize and demote any unauthorized self-assignment of the `ADMIN` role back to `PATIENT`. Administrator roles can only be provisioned through secure database seeding or existing verified admins."*

---

### Scene 4: Concurrency & Distributed Idempotency (2:45 – 3:45)
**Screen Setup:** Open `src/shared/middleware/idempotency.ts` and `tests/idempotency.test.ts`.  
**Voiceover:**
> *"A frequent failure mode in healthcare platforms is duplicate appointment booking or duplicate payment processing caused by network retries or simultaneous button clicks.*
>
> *To solve this, we engineered a **Distributed Idempotency Engine**:*
> *Every write endpoint accepts a unique `Idempotency-Key` header.*
> *We compute a SHA-256 fingerprint of the request payload and attempt an atomic `INSERT` into the `idempotency_keys` table.*
> *Because PostgreSQL enforces a strict unique constraint on `(key, userId, method, path)`, any concurrent race condition triggers an immediate unique constraint check. The second request detects the in-flight operation and either waits for the committed result or retrieves the cached 201 response directly from the 24-hour TTL record.*
>
> *This guarantees that two doctors or two patients can never double-book a slot, and payment requests can never be double-charged."*

---

### Scene 5: Observability, Metrics & Health Probes (3:45 – 4:45)
**Screen Setup:** Navigate in browser to `http://localhost:3000/metrics` and `http://localhost:3000/ready`.  
**Voiceover:**
> *"For production reliability, our observability stack gives operators real-time visibility:*
>
> *Visiting `/health` returns the live heartbeat timestamp.*
> *Visiting `/ready` actively checks the database and cache connectivity, making it ideal for Kubernetes readiness probes.*
> *Visiting `/metrics` streams Prometheus-formatted metrics, including `http_requests_total`, errors partitioned by route and status code, and `http_request_duration_seconds` histogram buckets that continuously track p95 and p99 response times.*
>
> *In addition, every single request receives a distributed UUID `X-Trace-Id` logged via Pino structured JSON format, enabling instant trace correlation across microservices."*

---

### Scene 6: Live Developer Portal & UI/UX Demo (4:45 – 6:00)
**Screen Setup:** Open browser to `http://localhost:3000/` (or `http://localhost:3000/portal`).  
**Voiceover:**
> *"Now let's look at the Amrutam Developer Portal.*
>
> *Designed with rich aesthetics in Amrutam's signature Ayurvedic emerald and gold palette, this developer portal provides full API documentation and an interactive testing console:*
>
> 1. *Clicking **Live Health Check** performs a live probe to `/health` with a real-time status beacon.*
> 2. *Clicking **API Explorer** provides categorized documentation for Auth, Doctors, Consultations, Prescriptions, Payments, and Admin.*
> 3. *Let's test the Registration endpoint live: We expand the card, switch to **Try It**, enter our credentials, and click **Send Request** — instantly returning HTTP 201 with JWT access and refresh tokens.*
> 4. *Every card includes 1-click cURL copying, schema tables with required field indicators, and response samples.*
> 5. *We can navigate to **Architecture** to view the interactive request topology and project tree, or visit **Quick Start** for Docker Compose demo credentials."*

---

### Scene 7: Automated Test Rigor (6:00 – 6:45)
**Screen Setup:** Terminal in VS Code running `npm test` and `npx playwright test`.  
**Voiceover:**
> *"Code quality is backed by comprehensive test suites:*
>
> *First, running `npm test` executes our **Jest Integration Test Suite**: 7 test suites containing 30 integration tests spanning authentication, doctor availability overlap rejection, consultation state machines, idempotent deduplication, and Prometheus telemetry. All 30 tests pass cleanly.*
>
> *Second, running `npx playwright test` launches our headless Chromium test runner: 24 end-to-end tests validating the live API surface, token rotation replay rejection, doctor filtering, idempotency cache replay, and interactive browser UI assertions. All 24 tests pass with zero errors.*
>
> *Combined with `npm run build` compiling TypeScript under strict mode with zero errors, the system is fully production-ready."*

---

### Scene 8: Conclusion (6:45 – 7:00)
**Screen Setup:** Back to the Developer Portal home screen or README.  
**Voiceover:**
> *"In summary, the Amrutam Telemedicine Backend combines high-scale architectural design, robust security with AES-256 encryption, distributed idempotency, full observability, and an interactive developer portal — verified by 54 automated tests.*
>
> *All code is cleanly structured, documented, and ready for deployment. Thank you!"*

---

## 🛠️ Recording Checklist Before You Record

1. **Terminal 1 — Run Server:**
   ```bash
   node scripts/start-test-server.js
   ```
2. **Terminal 2 — Run Jest & Playwright:**
   ```bash
   npm test
   npx playwright test
   ```
3. **Browser Tabs Prepared:**
   - Tab 1: `http://localhost:3000/` (Developer Portal)
   - Tab 2: `http://localhost:3000/metrics` (Prometheus Metrics)
   - Tab 3: `http://localhost:3000/api/openapi.json` (OpenAPI 3.0 JSON)
