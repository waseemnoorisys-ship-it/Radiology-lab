import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerDicomServiceWorker } from './services/localDicomStore';

// Register DICOMweb Service Worker to intercept local OHIF requests
registerDicomServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
