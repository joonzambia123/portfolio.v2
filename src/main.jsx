import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import CMS from './cms/CMS.jsx'
import './index.css'

// Simple routing - check if we're on /cms
const isCMS = window.location.pathname === '/cms' || window.location.pathname === '/cms/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isCMS ? <CMS /> : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>,
)
