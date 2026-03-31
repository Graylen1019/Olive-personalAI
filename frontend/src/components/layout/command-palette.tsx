import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Table, 
  Music, 
  Shield, 
  Settings, 
  Search,
  Zap
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // 1. Listen for Toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const items = [
    { icon: LayoutDashboard, label: "Intelligence", path: "/", color: "text-blue-500" },
    { icon: Table, label: "Temporal", path: "/temporal", color: "text-purple-500" },
    { icon: Shield, label: "Vault", path: "/vault", color: "text-orange-500" },
    { icon: Music, label: "Acoustics", path: "/acoustics", color: "text-emerald-500" },
    { icon: Settings, label: "System Settings", path: "/settings", color: "text-slate-400" },
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={() => setOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-[#0b0b0b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-white/5">
          <Search className="mr-3 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Search graylenOS..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>

        <div className="p-2 max-h-[300px] overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Navigation</p>
          {filteredItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
            </button>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground font-mono">
              No neural matches for "{search}"
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
          <span>Neural Link Active</span>
          <div className="flex items-center gap-2">
             <Zap size={10} className="text-yellow-500" />
             <span>Core Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
}