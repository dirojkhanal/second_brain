import * as noteRepo from '../repositories/note.repository.js';
import { AppError } from '../utils/appError.js';

export const createNote = async ({ userId, title, content }) => {
    if (!title || !content) {
        throw new AppError('Title and content are required', 400);
    }
    const notes = await noteRepo.createNote(
        {
            userId,
            title,
            content
        })
    return notes;

}

//get all notes by users 
export const getAllNote = async (userId) => {
    const notes = await noteRepo.getAllNotesByUser(userId);
    return notes;
};

//GET SINGLE NOTES 
export const getNote = async (noteId, userId) => {
    const notes = await noteRepo.getNoteById(noteId, userId);

    if (!notes) {
        throw new AppError('Note not found', 404);
    }
    return notes;
};

//Update Notes

export const updateNote = async ({ noteId, userId, title, content }) => {
    //check if note exists
    const existingNote = await noteRepo.getNoteById(noteId, userId);
    if (!existingNote) throw new AppError('Note not found', 404);
    if (!title && !content) throw new AppError('Nothing to update', 400);

    const updateNote = await noteRepo.updateNote(
        noteId,
        userId,
        {
            title,
            content
        }
    );

    return updateNote;

}


//DELETE NOTES 

export const deleteNote = async (noteId, userId) => {

    const existingNote = await noteRepo.getNoteById(noteId ,userId);
    if(!existingNote) throw new AppError('Note not found', 404);

    await noteRepo.deleteNote(noteId, userId);
    return {
        message: 'Note deleted successfully'
    }

};

// SEARCH NOTES 
export const searchNote = async (userId, query ) => {
    if (!query) throw new AppError ('Query is required', 400);

    const notes = await noteRepo.searchNotes(userId, query);
    return notes;

};

// ARCHIVE NOTE
export const toggleArchive = async ({ noteId, userId }) => {
  const existingNote = await noteRepo.getNoteById(noteId, userId);

  if (!existingNote) {
    throw new AppError('Note not found', 404);
  }

  const updatedNote = await noteRepo.toggleArchiveNote(noteId, userId);

  return updatedNote;
};