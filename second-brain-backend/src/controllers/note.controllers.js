import { query } from '../db/index.js';
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

//SEARCH NOTES
export const searchNotes = async (req,res) => {
    const userId = req.user.id;
const result = await noteService.searchNotes(userId, req.query);

res.status(200).json({
    status: 'success',
    data: {
        notes :result.notes,
        query: result.query,
        pagination: result.pagination
    }
})
};
// TOGGLE ARCHIVE
export const toggleArchive = async (req, res) => {
  const { noteId } = req.params;
  const userId = req.user.id;
  
  const note = await noteService.toggleArchive({ noteId, userId });
  
  res.status(200).json({
    status: 'success',
    message: `Note ${note.is_archived ? 'archived' : 'unarchived'} successfully`,
    data: { note },
  });
};

// BATCH DELETE NOTES
export const batchDeleteNotes = async (req, res) => {
  const { noteIds } = req.body;
  const userId = req.user.id;
  
  const result = await noteService.batchDeleteNotes(userId, noteIds);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
    data: {
      deletedCount: result.deletedCount,
      deletedIds: result.deletedIds,
    },
  });
};
//Batch Archive Notes
export const batchArchiveNotes = async (req, res) => {
  const { noteIds, archive = true } = req.body;
  const userId = req.user.id;
  
  const result = await noteService.batchArchiveNotes(userId, noteIds, archive);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
    data: {
      affectedCount: result.affectedCount,
      affectedIds: result.affectedIds,
    },
  });
};
// GET RECENT NOTES
export const getRecentNotes = async (req, res) => {
  const userId = req.user.id;
  const { days = 7 } = req.query;
  
  const result = await noteService.getRecentNotes(userId, days);
  
  res.status(200).json({
    status: 'success',
    data: {
      notes: result.notes,
      days: result.days,
    },
  });
};