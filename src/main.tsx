import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './hooks/useAuth';
import { CustomerProvider } from './hooks/useCustomer';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('No #root element in index.html');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CustomerProvider>
          <App />
        </CustomerProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
