import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driveApi } from '../api';
import { FolderIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function StoragePathSelector() {
  const queryClient = useQueryClient();
  const [customPath, setCustomPath] = useState('');
  
  // Get configuration to know the current storage path
  const { data: config } = useQuery({
    queryKey: ['configuration'],
    queryFn: driveApi.getConfiguration
  });

  const setStoragePathMutation = useMutation({
    mutationFn: driveApi.setStoragePath,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
      setCustomPath('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPath) {
      setStoragePathMutation.mutate(customPath);
    }
  };
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Set a custom location where your photos will be stored.
      </p>
      
      {config?.customStoragePath && (
        <div className="rounded-md bg-gray-50 p-3">
          <div className="flex">
            <FolderIcon className="h-5 w-5 text-gray-500 mr-2" />
            <p className="text-sm font-medium text-gray-700">
              Current storage path: <span className="font-normal">{config.customStoragePath}</span>
            </p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-grow">
          <label htmlFor="storage-path" className="sr-only">Storage path</label>
          <input
            id="storage-path"
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="Enter a folder path (e.g. C:\MyPhotos)"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={!customPath || setStoragePathMutation.isPending}
          className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {setStoragePathMutation.isPending ? 'Setting...' : 'Set Path'}
        </button>
      </form>

      {setStoragePathMutation.isPending && (
        <p className="text-sm text-gray-600">
          Setting up storage location...
        </p>
      )}
      
      {setStoragePathMutation.isError && (
        <p className="text-sm text-red-600">
          Failed to set storage path. Please make sure the directory exists or can be created.
        </p>
      )}
      
      {setStoragePathMutation.isSuccess && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Storage location updated successfully!
        </p>
      )}
    </div>
  );
}