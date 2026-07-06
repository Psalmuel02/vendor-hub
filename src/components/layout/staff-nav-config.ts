export type NavLink = {
  label: string
  href: string
  adminOnly?: boolean
}

export type NavGroup = {
  label: string
  items: NavLink[]
  adminOnly?: boolean
}

export type NavEntry = NavLink | NavGroup

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry
}

export const STAFF_NAV: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Vendors", href: "/vendors" },
  {
    label: "Compliance",
    items: [
      { label: "Documents", href: "/compliance/documents" },
      { label: "Checklists", href: "/compliance/checklists", adminOnly: true },
    ],
  },
  {
    label: "Performance",
    items: [
      { label: "New Review", href: "/performance/reviews/new" },
      { label: "KPI Templates", href: "/performance/kpis", adminOnly: true },
    ],
  },
  { label: "Approvals", href: "/approvals" },
  { label: "Reports", href: "/reports", adminOnly: true },
  { label: "Audit Log", href: "/audit-log", adminOnly: true },
  {
    label: "Settings",
    adminOnly: true,
    items: [
      { label: "Users", href: "/settings/users", adminOnly: true },
      { label: "Categories", href: "/settings/categories", adminOnly: true },
    ],
  },
]

export const VENDOR_NAV: NavLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Documents", href: "/my-profile?tab=documents" },
  { label: "My Checklist", href: "/my-profile?tab=checklist" },
  { label: "My Performance", href: "/my-profile?tab=performance" },
]
