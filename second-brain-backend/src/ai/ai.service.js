import { getGeminiModel, getEmbeddingModel, AI_FEATURES, AI_CONFIG } from './gemini.config.js';
import * as aiRepo from './ai.repository.js';
import * as noteRepo from '../repositories/note.repository.js';
import { AppError } from '../utils/appError.js';
import { config } from '../config/env.js';
import { buildSummarizePrompt } from './prompts/summarize.prompt.js';
import { buildTagsPrompt } from './prompts/tags.prompt.js';
import { buildInsightsPrompt } from './prompts/insights.prompt.js';

// =============================================
// CORE GEMINI WRAPPER — centralizes error handling
// =============================================
const callGemini = async (prompt, options = {}) => {
    const startTime = Date.now();

    try {
        const model = getGeminiModel(options);
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        return {
            text,
            processingTime: Date.now() - startTime,
            model: options.model || config.ai.model,
        };
    } catch (err) {
        const statusCode = err.status || err.statusCode;

        if (statusCode === 429 || err.message?.includes('429')) {
            throw new AppError('AI rate limit reached. Please try again in a moment.', 429);
        }
        if (statusCode === 400 || err.message?.includes('400')) {
            throw new AppError('Note content could not be processed by the AI.', 400);
        }
        if (statusCode === 403) {
            throw new AppError('AI service access denied. Check your API key.', 503);
        }
        throw new AppError('AI service is temporarily unavailable. Please try again later.', 503);
    }
};

// =============================================
// HELPERS
// =============================================

// Truncate long content to control token cost while preserving meaning
const truncateContent = (content) => {
    if (content.length <= AI_CONFIG.MAX_INPUT_CHARS) return content;
    return content.substring(0, AI_CONFIG.MAX_INPUT_CHARS) + '\n\n[Content truncated for processing]';
};

// Fetch note and assert ownership; throws 404 if missing, 400 if empty
const getNoteForAI = async (noteId, userId) => {
    const note = await noteRepo.getNoteById(noteId, userId);
    if (!note) throw new AppError('Note not found', 404);
    if (!note.content?.trim()) throw new AppError('Note has no content to process', 400);
    return note;
};

// Strip markdown code fences Gemini sometimes adds, then extract JSON array
const safeJsonParse = (text, fallback = []) => {
    try {
        const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
        const match = cleaned.match(/\[[\s\S]*\]/);
        return match ? JSON.parse(match[0]) : fallback;
    } catch {
        return fallback;
    }
};

// =============================================
// SUMMARIZE NOTE
// =============================================
export const summarizeNote = async (noteId, userId, useCache = true) => {
    const note = await getNoteForAI(noteId, userId);

    if (useCache) {
        const cached = await aiRepo.getCachedOutput(noteId, AI_FEATURES.SUMMARIZE);
        if (cached) {
            return {
                noteId,
                feature: AI_FEATURES.SUMMARIZE,
                summary: cached.output_text,
                cached: true,
                cachedAt: cached.created_at,
            };
        }
    }

    const inputText = truncateContent(note.content);
    const prompt = buildSummarizePrompt(note.title, inputText);

    // Lower temperature for factual, deterministic summaries
    const { text, processingTime, model } = await callGemini(prompt, { temperature: 0.3 });

    await aiRepo.saveAiOutput({
        userId,
        noteId,
        type: AI_FEATURES.SUMMARIZE,
        inputText,
        outputText: text,
        metadata: { model, processingTime, noteTitle: note.title },
    });

    return {
        noteId,
        feature: AI_FEATURES.SUMMARIZE,
        summary: text,
        cached: false,
        processingTime,
    };
};

// =============================================
// GENERATE TAGS
// =============================================
export const generateTags = async (noteId, userId, useCache = true) => {
    const note = await getNoteForAI(noteId, userId);

    if (useCache) {
        const cached = await aiRepo.getCachedOutput(noteId, AI_FEATURES.AUTO_TAGS);
        if (cached) {
            return {
                noteId,
                feature: AI_FEATURES.AUTO_TAGS,
                tags: safeJsonParse(cached.output_text),
                cached: true,
                cachedAt: cached.created_at,
            };
        }
    }

    const inputText = truncateContent(note.content);
    const prompt = buildTagsPrompt(note.title, inputText);

    // Lower temperature for more consistent, predictable tag output
    const { text, processingTime, model } = await callGemini(prompt, { temperature: 0.2 });

    const tags = safeJsonParse(text);

    await aiRepo.saveAiOutput({
        userId,
        noteId,
        type: AI_FEATURES.AUTO_TAGS,
        inputText,
        outputText: JSON.stringify(tags),
        metadata: { model, processingTime, noteTitle: note.title },
    });

    return {
        noteId,
        feature: AI_FEATURES.AUTO_TAGS,
        tags,
        cached: false,
        processingTime,
    };
};

