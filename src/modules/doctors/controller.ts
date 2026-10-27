import { Response } from 'express';
import { DoctorService } from './service';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';

export class DoctorController {
  static createDoctor = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DoctorService.createDoctor(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Doctor profile created', data: result });
  });

  static getMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.doctorProfileId) throw new AppError('Doctor profile not found', 404);
    const result = await DoctorService.getDoctor(req.user.doctorProfileId);
    res.json({ success: true, data: result });
  });

  static updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.doctorProfileId) throw new AppError('Doctor profile not found', 404);
    // Doctors cannot self-verify; isVerified is admin-only.
    const { isVerified, isActive, ...data } = req.body;
    const result = await DoctorService.updateDoctor(req.user.doctorProfileId, data);
    res.json({ success: true, message: 'Doctor profile updated', data: result });
  });

  static listDoctors = asyncHandler(async (req: AuthRequest, res: Response) => {
    const isAdmin = req.user?.role === 'ADMIN';
    const result = await DoctorService.searchDoctors({
      specialty: req.query.specialty as string | undefined,
      search: req.query.search as string | undefined,
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      maxFee: req.query.maxFee ? Number(req.query.maxFee) : undefined,
      languages: req.query.languages ? String(req.query.languages).split(',') : undefined,
      availabilityDate: req.query.availabilityDate as string | undefined,
      isActive: isAdmin && req.query.isActive !== undefined
        ? req.query.isActive === 'true'
        : true,
      isVerified: isAdmin && req.query.isVerified !== undefined
        ? req.query.isVerified === 'true'
        : true,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: (req.query.sortBy as string) || 'rating',
    });
    res.json({ success: true, data: result });
  });

  static getDoctor = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DoctorService.getDoctor(req.params.id);
    res.json({ success: true, data: result });
  });

  static createAvailabilitySlot = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Doctors may only manage their own slots.
    if (req.params.id !== req.user?.doctorProfileId) {
      throw new AppError('Forbidden: cannot manage another doctor slots', 403);
    }
    const result = await DoctorService.createAvailabilitySlot(req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Availability slot created', data: result });
  });

  static listAvailabilitySlots = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DoctorService.listAvailabilitySlots(
      req.params.id,
      req.query.from ? new Date(String(req.query.from)) : undefined,
      req.query.to ? new Date(String(req.query.to)) : undefined,
    );
    res.json({ success: true, data: result });
  });
}
