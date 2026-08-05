"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";

interface MobileNavProps {
  isAdmin: boolean;
}

export default function MobileNav({ isAdmin }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    ...(isAdmin
      ? [{ href: "/dashboard", label: "Dashboard" }]
      : []),
    { href: "/empresas", label: "Empresas" },
    { href: "/universidades", label: "Universidades" },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-gray-900"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
        <span className="text-base font-semibold text-gray-900">Nova</span>
        <div className="w-11" aria-hidden="true" />
      </header>

      {/* Mobile overlay menu */}
      {isOpen && (
        <div className="fixed inset-0 top-[57px] z-40 bg-white md:hidden">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex h-11 items-center rounded-md px-4 text-base ${
                  isActive(item.href)
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <form action={logoutAction} className="mt-4">
              <button
                type="submit"
                className="flex h-11 w-full items-center rounded-md px-4 text-base text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                Cerrar sesión
              </button>
            </form>
          </nav>
        </div>
      )}
    </>
  );
}
