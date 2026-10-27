import { Router } from 'express';
import { DoctorController } from './controller';
import { authenticate, authorize, optionalAuthenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import { idempotency } from '../../shared/middleware/idempotency';
import {
  createDoctorSchema,
  updateDoctorSchema,
  listDoctorsSchema,
  createSlotSchema,
  listSlotsSchema,
} from './validation';

const router = Router();

// Doctor profile management (DOCTOR role)
router.post('/profile', authenticate, authorize('DOCTOR'), idempotency, validate(createDoctorSchema), DoctorController.createDoctor);
router.get('/profile', authenticate, authorize('DOCTOR'), DoctorController.getMyProfile);
router.put('/profile', authenticate, authorize('DOCTOR'), validate(updateDoctorSchema), DoctorController.updateMyProfile);

// Search & listing (public directory with optional user context for role-based views)
router.get('/', optionalAuthenticate, validate(listDoctorsSchema), DoctorController.listDoctors);

// Availability slots (DOCTOR manages own slots, public may view available slots)
router.post('/:id/slots', authenticate, authorize('DOCTOR'), validate(createSlotSchema), DoctorController.createAvailabilitySlot);
router.get('/:id/slots', optionalAuthenticate, validate(listSlotsSchema), DoctorController.listAvailabilitySlots);

// Doctor detail — registered after /profile so the literal route wins
router.get('/:id', optionalAuthenticate, DoctorController.getDoctor);

export default router;
