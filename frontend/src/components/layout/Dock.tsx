import { Play, SkipForward, Volume2, Activity, Cpu, HardDrive } from "lucide-react";
import { Progress } from "../../components/ui/progress"; // npx shadcn-ui@latest add progress

export default function Dock() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50">
      <div className="bg-[#0b0b0b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-8">
        
        {/* Section 1: Mini Player */}
        <div className="flex items-center gap-4 w-1/3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
            <Activity className="text-emerald-500 animate-pulse" size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">Neural Drift</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">Acoustic Engine Active</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-white">
              <Play size={16} fill="white" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground">
              <SkipForward size={16} />
            </button>
          </div>
        </div>

        {/* Section 2: System Vitals (Center) */}
        <div className="flex items-center gap-8 px-8 border-x border-white/5 w-1/3 justify-center">
          <div className="flex items-center gap-3">
            <Cpu size={14} className="text-blue-500" />
            <div className="w-20 space-y-1">
              <div className="flex justify-between text-[8px] font-mono uppercase text-muted-foreground">
                <span>CPU</span>
                <span>24%</span>
              </div>
              <Progress value={24} className="h-1 bg-blue-500/10" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HardDrive size={14} className="text-purple-500" />
            <div className="w-20 space-y-1">
              <div className="flex justify-between text-[8px] font-mono uppercase text-muted-foreground">
                <span>MEM</span>
                <span>62%</span>
              </div>
              <Progress value={62} className="h-1 bg-purple-500/10" />
            </div>
          </div>
        </div>

        {/* Section 3: Interaction & Volume */}
        <div className="flex items-center gap-4 w-1/3 justify-end">
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-muted-foreground" />
            <div className="w-24 h-1 bg-white/10 rounded-full relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-2/3 bg-white" />
            </div>
          </div>
          <div className="h-8 w-[1px] bg-white/5 mx-2" />
          <div className="text-right">
            <p className="text-xs font-bold text-white tabular-nums">16:42</p>
            <p className="text-[8px] font-mono text-muted-foreground uppercase">Sync Stable</p>
          </div>
        </div>

      </div>
    </div>
  );
}