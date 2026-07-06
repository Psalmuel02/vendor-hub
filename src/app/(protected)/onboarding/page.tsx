import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardingPage() {
  const session = await auth()
  if (session?.user.vendorId) {
    redirect("/dashboard")
  }

  const categories = await prisma.vendorCategory.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="mx-auto max-w-2xl">
      <OnboardingWizard categories={categories} />
    </div>
  )
}
