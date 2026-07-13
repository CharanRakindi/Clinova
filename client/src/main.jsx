import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => {
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return count < 2;
      },
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              className: 'font-sans text-[13px]',
              style: {
                borderRadius: '14px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 8px 24px -8px rgba(15, 23, 42, 0.12)',
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline / unsupported — ignore */
    });
  });
}
