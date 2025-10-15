export interface Photo {
  id: string;
  filename: string;
  originalFilename?: string; // Original file with all metadata
  motionFilename?: string;   // Motion part for Live Photos
  originalName: string;
  thumbnail: string;
  metadata: {
    dateTaken: string | null;
    make: string | null;
    model: string | null;
    gps: {
      latitude: number;
      longitude: number;
    } | null;
    isLivePhoto?: boolean;   // Flag for Live Photos
    orientation?: number;    // Image orientation from EXIF
    originalMetadata?: any;  // Full metadata object
  };
  createdAt: string;
}

export interface Drive {
  name: string;
  volumeName: string;
  size: number;
  freeSpace: number;
}

export interface ComputerInfo {
  id: string;
  name: string;
  isMainComputer: boolean;
}

export interface Configuration {
  backupDrive: string | null;
  customStoragePath: string | null;
  mainComputer: {
    id: string;
    name: string;
    setAt: string;
  } | null;
  currentComputer: {
    id: string;
    name: string;
    isMainComputer: boolean;
  };
}