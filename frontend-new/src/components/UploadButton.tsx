import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { photoApi } from '../api';
import { useState } from 'react';

type UploadStatus = {
  success: number;
  duplicates: string[];
  errors: string[];
};

export default function UploadButton() {
  const queryClient = useQueryClient();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);

  const uploadMutation = useMutation({
    mutationFn: photoApi.upload,
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });

      const status: UploadStatus = {
        success: 0,
        duplicates: [],
        errors: [],
      };

      results.forEach((result) => {
        if ('error' in result) {
          if (result.error === 'Duplicate photo') {
            status.duplicates.push(result.originalName);
          } else {
            status.errors.push(result.originalName);
          }
        } else {
          status.success++;
        }
      });

      setUploadStatus(status);

      // Clear status after 5 seconds
      setTimeout(() => {
        setUploadStatus(null);
      }, 5000);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      uploadMutation.mutate(event.target.files);
      setUploadStatus(null); // Reset status for new upload
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <label
          htmlFor="photo-upload"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
            uploadMutation.isPending ? 'opacity-75' : ''
          }`}
        >
          <CloudArrowUpIcon className="h-5 w-5" aria-hidden="true" />
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Photos'}
        </label>
        <input
          type="file"
          id="photo-upload"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
        />
      </div>

      {/* Upload status messages */}
      {uploadStatus && (
        <div className="text-sm">
          {uploadStatus.success > 0 && (
            <p className="text-green-600">
              Successfully uploaded {uploadStatus.success} photo{uploadStatus.success !== 1 ? 's' : ''}
            </p>
          )}
          {uploadStatus.duplicates.length > 0 && (
            <p className="text-amber-600">
              Skipped {uploadStatus.duplicates.length} duplicate{uploadStatus.duplicates.length !== 1 ? 's' : ''}: {uploadStatus.duplicates.join(', ')}
            </p>
          )}
          {uploadStatus.errors.length > 0 && (
            <p className="text-red-600">
              Failed to upload {uploadStatus.errors.length} photo{uploadStatus.errors.length !== 1 ? 's' : ''}: {uploadStatus.errors.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}