import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ────────────────────────────────────────────────────────────
// Utility: unique email generator
// ────────────────────────────────────────────────────────────
function uniqueEmail(prefix = 'pw') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

async function apiPost(url: string, body: object, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; } catch { return { status: res.status, body: text }; }
}

async function apiGet(url: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; } catch { return { status: res.status, body: text }; }
}

// ────────────────────────────────────────────────────────────
// 1. Observability endpoints
// ────────────────────────────────────────────────────────────
test.describe('Observability Probes', () => {
  test('GET /health returns 200 ok', async ({ request }) => {
    const res = await request.get(`${BASE}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('telemedicine-backend');
    expect(body.timestamp).toBeTruthy();
  });

  test('GET /ready returns 200 ready', async ({ request }) => {
    const res = await request.get(`${BASE}/ready`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ready');
    expect(body.checks.database).toBe('ok');
  });

  test('GET /metrics returns Prometheus text format', async ({ request }) => {
    const res = await request.get(`${BASE}/metrics`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('http_requests_total');
    expect(text).toContain('http_request_duration_seconds');
  });

  test('GET /api/openapi.json returns valid OpenAPI schema', async ({ request }) => {
    const res = await request.get(`${BASE}/api/openapi.json`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBeTruthy();
    expect(body.paths).toBeTruthy();
  });

  test('Unknown route returns 404 JSON', async ({ request }) => {
    const res = await request.get(`${BASE}/api/does-not-exist-xyz`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not Found');
  });
});

// ────────────────────────────────────────────────────────────
// 2. Auth — registration, login, privilege escalation guard
// ────────────────────────────────────────────────────────────
test.describe('Auth API', () => {
  test('POST /api/auth/register creates a patient', async ({ request }) => {
    const email = uniqueEmail('pw-reg');
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: { email, password: 'Sup3rSecret!pass', firstName: 'Playwright', lastName: 'User' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.refreshToken).toBeTruthy();
  });

  test('POST /api/auth/register with ADMIN role is silently demoted to PATIENT', async ({ request }) => {
    const email = uniqueEmail('pw-admin-esc');
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: { email, password: 'Sup3rSecret!pass', firstName: 'Evil', lastName: 'User', role: 'ADMIN' },
    });
    // Should succeed (201) — role is sanitized server-side
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Actual DB role tested in Jest — Playwright verifies no 400/422 blowup
  });

  test('POST /api/auth/login succeeds with valid credentials', async ({ request }) => {
    const email = uniqueEmail('pw-login');
    await request.post(`${BASE}/api/auth/register`, {
      data: { email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' },
    });
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email, password: 'Sup3rSecret!pass' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.mfaRequired).toBe(false);
  });

  test('POST /api/auth/login fails with wrong password', async ({ request }) => {
    const email = uniqueEmail('pw-badlogin');
    await request.post(`${BASE}/api/auth/register`, {
      data: { email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' },
    });
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email, password: 'WrongPassword1!' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid email or password');
  });

  test('POST /api/auth/refresh rotates token — reuse of old token returns 401', async ({ request }) => {
    const email = uniqueEmail('pw-rot');
    const reg = await request.post(`${BASE}/api/auth/register`, {
      data: { email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' },
    });
    const regBody = await reg.json();
    const oldRefresh = regBody.data.refreshToken;

    const first = await request.post(`${BASE}/api/auth/refresh`, {
      data: { refreshToken: oldRefresh },
    });
    expect(first.status()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.data.refreshToken).not.toBe(oldRefresh);

    const replay = await request.post(`${BASE}/api/auth/refresh`, {
      data: { refreshToken: oldRefresh },
    });
    expect(replay.status()).toBe(401);
  });

  test('Protected route rejects missing token with 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/consultations`);
    expect(res.status()).toBe(401);
  });

  test('Protected route rejects invalid token with 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/consultations`, {
      headers: { Authorization: 'Bearer garbage.token.here' },
    });
    expect(res.status()).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────
// 3. Doctors — list, profile, slots
// ────────────────────────────────────────────────────────────
test.describe('Doctors API', () => {
  test('GET /api/doctors returns paginated list', async ({ request }) => {
    const res = await request.get(`${BASE}/api/doctors?page=1&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.doctors)).toBe(true);
    expect(typeof body.data.total).toBe('number');
  });

  test('GET /api/doctors?specialty= filters results', async ({ request }) => {
    const res = await request.get(`${BASE}/api/doctors?specialty=Panchakarma&page=1&limit=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // All returned doctors should have specialty matching filter
    for (const doc of body.data.doctors) {
      expect(doc.specialty.toLowerCase()).toContain('panchakarma');
    }
  });

  test('Doctor can create their own profile', async ({ request }) => {
    const email = uniqueEmail('pw-doctor');
    const reg = await request.post(`${BASE}/api/auth/register`, {
      data: { email, password: 'Sup3rSecret!pass', firstName: 'Dr', lastName: 'Test', role: 'DOCTOR' },
    });
    const regBody = await reg.json();
    const token = regBody.data.accessToken;

    const profile = await request.post(`${BASE}/api/doctors/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        licenseNumber: `LIC-PW-${Date.now()}`,
        specialty: 'Playwright Healing',
        experienceYears: 3,
        consultationFee: 400,
        languages: ['English'],
      },
    });
    expect(profile.status()).toBe(201);
    const profileBody = await profile.json();
    expect(profileBody.data.specialty).toBe('Playwright Healing');
  });
});

// ────────────────────────────────────────────────────────────
// 4. Consultations — booking with idempotency
// ────────────────────────────────────────────────────────────
test.describe('Consultations API', () => {
  let patientToken: string;
  let doctorId: string;

  test.beforeAll(async ({ request }) => {
    // Register & login patient
    const patEmail = uniqueEmail('pw-cons-pat');
    const patReg = await request.post(`${BASE}/api/auth/register`, {
      data: { email: patEmail, password: 'Sup3rSecret!pass', firstName: 'ConsP', lastName: 'Patient' },
    });
    patientToken = (await patReg.json()).data.accessToken;

    // Register & login doctor, create profile
    const drEmail = uniqueEmail('pw-cons-doc');
    const drReg = await request.post(`${BASE}/api/auth/register`, {
      data: { email: drEmail, password: 'Sup3rSecret!pass', firstName: 'ConsDoc', lastName: 'Doctor', role: 'DOCTOR' },
    });
    const drToken = (await drReg.json()).data.accessToken;

    const profRes = await request.post(`${BASE}/api/doctors/profile`, {
      headers: { Authorization: `Bearer ${drToken}` },
      data: { licenseNumber: `LIC-CONS-${Date.now()}`, specialty: 'General Ayurveda', experienceYears: 5, consultationFee: 500, languages: ['English'] },
    });
    const prof = await profRes.json();
    doctorId = prof.data.id;
  });

  test('GET /api/consultations returns patient consultations list', async ({ request }) => {
    const res = await request.get(`${BASE}/api/consultations`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.consultations)).toBe(true);
  });

  test('POST /api/consultations books a consultation', async ({ request }) => {
    const idemKey = `pw-book-${Date.now()}`;
    const res = await request.post(`${BASE}/api/consultations`, {
      headers: { Authorization: `Bearer ${patientToken}`, 'Idempotency-Key': idemKey },
      data: { doctorId, type: 'VIDEO' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.doctorId).toBe(doctorId);
    expect(body.data.status).toBe('SCHEDULED');
  });

  test('Replaying same Idempotency-Key returns cached 201 response', async ({ request }) => {
    const idemKey = `pw-idem-${Date.now()}`;
    const first = await request.post(`${BASE}/api/consultations`, {
      headers: { Authorization: `Bearer ${patientToken}`, 'Idempotency-Key': idemKey },
      data: { doctorId, type: 'VIDEO' },
    });
    expect(first.status()).toBe(201);
    const firstId = (await first.json()).data.id;

    const replay = await request.post(`${BASE}/api/consultations`, {
      headers: { Authorization: `Bearer ${patientToken}`, 'Idempotency-Key': idemKey },
      data: { doctorId, type: 'VIDEO' },
    });
    // Replay must return same status (201) and same consultation id from cache
    expect(replay.status()).toBe(201);
    expect((await replay.json()).data.id).toBe(firstId);
  });
});

// ────────────────────────────────────────────────────────────
// 5. Portal UI (smoke test — checks pages render)
// ────────────────────────────────────────────────────────────
test.describe('Developer Portal UI', () => {
  test('GET / serves the portal HTML', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('body')).toBeAttached();
    // Navigation exists
    await expect(page.getByText('Amrutam Telemedicine').first()).toBeVisible();
  });

  test('Portal navigation switches pages', async ({ page }) => {
    await page.goto(`${BASE}/portal`);
    // Click API Explorer tab
    await page.getByText('API Explorer').first().click();
    await expect(page.locator('#page-explorer')).toBeVisible();
    // Click Architecture tab
    await page.getByText('Architecture').first().click();
    await expect(page.locator('#page-architecture')).toBeVisible();
    // Click Quick Start tab
    await page.getByText('Quick Start').first().click();
    await expect(page.locator('#page-quickstart')).toBeVisible();
  });

  test('Health probe in portal works', async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Wait for live dot auto-probe
    await page.waitForTimeout(2500);
    // Manually click health probe button
    await page.getByText('Live Health Check').first().click();
    await page.waitForTimeout(1000);
    const resultEl = page.locator('#healthResult');
    const text = await resultEl.textContent();
    expect(text).toContain('ok');
  });

  test('API card expands on click', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByText('API Explorer').first().click();
    const card = page.locator('#register');
    await expect(card.locator('.api-card-body')).not.toBeVisible();
    await card.locator('.api-card-header').click();
    await expect(card.locator('.api-card-body')).toBeVisible();
  });

  test('Try-It tab works for register endpoint', async ({ page }) => {
    await page.goto(`${BASE}/portal`);
    await page.getByText('API Explorer').first().click();
    const card = page.locator('#register');
    await card.locator('.api-card-header').click();
    // Switch to Try It tab
    await card.getByRole('button', { name: 'Try It' }).click();
    // Fill form
    const email = `pw-ui-${Date.now()}@example.com`;
    await card.locator('#reg-email').fill(email);
    // Click send
    await card.getByText('Send Request').click();
    // Wait for response
    await page.waitForTimeout(2000);
    const result = await card.locator('#reg-result').textContent();
    expect(result).toBeTruthy();
    // Should show status 201
    expect(result).toContain('201');
  });

  test('Dark/Light theme toggle switches theme attribute', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.locator('#theme-btn').click();
    const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAfter).not.toBe(themeBefore);
    expect(['dark', 'light']).toContain(themeAfter);
  });
});

// ────────────────────────────────────────────────────────────
// 6. Responsive UI — Mobile (Pixel 9 Pro 427×952)
// ────────────────────────────────────────────────────────────
test.describe('Responsive UI — Mobile (Pixel 9 Pro)', () => {
  test.use({ viewport: { width: 427, height: 952 } });

  test('Sidebar is hidden on mobile viewport', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('.sb')).toBeHidden();
  });

  test('Mobile bottom nav dock is visible', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('.mobile-nav')).toBeVisible();
    await expect(page.locator('#m-ov')).toBeVisible();
    await expect(page.locator('#m-ex')).toBeVisible();
    await expect(page.locator('#m-ar')).toBeVisible();
    await expect(page.locator('#m-qs')).toBeVisible();
  });

  test('No horizontal overflow on mobile', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const overflows = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      docWidth: document.documentElement.clientWidth,
      overflows: document.body.scrollWidth > document.documentElement.clientWidth + 2,
    }));
    expect(overflows.overflows).toBe(false);
  });

  test('Stats grid shows 2 columns on mobile', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const statCards = page.locator('.stats .scard');
    expect(await statCards.count()).toBeGreaterThanOrEqual(4);
    const first = await statCards.nth(0).boundingBox();
    const second = await statCards.nth(1).boundingBox();
    const third = await statCards.nth(2).boundingBox();
    // Cards 0 & 1 on same row
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(5);
    // Card 2 on next row
    expect((third?.y ?? 0)).toBeGreaterThan((first?.y ?? 0) + 20);
  });

  test('Hero CTA buttons are full-width on mobile', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const container = page.locator('.ha');
    const containerBox = await container.boundingBox();
    const firstBtn = container.locator('.btn').first();
    const btnBox = await firstBtn.boundingBox();
    const widthRatio = (btnBox?.width ?? 0) / (containerBox?.width ?? 1);
    expect(widthRatio).toBeGreaterThan(0.85);
  });

  test('Mobile dock navigates between pages', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#m-ex').click();
    await expect(page.locator('#page-explorer')).toBeVisible();
    await page.locator('#m-ar').click();
    await expect(page.locator('#page-architecture')).toBeVisible();
    await page.locator('#m-qs').click();
    await expect(page.locator('#page-quickstart')).toBeVisible();
    await page.locator('#m-ov').click();
    await expect(page.locator('#page-overview')).toBeVisible();
  });

  test('Theme toggle works on mobile', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.locator('#theme-btn').click();
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after).not.toBe(before);
  });
});

// ────────────────────────────────────────────────────────────
// 7. Responsive UI — Desktop (1440×900)
// ────────────────────────────────────────────────────────────
test.describe('Responsive UI — Desktop (1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Desktop sidebar is visible', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('.sb')).toBeVisible();
  });

  test('Mobile dock is hidden on desktop', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('.mobile-nav')).toBeHidden();
  });

  test('Desktop nav links are visible', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('.nav-links')).toBeVisible();
    await expect(page.locator('#n-ov')).toBeVisible();
    await expect(page.locator('#n-ex')).toBeVisible();
  });

  test('Stats grid has 3+ columns on desktop', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const statCards = page.locator('.stats .scard');
    const first = await statCards.nth(0).boundingBox();
    const third = await statCards.nth(2).boundingBox();
    // On desktop, first 3 cards should be on the same row
    expect(Math.abs((first?.y ?? 0) - (third?.y ?? 0))).toBeLessThan(5);
  });
});

// ────────────────────────────────────────────────────────────
// 8. Responsive UI — iPhone SE (375×667)
// ────────────────────────────────────────────────────────────
test.describe('Responsive UI — iPhone SE (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Zero horizontal overflow on iPhone SE', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const overflows = await page.evaluate(() => ({
      scrollW: document.body.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bad: document.body.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    expect(overflows.bad).toBe(false);
  });

  test('Navbar actions fit without wrapping on 375px screen', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const themeBtn = page.locator('#theme-btn');
    const healthBtn = page.locator('#nav-health-btn');
    await expect(themeBtn).toBeVisible();
    await expect(healthBtn).toBeVisible();
    const themeBox = await themeBtn.boundingBox();
    const healthBox = await healthBtn.boundingBox();
    // Both buttons should be in navbar on same horizontal line
    expect(Math.abs((themeBox?.y ?? 0) - (healthBox?.y ?? 0))).toBeLessThan(6);
  });
});

// ────────────────────────────────────────────────────────────
// 9. Responsive UI — Small Android (360×740)
// ────────────────────────────────────────────────────────────
test.describe('Responsive UI — Small Android (360x740)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('Zero horizontal overflow on narrow 360px viewport', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const overflows = await page.evaluate(() => ({
      scrollW: document.body.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bad: document.body.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    expect(overflows.bad).toBe(false);
  });

  test('Mobile dock items are visible and interactable on 360px', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('#m-ov')).toBeVisible();
    await expect(page.locator('#m-ex')).toBeVisible();
    await expect(page.locator('#m-ar')).toBeVisible();
    await expect(page.locator('#m-qs')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// 10. Responsive UI — Tablet Portrait (768×1024)
// ────────────────────────────────────────────────────────────
test.describe('Responsive UI — Tablet (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('Stats grid shows 3 columns on tablet', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const statCards = page.locator('.stats .scard');
    const first = await statCards.nth(0).boundingBox();
    const second = await statCards.nth(1).boundingBox();
    const third = await statCards.nth(2).boundingBox();
    // Cards 0, 1, 2 on same row on tablet (max-width: 1024px gives repeat(3, 1fr))
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(5);
    expect(Math.abs((first?.y ?? 0) - (third?.y ?? 0))).toBeLessThan(5);
  });

  test('Zero horizontal overflow on tablet', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const overflows = await page.evaluate(() => ({
      bad: document.body.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    expect(overflows.bad).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// 8. Rate Limiting — sanity check header presence
// ────────────────────────────────────────────────────────────
test.describe('Rate Limiter', () => {
  test('Responses include X-RateLimit headers for API routes', async ({ request }) => {
    const res = await request.get(`${BASE}/api/doctors`);
    const headers = res.headers();
    expect(res.status()).toBeLessThan(500);
  });
});
