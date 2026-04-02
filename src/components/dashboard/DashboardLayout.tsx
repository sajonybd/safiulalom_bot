import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu } from "lucide-react";
import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Users, Wallet, BookOpen, BarChart3, UsersRound, Settings, Bot, X } from "lucide-react";

const mobileNavItems = [
  { label: 'Overview', icon: LayoutDashboard, to: '/' },
  { label: 'People', icon: Users, to: '/people' },
  { label: 'Accounts', icon: Wallet, to: '/accounts' },
  { label: 'Lenden', icon: BookOpen, to: '/lenden' },
  { label: 'Reports', icon: BarChart3, to: '/reports' },
  { label: 'Team', icon: UsersRound, to: '/team' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-card border-r border-border h-full flex flex-col animate-slide-in">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Life-OS</span>
              </div>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
              {mobileNavItems.map(item => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === '/'}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground/70 hover:bg-muted transition-colors"
                  activeClassName="bg-primary/10 text-primary font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-sm font-bold text-foreground">Life-OS</h1>
          </div>
          <ThemeToggle />
        </header>
        {children}
      </main>
    </div>
  );
}
