import { Play, SkipBack, SkipForward, Volume2, Music, ListMusic } from "lucide-react";
import { Slider } from "../components/ui/slider"; // You'll need to add this shadcn component
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useState, useEffect } from "react";

export default function Acoustics() {
  const [visualizerHeights] = useState<number[]>(() => 
    [...Array(20)].map(() => Math.random() * 100)
  );
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Music size={16} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Acoustic Engine v1.0</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Acoustics</h2>
        </div>
        <Button variant="outline" size="sm" className="border-white/5 bg-white/5 rounded-xl gap-2">
          <ListMusic size={16} /> Library
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Player Card */}
        <Card className="lg:col-span-2 bg-secondary/10 border-white/5 overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            <div className="aspect-video bg-linear-to-br from-emerald-500/20 to-blue-600/20 flex items-center justify-center relative group">
              <div className="w-48 h-48 rounded-2xl bg-zinc-900 shadow-2xl flex items-center justify-center overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-500">
                <Music size={64} className="text-emerald-500/20" />
              </div>
              {/* Animated visualizer bars placeholder */}
              <div className="absolute bottom-4 flex gap-1 items-end h-12">
                {visualizerHeights.map((height, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-emerald-500/40 rounded-full animate-pulse" 
                    style={{ height: `${height}%`, animationDelay: `${i * 0.1}s` }} 
                  />
                ))}
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-white">Neural Drift</h3>
                <p className="text-sm text-muted-foreground font-mono">graylen_os_ambient_04.wav</p>
              </div>

              <div className="space-y-2">
                <Slider defaultValue={[33]} max={100} step={1} className="py-4" />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>01:24</span>
                  <span>04:15</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-8">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white"><SkipBack /></Button>
                <Button size="icon" className="h-14 w-14 rounded-full bg-white text-black hover:bg-emerald-400 transition-colors">
                  <Play fill="black" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white"><SkipForward /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Playlist/Up Next Sidebar */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-2">Up Next</h4>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
              <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground group-hover:text-emerald-500 transition-colors">
                <Music size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">System Pulse {i}</p>
                <p className="text-[10px] text-muted-foreground font-mono">03:4{i}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}