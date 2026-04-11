import { Router } from "express";
import * as authController from "../controllers/auth.controllers.js";
import { validateRegister } from "../validators/auth.validator.js";

const router = Router();

router.post('/register', validateRegister, authController.register);

export default router;