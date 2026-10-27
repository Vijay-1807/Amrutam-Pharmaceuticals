import { Router } from 'express';
import { AuthController } from './controller';
import { authenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import {
  registerSchema,
  loginSchema,
  loginMfaSchema,
  refreshSchema,
  mfaVerifySchema,
  mfaEnableSchema,
  mfaDisableSchema,
  changePasswordSchema,
} from './validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/login/mfa', validate(loginMfaSchema), AuthController.loginMfa);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.post('/logout', validate(refreshSchema), AuthController.logout);

// Protected routes
router.use(authenticate);

router.post('/mfa/setup', AuthController.setupMFA);
router.post('/mfa/verify', validate(mfaVerifySchema), AuthController.verifyMFA);
router.post('/mfa/enable', validate(mfaEnableSchema), AuthController.enableMFA);
router.post('/mfa/disable', validate(mfaDisableSchema), AuthController.disableMFA);
router.post('/change-password', validate(changePasswordSchema), AuthController.changePassword);

export default router;
