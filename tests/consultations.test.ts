import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/shared/database';
import { registerAndLogin, createDoctorProfile, createSlot, slotTimes, bookConsultation } from './helpers';

describe('Consultation lifecycle & booking concurrency', () => {
  test('patient books a slot; double-booking is rejected; cancel releases the slot', async () => {
    const patient = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken);
    const slot = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(24));

    const booked = await bookConsultation(patient.accessToken, doctor.id, slot.id);
    expect(booked.status).toBe('SCHEDULED');
    expect(booked.doctorId).toBe(doctor.id);

    const slotAfter = await prisma.availabilitySlot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(slotAfter.isBooked).toBe(true);

    // Same slot again → 409
    const second = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${patient.accessToken}`)
      .set('Idempotency-Key', `second-${Date.now()}`)
      .send({ doctorId: doctor.id, slotId: slot.id, type: 'VIDEO' });
    expect(second.status).toBe(409);

    // Cancel releases the slot
    const cancel = await request(app)
      .patch(`/api/consultations/${booked.id}`)
      .set('Authorization', `Bearer ${patient.accessToken}`)
      .send({ status: 'CANCELLED' });
    expect(cancel.status).toBe(200);

    const slotReleased = await prisma.availabilitySlot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(slotReleased.isBooked).toBe(false);
  });

  test('concurrent bookings of the same slot: exactly one succeeds', async () => {
    const p1 = await registerAndLogin();
    const p2 = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken);
    const slot = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(30));

    const [a, b] = await Promise.all([
      request(app).post('/api/consultations')
        .set('Authorization', `Bearer ${p1.accessToken}`)
        .set('Idempotency-Key', `race-a-${Date.now()}`)
        .send({ doctorId: doctor.id, slotId: slot.id, type: 'VIDEO' }),
      request(app).post('/api/consultations')
        .set('Authorization', `Bearer ${p2.accessToken}`)
        .set('Idempotency-Key', `race-b-${Date.now()}`)
        .send({ doctorId: doctor.id, slotId: slot.id, type: 'VIDEO' }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
  });

  test('doctor sees only own consultations; patient sees only own', async () => {
    const patientA = await registerAndLogin();
    const patientB = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken);
    const slotA = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(40));
    const slotB = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(44));
    await bookConsultation(patientA.accessToken, doctor.id, slotA.id);
    const forB = await bookConsultation(patientB.accessToken, doctor.id, slotB.id);

    const doctorList = await request(app).get('/api/consultations').set('Authorization', `Bearer ${doctorUser.accessToken}`);
    expect(doctorList.status).toBe(200);
    expect(doctorList.body.data.consultations).toHaveLength(2);

    const patientBList = await request(app).get('/api/consultations').set('Authorization', `Bearer ${patientB.accessToken}`);
    expect(patientBList.body.data.consultations.map((c: { id: string }) => c.id)).toEqual([forB.id]);

    const patientAList = await request(app).get('/api/consultations').set('Authorization', `Bearer ${patientA.accessToken}`);
    expect(patientAList.body.data.consultations).toHaveLength(1);
  });

  test('status machine: SCHEDULED -> COMPLETED is rejected, diagnosis is doctor-only', async () => {
    const patient = await registerAndLogin();
    const doctorUser = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(doctorUser.accessToken);
    const slot = await createSlot(doctorUser.accessToken, doctor.id, slotTimes(50));
    const consultation = await bookConsultation(patient.accessToken, doctor.id, slot.id);

    const skip = await request(app)
      .patch(`/api/consultations/${consultation.id}`)
      .set('Authorization', `Bearer ${doctorUser.accessToken}`)
      .send({ status: 'COMPLETED' });
    expect(skip.status).toBe(409);

    const patientDiagnosis = await request(app)
      .patch(`/api/consultations/${consultation.id}`)
      .set('Authorization', `Bearer ${patient.accessToken}`)
      .send({ diagnosis: 'self diagnosed' });
    expect(patientDiagnosis.status).toBe(403);

    const start = await request(app)
      .patch(`/api/consultations/${consultation.id}`)
      .set('Authorization', `Bearer ${doctorUser.accessToken}`)
      .send({ status: 'IN_PROGRESS', diagnosis: 'Vitamin D deficiency' });
    expect(start.status).toBe(200);
    expect(start.body.data.startedAt).toBeDefined();

    const complete = await request(app)
      .patch(`/api/consultations/${consultation.id}`)
      .set('Authorization', `Bearer ${doctorUser.accessToken}`)
      .send({ status: 'COMPLETED' });
    expect(complete.status).toBe(200);
    expect(complete.body.data.endedAt).toBeDefined();
  });

  test('booking a slot belonging to another doctor is rejected', async () => {
    const patient = await registerAndLogin();
    const doctorA = await registerAndLogin({ role: 'DOCTOR' });
    const profileA = await createDoctorProfile(doctorA.accessToken);
    const slotA = await createSlot(doctorA.accessToken, profileA.id, slotTimes(60));

    const doctorB = await registerAndLogin({ role: 'DOCTOR' });
    const profileB = await createDoctorProfile(doctorB.accessToken);

    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${patient.accessToken}`)
      .set('Idempotency-Key', `cross-${Date.now()}`)
      .send({ doctorId: profileB.id, slotId: slotA.id, type: 'VIDEO' });
    expect(res.status).toBe(400);
  });
});
