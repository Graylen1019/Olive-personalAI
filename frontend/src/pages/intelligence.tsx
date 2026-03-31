import { useState } from "react";
import { SendHorizontal, Terminal, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../lib/utils";

export default function Intelligence() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'User', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3005/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'AI', text: data.response }]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessages(prev => [...prev, { role: 'System', text: "Gateway Offline." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <ScrollArea className="flex-1 p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-4 mb-6", msg.role === 'User' ? "flex-row-reverse" : "flex-row")}>
            <div className={cn("w-8 h-8 rounded flex items-center justify-center shrink-0", 
              msg.role === 'AI' ? "bg-blue-600" : "bg-zinc-800")}>
              {msg.role === 'AI' ? <Terminal size={14}/> : <User size={14}/>}
            </div>
            <div className={cn("p-4 rounded-2xl max-w-[80%] text-sm", 
              msg.role === 'User' ? "bg-blue-600 text-white" : "bg-secondary border border-border")}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-blue-500 animate-pulse text-xs font-mono">graylenOS_THINKING...</div>}
      </ScrollArea>

      <div className="p-6">
        <div className="relative">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Command graylenOS..." 
            className="h-14 pl-6 pr-14 rounded-2xl bg-secondary border-border focus:ring-1 focus:ring-blue-500"
          />
          <Button onClick={sendMessage} className="absolute right-2 top-2 rounded-xl h-10 w-10 p-0">
            <SendHorizontal size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}