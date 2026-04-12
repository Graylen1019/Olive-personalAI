import { useState } from "react";
import { SendHorizontal, Terminal, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../lib/utils";

type Role = "User" | "AI" | "System";

export default function Intelligence() {
  const [messages, setMessages] = useState<{ role: Role; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const hasMessages = messages.length > 0;

  // 🧠 Command handler
  const handleCommand = (input: string): string | null => {
    const lower = input.toLowerCase();

    if (lower.includes("timeline") || lower.includes("schedule")) {
      navigate("/temporal");
      return "Opening Timeline...";
    }

    if (lower.includes("music") || lower.includes("play")) {
      navigate("/acoustics");
      return "Switching to Sound...";
    }

    if (lower.includes("notes") || lower.includes("memory")) {
      navigate("/vault");
      return "Accessing Memory...";
    }

    if (lower.includes("home") || lower.includes("dashboard")) {
      navigate("/");
      return "Returning to Assistant...";
    }

    return null;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "User" as Role, text: input };
    setMessages((prev) => [...prev, userMsg]);

    const commandResponse = handleCommand(input);

    setInput("");

    if (commandResponse) {
      setMessages((prev) => [
        ...prev,
        { role: "System", text: commandResponse },
      ]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3005/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "AI", text: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "System", text: "Gateway Offline." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center">

      {/* 💤 Idle State (perfect center) */}
      {!hasMessages && (
        <div className="w-full max-w-2xl px-6 flex flex-col items-center justify-center gap-6">

          <div className="text-white/60 text-2xl tracking-widest">
            OliveAI
          </div>

          <div className="relative w-full">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="How may I assist you today?"
              className="h-14 pl-6 pr-14 rounded-2xl bg-secondary border-border focus:ring-1 focus:ring-blue-500"
            />

            <Button
              onClick={sendMessage}
              className="absolute right-2 top-2 rounded-xl h-10 w-10 p-0"
            >
              <SendHorizontal size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* ⚡ Active Chat State */}
      {hasMessages && (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">

          <ScrollArea className="flex-1 p-6 space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "User" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center shrink-0",
                    msg.role === "AI"
                      ? "bg-blue-600"
                      : msg.role === "System"
                        ? "bg-yellow-500/20"
                        : "bg-zinc-800"
                  )}
                >
                  {msg.role === "AI" ? (
                    <Terminal size={14} />
                  ) : msg.role === "System" ? (
                    <Terminal size={14} />
                  ) : (
                    <User size={14} />
                  )}
                </div>

                <div
                  className={cn(
                    "p-4 rounded-2xl max-w-[80%] text-sm",
                    msg.role === "User"
                      ? "bg-blue-600 text-white"
                      : msg.role === "System"
                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono text-xs"
                        : "bg-secondary border border-border"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-blue-500 animate-pulse text-xs font-mono tracking-wider">
                ▍ processing intent...
              </div>
            )}
          </ScrollArea>

          <div className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="How may I assist you today?"
                className="h-14 pl-6 pr-14 rounded-2xl bg-secondary border-border focus:ring-1 focus:ring-blue-500"
              />

              <Button
                onClick={sendMessage}
                className="absolute right-2 top-2 rounded-xl h-10 w-10 p-0"
              >
                <SendHorizontal size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}