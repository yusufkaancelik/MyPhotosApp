import axios from 'axios';
import { Photo, Drive, ComputerInfo, Configuration } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const photoApi = {
  getAll: () => api.get<Photo[]>('/photos').then(res => res.data),
  getById: (id: string) => api.get<Photo>(`/photos/${id}`).then(res => res.data),
  getPhotoUrl: (id: string) => `/api/photos/${id}/file`,
  getMotionUrl: (id: string) => `/api/photos/${id}/motion`,
  getDownloadUrl: (id: string) => `/api/photos/${id}/download`,
  checkDuplicate: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post<{ isDuplicate: boolean }>('/photos/check-duplicate', formData)
      .then(res => res.data.isDuplicate);
  },
  upload: async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });
    return api.post<Array<Photo | { error: string; originalName: string }>>('/photos/upload', formData)
      .then(res => res.data);
  },
  deletePhoto: (id: string) => 
    api.delete<{ success: boolean; id: string }>(`/photos/${id}`)
      .then(res => res.data),
  deleteMultiplePhotos: (ids: string[]) =>
    api.delete<Array<{ id: string; success: boolean; error?: string }>>('/photos', { data: { ids } })
      .then(res => res.data)
};

// Using types from ../types.ts

export const driveApi = {
  getAll: () => api.get<Drive[]>('/drives').then(res => res.data),
  setBackupDrive: (drivePath: string) => 
    api.post<{ success: boolean; path: string }>('/drives/backup', { drivePath })
      .then(res => res.data),
  setStoragePath: (storagePath: string) =>
    api.post<{ success: boolean; path: string }>('/drives/storage-path', { storagePath })
      .then(res => res.data),
  getComputerInfo: () => 
    api.get<ComputerInfo>('/drives/computer').then(res => res.data),
  setMainComputer: (isMain: boolean = true) =>
    api.post<{ success: boolean; isMainComputer: boolean }>('/drives/main-computer', { isMain })
      .then(res => res.data),
  getConfiguration: () =>
    api.get<Configuration>('/drives/config').then(res => res.data)
};