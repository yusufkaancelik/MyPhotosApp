import express from 'express';
import multer from 'multer';
import { processUpload, getAllPhotos, getPhotoById, getPhotoFile, checkDuplicate, deletePhoto, deleteMultiplePhotos } from '../services/photoService.js';
import path from 'path';

export const photoRouter = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all photos
photoRouter.get('/', async (req, res) => {
  try {
    const photos = await getAllPhotos();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single photo by ID
photoRouter.get('/:id', async (req, res) => {
  try {
    const photo = await getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get photo file by ID
photoRouter.get('/:id/file', async (req, res) => {
  try {
    const { filePath, contentType } = await getPhotoFile(req.params.id);
    res.type(contentType);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get motion part of a Live Photo
photoRouter.get('/:id/motion', async (req, res) => {
  try {
    const photo = await getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    if (!photo.metadata?.isLivePhoto || !photo.motionFilename) {
      return res.status(404).json({ error: 'Not a Live Photo or no motion data available' });
    }
    
    const { filePath, contentType } = await getPhotoFile(req.params.id, { motion: true });
    res.type(contentType);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download photo
photoRouter.get('/:id/download', async (req, res) => {
  try {
    const photo = await getPhotoById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Always use original file for download to preserve metadata
    const { filePath } = await getPhotoFile(req.params.id, { original: true });
    
    // Set content disposition to ensure the file downloads with its original name
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(photo.originalName)}"`);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if photo is duplicate
photoRouter.post('/check-duplicate', upload.single('photo'), async (req, res) => {
  try {
    const isDuplicate = await checkDuplicate(req.file);
    res.json({ isDuplicate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload new photo(s)
photoRouter.post('/upload', upload.array('photos'), async (req, res) => {
  try {
    const results = [];
    
    // Process files sequentially instead of in parallel
    for (const file of req.files) {
      try {
        const isDuplicate = await checkDuplicate(file);
        if (isDuplicate) {
          results.push({ error: 'Duplicate photo', originalName: file.originalname });
          continue;
        }
        
        const result = await processUpload(file);
        results.push(result);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        results.push({ error: error.message, originalName: file.originalname });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a single photo
photoRouter.delete('/:id', async (req, res) => {
  try {
    const result = await deletePhoto(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete multiple photos
photoRouter.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Photo IDs array is required' });
    }
    
    const results = await deleteMultiplePhotos(ids);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});