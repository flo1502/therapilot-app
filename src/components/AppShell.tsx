import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FileText, BookMarked, Presentation, Settings, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReactNode, useEffect, useState } from "react";
import { useAuth, signOut } from "@/lib/authState";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patienten", label: "Patient:innen", icon: Users },
  { to: "/sessions", label: "Sessions", icon: FileText },
  { to: "/templates", label: "Templates", icon: BookMarked },
  { to: "/slides", label: "Slide-Decks", icon: Presentation },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings },
];

interface Props { children: ReactNode; onLock: () => void }

export function AppShell({ children }: Props) {
  const loc = useLocation();
  const nav = useNavigate();
  const [dark, setDark] = useState(false);
  const { user, isAuthed } = useAuth();

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

  const handleAuth = async () => {
    if (isAuthed) {
      await signOut();
      toast.success("Ausgeloggt.");
    } else {
      nav("/auth");
    }
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
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Demo · Cloud</div>
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
          {isAuthed && user?.email && (
            <div className="text-[11px] text-muted-foreground px-2 truncate" title={user.email}>{user.email}</div>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggleDark}>
            {dark ? "☀️ Hell" : "🌙 Dunkel"}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleAuth}>
            {isAuthed
              ? (<><LogOut className="size-4 mr-2" /> Logout</>)
              : (<><LogIn className="size-4 mr-2" /> Login</>)}
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b border-border px-4 py-3 flex items-center justify-between bg-card">
          <div className="font-display font-semibold">TheraPilot</div>
          <Button size="sm" variant="ghost" onClick={handleAuth}>
            {isAuthed ? <LogOut className="size-4" /> : <LogIn className="size-4" />}
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
