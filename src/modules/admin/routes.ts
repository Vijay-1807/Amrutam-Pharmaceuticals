import { Router } from 'express';
import { AdminController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import { analyticsSchema, listUsersSchema } from './validation';

const router = Router();

// Admin only
router.get('/analytics', authenticate, authorize('ADMIN'), validate(analyticsSchema), AdminController.getAnalytics);
router.get('/users', authenticate, authorize('ADMIN'), validate(listUsersSchema), AdminController.listUsers);
router.patch('/users/:id/status', authenticate, authorize('ADMIN'), AdminController.toggleUserStatus);
router.get('/audit-logs', authenticate, authorize('ADMIN'), AdminController.getAuditLogs);

export default router;
