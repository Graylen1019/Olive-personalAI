import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/sidebar';
import Dock from "./components/layout/Dock";
import { CommandPalette } from "./components/layout/command-palette";
import Intelligence from './pages/intelligence';
import Vault from './pages/vault';
import Temporal from './pages/temporal';
import Acoustics from "./pages/acoustics";
import System from './pages/system';

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
            <Route path="/temporal" element={<Temporal />} />
            <Route path="/acoustics" element={<Acoustics />} />
            <Route path="/system" element={<System />} />
          </Routes>
        </main>
        <Dock />
        <CommandPalette /> {/* Just drop it here */}
      </div>
    </Router>
  );
}

export default App;