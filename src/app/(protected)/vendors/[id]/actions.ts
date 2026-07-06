"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { VendorStatus } from "@/generated/prisma/client"

export async function toggleVendorStatus(formData: FormData) {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Only Admins can change vendor status")
  }

  const vendorId = formData.get("vendorId")
  const nextStatus = formData.get("nextStatus")
  if (typeof vendorId !== "string" || typeof nextStatus !== "string") {
    throw new Error("Invalid request")
  }
  if (nextStatus !== VendorStatus.ACTIVE && nextStatus !== VendorStatus.SUSPENDED) {
    throw new Error("Invalid target status")
  }

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { status: nextStatus },
  })

  revalidatePath(`/vendors/${vendorId}`)
  revalidatePath("/vendors")
}
