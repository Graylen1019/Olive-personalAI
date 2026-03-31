import { Activity, ShieldCheck, Database, Cpu, Globe, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

export default function System() {
  const services = [
    { name: "Neural Core (Python)", status: "Online", load: 12, color: "text-emerald-500" },
    { name: "API Gateway (Node)", status: "Online", load: 5, color: "text-blue-500" },
    { name: "Vector Engine (Qdrant)", status: "Stable", load: 2, color: "text-purple-500" },
    { name: "Primary DB (Postgres)", status: "Active", load: 1, color: "text-orange-500" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Activity size={16} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">System Diagnostics v1.0</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">System Health</h2>
        </div>
        <div className="text-right font-mono text-[10px] text-muted-foreground uppercase">
          Uptime: 124:42:09
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <Card key={service.name} className="bg-[#0b0b0b] border-white/5 hover:border-white/10 transition-colors">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-white/5 ${service.color}`}>
                  <Server size={20} />
                </div>
                <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {service.status}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mb-1">{service.name}</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{service.load}%</span>
                <span className="text-[10px] text-muted-foreground mb-1">LATENCY 12ms</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Monitor */}
        <Card className="lg:col-span-2 bg-[#0b0b0b] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
              <Cpu size={16} className="text-blue-500" /> Resource Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Neural Processing Unit</span>
                <span className="text-white">42%</span>
              </div>
              <Progress value={42} className="h-1 bg-white/5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Vector Memory (RAM)</span>
                <span className="text-white">78%</span>
              </div>
              <Progress value={78} className="h-1 bg-white/5" />
            </div>
          </CardContent>
        </Card>

        {/* Security / Logs */}
        <Card className="bg-[#0b0b0b] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> Security Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-[10px]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 border-l border-white/10 pl-3">
                  <span className="text-muted-foreground">16:42:0{i}</span>
                  <span className="text-blue-400">AUTH_SUCCESS</span>
                  <span className="text-slate-500 truncate">USR_GRAYLEN_ROOT</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}