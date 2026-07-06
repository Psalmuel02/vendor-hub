"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { registerVendor, type RegisterState } from "./actions"

const initialState: RegisterState = undefined

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerVendor, initialState)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Register as a vendor</CardTitle>
        <CardDescription>Create an account to start onboarding</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Company contact name</FieldLabel>
              <Input id="name" name="name" autoComplete="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating account..." : "Create account"}
            </Button>
          </FieldGroup>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-foreground underline">
            Sign in
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
