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
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:gap-5 md:overflow-y-auto md:border-r md:border-rule md:px-4 md:py-5">
      {/* Logo + wordmark */}
      <Link href="/overview" className="flex items-center gap-2.5 px-1">
        <Logo size={30} />
        <div className="leading-none">
          <div className="text-[14.5px] font-semibold tracking-tight">MarginBoard</div>
          <div className="mt-1 text-[10px] text-ink-faint">retail ops</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
          Workspace
        </div>
        {NAV.map(({ href, key, Icon }) => {
          const active = pathname === href || (pathname?.startsWith(href + "/") ?? false);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-mb-1 px-2.5 py-2 text-[12.5px] transition-colors",
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

      <div className="flex-1" />

      {/* Dataset card — honest about the source; the dataset is historical,
          not a live feed, so no "synced" / real-time language. */}
      <div className="rounded-mb-2 border border-rule bg-surface-2 p-3">
        <div className="text-[11px] font-semibold">Online Retail II</div>
        <div className="mt-0.5 text-[10.5px] text-ink-faint">
          UCI · Dec 2009 – Dec 2011
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
