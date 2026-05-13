import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { aiRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateAiNoteId } from '../validators/ai.validator.js';
import * as aiController from './ai.controller.js';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Cost-control: 30 AI requests per hour per IP
router.use(aiRateLimiter);

// ==========================
// GENERATION ENDPOINTS
// ==========================
// ?useCache=false forces a fresh generation, bypassing the cache
router.post('/notes/:noteId/summarize', validateAiNoteId, aiController.summarizeNote);
router.post('/notes/:noteId/tags', validateAiNoteId, aiController.generateTags);
router.post('/notes/:noteId/insights', validateAiNoteId, aiController.extractInsights);

// ==========================
// CACHE READ ENDPOINT
// ==========================
router.get('/notes/:noteId/outputs', validateAiNoteId, aiController.getAiOutputs);

// ==========================
// PHASE 2 — SEMANTIC SEARCH
// ==========================
// Explicit embed: pre-compute or refresh the embedding for a note
router.post('/notes/:noteId/embed', validateAiNoteId, aiController.embedNote);

// Discover semantically related notes; ?limit=5 (max 10)
router.get('/notes/:noteId/related', validateAiNoteId, aiController.getRelatedNotes);

export default router;
