import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface Photo {
  id: string;
  filename: string;
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
  };
  createdAt: string;
}

export interface Drive {
  name: string;
  volumeName: string;
  size: number;
  freeSpace: number;
}

export const photoApi = {
  getAll: () => api.get<Photo[]>('/photos').then(res => res.data),
  getById: (id: string) => api.get<Photo>(`/photos/${id}`).then(res => res.data),
  upload: (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });
    return api.post<Photo[]>('/photos/upload', formData).then(res => res.data);
  }
};

export const driveApi = {
  getAll: () => api.get<Drive[]>('/drives').then(res => res.data),
  setBackupDrive: (drivePath: string) => 
    api.post<{ success: boolean; path: string }>('/drives/backup', { drivePath })
      .then(res => res.data)
};