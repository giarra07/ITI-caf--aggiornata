import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

type Crumb = { path: string; label: string };

const TRAIL: Record<string, Crumb[]> = {
  "/dashboard": [{ path: "/dashboard", label: "Terminal" }],
  "/shop": [
    { path: "/dashboard", label: "Terminal" },
    { path: "/shop", label: "Shop" },
  ],
  "/chat": [
    { path: "/dashboard", label: "Terminal" },
    { path: "/chat", label: "Pizzini.exe" },
  ],
  "/inventory": [
    { path: "/dashboard", label: "Terminal" },
    { path: "/inventory", label: "Inventory" },
  ],
  "/missions": [
    { path: "/dashboard", label: "Terminal" },
    { path: "/missions", label: "Missions" },
  ],
  "/profile": [
    { path: "/dashboard", label: "Terminal" },
    { path: "/profile", label: "Stats" },
  ],
  "/settings": [
    { path: "/dashboard", label: "Terminal" },
    { path: "/settings", label: "Settings" },
  ],
};

const HIDE_ON = new Set(["/", "/minigame", "/game-over"]);

export function Breadcrumbs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (HIDE_ON.has(path)) return null;

  const crumbs = TRAIL[path];
  if (!crumbs || crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-t border-primary/20 px-4 py-1.5">
      <ol className="mx-auto flex max-w-xl flex-wrap items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={10} className="opacity-50" aria-hidden />}
              {last ? (
                <span className="text-primary">{c.label}</span>
              ) : (
                <Link to={c.path} className="hover:text-primary transition-colors">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
