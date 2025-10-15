import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      // SW registered successfully
    }).catch(registrationError => {
      // Silently fail registration on error. In a production environment, 
      // this might be logged to an analytics service.
    });
  });
}


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Create a directory for contexts
// @mkdir contexts
// Create a directory for the new API layer
// @mkdir api
// Create a directory for utility functions
// @mkdir utils