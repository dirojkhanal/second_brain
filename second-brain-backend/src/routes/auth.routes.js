import { Router } from "express";
import * as authController from "../controllers/auth.controllers.js";
import { validateRegister, validateLogin, validateForgotPassword} from "../validators/auth.validator.js";
import { otpRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/login',validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', otpRateLimiter, validateForgotPassword, authController.forgotPassword);

export default router;