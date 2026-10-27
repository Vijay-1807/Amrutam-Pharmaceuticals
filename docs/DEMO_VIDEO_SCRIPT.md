# 🎥 Amrutam Telemedicine Backend — Demo Video Walkthrough Script

> **Target Video Duration:** 5 to 7 Minutes  
> **Resolution:** 1080p / 60 FPS recommended  
> **Presenter:** Backend Developer Candidate  
> **Project:** Amrutam Pharmaceuticals Telemedicine System Backend  
> **Repository:** [https://github.com/Vijay-1807/Amrutam-Pharmaceuticals.git](https://github.com/Vijay-1807/Amrutam-Pharmaceuticals.git)

---

## 🎬 Video Outline & Timestamps

| Timestamp | Segment | Key Focus |
|---|---|---|
| **0:00 - 0:45** | **Introduction & Mission** | Problem context, 100k daily consultations target, stack overview |
| **0:45 - 1:45** | **Architecture & 100k/day Scaling** | 4-page Architecture doc, PostgreSQL 15 + Prisma, Redis caching, sub-200ms p95 |
| **1:45 - 2:45** | **Security & STRIDE Threat Model** | AES-256-GCM data encryption at rest, TOTP MFA, JWT rotation, privilege escalation prevention |
| **2:45 - 3:45** | **Concurrency & Distributed Idempotency** | Race conditions, double-booking prevention, 24h TTL, SHA-256 payload hashing |
| **3:45 - 4:45** | **Observability & Probes** | Prometheus histogram metrics, Grafana dashboards, Pino trace IDs, `/health`, `/ready` |
| **4:45 - 5:45** | **Developer Portal & Mobile Responsiveness** | Live demo: Dark/Light theme, Pixel 9 Pro mobile dock, zero overflow, Try-It console |
| **5:45 - 6:30** | **Test Rigor & Verification** | **72 total tests** passing: 30 Jest integration + 42 Playwright cross-device E2E tests |
| **6:30 - 7:00** | **Conclusion & Submission Wrap-Up** | Clean code maintenance, zero warnings, production readiness |

---

## 🎙️ Scene-by-Scene Script

### Scene 1: Introduction & Mission (0:00 – 0:45)
**Screen Setup:** Visual Studio Code workspace open at `telemedicine-backend/`, or the browser at `http://localhost:3000/`.  
**Voiceover:**
> *"Hello! Today I am presenting the backend system for the **Amrutam Telemedicine Platform**, built for the Backend Developer Assignment.
>
> The primary objective was to architect a production-grade, highly available healthcare API designed to support **100,000 daily consultations** while delivering sub-200 millisecond read latencies and sub-500 millisecond write latencies.
>
> Our tech stack is built on TypeScript, Express, PostgreSQL with Prisma ORM (8 normalized tables), Redis for distributed caching and sliding-window rate limiting, Bull MQ for asynchronous workflows, and Prometheus with Pino for enterprise-grade observability.
>
> Every single deliverable from the assignment brief — from AES-256-GCM clinical encryption and TOTP multi-factor authentication to distributed idempotency, 4-page system architecture docs, and 72 automated tests — has been fully engineered and verified."*

---

### Scene 2: Architecture & High-Scale Design (0:45 – 1:45)
**Screen Setup:** Open `docs/ARCHITECTURE.md`, `prisma/schema.prisma`, and the Architecture tab of `http://localhost:3000/portal`.  
**Voiceover:**
> *"Let's examine how the system achieves 100k daily consultations reliably.
>
> As documented in our comprehensive 4-page **System Architecture Specification** (`docs/ARCHITECTURE.md`):
> 1. Traffic peaks at approximately 32 write operations and over 70 read requests per second during peak clinic hours.
> 2. Our database schema features 8 normalized models with composite B-Tree indexes on high-frequency paths like `(doctorId, startTime, endTime)` for microsecond slot discovery, and partial indexes on unbooked slots.
> 3. For 100k daily consultations, we designed monthly range-partitioning on `consultations` and `audit_logs` enabling instant partition pruning.
> 4. Read operations route to asynchronous PostgreSQL Read Replicas, while mutative writes execute on Primary.
> 5. Heavy asynchronous background workflows — such as consultation reminder notifications and Razorpay webhook processing — are handled by Bull MQ message queues with exponential backoff and jitter."*

---

### Scene 3: Security & STRIDE Threat Model (1:45 – 2:45)
**Screen Setup:** Open `docs/SECURITY_THREAT_MODEL.md` and `src/shared/security/encryption.ts`.  
**Voiceover:**
> *"Healthcare platforms handle Protected Health Information (PHI) requiring strict HIPAA and DISHA compliance. Our security design is detailed in `docs/SECURITY_THREAT_MODEL.md`:
>
> First, **Clinical Encryption at Rest**: All sensitive consultation notes, patient symptoms, and doctor diagnoses are encrypted using **AES-256-GCM** with authenticated 128-bit checksum tags and PBKDF2 key derivation. Even in the event of a raw database dump, medical records cannot be deciphered or tampered with.
>
> Second, **Authentication & MFA**: We implement standard RFC 6238 TOTP Multi-Factor Authentication via Speakeasy with QR code generation. Access tokens expire in 15 minutes, while 7-day refresh tokens use cryptographic SHA-256 rotation where old tokens are destroyed upon first use to eliminate replay attacks.
>
> Third, **Privilege Escalation Protection**: Self-registration with an `ADMIN` role is automatically intercepted and demoted server-side to `PATIENT`. Administrator roles can only be provisioned through secure database seeding."*

---

### Scene 4: Concurrency & Distributed Idempotency (2:45 – 3:45)
**Screen Setup:** Open `src/shared/middleware/idempotency.ts` and `tests/idempotency.test.ts`.  
**Voiceover:**
> *"A critical failure mode in healthcare platforms is duplicate appointment booking or duplicate payment charges caused by double-clicks or mobile network retries.
>
> In accordance with the bonus rubric criteria, we engineered a **Distributed Idempotency Engine**:
> Every write endpoint accepts a unique `Idempotency-Key` header.
> We compute a SHA-256 fingerprint of the request payload and attempt an atomic `INSERT` into the `idempotency_keys` table.
> Because PostgreSQL enforces a strict unique constraint on `(key, userId, method, path)`, any concurrent race condition triggers an immediate conflict. The second request either waits for the committed transaction or retrieves the cached 201 response directly from the 24-hour TTL record.
>
> Combined with row-level locks (`SELECT FOR UPDATE`) on availability slots, two patients can never double-book the same slot."*

---

### Scene 5: Observability, Metrics & Health Probes (3:45 – 4:45)
**Screen Setup:** Navigate in browser to `http://localhost:3000/metrics` and `http://localhost:3000/ready`.  
**Voiceover:**
> *"For production reliability, our observability stack gives operators real-time visibility:
>
> Visiting `/health` returns the live heartbeat timestamp.
> Visiting `/ready` actively checks the database and Redis cache connectivity, making it ideal for Kubernetes readiness probes.
> Visiting `/metrics` streams Prometheus-formatted metrics, including `http_requests_total`, error counts partitioned by route and status code, and `http_request_duration_seconds` histogram buckets that continuously track p95 and p99 response times.
>
> In addition, every single request receives a distributed UUID `X-Trace-Id` logged via Pino structured JSON format, enabling instant trace correlation across microservices."*

---

### Scene 6: Live Developer Portal & Mobile Responsiveness (4:45 – 5:45)
**Screen Setup:** Open browser to `http://localhost:3000/`. Demonstrate Desktop view, toggle Dark/Light theme, then press `F12` and switch to Pixel 9 Pro / mobile emulation.  
**Voiceover:**
> *"Now let's explore the Amrutam Developer Portal.
>
> Designed with rich aesthetics in Amrutam's signature Ayurvedic emerald and gold palette, this developer portal provides full API documentation and an interactive testing console:
>
> 1. Let's toggle between **Dark Theme** and **Light Theme** with our instant anti-FOUC theme switcher.
> 2. Clicking **Live Health Check** performs a live probe to `/health` with a real-time status beacon.
> 3. In the **API Explorer**, we can expand endpoints, view parameter schemas, copy 1-click cURL commands, and execute live requests in the **Try It** console.
> 4. Now let's open Chrome DevTools mobile emulation: Notice on mobile viewports like the Pixel 9 Pro and iPhone SE, there is **zero horizontal overflow**. The bottom mobile navigation dock provides quick thumb-accessible navigation across Overview, Explorer, Architecture, and Quick Start, while notifications float cleanly above the dock."*

---

### Scene 7: Automated Test Rigor — 72/72 Tests (5:45 – 6:30)
**Screen Setup:** Terminal in VS Code running `npm test` and `npx playwright test`.  
**Voiceover:**
> *"Code quality is verified by **72 automated tests**:
>
> First, our **Jest Integration Test Suite**: 30 integration tests spanning authentication, doctor availability overlap rejection, consultation state machines, idempotent deduplication, and Prometheus telemetry. All 30 tests pass cleanly.
>
> Second, running `npx playwright test` launches our Playwright cross-device test runner: **42 automated tests** validating the live API surface, token rotation replay rejection, doctor filtering, idempotency cache replay, and responsive viewport assertions across Pixel 9 Pro, iPhone SE, Small Android (360px), Tablet, and Desktop.
>
> All 72 tests pass with 100% success rate."*

---

### Scene 8: Conclusion & Submission Wrap-Up (6:30 – 7:00)
**Screen Setup:** Back to the Developer Portal home screen or README on GitHub.  
**Voiceover:**
> *"In summary, the Amrutam Telemedicine Backend delivers on every single objective:
> - High-scale architecture ready for 100k daily consultations
> - AES-256-GCM clinical encryption and TOTP MFA
> - Distributed idempotency preventing double-bookings
> - Full Prometheus observability
> - Complete 4-page Architecture Specification and Threat Model
> - 72 automated tests passing with zero errors
>
> The codebase is self-contained with zero external credentials required to run locally. Thank you!"*

---

## 🛠️ Recording Checklist Before You Record

1. **Terminal 1 — Run Server:**
   ```bash
   node scripts/start-test-server.js
   ```
2. **Terminal 2 — Run Playwright Tests:**
   ```bash
   npx playwright test
   ```
3. **Browser Tabs Prepared:**
   - Tab 1: `http://localhost:3000/` (Developer Portal — test Dark/Light theme & DevTools Mobile mode)
   - Tab 2: `http://localhost:3000/metrics` (Prometheus Metrics)
   - Tab 3: `http://localhost:3000/api/openapi.json` (OpenAPI 3.0 Schema)
   - Tab 4: `https://github.com/Vijay-1807/Amrutam-Pharmaceuticals.git` (GitHub Repo)
