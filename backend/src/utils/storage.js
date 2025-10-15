import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const APP_DIR = '.myphotos';

// Get storage path for the application
export async function getStoragePath() {
  try {
    const configPath = path.join(os.homedir(), APP_DIR, 'config.json');
    try {
      const data = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(data);
      if (config.customStoragePath) {
        // Ensure the custom path exists
        await ensureDirectory(config.customStoragePath);
        return config.customStoragePath;
      }
    } catch (error) {
      // Config doesn't exist or is corrupt, use default
    }
  } catch (error) {
    // Error reading config, use default
  }
  
  // Default path in home directory
  const storagePath = path.join(os.homedir(), APP_DIR);
  await ensureDirectory(storagePath);
  return storagePath;
}

// Get backup drive path from config
export async function getBackupDrivePath() {
  try {
    const configPath = path.join(await getStoragePath(), 'config.json');
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    return config.backupDrive;
  } catch {
    return null;
  }
}

// Create directory if it doesn't exist
export async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
  return dirPath;
}