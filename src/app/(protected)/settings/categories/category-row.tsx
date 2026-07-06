"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { deleteCategory, type DeleteCategoryState } from "@/lib/actions/category-management"

export function CategoryRow({ category }: { category: { id: string; name: string } }) {
  const [state, formAction, isPending] = useActionState<DeleteCategoryState, FormData>(
    deleteCategory,
    undefined
  )

  return (
    <TableRow>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="text-right">
        <form action={formAction} className="inline-flex flex-col items-end gap-1">
          <input type="hidden" name="categoryId" value={category.id} />
          <Button type="submit" size="sm" variant="destructive" disabled={isPending}>
            Delete
          </Button>
          {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
        </form>
      </TableCell>
    </TableRow>
  )
}
