import { z } from 'zod';
import { AppError } from '../utils/appError.js';

// SCHEMAS
const tagNameSchema = z
  .string()
  .trim()
  .min(1, 'Tag name is required')
  .max(50, 'Tag name must not exceed 50 characters')
  .regex(
    /^[a-zA-Z0-9\s\-_]+$/,
    'Tag name can only contain letters, numbers, spaces, hyphens, and underscores'
  );

const tagArraySchema = z
  .array(tagNameSchema)
  .min(1, 'At least one tag is required')
  .max(20, 'Cannot attach more than 20 tags');

const uuidSchema = z.string().uuid('Invalid tag ID format');

const uuidArraySchema = z
  .array(z.string().uuid('Invalid tag ID format'))
  .min(1, 'At least one tag ID is required')
  .max(20, 'Cannot filter by more than 20 tags');

// REQUEST SCHEMAS
const createTagSchema = z.object({
  name: tagNameSchema,
});

const attachTagsSchema = z.object({
  tags: tagArraySchema,
});

const replaceTagsSchema = z.object({
  tags: z.array(tagNameSchema).max(20, 'Cannot attach more than 20 tags'),
});

const filterByTagsSchema = z.object({
  tagIds: uuidArraySchema,
});

const tagIdParamSchema = z.object({
  tagId: uuidSchema,
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
export const validateCreateTag = validate(createTagSchema);
export const validateAttachTags = validate(attachTagsSchema);
export const validateReplaceTags = validate(replaceTagsSchema);
export const validateFilterByTags = validate(filterByTagsSchema);
export const validateTagId = validateParams(tagIdParamSchema);