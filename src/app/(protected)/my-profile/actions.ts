"use server"

import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApprovalStatus, ApprovalType, DocumentStatus } from "@/generated/prisma/client"

const MAX_FILE_BYTES = 5 * 1024 * 1024

const uploadSchema = z.object({
  type: z.string().min(1, "Document type is required"),
  expiryDate: z.string().optional(),
})

export type UploadDocumentState = { error: string } | undefined

export async function uploadVendorDocument(
  _prevState: UploadDocumentState,
  formData: FormData
): Promise<UploadDocumentState> {
  const session = await auth()
  if (!session || session.user.role !== "VENDOR" || !session.user.vendorId) {
    throw new Error("Only onboarded vendors can upload documents")
  }

  const parsed = uploadSchema.safeParse({
    type: formData.get("type"),
    expiryDate: formData.get("expiryDate") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload" }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "File must be under 5MB" }
  }

  const vendorId = session.user.vendorId
  const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null

  const uploadDir = path.join(process.cwd(), "public", "uploads", "vendors", vendorId)
  await mkdir(uploadDir, { recursive: true })
  const ext = path.extname(file.name) || ""
  const safeName = `${Date.now()}-${randomUUID()}${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, safeName), bytes)

  await prisma.$transaction(async (tx) => {
    const document = await tx.complianceDocument.create({
      data: {
        vendorId,
        type: parsed.data.type,
        fileUrl: `/uploads/vendors/${vendorId}/${safeName}`,
        expiryDate,
        status: DocumentStatus.PENDING_REVIEW,
      },
    })

    await tx.approvalRequest.create({
      data: {
        vendorId,
        type: ApprovalType.DOCUMENT,
        refId: document.id,
        status: ApprovalStatus.PENDING,
      },
    })
  })

  revalidatePath("/my-profile")
  revalidatePath("/approvals")
}
