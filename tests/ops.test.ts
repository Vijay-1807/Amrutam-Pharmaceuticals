import request from 'supertest';
import { app } from '../src/app';

describe('Operational endpoints', () => {
  test('health endpoint responds ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('telemedicine-backend');
  });

  test('readiness probe checks the database', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.checks.database).toBe('ok');
  });

  test('metrics endpoint exposes Prometheus format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
  });

  test('unknown routes return 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  test('protected route rejects missing/invalid tokens', async () => {
    const none = await request(app).get('/api/consultations');
    expect(none.status).toBe(401);

    const bad = await request(app).get('/api/consultations').set('Authorization', 'Bearer garbage');
    expect(bad.status).toBe(401);
  });
});
