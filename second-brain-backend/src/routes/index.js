import { Router } from "express";
import authRouter from "./auth.routes.js";
import noteRouter from "./note.routes.js";


const router = Router();

router.use('/auth', authRouter);
router.use('/notes', noteRouter);

export default router;