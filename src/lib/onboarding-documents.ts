export const REQUIRED_DOCUMENT_TYPES = [
  { key: "cac_certificate", label: "CAC Certificate" },
  { key: "tax_clearance", label: "Tax Clearance Certificate" },
  { key: "insurance_certificate", label: "Insurance Certificate" },
] as const

export type RequiredDocumentKey = (typeof REQUIRED_DOCUMENT_TYPES)[number]["key"]
