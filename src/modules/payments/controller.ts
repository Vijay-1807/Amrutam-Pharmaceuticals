import { Response } from 'express';
import { PaymentService } from './service';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { AuthRequest } from '../../shared/middleware/auth';

export class PaymentController {
  static createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await PaymentService.createPayment(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Payment created', data: result });
  });

  static updatePaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await PaymentService.updatePaymentStatus(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role,
    );
    res.json({ success: true, message: 'Payment updated', data: result });
  });

  static listPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    // Non-admins can only list their own payments.
    const scopedUserId = user.role === 'ADMIN' ? (req.query.userId as string | undefined) : user.id;
    const result = await PaymentService.listPayments({
      consultationId: req.query.consultationId as string | undefined,
      userId: scopedUserId,
      status: req.query.status as string | undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    });
    res.json({ success: true, data: result });
  });

  static getPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const result = await PaymentService.getPayment(req.params.id, user.id, user.role, user.doctorProfileId);
    res.json({ success: true, data: result });
  });
}
