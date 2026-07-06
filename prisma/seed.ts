import { PrismaClient, Role, VendorStatus } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const SEED_PASSWORD = "Password123!"

async function ensureCategory(name: string) {
  return prisma.vendorCategory.upsert({
    where: { name },
    update: {},
    create: { name },
  })
}

async function ensureUser(params: { name: string; email: string; role: Role }) {
  const password = await bcrypt.hash(SEED_PASSWORD, 10)
  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: { name: params.name, email: params.email, password, role: params.role },
  })
}

async function ensureChecklistTemplate() {
  const name = "Standard Vendor Onboarding Checklist"
  const existing = await prisma.checklistTemplate.findFirst({ where: { name } })
  if (existing) return existing

  return prisma.checklistTemplate.create({
    data: {
      name,
      items: {
        create: [
          { label: "Business registration certificate provided", weight: 3 },
          { label: "Tax compliance certificate provided", weight: 3 },
          { label: "Insurance certificate provided", weight: 2 },
          { label: "Bank verification completed", weight: 2 },
          { label: "References checked", weight: 1 },
        ],
      },
    },
  })
}

async function ensureKpiTemplates() {
  const kpis = [
    { name: "Delivery Timeliness", weight: 3 },
    { name: "Quality", weight: 3 },
    { name: "Cost Adherence", weight: 2 },
    { name: "Communication", weight: 2 },
  ]
  for (const kpi of kpis) {
    const existing = await prisma.kpiTemplate.findFirst({ where: { name: kpi.name } })
    if (!existing) await prisma.kpiTemplate.create({ data: kpi })
  }
}

async function main() {
  const [itCategory, logisticsCategory, constructionCategory] = await Promise.all([
    ensureCategory("IT Services"),
    ensureCategory("Logistics"),
    ensureCategory("Construction"),
  ])

  await ensureUser({ name: "System Admin", email: "admin@vendorcity.test", role: Role.ADMIN })
  await ensureUser({ name: "Compliance Approver", email: "approver@vendorcity.test", role: Role.APPROVER })

  const vendorSeeds = [
    {
      email: "vendor.active@vendorcity.test",
      name: "Alice Vendor",
      companyName: "Acme IT Solutions",
      category: itCategory,
      status: VendorStatus.ACTIVE,
      phone: "+1-555-0100",
      address: "100 Market St",
      // complianceScore is computed server-side from approved documents and
      // scored checklists (see recomputeVendorComplianceScore) — never seeded.
      complianceScore: null as number | null,
    },
    {
      email: "vendor.pending@vendorcity.test",
      name: "Bob Vendor",
      companyName: "Swift Logistics Co",
      category: logisticsCategory,
      status: VendorStatus.PENDING,
      phone: "+1-555-0101",
      address: "200 Harbor Ave",
      complianceScore: null as number | null,
    },
    {
      email: "vendor.suspended@vendorcity.test",
      name: "Carla Vendor",
      companyName: "BuildRight Construction",
      category: constructionCategory,
      status: VendorStatus.SUSPENDED,
      phone: "+1-555-0102",
      address: "300 Industrial Rd",
      complianceScore: null as number | null,
    },
  ]

  for (const v of vendorSeeds) {
    const user = await ensureUser({ name: v.name, email: v.email, role: Role.VENDOR })
    await prisma.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: v.companyName,
        categoryId: v.category.id,
        status: v.status,
        phone: v.phone,
        address: v.address,
        complianceScore: v.complianceScore ?? undefined,
      },
    })
  }

  const template = await ensureChecklistTemplate()
  await ensureKpiTemplates()

  console.log(
    `Seeded: 2 staff users, ${vendorSeeds.length} vendors (ACTIVE/PENDING/SUSPENDED), ` +
      `1 checklist template "${template.name}" (5 items), 4 KPI templates`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
