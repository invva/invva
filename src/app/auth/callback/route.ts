import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // OTP flow doesn't use callbacks, but keep this for compatibility
  // Just redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
