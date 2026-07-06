import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { AddCategoryForm } from "./add-category-form"
import { CategoryRow } from "./category-row"

export default async function SettingsCategoriesPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const categories = await prisma.vendorCategory.findMany({ orderBy: { name: "asc" } })

  return (
    <Card>
      <CardContent className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </TableBody>
        </Table>

        <AddCategoryForm />
      </CardContent>
    </Card>
  )
}
