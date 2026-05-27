"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV = [
  { href: "/overview", key: "nav.overview" },
  { href: "/forecasting", key: "nav.forecasting" },
  { href: "/inventory", key: "nav.inventory" },
  { href: "/transactions", key: "nav.transactions" },
  { href: "/methodology", key: "nav.methodology" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-surface">
      <div className="px-6 py-5 border-b border-border">
        <Link href="/overview" className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-accent" />
          <span className="font-semibold tracking-tight">MarginBoard</span>
        </Link>
        <p className="text-xs text-ink-muted mt-1">{t("app.tagline")}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-background",
              )}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <p className="text-xs text-ink-muted">{t("app.data_source")}</p>
      </div>
    </aside>
  );
}
