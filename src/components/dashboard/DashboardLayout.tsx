import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { LogOut, HelpCircle, Settings as SettingsIcon, Menu, Bot, X } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { HelpModal } from "./HelpModal";
import { toast } from "sonner";

import { useSettings } from "@/contexts/SettingsContext";

import { ChatWidget } from "./ChatWidget";

// Mobile navigation now uses shared navigationItems from @/lib/navigation

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { t, language } = useSettings();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; provider: string } | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.authenticated && d.user) {
          setProfile(d.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/ui_logout", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success("Successfully logged out");
        navigate("/login");
        window.location.reload();
      }
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative">
      <DashboardSidebar />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[hsl(var(--sidebar-background))] border-r border-sidebar-border h-full flex flex-col animate-slide-in">
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground tracking-tight">Life-OS</h1>
                  <p className="text-[10px] text-muted-foreground">{t("financial_dashboard")}</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navigationItems.map(item => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === '/'}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-primary/10 text-primary font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{t(item.label)}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-3 border-t border-sidebar-border space-y-1">
              <NavLink
                to="/settings"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-primary/10 text-primary font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>{t("settings")}</span>
              </NavLink>
              
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setHelpOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>{t("help_docs")}</span>
              </button>

              <div className="pt-4 pb-2 px-3 border-t border-sidebar-border mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {profile?.first_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {profile ? `${profile.first_name} ${profile.last_name}`.trim() : t("loading")}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {t("via")} {profile?.provider || "..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ThemeToggle />
                    <button 
                      onClick={handleLogout}
                      className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title={t("logout")}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
      
      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />

      <main className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}>
              <Menu className="w-6 h-6 text-muted-foreground" />
            </button>
            <h1 className="text-sm font-bold text-foreground">Life-OS</h1>
          </div>
          <ThemeToggle />
        </header>
        {children}
      </main>

      <ChatWidget />
    </div>
  );
}
