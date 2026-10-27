import { Response, NextFunction } from 'express';
import { AuthService } from './service';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { AuthRequest } from '../../shared/middleware/auth';

export class AuthController {
  static register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  });

  static login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.login({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({
      success: true,
      message: result.mfaRequired ? 'MFA verification required' : 'Login successful',
      data: result,
    });
  });

  static loginMfa = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { mfaToken, token } = req.body;
    const result = await AuthService.verifyLoginMFA(mfaToken, token, req.ip, req.get('User-Agent'));
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  static refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  });

  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.logout(refreshToken);
    res.json({ success: true, ...result });
  });

  static setupMFA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.setupMFA(req.user!.id);
    res.json({ success: true, data: result });
  });

  static verifyMFA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.verifyMFA({ userId: req.user!.id, token: req.body.token });
    res.json({ success: true, data: result });
  });

  static enableMFA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.enableMFA({ userId: req.user!.id, token: req.body.token });
    res.json({ success: true, message: result.message });
  });

  static disableMFA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.disableMFA(req.user!.id, req.body.token);
    res.json({ success: true, message: result.message });
  });

  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.changePassword({ userId: req.user!.id, ...req.body });
    res.json({ success: true, message: result.message });
  });
}
