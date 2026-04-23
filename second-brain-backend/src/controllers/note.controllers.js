import * as noteService from '../services/note.services.js';
import { AppError } from '../utils/appError.js';

//CREATE NOTES 

export const createNote = async (req, res) => {
    const {title , content} = req.body;
    const userId = req.user.id;

    const note = await noteService.createNote({
        userId,
        title,
        content
    });

    res.status(201).json({
        status: 'success',
        data: {
            note
        }
    })
};

//get all notes 
export const getAllNotes = async (req, res) => {
    const userId = req.user.id;

    const result = await noteService.getAllNotes(userId ,req.query);
    res.status(200).json({
        status: 'success',
        data: {
            notes :result.notes,
            pagination: result.pagination
        }
    })
};

//GET SINGLE NOTES 
export const getNote = async(req, res) => {
    const {noteId} = req.params;
    const userId = req.user.id;

    const note = await noteService.getNote(noteId, userId);
    
    res.status(200).json({
        status: 'success',
        data: {
            note
        }
    })

};

//UPDATE NOTES 
export const updateNote = async(req, res) => {
    const {noteId} = req.params;
    const userId = req.user.id;
    const {title , content} = req.body;

    const note = await noteService.updateNote({
        noteId,
        userId,
        title,
        content
    });

    res.status(200).json({
        status: 'success',
        message : 'Note updated successfully',
        data: {
            note
        }
    })
};

//DELETE NOTES 
export const deleteNote = async (req,res) =>{
    const {noteId} = req.params;
    const userId = req.user.id;

    const result = await noteService.deleteNote(noteId, userId);

    res.status(204).json({
        status: 'success',
        message : result.message,
        data :{
            id : result.id
        }
    })
};