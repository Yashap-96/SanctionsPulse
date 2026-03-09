import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import type { MetaData } from "../../lib/types";
import { classNames, formatNumber } from "../../lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface IntelChatProps {
  meta: MetaData | null;
}

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "I'm your OFAC sanctions intelligence analyst. Ask me about this week's sanctions changes, program activity, risk implications, or compliance recommendations.",
};

export function IntelChat({ meta }: IntelChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function buildSystemContext(): string {
    if (!meta) return "";
    const parts = [
      `Current OFAC database stats: ${formatNumber(meta.sdn_total)} SDN entries, ${formatNumber(meta.consolidated_total)} consolidated entries.`,
      `Last updated: ${meta.last_updated}. Last diff date: ${meta.last_diff_date}.`,
      `Latest weekly diff summary: ${meta.last_diff_summary.added} added, ${meta.last_diff_summary.removed} removed, ${meta.last_diff_summary.updated} updated.`,
    ];
    return parts.join(" ");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const systemContext = buildSystemContext();
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      if (systemContext) {
        apiMessages.unshift({ role: "assistant", content: systemContext });
      }

      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          res.status === 503
            ? "AI chat is not configured. Set GROQ_API_KEY in your .env file and restart the dev server to enable this feature."
            : `API error (${res.status}): ${data?.message ?? data?.error ?? "Unknown error"}`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
        return;
      }

      const assistantContent =
        data?.choices?.[0]?.message?.content ??
        data?.message?.content ??
        data?.content ??
        data?.response ??
        "I wasn't able to generate a response. Please try again.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantContent },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="glass-card flex flex-col h-[500px] overflow-hidden animate-fade-in">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={classNames(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mt-0.5">
                <Bot className="h-4 w-4 text-[#06b6d4]" />
              </div>
            )}
            <div
              className={classNames(
                "max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-[#3b82f6]/20 text-white/90"
                  : "glass-card text-white/80"
              )}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mt-0.5">
                <User className="h-4 w-4 text-[#3b82f6]" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mt-0.5">
              <Bot className="h-4 w-4 text-[#06b6d4]" />
            </div>
            <div className="glass-card rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 border-t border-white/10 p-3 flex gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about sanctions activity..."
          disabled={isLoading}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#06b6d4]/50 focus:ring-1 focus:ring-[#06b6d4]/30 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 bg-[#06b6d4]/20 hover:bg-[#06b6d4]/30 text-[#06b6d4] rounded-lg px-3 py-2.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
