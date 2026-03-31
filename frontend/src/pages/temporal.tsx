import { useEffect, useState } from "react";
import { Clock, Bell, Calendar as CalIcon, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";

interface Task {
  task: string;
  time: string;
  status: 'pending' | 'ongoing' | 'complete';
}

export default function Temporal() {
  // 1. Initialize as empty array to prevent .map() errors
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3005/tasks");
        
        if (!response.ok) throw new Error("Gateway 404 or Server Error");
        
        const data = await response.json();
        // Ensure we handle cases where data.tasks might be missing
        setTasks(data.tasks || []);
        setError(false);
      } catch (err) {
        console.error("Temporal Fetch Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-blue-500">
          <Clock size={16} />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Temporal Engine v1.0</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Schedule</h2>
        <p className="text-muted-foreground text-sm">Real-time task coordination and temporal tracking.</p>
      </div>

      {/* Timeline Section */}
      <div className="relative border-l border-white/10 ml-3 pl-8 space-y-8 min-h-[200px]">
        
        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground font-mono text-xs">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            Synchronizing with Neural Core...
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-destructive font-mono text-xs bg-destructive/10 p-4 rounded-xl border border-destructive/20">
            <AlertCircle size={16} />
            Gateway Connection Failed: Ensure api-gateway is running.
          </div>
        ) : tasks.length > 0 ? (
          tasks.map((item, i) => (
            <div key={i} className="relative animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              {/* Timeline Dot */}
              <div className={cn(
                "absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-[#0b0b0b] z-10 transition-colors",
                item.status === 'complete' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : 
                item.status === 'ongoing' ? "bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.4)]" : 
                "bg-zinc-800"
              )} />
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 group">
                <span className="text-xs font-mono text-muted-foreground w-24 tabular-nums">
                  {item.time}
                </span>
                <Card className="flex-1 bg-secondary/10 border-white/5 group-hover:border-blue-500/30 group-hover:bg-secondary/20 transition-all duration-300">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{item.task}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize text-[10px] font-mono tracking-tighter",
                        item.status === 'complete' && "text-green-500 border-green-500/20 bg-green-500/5",
                        item.status === 'ongoing' && "text-blue-500 border-blue-500/20 bg-blue-500/5",
                        item.status === 'pending' && "text-zinc-500 border-white/5"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">
              No Temporal Events Scheduled
            </p>
          </div>
        )}
      </div>
      
      {/* Action Footer */}
      <div className="pt-10 border-t border-white/5">
        <button className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-muted-foreground hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
          <Bell size={14} /> Schedule New Temporal Event
        </button>
      </div>
    </div>
  );
}