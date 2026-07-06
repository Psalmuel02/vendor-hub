import type { DocumentStatus } from "@/generated/prisma/client"

export type EffectiveDocumentStatus = DocumentStatus | "EXPIRING_SOON"

const EXPIRING_SOON_WINDOW_DAYS = 30

/**
 * The stored `status` only tracks the review workflow (PENDING_REVIEW /
 * APPROVED / REJECTED). Expiry-driven states are derived on read since the
 * cron job that would persist them (PRD Phase 2) doesn't exist yet.
 */
export function getEffectiveDocumentStatus(doc: {
  status: DocumentStatus
  expiryDate: Date | null
}): EffectiveDocumentStatus {
  if (doc.status !== "APPROVED" || !doc.expiryDate) {
    return doc.status
  }

  const now = new Date()
  const msUntilExpiry = doc.expiryDate.getTime() - now.getTime()
  const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24)

  if (daysUntilExpiry < 0) return "EXPIRED"
  if (daysUntilExpiry <= EXPIRING_SOON_WINDOW_DAYS) return "EXPIRING_SOON"
  return "APPROVED"
}
