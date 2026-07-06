import Link from "next/link"

import { cn } from "@/lib/utils"

const TABS = [
  { key: "documents", label: "Documents" },
  { key: "checklist", label: "Checklist" },
  { key: "performance", label: "Performance" },
] as const

export function ProfileTabs({ activeTab }: { activeTab: string }) {
  return (
    <div className="flex gap-1 border-b">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/my-profile?tab=${tab.key}`}
          className={cn(
            "border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground",
            activeTab === tab.key && "border-foreground font-medium text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
