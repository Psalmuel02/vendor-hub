import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { DocumentsTable } from "@/components/documents-table"
import { ChecklistSection } from "@/components/checklist/checklist-section"
import { PerformanceHistory } from "@/components/performance/performance-history"

import { ProfileTabs } from "./profile-tabs"
import { UploadDocumentForm } from "./upload-document-form"

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ tab }, session] = await Promise.all([searchParams, auth()])

  if (!session?.user.vendorId) {
    redirect("/onboarding")
  }

  const activeTab = tab === "checklist" || tab === "performance" ? tab : "documents"

  return (
    <div className="space-y-4">
      <ProfileTabs activeTab={activeTab} />

      {activeTab === "documents" && (
        <MyDocuments vendorId={session.user.vendorId} />
      )}
      {activeTab === "checklist" && (
        <ChecklistSection vendorId={session.user.vendorId} viewerRole="VENDOR" />
      )}
      {activeTab === "performance" && <PerformanceHistory vendorId={session.user.vendorId} />}
    </div>
  )
}

async function MyDocuments({ vendorId }: { vendorId: string }) {
  const documents = await prisma.complianceDocument.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-4">
      <UploadDocumentForm />
      <Card>
        <CardContent>
          <DocumentsTable documents={documents} canReview={false} />
        </CardContent>
      </Card>
    </div>
  )
}
