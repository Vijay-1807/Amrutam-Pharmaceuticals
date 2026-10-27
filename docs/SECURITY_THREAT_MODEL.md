# 🛡️ Amrutam Telemedicine — Security Checklist & Threat Model

> **Compliance Standards:** HIPAA Security Rule · DISHA (Digital Information Security in Healthcare Act) · OWASP ASVS Level 2  
> **Security Classification:** Level 4 (Protected Health Information / PHI & Clinical Data)

---

## 📑 Table of Contents
1. [OWASP Top 10 (2021/2025) Mitigation Matrix](#1-owasp-top-10-mitigation-matrix)
2. [STRIDE Threat Model & Attack Surface Analysis](#2-stride-threat-model--attack-surface-analysis)
3. [Data Classification & Privacy Policy](#3-data-classification--privacy-policy)
4. [Cryptographic Design & Key Management](#4-cryptographic-design--key-management)
5. [Cryptographic Key Rotation Procedure](#5-cryptographic-key-rotation-procedure)
6. [Immutable Audit Logging Architecture](#6-immutable-audit-logging-architecture)
7. [Dependency Scanning & Vulnerability Management](#7-dependency-scanning--vulnerability-management)
8. [Production Pre-Flight Security Checklist](#8-production-pre-flight-security-checklist)

---

## 1. OWASP Top 10 Mitigation Matrix

| Vulnerability | Threat Description | Telemedicine System Defense & Mitigation | Code Reference |
|---|---|---|---|
| **A01: Broken Access Control** | User accesses another patient's clinical notes, or elevates role to ADMIN | • Strict RBAC middleware checking token claims.<br/>• Silent role demotion: self-registration with `role: "ADMIN"` is sanitized to `PATIENT`.<br/>• Scoped queries matching `patientId = req.user.id`. | `src/modules/auth/routes.ts`<br/>`src/shared/middleware/auth.ts` |
| **A02: Cryptographic Failures** | Eavesdropping on clinical diagnoses, exposed cleartext tokens | • AES-256-GCM encryption with authenticated 128-bit tags for symptoms and doctor diagnoses.<br/>• TLS 1.3 enforced at ALB.<br/>• Bcrypt (12 salt rounds) for passwords. | `src/shared/security/encryption.ts` |
| **A03: Injection** | SQL injection, NoSQL injection, or command injection | • Prisma ORM uses parameterized queries exclusively for all SQL interactions.<br/>• Zero raw string concatenation.<br/>• Zod schema validation strips unknown fields. | `src/shared/middleware/validation.ts` |
| **A04: Insecure Design** | Double-booking race conditions, replay of financial transactions | • Distributed Idempotency engine (`idempotency_keys` table with SHA-256 request payload hashing and 24h TTL).<br/>• Row-level locks (`SELECT FOR UPDATE`). | `src/shared/middleware/idempotency.ts` |
| **A05: Security Misconfiguration** | Default credentials, debug endpoints exposed in production | • Strict Zod environment parser prevents server boot if any secret is missing or default.<br/>• Stack traces stripped in production error handler. | `src/config/index.ts`<br/>`src/shared/middleware/errorHandler.ts` |
| **A06: Vulnerable & Outdated Components** | Known CVEs in npm dependencies | • Automated Dependabot security updates.<br/>• CI workflow runs `npm audit` and vulnerability scanning. | `.github/workflows/ci.yml` |
| **A07: Identification & Auth Failures** | Brute force, credential stuffing, session hijacking | • Speakeasy RFC 6238 TOTP Multi-Factor Authentication.<br/>• 15-minute access token lifespan.<br/>• 7-day rotating refresh tokens with instant replay invalidation. | `src/modules/auth/service.ts` |
| **A08: Software & Data Integrity Failures** | Tampering with Razorpay webhook payloads | • HMAC-SHA256 signature verification on payment callbacks using webhook secrets.<br/>• Signed package builds. | `src/modules/payments/routes.ts` |
| **A09: Security Logging & Monitoring Failures** | Undetected intrusion, lack of forensics trail | • Structured JSON logging with trace IDs (`X-Trace-Id`).<br/>• Immutable database audit logging on all auth and mutation events. | `src/shared/observability/logger.ts`<br/>`prisma/schema.prisma` |
| **A10: Server-Side Request Forgery (SSRF)** | Fetching malicious URLs via avatar or webhook inputs | • Strict URL whitelist validation on image uploads and external webhook targets. | `src/modules/auth/validation.ts` |

---

## 2. STRIDE Threat Model & Attack Surface Analysis

```
                              [ Internet Ingress ]
                                       │
                Threat: Spoofing (Forged Identity)
                Threat: Denial of Service (Traffic Flood)
                                       │
                                       ▼
                             ┌───────────────────┐
                             │ Rate Limiter (WAF)│
                             └─────────┬─────────┘
                                       │
            Threat: Tampering (Manipulated Request Payload)
            Threat: Elevation of Privilege (Admin Claim Forgery)
                                       │
                                       ▼
                             ┌───────────────────┐
                             │ JWT + TOTP Engine │
                             └─────────┬─────────┘
                                       │
       Threat: Repudiation (Denied Consultation / Payment)
       Threat: Information Disclosure (Cleartext Diagnosis Leak)
                                       │
                                       ▼
                             ┌───────────────────┐
                             │ AES-256 Data Gate │
                             └───────────────────┘
```

### STRIDE Assessment:
1. **Spoofing (Identity):**
   - *Risk:* Attacker impersonates an Ayurvedic doctor or patient.
   - *Defense:* Asymmetric/secret-bound JWT access tokens + RFC 6238 TOTP MFA. Stored password hashes use Bcrypt with work factor 12.
2. **Tampering (Integrity):**
   - *Risk:* Modifying consultation fees, prescription dosages, or idempotency keys.
   - *Defense:* SHA-256 hash validation of request payload matched with stored idempotency key; HMAC-SHA256 verification on webhooks.
3. **Repudiation:**
   - *Risk:* User denies booking a consultation or paying fees.
   - *Defense:* Immutable audit trail capturing user UUID, IP address, user-agent, timestamp, and pre/post JSON states.
4. **Information Disclosure (Confidentiality):**
   - *Risk:* Database dump reveals patient medical history and Prakriti analysis.
   - *Defense:* AES-256-GCM authenticated encryption at rest for sensitive clinical fields. DB columns store base64-encoded IV + ciphertext + authentication tag.
5. **Denial of Service (Availability):**
   - *Risk:* API flooding on `/api/doctors` or `/api/auth/login`.
   - *Defense:* Atomic Redis sliding-window rate limiting (100 req / 15 min default; strict 5 req / min on `/login`).
6. **Elevation of Privilege:**
   - *Risk:* Registering as an ADMIN to access platform financial metrics.
   - *Defense:* Server-side schema sanitization forcefully demoting client-submitted ADMIN role to PATIENT.

---

## 3. Data Classification & Privacy Policy

| Data Class | Examples | Storage Standard | In-Transit Standard | Access Restriction |
|---|---|---|---|---|
| **Class 1: Public** | Doctor name, specialty, bio, rating, consultation fee | Plaintext in PostgreSQL | TLS 1.3 | Public (`GET /api/doctors`) |
| **Class 2: Confidential** | Email, phone, billing history, audit logs | Plaintext in PostgreSQL (Protected DB) | TLS 1.3 | Authenticated Owner + Admin |
| **Class 3: PHI (Protected Health Information)** | Symptoms, diagnosis, clinical notes, prescriptions | **AES-256-GCM Encrypted** at application layer | TLS 1.3 | Consulting Doctor + Patient only |
| **Class 4: Secrets** | Password hashes, JWT secrets, TOTP secrets, DB credentials | Bcrypt hash / Environment variables / HSM | In-Memory only | Never returned in API response |

---

## 4. Cryptographic Design & Key Management

### Encryption at Rest Specification:
- **Algorithm:** Advanced Encryption Standard (AES) in Galois/Counter Mode (GCM).
- **Key Length:** 256 bits (32 bytes).
- **Initialization Vector (IV):** 128-bit cryptographically secure random bytes generated per write using `crypto.randomBytes(16)`.
- **Authentication Tag:** 128-bit GCM authentication tag preventing ciphertext tampering.
- **Serialized Format:** `iv:authTag:encryptedData` (hex/base64 encoded string).

### Password Hashing Specification:
- **Algorithm:** Bcrypt.
- **Cost Factor:** 12 rounds (~250ms computation time on modern hardware).
- **Entropy Requirement:** Enforced minimum 8 characters with lowercase, uppercase, number, and special character.

---

## 5. Cryptographic Key Rotation Procedure

To maintain continuous operations without downtime during scheduled 90-day key rotations or emergency breach scenarios:

### Dual-Key Envelope Model:
```
Current Key Version: V2 (Active for Writes)
Previous Key Version: V1 (Active for Reads only)
```

1. **Phase 1 (Key Deployment):**
   - Introduce `ENCRYPTION_KEY_V2` alongside `ENCRYPTION_KEY_V1` in the configuration.
   - Server prefixes all new encryptions with key ID: `v2:iv:tag:data`.
2. **Phase 2 (Lazy Migration):**
   - When a consultation record is read, the system checks the key prefix. If `v1`, it decrypts with `ENCRYPTION_KEY_V1` and queues an async re-encryption with `ENCRYPTION_KEY_V2`.
3. **Phase 3 (Batch Migration & Deprecation):**
   - Run background worker script `npm run security:re-encrypt` to migrate remaining dormant records.
   - Verify 0 records reference `v1`. Decommission `ENCRYPTION_KEY_V1`.

---

## 6. Immutable Audit Logging Architecture

Every security-sensitive event emits an immutable audit log record to the `audit_logs` table:

```typescript
await prisma.auditLog.create({
  data: {
    userId: req.user.id,
    action: 'CONSULTATION_STATUS_CHANGED',
    resourceType: 'consultations',
    resourceId: consultation.id,
    oldValues: { status: 'SCHEDULED' },
    newValues: { status: 'COMPLETED' },
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
  }
});
```

- **Write-Once Enforcement:** PostgreSQL database user privileges in production restrict the application role from executing `UPDATE` or `DELETE` on the `audit_logs` table (`GRANT INSERT, SELECT ON audit_logs TO api_user`).
- **Retention Policy:** Minimum 7-year regulatory retention with automated monthly partition export to AWS S3 Glacier with Object Lock (WORM - Write Once, Read Many).

---

## 7. Dependency Scanning & Vulnerability Management

- **Automated CI Scanning:** Every push and PR triggers `npm audit --audit-level=high` in `.github/workflows/ci.yml`.
- **Static Application Security Testing (SAST):** CodeQL automated scanning integrated into GitHub repository.
- **Secret Scanning:** Pre-commit hooks (`git-secrets`) and GitHub push protection prevent `.env` or credential leakage.

---

## 8. Production Pre-Flight Security Checklist

- [x] All `.env` secrets populated with high-entropy cryptographic strings.
- [x] Zero hardcoded secrets present in Git repository.
- [x] Zod environment validator blocks deployment on missing variables.
- [x] Self-registration privilege escalation blocked (`ADMIN` role sanitized).
- [x] AES-256-GCM clinical notes encryption verified by automated unit tests.
- [x] Distributed idempotency engine tested against concurrent double-booking race conditions.
- [x] Speakeasy TOTP Multi-Factor Authentication active with QR generation.
- [x] Helmet security headers active (CSP, HSTS, X-Content-Type-Options).
- [x] Pino JSON structured logs omit passwords, tokens, and decrypted medical text.
- [x] Prometheus metrics endpoint operational without leaking sensitive PII.
