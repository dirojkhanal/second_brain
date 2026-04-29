import { Router } from 'express';
import * as noteController from '../controllers/note.controllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  validateCreateNote,
  validateUpdateNote,
  validateBatchDelete,
  validateBatchArchive,
  validateNoteId,
  validateMoveToFolder,
} from '../validators/note.validator.js';

const router = Router();

// All note routes require authentication
router.use(authenticate);

// ==========================
// SINGLE NOTE OPERATIONS
// ==========================

// Create note
router.post(
  '/',
  validateCreateNote,
  noteController.createNote
);

// Get all notes (paginated)
// Query params: page, limit, includeArchived
router.get(
  '/',
  noteController.getAllNotes
);

// Search notes
// Query params: query, page, limit
router.get(
  '/search',
  noteController.searchNotes
);

// Get recent notes
// Query params: days (default: 7)
router.get(
  '/recent',
  noteController.getRecentNotes
);

// Get single note
router.get(
  '/:noteId',
  validateNoteId,
  noteController.getNote
);

// Update note
router.patch(
  '/:noteId',
  validateNoteId,
  validateUpdateNote,
  noteController.updateNote
);

// Delete note
router.delete(
  '/:noteId',
  validateNoteId,
  noteController.deleteNote
);

// Toggle archive
router.patch(
  '/:noteId/archive',
  validateNoteId,
  noteController.toggleArchive
);

// ==========================
// BATCH OPERATIONS
// ==========================

// Batch delete notes
router.post(
  '/batch/delete',
  validateBatchDelete,
  noteController.batchDeleteNotes
);

// Batch archive notes
router.post(
  '/batch/archive',
  validateBatchArchive,
  noteController.batchArchiveNotes
);
// Move note to folder
router.patch(
  '/:noteId/move',
  validateNoteId,
  validateMoveToFolder,
  noteController.moveNoteToFolder
);
export default router;