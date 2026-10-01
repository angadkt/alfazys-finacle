import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    success: (msg: string) => context.showToast(msg, 'success'),
    error: (msg: string) => context.showToast(msg, 'error'),
    info: (msg: string) => context.showToast(msg, 'info'),
  };
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 w-[300px] pointer-events-none select-none" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="pointer-events-auto flex items-start gap-2 p-2 bg-[#d4d0c8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-b-[#8f8f9d] border-r-[#8f8f9d] shadow-[2px_2px_4px_rgba(0,0,0,0.5)] cursor-pointer"
          >
            {/* Info Icon */}
            <div className="mt-1">
              {toast.type === 'error' ? (
                <div className="w-[18px] h-[18px] rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold font-sans shadow-inner">
                  x
                </div>
              ) : toast.type === 'success' ? (
                <div className="w-[18px] h-[18px] rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold font-sans shadow-inner">
                  ✓
                </div>
              ) : (
                <div className="w-[18px] h-[18px] rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold font-sans shadow-inner">
                  i
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col pt-1">
              <span className="text-[12px] font-bold text-black mb-1">{toast.type === 'error' ? 'Error' : toast.type === 'success' ? 'Success' : 'Information'}</span>
              <span className="text-[11px] text-black leading-tight">{toast.message}</span>
            </div>
            
            {/* Close Button */}
            <button className="font-sans text-[10px] font-bold text-black border-t border-l border-white border-b border-r border-b-gray-600 border-r-gray-600 bg-[#d4d0c8] hover:bg-[#e4e4e4] w-4 h-4 flex items-center justify-center focus:outline-none active:border-t-gray-600 active:border-l-gray-600 active:border-b-white active:border-r-white">
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
