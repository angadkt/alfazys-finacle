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
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center justify-between gap-3.5 p-4.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border backdrop-blur-md cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_16px_50px_rgba(0,0,0,0.16)] animate-in slide-in-from-right-8 fade-in duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-600/95 border-emerald-500/20 text-white'
                : toast.type === 'error'
                ? 'bg-rose-600/95 border-rose-500/20 text-white'
                : 'bg-[#9e0248]/95 border-[#9e0248]/20 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Type Icons */}
              {toast.type === 'success' && (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.084 1.085l-.042.022m-.9-1.085a1.562 1.562 0 113.125 0 1.562 1.562 0 01-3.125 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-[11px] font-black uppercase tracking-wider font-montserrat leading-tight">{toast.message}</span>
            </div>
            
            {/* Close Button */}
            <button className="text-white/60 hover:text-white transition p-0.5 rounded-full hover:bg-white/10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
