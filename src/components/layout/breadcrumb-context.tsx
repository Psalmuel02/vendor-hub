"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type BreadcrumbLabels = Record<string, string>

const BreadcrumbLabelsContext = createContext<{
  labels: BreadcrumbLabels
  setLabel: (path: string, label: string) => void
} | null>(null)

export function BreadcrumbLabelsProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<BreadcrumbLabels>({})

  const setLabel = useCallback((path: string, label: string) => {
    setLabels((prev) => (prev[path] === label ? prev : { ...prev, [path]: label }))
  }, [])

  const value = useMemo(() => ({ labels, setLabel }), [labels, setLabel])

  return (
    <BreadcrumbLabelsContext.Provider value={value}>{children}</BreadcrumbLabelsContext.Provider>
  )
}

export function useBreadcrumbLabels() {
  const ctx = useContext(BreadcrumbLabelsContext)
  if (!ctx) throw new Error("useBreadcrumbLabels must be used within BreadcrumbLabelsProvider")
  return ctx.labels
}

export function SetBreadcrumbLabel({ path, label }: { path: string; label: string }) {
  const ctx = useContext(BreadcrumbLabelsContext)
  useEffect(() => {
    ctx?.setLabel(path, label)
  }, [ctx, path, label])
  return null
}
