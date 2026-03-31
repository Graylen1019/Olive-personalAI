import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/sidebar';
import Intelligence from './pages/intelligence';
import Vault from './pages/vault';

function App() {
  return (
    <Router>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <Sidebar />
        <main className="flex-1 relative flex flex-col">
          {/* Subtle Ambient Background */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.03),transparent_50%)] pointer-events-none" />
          <Routes>
            <Route path="/" element={<Intelligence />} />
            <Route path="/vault" element={<Vault />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;