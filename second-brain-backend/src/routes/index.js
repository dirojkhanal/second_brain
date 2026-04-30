import { Router } from "express";
import authRouter from "./auth.routes.js";
import noteRouter from "./note.routes.js";
import folderRouter from "./folder.routes.js";
import tagRouter from "./tag.routes.js";

const router = Router();

router.use('/auth', authRouter);
router.use('/notes', noteRouter);
router.use('/folders', folderRouter);
router.use('/tags', tagRouter); 

export default router;