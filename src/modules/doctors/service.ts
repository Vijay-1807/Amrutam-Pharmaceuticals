import { prisma } from '../../shared/database/index';
import { AppError } from '../../shared/middleware/errorHandler';
import { AuditLogger } from '../../shared/observability/logger';

export class DoctorService {
  static async createDoctor(userId: string, data: {
    licenseNumber: string;
    specialty: string;
    experienceYears: number;
    consultationFee: number;
    bio?: string;
    education?: string;
    languages?: string[];
  }) {
    const existingDoctor = await prisma.doctor.findUnique({ where: { userId } });
    if (existingDoctor) throw new AppError('Doctor profile already exists for this user', 409);

    const existingLicense = await prisma.doctor.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });
    if (existingLicense) throw new AppError('License number already registered', 409);

    const doctor = await prisma.doctor.create({
      data: {
        userId,
        licenseNumber: data.licenseNumber,
        specialty: data.specialty,
        experienceYears: data.experienceYears,
        consultationFee: data.consultationFee,
        bio: data.bio,
        education: data.education,
        languages: data.languages || [],
      },
    });

    await AuditLogger.log({
      userId,
      action: 'DOCTOR_PROFILE_CREATED',
      resourceType: 'Doctor',
      resourceId: doctor.id,
      newValues: { specialty: data.specialty, licenseNumber: data.licenseNumber },
    });

    return doctor;
  }

  static async searchDoctors(filters: {
    specialty?: string;
    search?: string;
    minRating?: number;
    maxFee?: number;
    languages?: string[];
    availabilityDate?: string;
    isActive: boolean;
    isVerified: boolean;
    page: number;
    limit: number;
    sortBy: string;
  }) {
    const { specialty, search, minRating, maxFee, languages, availabilityDate, isActive, isVerified, page, limit, sortBy } = filters;
    const skip = (page - 1) * Math.min(limit, 50);

    const where: any = { isActive, isVerified };
    if (specialty) where.specialty = { contains: specialty, mode: 'insensitive' };
    if (minRating !== undefined) where.rating = { gte: minRating };
    if (maxFee !== undefined) where.consultationFee = { lte: maxFee };
    if (languages && languages.length > 0) where.languages = { has: languages };
    if (search) {
      where.OR = [
        { specialty: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (availabilityDate) {
      const day = new Date(availabilityDate);
      if (isNaN(day.getTime())) throw new AppError('Invalid availabilityDate (use YYYY-MM-DD)', 400);
      const start = new Date(`${day.toISOString().slice(0, 10)}T00:00:00.000Z`);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      where.availabilitySlots = {
        some: { isBooked: false, startTime: { gte: start, lt: end } },
      };
    }

    const orderBy: any =
      sortBy === 'experience' ? { experienceYears: 'desc' }
        : sortBy === 'fee' ? { consultationFee: 'asc' }
          : { rating: 'desc' };

    const safeLimit = Math.min(limit, 50);

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: safeLimit,
        include: {
          user: { select: { id: true, email: true, isActive: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        },
        orderBy,
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  }

  static async getDoctor(doctorId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true, profile: true } },
        availabilitySlots: {
          where: { isBooked: false, startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 50,
        },
      },
    });
    if (!doctor) throw new AppError('Doctor not found', 404);
    return doctor;
  }

  static async updateDoctor(doctorId: string, data: any) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new AppError('Doctor not found', 404);

    // License number changes are admin-only (verification integrity).
    if (data.licenseNumber !== undefined) throw new AppError('License number can only be changed by an admin', 403);

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(data.specialty !== undefined && { specialty: data.specialty }),
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        ...(data.consultationFee !== undefined && { consultationFee: data.consultationFee }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.education !== undefined && { education: data.education }),
        ...(data.languages !== undefined && { languages: data.languages }),
      },
    });

    await AuditLogger.log({
      userId: doctor.userId,
      action: 'DOCTOR_PROFILE_UPDATED',
      resourceType: 'Doctor',
      resourceId: doctorId,
      newValues: data,
    });

    return updated;
  }

  static async createAvailabilitySlot(doctorId: string, data: {
    startTime: string;
    endTime: string;
    consultationType?: string;
    price?: number;
  }) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new AppError('Doctor not found', 404);

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) throw new AppError('Invalid date format', 400);
    if (endTime <= startTime) throw new AppError('End time must be after start time', 400);
    if (startTime < new Date()) throw new AppError('Slot start must be in the future', 400);

    // Prevent overlapping slots for the same doctor.
    const overlap = await prisma.availabilitySlot.count({
      where: {
        doctorId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (overlap > 0) throw new AppError('Slot overlaps an existing availability window', 409);

    const slot = await prisma.availabilitySlot.create({
      data: {
        doctorId,
        startTime,
        endTime,
        consultationType: (data.consultationType as any) || 'VIDEO',
        price: data.price,
      },
    });

    await AuditLogger.log({
      action: 'SLOT_CREATED',
      resourceType: 'AvailabilitySlot',
      resourceId: slot.id,
      newValues: { doctorId, startTime, endTime },
    });

    return slot;
  }

  static async listAvailabilitySlots(doctorId: string, from?: Date, to?: Date) {
    return prisma.availabilitySlot.findMany({
      where: {
        doctorId,
        isBooked: false,
        startTime: { gte: from ?? new Date(), ...(to && { lt: to }) },
      },
      orderBy: { startTime: 'asc' },
      take: 200,
    });
  }
}