// =============================================
// EXTRACT KEY INSIGHTS
// =============================================
export const extractInsights = async (noteId, userId, useCache = true) => {
    const note = await getNoteForAI(noteId, userId);

    if (useCache) {
        const cached = await aiRepo.getCachedOutput(noteId, AI_FEATURES.INSIGHTS);
        if (cached) {
            return {
                noteId,
                feature: AI_FEATURES.INSIGHTS,
                insights: safeJsonParse(cached.output_text),
                cached: true,
                cachedAt: cached.created_at,
            };
        }
    }

    const inputText = truncateContent(note.content);
    const prompt = buildInsightsPrompt(note.title, inputText);

    const { text, processingTime, model } = await callGemini(prompt, { temperature: 0.3 });

    const insights = safeJsonParse(text);

    await aiRepo.saveAiOutput({
        userId,
        noteId,
        type: AI_FEATURES.INSIGHTS,
        inputText,
        outputText: JSON.stringify(insights),
        metadata: { model, processingTime, noteTitle: note.title },
    });

    return {
        noteId,
        feature: AI_FEATURES.INSIGHTS,
        insights,
        cached: false,
        processingTime,
    };
};

// =============================================
// GET ALL CACHED AI OUTPUTS FOR A NOTE
// =============================================
export const getAiOutputs = async (noteId, userId) => {
    const note = await noteRepo.getNoteById(noteId, userId);
    if (!note) throw new AppError('Note not found', 404);

    const outputs = await aiRepo.getAiOutputsByNote(noteId, userId);

    return outputs.map((output) => ({
        id: output.id,
        feature: output.type,
        result: output.type === AI_FEATURES.SUMMARIZE
            ? output.output_text
            : safeJsonParse(output.output_text),
        metadata: output.metadata,
        createdAt: output.created_at,
    }));
};

// =============================================
// PHASE 2 — SEMANTIC RELATED NOTES
// =============================================

// Builds the text fed to the embedding model: title + content, truncated
const buildEmbeddingText = (title, content) => {
    const combined = `${title}\n\n${content}`;
    return combined.length <= AI_CONFIG.EMBEDDING_INPUT_CHARS
        ? combined
        : combined.substring(0, AI_CONFIG.EMBEDDING_INPUT_CHARS);
};

// Calls Gemini embedContent, maps SDK errors to AppError
const callEmbeddingModel = async (text) => {
    try {
        const model = getEmbeddingModel();
        const result = await model.embedContent(text);
        return result.embedding.values; // number[]
    } catch (err) {
        const statusCode = err.status || err.statusCode;
        if (statusCode === 429 || err.message?.includes('429')) {
            throw new AppError('AI rate limit reached. Please try again in a moment.', 429);
        }
        throw new AppError('Embedding service is temporarily unavailable.', 503);
    }
};

// Internal helper — generates embedding and persists it; called by both
// embedNote (explicit) and findRelatedNotes (auto-embed on first call)
const generateAndStoreEmbedding = async (note, userId) => {
    const text = buildEmbeddingText(note.title, note.content);
    const vector = await callEmbeddingModel(text);
    await aiRepo.upsertEmbedding(note.id, userId, vector);
    return vector;
};

// =============================================
// EMBED NOTE (explicit — store/refresh embedding)
// =============================================
export const embedNote = async (noteId, userId) => {
    const note = await getNoteForAI(noteId, userId);
    const startTime = Date.now();

    const vector = await generateAndStoreEmbedding(note, userId);

    return {
        noteId,
        dimensions: vector.length,
        processingTime: Date.now() - startTime,
        model: 'text-embedding-004',
    };
};

// =============================================
// FIND RELATED NOTES (semantic similarity)
// Auto-embeds the source note on first call; reuses stored vector after that
// =============================================
export const findRelatedNotes = async (noteId, userId, limit = AI_CONFIG.RELATED_NOTES_DEFAULT_LIMIT) => {
    const parsedLimit = Math.min(
        parseInt(limit) || AI_CONFIG.RELATED_NOTES_DEFAULT_LIMIT,
        AI_CONFIG.RELATED_NOTES_MAX_LIMIT
    );
    const note = await getNoteForAI(noteId, userId);

    let embeddingGenerated = false;

    // Try to reuse the stored vector; generate + store if missing
    let queryVector = await aiRepo.getEmbeddingVector(noteId);
    if (!queryVector) {
        queryVector = await generateAndStoreEmbedding(note, userId);
        embeddingGenerated = true;
    }

    const similar = await aiRepo.findSimilarNotes(userId, queryVector, noteId, parsedLimit);

    // Filter weak matches below the minimum similarity threshold
    const relatedNotes = similar
        .filter((n) => parseFloat(n.similarity_score) >= AI_CONFIG.MIN_SIMILARITY_SCORE)
        .map((n) => ({
            id: n.id,
            title: n.title,
            excerpt: n.content?.substring(0, 200) || '',
            similarityScore: parseFloat(n.similarity_score),
            createdAt: n.created_at,
        }));

    return {
        noteId,
        sourceTitle: note.title,
        relatedNotes,
        totalFound: relatedNotes.length,
        embeddingGenerated,
    };
};
