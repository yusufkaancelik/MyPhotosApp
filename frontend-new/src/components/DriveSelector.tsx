import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driveApi, type Drive } from '../api';
import { CheckCircleIcon, FolderPlusIcon } from '@heroicons/react/24/outline';

interface DriveSelectorProps {
  drives: Drive[];
}

export default function DriveSelector({ drives }: DriveSelectorProps) {
  const queryClient = useQueryClient();
  
  // Get configuration to know which drive is selected
  const { data: config } = useQuery({
    queryKey: ['configuration'],
    queryFn: driveApi.getConfiguration
  });

  const setBackupMutation = useMutation({
    mutationFn: driveApi.setBackupDrive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drives'] });
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
    },
  });

  const handleDriveSelect = (drivePath: string) => {
    setBackupMutation.mutate(drivePath);
  };
  
  const selectedDrive = config?.backupDrive;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Select a drive where photos will be stored in the MyPhotos folder.
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {drives.map((drive) => {
          const isSelected = selectedDrive === drive.name;
          
          return (
            <button
              key={drive.name}
              onClick={() => handleDriveSelect(drive.name)}
              disabled={setBackupMutation.isPending}
              className={`flex flex-col rounded-lg border p-4 hover:bg-gray-50 ${
                isSelected ? 'ring-2 ring-primary-600' : ''
              } ${setBackupMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-medium">{drive.name}</span>
                  {isSelected && (
                    <CheckCircleIcon className="ml-2 h-5 w-5 text-primary-600" />
                  )}
                </div>
                {drive.volumeName && (
                  <span className="text-sm text-gray-500">{drive.volumeName}</span>
                )}
              </div>
              
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-primary-600"
                    style={{
                      width: `${Math.round(
                        ((drive.size - drive.freeSpace) / drive.size) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>
                    {formatBytes(drive.size - drive.freeSpace)} used
                  </span>
                  <span>{formatBytes(drive.freeSpace)} free</span>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-2 flex items-center text-sm text-primary-600">
                  <FolderPlusIcon className="mr-1 h-4 w-4" />
                  MyPhotos folder
                </div>
              )}
            </button>
          );
        })}
      </div>

      {setBackupMutation.isPending && (
        <p className="text-sm text-gray-600">
          Setting up backup location...
        </p>
      )}
      
      {setBackupMutation.isError && (
        <p className="text-sm text-red-600">
          Failed to set backup drive. Please try again.
        </p>
      )}
      
      {setBackupMutation.isSuccess && (
        <p className="text-sm text-green-600">
          Backup location set successfully! Photos will be saved to {selectedDrive}\MyPhotos
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${Math.round(value)} ${units[unitIndex]}`;
}