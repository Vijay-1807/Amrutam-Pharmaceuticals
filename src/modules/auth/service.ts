import crypto from 'crypto';
import { prisma } from '../../shared/database/index';
import { hashPassword, verifyPassword } from '../../shared/security/encryption';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index';
import { AuditLogger } from '../../shared/observability/logger';
import speakeasy from 'speakeasy';
import { AppError } from '../../shared/middleware/errorHandler';

const JWT_ACCESS_SECRET = config.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = config.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = config.JWT_ACCESS_EXPIRY;
const REFRESH_EXPIRY = config.JWT_REFRESH_EXPIRY;

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateTokens(userId: string, email: string, role: string) {
  const accessToken = jwt.sign({ userId, email, role }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY as any,
  });
  const refreshToken = jwt.sign(
    { userId, type: 'refresh', jti: crypto.randomUUID() },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRY as any,
    },
  );
  return { accessToken, refreshToken };
}

async function persistRefreshToken(userId: string, refreshToken: string) {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  // Only one active refresh token per user; replace on each login.
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await prisma.refreshToken.create({
    data: { userId, tokenHash: sha256(refreshToken), expiresAt },
  });
}

async function revokeRefreshToken(userId: string | undefined, refreshToken?: string) {
  if (!userId) return;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { userId, tokenHash: sha256(refreshToken) } });
  } else {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
}

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }) {
    // Self-registration is limited to PATIENT/DOCTOR; ADMIN is provisioned by an existing admin.
    const role = data.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          role,
        },
      });
      await tx.profile.create({
        data: {
          userId: created.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      });
      return created;
    });

    await AuditLogger.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user.id,
      newValues: { email: user.email, role },
    });

    const tokens = generateTokens(user.id, user.email, user.role);
    await persistRefreshToken(user.id, tokens.refreshToken);

    await AuditLogger.log({
      userId: user.id,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      newValues: { email: user.email, method: 'REGISTRATION' },
    });

    return tokens;
  }

  static async login(data: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user || !verifyPassword(data.password, user.passwordHash)) {
      // Same error for unknown email and bad password (no user enumeration)
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    if (user.mfaEnabled) {
      // Issue short-lived MFA challenge token; full tokens only after TOTP verification.
      const mfaToken = jwt.sign({ userId: user.id, purpose: 'mfa_challenge' }, JWT_ACCESS_SECRET, {
        expiresIn: '5m',
      });
      await AuditLogger.log({
        userId: user.id,
        action: 'USER_LOGIN_MFA_CHALLENGE',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
      return { mfaRequired: true as const, mfaToken };
    }

    const tokens = generateTokens(user.id, user.email, user.role);
    await persistRefreshToken(user.id, tokens.refreshToken);

    await AuditLogger.log({
      userId: user.id,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return {
      mfaRequired: false as const,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  static async verifyLoginMFA(mfaToken: string, totp: string, ipAddress?: string, userAgent?: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(mfaToken, JWT_ACCESS_SECRET);
    } catch {
      throw new AppError('Invalid or expired MFA challenge', 401);
    }
    if (decoded.purpose !== 'mfa_challenge') throw new AppError('Invalid MFA challenge', 401);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) throw new AppError('MFA not enabled', 400);

    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: totp,
      window: 1,
    });
    if (!valid) throw new AppError('Invalid MFA token', 401);

    const tokens = generateTokens(user.id, user.email, user.role);
    await persistRefreshToken(user.id, tokens.refreshToken);

    await AuditLogger.log({
      userId: user.id,
      action: 'USER_LOGIN_MFA_VERIFIED',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  static async refreshToken(refreshToken: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
    });

    if (!existing || existing.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Rotate refresh token (reuse of the old token fails because it was deleted)
    await prisma.refreshToken.delete({ where: { tokenHash: sha256(refreshToken) } });
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email, user.role);
    await persistRefreshToken(user.id, newRefreshToken);

    await AuditLogger.log({
      userId: user.id,
      action: 'TOKEN_REFRESHED',
      resourceType: 'User',
      resourceId: user.id,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken: string) {
    // Decode (not verify) to find the owner so logout works even with an expired access token.
    const decoded = jwt.decode(refreshToken) as { userId?: string } | null;
    await revokeRefreshToken(decoded?.userId, refreshToken);
    await AuditLogger.log({
      userId: decoded?.userId,
      action: 'USER_LOGOUT',
      resourceType: 'User',
      resourceId: decoded?.userId,
    });
    return { message: 'Logged out successfully' };
  }

  static async setupMFA(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const secret = speakeasy.generateSecret({
      name: `${config.MFA_ISSUER} (${user.email})`,
      issuer: config.MFA_ISSUER,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32, mfaEnabled: false },
    });

    await AuditLogger.log({
      userId,
      action: 'MFA_SETUP',
      resourceType: 'User',
      resourceId: userId,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  static async verifyMFA({ userId, token }: { userId: string; token: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) throw new AppError('MFA not set up', 400);

    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!valid) throw new AppError('Invalid MFA token', 401);

    await AuditLogger.log({
      userId,
      action: 'MFA_VERIFIED',
      resourceType: 'User',
      resourceId: userId,
    });

    return { valid: true };
  }

  static async enableMFA({ userId, token }: { userId: string; token: string }) {
    await this.verifyMFA({ userId, token });

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    await AuditLogger.log({
      userId,
      action: 'MFA_ENABLED',
      resourceType: 'User',
      resourceId: userId,
    });

    return { message: 'MFA enabled successfully' };
  }

  static async disableMFA(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaEnabled) throw new AppError('MFA not enabled', 400);
    // Require a valid TOTP to disable MFA (prevents session-hijack downgrade)
    await this.verifyMFA({ userId, token });

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    await AuditLogger.log({
      userId,
      action: 'MFA_DISABLED',
      resourceType: 'User',
      resourceId: userId,
    });

    return { message: 'MFA disabled successfully' };
  }

  static async changePassword({
    userId,
    currentPassword,
    newPassword,
  }: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new AppError('Current password is incorrect', 401);
    }

    const passwordHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens
    await revokeRefreshToken(userId);

    await AuditLogger.log({
      userId,
      action: 'PASSWORD_CHANGED',
      resourceType: 'User',
      resourceId: userId,
    });

    return { message: 'Password changed successfully' };
  }
}
