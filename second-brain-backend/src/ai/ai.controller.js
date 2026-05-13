import * as aiService from './ai.service.js';

// POST /api/v1/ai/notes/:noteId/summarize
export const summarizeNote = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user.id;
    const useCache = req.query.useCache !== 'false';

    const result = await aiService.summarizeNote(noteId, userId, useCache);

    res.status(200).json({
        status: 'success',
        data: result,
    });
};

// POST /api/v1/ai/notes/:noteId/tags
export const generateTags = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user.id;
    const useCache = req.query.useCache !== 'false';

    const result = await aiService.generateTags(noteId, userId, useCache);

    res.status(200).json({
        status: 'success',
        data: result,
    });
};

// POST /api/v1/ai/notes/:noteId/insights
export const extractInsights = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user.id;
    const useCache = req.query.useCache !== 'false';

    const result = await aiService.extractInsights(noteId, userId, useCache);

    res.status(200).json({
        status: 'success',
        data: result,
    });
};

// GET /api/v1/ai/notes/:noteId/outputs
export const getAiOutputs = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user.id;

    const outputs = await aiService.getAiOutputs(noteId, userId);

    res.status(200).json({
        status: 'success',
        data: {
            noteId,
            outputs,
        },
    });
};

// POST /api/v1/ai/notes/:noteId/embed
// Explicitly generates and stores the embedding for a note
export const embedNote = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user.id;

    const result = await aiService.embedNote(noteId, userId);

    res.status(200).json({
        status: 'success',
        message: 'Embedding generated and stored successfully',
        data: result,
    });
};

// GET /api/v1/ai/notes/:noteId/related?limit=5
// Returns semantically similar notes; auto-embeds the source if needed
export const getRelatedNotes = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user.id;
    const { limit } = req.query;

    const result = await aiService.findRelatedNotes(noteId, userId, limit);

    res.status(200).json({
        status: 'success',
        data: result,
    });
};
