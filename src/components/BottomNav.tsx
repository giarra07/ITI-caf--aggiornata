import { Link, useRouterState } from "@tanstack/react-router";
import { Terminal, ShoppingBag, MessageSquare, Package, User } from "lucide-react";

/** Tab primarie: Terminal · Shop · Chat · Stock · Stats */
const tabs = [
  { to: "/dashboard", label: "term", icon: Terminal },
  { to: "/shop", label: "shop", icon: ShoppingBag },
  { to: "/chat", label: "pizz", icon: MessageSquare },
  { to: "/inventory", label: "stock", icon: Package },
  { to: "/profile", label: "stats", icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-primary/40 bg-silicon-gray/95 backdrop-blur supports-[backdrop-filter]:bg-silicon-gray/80"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = path === to || (to !== "/dashboard" && path.startsWith(to));
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center gap-0.5 py-2 font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  active ? "text-primary text-glow" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
