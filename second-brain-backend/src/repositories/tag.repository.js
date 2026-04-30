import { query } from '../db/index.js';
// CREATE TAG (or return existing)
export const findOrCreateTag = async (tagName) => {
  const normalized = tagName.trim().toLowerCase();
  
  // Try to find existing tag first
  const { rows: existing } = await query(
    `SELECT * FROM tags WHERE LOWER(name) = $1`,
    [normalized]
  );
  
  if (existing[0]) {
    return existing[0];
  }
  
  // Create new tag
  const { rows } = await query(
    `INSERT INTO tags (name)
     VALUES ($1)
     RETURNING *`,
    [tagName.trim()]
  );
  
  return rows[0];
};

// GET ALL TAGS (with usage count)
export const getAllTags = async ({ limit = 50, search = null }) => {
  let sql = `
    SELECT t.*, 
           COUNT(nt.note_id) as usage_count
    FROM tags t
    LEFT JOIN note_tags nt ON t.id = nt.tag_id
  `;
  
  const params = [];
  
  if (search) {
    sql += ` WHERE LOWER(t.name) LIKE $1`;
    params.push(`%${search.toLowerCase()}%`);
  }
  
  sql += `
    GROUP BY t.id
    ORDER BY usage_count DESC, t.name ASC
    LIMIT $${params.length + 1}
  `;
  
  params.push(limit);
  
  const { rows } = await query(sql, params);
  return rows;
};

// GET USER'S TAGS (tags they've actually used)
export const getUserTags = async (userId, { limit = 50 }) => {
  const { rows } = await query(
    `SELECT DISTINCT t.*, 
            COUNT(nt.note_id) as usage_count
     FROM tags t
     INNER JOIN note_tags nt ON t.id = nt.tag_id
     INNER JOIN notes n ON nt.note_id = n.id
     WHERE n.user_id = $1
     GROUP BY t.id
     ORDER BY usage_count DESC, t.name ASC
     LIMIT $2`,
    [userId, limit]
  );
  
  return rows;
};

// SEARCH TAGS (autocomplete)
export const searchTags = async (searchText, { limit = 10 }) => {
  const { rows } = await query(
    `SELECT t.*, 
            COUNT(nt.note_id) as usage_count
     FROM tags t
     LEFT JOIN note_tags nt ON t.id = nt.tag_id
     WHERE LOWER(t.name) LIKE $1
     GROUP BY t.id
     ORDER BY usage_count DESC, t.name ASC
     LIMIT $2`,
    [`%${searchText.toLowerCase()}%`, limit]
  );
  
  return rows;
};

// GET TAG BY ID
export const getTagById = async (tagId) => {
  const { rows } = await query(
    `SELECT t.*, 
            COUNT(nt.note_id) as usage_count
     FROM tags t
     LEFT JOIN note_tags nt ON t.id = nt.tag_id
     WHERE t.id = $1
     GROUP BY t.id`,
    [tagId]
  );
  
  return rows[0] || null;
};

// DELETE TAG (if unused)
export const deleteTag = async (tagId) => {
  const { rows } = await query(
    `DELETE FROM tags
     WHERE id = $1
     AND NOT EXISTS (
       SELECT 1 FROM note_tags WHERE tag_id = $1
     )
     RETURNING id`,
    [tagId]
  );
  
  return rows[0] || null;
};

// ==========================
// NOTE-TAG ASSOCIATIONS
// ==========================

// ATTACH TAG TO NOTE
export const attachTagToNote = async (noteId, tagId) => {
  const { rows } = await query(
    `INSERT INTO note_tags (note_id, tag_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [noteId, tagId]
  );
  
  return rows[0] || null;
};

// REMOVE TAG FROM NOTE
export const removeTagFromNote = async (noteId, tagId) => {
  const { rows } = await query(
    `DELETE FROM note_tags
     WHERE note_id = $1 AND tag_id = $2
     RETURNING *`,
    [noteId, tagId]
  );
  
  return rows[0] || null;
};

// GET NOTE'S TAGS
export const getNoteTags = async (noteId) => {
  const { rows } = await query(
    `SELECT t.*
     FROM tags t
     INNER JOIN note_tags nt ON t.id = nt.tag_id
     WHERE nt.note_id = $1
     ORDER BY t.name ASC`,
    [noteId]
  );
  
  return rows;
};

// REPLACE ALL NOTE TAGS (atomic operation)
export const replaceNoteTags = async (noteId, tagIds) => {
  // Start transaction
  await query('BEGIN');
  
  try {
    // Remove all existing tags
    await query(
      `DELETE FROM note_tags WHERE note_id = $1`,
      [noteId]
    );
    
    // Add new tags
    if (tagIds.length > 0) {
      const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO note_tags (note_id, tag_id)
         VALUES ${values}
         ON CONFLICT DO NOTHING`,
        [noteId, ...tagIds]
      );
    }
    
    await query('COMMIT');
    
    // Return updated tags
    return await getNoteTags(noteId);
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// GET NOTES BY TAG(S)
export const getNotesByTags = async (userId, tagIds, { limit = 20, offset = 0, matchAll = false }) => {
  const operator = matchAll ? 'ALL' : 'ANY';
  
  const { rows } = await query(
    `SELECT DISTINCT n.*,
            array_agg(DISTINCT t.name) as tags
     FROM notes n
     INNER JOIN note_tags nt ON n.id = nt.note_id
     INNER JOIN tags t ON nt.tag_id = t.id
     WHERE n.user_id = $1
     AND n.is_archived = FALSE
     ${matchAll 
       ? `AND n.id IN (
            SELECT note_id 
            FROM note_tags 
            WHERE tag_id = ANY($2::uuid[])
            GROUP BY note_id
            HAVING COUNT(DISTINCT tag_id) = $5
          )`
       : `AND nt.tag_id = ANY($2::uuid[])`
     }
     GROUP BY n.id
     ORDER BY n.created_at DESC
     LIMIT $3 OFFSET $4`,
    matchAll 
      ? [userId, tagIds, limit, offset, tagIds.length]
      : [userId, tagIds, limit, offset]
  );
  
  return rows;
};

// COUNT NOTES BY TAGS
export const countNotesByTags = async (userId, tagIds, matchAll = false) => {
  const { rows } = await query(
    `SELECT COUNT(DISTINCT n.id) as count
     FROM notes n
     INNER JOIN note_tags nt ON n.id = nt.note_id
     WHERE n.user_id = $1
     AND n.is_archived = FALSE
     ${matchAll 
       ? `AND n.id IN (
            SELECT note_id 
            FROM note_tags 
            WHERE tag_id = ANY($2::uuid[])
            GROUP BY note_id
            HAVING COUNT(DISTINCT tag_id) = $3
          )`
       : `AND nt.tag_id = ANY($2::uuid[])`
     }`,
    matchAll 
      ? [userId, tagIds, tagIds.length]
      : [userId, tagIds]
  );
  
  return parseInt(rows[0].count);
};

// CLEANUP UNUSED TAGS
export const deleteUnusedTags = async () => {
  const { rows } = await query(
    `DELETE FROM tags
     WHERE NOT EXISTS (
       SELECT 1 FROM note_tags WHERE tag_id = tags.id
     )
     RETURNING id`
  );
  
  return rows.length;
};