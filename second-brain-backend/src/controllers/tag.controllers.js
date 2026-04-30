import * as tagService from '../services/tag.services.js';

// CREATE TAG
export const createTag = async (req, res) => {
  const { name } = req.body;
  
  const tag = await tagService.createTag(name);
  
  res.status(201).json({
    status: 'success',
    message: 'Tag created successfully',
    data: { tag },
  });
};

// GET ALL TAGS
export const getAllTags = async (req, res) => {
  const tags = await tagService.getAllTags(req.query);
  
  res.status(200).json({
    status: 'success',
    data: { tags },
  });
};

// GET USER'S TAGS
export const getUserTags = async (req, res) => {
  const userId = req.user.id;
  
  const tags = await tagService.getUserTags(userId, req.query);
  
  res.status(200).json({
    status: 'success',
    data: { tags },
  });
};

// AUTOCOMPLETE TAGS
export const autocomplete = async (req, res) => {
  const { q } = req.query;
  
  const tags = await tagService.autocomplete(q);
  
  res.status(200).json({
    status: 'success',
    data: { tags },
  });
};

// GET TAG BY ID
export const getTag = async (req, res) => {
  const { tagId } = req.params;
  
  const tag = await tagService.getTag(tagId);
  
  res.status(200).json({
    status: 'success',
    data: { tag },
  });
};

// DELETE TAG
export const deleteTag = async (req, res) => {
  const { tagId } = req.params;
  
  const result = await tagService.deleteTag(tagId);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
    data: { id: result.id },
  });
};

// ATTACH TAGS TO NOTE
export const attachTagsToNote = async (req, res) => {
  const { noteId } = req.params;
  const { tags } = req.body;
  const userId = req.user.id;
  
  const updatedTags = await tagService.attachTagsToNote(noteId, userId, tags);
  
  res.status(200).json({
    status: 'success',
    message: 'Tags attached to note',
    data: { tags: updatedTags },
  });
};

// REMOVE TAG FROM NOTE
export const removeTagFromNote = async (req, res) => {
  const { noteId, tagId } = req.params;
  const userId = req.user.id;
  
  const result = await tagService.removeTagFromNote(noteId, userId, tagId);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
};

// REPLACE NOTE TAGS
export const replaceNoteTags = async (req, res) => {
  const { noteId } = req.params;
  const { tags } = req.body;
  const userId = req.user.id;
  
  const updatedTags = await tagService.replaceNoteTags(noteId, userId, tags);
  
  res.status(200).json({
    status: 'success',
    message: 'Note tags updated',
    data: { tags: updatedTags },
  });
};

// GET NOTES BY TAGS
export const getNotesByTags = async (req, res) => {
  const { tagIds } = req.body;
  const userId = req.user.id;
  
  const result = await tagService.getNotesByTags(userId, tagIds, req.query);
  
  res.status(200).json({
    status: 'success',
    data: result,
  });
};