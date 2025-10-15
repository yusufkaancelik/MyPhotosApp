import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import '../styles/toast.css';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);
  
  const bgColor = 
    toast.type === 'success' ? 'bg-green-50 border-green-500' : 
    toast.type === 'error' ? 'bg-red-50 border-red-500' : 
    'bg-blue-50 border-blue-500';
    
  const textColor = 
    toast.type === 'success' ? 'text-green-800' : 
    toast.type === 'error' ? 'text-red-800' : 
    'text-blue-800';
    
  return (
    <div 
      className={`mb-2 border-l-4 p-4 ${bgColor} flex items-center justify-between shadow-lg rounded-r-md animate-fade-in`}
      role="alert"
    >
      <div className={textColor}>{toast.message}</div>
      <button 
        onClick={() => onClose(toast.id)}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = ({ message, type = 'info' }: ToastOptions) => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    return id;
  };
  
  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };
  
  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={hideToast} />
      ))}
    </div>
  );
  
  return { showToast, hideToast, ToastContainer };
}