import * as noteRepo from '../repositories/note.repository.js';
import { AppError } from '../utils/appError.js';

export const createNote = async ({ userId, title, content }) => {
    if (!title || !content) {
        throw new AppError('Title and content are required', 400);
    }
    const note = await noteRepo.createNote(
        {
            userId,
            title,
            content
        })
    return note;

}