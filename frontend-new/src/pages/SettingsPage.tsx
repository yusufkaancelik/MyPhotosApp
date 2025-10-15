import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DriveSelector from '../components/DriveSelector'
import StoragePathSelector from '../components/StoragePathSelector'
import { driveApi } from '../api'
import type { Configuration } from '../types'
import { CheckIcon } from '@heroicons/react/24/outline'
import { Switch } from '@headlessui/react'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isMain, setIsMain] = useState(false);
  
  const { data: drives = [], isLoading: drivesLoading } = useQuery({
    queryKey: ['drives'],
    queryFn: driveApi.getAll
  });
  
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['configuration'],
    queryFn: driveApi.getConfiguration
  });
  
  // Update the isMain state when config data changes
  useEffect(() => {
    if (config && config.currentComputer) {
      setIsMain(config.currentComputer.isMainComputer);
    }
  }, [config]);
  
  const mainComputerMutation = useMutation({
    mutationFn: driveApi.setMainComputer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuration'] });
    }
  });
  
  const handleMainComputerToggle = (checked: boolean) => {
    setIsMain(checked);
    mainComputerMutation.mutate(checked);
  };
  
  if (drivesLoading || configLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Computer Settings</h2>
        <div className="bg-white shadow rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Computer Name</p>
              <p className="text-sm text-gray-500">{config?.currentComputer?.name || 'Unknown'}</p>
            </div>
            <div className="text-sm text-gray-500">
              ID: {config?.currentComputer?.id ? config.currentComputer.id.substring(0, 8) + '...' : 'Unknown'}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Main Computer</p>
              <p className="text-sm text-gray-500">
                {isMain 
                  ? 'This computer will be used for photo storage' 
                  : config?.mainComputer 
                    ? `Main computer is ${config.mainComputer.name}` 
                    : 'No main computer set'
                }
              </p>
            </div>
            <Switch
              checked={isMain}
              onChange={handleMainComputerToggle}
              className={`${
                isMain ? 'bg-primary-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full`}
            >
              <span className="sr-only">Set as main computer</span>
              <span
                className={`${
                  isMain ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
              />
            </Switch>
          </div>
          
          {isMain && (
            <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
              <div className="flex items-center">
                <CheckIcon className="h-4 w-4 mr-1" />
                <p>This computer is set as the main computer for photo storage</p>
              </div>
            </div>
          )}
          
          {config?.mainComputer && config?.currentComputer && 
           config.mainComputer.id !== config.currentComputer.id && (
            <div className="mt-2 rounded-md bg-blue-50 p-2 text-sm text-blue-700">
              <p>Current main computer: {config.mainComputer.name}</p>
              <p>Set on: {new Date(config.mainComputer.setAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Primary Storage Location</h2>
        <StoragePathSelector />
      </div>

      <div className="space-y-4 mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Backup Location</h2>
        <DriveSelector drives={drives} />
      </div>
    </div>
  )
}