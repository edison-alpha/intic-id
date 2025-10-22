import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Buffer } from 'buffer'

// 1. Import the toolbar
import { initToolbar } from '@21st-extension/toolbar';

// Setup Buffer globally for Stacks transactions
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// 2. Define your toolbar configuration
const stagewiseConfig = {
  plugins: [],
};

// 3. Initialize the toolbar when your app starts
function setupStagewise() {
  // Only initialize once and only in development mode
  if (process.env.NODE_ENV === 'development') {
    initToolbar(stagewiseConfig);
  }
}

// Call the setup function when appropriate for your framework
setupStagewise();

createRoot(document.getElementById("root")!).render(<App />);
