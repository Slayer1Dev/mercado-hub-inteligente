
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Componente temporário para quando a chave não estiver configurada
const ClerkSetupRequired = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Configuração do Clerk Necessária
      </h1>
      <p className="text-gray-600 mb-4">
        Para usar a autenticação, você precisa configurar sua chave do Clerk.
      </p>
      <div className="text-left bg-gray-100 p-4 rounded-md mb-4">
        <p className="text-sm font-medium mb-2">Passos para configurar:</p>
        <ol className="text-sm text-gray-700 space-y-1">
          <li>1. Acesse <a href="https://go.clerk.com/lovable" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://go.clerk.com/lovable</a></li>
          <li>2. Crie uma conta ou faça login</li>
          <li>3. Copie sua "Publishable Key"</li>
          <li>4. Configure a variável VITE_CLERK_PUBLISHABLE_KEY</li>
        </ol>
      </div>
      <p className="text-sm text-gray-500">
        Chave esperada: <code className="bg-gray-200 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code>
      </p>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  PUBLISHABLE_KEY ? (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  ) : (
    <ClerkSetupRequired />
  )
);
