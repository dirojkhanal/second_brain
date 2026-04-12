import { Router } from "express";
import * as authController from "../controllers/auth.controllers.js";
import { validateRegister, validateLogin} from "../validators/auth.validator.js";

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/login',validateLogin, authController.login);
router.post('/logout', authController.logout);

export default router;