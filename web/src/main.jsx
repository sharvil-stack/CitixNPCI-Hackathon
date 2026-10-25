import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from './i18n'
import Nav from './components/Nav'
import Home from './pages/Home'
import './styles/finora.css'
import './styles/schemes.css'

const GovernmentSchemes = lazy(() => import('./pages/GovernmentSchemes'))

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <BrowserRouter>
        <Nav />
        <Suspense fallback={<div className="w" style={{ padding: 40 }} role="status">…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/schemes" element={<GovernmentSchemes />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LangProvider>
  </React.StrictMode>,
)
