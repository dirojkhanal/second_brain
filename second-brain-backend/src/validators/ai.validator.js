import { z } from 'zod';
import { AppError } from '../utils/appError.js';

const noteIdParamSchema = z.object({
    noteId: z.string().uuid('Invalid note ID format'),
});

const validateParams = (schema) => (req, res, next) => {
    try {
        req.params = schema.parse(req.params);
        next();
    } catch (err) {
        const message = err.errors?.[0]?.message || 'Invalid parameters';
        next(new AppError(message, 400));
    }
};

export const validateAiNoteId = validateParams(noteIdParamSchema);
