import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Wallet, BookOpen, BarChart3, AlertCircle, Settings, Bot, UsersRound, LogOut, HelpCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HelpModal } from "./HelpModal";
import { useSettings } from "@/contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, to: '/' },
  { label: 'Entities', icon: Users, to: '/entities' },
  { label: 'Accounts', icon: Wallet, to: '/accounts' },
  { label: 'Lenden', icon: BookOpen, to: '/lenden' },
  { label: 'Reports', icon: BarChart3, to: '/reports' },
  { label: 'Team', icon: UsersRound, to: '/team' },
];


export function DashboardSidebar() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; provider: string } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

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
        window.location.reload(); // clear auth state
      } else {
        toast.error("Failed to log out");
      }
    } catch (err) {
      toast.error("An error occurred during logout");
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-[hsl(var(--sidebar-background))] border-r border-sidebar-border h-screen sticky top-0">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">Life-OS</h1>
            <p className="text-[10px] text-muted-foreground">{t("financial_dashboard")}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-primary/10 text-primary font-semibold"
          >
            <item.icon className="w-4 h-4" />
            <span>{t(item.label.toLowerCase())}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          activeClassName="bg-primary/10 text-primary font-semibold"
        >
          <Settings className="w-4 h-4" />
          <span>{t("settings")}</span>
        </NavLink>
        <button
          onClick={() => setHelpOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors mt-0.5"
        >
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>{t("help_docs")}</span>
        </button>
        <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
        <div className="mt-3 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {profile?.first_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-[11px] font-medium text-foreground">
                {profile ? `${profile.first_name} ${profile.last_name}`.trim() : t("loading")}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
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
    </aside>
  );
}
