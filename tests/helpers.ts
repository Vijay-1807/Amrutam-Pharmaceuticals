import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/shared/database';

let counter = 0;
export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@example.com`;
}

export const api = () => request(app);

export async function registerAndLogin(opts: {
  role?: 'PATIENT' | 'DOCTOR';
  email?: string;
  password?: string;
} = {}) {
  const email = opts.email ?? uniqueEmail(opts.role === 'DOCTOR' ? 'doc' : 'pat');
  const password = opts.password ?? 'Sup3rSecret!pass';
  const res = await api()
    .post('/api/auth/register')
    .send({
      email,
      password,
      firstName: 'Test',
      lastName: 'User',
      role: opts.role ?? 'PATIENT',
    });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  const { accessToken, refreshToken } = res.body.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return { email, password, accessToken, refreshToken, userId: user.id };
}

export async function createDoctorProfile(accessToken: string, overrides: Record<string, unknown> = {}) {
  const res = await api()
    .post('/api/doctors/profile')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      licenseNumber: `LIC-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      specialty: 'General Medicine',
      experienceYears: 5,
      consultationFee: 500,
      languages: ['English', 'Hindi'],
      ...overrides,
    });
  if (res.status !== 201) throw new Error(`doctor profile failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data as { id: string; userId: string };
}

export function slotTimes(hoursAhead = 24, durationHours = 1) {
  const start = new Date(Date.now() + hoursAhead * 3600 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + durationHours * 3600 * 1000);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

export async function createSlot(accessToken: string, doctorId: string, times: { startTime: string; endTime: string }) {
  const res = await api()
    .post(`/api/doctors/${doctorId}/slots`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(times);
  if (res.status !== 201) throw new Error(`slot failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data as { id: string; startTime: string };
}

export async function bookConsultation(patientToken: string, doctorId: string, slotId?: string) {
  const res = await api()
    .post('/api/consultations')
    .set('Authorization', `Bearer ${patientToken}`)
    .set('Idempotency-Key', `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    .send({ doctorId, slotId, type: 'VIDEO' });
  if (res.status !== 201) throw new Error(`booking failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data as { id: string; status: string; doctorId: string; patientId?: string };
}

export async function grantAdmin(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
}
