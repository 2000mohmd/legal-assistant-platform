"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/marriage/chat", key: "chat" },
  { href: "/marriage/documents", key: "documents" },
] as const;

export default function MarriageLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("marriageNav");
  const pathname = usePathname();

  return (
    <div className="container-page py-8">
      <nav className="mb-6 inline-flex items-center gap-1 rounded-full bg-primary-tint p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors",
              pathname === tab.href && "bg-primary text-white"
            )}
          >
            {t(tab.key)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
