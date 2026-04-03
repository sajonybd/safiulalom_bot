import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Bot, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTeam } from "@/hooks/useTeam";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  metadata?: {
    is_transaction?: boolean;
    pending_id?: string;
    pending_data?: any;
  };
}

export function ChatWidget() {
  const { t } = useSettings();
  const { data: teamData } = useTeam();
  const activeFamilyId = teamData?.activeFamilyId;
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, activeFamilyId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/ui_chat");
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm(t("clear_history_confirm") || "Are you sure you want to clear this team's chat history?")) return;
    try {
      const res = await fetch("/api/ui_chat", { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setMessages([]);
        toast.success(t("delete_success"));
      }
    } catch (err) {
      toast.error("Failed to clear history");
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ui_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg.content }),
      });
      const data = await res.json();
      if (data.ok) {
        const assistantMsg: Message = {
          role: "assistant",
          content: data.reply,
          metadata: {
            is_transaction: data.isTransaction,
            pending_id: data.pending?.id,
            pending_data: data.pending?.parsed,
          },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (data.isTransaction) {
          toast.success(t("save_as_draft") + " (Draft)");
        }
      } else {
        toast.error(data.error || "Failed to get response");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/ui_pending?action=confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("save_success") || "Transaction confirmed!");
        fetchHistory();
      } else {
        toast.error(data.error || "Failed to confirm");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/ui_pending?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("delete_success") || "Transaction cancelled");
        fetchHistory();
      } else {
        toast.error(data.error || "Failed to cancel");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 p-2 pointer-events-none">
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] sm:h-[600px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
          <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t("chat_assistant")}</h3>
                <p className="text-[10px] opacity-80">{t("how_can_i_help")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClearHistory}
                title={t("clear_history")}
                className="hover:bg-white/10 p-1.5 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4 opacity-80 hover:opacity-100" />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t("chat_assistant")}</p>
                  <p className="text-xs text-muted-foreground">{t("ask_anything")}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start gap-2")}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="max-w-[80%] space-y-2">
                    <div className={cn(
                      "p-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none border border-border"
                    )}>
                      {msg.content}
                    </div>

                    {msg.metadata?.is_transaction && msg.metadata?.pending_id && (
                      <div className="bg-card border border-border rounded-xl p-3 shadow-sm space-y-3 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{t("pending_status")}</span>
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            {t("save_as_draft")}
                          </div>
                        </div>
                        
                        {msg.metadata.pending_data && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t("amount")}:</span>
                              <span className="font-bold text-primary">{msg.metadata.pending_data.amount} {msg.metadata.pending_data.currency || "BDT"}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t("type")}:</span>
                              <span className="font-medium text-foreground">{t(msg.metadata.pending_data.type?.toLowerCase() || "expense")}</span>
                            </div>
                            {msg.metadata.pending_data.entity?.name && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{t("person")}:</span>
                                <span className="font-medium text-foreground">@{msg.metadata.pending_data.entity.name}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleConfirm(msg.metadata!.pending_id!)}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {t("confirm")}
                          </button>
                          <button
                            onClick={() => handleCancel(msg.metadata!.pending_id!)}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95 border border-border"
                          >
                            <X className="w-3 h-3" />
                            {t("cancel")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-2xl rounded-tl-none border border-border flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("assistant_typing")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-border bg-card flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("type_message")}
              disabled={isLoading}
              className="flex-1 bg-muted border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto p-4 rounded-full shadow-2xl transition-all duration-300 active:scale-90 group relative flex items-center justify-center",
          isOpen ? "bg-card text-foreground rotate-90 border border-border" : "bg-primary text-primary-foreground hover:shadow-primary/30"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <>
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-primary group-hover:animate-ping" />
          </>
        )}
        {!isOpen && (
          <div className="absolute right-full mr-4 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-medium text-foreground whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
            {t("chat_assistant")}
          </div>
        )}
      </button>
    </div>
  );
}
