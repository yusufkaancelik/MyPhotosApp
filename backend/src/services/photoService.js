import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import exifr from 'exifr';
import crypto from 'crypto';
import os from 'os';
import { getStoragePath } from '../utils/storage.js';

// Calculate file hash for duplicate detection
async function calculateFileHash(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Check if photo is a duplicate
export async function checkDuplicate(file) {
  try {
    const hash = await calculateFileHash(file.path);
    const photos = await getAllPhotos();
    return photos.some(photo => photo.hash === hash);
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return false;
  }
}

// Process uploaded media (photo or video)
export async function processUpload(file) {
  try {
    const storagePath = await getStoragePath();
    const hash = await calculateFileHash(file.path);
    const ext = path.extname(file.originalname).toLowerCase();
    const isVideo = ['.mp4', '.mov', '.m4v', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.3gp'].includes(ext);
    
    // Generate unique filename
    const filename = generateUniqueFilename(file.originalname);
    const destination = path.join(storagePath, filename);
    
    // Save original file
    const originalFilename = `original_${filename}`;
    const originalDestination = path.join(storagePath, originalFilename);
    await fs.copyFile(file.path, originalDestination);
    
    let metadata = {};
    let thumbnail = null;
    
    if (!isVideo) {
      // Process image and create thumbnail for photos
      metadata = await getPhotoMetadata(file.path);
      await processImage(file.path, destination);
      thumbnail = await createThumbnail(file.path, storagePath, filename);
    } else {
      // For videos, just copy the file and try to get video metadata
      await fs.copyFile(file.path, destination);
      
      try {
        const { videoMetadata, thumbnailName } = await processVideo(file.path, storagePath, filename);
        metadata = {
          type: 'video',
          mimeType: getContentType(ext),
          originalName: file.originalname,
          ...videoMetadata
        };
        thumbnail = thumbnailName;
      } catch (error) {
        console.error('Error processing video:', error);
        metadata = {
          type: 'video',
          mimeType: getContentType(ext),
          originalName: file.originalname,
          error: 'Failed to process video metadata'
        };
        thumbnail = 'default_video_thumb.png';
      }
    }
    
    // Save media info to database/storage
    const mediaInfo = {
      id: path.parse(filename).name,
      filename,
      originalFilename,
      originalName: file.originalname,
      thumbnail,
      metadata,
      hash,
      isVideo,
      createdAt: new Date(),
    };
    
    // Check for Live Photo companion file
    if (file.originalname.toLowerCase().endsWith('.jpg') || 
        file.originalname.toLowerCase().endsWith('.jpeg') ||
        file.originalname.toLowerCase().endsWith('.heic')) {
      const baseName = path.parse(file.originalname).name;
      const possibleMovPaths = [
        path.join(path.dirname(file.path), `${baseName}.mov`),
        path.join(path.dirname(file.path), `${baseName}.MOV`)
      ];
      
      for (const movPath of possibleMovPaths) {
        try {
          await fs.access(movPath);
          // Found companion file, save it
          const motionFilename = `motion_${filename.replace(/\.[^.]+$/, '.mov')}`;
          const motionDestination = path.join(storagePath, motionFilename);
          await fs.copyFile(movPath, motionDestination);
          photoInfo.motionFilename = motionFilename;
          photoInfo.metadata.isLivePhoto = true;
          break;
        } catch (err) {
          // No companion file found
        }
      }
    }
    
    await savePhotoInfo(mediaInfo);
    await fs.unlink(file.path); // Clean up temp file
    
    return mediaInfo;
  } catch (error) {
    console.error('Error processing upload:', error);
    throw error;
  }
}

// Get metadata from photo
async function getPhotoMetadata(filePath) {
  try {
    // Use exifr with more options to extract all possible metadata
    const metadata = await exifr.parse(filePath, { tiff: true, xmp: true, icc: true, iptc: true, jfif: true });
    const fullMetadata = await exifr.parse(filePath, { mergeOutput: false });
    
    // Check for Live Photo indicators
    // Apple Live Photos contain a 'MotionPhotoVideo' or 'MicroVideo' tag in the XMP namespace
    // or they have specific Apple maker notes
    const isLivePhoto = checkIfLivePhoto(filePath, metadata, fullMetadata);
    
    return {
      dateTaken: metadata?.DateTimeOriginal || metadata?.CreateDate || null,
      make: metadata?.Make || null,
      model: metadata?.Model || null,
      gps: metadata?.GPSInfo ? {
        latitude: metadata.latitude,
        longitude: metadata.longitude
      } : null,
      isLivePhoto,
      orientation: metadata?.Orientation || 1,
      // Store all original metadata for later use
      originalMetadata: metadata
    };
  } catch (error) {
    console.warn('Error reading EXIF data:', error);
    return {};
  }
}

// Check if a photo is a Live Photo
async function checkIfLivePhoto(filePath, metadata, fullMetadata) {
  try {
    // Check common Live Photo indicators
    if (metadata && 
        (metadata.MotionPhotoVideo || 
         metadata.MicroVideo || 
         (metadata.apple && metadata.apple.LivePhotoID) ||
         (metadata.xmp && metadata.xmp.MotionPhoto))) {
      return true;
    }
    
    // Check for paired video file (.mov) for Apple Live Photos
    const fileInfo = path.parse(filePath);
    const possibleVideoPath = path.join(
      fileInfo.dir, 
      `${fileInfo.name}.mov`
    );
    
    try {
      await fs.access(possibleVideoPath);
      return true;
    } catch {
      // No paired video file found
    }
    
    return false;
  } catch (error) {
    console.warn('Error checking for Live Photo:', error);
    return false;
  }
}

// Process image and save to destination
async function processImage(sourcePath, destinationPath) {
  await sharp(sourcePath)
    .rotate() // Auto-rotate based on EXIF data
    .withMetadata() // Preserve all metadata
    .toFile(destinationPath);
}

// Create thumbnail
async function createThumbnail(sourcePath, storagePath, filename) {
  const thumbnailName = `thumb_${filename}`;
  const thumbnailPath = path.join(storagePath, thumbnailName);
  
  await sharp(sourcePath)
    .resize(300, 300, {
      fit: 'cover',
      withoutEnlargement: true
    })
    .withMetadata() // Preserve all metadata
    .toFile(thumbnailPath);
  
  return thumbnailName;
}

// Process video file
async function processVideo(sourcePath, storagePath, filename) {
  const { createVideoThumbnail, getVideoMetadata } = await import('./videoService.js');
  
  // Generate video thumbnail
  const thumbnailName = await createVideoThumbnail(sourcePath, filename);
  
  // Get video metadata
  const videoMetadata = await getVideoMetadata(sourcePath);
  
  return { videoMetadata, thumbnailName };
}

// Save photo information with retries and locking
async function savePhotoInfo(photoInfo) {
  const photosFile = path.join(await getStoragePath(), 'photos.json');
  const lockFile = path.join(await getStoragePath(), '.photos.lock');
  const maxRetries = 5;
  const retryDelay = 100; // ms
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check for lock file
      try {
        await fs.access(lockFile);
        // Lock exists, wait and retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      } catch (err) {
        // Lock doesn't exist, create it
        await fs.writeFile(lockFile, '');
      }
      
      // Read current photos
      let photos = [];
      try {
        const data = await fs.readFile(photosFile, 'utf8');
        photos = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet or is corrupt
        console.warn('Failed to read photos.json, creating new one:', error);
      }
      
      // Add new photo and save
      photos.push(photoInfo);
      await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
      
      // Remove lock file
      await fs.unlink(lockFile);
      
      // Success
      return;
    } catch (error) {
      console.error(`Failed to save photo info (attempt ${attempt + 1}):`, error);
      // Try to remove lock file in case of error
      try {
        await fs.unlink(lockFile);
      } catch (err) {
        // Ignore error removing lock file
      }
    }
  }
  
  throw new Error('Failed to save photo info after multiple attempts');
}

