"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: "All Amendments", href: "/dashboard" },
    { name: "Senate Amendments", href: "/dashboard/senate" },
    { name: "House Amendments", href: "/dashboard/house" },
    { name: "By Bill", href: "/dashboard/by-bill" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-white text-xl font-bold">
                  CT Session Tracker
                </h1>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        pathname === item.href
                          ? "bg-indigo-700 text-white"
                          : "text-white hover:bg-indigo-500"
                      } rounded-md px-3 py-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="text-white mr-4">{session?.user?.email}</div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
                >
                  Sign out
                </button>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              {/* Mobile menu button */}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 p-2 text-indigo-200 hover:bg-indigo-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? "bg-indigo-700 text-white"
                    : "text-white hover:bg-indigo-500"
                } block rounded-md px-3 py-2 text-base font-medium`}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-indigo-500 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="text-white">{session?.user?.email}</div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-indigo-500"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="w-full py-6">
          {pathname.includes("/bill/") && pathname.includes("/compare") ? (
            // For comparison pages, use full width with no padding
            <div className="w-full">{children}</div>
          ) : (
            // For other dashboard pages, keep the standard container
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">{children}</div>
          )}
        </div>
      </main>
    </div>
  );
}
