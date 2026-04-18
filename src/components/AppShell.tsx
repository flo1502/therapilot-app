import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, BookMarked, Presentation, Settings, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { lock } from "@/lib/crypto";
import { ReactNode, useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patienten", label: "Patient:innen", icon: Users },
  { to: "/sessions", label: "Sessions", icon: FileText },
  { to: "/templates", label: "Templates", icon: BookMarked },
  { to: "/slides", label: "Slide-Decks", icon: Presentation },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings },
];

interface Props { children: ReactNode; onLock: () => void }

export function AppShell({ children, onLock }: Props) {
  const loc = useLocation();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("therapilot.theme");
    if (stored === "dark") { document.documentElement.classList.add("dark"); setDark(true); }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("therapilot.theme", next ? "dark" : "light");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="size-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-base font-display font-semibold">TheraPilot</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Beta · Lokal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => {
            const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
            return (
              <NavLink key={n.to} to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}>
                <n.icon className="size-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggleDark}>
            {dark ? "☀️ Hell" : "🌙 Dunkel"}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { lock(); onLock(); }}>
            <Lock className="size-4 mr-2" /> Sperren
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b border-border px-4 py-3 flex items-center justify-between bg-card">
          <div className="font-display font-semibold">TheraPilot</div>
          <Button size="sm" variant="ghost" onClick={() => { lock(); onLock(); }}>
            <Lock className="size-4" />
          </Button>
        </div>
        <div className="md:hidden border-b border-border bg-sidebar px-2 py-2 flex gap-1 overflow-x-auto">
          {NAV.map(n => {
            const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
            return (
              <NavLink key={n.to} to={n.to}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs",
                  active ? "bg-sidebar-accent font-medium" : "text-muted-foreground"
                )}>
                <n.icon className="size-3.5" /> {n.label}
              </NavLink>
            );
          })}
        </div>
        <div className="px-4 md:px-10 py-6 md:py-10 max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
