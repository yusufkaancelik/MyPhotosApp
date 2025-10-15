import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const APP_DIR = '.myphotos';

async function checkStorageConfig() {
  try {
    // Check home directory configuration
    const configPath = path.join(os.homedir(), APP_DIR, 'config.json');
    console.log(`Checking config at: ${configPath}`);
    
    try {
      const data = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(data);
      console.log('Config found:', config);
      
      if (config.customStoragePath) {
        console.log(`Custom storage path configured: ${config.customStoragePath}`);
        
        try {
          await fs.access(config.customStoragePath);
          console.log('Custom path exists and is accessible');
          
          // Check if photos.json exists
          const photosPath = path.join(config.customStoragePath, 'photos.json');
          try {
            await fs.access(photosPath);
            const photosData = await fs.readFile(photosPath, 'utf8');
            const photos = JSON.parse(photosData);
            console.log(`Found ${photos.length} photos in database`);
          } catch (err) {
            console.log(`Photos database not found: ${err.message}`);
          }
        } catch (err) {
          console.error(`Custom path is not accessible: ${err.message}`);
        }
      } else {
        console.log('No custom storage path configured, using default');
        
        // Check default path
        const defaultPath = path.join(os.homedir(), APP_DIR);
        console.log(`Default path: ${defaultPath}`);
        
        try {
          await fs.access(defaultPath);
          console.log('Default path exists and is accessible');
          
          // Check if photos.json exists
          const photosPath = path.join(defaultPath, 'photos.json');
          try {
            await fs.access(photosPath);
            const photosData = await fs.readFile(photosPath, 'utf8');
            const photos = JSON.parse(photosData);
            console.log(`Found ${photos.length} photos in database`);
          } catch (err) {
            console.log(`Photos database not found: ${err.message}`);
          }
        } catch (err) {
          console.error(`Default path is not accessible: ${err.message}`);
        }
      }
    } catch (err) {
      console.log(`Config not found: ${err.message}`);
      console.log('Using default path');
      
      // Check default path
      const defaultPath = path.join(os.homedir(), APP_DIR);
      console.log(`Default path: ${defaultPath}`);
      
      try {
        await fs.access(defaultPath);
        console.log('Default path exists and is accessible');
      } catch (err) {
        console.error(`Default path is not accessible: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error checking storage configuration:', err);
  }
}

checkStorageConfig().catch(console.error);