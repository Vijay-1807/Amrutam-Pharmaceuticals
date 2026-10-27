import { prisma } from '../../shared/database/index';
import { AppError } from '../../shared/middleware/errorHandler';
import { AuditLogger } from '../../shared/observability/logger';
import { PaymentStatus } from '@prisma/client';
import { errorsTotal } from '../../shared/observability/metrics';

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['COMPLETED', 'FAILED'],
  COMPLETED: ['REFUNDED'],
  FAILED: ['PENDING'],
  REFUNDED: [],
};

export class PaymentService {
  static async createPayment(userId: string, data: { consultationId: string }) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: data.consultationId },
      include: { doctor: { select: { id: true, consultationFee: true } } },
    });
    if (!consultation) throw new AppError('Consultation not found', 404);
    // Only the booked patient pays, and at the doctor's configured fee (server-side pricing).
    if (consultation.patientId !== userId) throw new AppError('Forbidden: not your consultation', 403);
    if (consultation.status === 'CANCELLED') throw new AppError('Consultation is cancelled', 409);

    const existing = await prisma.payment.findFirst({
      where: { consultationId: data.consultationId, status: { in: ['PENDING', 'COMPLETED'] } },
    });
    if (existing) throw new AppError('Payment already exists for this consultation', 409);

    const payment = await prisma.payment.create({
      data: {
        consultationId: data.consultationId,
        userId,
        amount: consultation.doctor.consultationFee,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    await AuditLogger.log({
      userId,
      action: 'PAYMENT_CREATED',
      resourceType: 'Payment',
      resourceId: payment.id,
      newValues: { consultationId: data.consultationId, amount: payment.amount },
    });

    return payment;
  }

  static async updatePaymentStatus(paymentId: string, data: { status: string; transactionId?: string }, actorId: string, actorRole: string) {
    // Terminal state changes are money movement — admin/gateway only, not doctors.
    if (actorRole !== 'ADMIN') throw new AppError('Forbidden: only admin can update payment status', 403);

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError('Payment not found', 404);

    if (!PAYMENT_TRANSITIONS[payment.status].includes(data.status as PaymentStatus)) {
      errorsTotal.inc({ type: 'payment_transition', route: 'payments' });
      throw new AppError(`Invalid payment transition ${payment.status} -> ${data.status}`, 409);
    }

    if (data.status === 'COMPLETED' && !data.transactionId) {
      throw new AppError('transactionId required to mark a payment COMPLETED', 400);
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: data.status as PaymentStatus,
        ...(data.transactionId !== undefined && { transactionId: data.transactionId }),
        ...(data.status === 'COMPLETED' && { paidAt: new Date() }),
      },
    });

    await AuditLogger.log({
      userId: actorId,
      action: 'PAYMENT_STATUS_UPDATED',
      resourceType: 'Payment',
      resourceId: paymentId,
      oldValues: { status: payment.status },
      newValues: data,
    });

    return updated;
  }

  static async listPayments(filters: { consultationId?: string; userId?: string; status?: string; page: number; limit: number }) {
    const { consultationId, userId, status, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (consultationId) where.consultationId = consultationId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          consultation: { select: { id: true, status: true, patientId: true, doctorId: true } },
          user: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getPayment(paymentId: string, userId: string, role: string, doctorProfileId?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        consultation: { select: { id: true, patientId: true, doctorId: true } },
        user: { select: { id: true, email: true } },
      },
    });
    if (!payment) throw new AppError('Payment not found', 404);

    if (role === 'PATIENT' && payment.userId !== userId) throw new AppError('Forbidden', 403);
    if (role === 'DOCTOR' && payment.consultation.doctorId !== doctorProfileId) throw new AppError('Forbidden', 403);

    return payment;
  }
}
