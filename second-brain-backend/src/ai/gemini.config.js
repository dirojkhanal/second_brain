import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);

export const getGeminiModel = (options = {}) => {
    return genAI.getGenerativeModel({
        model: options.model || config.ai.model,
        generationConfig: {
            maxOutputTokens: options.maxTokens || config.ai.maxTokens,
            temperature: options.temperature ?? config.ai.temperature,
        },
    });
};

// Embedding model has no generationConfig — separate getter keeps concerns clean
export const getEmbeddingModel = () => {
    return genAI.getGenerativeModel({ model: 'text-embedding-004' });
};

export const AI_FEATURES = {
    SUMMARIZE: 'summarize',
    AUTO_TAGS: 'auto_tags',
    INSIGHTS: 'insights',
};

export const AI_CONFIG = {
    MAX_INPUT_CHARS: 12000,
    EMBEDDING_INPUT_CHARS: 6000, // text-embedding-004 limit is ~2048 tokens
    EMBEDDING_DIMENSIONS: 768,
    RELATED_NOTES_MAX_LIMIT: 10,
    RELATED_NOTES_DEFAULT_LIMIT: 5,
    MIN_SIMILARITY_SCORE: 0.5,   // filter out weak/noise matches
};
