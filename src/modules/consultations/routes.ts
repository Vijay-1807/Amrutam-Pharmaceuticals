import { Router } from 'express';
import { ConsultationController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import { idempotency } from '../../shared/middleware/idempotency';
import {
  bookConsultationSchema,
  updateConsultationSchema,
  listConsultationsSchema,
} from './validation';

const router = Router();

router.post('/', authenticate, authorize('PATIENT'), idempotency, validate(bookConsultationSchema), ConsultationController.bookConsultation);
router.get('/', authenticate, validate(listConsultationsSchema), ConsultationController.listConsultations);
router.get('/:id', authenticate, ConsultationController.getConsultation);
router.patch('/:id', authenticate, idempotency, validate(updateConsultationSchema), ConsultationController.updateConsultation);

export default router;
