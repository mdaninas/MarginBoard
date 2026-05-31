"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { Logo } from "@/components/brand/Logo";
import {
  OverviewIcon,
  ForecastingIcon,
  CustomersIcon,
  BasketIcon,
  ProductsIcon,
  InventoryIcon,
  TransactionsIcon,
} from "@/components/icons/NavIcons";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const NAV: { href: string; key: string; Icon: IconType }[] = [
  { href: "/overview", key: "nav.overview", Icon: OverviewIcon },
  { href: "/forecasting", key: "nav.forecasting", Icon: ForecastingIcon },
  { href: "/customers", key: "nav.customers", Icon: CustomersIcon },
  { href: "/basket", key: "nav.basket", Icon: BasketIcon },
  { href: "/products", key: "nav.products", Icon: ProductsIcon },
  { href: "/inventory", key: "nav.inventory", Icon: InventoryIcon },
  { href: "/transactions", key: "nav.transactions", Icon: TransactionsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:border-r md:border-rule md:px-3 md:py-4">
      {/* Header: brand + controls. Theme toggle and language live up here so
          they read as app chrome, not stranded at the bottom. */}
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <Link href="/overview" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-[15px] font-semibold tracking-tight">MarginBoard</span>
        </Link>
        <ThemeToggle />
      </div>

      <LanguageSwitcher className="mb-4 w-full" />

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, key, Icon }) => {
          const active = pathname === href || (pathname?.startsWith(href + "/") ?? false);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-mb-1 px-2.5 py-2.5 text-[13px] transition-colors",
                active
                  ? "border border-rule bg-surface font-medium text-ink shadow-card"
                  : "border border-transparent text-ink-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Icon className={active ? "text-accent" : "text-ink-faint"} />
              <span className="flex-1">{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
