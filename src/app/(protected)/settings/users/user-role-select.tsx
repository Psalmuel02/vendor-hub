"use client"

import { useActionState, useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserRole, type UpdateUserRoleState } from "@/lib/actions/user-management"

const ROLES = ["ADMIN", "APPROVER", "VENDOR"] as const

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string
  role: string
  disabled?: boolean
}) {
  const [state, formAction] = useActionState<UpdateUserRoleState, FormData>(
    updateUserRole,
    undefined
  )
  const [, startTransition] = useTransition()

  function onValueChange(value: string | null) {
    if (!value) return
    const formData = new FormData()
    formData.set("userId", userId)
    formData.set("role", value)
    startTransition(() => formAction(formData))
  }

  return (
    <div>
      <Select value={role} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-36">
          <SelectValue>{(value: string) => value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {state?.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
    </div>
  )
}
