import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Terminal, MessageSquare, History, Search, Users, Shield, Clock, TrendingUp, TrendingDown, ChevronUp, Ban, CheckCircle2, UserX, UserCheck, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function Logs() {
  const [data, setData] = useState<{ actionLogs: any[]; chatMessages: any[] } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"actions" | "chats" | "users">("users");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);
  const [userFilter, setUserFilter] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  const fetchLogs = () => {
    fetch("/api/admin/logs")
      .then(r => r.json())
      .then(d => {
        if (d.ok) setData(d);
      })
      .catch((e) => console.error(e));
  };

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => {
        if (d.ok) setUsers(d.users);
        else toast.error(d.error || "Failed to load users");
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  const handleUpdateLimit = async (telegramUserId: number, newLimit: number, months: number = 1) => {
    setUpdating(telegramUserId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId, newLimit, durationMonths: months })
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(`Limit updated to ${newLimit} for ${months} month(s)`);
        fetchUsers();
      } else {
        toast.error(d.error || "Failed to update limit");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleBlock = async (telegramUserId: number, currentBlocked: boolean) => {
    setUpdating(telegramUserId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_BLOCK", telegramUserId, blocked: !currentBlocked })
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(currentBlocked ? "User unblocked successfully" : "User blocked successfully");
        fetchUsers();
      } else {
        toast.error(d.error || "Failed to toggle block status");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const applyUserFilter = (userId: number) => {
    setUserFilter(userId);
    setSearch(""); // Clear general search when filtering by user
    toast.info(`Filtering activity for user ${userId}`);
  };

  const filteredLogs = (data?.actionLogs || []).filter(l => {
    const matchesUser = userFilter ? Number(l.userId) === userFilter : true;
    const matchesSearch = JSON.stringify(l).toLowerCase().includes(search.toLowerCase());
    return matchesUser && matchesSearch;
  });

  const filteredChats = (data?.chatMessages || []).filter(m => {
    const matchesUser = userFilter ? Number(m.user_id) === userFilter : true;
    const matchesSearch = m.content?.toLowerCase().includes(search.toLowerCase()) || m.metadata?.raw_response?.toLowerCase().includes(search.toLowerCase());
    return matchesUser && matchesSearch;
  });

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    String(u.telegram_user_id).includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-4 lg:mx-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Admin Control Room
            </h1>
            <p className="text-muted-foreground text-sm">Audit user activity, manage safety, and handle resource allocation.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {userFilter && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-xs border-primary/30 bg-primary/5"
                onClick={() => setUserFilter(null)}
              >
                <Filter className="w-3 h-3" /> User: {userFilter} <X className="w-3 h-3" />
              </Button>
            )}
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search logs or users..." 
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-card outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 w-fit backdrop-blur-sm border border-border/50">
          {[
            { id: "users", label: "User Management", icon: Users },
            { id: "chats", label: "Evidence & Chats", icon: MessageSquare },
            { id: "actions", label: "Audit Logs", icon: Terminal }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-background shadow-md text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading && activeTab === "users" ? (
          <div className="flex flex-col items-center justify-center p-20 text-muted-foreground gap-4">
            <History className="w-10 h-10 animate-spin text-primary/40" />
            <p className="font-medium animate-pulse">Scanning user grid...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {activeTab === "users" && (
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                        <th className="px-6 py-4">User Identity</th>
                        <th className="px-6 py-4">Status & Role</th>
                        <th className="px-6 py-4">Usage Limit</th>
                        <th className="px-6 py-4">Expiry</th>
                        <th className="px-6 py-4 text-right">Protection Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredUsers.map((u) => (
                        <tr key={u.telegram_user_id} className={`hover:bg-muted/10 transition-colors ${u.is_blocked ? 'bg-red-500/[0.02]' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-inner ${u.is_blocked ? 'bg-red-500/20 text-red-600' : 'bg-primary/10 text-primary'}`}>
                                {u.is_blocked ? <Ban className="w-5 h-5" /> : (u.first_name?.[0] || u.username?.[0] || "?")}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground flex items-center gap-1.5">
                                  {u.first_name} {u.last_name}
                                  {u.is_blocked && <UserX className="w-3.5 h-3.5 text-red-500" />}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">TG_ID: {u.telegram_user_id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight border ${u.role === 'ADMIN' ? 'bg-red-500 text-white border-red-600' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                {u.role}
                              </span>
                              {u.is_blocked && (
                                <span className="text-[9px] font-bold text-red-600 uppercase flex items-center gap-1">
                                  <Ban className="w-2.5 h-2.5" /> Suspended
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-sm font-bold px-2 py-1 rounded border ${u.available_credits === 0 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-muted border-border'}`}>
                                {u.available_credits}/{u.daily_credit_limit}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase font-medium">Credits</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                            {u.limit_expiry ? (
                              <div className="flex flex-col">
                                <span className="text-foreground font-semibold">{format(new Date(u.limit_expiry), 'dd MMM yyyy')}</span>
                                <span className="text-[10px] opacity-70">{format(new Date(u.limit_expiry), 'HH:mm')}</span>
                              </div>
                            ) : (
                              <span className="opacity-40 italic text-[10px]">Unlimited Duration</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 className="h-8 px-2.5 text-[9px] font-black uppercase gap-1.5 hover:bg-primary/5"
                                 onClick={() => handleUpdateLimit(u.telegram_user_id, 100, 1)}
                                 disabled={updating === u.telegram_user_id || u.is_blocked}
                               >
                                 <TrendingUp className="w-3 h-3 text-green-500" /> Upgrade
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant={u.is_blocked ? "ghost" : "outline"}
                                 className={`h-8 px-2.5 text-[9px] font-black uppercase gap-1.5 ${u.is_blocked ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50 border-red-500/20'}`}
                                 onClick={() => handleToggleBlock(u.telegram_user_id, !!u.is_blocked)}
                                 disabled={updating === u.telegram_user_id || u.role === 'ADMIN'}
                               >
                                 {u.is_blocked ? <><UserCheck className="w-3.5 h-3.5" /> Unblock</> : <><UserX className="w-3.5 h-3.5" /> Block</>}
                               </Button>
                               <Button 
                                 size="icon" 
                                 variant="ghost" 
                                 className="h-8 w-8 hover:bg-primary/10"
                                 onClick={() => applyUserFilter(u.telegram_user_id)}
                                 title="Filter activity"
                               >
                                 <Filter className="w-3.5 h-3.5 text-primary" />
                               </Button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(activeTab === "chats" || activeTab === "actions") && (
               <div className="space-y-4">
                 {activeTab === "chats" ? (
                   filteredChats.length > 0 ? (
                    filteredChats.map((m, i) => (
                      <div key={m._id || i} className="p-5 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/30 transition-all shadow-sm group">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${m.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              {m.role}
                            </span>
                            <div className="flex flex-col">
                              <button 
                                className="text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                                onClick={() => applyUserFilter(Number(m.user_id))}
                              >
                                User: {m.user_id} <Filter className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                              <span className="text-[9px] text-muted-foreground uppercase font-medium">{m.source}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-mono">{format(new Date(m.created_at), 'HH:mm:ss dd MMM')}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap pl-1 border-l-2 border-primary/20">{m.content}</p>
                        
                        {m.metadata?.raw_response && (
                          <details className="mt-4 group border border-border rounded-xl bg-muted/30">
                            <summary className="text-[10px] font-bold text-primary p-3 cursor-pointer hover:bg-muted/50 list-none flex items-center justify-between transition-all">
                              <span>VIEW RAW AI PAYLOAD</span>
                              <ChevronUp className="w-3 h-3 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="p-4 bg-muted/80 text-foreground font-mono text-[11px] overflow-x-auto whitespace-pre rounded-b-xl border-t border-border">
                              {m.metadata.raw_response}
                            </div>
                          </details>
                        )}
                        
                        {m.metadata?.results?.length > 0 && (
                          <div className="mt-4 grid gap-2">
                             <p className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-tighter">
                                <Terminal className="w-3 h-3" /> Execution Log
                             </p>
                             {m.metadata.results.map((r: any, ri: number) => (
                               <div key={ri} className={`p-3 rounded-xl text-[11px] font-mono border-l-4 ${r.result?.ok ? 'bg-green-500/5 border-green-500/40 text-green-700' : 'bg-red-500/5 border-red-500/40 text-red-700'}`}>
                                 <span className="font-bold uppercase">{r.action}</span>: {r.result?.ok ? "SUCCESS" : "FAILED"}
                                 {r.result?.error && <p className="mt-1.5 opacity-70 italic text-[10px]">{r.result.error}</p>}
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    ))
                   ) : (
                    <div className="p-20 text-center border-2 border-dashed border-border rounded-3xl text-muted-foreground">
                      No matching records found for this safety scan.
                    </div>
                   )
                 ) : (
                  <div className="overflow-hidden rounded-2xl border border-border shadow-sm bg-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                            <th className="px-6 py-4">Security Timestamp</th>
                            <th className="px-6 py-4">Operation</th>
                            <th className="px-6 py-4">Identity</th>
                            <th className="px-6 py-4">Command Parameters</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {filteredLogs.map((l, i) => (
                            <tr key={l._id || i} className="hover:bg-muted/20 transition-colors text-xs group">
                              <td className="px-6 py-4 text-muted-foreground whitespace-nowrap font-mono">{format(new Date(l.timestamp), 'HH:mm:ss dd MMM')}</td>
                              <td className="px-6 py-4 font-bold text-primary uppercase tracking-tighter">{l.action}</td>
                              <td className="px-6 py-4">
                                <button 
                                  className="text-muted-foreground font-mono hover:text-primary transition-colors flex items-center gap-1.5"
                                  onClick={() => applyUserFilter(Number(l.userId))}
                                >
                                  {l.userId} <Filter className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              </td>
                              <td className="px-6 py-4 max-w-md">
                                <div className="truncate font-mono text-[10px] bg-muted/50 p-1.5 rounded border border-border/50" title={JSON.stringify(l.params)}>
                                  {JSON.stringify(l.params)}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredLogs.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-20 text-center text-muted-foreground italic">No audit records found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                 )}
               </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
