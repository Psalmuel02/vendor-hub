"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { VENDOR_NAV } from "./staff-nav-config"
import { UserMenu } from "./user-menu"

export function VendorShell({
  user,
  children,
}: {
  user: { name: string; role: "VENDOR" }
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">Vendor City</span>
          <nav className="flex items-center gap-4">
            {VENDOR_NAV.map((item) => {
              const [itemPath] = item.href.split("?")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm text-muted-foreground hover:text-foreground",
                    pathname === itemPath && "font-medium text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <UserMenu name={user.name} role={user.role} />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
