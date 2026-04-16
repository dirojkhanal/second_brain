import { query } from '../db/index.js';

// ==========================
// CREATE NOTE
// ==========================
export const createNote = async ({ userId, title, content }) => {
  const { rows } = await query(
    `INSERT INTO notes (user_id, title, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, title, content]
  );

  return rows[0];
};

// ==========================
// GET ALL NOTES (BY USER)
// ==========================
export const getAllNotesByUser = async (userId) => {
  const { rows } = await query(
    `SELECT * FROM notes
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
};

// ==========================
// GET SINGLE NOTE
// ==========================
export const getNoteById = async (noteId, userId) => {
  const { rows } = await query(
    `SELECT * FROM notes
     WHERE id = $1 AND user_id = $2`,
    [noteId, userId]
  );

  return rows[0] || null;
};

// ==========================
// UPDATE NOTE
// ==========================
export const updateNote = async (noteId, userId, { title, content }) => {
  const { rows } = await query(
    `UPDATE notes
     SET title = COALESCE($1, title),
         content = COALESCE($2, content),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [title, content, noteId, userId]
  );

  return rows[0];
};

// ==========================
// DELETE NOTE
// ==========================
export const deleteNote = async (noteId, userId) => {
  const { rows } = await query(
    `DELETE FROM notes
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [noteId, userId]
  );

  return rows[0];
};

// ==========================
// SEARCH NOTES (FULL TEXT SEARCH)
// ==========================
export const searchNotes = async (userId, searchText) => {
  const { rows } = await query(
    `SELECT *
     FROM notes
     WHERE user_id = $1
     AND to_tsvector(title || ' ' || content)
         @@ plainto_tsquery($2)
     ORDER BY created_at DESC`,
    [userId, searchText]
  );

  return rows;
};

// ==========================
// ARCHIVE NOTE
// ==========================
export const toggleArchiveNote = async (noteId, userId) => {
  const { rows } = await query(
    `UPDATE notes
     SET is_archived = NOT is_archived,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [noteId, userId]
  );

  return rows[0];
};