import { Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import { Photo } from './types';
import PhotoDetail from './components/PhotoDetail';

function App() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage onPhotoSelect={setSelectedPhoto} />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      {selectedPhoto && (
        <PhotoDetail
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}

export default App;
