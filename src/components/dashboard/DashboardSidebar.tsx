import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Wallet, BookOpen, BarChart3, AlertCircle, Settings, Bot, UsersRound, LogOut, HelpCircle, ChevronUp, Shield, Plus } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HelpModal } from "./HelpModal";
import { useSettings } from "@/contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTeam, useTeamAction } from "@/hooks/useTeam";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function DashboardSidebar() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { data: teamData } = useTeam();
  const teamAction = useTeamAction();
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; provider: string } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const myFamilies = teamData?.myFamilies || [];
  const activeFamilyId = teamData?.activeFamilyId;
  const activeFamily = myFamilies.find((f: any) => f.family_id === activeFamilyId);

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

  const handleSwitchTeam = async (familyId: string) => {
    if (familyId === activeFamilyId) return;
    try {
      await teamAction.mutateAsync({ action: 'SWITCH_TEAM', familyId });
    } catch (err) {}
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[hsl(var(--sidebar-background))] border-r border-sidebar-border h-screen sticky top-0">
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

      <div className="px-3 pt-4 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 transition-colors">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <UsersRound className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-left truncate">
                  <p className="text-xs font-bold text-foreground truncate">{t(activeFamily?.name) || activeFamily?.name || t("my_team")}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{activeFamily?.role || 'MEMBER'}</p>
                </div>
              </div>
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[230px]">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{t("my_teams_profiles")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {myFamilies.filter((f: any) => f.status === 'ACCEPTED').map((fam: any) => (
              <DropdownMenuItem 
                key={fam.family_id} 
                onClick={() => handleSwitchTeam(fam.family_id)}
                className="gap-2 text-xs py-2"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${fam.family_id === activeFamilyId ? 'bg-primary' : 'bg-transparent border border-muted-foreground/30'}`} />
                <span className="flex-1 truncate">{t(fam.name) || fam.name || 'Shared Team'}</span>
                {fam.role === 'OWNER' && <Shield className="w-3 h-3 text-muted-foreground" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-xs py-2 text-primary focus:text-primary" onClick={() => navigate('/team')}>
              <Plus className="w-3.5 h-3.5" /> {t("manage_teams")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navigationItems.map(item => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-primary/10 text-primary font-semibold"
          >
            <item.icon className="w-4 h-4" />
            <span>{t(item.label)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          activeClassName="bg-primary/10 text-primary font-semibold"
        >
          <Settings className="w-4 h-4" />
          <span>{t("settings")}</span>
        </NavLink>
        <button
          onClick={() => setHelpOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors mt-0.5"
        >
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>{t("help_docs")}</span>
        </button>
        <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
        <div className="mt-4 px-3 flex items-center justify-between">
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
    </aside>
  );
}
