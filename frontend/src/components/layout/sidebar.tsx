import { Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Calendar, 
  Music, 
  Folder, 
  User, 
  Settings, 
  Terminal,
  Activity 
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

const navItems = [
  { name: 'Intelligence', path: '/', icon: MessageSquare },
  { name: 'Temporal', path: '/temporal', icon: Calendar },
  { name: 'Acoustics', path: '/acoustics', icon: Music },
  { name: 'The Vault', path: '/vault', icon: Folder },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 h-full bg-[#050505] border-r border-white/5 flex flex-col p-4 shrink-0">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-4 mb-10 mt-2">
        <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          <Terminal className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-white">
          graylen<span className="text-blue-500">OS</span>
        </h1>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-white/5 text-blue-400 shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive && "text-blue-400")} />
                <span className="text-sm font-medium">{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator className="my-4 bg-white/5" />

      {/* System & Identity Section */}
      <div className="px-2 space-y-2">
        <Link to="/identity">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 h-11 transition-all rounded-xl",
              pathname === '/identity' ? "bg-white/5 text-white" : "text-muted-foreground hover:text-white"
            )}
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Identity</span>
          </Button>
        </Link>

        <Link to="/system">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 h-11 transition-all rounded-xl",
              pathname === '/system' ? "bg-white/5 text-white" : "text-muted-foreground hover:text-white"
            )}
          >
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">System</span>
          </Button>
        </Link>
      </div>
    </aside>
  );
}