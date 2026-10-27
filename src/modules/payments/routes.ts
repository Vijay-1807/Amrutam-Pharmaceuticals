import { Router } from 'express';
import { PaymentController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import { idempotency } from '../../shared/middleware/idempotency';
import {
  createPaymentSchema,
  updatePaymentStatusSchema,
  listPaymentsSchema,
} from './validation';

const router = Router();

router.post('/', authenticate, authorize('PATIENT'), idempotency, validate(createPaymentSchema), PaymentController.createPayment);
router.patch('/:id/status', authenticate, authorize('ADMIN'), idempotency, validate(updatePaymentStatusSchema), PaymentController.updatePaymentStatus);
router.get('/', authenticate, validate(listPaymentsSchema), PaymentController.listPayments);
router.get('/:id', authenticate, PaymentController.getPayment);

export default router;
