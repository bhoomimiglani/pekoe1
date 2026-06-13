import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(232, 83, 31, 0.3)',
            },
            success: {
              icon: '🎉',
              duration: 3000,
            },
            error: {
              icon: '❌',
              duration: 4000,
            },
          }}
        />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);