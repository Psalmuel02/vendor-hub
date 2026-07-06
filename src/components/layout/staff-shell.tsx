"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { BreadcrumbLabelsProvider, useBreadcrumbLabels } from "./breadcrumb-context"
import { isNavGroup, STAFF_NAV } from "./staff-nav-config"
import { UserMenu } from "./user-menu"

function humanize(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function useBreadcrumbSegments(pathname: string, labels: Record<string, string>) {
  const segments = pathname.split("/").filter(Boolean)
  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    return {
      label: labels[href] ?? humanize(segment),
      href,
      isLast: index === segments.length - 1,
    }
  })
}

export function StaffShell({
  user,
  children,
}: {
  user: { name: string; role: "ADMIN" | "APPROVER" }
  children: React.ReactNode
}) {
  return (
    <BreadcrumbLabelsProvider>
      <StaffShellInner user={user}>{children}</StaffShellInner>
    </BreadcrumbLabelsProvider>
  )
}

function StaffShellInner({
  user,
  children,
}: {
  user: { name: string; role: "ADMIN" | "APPROVER" }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdmin = user.role === "ADMIN"
  const labels = useBreadcrumbLabels()
  const breadcrumbSegments = useBreadcrumbSegments(pathname, labels)

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-4 text-sidebar-foreground">
        <div className="mb-4 px-2 text-lg font-semibold">Vendor City</div>
        <nav className="flex flex-col gap-1">
          {STAFF_NAV.filter((entry) => isAdmin || !entry.adminOnly).map((entry) =>
            isNavGroup(entry) ? (
              <div key={entry.label} className="mt-3 first:mt-0">
                <p className="px-2 text-xs font-medium uppercase text-muted-foreground">
                  {entry.label}
                </p>
                <div className="mt-1 flex flex-col gap-1">
                  {entry.items
                    .filter((item) => isAdmin || !item.adminOnly)
                    .map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent",
                          pathname.startsWith(item.href) && "bg-sidebar-accent font-medium"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                </div>
              </div>
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent",
                  pathname.startsWith(entry.href) && "bg-sidebar-accent font-medium"
                )}
              >
                {entry.label}
              </Link>
            )
          )}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbSegments.map((segment) => (
                <span key={segment.href} className="flex items-center gap-1.5">
                  <BreadcrumbItem>
                    {segment.isLast ? (
                      <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={segment.href}>{segment.label}</Link>} />
                    )}
                  </BreadcrumbItem>
                  {!segment.isLast && <BreadcrumbSeparator />}
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <UserMenu name={user.name} role={user.role} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
