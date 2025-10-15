import { useQuery } from '@tanstack/react-query';
import PhotoGrid from '../components/PhotoGrid';
import UploadButton from '../components/UploadButton';
import { photoApi } from '../api';

export default function HomePage() {
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: photoApi.getAll
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Photos</h1>
        <UploadButton />
      </div>
      
      <PhotoGrid photos={photos} />
    </div>
  );
}