"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/onboarding-documents"

import { submitOnboarding, type OnboardingState } from "./actions"

type Category = { id: string; name: string }

const STEPS = ["Company Info", "Category", "Documents"] as const

export function OnboardingWizard({ categories }: { categories: Category[] }) {
  const [step, setStep] = useState(0)
  const [companyName, setCompanyName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [stepError, setStepError] = useState<string | null>(null)
  const [state, formAction, isPending] = useActionState<OnboardingState, FormData>(
    submitOnboarding,
    undefined
  )

  function goNext() {
    setStepError(null)
    if (step === 0 && !companyName.trim()) {
      setStepError("Company name is required")
      return
    }
    if (step === 1 && !categoryId) {
      setStepError("Please select a category")
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStepError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Onboarding</CardTitle>
        <CardDescription>
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </CardDescription>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </CardHeader>
      <CardContent>
        <form id="onboarding-form" action={formAction}>
          <div className={step === 0 ? "block" : "hidden"}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="companyName">Company name</FieldLabel>
                <Input
                  id="companyName"
                  name="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
                <Input id="phone" name="phone" />
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address (optional)</FieldLabel>
                <Input id="address" name="address" />
              </Field>
            </FieldGroup>
          </div>

          <div className={step === 1 ? "block" : "hidden"}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="categoryId">Vendor category</FieldLabel>
                <input type="hidden" name="categoryId" value={categoryId} />
                <Select value={categoryId} onValueChange={(value) => setCategoryId(value as string)}>
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        categories.find((c) => c.id === value)?.name ?? "Select a category"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>

          <div className={step === 2 ? "block" : "hidden"}>
            <FieldGroup>
              {REQUIRED_DOCUMENT_TYPES.map((docType) => (
                <Field key={docType.key}>
                  <FieldLabel htmlFor={docType.key}>{docType.label}</FieldLabel>
                  <Input
                    id={docType.key}
                    name={docType.key}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </Field>
              ))}
            </FieldGroup>
          </div>

          {stepError && <p className="mt-3 text-sm text-destructive">{stepError}</p>}
          {state?.error && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
        </form>

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
            Back
          </Button>
          <Button
            type="button"
            onClick={goNext}
            className={step < STEPS.length - 1 ? "inline-flex" : "hidden"}
          >
            Next
          </Button>
          <Button
            type="submit"
            form="onboarding-form"
            disabled={isPending}
            className={step === STEPS.length - 1 ? "inline-flex" : "hidden"}
          >
            {isPending ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
