import { query } from '../db/index.js';

// CREATE FOLDER
export const createFolder = async (userId, name) => {
  const { rows } = await query(
    `INSERT INTO folders (user_id, name)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, name]
  );
  return rows[0];
};

// GET USER FOLDERS
export const getUserFolders = async (userId) => {
  const { rows } = await query(
    `SELECT f.*, 
            COUNT(n.id) as note_count
     FROM folders f
     LEFT JOIN notes n ON f.id = n.folder_id AND n.is_archived = FALSE
     WHERE f.user_id = $1
     GROUP BY f.id
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
};

// GET SINGLE FOLDER
export const getFolderById = async (folderId, userId) => {
  const { rows } = await query(
    `SELECT * FROM folders
     WHERE id = $1 AND user_id = $2`,
    [folderId, userId]
  );
  return rows[0] || null;
};

// UPDATE FOLDER
export const updateFolder = async (folderId, userId, name) => {
  const { rows } = await query(
    `UPDATE folders
     SET name = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [name, folderId, userId]
  );
  return rows[0] || null;
};

// DELETE FOLDER
export const deleteFolder = async (folderId, userId) => {
  const { rows } = await query(
    `DELETE FROM folders
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [folderId, userId]
  );
  return rows[0] || null;
};

// GET FOLDER WITH NOTE COUNT
export const getFolderWithStats = async (folderId, userId) => {
  const { rows } = await query(
    `SELECT f.*, 
            COUNT(n.id) as note_count
     FROM folders f
     LEFT JOIN notes n ON f.id = n.folder_id AND n.is_archived = FALSE
     WHERE f.id = $1 AND f.user_id = $2
     GROUP BY f.id`,
    [folderId, userId]
  );
  return rows[0] || null;
};

// CHECK IF FOLDER NAME EXISTS FOR USER
export const folderNameExists = async (userId, name, excludeFolderId = null) => {
  const params = [userId, name.toLowerCase()];
  let sql = `SELECT id FROM folders WHERE user_id = $1 AND LOWER(name) = $2`;
  
  if (excludeFolderId) {
    sql += ` AND id != $3`;
    params.push(excludeFolderId);
  }
  
  const { rows } = await query(sql, params);
  return rows.length > 0;
};