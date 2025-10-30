import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import HierarchyScene from './HierarchyScene.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HierarchyScene />
  </StrictMode>,
)