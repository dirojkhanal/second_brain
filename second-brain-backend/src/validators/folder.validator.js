import { z } from 'zod';
import { AppError } from '../utils/appError.js';

// SCHEMAS
const folderNameSchema = z
  .string()
  .trim()
  .min(1, 'Folder name is required')
  .max(255, 'Folder name must not exceed 255 characters');

const uuidSchema = z
  .string()
  .uuid('Invalid folder ID format');

// REQUEST SCHEMAS
const createFolderSchema = z.object({
  name: folderNameSchema,
});

const updateFolderSchema = z.object({
  name: folderNameSchema,
});

const moveFolderSchema = z.object({
  folderId: z.string().uuid('Invalid folder ID').nullable(),
});

const folderIdParamSchema = z.object({
  folderId: uuidSchema,
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

// EXPORTS
export const validateCreateFolder = validate(createFolderSchema);
export const validateUpdateFolder = validate(updateFolderSchema);
export const validateMoveToFolder = validate(moveFolderSchema);
export const validateFolderId = validateParams(folderIdParamSchema);