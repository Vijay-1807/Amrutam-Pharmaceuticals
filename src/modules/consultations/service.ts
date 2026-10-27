import { prisma } from '../../shared/database/index';
import { AppError } from '../../shared/middleware/errorHandler';
import { AuditLogger } from '../../shared/observability/logger';
import { ConsultationStatus } from '@prisma/client';
import { consultationsTotal, bookingsTotal } from '../../shared/observability/metrics';

const VALID_TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export class ConsultationService {
  static async bookConsultation(patientId: string, data: {
    doctorId: string;
    slotId?: string;
    type?: string;
    symptoms?: string;
  }) {
    const doctor = await prisma.doctor.findUnique({ where: { id: data.doctorId } });
    if (!doctor || !doctor.isActive) throw new AppError('Doctor not found or inactive', 404);

    // Transaction makes the slot claim + consultation creation atomic; the conditional
    // update (isBooked: false) prevents double-booking races between concurrent requests.
    const consultation = await prisma.$transaction(async (tx) => {
      if (data.slotId) {
        const slot = await tx.availabilitySlot.findUnique({ where: { id: data.slotId } });
        if (!slot || slot.doctorId !== data.doctorId) throw new AppError('Invalid slot for this doctor', 400);

        const claimed = await tx.availabilitySlot.updateMany({
          where: { id: data.slotId, isBooked: false },
          data: { isBooked: true },
        });
        if (claimed.count === 0) throw new AppError('Slot already booked', 409);
      }

      return tx.consultation.create({
        data: {
          patientId,
          doctorId: data.doctorId,
          slotId: data.slotId ?? null,
          status: 'SCHEDULED',
          type: (data.type as any) || 'VIDEO',
          symptoms: data.symptoms,
        },
        include: {
          doctor: { select: { id: true, specialty: true, consultationFee: true } },
        },
      });
    });

    bookingsTotal.inc({ type: consultation.type });
    consultationsTotal.inc({ status: 'SCHEDULED' });

    await AuditLogger.log({
      userId: patientId,
      action: 'CONSULTATION_BOOKED',
      resourceType: 'Consultation',
      resourceId: consultation.id,
      newValues: { doctorId: data.doctorId, slotId: data.slotId, type: consultation.type },
    });

    return consultation;
  }

  static async listConsultations(filters: { status?: string; doctorId?: string; patientId?: string; page: number; limit: number }) {
    const { status, doctorId, patientId, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        include: {
          doctor: { select: { id: true, specialty: true } },
          patient: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.consultation.count({ where }),
    ]);

    return { consultations, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getConsultation(consultationId: string, userId: string, role: string, doctorProfileId?: string) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        doctor: { select: { id: true, specialty: true, user: { select: { id: true, email: true } } } },
        patient: { select: { id: true, email: true } },
        prescriptions: true,
        payments: true,
      },
    });
    if (!consultation) throw new AppError('Consultation not found', 404);

    if (role === 'PATIENT' && consultation.patientId !== userId) throw new AppError('Forbidden', 403);
    if (role === 'DOCTOR' && consultation.doctorId !== doctorProfileId) throw new AppError('Forbidden', 403);

    return consultation;
  }

  static async updateConsultation(consultationId: string, userId: string, role: string, data: {
    status?: string;
    diagnosis?: string;
    notes?: string;
    symptoms?: string;
  }, doctorProfileId?: string) {
    const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!consultation) throw new AppError('Consultation not found', 404);

    // Only the assigned patient or doctor may modify; clinical fields are doctor-only.
    if (role === 'PATIENT' && consultation.patientId !== userId) throw new AppError('Forbidden', 403);
    if (role === 'DOCTOR' && consultation.doctorId !== doctorProfileId) throw new AppError('Forbidden', 403);
    if (role === 'PATIENT' && (data.diagnosis !== undefined || data.notes !== undefined)) {
      throw new AppError('Patients cannot set diagnosis or notes', 403);
    }

    if (data.status) {
      if (!VALID_TRANSITIONS[consultation.status].includes(data.status as ConsultationStatus)) {
        throw new AppError(`Invalid status transition ${consultation.status} -> ${data.status}`, 409);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.consultation.update({
        where: { id: consultationId },
        data: {
          ...(data.status !== undefined && { status: data.status as ConsultationStatus }),
          ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.symptoms !== undefined && { symptoms: data.symptoms }),
          ...(data.status === 'IN_PROGRESS' && { startedAt: new Date() }),
          ...(data.status === 'COMPLETED' && { endedAt: new Date() }),
        },
      });

      // Release the slot when a consultation is cancelled or missed.
      if (data.status === 'CANCELLED' || data.status === 'NO_SHOW') {
        if (consultation.slotId) {
          await tx.availabilitySlot.updateMany({
            where: { id: consultation.slotId, consultation: { id: consultationId } },
            data: { isBooked: false },
          });
        }
      }
      return result;
    });

    consultationsTotal.inc({ status: updated.status });

    await AuditLogger.log({
      userId,
      action: 'CONSULTATION_UPDATED',
      resourceType: 'Consultation',
      resourceId: consultationId,
      oldValues: { status: consultation.status },
      newValues: data,
    });

    return updated;
  }
}
