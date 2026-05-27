"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV: { href: string; key: string }[] = [
  { href: "/overview", key: "nav.overview" },
  { href: "/forecasting", key: "nav.forecasting" },
  { href: "/inventory", key: "nav.inventory" },
  { href: "/transactions", key: "nav.transactions" },
  { href: "/methodology", key: "nav.methodology" },
];

export function Topbar() {
  const pathname = usePathname() ?? "/overview";
  const { t } = useTranslation();

  const activeLabel = NAV.find((n) => pathname.startsWith(n.href))?.key ?? "nav.overview";

  return (
    <header className="bg-surface border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <Link href="/overview" className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-accent" />
          <span className="font-semibold">MarginBoard</span>
        </Link>
        <span className="text-sm text-ink-muted flex-1 text-right">{t(activeLabel)}</span>
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <nav className="flex overflow-x-auto border-t border-border">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm whitespace-nowrap ${
                active ? "text-accent font-medium" : "text-ink-muted"
              }`}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
