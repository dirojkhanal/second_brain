import * as tagRepo from '../repositories/tag.repository.js';
import * as noteRepo from '../repositories/note.repository.js';
import { AppError } from '../utils/appError.js';

const MAX_TAG_LENGTH = 50;
const MIN_TAG_LENGTH = 1;
const MAX_TAGS_PER_NOTE = 20;

const validateTagName = (name) => {
  const trimmed = name?.trim();
  
  if (!trimmed || trimmed.length < MIN_TAG_LENGTH) {
    throw new AppError('Tag name is required', 400);
  }
  
  if (trimmed.length > MAX_TAG_LENGTH) {
    throw new AppError(`Tag name must not exceed ${MAX_TAG_LENGTH} characters`, 400);
  }
  
  // Only allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    throw new AppError('Tag name can only contain letters, numbers, spaces, hyphens, and underscores', 400);
  }
  
  return trimmed;
};

const validateTagArray = (tags) => {
  if (!Array.isArray(tags)) {
    throw new AppError('Tags must be an array', 400);
  }
  
  if (tags.length > MAX_TAGS_PER_NOTE) {
    throw new AppError(`Cannot attach more than ${MAX_TAGS_PER_NOTE} tags to a note`, 400);
  }
  
  return tags.map(validateTagName);
};

// ==========================
// TAG OPERATIONS
// ==========================

// CREATE OR GET TAG
export const createTag = async (name) => {
  const validatedName = validateTagName(name);
  const tag = await tagRepo.findOrCreateTag(validatedName);
  return tag;
};

// GET ALL TAGS
export const getAllTags = async (queryParams) => {
  const { limit = 50, search } = queryParams;
  
  const parsedLimit = Math.min(parseInt(limit) || 50, 100);
  
  const tags = await tagRepo.getAllTags({
    limit: parsedLimit,
    search: search?.trim() || null,
  });
  
  return tags;
};

// GET USER'S TAGS
export const getUserTags = async (userId, queryParams) => {
  const { limit = 50 } = queryParams;
  const parsedLimit = Math.min(parseInt(limit) || 50, 100);
  
  const tags = await tagRepo.getUserTags(userId, { limit: parsedLimit });
  return tags;
};

// AUTOCOMPLETE TAGS
export const autocomplete = async (searchText) => {
  if (!searchText?.trim() || searchText.trim().length < 1) {
    throw new AppError('Search text is required', 400);
  }
  
  const tags = await tagRepo.searchTags(searchText.trim(), { limit: 10 });
  return tags;
};

// GET TAG BY ID
export const getTag = async (tagId) => {
  const tag = await tagRepo.getTagById(tagId);
  
  if (!tag) {
    throw new AppError('Tag not found', 404);
  }
  
  return tag;
};

// DELETE TAG
export const deleteTag = async (tagId) => {
  const tag = await tagRepo.getTagById(tagId);
  
  if (!tag) {
    throw new AppError('Tag not found', 404);
  }
  
  if (tag.usage_count > 0) {
    throw new AppError('Cannot delete tag that is in use', 400);
  }
  
  await tagRepo.deleteTag(tagId);
  
  return {
    message: 'Tag deleted successfully',
    id: tagId,
  };
};

// ==========================
// NOTE-TAG OPERATIONS
// ==========================

// ATTACH TAGS TO NOTE
export const attachTagsToNote = async (noteId, userId, tagNames) => {
  const validatedTags = validateTagArray(tagNames);
  
  // Verify note exists and belongs to user
  const note = await noteRepo.getNoteById(noteId, userId);
  if (!note) {
    throw new AppError('Note not found', 404);
  }
  
  // Create or get all tags
  const tagPromises = validatedTags.map(name => tagRepo.findOrCreateTag(name));
  const tags = await Promise.all(tagPromises);
  
  // Attach all tags to note
  const attachPromises = tags.map(tag => 
    tagRepo.attachTagToNote(noteId, tag.id)
  );
  await Promise.all(attachPromises);
  
  // Return updated note with tags
  const updatedTags = await tagRepo.getNoteTags(noteId);
  return updatedTags;
};

// REMOVE TAG FROM NOTE
export const removeTagFromNote = async (noteId, userId, tagId) => {
  // Verify note exists and belongs to user
  const note = await noteRepo.getNoteById(noteId, userId);
  if (!note) {
    throw new AppError('Note not found', 404);
  }
  
  const removed = await tagRepo.removeTagFromNote(noteId, tagId);
  
  if (!removed) {
    throw new AppError('Tag not attached to this note', 404);
  }
  
  return {
    message: 'Tag removed from note',
    noteId,
    tagId,
  };
};

// REPLACE ALL NOTE TAGS
export const replaceNoteTags = async (noteId, userId, tagNames) => {
  const validatedTags = validateTagArray(tagNames);
  
  // Verify note exists and belongs to user
  const note = await noteRepo.getNoteById(noteId, userId);
  if (!note) {
    throw new AppError('Note not found', 404);
  }
  
  // Create or get all tags
  const tagPromises = validatedTags.map(name => tagRepo.findOrCreateTag(name));
  const tags = await Promise.all(tagPromises);
  
  // Replace all tags atomically
  const tagIds = tags.map(t => t.id);
  const updatedTags = await tagRepo.replaceNoteTags(noteId, tagIds);
  
  return updatedTags;
};

// GET NOTES BY TAGS
export const getNotesByTags = async (userId, tagIds, queryParams) => {
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    throw new AppError('At least one tag ID is required', 400);
  }
  
  const { page = 1, limit = 20, matchAll = false } = queryParams;
  
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const offset = (parsedPage - 1) * parsedLimit;
  
  const shouldMatchAll = matchAll === 'true' || matchAll === true;
  
  const [notes, total] = await Promise.all([
    tagRepo.getNotesByTags(userId, tagIds, { 
      limit: parsedLimit, 
      offset,
      matchAll: shouldMatchAll,
    }),
    tagRepo.countNotesByTags(userId, tagIds, shouldMatchAll),
  ]);
  
  return {
    notes,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      hasNextPage: parsedPage * parsedLimit < total,
      hasPrevPage: parsedPage > 1,
    },
    filters: {
      tagIds,
      matchAll: shouldMatchAll,
    },
  };
};