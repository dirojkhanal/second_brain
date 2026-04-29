import { Router } from 'express';
import * as folderController from '../controllers/folder.controllers.js';
import * as noteController from '../controllers/note.controllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  validateCreateFolder,
  validateUpdateFolder,
  validateFolderId,
} from '../validators/folder.validator.js';

const router = Router();

// All folder routes require authentication
router.use(authenticate);

// FOLDER CRUD
router.post('/', validateCreateFolder, folderController.createFolder);
router.get('/', folderController.getAllFolders);
router.get('/:folderId', validateFolderId, folderController.getFolder);
router.patch('/:folderId', validateFolderId, validateUpdateFolder, folderController.updateFolder);
router.delete('/:folderId', validateFolderId, folderController.deleteFolder);

// GET NOTES IN FOLDER
router.get('/:folderId/notes', validateFolderId, noteController.getNotesByFolder);

export default router;