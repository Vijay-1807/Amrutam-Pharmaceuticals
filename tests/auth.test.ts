import { api, uniqueEmail } from './helpers';
import { prisma } from '../src/shared/database';
import speakeasy from 'speakeasy';

describe('Auth & user lifecycle', () => {
  test('registers a patient and returns tokens', async () => {
    const email = uniqueEmail('reg');
    const res = await api()
      .post('/api/auth/register')
      .send({ email, password: 'Sup3rSecret!pass', firstName: 'Asha', lastName: 'Rao', role: 'PATIENT' });

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.role).toBe('PATIENT');
    const profile = await prisma.profile.findUnique({ where: { userId: user!.id } });
    expect(profile?.firstName).toBe('Asha');
  });

  test('cannot self-assign ADMIN role (privilege escalation blocked)', async () => {
    const email = uniqueEmail('evil');
    const res = await api()
      .post('/api/auth/register')
      .send({ email, password: 'Sup3rSecret!pass', firstName: 'Evil', lastName: 'User', role: 'ADMIN' });

    expect(res.status).toBe(201);
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.role).toBe('PATIENT');
  });

  test('rejects duplicate email', async () => {
    const email = uniqueEmail('dup');
    await api().post('/api/auth/register').send({ email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' });
    const res = await api().post('/api/auth/register').send({ email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' });
    expect(res.status).toBe(409);
  });

  test('rejects weak input via validation', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short', firstName: '', lastName: 'B' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  test('login success and wrong password share the same error (no user enumeration)', async () => {
    const email = uniqueEmail('login');
    await api().post('/api/auth/register').send({ email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' });

    const bad = await api().post('/api/auth/login').send({ email, password: 'WrongPassword1!' });
    expect(bad.status).toBe(401);
    expect(bad.body.error).toBe('Invalid email or password');

    const unknown = await api().post('/api/auth/login').send({ email: 'ghost@example.com', password: 'Whatever1!' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toBe('Invalid email or password');

    const good = await api().post('/api/auth/login').send({ email, password: 'Sup3rSecret!pass' });
    expect(good.status).toBe(200);
    expect(good.body.data.accessToken).toBeDefined();
  });

  test('refresh token rotation: reuse of old token fails', async () => {
    const email = uniqueEmail('rot');
    const reg = await api().post('/api/auth/register').send({ email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' });
    const oldRefresh = reg.body.data.refreshToken;

    const first = await api().post('/api/auth/refresh').send({ refreshToken: oldRefresh });
    expect(first.status).toBe(200);
    expect(first.body.data.refreshToken).not.toBe(oldRefresh);

    const replay = await api().post('/api/auth/refresh').send({ refreshToken: oldRefresh });
    expect(replay.status).toBe(401);
  });

  test('MFA lifecycle: setup, enable, login challenge, verify', async () => {
    const email = uniqueEmail('mfa');
    const reg = await api().post('/api/auth/register').send({ email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' });
    const token = reg.body.data.accessToken;

    const setup = await api().post('/api/auth/mfa/setup').set('Authorization', `Bearer ${token}`).send();
    expect(setup.status).toBe(200);
    const secret: string = setup.body.data.secret;

    const code = speakeasy.totp({ secret, encoding: 'base32' });
    const enable = await api().post('/api/auth/mfa/enable').set('Authorization', `Bearer ${token}`).send({ token: code });
    expect(enable.status).toBe(200);

    const login = await api().post('/api/auth/login').send({ email, password: 'Sup3rSecret!pass' });
    expect(login.status).toBe(200);
    expect(login.body.data.mfaRequired).toBe(true);
    expect(login.body.data.mfaToken).toBeDefined();
    expect(login.body.data.accessToken).toBeUndefined();

    const totp = speakeasy.totp({ secret, encoding: 'base32' });
    const verify = await api().post('/api/auth/login/mfa').send({ mfaToken: login.body.data.mfaToken, token: totp });
    expect(verify.status).toBe(200);
    expect(verify.body.data.accessToken).toBeDefined();
  });

  test('change password invalidates existing refresh tokens', async () => {
    const email = uniqueEmail('pw');
    const reg = await api().post('/api/auth/register').send({ email, password: 'Sup3rSecret!pass', firstName: 'A', lastName: 'B' });
    const { accessToken, refreshToken } = reg.body.data;

    const wrongPw = await api().post('/api/auth/change-password').set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'nope', newPassword: 'Sup3rSecret!pass2' });
    expect(wrongPw.status).toBe(401);

    const change = await api().post('/api/auth/change-password').set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'Sup3rSecret!pass', newPassword: 'Sup3rSecret!pass2' });
    expect(change.status).toBe(200);

    const replay = await api().post('/api/auth/refresh').send({ refreshToken });
    expect(replay.status).toBe(401);
  });
});
