import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

const PUBLIC_PATHS = ["/login", "/register"]
const VENDOR_ONLY_PREFIXES = ["/onboarding", "/my-profile"]
const STAFF_ONLY_PREFIXES = [
  "/vendors",
  "/compliance",
  "/performance",
  "/approvals",
  "/reports",
  "/settings",
  "/audit-log",
]

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isPublicPath = PUBLIC_PATHS.some((path) => nextUrl.pathname.startsWith(path))

  if (!session) {
    if (isPublicPath) return NextResponse.next()
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  const { role } = session.user
  const hitsStaffOnly = STAFF_ONLY_PREFIXES.some((prefix) => nextUrl.pathname.startsWith(prefix))
  const hitsVendorOnly = VENDOR_ONLY_PREFIXES.some((prefix) => nextUrl.pathname.startsWith(prefix))

  if (role === "VENDOR" && hitsStaffOnly) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }
  if (role !== "VENDOR" && hitsVendorOnly) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
