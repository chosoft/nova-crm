"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DesktopNavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function DesktopNavLink({ href, children }: DesktopNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex h-11 items-center rounded-md px-4 text-sm transition-colors ${
        isActive
          ? "bg-gray-100 font-medium text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  );
}
