import { prisma } from '../../shared/database/index';
import { AppError } from '../../shared/middleware/errorHandler';

export class AdminService {
  static async getAnalytics(period: 'day' | 'week' | 'month' = 'month') {
    const now = new Date();
    let startDate = new Date(now);
    if (period === 'day') startDate.setDate(now.getDate() - 1);
    else if (period === 'week') startDate.setDate(now.getDate() - 7);
    else startDate.setMonth(now.getMonth() - 1);

    const [totalConsultations, completedConsultations, totalUsers, totalDoctors, totalPayments, revenue] =
      await Promise.all([
        prisma.consultation.count({ where: { createdAt: { gte: startDate } } }),
        prisma.consultation.count({ where: { status: 'COMPLETED', createdAt: { gte: startDate } } }),
        prisma.user.count(),
        prisma.doctor.count(),
        prisma.payment.count({ where: { status: 'COMPLETED', createdAt: { gte: startDate } } }),
        prisma.payment.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: startDate } },
          _sum: { amount: true },
        }),
      ]);

    const consultationsByStatus = await prisma.consultation.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: { status: true },
    });

    return {
      period,
      totalConsultations,
      completedConsultations,
      totalUsers,
      totalDoctors,
      totalPayments,
      revenue: revenue._sum.amount || 0,
      consultationsByStatus: consultationsByStatus.map((c: any) => ({ status: c.status, count: c._count.status })),
    };
  }

  static async listUsers(filters: { role?: string; page: number; limit: number }) {
    const { role, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: { id: true, email: true, role: true, isActive: true, emailVerified: true, mfaEnabled: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async toggleUserStatus(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    const updated = await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
    return updated;
  }

  static async getAuditLogs(filters: { action?: string; userId?: string; resourceType?: string; page: number; limit: number }) {
    const { action, userId, resourceType, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (resourceType) where.resourceType = resourceType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
