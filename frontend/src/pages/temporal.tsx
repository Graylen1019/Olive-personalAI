import { useEffect, useState } from "react";
import { Clock, Calendar as CalIcon, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";

interface Task {
  task: string;
  time: string;
  status: 'pending' | 'ongoing' | 'complete';
}

export default function Temporal() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3005/tasks");
      if (!response.ok) throw new Error("Gateway Error");
      const data = await response.json();
      setTasks(data.tasks || []);
      setError(false);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleGoogleSync = () => {
    // Triggers the Oauth flow in server.js
    window.location.href = "http://localhost:3005/auth/google";
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Clock size={16} />
            <span className="text-[10px] font-mono uppercase tracking-widest">Temporal Engine v1.0</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Schedule</h2>
        </div>
        
        <button 
          onClick={handleGoogleSync}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-blue-400 hover:border-blue-500/50 transition-all"
        >
          <RefreshCw size={14} /> Sync Google Calendar
        </button>
      </div>

      <div className="relative border-l border-white/10 ml-3 pl-8 space-y-8">
        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground font-mono text-xs"><Loader2 className="animate-spin" /> Syncing Neural Core...</div>
        ) : tasks.length > 0 ? (
          tasks.map((item, i) => (
            <div key={i} className="relative flex flex-col sm:flex-row sm:items-center gap-4 group">
              <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-[#0b0b0b] bg-zinc-800 group-hover:bg-blue-500 transition-colors" />
              <span className="text-xs font-mono text-muted-foreground w-24 tabular-nums">{item.time}</span>
              <Card className="flex-1 bg-secondary/10 border-white/5 group-hover:border-blue-500/30 transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{item.task}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{item.status}</Badge>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl text-muted-foreground text-xs uppercase font-mono">No events scheduled.</div>
        )}
      </div>
    </div>
  );
}