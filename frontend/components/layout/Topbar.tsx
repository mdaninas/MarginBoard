"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV: { href: string; key: string }[] = [
  { href: "/overview", key: "nav.overview" },
  { href: "/forecasting", key: "nav.forecasting" },
  { href: "/customers", key: "nav.customers" },
  { href: "/basket", key: "nav.basket" },
  { href: "/products", key: "nav.products" },
  { href: "/inventory", key: "nav.inventory" },
  { href: "/transactions", key: "nav.transactions" },
];

export function Topbar() {
  const pathname = usePathname() ?? "/overview";
  const { t } = useTranslation();

  const activeLabel = NAV.find((n) => pathname.startsWith(n.href))?.key ?? "nav.overview";

  return (
    <header className="border-b border-rule bg-surface md:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/overview" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-semibold">MarginBoard</span>
        </Link>
        <span className="flex-1 text-right text-sm text-ink-muted">{t(activeLabel)}</span>
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <nav className="flex overflow-x-auto border-t border-rule">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-4 py-2 text-sm ${
                active ? "font-medium text-accent" : "text-ink-muted"
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
