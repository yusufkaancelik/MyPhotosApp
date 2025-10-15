import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getStoragePath } from '../utils/storage.js';

async function testFilePermissions() {
  try {
    // Get the configured storage path
    const storagePath = await getStoragePath();
    console.log(`Using storage path: ${storagePath}`);
    
    // Create a test file
    const testFilePath = path.join(storagePath, 'test-permissions.txt');
    console.log(`Creating test file at: ${testFilePath}`);
    
    try {
      // Write test file
      await fs.writeFile(testFilePath, 'This is a test file for permissions check', 'utf8');
      console.log('Successfully wrote test file');
      
      // Try to read it
      const content = await fs.readFile(testFilePath, 'utf8');
      console.log(`Successfully read test file: ${content.substring(0, 20)}...`);
      
      // Try to delete it
      await fs.unlink(testFilePath);
      console.log('Successfully deleted test file');
    } catch (err) {
      console.error(`Error working with test file: ${err.message}`);
      if (err.code === 'EPERM') {
        console.error('PERMISSION DENIED: The application does not have permission to delete files in this directory');
      }
    }
    
    // Check if photos.json exists and try to list a few photos
    const photosJsonPath = path.join(storagePath, 'photos.json');
    try {
      const photosData = await fs.readFile(photosJsonPath, 'utf8');
      const photos = JSON.parse(photosData);
      console.log(`Found ${photos.length} photos in the database`);
      
      // Check the first few photos
      if (photos.length > 0) {
        for (let i = 0; i < Math.min(photos.length, 3); i++) {
          const photo = photos[i];
          console.log(`\nPhoto ${i+1}:`, {
            id: photo.id,
            filename: photo.filename,
            originalFilename: photo.originalFilename,
            thumbnail: photo.thumbnail
          });
          
          // Check if files actually exist
          const filesToCheck = [
            { type: 'Main file', path: path.join(storagePath, photo.filename) },
            { type: 'Thumbnail', path: path.join(storagePath, photo.thumbnail) }
          ];
          
          if (photo.originalFilename) {
            filesToCheck.push({ 
              type: 'Original file', 
              path: path.join(storagePath, photo.originalFilename) 
            });
          }
          
          if (photo.motionFilename) {
            filesToCheck.push({ 
              type: 'Motion file', 
              path: path.join(storagePath, photo.motionFilename) 
            });
          }
          
          for (const file of filesToCheck) {
            try {
              await fs.access(file.path);
              console.log(`✓ ${file.type} exists: ${file.path}`);
            } catch (err) {
              console.error(`✗ ${file.type} does not exist: ${file.path}`);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error reading photos database: ${err.message}`);
    }
  } catch (err) {
    console.error('Error in permissions test:', err);
  }
}

testFilePermissions().catch(console.error);