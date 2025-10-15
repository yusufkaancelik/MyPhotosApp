import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getStoragePath, ensureDirectory } from '../utils/storage.js';
import { promisify } from 'util';
import pkg from 'node-machine-id';
const { machineId } = pkg;

const execAsync = promisify(exec);

// Get available drives on Windows
export async function getDrives() {
  try {
    const { stdout } = await execAsync('wmic logicaldisk get name,size,freespace,volumename /format:csv');
    
    const lines = stdout.trim().split('\n');
    const headers = lines[0].split(',');
    const drives = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        return {
          name: values[headers.indexOf('Name')].trim(),
          volumeName: values[headers.indexOf('VolumeName')].trim(),
          size: parseInt(values[headers.indexOf('Size')]) || 0,
          freeSpace: parseInt(values[headers.indexOf('FreeSpace')]) || 0,
        };
      });
    
    return drives;
  } catch (error) {
    console.error('Error getting drives:', error);
    throw new Error('Failed to get drives');
  }
}

// Set and initialize backup drive
export async function setBackupDrive(drivePath) {
  try {
    // Validate drive path
    await fs.access(drivePath);
    
    // Create photos directory if it doesn't exist
    const photosDir = path.join(drivePath, 'MyPhotos');
    await fs.mkdir(photosDir, { recursive: true });
    
    // Get current config or initialize new one
    const configPath = path.join(await getStoragePath(), 'config.json');
    let config = {};
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // File doesn't exist or is corrupt, continue with empty config
    }
    
    // Update config with backup drive
    config.backupDrive = drivePath;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    return { success: true, path: drivePath };
  } catch (error) {
    console.error('Error setting backup drive:', error);
    throw new Error('Failed to set backup drive');
  }
}

// Get the unique ID for this computer
export async function getComputerId() {
  try {
    const id = await machineId();
    return id;
  } catch (error) {
    console.error('Error getting machine ID:', error);
    throw new Error('Failed to get computer ID');
  }
}

// Get current computer name
export async function getComputerName() {
  try {
    const { stdout } = await execAsync('hostname');
    return stdout.trim();
  } catch (error) {
    console.error('Error getting computer name:', error);
    return 'Unknown Computer';
  }
}

// Set this computer as the main computer
export async function setMainComputer(isMain = true) {
  try {
    const configPath = path.join(await getStoragePath(), 'config.json');
    let config = {};
    
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // File doesn't exist or is corrupt, continue with empty config
    }
    
    // Update main computer settings
    if (isMain) {
      config.mainComputer = {
        id: await getComputerId(),
        name: await getComputerName(),
        setAt: new Date().toISOString()
      };
    } else {
      delete config.mainComputer;
    }
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    return { 
      success: true, 
      isMainComputer: isMain,
      ...(isMain ? { id: config.mainComputer.id, name: config.mainComputer.name } : {})
    };
  } catch (error) {
    console.error('Error setting main computer:', error);
    throw new Error('Failed to set main computer status');
  }
}

// Check if this is the main computer
export async function isMainComputer() {
  try {
    const configPath = path.join(await getStoragePath(), 'config.json');
    let config = {};
    
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      return { isMainComputer: false };
    }
    
    if (!config.mainComputer) {
      return { isMainComputer: false };
    }
    
    const currentId = await getComputerId();
    const isMain = config.mainComputer.id === currentId;
    
    return { 
      isMainComputer: isMain,
      computerInfo: isMain ? {
        id: config.mainComputer.id,
        name: config.mainComputer.name,
        setAt: config.mainComputer.setAt
      } : null,
      currentId,
      currentName: await getComputerName()
    };
  } catch (error) {
    console.error('Error checking main computer status:', error);
    throw new Error('Failed to check main computer status');
  }
}

// Set custom storage path
export async function setCustomStoragePath(storagePath) {
  try {
    // Validate the path exists or can be created
    try {
      await fs.access(storagePath);
    } catch {
      await fs.mkdir(storagePath, { recursive: true });
    }
    
    // Get current config or initialize new one
    const defaultConfigPath = path.join(os.homedir(), '.myphotos', 'config.json');
    let config = {};
    
    try {
      const configData = await fs.readFile(defaultConfigPath, 'utf8');
      config = JSON.parse(configData);
    } catch (error) {
      // File doesn't exist or is corrupt, continue with empty config
    }
    
    // Update custom storage path
    config.customStoragePath = storagePath;
    
    // Make sure the default config directory exists
    const defaultConfigDir = path.dirname(defaultConfigPath);
    try {
      await fs.access(defaultConfigDir);
    } catch {
      await fs.mkdir(defaultConfigDir, { recursive: true });
    }
    
    await fs.writeFile(defaultConfigPath, JSON.stringify(config, null, 2));
    
    return { success: true, path: storagePath };
  } catch (error) {
    console.error('Error setting custom storage path:', error);
    throw new Error('Failed to set custom storage path');
  }
}

// Get the configuration including backup drive and main computer
export async function getConfiguration() {
  try {
    // Get config from the standard location first to determine storage path
    const defaultConfigPath = path.join(os.homedir(), '.myphotos', 'config.json');
    let defaultConfig = {};
    
    try {
      const defaultConfigData = await fs.readFile(defaultConfigPath, 'utf8');
      defaultConfig = JSON.parse(defaultConfigData);
    } catch (error) {
      // File doesn't exist or is corrupt, continue with empty config
    }
    
    // Now get the potentially complete config from storage path
    const configPath = path.join(await getStoragePath(), 'config.json');
    let config = { ...defaultConfig };
    
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      config = { ...JSON.parse(configData), ...defaultConfig };
    } catch (error) {
      // File doesn't exist or is corrupt, use default config
    }
    
    // Add current computer info
    const mainComputerStatus = await isMainComputer();
    
    return {
      backupDrive: config.backupDrive || null,
      customStoragePath: config.customStoragePath || null,
      mainComputer: config.mainComputer || null,
      currentComputer: {
        id: mainComputerStatus.currentId,
        name: mainComputerStatus.currentName,
        isMainComputer: mainComputerStatus.isMainComputer
      }
    };
  } catch (error) {
    console.error('Error getting configuration:', error);
    throw new Error('Failed to get configuration');
  }
}