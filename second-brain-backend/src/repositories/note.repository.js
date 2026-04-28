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
// GET ALL NOTES (WITH PAGINATION)
// ==========================
export const getAllNotesByUser = async (userId, { limit = 20, offset = 0, includeArchived = false }) => {
  const archiveCondition = includeArchived ? '' : 'AND is_archived = FALSE';
  
  const { rows } = await query(
    `SELECT * FROM notes
     WHERE user_id = $1 ${archiveCondition}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return rows;
};

// ==========================
// GET TOTAL NOTES COUNT
// ==========================
export const getTotalNotesCount = async (userId, includeArchived = false) => {
  const archiveCondition = includeArchived ? '' : 'AND is_archived = FALSE';
  
  const { rows } = await query(
    `SELECT COUNT(*) as count 
     FROM notes 
     WHERE user_id = $1 ${archiveCondition}`,
    [userId]
  );

  return parseInt(rows[0].count);
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
// UPDATE NOTE (DYNAMIC)
// ==========================
export const updateNote = async (noteId, userId, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  // Build dynamic update query
  if (updates.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(updates.title);
  }

  if (updates.content !== undefined) {
    fields.push(`content = $${paramCount++}`);
    values.push(updates.content);
  }

  if (fields.length === 0) {
    return null; // Nothing to update
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(noteId, userId);

  const { rows } = await query(
    `UPDATE notes
     SET ${fields.join(', ')}
     WHERE id = $${paramCount++} AND user_id = $${paramCount++}
     RETURNING *`,
    values
  );

  return rows[0] || null;
};

// ==========================
// DELETE NOTE
// ==========================
export const deleteNote = async (noteId, userId) => {
  const { rows } = await query(
    `DELETE FROM notes
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [noteId, userId]
  );

  return rows[0] || null;
};

// ==========================
// SEARCH NOTES (WITH PAGINATION & RANKING)
// ==========================
export const searchNotes = async (userId, searchText, { limit = 20, offset = 0 }) => {
  const { rows } = await query(
    `SELECT *,
            ts_rank(
              to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')),
              plainto_tsquery('english', $2)
            ) as rank
     FROM notes
     WHERE user_id = $1
     AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
         @@ plainto_tsquery('english', $2)
     ORDER BY rank DESC, created_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, searchText, limit, offset]
  );

  return rows;
};

// ==========================
// SEARCH NOTES COUNT
// ==========================
export const getSearchNotesCount = async (userId, searchText) => {
  const { rows } = await query(
    `SELECT COUNT(*) as count
     FROM notes
     WHERE user_id = $1
     AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
         @@ plainto_tsquery('english', $2)`,
    [userId, searchText]
  );

  return parseInt(rows[0].count);
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

  return rows[0] || null;
};

// ==========================
// BATCH DELETE NOTES
// ==========================
export const batchDeleteNotes = async (noteIds, userId) => {
  const { rows } = await query(
    `DELETE FROM notes
     WHERE id = ANY($1::uuid[]) AND user_id = $2
     RETURNING id`,
    [noteIds, userId]
  );

  return rows;
};

// ==========================
// BATCH ARCHIVE NOTES
// ==========================
export const batchArchiveNotes = async (noteIds, userId, archive = true) => {
  const { rows } = await query(
    `UPDATE notes
     SET is_archived = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ANY($2::uuid[]) AND user_id = $3
     RETURNING id`,
    [archive, noteIds, userId]
  );

  return rows;
};

// ==========================
// GET RECENT NOTES (LAST N DAYS)
// ==========================
export const getRecentNotes = async (userId, days = 7, { limit = 20 }) => {
  const { rows } = await query(
    `SELECT * FROM notes
     WHERE user_id = $1
     AND created_at > NOW() - ($2 * INTERVAL '1 day')
     AND is_archived = FALSE
     ORDER BY created_at DESC
     LIMIT $3`,
    [userId, days, limit]
  );

  return rows;
};
export const moveNoteToFolder = async (noteId, userId, folderId) => {
  const { rows } = await query(
    `UPDATE notes
     SET folder_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [folderId, noteId, userId]
  );
  return rows[0] || null;
};

// GET NOTES BY FOLDER
export const getNotesByFolder = async (folderId, userId, { limit = 20, offset = 0 }) => {
  const { rows } = await query(
    `SELECT * FROM notes
     WHERE folder_id = $1 AND user_id = $2 AND is_archived = FALSE
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`,
    [folderId, userId, limit, offset]
  );
  return rows;
};

// COUNT NOTES IN FOLDER
export const countNotesByFolder = async (folderId, userId) => {
  const { rows } = await query(
    `SELECT COUNT(*) as count
     FROM notes
     WHERE folder_id = $1 AND user_id = $2 AND is_archived = FALSE`,
    [folderId, userId]
  );
  return parseInt(rows[0].count);
};