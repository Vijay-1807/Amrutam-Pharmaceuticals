import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/shared/database';
import { registerAndLogin, createDoctorProfile, createSlot, slotTimes, bookConsultation, grantAdmin } from './helpers';

describe('Payments', () => {
  test('patient pays server-side doctor fee; admin completes; doctor cannot change status', async () => {
    const patient = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken, { consultationFee: 750 });
    const slot = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(80));
    const consultation = await bookConsultation(patient.accessToken, doctor.id, slot.id);

    const created = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${patient.accessToken}`)
      .set('Idempotency-Key', `pay-${Date.now()}`)
      .send({ consultationId: consultation.id });
    expect(created.status).toBe(201);
    expect(Number(created.body.data.amount)).toBe(750);

    const duplicate = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${patient.accessToken}`)
      .set('Idempotency-Key', `pay2-${Date.now()}`)
      .send({ consultationId: consultation.id });
    expect(duplicate.status).toBe(409);

    // Doctor cannot mark payment completed
    const doctorTry = await request(app)
      .patch(`/api/payments/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${doctorUser.accessToken}`)
      .send({ status: 'COMPLETED', transactionId: 'txn-1' });
    expect(doctorTry.status).toBe(403);

    const admin = await registerAndLogin();
    await grantAdmin(admin.userId);
    const adminLogin = await request(app).post('/api/auth/login').send({ email: admin.email, password: admin.password });
    const adminToken = adminLogin.body.data.accessToken;

    // Missing transactionId rejected
    const noTxn = await request(app)
      .patch(`/api/payments/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COMPLETED' });
    expect(noTxn.status).toBe(400);

    const complete = await request(app)
      .patch(`/api/payments/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COMPLETED', transactionId: `txn-${Date.now()}` });
    expect(complete.status).toBe(200);
    expect(complete.body.data.status).toBe('COMPLETED');
    expect(complete.body.data.paidAt).toBeDefined();

    // Invalid transition: COMPLETED -> COMPLETED
    const again = await request(app)
      .patch(`/api/payments/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COMPLETED', transactionId: 'txn-x' });
    expect(again.status).toBe(409);
  });

  test('patients cannot see or pay for other patients consultations/payments', async () => {
    const patientA = await registerAndLogin();
    const patientB = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken);
    const slot = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(90));
    const consultation = await bookConsultation(patientA.accessToken, doctor.id, slot.id);

    const pay = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${patientA.accessToken}`)
      .set('Idempotency-Key', `payA-${Date.now()}`)
      .send({ consultationId: consultation.id });
    expect(pay.status).toBe(201);

    const bPays = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${patientB.accessToken}`)
      .set('Idempotency-Key', `payB-${Date.now()}`)
      .send({ consultationId: consultation.id });
    expect(bPays.status).toBe(403);

    const bPeek = await request(app)
      .get(`/api/payments/${pay.body.data.id}`)
      .set('Authorization', `Bearer ${patientB.accessToken}`);
    expect(bPeek.status).toBe(403);

    const bList = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${patientB.accessToken}`);
    expect(bList.body.data.payments).toHaveLength(0);
  });
});
