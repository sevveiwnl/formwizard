import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind or other global styles
import App from './App.tsx';
import { Provider } from 'react-redux';
import store from './store/index.ts';

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);




