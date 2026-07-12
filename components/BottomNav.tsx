"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { getTheme } from "@/lib/themes";
import { t as tr } from "@/lib/i18n";

const TABS = [
  { href: "/armario", key: "armario" as const, icon: "M4 5h16M6 5v14a1 1 0 001 1h10a1 1 0 001-1V5M12 5v4" },
  { href: "/asesor", key: "asesor" as const, icon: "M12 3l1.9 5.6L20 10l-6.1 1.4L12 17l-1.9-5.6L4 10l6.1-1.4L12 3z" },
  { href: "/comunidad", key: "comunidad" as const, icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/perfil", key: "perfil" as const, icon: "M5.1 19a7 7 0 0113.8 0M12 12a4 4 0 100-8 4 4 0 000 8z" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { theme, perfil } = useStore();
  const t = getTheme(theme);
  return (
    <nav className="navbar-themed fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[12px] font-body tracking-wide transition-colors ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span className="relative">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon} />
                </svg>
                {active && (
                  <span className="absolute -right-2.5 -top-1.5 text-[9px] text-accent">
                    {t.motif}
                  </span>
                )}
              </span>
              {tr(perfil.idioma, tab.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
