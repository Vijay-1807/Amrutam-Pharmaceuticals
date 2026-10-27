import { prisma } from '../../shared/database/index';
import { AppError } from '../../shared/middleware/errorHandler';
import { AuditLogger } from '../../shared/observability/logger';

export class PrescriptionService {
  static async createPrescription(doctorProfileId: string, data: {
    consultationId: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }) {
    const consultation = await prisma.consultation.findUnique({ where: { id: data.consultationId } });
    if (!consultation) throw new AppError('Consultation not found', 404);
    if (consultation.doctorId !== doctorProfileId) throw new AppError('Forbidden: not your consultation', 403);
    if (!['IN_PROGRESS', 'COMPLETED'].includes(consultation.status)) {
      throw new AppError('Prescriptions can only be written during or after a consultation', 409);
    }

    const prescription = await prisma.prescription.create({
      data: {
        consultationId: data.consultationId,
        medication: data.medication,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration,
        instructions: data.instructions,
      },
    });

    await AuditLogger.log({
      action: 'PRESCRIPTION_CREATED',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      newValues: { consultationId: data.consultationId, medication: data.medication, doctorProfileId },
    });

    return prescription;
  }

  static async listPrescriptions(filters: {
    consultationId?: string;
    page: number;
    limit: number;
  }, userId: string, role: string, doctorProfileId?: string) {
    const { consultationId, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (consultationId) where.consultationId = consultationId;

    // Scope prescriptions to the requester's consultations.
    if (role === 'PATIENT') {
      where.consultation = { patientId: userId };
    } else if (role === 'DOCTOR') {
      where.consultation = { doctorId: doctorProfileId };
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        include: {
          consultation: { select: { id: true, status: true, patientId: true, doctorId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);

    return { prescriptions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getPrescription(prescriptionId: string, userId: string, role: string, doctorProfileId?: string) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        consultation: { select: { id: true, patientId: true, doctorId: true, status: true } },
      },
    });
    if (!prescription) throw new AppError('Prescription not found', 404);

    if (role === 'PATIENT' && prescription.consultation.patientId !== userId) throw new AppError('Forbidden', 403);
    if (role === 'DOCTOR' && prescription.consultation.doctorId !== doctorProfileId) throw new AppError('Forbidden', 403);

    return prescription;
  }
}
