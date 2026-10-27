import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/shared/database';
import { registerAndLogin, createDoctorProfile, createSlot, slotTimes } from './helpers';

describe('Doctors: profiles, availability, search', () => {
  test('patient cannot create a doctor profile (RBAC)', async () => {
    const { accessToken } = await registerAndLogin({ role: 'PATIENT' });
    const res = await request(app)
      .post('/api/doctors/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ licenseNumber: 'LIC-X', specialty: 'Derm', experienceYears: 1, consultationFee: 100 });
    expect(res.status).toBe(403);
  });

  test('doctor creates profile and manages slots; overlap and past slots rejected', async () => {
    const { accessToken } = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(accessToken);

    const times = slotTimes(48);
    const slot = await createSlot(accessToken, doctor.id, times);
    expect(slot.id).toBeDefined();

    // Overlapping window rejected
    const overlap = await request(app)
      .post(`/api/doctors/${doctor.id}/slots`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(slotTimes(48, 2));
    expect(overlap.status).toBe(409);

    // Past slot rejected
    const past = await request(app)
      .post(`/api/doctors/${doctor.id}/slots`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ startTime: new Date(Date.now() - 3600_000).toISOString(), endTime: new Date(Date.now() - 1800_000).toISOString() });
    expect(past.status).toBe(400);

    // Another doctor cannot create slots on someone else's profile
    const other = await registerAndLogin({ role: 'DOCTOR' });
    await createDoctorProfile(other.accessToken);
    const hijack = await request(app)
      .post(`/api/doctors/${doctor.id}/slots`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .send(slotTimes(96));
    expect(hijack.status).toBe(403);
  });

  test('search & filter by specialty, rating, fee, and availability date', async () => {
    const { accessToken } = await registerAndLogin({ role: 'DOCTOR' });
    await createDoctorProfile(accessToken, { specialty: 'Cardiology', consultationFee: 900, experienceYears: 12 });
    const doctor = await prisma.doctor.findFirstOrThrow({ where: { specialty: 'Cardiology' } });
    await prisma.doctor.update({ where: { id: doctor.id }, data: { isVerified: true, rating: 4.5 } });
    await createSlot(accessToken, doctor.id, slotTimes(72));

    const bySpecialty = await request(app)
      .get('/api/doctors?specialty=cardio')
      .set('Authorization', `Bearer ${await registerAndLogin().then((u) => u.accessToken)}`);
    expect(bySpecialty.status).toBe(200);
    const ids = bySpecialty.body.data.doctors.map((d: { id: string }) => d.id);
    expect(ids).toContain(doctor.id);

    const byAvailability = await request(app)
      .get(`/api/doctors?availabilityDate=${new Date(Date.now() + 72 * 3600_000).toISOString().slice(0, 10)}`)
      .set('Authorization', `Bearer ${await registerAndLogin().then((u) => u.accessToken)}`);
    expect(byAvailability.status).toBe(200);
    const availIds = byAvailability.body.data.doctors.map((d: { id: string }) => d.id);
    expect(availIds).toContain(doctor.id);

    const byFee = await request(app)
      .get('/api/doctors?maxFee=100&specialty=Cardiology')
      .set('Authorization', `Bearer ${await registerAndLogin().then((u) => u.accessToken)}`);
    expect(byFee.status).toBe(200);
    expect(byFee.body.data.doctors.map((d: { id: string }) => d.id)).not.toContain(doctor.id);
  });

  test('unverified doctor hidden from public listing', async () => {
    const { accessToken } = await registerAndLogin({ role: 'DOCTOR' });
    const doctor = await createDoctorProfile(accessToken, { specialty: 'Neurology' });

    const { accessToken: patientToken } = await registerAndLogin();
    const res = await request(app)
      .get('/api/doctors?specialty=Neurology')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.body.data.doctors.map((d: { id: string }) => d.id)).not.toContain(doctor.id);
  });

  test('doctor cannot be created with duplicate license', async () => {
    const license = `LIC-DUP-${Date.now()}`;
    const a = await registerAndLogin({ role: 'DOCTOR' });
    await createDoctorProfile(a.accessToken, { licenseNumber: license });
    const b = await registerAndLogin({ role: 'DOCTOR' });
    const res = await request(app)
      .post('/api/doctors/profile')
      .set('Authorization', `Bearer ${b.accessToken}`)
      .send({ licenseNumber: license, specialty: 'X', experienceYears: 1, consultationFee: 100 });
    expect(res.status).toBe(409);
  });
});
