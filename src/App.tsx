import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
        <footer className="border-t border-brand-100 py-6 text-center text-sm text-brand-500">
          <p>Enheten för schemalagd verksamhet · cal.relic.se</p>
        </footer>
      </div>
    </HashRouter>
  )
}
