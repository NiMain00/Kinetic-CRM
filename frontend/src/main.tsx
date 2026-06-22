import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 500,
        },
        success: { iconTheme: { primary: '#4caf50', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef5350', secondary: '#fff' } },
      }}
    />
    <App />
  </React.StrictMode>,
);
