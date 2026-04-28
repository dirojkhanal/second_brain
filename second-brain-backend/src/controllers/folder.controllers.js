import * as folderRepo from '../repositories/folder.repository.js';

// CREATE FOLDER 
 export const createFolder = async(req, res) =>{
    const { name } = req.body;
    const userId = req.user.id;

    const folder = await folderRepo.createFolder(name, userId);
    res.status(201).json({
        status: 'success',
        message : 'Folder created successfully',
        data: {folder},
    });
 };

 //get all folders 
 export const getAllFolders = async(req, res) => {
    const userId = req.user.id;

    const folders = await folderRepo.getAllFolders(userId);
    res.status(200).json({
        status: 'success',
        data: {folders},
    });
 };

 //get single folders
  export const getFolder = async (req,res) =>{
   const {folderId} = req.params;
   const userId = req.user.id;
   const folder = await folderRepo.getSingleFolder(folderId, userId);
   res.status(200).json({
    status: 'success',
    data: {folder},
   });
 };
  
 //update folder 

 export const updateFolder = async (req,res) => {
   const {folderId} = req.params;
   const {name} = req.body;
   const userId = req.user.id;

   const folder = await folderRepo.updateFolder(folderId, userId, name);
   res.status(200).json({
    status: 'success',
    message: 'Folder updated successfully',
    data: {folder},
   });
 };

   //delete folder
   export const deleteFolder = async (req,res) => {
      const {folderId} = req.params;
      const userId = req.user.id;

      await folderRepo.deleteFolder(folderId, userId);
      res.status(200).json({
         status: 'success',
         message: 'Folder deleted successfully',
         data : {id : result.id},
      });
   };