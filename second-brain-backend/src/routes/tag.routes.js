import { Router } from 'express';
import * as tagController from '../controllers/tag.controllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  validateCreateTag,
  validateAttachTags,
  validateReplaceTags,
  validateFilterByTags,
  validateTagId,
} from '../validators/tag.validator.js';
import { validateNoteId } from '../validators/note.validator.js';

const router = Router();

// All tag routes require authentication
router.use(authenticate);

// TAG CRUD
router.post('/', validateCreateTag, tagController.createTag);
router.get('/', tagController.getAllTags);
router.get('/my-tags', tagController.getUserTags);
router.get('/autocomplete', tagController.autocomplete);
router.get('/:tagId', validateTagId, tagController.getTag);
router.delete('/:tagId', validateTagId, tagController.deleteTag);

// NOTE-TAG OPERATIONS
router.post(
  '/notes/:noteId/attach',
  validateNoteId,
  validateAttachTags,
  tagController.attachTagsToNote
);

router.delete(
  '/notes/:noteId/tags/:tagId',
  validateNoteId,
  validateTagId,
  tagController.removeTagFromNote
);

router.put(
  '/notes/:noteId/tags',
  validateNoteId,
  validateReplaceTags,
  tagController.replaceNoteTags
);

// FILTER NOTES BY TAGS
router.post('/filter', validateFilterByTags, tagController.getNotesByTags);

export default router;