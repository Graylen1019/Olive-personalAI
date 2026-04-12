import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Calendar,
  Music,
  Folder,
  User,
  Terminal,
  Activity
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

// Simulated dynamic state (replace with real data later)
const navItems = [
  { name: 'Assistant', path: '/', icon: MessageSquare },
  { name: 'Timeline', path: '/temporal', icon: Calendar, badge: '3pm' },
  { name: 'Sound', path: '/acoustics', icon: Music, badge: 'Playing' },
  { name: 'Memory', path: '/vault', icon: Folder, badge: '12' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  // TODO: wire these to real AI/system states
  const isThinking = false;
  const isListening = false;
  const isError = false;

  return (
    <aside className="w-64 h-full bg-background border-r border-white/5 flex flex-col p-4 shrink-0">

      {/* Brand / System State */}
      <div className="flex items-center gap-3 px-4 mb-10 mt-2">
        <div
          className={cn(
            "p-2 rounded-lg transition-all duration-300 shadow-lg",
            isThinking && "bg-blue-500 animate-pulse",
            isListening && "bg-green-500",
            isError && "bg-red-500",
            !isThinking && !isListening && !isError && "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          )}
        >
          <Terminal className="w-4 h-4 text-white" />
        </div>

        <h1 className="text-lg font-bold tracking-tight text-white">
          Olive<span className="text-blue-500">AI</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200 group",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isActive
                    ? "bg-linear-to-r from-blue-500/10 to-transparent text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-blue-400" : "group-hover:text-white"
                  )}
                />

                <span className="text-sm font-medium">{item.name}</span>

                {/* Badge */}
                {item.badge && (
                  <span className="ml-auto text-xs text-blue-400/80">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator className="my-4 bg-white/5" />

      {/* System / Identity */}
      <div className="px-2 space-y-2">
        <Link to="/identity">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-11 rounded-xl transition-all",
              "hover:scale-[1.02] active:scale-[0.98]",
              pathname === '/identity'
                ? "bg-white/5 text-white border border-white/10"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
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
              "w-full justify-start gap-3 h-11 rounded-xl transition-all",
              "hover:scale-[1.02] active:scale-[0.98]",
              pathname === '/system'
                ? "bg-white/5 text-white border border-white/10"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
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