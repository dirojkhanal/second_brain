import { z } from 'zod';
import { AppError } from '../utils/appError.js';

// FIELD SCHEMAS
const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(255, 'Title must not exceed 255 characters');

const contentSchema = z
  .string()
  .trim()
  .min(1, 'Content is required')
  .max(100000, 'Content must not exceed 100,000 characters');

const uuidSchema = z
  .string()
  .uuid('Invalid note ID format');

const uuidArraySchema = z
  .array(z.string().uuid('Invalid note ID format'))
  .min(1, 'At least one note ID is required')
  .max(100, 'Cannot process more than 100 notes at once');

// REQUEST SCHEMAS

const createNoteSchema = z.object({
  title: titleSchema,
  content: contentSchema,
});

const updateNoteSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
  })
  .refine((data) => data.title || data.content, {
    message: 'At least one field (title or content) must be provided',
  });

const batchDeleteSchema = z.object({
  noteIds: uuidArraySchema,
});

const batchArchiveSchema = z.object({
  noteIds: uuidArraySchema,
  archive: z.boolean().optional().default(true),
});

// VALIDATION MIDDLEWARE
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const message = err.errors?.[0]?.message || 'Validation error';
    next(new AppError(message, 400));
  }
};

const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (err) {
    const message = err.errors?.[0]?.message || 'Invalid parameters';
    next(new AppError(message, 400));
  }
};

// PARAM VALIDATORS

const noteIdParamSchema = z.object({
  noteId: uuidSchema,
});

const moveFolderSchema = z.object({
  folderId: z.string().uuid('Invalid folder ID').or(z.null()),
});
export const validateNoteId = validateParams(noteIdParamSchema);
// BODY VALIDATORS
export const validateCreateNote = validate(createNoteSchema);
export const validateUpdateNote = validate(updateNoteSchema);
export const validateBatchDelete = validate(batchDeleteSchema);
export const validateBatchArchive = validate(batchArchiveSchema);
export const validateMoveToFolder = validate(moveFolderSchema);