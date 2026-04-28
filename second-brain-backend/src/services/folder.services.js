import * as folderRepo from '../repositories/folder.repository.js';
import { AppError } from '../utils/appError.js';

const MAX_NAME_LENGTH = 255;
const MIN_NAME_LENGTH = 1;

// VALIDATE FOLDER NAME
 const validateFolderName = (name) => {
    const trimmed = name.trim();
    if(!trimmed || trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH){
        throw new AppError(`Folder name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`, 400);
    }
    return trimmed;
 };

 // CREATE FOLDER 
 export const createFolder = async() => {
    const validateName = validateFolderName(name);

    //check for duplicate folder name 
    const exists = await folderRepo.folderNameExists(userId , validateName);
    if(exists) {
        throw new AppError('A folder with this name already exists', 409);
    };
    const folder = await folderRepo.createFolder(userId,validateName);
    return folder;

 };

 // GET USER FOLDERS
 export const getUsersFolders = async(userId)=>{

    const folders = await folderRepo.getUserFolders(userId);
    return folders;

 };
//get single folder 

const getSingleFolder = async (folderId, userId) => {
    const folder = await folderRepo.getFolderWithStats(folderId, userId);
    if(!folder) {
        throw new AppError('Folder not found', 404);
    }
    return folder;
};
// UPDATE FOLDER
export const updateFolder = async (folderId, userId, name) => {
  const validatedName = validateFolderName(name);
  
  // Check folder exists
  const existing = await folderRepo.getFolderById(folderId, userId);
  if (!existing) {
    throw new AppError('Folder not found', 404);
  }
  
  // Check for duplicate name (excluding current folder)
  const exists = await folderRepo.folderNameExists(userId, validatedName, folderId);
  if (exists) {
    throw new AppError('A folder with this name already exists', 409);
  }
  
  const folder = await folderRepo.updateFolder(folderId, userId, validatedName);
  return folder;
};

// DELETE FOLDER
// DELETE FOLDER
export const deleteFolder = async (folderId, userId) => {
  const existing = await folderRepo.getFolderById(folderId, userId);
  
  if (!existing) {
    throw new AppError('Folder not found', 404);
  }
  
  await folderRepo.deleteFolder(folderId, userId);
  
  return {
    message: 'Folder deleted successfully. Notes moved to uncategorized.',
    id: folderId,
  };
};