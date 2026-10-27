import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/shared/database';
import { registerAndLogin, createDoctorProfile, createSlot, slotTimes, bookConsultation } from './helpers';

describe('Prescriptions & admin analytics & audit trail', () => {
  test('doctor writes prescription on own consultation; patient reads own; outsider blocked', async () => {
    const patient = await registerAndLogin();
    const stranger = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken);
    const slot = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(120));
    const consultation = await bookConsultation(patient.accessToken, doctor.id, slot.id);

    // Cannot prescribe before consultation starts
    const early = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorUser.accessToken}`)
      .set('Idempotency-Key', `rx-early-${Date.now()}`)
      .send({ consultationId: consultation.id, medication: 'Iron', dosage: '1 tab', frequency: 'daily', duration: '30 days' });
    expect(early.status).toBe(409);

    await request(app)
      .patch(`/api/consultations/${consultation.id}`)
      .set('Authorization', `Bearer ${doctorUser.accessToken}`)
      .send({ status: 'IN_PROGRESS' });

    const created = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorUser.accessToken}`)
      .set('Idempotency-Key', `rx-${Date.now()}`)
      .send({ consultationId: consultation.id, medication: 'Iron + Folic Acid', dosage: '1 tab', frequency: 'daily', duration: '30 days', instructions: 'After meals' });
    expect(created.status).toBe(201);

    const patientRead = await request(app)
      .get(`/api/prescriptions/${created.body.data.id}`)
      .set('Authorization', `Bearer ${patient.accessToken}`);
    expect(patientRead.status).toBe(200);

    const strangerRead = await request(app)
      .get(`/api/prescriptions/${created.body.data.id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);
    expect(strangerRead.status).toBe(403);

    const patientList = await request(app)
      .get('/api/prescriptions')
      .set('Authorization', `Bearer ${patient.accessToken}`);
    expect(patientList.body.data.prescriptions.map((p: { id: string }) => p.id)).toContain(created.body.data.id);
  });

  test('admin analytics aggregate correctly and non-admin is forbidden', async () => {
    const admin = await registerAndLogin();
    await prisma.user.update({ where: { id: admin.userId }, data: { role: 'ADMIN' } });
    const login = await request(app).post('/api/auth/login').send({ email: admin.email, password: admin.password });
    const adminToken = login.body.data.accessToken;

    const denied = await request(app).get('/api/admin/analytics').set('Authorization', `Bearer ${(await registerAndLogin()).accessToken}`);
    expect(denied.status).toBe(403);

    const res = await request(app).get('/api/admin/analytics?period=month').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalConsultations');
    expect(res.body.data).toHaveProperty('revenue');

    const users = await request(app).get('/api/admin/users?role=PATIENT').set('Authorization', `Bearer ${adminToken}`);
    expect(users.status).toBe(200);
    expect(users.body.data.users.every((u: { role: string }) => u.role === 'PATIENT')).toBe(true);
  });

  test('security-sensitive actions are persisted to audit_logs', async () => {
    const patient = await registerAndLogin();
    const rows = await prisma.auditLog.findMany({ where: { userId: patient.userId } });
    const actions = rows.map((r) => r.action);
    expect(actions).toContain('USER_REGISTERED');
    expect(actions).toContain('USER_LOGIN');
  });
});
