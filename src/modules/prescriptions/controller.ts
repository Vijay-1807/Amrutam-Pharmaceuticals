import { Response } from 'express';
import { PrescriptionService } from './service';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { AuthRequest } from '../../shared/middleware/auth';

export class PrescriptionController {
  static createPrescription = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.doctorProfileId) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    const result = await PrescriptionService.createPrescription(req.user.doctorProfileId, req.body);
    res.status(201).json({ success: true, message: 'Prescription created', data: result });
  });

  static listPrescriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const result = await PrescriptionService.listPrescriptions(
      {
        consultationId: req.query.consultationId as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      },
      user.id,
      user.role,
      user.doctorProfileId,
    );
    res.json({ success: true, data: result });
  });

  static getPrescription = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const result = await PrescriptionService.getPrescription(req.params.id, user.id, user.role, user.doctorProfileId);
    res.json({ success: true, data: result });
  });
}