// Get all photos
export async function getAllPhotos() {
  try {
    const photosFile = path.join(await getStoragePath(), 'photos.json');
    const data = await fs.readFile(photosFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Get single photo by ID
export async function getPhotoById(id) {
  const photos = await getAllPhotos();
  return photos.find(photo => photo.id === id);
}

// Get photo file details
export async function getPhotoFile(id, options = {}) {
  const photo = await getPhotoById(id);
  if (!photo) {
    throw new Error('Photo not found');
  }

  const storagePath = await getStoragePath();
  let filename = photo.filename;
  
  // Use original file if requested and available
  if (options.original && photo.originalFilename) {
    filename = photo.originalFilename;
  }
  
  // Use motion file if requested and available
  if (options.motion && photo.motionFilename) {
    filename = photo.motionFilename;
  }
  
  const filePath = path.join(storagePath, filename);
  const contentType = getContentType(filePath);

  return {
    filePath,
    contentType,
    originalName: photo.originalName,
    isLivePhoto: photo.metadata?.isLivePhoto || false,
    hasMotion: !!photo.motionFilename
  };
}

// Determine content type based on file extension
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    // Image formats
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    
    // Video formats
    '.mov': 'video/quicktime',
    '.mp4': 'video/mp4',
    '.m4v': 'video/x-m4v',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.3gp': 'video/3gpp',
    
    // Raw formats
    '.cr2': 'image/x-canon-cr2',
    '.nef': 'image/x-nikon-nef',
    '.arw': 'image/x-sony-arw',
    '.dng': 'image/x-adobe-dng'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Generate unique filename
function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName);
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

// Delete photo by ID
export async function deletePhoto(id) {
  try {
    const storagePath = await getStoragePath();
    const photosFile = path.join(storagePath, 'photos.json');
    
    // Read current photos
    let photos = [];
    try {
      const data = await fs.readFile(photosFile, 'utf8');
      photos = JSON.parse(data);
    } catch (error) {
      throw new Error('Failed to read photos database');
    }
    
    // Find photo to delete
    const photoIndex = photos.findIndex(photo => photo.id === id);
    if (photoIndex === -1) {
      throw new Error('Photo not found');
    }
    
    const photo = photos[photoIndex];
    
    // Delete the photo file, thumbnail, original, and motion files if they exist
    const photoPath = path.join(storagePath, photo.filename);
    const thumbnailPath = path.join(storagePath, photo.thumbnail);
    const filesToDelete = [photoPath, thumbnailPath];
    
    // Add original file if it exists
    if (photo.originalFilename) {
      filesToDelete.push(path.join(storagePath, photo.originalFilename));
    }
    
    // Add motion file if it exists
    if (photo.motionFilename) {
      filesToDelete.push(path.join(storagePath, photo.motionFilename));
    }
    
    // Log detailed info for debugging
    console.log(`[DELETE] Deleting photo ID: ${id}`);
    console.log(`[DELETE] Storage path: ${storagePath}`);
    console.log(`[DELETE] Files to delete: ${JSON.stringify(filesToDelete)}`);
    
    // Check if files exist before trying to delete
    for (const file of filesToDelete) {
      try {
        const stats = await fs.stat(file);
        console.log(`[DELETE] File exists: ${file} (Size: ${stats.size} bytes)`);
      } catch (err) {
        console.log(`[DELETE] File does not exist: ${file} (${err.code})`);
        
        // Try to check in the default location as well
        try {
          const defaultPath = path.join(os.homedir(), '.myphotos');
          const defaultFilePath = path.join(defaultPath, path.basename(file));
          const stats = await fs.stat(defaultFilePath);
          console.log(`[DELETE] File exists in DEFAULT path: ${defaultFilePath} (Size: ${stats.size} bytes)`);
          
          // Add the default path version to files to delete
          filesToDelete.push(defaultFilePath);
        } catch (defaultErr) {
          // File doesn't exist in default path either
        }
      }
    }
    
    // Now actually delete the files
    try {
      const deleteResults = await Promise.all(filesToDelete.map(async file => {
        try {
          await fs.unlink(file);
          console.log(`[DELETE] Successfully deleted: ${file}`);
          return { file, success: true };
        } catch (err) {
          console.warn(`[DELETE] Could not delete file ${file}: ${err.message} (${err.code})`);
          return { file, success: false, error: err.message, code: err.code };
        }
      }));
      
      console.log(`[DELETE] Delete results: ${JSON.stringify(deleteResults)}`);
    } catch (error) {
      console.error(`[DELETE] Error during file deletion for photo ${id}: ${error.message}`);
    }
    
    // Remove the photo from the database
    photos.splice(photoIndex, 1);
    
    // Save updated photos database
    await fs.writeFile(photosFile, JSON.stringify(photos, null, 2));
    
    return { success: true, id };
  } catch (error) {
    console.error(`Error deleting photo ${id}:`, error);
    throw error;
  }
}

// Delete multiple photos by IDs
export async function deleteMultiplePhotos(ids) {
  try {
    const results = [];
    for (const id of ids) {
      try {
        await deletePhoto(id);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  } catch (error) {
    console.error('Error deleting multiple photos:', error);
    throw error;
  }
}