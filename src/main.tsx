import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@turnkey/react-wallet-kit/styles.css'
import './index.css'
import { Buffer } from 'buffer'

// Setup Buffer globally for Stacks transactions
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

createRoot(document.getElementById("root")!).render(<App />);
