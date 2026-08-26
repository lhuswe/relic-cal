import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Admin from './pages/Admin'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <footer className="border-t border-brand-100 py-6 text-center text-sm text-brand-500">
          <p>
            Enheten för schemalagd verksamhet · cal.relic.se ·{' '}
            <Link to="/admin" className="underline hover:text-brand-700">
              Underhåll
            </Link>
          </p>
        </footer>
      </div>
    </HashRouter>
  )
}
