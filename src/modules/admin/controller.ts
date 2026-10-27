import { Request, Response, NextFunction } from 'express';
import { AdminService } from './service';
import { asyncHandler } from '../../shared/middleware/errorHandler';

export class AdminController {
  static getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const result = await AdminService.getAnalytics(req.query.period as any || 'month');
    res.json({ success: true, data: result });
  });

  static listUsers = asyncHandler(async (req: Request, res: Response) => {
    const result = await AdminService.listUsers({
      role: req.query.role as string | undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    });
    res.json({ success: true, data: result });
  });

  static toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const result = await AdminService.toggleUserStatus(req.params.id);
    res.json({ success: true, message: 'User status updated', data: result });
  });

  static getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const result = await AdminService.getAuditLogs({
      action: req.query.action as string | undefined,
      userId: req.query.userId as string | undefined,
      resourceType: req.query.resourceType as string | undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json({ success: true, data: result });
  });
}
