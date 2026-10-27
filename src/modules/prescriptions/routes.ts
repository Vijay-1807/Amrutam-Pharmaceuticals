import { Router } from 'express';
import { PrescriptionController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import { idempotency } from '../../shared/middleware/idempotency';
import {
  createPrescriptionSchema,
  listPrescriptionsSchema,
} from './validation';

const router = Router();

router.post('/', authenticate, authorize('DOCTOR'), idempotency, validate(createPrescriptionSchema), PrescriptionController.createPrescription);
router.get('/', authenticate, validate(listPrescriptionsSchema), PrescriptionController.listPrescriptions);
router.get('/:id', authenticate, PrescriptionController.getPrescription);

export default router;
