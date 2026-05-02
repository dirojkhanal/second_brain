import * as noteRepo from '../repositories/note.repository.js';
import * as folderRepo from '../repositories/folder.repository.js';
import * as tagRepo from '../repositories/tag.repository.js';
import { AppError } from '../utils/appError.js';

// =============================
// CONSTANTS
// =============================
const MAX_TITLE_LENGTH = 255;
const MAX_CONTENT_LENGTH = 100000;
const MIN_SEARCH_LENGTH = 2;
const MAX_BATCH_SIZE = 100;

// =============================
// VALIDATION HELPERS
// =============================
const validateTitle = (title) => {
  const trimmed = title?.trim();

  if (!trimmed) {
    throw new AppError('Title is required', 400);
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new AppError(`Title must not exceed ${MAX_TITLE_LENGTH} characters`, 400);
  }

  return trimmed;
};

const validateContent = (content) => {
  const trimmed = content?.trim();

  if (!trimmed) {
    throw new AppError('Content is required', 400);
  }

  if (trimmed.length > MAX_CONTENT_LENGTH) {
    throw new AppError(`Content must not exceed ${MAX_CONTENT_LENGTH} characters`, 400);
  }

  return trimmed;
};

const validatePagination = ({ page = 1, limit = 20 }) => {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  if (parsedPage < 1) {
    throw new AppError('Page must be >= 1', 400);
  }

  if (parsedLimit < 1 || parsedLimit > 100) {
    throw new AppError('Limit must be between 1 and 100', 400);
  }

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
  };
};

const validateBatchIds = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('IDs array is required', 400);
  }

  if (ids.length > MAX_BATCH_SIZE) {
    throw new AppError(`Cannot process more than ${MAX_BATCH_SIZE} items at once`, 400);
  }
};

// =============================
// CREATE NOTE (WITH TAGS)
// =============================
export const createNote = async ({ userId, title, content, tags = [] }) => {
  const validatedTitle = validateTitle(title);
  const validatedContent = validateContent(content);

  const note = await noteRepo.createNote({
    userId,
    title: validatedTitle,
    content: validatedContent,
  });

  // Attach tags
  if (tags.length > 0) {
    const createdTags = await Promise.all(
      tags.map((name) => tagRepo.findOrCreateTag(name.trim()))
    );

    await Promise.all(
      createdTags.map((tag) =>
        tagRepo.attachTagToNote(note.id, tag.id)
      )
    );

    return await noteRepo.getNoteByIdWithTags(note.id, userId);
  }

  return note;
};

// =============================
// GET ALL NOTES
// =============================
export const getAllNotes = async (userId, queryParams) => {
  const { page, limit, offset } = validatePagination(queryParams);
  const includeArchived = queryParams.includeArchived === 'true';

  const [notes, total] = await Promise.all([
    noteRepo.getAllNotesByUserWithTags(userId, { limit, offset, includeArchived }),
    noteRepo.getTotalNotesCount(userId, includeArchived),
  ]);

  return {
    notes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

// =============================
// GET SINGLE NOTE
// =============================
export const getNote = async (noteId, userId) => {
  const note = await noteRepo.getNoteByIdWithTags(noteId, userId);

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  return note;
};

// =============================
// UPDATE NOTE
// =============================
export const updateNote = async ({ noteId, userId, title, content }) => {
  const existingNote = await noteRepo.getNoteById(noteId, userId);

  if (!existingNote) {
    throw new AppError('Note not found', 404);
  }

  const updates = {};

  if (title !== undefined) {
    updates.title = validateTitle(title);
  }

  if (content !== undefined) {
    updates.content = validateContent(content);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('Nothing to update', 400);
  }

  return await noteRepo.updateNote(noteId, userId, updates);
};

// =============================
// DELETE NOTE
// =============================
export const deleteNote = async (noteId, userId) => {
  const existingNote = await noteRepo.getNoteById(noteId, userId);

  if (!existingNote) {
    throw new AppError('Note not found', 404);
  }

  await noteRepo.deleteNote(noteId, userId);

  return {
    message: 'Note deleted successfully',
    id: noteId,
  };
};

// =============================
// SEARCH NOTES
// =============================
export const searchNotes = async (userId, queryParams) => {
  const { query } = queryParams;

  if (!query?.trim()) {
    throw new AppError('Search query is required', 400);
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
    throw new AppError(`Search query must be at least ${MIN_SEARCH_LENGTH} characters`, 400);
  }

  const { page, limit, offset } = validatePagination(queryParams);

  const [notes, total] = await Promise.all([
    noteRepo.searchNotes(userId, trimmedQuery, { limit, offset }),
    noteRepo.getSearchNotesCount(userId, trimmedQuery),
  ]);

  return {
    notes,
    query: trimmedQuery,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

// =============================
// TOGGLE ARCHIVE
// =============================
export const toggleArchive = async ({ noteId, userId }) => {
  const note = await noteRepo.getNoteById(noteId, userId);

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  return await noteRepo.toggleArchiveNote(noteId, userId);
};

// =============================
// BATCH DELETE
// =============================
export const batchDeleteNotes = async (userId, noteIds) => {
  validateBatchIds(noteIds);

  const deletedNotes = await noteRepo.batchDeleteNotes(noteIds, userId);

  return {
    message: 'Notes deleted successfully',
    deletedCount: deletedNotes.length,
    deletedIds: deletedNotes.map((n) => n.id),
  };
};

// =============================
// BATCH ARCHIVE
// =============================
export const batchArchiveNotes = async (userId, noteIds, archive = true) => {
  validateBatchIds(noteIds);

  const result = await noteRepo.batchArchiveNotes(noteIds, userId, archive);

  return {
    message: `Notes ${archive ? 'archived' : 'unarchived'} successfully`,
    affectedCount: result.length,
    affectedIds: result.map((n) => n.id),
  };
};

// =============================
// RECENT NOTES
// =============================
export const getRecentNotes = async (userId, days = 7) => {
  const parsedDays = parseInt(days);

  if (parsedDays < 1 || parsedDays > 30) {
    throw new AppError('Days must be between 1 and 30', 400);
  }

  const notes = await noteRepo.getRecentNotes(userId, parsedDays, { limit: 20 });

  return {
    notes,
    days: parsedDays,
  };
};

// =============================
// MOVE NOTE TO FOLDER
// =============================
export const moveNoteToFolder = async (noteId, userId, folderId) => {
  const note = await noteRepo.getNoteById(noteId, userId);

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  if (folderId) {
    const folder = await folderRepo.getFolderById(folderId, userId);

    if (!folder) {
      throw new AppError('Folder not found', 404);
    }
  }

  return await noteRepo.moveNoteToFolder(noteId, userId, folderId);
};

// =============================
// GET NOTES BY FOLDER
// =============================
export const getNotesByFolder = async (folderId, userId, queryParams) => {
  const folder = await folderRepo.getFolderById(folderId, userId);

  if (!folder) {
    throw new AppError('Folder not found', 404);
  }

  const { page, limit, offset } = validatePagination(queryParams);

  const [notes, total] = await Promise.all([
    noteRepo.getNotesByFolder(folderId, userId, { limit, offset }),
    noteRepo.countNotesByFolder(folderId, userId),
  ]);

  return {
    folder,
    notes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};