import express from 'express';
import { 
  getDrives, 
  setBackupDrive, 
  getComputerId, 
  getComputerName,
  setMainComputer,
  isMainComputer,
  setCustomStoragePath,
  getConfiguration
} from '../services/driveService.js';

export const driveRouter = express.Router();

// Get available drives
driveRouter.get('/', async (req, res) => {
  try {
    const drives = await getDrives();
    res.json(drives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set backup drive
driveRouter.post('/backup', async (req, res) => {
  try {
    const { drivePath } = req.body;
    if (!drivePath) {
      return res.status(400).json({ error: 'Drive path is required' });
    }
    
    const result = await setBackupDrive(drivePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current computer info
driveRouter.get('/computer', async (req, res) => {
  try {
    const id = await getComputerId();
    const name = await getComputerName();
    const mainStatus = await isMainComputer();
    
    res.json({
      id,
      name,
      isMainComputer: mainStatus.isMainComputer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set this as the main computer
driveRouter.post('/main-computer', async (req, res) => {
  try {
    const { isMain = true } = req.body;
    const result = await setMainComputer(isMain);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set custom storage path
driveRouter.post('/storage-path', async (req, res) => {
  try {
    const { storagePath } = req.body;
    if (!storagePath) {
      return res.status(400).json({ error: 'Storage path is required' });
    }
    
    const result = await setCustomStoragePath(storagePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get complete configuration
driveRouter.get('/config', async (req, res) => {
  try {
    const config = await getConfiguration();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});