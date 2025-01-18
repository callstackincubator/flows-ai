import './index.css'

import { ReactFlowProvider } from '@xyflow/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactFlowProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <App />
      </div>
    </ReactFlowProvider>
  </StrictMode>
)
