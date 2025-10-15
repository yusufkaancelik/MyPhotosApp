import { useQuery } from '@tanstack/react-query';
import PhotoGrid from '../components/PhotoGrid';
import UploadButton from '../components/UploadButton';
import { photoApi } from '../api';
import { Photo } from '../types';
import { useToast } from '../components/Toast';

interface HomePageProps {
  onPhotoSelect?: (photo: Photo) => void;
}

export default function HomePage({ onPhotoSelect }: HomePageProps) {
  const { showToast, ToastContainer } = useToast();
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: photoApi.getAll
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Pass notification functions to PhotoGrid
  const handlePhotoAction = (action: string, count: number) => {
    if (action === 'delete') {
      showToast({
        message: `${count} photo${count !== 1 ? 's' : ''} deleted successfully`,
        type: 'success'
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Photos</h1>
          <UploadButton />
        </div>
        
        <PhotoGrid 
          photos={photos} 
          onPhotoSelect={onPhotoSelect}
          onAction={handlePhotoAction}
        />
      </div>
      <ToastContainer />
    </>
  )
}