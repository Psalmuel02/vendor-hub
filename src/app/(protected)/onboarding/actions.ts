"use server"

import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/onboarding-documents"
import {
  ApprovalStatus,
  ApprovalType,
  DocumentStatus,
  VendorStatus,
} from "@/generated/prisma/client"

const MAX_FILE_BYTES = 5 * 1024 * 1024

const detailsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  categoryId: z.string().min(1, "Please select a category"),
})

export type OnboardingState = { error: string } | undefined

export async function submitOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const session = await auth()
  if (!session || session.user.role !== "VENDOR") {
    throw new Error("Only vendors can submit onboarding applications")
  }

  const existing = await prisma.vendor.findUnique({ where: { userId: session.user.id } })
  if (existing) {
    return { error: "You have already submitted an onboarding application." }
  }

  const parsed = detailsSchema.safeParse({
    companyName: formData.get("companyName"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    categoryId: formData.get("categoryId"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const category = await prisma.vendorCategory.findUnique({
    where: { id: parsed.data.categoryId },
  })
  if (!category) {
    return { error: "Selected category no longer exists" }
  }

  const files: { key: string; label: string; file: File }[] = []
  for (const docType of REQUIRED_DOCUMENT_TYPES) {
    const file = formData.get(docType.key)
    if (!(file instanceof File) || file.size === 0) {
      return { error: `${docType.label} is required` }
    }
    if (file.size > MAX_FILE_BYTES) {
      return { error: `${docType.label} must be under 5MB` }
    }
    files.push({ key: docType.key, label: docType.label, file })
  }

  await prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({
      data: {
        userId: session.user.id,
        companyName: parsed.data.companyName,
        categoryId: category.id,
        status: VendorStatus.PENDING,
        phone: parsed.data.phone,
        address: parsed.data.address,
      },
    })

    const uploadDir = path.join(process.cwd(), "public", "uploads", "vendors", vendor.id)
    await mkdir(uploadDir, { recursive: true })

    for (const { key, label, file } of files) {
      const ext = path.extname(file.name) || ""
      const safeName = `${key}-${randomUUID()}${ext}`
      const bytes = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(uploadDir, safeName), bytes)

      const document = await tx.complianceDocument.create({
        data: {
          vendorId: vendor.id,
          type: label,
          fileUrl: `/uploads/vendors/${vendor.id}/${safeName}`,
          status: DocumentStatus.PENDING_REVIEW,
        },
      })

      await tx.approvalRequest.create({
        data: {
          vendorId: vendor.id,
          type: ApprovalType.DOCUMENT,
          refId: document.id,
          status: ApprovalStatus.PENDING,
        },
      })
    }

    await tx.approvalRequest.create({
      data: {
        vendorId: vendor.id,
        type: ApprovalType.ONBOARDING,
        refId: vendor.id,
        status: ApprovalStatus.PENDING,
      },
    })
  })

  revalidatePath("/approvals")
  redirect("/dashboard")
}
