"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors [&_svg]:size-4",
        active ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
