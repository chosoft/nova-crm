import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import MobileNav from "@/components/dashboard/MobileNav";
import { DesktopNavLink } from "@/components/dashboard/DesktopNavLink";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  const navItems = [
    ...(isAdmin ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    { href: "/empresas", label: "Empresas" },
    { href: "/universidades", label: "Universidades" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile navigation */}
      <MobileNav isAdmin={isAdmin} />

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-60 flex-col border-r border-gray-200 bg-white md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <span className="text-xl font-semibold text-gray-900">Nova</span>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => (
            <DesktopNavLink key={item.href} href={item.href}>
              {item.label}
            </DesktopNavLink>
          ))}
        </nav>

        {/* Logout button */}
        <div className="border-t border-gray-200 p-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex h-11 w-full items-center rounded-md px-4 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-[57px] md:pt-0 md:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
