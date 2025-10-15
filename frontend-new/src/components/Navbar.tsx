import { Link } from 'react-router-dom'
import { Cog6ToothIcon, PhotoIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <PhotoIcon className="h-8 w-8" />
            <span>MyPhotos</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Cog6ToothIcon className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}