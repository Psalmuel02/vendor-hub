import { auth } from "@/lib/auth"

import { StaffDashboard } from "./staff-dashboard"
import { VendorDashboard } from "./vendor-dashboard"

export default async function DashboardPage() {
  const session = await auth()

  if (session?.user.role === "VENDOR") {
    if (!session.user.vendorId) {
      return <p className="text-sm text-muted-foreground">Complete onboarding to see your dashboard.</p>
    }
    return <VendorDashboard vendorId={session.user.vendorId} />
  }

  return <StaffDashboard />
}
