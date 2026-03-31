import { useState, useRef } from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Search, 
  Trash2, 
  Database,
  RefreshCw 
} from "lucide-react";
import { cn } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'image';
  size: string;
  status: 'synced' | 'processing';
}

export default function Vault() {
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mock data - in production, this would come from a useEffect fetch to your Gateway
  const [docs, setDocs] = useState<Document[]>([
    { id: "1", name: "Project_Alpha_Specs.pdf", type: "pdf", size: "2.4MB", status: 'synced' },
    { id: "2", name: "Architecture_v4.png", type: "image", size: "1.1MB", status: 'synced' },
    { id: "3", name: "Neural_Link_Notes.txt", type: "text", size: "12KB", status: 'synced' },
  ]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Sending to your Node Gateway on port 3005
      const response = await fetch("http://localhost:3005/ingest", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newDoc: Document = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.includes('image') ? 'image' : 'pdf',
          size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
          status: 'synced'
        };
        setDocs(prev => [newDoc, ...prev]);
      }
    } catch (error) {
      console.error("Vault Ingestion Error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredDocs = docs.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Database size={16} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Vector Knowledge Base</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">The Vault</h2>
          <p className="text-muted-foreground text-sm">
            Manage long-term memory assets and document embeddings.
          </p>
        </div>

        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10"
            onClick={() => {/* Logic to refresh from Qdrant */}}
          >
            <RefreshCw size={14} className="mr-2" /> Sync
          </Button>
          <Button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all"
          >
            {isUploading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            {isUploading ? "Vectorizing..." : "Ingest Data"}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
        <Input 
          placeholder="Query your knowledge assets..." 
          className="pl-12 h-14 bg-secondary/30 border-white/5 rounded-2xl focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 transition-all text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <Card 
            key={doc.id} 
            className="bg-secondary/20 border-white/5 hover:border-blue-500/30 hover:bg-secondary/40 transition-all group cursor-default overflow-hidden relative"
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
              <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                {doc.type === 'image' ? <ImageIcon size={22} /> : <FileText size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold truncate text-slate-200">
                  {doc.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">{doc.size}</span>
                  <span className="text-[10px] text-blue-500/50 font-mono">•</span>
                  <span className="text-[10px] text-blue-400 font-mono uppercase">{doc.status}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg"
              >
                <Trash2 size={16} />
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
          <p className="text-muted-foreground text-sm">No neural assets found matching "{search}"</p>
        </div>
      )}
    </div>
  );
}