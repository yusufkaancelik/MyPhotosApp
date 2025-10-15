import { useQuery } from '@tanstack/react-query';
import DriveSelector from '../components/DriveSelector';
import { driveApi } from '../api';

export default function SettingsPage() {
  const { data: drives = [], isLoading } = useQuery({
    queryKey: ['drives'],
    queryFn: driveApi.getAll
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Backup Location</h2>
        <DriveSelector drives={drives} />
      </div>
    </div>
  );
}