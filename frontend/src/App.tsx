import { Route, Routes } from 'react-router-dom';import React, { useState } from 'react';

import Layout from './components/Layout';import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomePage from './pages/HomePage';import DriveSelector from './components/DriveSelector';

import SettingsPage from './pages/SettingsPage';import PhotoUploader from './components/PhotoUploader';

import PhotoGallery from './components/PhotoGallery';

function App() {import './App.css';

  return (

    <Routes>const queryClient = new QueryClient();

      <Route element={<Layout />}>

        <Route path="/" element={<HomePage />} />function App() {

        <Route path="/settings" element={<SettingsPage />} />  const [selectedDrive, setSelectedDrive] = useState('C:');

      </Route>

    </Routes>  return (

  );    <QueryClientProvider client={queryClient}>

}      <div className="min-h-screen bg-gray-100">

        <header className="bg-white shadow">

export default App;          <div className="max-w-7xl mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold text-gray-900">
              MyPhotos Backup
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DriveSelector 
              selectedDrive={selectedDrive} 
              onDriveSelect={setSelectedDrive} 
            />
            <PhotoUploader selectedDrive={selectedDrive} />
            <PhotoGallery selectedDrive={selectedDrive} />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
