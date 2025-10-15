import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getStoragePath } from '../utils/storage.js';

async function fixPhotoStorage() {
  try {
    // Get the current storage path
    const storagePath = await getStoragePath();
    console.log(`Current storage path: ${storagePath}`);
    
    // Check for photos.json in current storage path
    try {
      await fs.access(path.join(storagePath, 'photos.json'));
      console.log('photos.json exists in current storage path');
    } catch (err) {
      console.log('photos.json does NOT exist in current storage path');
      
      // Check for photos.json in default location
      const defaultPath = path.join(os.homedir(), '.myphotos');
      console.log(`Checking default path: ${defaultPath}`);
      
      try {
        await fs.access(path.join(defaultPath, 'photos.json'));
        console.log('photos.json found in default location');
        
        // Copy the file to the current storage path
        console.log('Copying photos.json to current storage path...');
        const photosData = await fs.readFile(path.join(defaultPath, 'photos.json'), 'utf8');
        await fs.writeFile(path.join(storagePath, 'photos.json'), photosData, 'utf8');
        console.log('Successfully copied photos.json');
        
        // Now check if photo files exist in the default location
        const photos = JSON.parse(photosData);
        console.log(`Found ${photos.length} photos in the database`);
        
        if (photos.length > 0) {
          console.log('Checking if photo files need to be moved...');
          
          for (const photo of photos) {
            const sourcePhotoPath = path.join(defaultPath, photo.filename);
            const destPhotoPath = path.join(storagePath, photo.filename);
            
            try {
              await fs.access(sourcePhotoPath);
              console.log(`Photo exists in default location: ${photo.filename}`);
              
              try {
                await fs.access(destPhotoPath);
                console.log(`Photo already exists in storage path: ${photo.filename}`);
              } catch (err) {
                console.log(`Moving photo to storage path: ${photo.filename}`);
                await fs.copyFile(sourcePhotoPath, destPhotoPath);
                console.log('Successfully moved photo');
              }
            } catch (err) {
              console.log(`Photo does not exist in default location: ${photo.filename}`);
            }
            
            // Also check/move thumbnail
            if (photo.thumbnail) {
              const sourceThumbnailPath = path.join(defaultPath, photo.thumbnail);
              const destThumbnailPath = path.join(storagePath, photo.thumbnail);
              
              try {
                await fs.access(sourceThumbnailPath);
                console.log(`Thumbnail exists in default location: ${photo.thumbnail}`);
                
                try {
                  await fs.access(destThumbnailPath);
                  console.log(`Thumbnail already exists in storage path: ${photo.thumbnail}`);
                } catch (err) {
                  console.log(`Moving thumbnail to storage path: ${photo.thumbnail}`);
                  await fs.copyFile(sourceThumbnailPath, destThumbnailPath);
                  console.log('Successfully moved thumbnail');
                }
              } catch (err) {
                console.log(`Thumbnail does not exist in default location: ${photo.thumbnail}`);
              }
            }
            
            // Check/move original file if exists
            if (photo.originalFilename) {
              const sourceOriginalPath = path.join(defaultPath, photo.originalFilename);
              const destOriginalPath = path.join(storagePath, photo.originalFilename);
              
              try {
                await fs.access(sourceOriginalPath);
                console.log(`Original file exists in default location: ${photo.originalFilename}`);
                
                try {
                  await fs.access(destOriginalPath);
                  console.log(`Original file already exists in storage path: ${photo.originalFilename}`);
                } catch (err) {
                  console.log(`Moving original file to storage path: ${photo.originalFilename}`);
                  await fs.copyFile(sourceOriginalPath, destOriginalPath);
                  console.log('Successfully moved original file');
                }
              } catch (err) {
                console.log(`Original file does not exist in default location: ${photo.originalFilename}`);
              }
            }
            
            // Check/move motion file if exists
            if (photo.motionFilename) {
              const sourceMotionPath = path.join(defaultPath, photo.motionFilename);
              const destMotionPath = path.join(storagePath, photo.motionFilename);
              
              try {
                await fs.access(sourceMotionPath);
                console.log(`Motion file exists in default location: ${photo.motionFilename}`);
                
                try {
                  await fs.access(destMotionPath);
                  console.log(`Motion file already exists in storage path: ${photo.motionFilename}`);
                } catch (err) {
                  console.log(`Moving motion file to storage path: ${photo.motionFilename}`);
                  await fs.copyFile(sourceMotionPath, destMotionPath);
                  console.log('Successfully moved motion file');
                }
              } catch (err) {
                console.log(`Motion file does not exist in default location: ${photo.motionFilename}`);
              }
            }
          }
          
          console.log('All photos processed');
        }
      } catch (err) {
        console.log('photos.json not found in default location either');
        
        // Create a new empty photos.json
        console.log('Creating empty photos.json in storage path');
        await fs.writeFile(path.join(storagePath, 'photos.json'), '[]', 'utf8');
        console.log('Created empty photos.json');
      }
    }
    
    console.log('Fix completed');
  } catch (err) {
    console.error('Error fixing photo storage:', err);
  }
}

fixPhotoStorage().catch(console.error);