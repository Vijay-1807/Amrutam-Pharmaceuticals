import request from 'supertest';
import { app } from '../src/app';
import { registerAndLogin, createDoctorProfile, createSlot, slotTimes } from './helpers';

describe('Idempotency middleware', () => {
  test('same key + same body returns the stored response; different body is rejected', async () => {
    const patient = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken);
    const slotA = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(100));
    const slotB = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(104));

    const key = `idem-test-${Date.now()}`;
    const url = '/api/consultations';
    const auth = { Authorization: `Bearer ${patient.accessToken}` };

    const first = await request(app)
      .post(url).set(auth).set('Idempotency-Key', key)
      .send({ doctorId: doctor.id, slotId: slotA.id, type: 'VIDEO' });
    expect(first.status).toBe(201);

    // Exact replay: stored response, no new consultation
    const replay = await request(app)
      .post(url).set(auth).set('Idempotency-Key', key)
      .send({ doctorId: doctor.id, slotId: slotA.id, type: 'VIDEO' });
    expect(replay.status).toBe(201);
    expect(replay.body.data.id).toBe(first.body.data.id);

    // Same key, different body → 422
    const conflict = await request(app)
      .post(url).set(auth).set('Idempotency-Key', key)
      .send({ doctorId: doctor.id, slotId: slotB.id, type: 'VIDEO' });
    expect(conflict.status).toBe(422);

    // Different user, same key: separate scope → succeeds independently
    const other = await registerAndLogin();
    const otherReplay = await request(app)
      .post(url)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .set('Idempotency-Key', key)
      .send({ doctorId: doctor.id, slotId: slotB.id, type: 'VIDEO' });
    expect(otherReplay.status).toBe(201);
    expect(otherReplay.body.data.id).not.toBe(first.body.data.id);
  });

  test('no key header: request simply executes (no guarantee)', async () => {
    const patient = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken);

    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${patient.accessToken}`)
      .send({ doctorId: doctor.id, type: 'VIDEO' });
    expect(res.status).toBe(201);
  });
});
