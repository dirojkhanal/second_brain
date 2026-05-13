import { query } from '../db/index.js';

// ==========================
// SAVE AI OUTPUT
// ==========================
export const saveAiOutput = async ({ userId, noteId, type, inputText, outputText, metadata = {} }) => {
    const { rows } = await query(
        `INSERT INTO ai_outputs (user_id, note_id, type, input_text, output_text, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, noteId, type, inputText, outputText, JSON.stringify(metadata)]
    );
    return rows[0];
};

// ==========================
// GET LATEST CACHED OUTPUT (PER NOTE + FEATURE TYPE)
// ==========================
export const getCachedOutput = async (noteId, type) => {
    const { rows } = await query(
        `SELECT * FROM ai_outputs
         WHERE note_id = $1 AND type = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [noteId, type]
    );
    return rows[0] || null;
};

// ==========================
// GET ALL AI OUTPUTS FOR A NOTE
// ==========================
export const getAiOutputsByNote = async (noteId, userId) => {
    const { rows } = await query(
        `SELECT id, type, output_text, metadata, created_at
         FROM ai_outputs
         WHERE note_id = $1 AND user_id = $2
         ORDER BY created_at DESC`,
        [noteId, userId]
    );
    return rows;
};

// ==========================
// DELETE ALL AI OUTPUTS FOR A NOTE (CACHE INVALIDATION)
// ==========================
export const deleteAiOutputsByNote = async (noteId, userId) => {
    const { rows } = await query(
        `DELETE FROM ai_outputs
         WHERE note_id = $1 AND user_id = $2
         RETURNING id`,
        [noteId, userId]
    );
    return rows;
};

// ==========================
// UPSERT NOTE EMBEDDING
// ON CONFLICT re-embeds the note (handles note content updates)
// ==========================
export const upsertEmbedding = async (noteId, userId, embeddingVector) => {
    // pgvector expects the array formatted as a bracketed string: '[0.1, 0.2, ...]'
    const vectorLiteral = `[${embeddingVector.join(',')}]`;

    const { rows } = await query(
        `INSERT INTO note_embeddings (note_id, user_id, embedding)
         VALUES ($1, $2, $3::vector)
         ON CONFLICT (note_id)
         DO UPDATE SET embedding = EXCLUDED.embedding,
                       updated_at = CURRENT_TIMESTAMP
         RETURNING id, note_id, created_at, updated_at`,
        [noteId, userId, vectorLiteral]
    );
    return rows[0];
};

// ==========================
// CHECK IF EMBEDDING EXISTS (metadata only — no vector)
// ==========================
export const getEmbedding = async (noteId) => {
    const { rows } = await query(
        `SELECT id, note_id, updated_at FROM note_embeddings WHERE note_id = $1`,
        [noteId]
    );
    return rows[0] || null;
};

// ==========================
// GET EMBEDDING VECTOR AS number[]
// pgvector returns the vector as a string '[0.1,0.2,...]' — parse it here
// ==========================
export const getEmbeddingVector = async (noteId) => {
    const { rows } = await query(
        `SELECT embedding::text AS embedding FROM note_embeddings WHERE note_id = $1`,
        [noteId]
    );
    if (!rows[0]) return null;
    return rows[0].embedding
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(Number);
};

// ==========================
// FIND SIMILAR NOTES (COSINE SIMILARITY VIA pgvector)
// Returns notes ordered by similarity descending, filtered by user scope
// ==========================
export const findSimilarNotes = async (userId, embeddingVector, sourceNoteId, limit = 5) => {
    const vectorLiteral = `[${embeddingVector.join(',')}]`;

    const { rows } = await query(
        `SELECT
             n.id,
             n.title,
             n.content,
             n.created_at,
             ROUND((1 - (ne.embedding <=> $1::vector))::numeric, 4) AS similarity_score
         FROM note_embeddings ne
         JOIN notes n ON ne.note_id = n.id
         WHERE ne.user_id = $2
             AND ne.note_id != $3
             AND n.is_archived = FALSE
         ORDER BY ne.embedding <=> $1::vector
         LIMIT $4`,
        [vectorLiteral, userId, sourceNoteId, limit]
    );
    return rows;
};
