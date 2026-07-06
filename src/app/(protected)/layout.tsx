import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { StaffShell } from "@/components/layout/staff-shell"
import { VendorShell } from "@/components/layout/vendor-shell"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const user = { name: session.user.name ?? session.user.email ?? "User", role: session.user.role }

  if (user.role === "VENDOR") {
    return <VendorShell user={{ name: user.name, role: "VENDOR" }}>{children}</VendorShell>
  }

  return (
    <StaffShell user={{ name: user.name, role: user.role as "ADMIN" | "APPROVER" }}>
      {children}
    </StaffShell>
  )
}
