import { Response } from 'express';
import { ConsultationService } from './service';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { AuthRequest } from '../../shared/middleware/auth';

export class ConsultationController {
  static bookConsultation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ConsultationService.bookConsultation(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Consultation booked', data: result });
  });

  static listConsultations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const filters = {
      status: req.query.status as string | undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      // Each role only ever sees its own side of the consultation.
      ...(user.role === 'PATIENT' && { patientId: user.id }),
      ...(user.role === 'DOCTOR' && { doctorId: user.doctorProfileId }),
      ...(user.role === 'ADMIN' && {
        doctorId: req.query.doctorId as string | undefined,
        patientId: req.query.patientId as string | undefined,
      }),
    };
    if (user.role === 'DOCTOR' && !filters.doctorId) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    const result = await ConsultationService.listConsultations(filters);
    res.json({ success: true, data: result });
  });

  static getConsultation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const result = await ConsultationService.getConsultation(req.params.id, user.id, user.role, user.doctorProfileId);
    res.json({ success: true, data: result });
  });

  static updateConsultation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const result = await ConsultationService.updateConsultation(
      req.params.id,
      user.id,
      user.role,
      req.body,
      user.doctorProfileId,
    );
    res.json({ success: true, message: 'Consultation updated', data: result });
  });
}
